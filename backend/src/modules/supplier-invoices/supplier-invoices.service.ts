import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';
import { SupplierInvoiceStatus } from '../../common/enums';

import { DataSource } from 'typeorm';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { StockMovementReason } from '../../common/enums';

// shape of one incoming line item
interface ItemInput {
  extractedProductName: string;
  matchedProductId?: string;
  quantity: number;
  unitPrice?: number;
}

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @InjectRepository(SupplierInvoice)
    private readonly invoiceRepo: Repository<SupplierInvoice>,
    @InjectRepository(SupplierInvoiceItem)
    private readonly itemRepo: Repository<SupplierInvoiceItem>,
    private readonly dataSource: DataSource,
  ) {}

  // GET all invoices, with their items and warehouse loaded
  findAll(): Promise<SupplierInvoice[]> {
    return this.invoiceRepo.find({
      relations: ['items', 'warehouse'],
      order: { uploadedAt: 'DESC' },
    });
  }

  // GET one invoice by id (with items)
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

  // CREATE an invoice together with its line items
  create(data: {
    fileUrl: string;
    warehouseId: string;
    extractedSupplierName?: string;
    invoiceDateExtracted?: Date;
    extractedDeliveryDate?: Date;
    items?: ItemInput[];
  }): Promise<SupplierInvoice> {
    const invoice = this.invoiceRepo.create({
      fileUrl: data.fileUrl,
      warehouseId: data.warehouseId,
      extractedSupplierName: data.extractedSupplierName,
      invoiceDateExtracted: data.invoiceDateExtracted,
      extractedDeliveryDate: data.extractedDeliveryDate,
      // status defaults to pending_extraction from the entity
      items: data.items?.map((it) => this.itemRepo.create(it)),
    });
    // cascade: true on the entity means saving the invoice saves its items too
    return this.invoiceRepo.save(invoice);
  }

  // CONFIRM — staff accepts the extracted data. Does NOT add stock.
  async confirm(id: string, reviewedBy?: string): Promise<SupplierInvoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== SupplierInvoiceStatus.EXTRACTED &&
        invoice.status !== SupplierInvoiceStatus.PENDING_EXTRACTION) {
      throw new BadRequestException(
        `Cannot confirm an invoice with status "${invoice.status}"`,
      );
    }

    invoice.status = SupplierInvoiceStatus.CONFIRMED;
    invoice.confirmedAt = new Date();
    invoice.reviewedBy = reviewedBy;
    return this.invoiceRepo.save(invoice);
  }

  // REJECT
  async reject(id: string, reviewedBy?: string): Promise<SupplierInvoice> {
    const invoice = await this.findOne(id);
    invoice.status = SupplierInvoiceStatus.REJECTED;
    invoice.reviewedBy = reviewedBy;
    return this.invoiceRepo.save(invoice);
  }

  // DELIVER — shipment arrived. Adds each matched item to warehouse stock, atomically, and flips status to delivered.
  async deliver(id: string): Promise<SupplierInvoice> {
    const invoice = await this.findOne(id); // loads items + warehouse

    if (invoice.status !== SupplierInvoiceStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only confirmed invoices can be delivered (current: "${invoice.status}")`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of invoice.items) {
        // can only add stock for items matched to a real product
        if (!item.matchedProductId) continue;

        // find or create the stock row for this warehouse+product
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

        // log the movement
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

    // TODO: when the stock module exists, add a stock_movement row
    // (reason: 'invoice_delivered') for each item and bump warehouse_product.
    // That requires the StockService, which we build next. For now we just
    // flip the status so the flow is testable.

    invoice.status = SupplierInvoiceStatus.DELIVERED;
    invoice.deliveredAt = new Date();
    return this.invoiceRepo.save(invoice);
  }

  // DELETE
  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepo.remove(invoice); // items cascade-delete
  }
}