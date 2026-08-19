import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import { randomUUID } from 'crypto';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { SupplierInvoiceStatus, StockMovementReason } from '../../common/enums';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
D
const s3 = new S3Client({ region: process.env.COGNITO_REGION! });
const textract = new TextractClient({ region: process.env.COGNITO_REGION! });
const S3_BUCKET = process.env.S3_INVOICE_BUCKET!;
const MIN_CONFIDENCE = 85;

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @InjectRepository(SupplierInvoice)
    private readonly invoiceRepo: Repository<SupplierInvoice>,
    @InjectRepository(SupplierInvoiceItem)
    private readonly itemRepo: Repository<SupplierInvoiceItem>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<SupplierInvoice[]> {
    return this.invoiceRepo.find({
      relations: ['items', 'warehouse'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SupplierInvoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['items', 'warehouse'],
    });
    if (!invoice) {
      throw new NotFoundException(`Supplier invoice ${id} not found`);
    }
    return invoice;
  }

  create(data: CreateSupplierInvoiceDto): Promise<SupplierInvoice> {
    const invoice = this.invoiceRepo.create({
      fileUrl: data.fileUrl,
      warehouseId: data.warehouseId,
      extractedSupplierName: data.extractedSupplierName,
      invoiceDateExtracted: data.invoiceDateExtracted,
      extractedDeliveryDate: data.extractedDeliveryDate,
      items: data.items?.map((it) => this.itemRepo.create(it)),
    });
    return this.invoiceRepo.save(invoice);
  }

  async uploadAndExtract(
    file: Express.Multer.File,
    warehouseId: string,
  ): Promise<{ invoice: SupplierInvoice; lowConfidenceFields: string[] }> {
    const s3Key = `invoices/${randomUUID()}-${file.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    let invoice = this.invoiceRepo.create({
      fileUrl: `s3://${S3_BUCKET}/${s3Key}`,
      warehouseId,
      status: SupplierInvoiceStatus.PENDING_EXTRACTION,
    });
    invoice = await this.invoiceRepo.save(invoice);

    const response = await textract.send(
      new AnalyzeExpenseCommand({
        Document: { S3Object: { Bucket: S3_BUCKET, Name: s3Key } },
      }),
    );
    const doc = response.ExpenseDocuments?.[0];
    if (!doc) {
      throw new BadRequestException('Textract returned no ExpenseDocuments for this file');
    }

    const lowConfidenceFields: string[] = [];
    let extractedSupplierName: string | null = null;
    let invoiceDateExtracted: string | null = null;
    let extractedDeliveryDate: string | null = null;

    for (const field of doc.SummaryFields ?? []) {
      const type = field.Type?.Text;
      const value = field.ValueDetection?.Text ?? null;
      const confidence = field.ValueDetection?.Confidence ?? 0;

      if (type && confidence < MIN_CONFIDENCE) {
        lowConfidenceFields.push(type);
      }

      switch (type) {
        case 'VENDOR_NAME':
          extractedSupplierName = value;
          break;
        case 'INVOICE_RECEIPT_DATE':
          invoiceDateExtracted = value;
          break;
        case 'DELIVERY_DATE':
          extractedDeliveryDate = value;
          break;
      }
    }

    const itemsToCreate: Partial<SupplierInvoiceItem>[] = [];
    for (const group of doc.LineItemGroups ?? []) {
      for (const lineItem of group.LineItems ?? []) {
        const fields: Record<string, string | undefined> = {};
        for (const f of lineItem.LineItemExpenseFields ?? []) {
          if (f.Type?.Text) fields[f.Type.Text] = f.ValueDetection?.Text;
        }
        if (!fields.ITEM) continue;

        const quantity = parseInt(fields.QUANTITY ?? '1', 10);
        const unitPrice = parseFloat((fields.UNIT_PRICE ?? '0').replace(/[^0-9.]/g, ''));
        const extractedAmount = parseFloat((fields.PRICE ?? '0').replace(/[^0-9.]/g, ''));

        if (Math.abs(extractedAmount - quantity * unitPrice) > 0.01) {
          lowConfidenceFields.push(`line item "${fields.ITEM}" amount mismatch`);
        }

        itemsToCreate.push({
          supplierInvoiceId: invoice.id,
          extractedProductName: fields.ITEM,
          quantity,
          unitPrice,
          matchedProductId: undefined,
        });
      }
    }

    invoice.extractedSupplierName = extractedSupplierName ?? undefined;
    invoice.invoiceDateExtracted = invoiceDateExtracted
      ? new Date(invoiceDateExtracted)
      : undefined;
    invoice.extractedDeliveryDate = extractedDeliveryDate
      ? new Date(extractedDeliveryDate)
      : undefined;
    invoice.status = SupplierInvoiceStatus.EXTRACTED;
    invoice = await this.invoiceRepo.save(invoice);

    if (itemsToCreate.length > 0) {
      const items = itemsToCreate.map((i) => this.itemRepo.create(i));
      await this.itemRepo.save(items);
    }

    return { invoice: await this.findOne(invoice.id), lowConfidenceFields };
  }

  async matchItem(
    invoiceId: string,
    itemId: string,
    matchedProductId: string,
  ): Promise<SupplierInvoiceItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, supplierInvoiceId: invoiceId },
    });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found on invoice ${invoiceId}`);
    }
    item.matchedProductId = matchedProductId;
    return this.itemRepo.save(item);
  }

  async confirm(id: string, reviewedBy?: string): Promise<SupplierInvoice> {
    const invoice = await this.findOne(id);

    if (
      invoice.status !== SupplierInvoiceStatus.EXTRACTED &&
      invoice.status !== SupplierInvoiceStatus.PENDING_EXTRACTION
    ) {
      throw new BadRequestException(
        `Cannot confirm an invoice with status "${invoice.status}"`,
      );
    }

    const unmatchedItem = invoice.items.find((item) => !item.matchedProductId);
    if (unmatchedItem) {
      throw new BadRequestException(
        `Cannot confirm — item "${unmatchedItem.extractedProductName}" has no matched product`,
      );
    }

    invoice.status = SupplierInvoiceStatus.CONFIRMED;
    invoice.confirmedAt = new Date();
    invoice.reviewedBy = reviewedBy;
    return this.invoiceRepo.save(invoice);
  }

  async reject(id: string, reviewedBy?: string): Promise<SupplierInvoice> {
    const invoice = await this.findOne(id);
    invoice.status = SupplierInvoiceStatus.REJECTED;
    invoice.reviewedBy = reviewedBy;
    return this.invoiceRepo.save(invoice);
  }

  async deliver(id: string): Promise<SupplierInvoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== SupplierInvoiceStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only confirmed invoices can be delivered (current: "${invoice.status}")`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of invoice.items) {
        if (!item.matchedProductId) continue;

        let stock = await manager.findOne(WarehouseProduct, {
          where: { warehouseId: invoice.warehouseId, productId: item.matchedProductId },
        });
        if (!stock) {
          stock = manager.create(WarehouseProduct, {
            warehouseId: invoice.warehouseId,
            productId: item.matchedProductId,
            quantityOnHand: 0,
            quantityReserved: 0,
          });
        }
        stock.quantityOnHand += item.quantity;
        await manager.save(stock);

        const movement = manager.create(StockMovement, {
          warehouseId: invoice.warehouseId,
          productId: item.matchedProductId,
          quantityChange: item.quantity,
          reason: StockMovementReason.INVOICE_DELIVERED,
          referenceId: invoice.id,
        });
        await manager.save(movement);
      }

      invoice.status = SupplierInvoiceStatus.DELIVERED;
      invoice.deliveredAt = new Date();
      return manager.save(invoice);
    });
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepo.remove(invoice);
  }
}
