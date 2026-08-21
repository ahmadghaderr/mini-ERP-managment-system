import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import { randomUUID } from 'crypto';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { User } from '../users/entities/user.entity';
import { SupplierInvoiceStatus, StockMovementReason } from '../../common/enums';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';

const MIN_CONFIDENCE = 85;
const PRESIGNED_URL_TTL_SECONDS = 3600;

@Injectable()
export class SupplierInvoicesService {
  private readonly s3: S3Client;
  private readonly textract: TextractClient;
  private readonly S3_BUCKET: string;

  constructor(
    @InjectRepository(SupplierInvoice)
    private readonly invoiceRepo: Repository<SupplierInvoice>,
    @InjectRepository(SupplierInvoiceItem)
    private readonly itemRepo: Repository<SupplierInvoiceItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    const region = this.configService.getOrThrow<string>('COGNITO_REGION');
    this.S3_BUCKET = this.configService.getOrThrow<string>('S3_INVOICE_BUCKET');
    this.s3 = new S3Client({ region });
    this.textract = new TextractClient({ region });
  }

  private async toPresignedUrl(s3Uri: string): Promise<string> {
    const match = s3Uri.match(/^s3:\/\/([^/]+)\/(.+)$/);
    if (!match) return s3Uri;
    const [, bucket, key] = match;
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: PRESIGNED_URL_TTL_SECONDS },
    );
  }

  private async withPresignedUrl(
    invoice: SupplierInvoice,
  ): Promise<SupplierInvoice> {
    if (invoice.fileUrl?.startsWith('s3://')) {
      invoice.fileUrl = await this.toPresignedUrl(invoice.fileUrl);
    }
    return invoice;
  }

  private async resolveReviewerId(
    cognitoSub?: string,
  ): Promise<string | undefined> {
    if (!cognitoSub) return undefined;
    const user = await this.userRepo.findOne({ where: { cognitoSub } });
    if (!user) {
      throw new BadRequestException('No user found for reviewer identity');
    }
    return user.id;
  }

  async findAll(): Promise<SupplierInvoice[]> {
    const invoices = await this.invoiceRepo.find({
      relations: ['items', 'warehouse'],
      order: { uploadedAt: 'DESC' },
    });
    return Promise.all(invoices.map((inv) => this.withPresignedUrl(inv)));
  }

  async findOne(id: string): Promise<SupplierInvoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['items', 'warehouse'],
    });
    if (!invoice) {
      throw new NotFoundException(`Supplier invoice ${id} not found`);
    }
    return this.withPresignedUrl(invoice);
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
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    let invoice = this.invoiceRepo.create({
      fileUrl: `s3://${this.S3_BUCKET}/${s3Key}`,
      warehouseId,
      status: SupplierInvoiceStatus.PENDING_EXTRACTION,
    });
    invoice = await this.invoiceRepo.save(invoice);

    try {
      const response = await this.textract.send(
        new AnalyzeExpenseCommand({
          Document: { S3Object: { Bucket: this.S3_BUCKET, Name: s3Key } },
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
    } catch (err) {
      await this.invoiceRepo.remove(invoice).catch(() => undefined);
      await this.s3
        .send(new DeleteObjectCommand({ Bucket: this.S3_BUCKET, Key: s3Key }))
        .catch(() => undefined);
      throw err;
    }
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

  async confirm(id: string, reviewerCognitoSub?: string): Promise<SupplierInvoice> {
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
    invoice.reviewedBy = await this.resolveReviewerId(reviewerCognitoSub);
    return this.invoiceRepo.save(invoice);
  }

  async reject(id: string, reviewerCognitoSub?: string): Promise<SupplierInvoice> {
    const invoice = await this.findOne(id);
    invoice.status = SupplierInvoiceStatus.REJECTED;
    invoice.reviewedBy = await this.resolveReviewerId(reviewerCognitoSub);
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
          lock: { mode: 'pessimistic_write' },
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