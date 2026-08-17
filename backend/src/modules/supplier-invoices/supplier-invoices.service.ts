import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { SupplierInvoiceStatus, StockMovementReason } from '../../common/enums';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';

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

  async matchItem(
    invoiceId: string,
    itemId: string,
    matchedProductId: string,
  ): Promise<SupplierInvoiceItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, supplierInvoiceId: invoiceId },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${itemId} not found on invoice ${invoiceId}`,
      );
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
          where: {
            warehouseId: invoice.warehouseId,
            productId: item.matchedProductId,
          },
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
