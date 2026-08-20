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
import {
  TextractClient,
  AnalyzeDocumentCommand,
  Block,
} from '@aws-sdk/client-textract';
import { randomUUID } from 'crypto';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
import { CustomerOrderItemAllocation } from './entities/customer-order-item-allocation.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { CustomerOrderStatus, StockMovementReason } from '../../common/enums';

const PRESIGNED_URL_TTL_SECONDS = 900;

@Injectable()
export class CustomerOrdersService {
  private readonly s3: S3Client;
  private readonly textract: TextractClient;
  private readonly S3_BUCKET: string;

  constructor(
    @InjectRepository(CustomerOrder)
    private readonly orderRepo: Repository<CustomerOrder>,
    @InjectRepository(CustomerOrderItem)
    private readonly itemRepo: Repository<CustomerOrderItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
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

  private async withPresignedUrl(order: CustomerOrder): Promise<CustomerOrder> {
    if (order.fileUrl?.startsWith('s3://')) {
      order.fileUrl = await this.toPresignedUrl(order.fileUrl);
    }
    return order;
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

  async findAll(): Promise<CustomerOrder[]> {
    const orders = await this.orderRepo.find({
      relations: ['items', 'warehouse'],
      order: { uploadedAt: 'DESC' },
    });
    return Promise.all(orders.map((o) => this.withPresignedUrl(o)));
  }

  async findOne(id: string): Promise<CustomerOrder> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'warehouse'],
    });
    if (!order) throw new NotFoundException(`Customer order ${id} not found`);
    return this.withPresignedUrl(order);
  }

  async uploadAndExtract(
    file: Express.Multer.File,
    warehouseId: string,
  ): Promise<{ order: CustomerOrder; lowConfidenceFields: string[] }> {
    const s3Key = `orders/${randomUUID()}-${file.originalname}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    let order = this.orderRepo.create({
      fileUrl: `s3://${this.S3_BUCKET}/${s3Key}`,
      warehouseId,
      status: CustomerOrderStatus.PENDING,
    });
    order = await this.orderRepo.save(order);

    try {
      const response = await this.textract.send(
        new AnalyzeDocumentCommand({
          Document: { S3Object: { Bucket: this.S3_BUCKET, Name: s3Key } },
          FeatureTypes: ['TABLES'],
        }),
      );

      const blocks = response.Blocks ?? [];
      const blockById = new Map<string, Block>();
      blocks.forEach((b) => {
        if (b.Id) blockById.set(b.Id, b);
      });

      const getText = (block: Block): string => {
        if (!block.Relationships) return '';
        const childIds = block.Relationships.filter((r) => r.Type === 'CHILD')
          .flatMap((r) => r.Ids ?? []);
        return childIds
          .map((id) => blockById.get(id))
          .filter((b): b is Block => !!b && b.BlockType === 'WORD')
          .map((b) => b.Text ?? '')
          .join(' ')
          .trim();
      };

      const tableBlocks = blocks.filter((b) => b.BlockType === 'TABLE');
      const lowConfidenceFields: string[] = [];
      const itemsToCreate: Partial<CustomerOrderItem>[] = [];

      for (const table of tableBlocks) {
        const cellIds = (table.Relationships ?? [])
          .filter((r) => r.Type === 'CHILD')
          .flatMap((r) => r.Ids ?? []);
        const cells = cellIds
          .map((id) => blockById.get(id))
          .filter((b): b is Block => !!b && b.BlockType === 'CELL');

        const rows = new Map<number, Block[]>();
        cells.forEach((cell) => {
          const rowIndex = cell.RowIndex ?? 0;
          if (!rows.has(rowIndex)) rows.set(rowIndex, []);
          rows.get(rowIndex)!.push(cell);
        });

        const sortedRowIndices = Array.from(rows.keys()).sort((a, b) => a - b);
        if (sortedRowIndices.length < 2) continue;

        const headerRow = rows.get(sortedRowIndices[0])!;
        const headerTexts = headerRow
          .sort((a, b) => (a.ColumnIndex ?? 0) - (b.ColumnIndex ?? 0))
          .map((c) => getText(c).toLowerCase());

        const productColIdx = headerTexts.findIndex((t) =>
          t.includes('product') || t.includes('item') || t.includes('name'),
        );
        const qtyColIdx = headerTexts.findIndex((t) => t.includes('quant') || t.includes('qty'));

        if (productColIdx === -1 || qtyColIdx === -1) continue;

        for (let i = 1; i < sortedRowIndices.length; i++) {
          const row = rows.get(sortedRowIndices[i])!.sort(
            (a, b) => (a.ColumnIndex ?? 0) - (b.ColumnIndex ?? 0),
          );

          const productCell = row.find((c) => (c.ColumnIndex ?? 0) - 1 === productColIdx);
          const qtyCell = row.find((c) => (c.ColumnIndex ?? 0) - 1 === qtyColIdx);

          const productName = productCell ? getText(productCell) : '';
          const qtyText = qtyCell ? getText(qtyCell) : '';
          const quantity = parseInt(qtyText, 10);

          if (!productName || !Number.isFinite(quantity) || quantity <= 0) {
            continue;
          }

          itemsToCreate.push({
            customerOrderId: order.id,
            extractedProductName: productName,
            quantity,
            matchedProductId: undefined,
            unitPrice: undefined,
          });
        }
      }

      if (itemsToCreate.length === 0) {
        lowConfidenceFields.push('No product/quantity table detected in this document');
      }

      let extractedCustomerName: string | undefined;
      const lines = blocks.filter((b) => b.BlockType === 'LINE');
      const customerLine = lines.find((l) =>
        (l.Text ?? '').toLowerCase().includes('customer'),
      );
      if (customerLine?.Text) {
        extractedCustomerName = customerLine.Text.replace(/customer:?/i, '').trim() || undefined;
      }

      order.extractedCustomerName = extractedCustomerName;
      order = await this.orderRepo.save(order);

      if (itemsToCreate.length > 0) {
        const items = itemsToCreate.map((i) => this.itemRepo.create(i));
        await this.itemRepo.save(items);
      }

      return { order: await this.findOne(order.id), lowConfidenceFields };
    } catch (err) {
      await this.orderRepo.remove(order).catch(() => undefined);
      await this.s3
        .send(new DeleteObjectCommand({ Bucket: this.S3_BUCKET, Key: s3Key }))
        .catch(() => undefined);
      throw err;
    }
  }

  async matchItem(
    orderId: string,
    itemId: string,
    matchedProductId: string,
  ): Promise<CustomerOrderItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, customerOrderId: orderId },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${itemId} not found on order ${orderId}`,
      );
    }

    const product = await this.productRepo.findOne({
      where: { id: matchedProductId },
    });
    if (!product) {
      throw new BadRequestException(`Product ${matchedProductId} not found`);
    }

    item.matchedProductId = matchedProductId;
    item.unitPrice = product.price;
    return this.itemRepo.save(item);
  }

  async confirm(id: string, reviewerCognitoSub?: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    if (order.status !== CustomerOrderStatus.PENDING) {
      throw new BadRequestException(
        `Only pending orders can be confirmed (current: "${order.status}")`,
      );
    }

    const unmatchedItem = order.items.find((item) => !item.matchedProductId);
    if (unmatchedItem) {
      throw new BadRequestException(
        `Cannot confirm — item "${unmatchedItem.extractedProductName}" has no matched product`,
      );
    }

    const reviewerId = await this.resolveReviewerId(reviewerCognitoSub);

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        if (!item.matchedProductId) continue;

        let remaining = item.quantity;

        const stockRows = await manager
          .createQueryBuilder(WarehouseProduct, 'wp')
          .innerJoinAndSelect('wp.warehouse', 'warehouse')
          .where('wp.productId = :productId', { productId: item.matchedProductId })
          .orderBy('warehouse.createdAt', 'ASC')
          .setLock('pessimistic_write')
          .getMany();

        for (const stock of stockRows) {
          if (remaining <= 0) break;

          const available = stock.quantityOnHand - stock.quantityReserved;
          if (available <= 0) continue;

          const take = Math.min(available, remaining);
          stock.quantityReserved += take;
          await manager.save(stock);

          const allocation = manager.create(CustomerOrderItemAllocation, {
            customerOrderItemId: item.id,
            warehouseId: stock.warehouseId,
            quantity: take,
          });
          await manager.save(allocation);

          remaining -= take;
        }

        if (remaining > 0) {
          throw new BadRequestException(
            `Not enough available stock across all warehouses for "${item.extractedProductName}" (short by ${remaining})`,
          );
        }
      }

      order.status = CustomerOrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      order.reviewedBy = reviewerId;
      return manager.save(order);
    });
  }

  async deliver(id: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    if (order.status !== CustomerOrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only confirmed orders can be delivered (current: "${order.status}")`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        const allocations = await manager.find(CustomerOrderItemAllocation, {
          where: { customerOrderItemId: item.id },
        });

        for (const allocation of allocations) {
          const stock = await manager.findOne(WarehouseProduct, {
            where: {
              warehouseId: allocation.warehouseId,
              productId: item.matchedProductId,
            },
            lock: { mode: 'pessimistic_write' },
          });
          if (!stock) {
            throw new BadRequestException(
              `Stock record missing for "${item.extractedProductName}" in warehouse ${allocation.warehouseId} — cannot deliver`,
            );
          }

          stock.quantityOnHand -= allocation.quantity;
          stock.quantityReserved -= allocation.quantity;
          await manager.save(stock);

          const movement = manager.create(StockMovement, {
            warehouseId: allocation.warehouseId,
            productId: item.matchedProductId,
            quantityChange: -allocation.quantity,
            reason: StockMovementReason.ORDER_DELIVERED,
            referenceId: order.id,
          });
          await manager.save(movement);
        }
      }

      order.status = CustomerOrderStatus.DELIVERED;
      order.deliveredAt = new Date();
      return manager.save(order);
    });
  }

  async reject(id: string, reviewerCognitoSub?: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);

    if (
      order.status !== CustomerOrderStatus.PENDING &&
      order.status !== CustomerOrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot reject an order with status "${order.status}"`,
      );
    }

    const reviewerId = await this.resolveReviewerId(reviewerCognitoSub);

    return this.dataSource.transaction(async (manager) => {
      if (order.status === CustomerOrderStatus.CONFIRMED) {
        for (const item of order.items) {
          const allocations = await manager.find(CustomerOrderItemAllocation, {
            where: { customerOrderItemId: item.id },
          });

          for (const allocation of allocations) {
            const stock = await manager.findOne(WarehouseProduct, {
              where: {
                warehouseId: allocation.warehouseId,
                productId: item.matchedProductId,
              },
              lock: { mode: 'pessimistic_write' },
            });
            if (stock) {
              stock.quantityReserved -= allocation.quantity;
              await manager.save(stock);
            }
          }

          await manager.delete(CustomerOrderItemAllocation, {
            customerOrderItemId: item.id,
          });
        }
      }

      order.status = CustomerOrderStatus.REJECTED;
      order.rejectedAt = new Date();
      order.reviewedBy = reviewerId;
      return manager.save(order);
    });
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepo.remove(order);
  }
}