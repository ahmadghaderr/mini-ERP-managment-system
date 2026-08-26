import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  TextractClient,
  AnalyzeExpenseCommand,
  AnalyzeDocumentCommand,
  Block,
} from "@aws-sdk/client-textract";
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { randomUUID } from "crypto";
import { SupplierInvoice } from "./entities/supplier-invoice.entity";
import { SupplierInvoiceItem } from "./entities/supplier-invoice-item.entity";
import { WarehouseProduct } from "../stock/entities/warehouse-prouct.entity";
import { StockMovement } from "../stock/entities/stock-movement.entity";
import { User } from "../users/entities/user.entity";
import { SupplierInvoiceStatus, StockMovementReason } from "../../common/enums";
import { CreateSupplierInvoiceDto } from "./dto/create-supplier-invoice.dto";

const MIN_CONFIDENCE = 85;
const PRESIGNED_URL_TTL_SECONDS = 3600;

export interface CalendarEventResult {
  success: boolean;
  message: string;
}

@Injectable()
export class SupplierInvoicesService {
  private readonly s3: S3Client;
  private readonly textract: TextractClient;
  private readonly agentCore: BedrockAgentCoreClient;
  private readonly S3_BUCKET: string;
  private readonly eventAgentRuntimeArn: string;
  private readonly logger = new Logger(SupplierInvoicesService.name);

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
    const region = this.configService.getOrThrow<string>("COGNITO_REGION");
    this.S3_BUCKET = this.configService.getOrThrow<string>("S3_INVOICE_BUCKET");
    this.eventAgentRuntimeArn = this.configService.getOrThrow<string>(
      "EVENT_AGENT_RUNTIME_ARN",
    );
    this.s3 = new S3Client({ region });
    this.textract = new TextractClient({ region });
    this.agentCore = new BedrockAgentCoreClient({ region });
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
    if (invoice.fileUrl?.startsWith("s3://")) {
      invoice.fileUrl = await this.toPresignedUrl(invoice.fileUrl);
    }
    return invoice;
  }

  private async getRawInvoice(id: string): Promise<SupplierInvoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ["items", "warehouse"],
    });
    if (!invoice) {
      throw new NotFoundException(`Supplier invoice ${id} not found`);
    }
    return invoice;
  }

  private async resolveReviewerId(
    cognitoSub?: string,
  ): Promise<string | undefined> {
    if (!cognitoSub) return undefined;
    const user = await this.userRepo.findOne({ where: { cognitoSub } });
    if (!user) {
      throw new BadRequestException("No user found for reviewer identity");
    }
    return user.id;
  }

  private buildEventAgentPrompt(invoice: SupplierInvoice): string {
    const itemsList = invoice.items
      .map(
        (it) =>
          `- ${it.extractedProductName}: qty ${it.quantity}${
            it.unitPrice != null ? ` @ $${Number(it.unitPrice).toFixed(2)}` : ""
          }`,
      )
      .join("\n");

    const deliveryDate = invoice.extractedDeliveryDate
      ? new Date(invoice.extractedDeliveryDate).toISOString().split("T")[0]
      : "unknown";

    return [
      `Create a Google Calendar event for an upcoming supplier delivery.`,
      `Supplier: ${invoice.extractedSupplierName ?? "Unknown supplier"}`,
      `Delivery date: ${deliveryDate}`,
      `Warehouse: ${invoice.warehouse?.warehouseName ?? "Unknown warehouse"}`,
      `Items ordered:`,
      itemsList || "(no items)",
      ``,
      `Please title the event "Delivery from ${invoice.extractedSupplierName ?? "supplier"}" and schedule it on ${deliveryDate}.`,
    ].join("\n");
  }

  private parseAgentStreamResponse(raw: string): string {
    const lines = raw.split("\n").filter((l) => l.trim().startsWith("data:"));
    let text = "";
    for (const line of lines) {
      const jsonStr = line.replace(/^data:\s*/, "").trim();
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed?.event?.contentBlockDelta?.delta?.text;
        if (typeof delta === "string") {
          text += delta;
        }
      } catch {
        // skip malformed/partial chunks
      }
    }
    return text.trim();
  }

  private async invokeEventAgent(
    invoice: SupplierInvoice,
  ): Promise<CalendarEventResult> {
    try {
      const prompt = this.buildEventAgentPrompt(invoice);
      const payload = JSON.stringify({ prompt });

      const command = new InvokeAgentRuntimeCommand({
        agentRuntimeArn: this.eventAgentRuntimeArn,
        runtimeSessionId: randomUUID() + randomUUID(),
        contentType: "application/json",
        accept: "application/json",
        payload: new TextEncoder().encode(payload),
      });

      const response = await this.agentCore.send(command);

      let rawText = "";
      if (response.response) {
        const responseBytes = await response.response.transformToByteArray();
        rawText = new TextDecoder().decode(responseBytes);
      }

      const parsedText = this.parseAgentStreamResponse(rawText);
      const responseText = parsedText || "Calendar event created.";

      this.logger.log(
        `EventAgent responded for invoice ${invoice.id}: ${responseText}`,
      );
      return { success: true, message: responseText };
    } catch (err) {
      this.logger.error(
        `EventAgent invocation failed for invoice ${invoice.id}`,
        err,
      );
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Calendar event creation failed.",
      };
    }
  }

  private async extractLineItemsFromTables(
    bucket: string,
    key: string,
  ): Promise<{ productName: string; quantity: number; unitPrice: number }[]> {
    const response = await this.textract.send(
      new AnalyzeDocumentCommand({
        Document: { S3Object: { Bucket: bucket, Name: key } },
        FeatureTypes: ["TABLES"],
      }),
    );

    const blocks = response.Blocks ?? [];
    const blockById = new Map<string, Block>();
    blocks.forEach((b) => {
      if (b.Id) blockById.set(b.Id, b);
    });

    const getText = (block: Block): string => {
      if (!block.Relationships) return "";
      const childIds = block.Relationships.filter(
        (r) => r.Type === "CHILD",
      ).flatMap((r) => r.Ids ?? []);
      return childIds
        .map((id) => blockById.get(id))
        .filter((b): b is Block => !!b && b.BlockType === "WORD")
        .map((b) => b.Text ?? "")
        .join(" ")
        .trim();
    };

    const results: {
      productName: string;
      quantity: number;
      unitPrice: number;
    }[] = [];
    const tableBlocks = blocks.filter((b) => b.BlockType === "TABLE");

    for (const table of tableBlocks) {
      const cellIds = (table.Relationships ?? [])
        .filter((r) => r.Type === "CHILD")
        .flatMap((r) => r.Ids ?? []);
      const cells = cellIds
        .map((id) => blockById.get(id))
        .filter((b): b is Block => !!b && b.BlockType === "CELL");

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

      const productColIdx = headerTexts.findIndex(
        (t) =>
          t.includes("product") || t.includes("item") || t.includes("name"),
      );
      const qtyColIdx = headerTexts.findIndex(
        (t) => t.includes("quant") || t.includes("qty"),
      );
      const priceColIdx = headerTexts.findIndex(
        (t) =>
          t.includes("price") || t.includes("amount") || t.includes("cost"),
      );

      if (productColIdx === -1 || qtyColIdx === -1) continue;

      for (let i = 1; i < sortedRowIndices.length; i++) {
        const row = rows
          .get(sortedRowIndices[i])!
          .sort((a, b) => (a.ColumnIndex ?? 0) - (b.ColumnIndex ?? 0));

        const productCell = row.find(
          (c) => (c.ColumnIndex ?? 0) - 1 === productColIdx,
        );
        const qtyCell = row.find((c) => (c.ColumnIndex ?? 0) - 1 === qtyColIdx);
        const priceCell =
          priceColIdx !== -1
            ? row.find((c) => (c.ColumnIndex ?? 0) - 1 === priceColIdx)
            : undefined;

        const productName = productCell ? getText(productCell) : "";
        const qtyText = qtyCell ? getText(qtyCell) : "";
        const priceText = priceCell ? getText(priceCell) : "0";

        const quantity = parseInt(qtyText, 10);
        const unitPrice = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

        if (!productName || !Number.isFinite(quantity) || quantity <= 0)
          continue;

        results.push({ productName, quantity, unitPrice });
      }
    }

    return results;
  }

  async findAll(): Promise<SupplierInvoice[]> {
    const invoices = await this.invoiceRepo.find({
      relations: ["items", "warehouse"],
      order: { uploadedAt: "DESC" },
    });
    return Promise.all(invoices.map((inv) => this.withPresignedUrl(inv)));
  }

  async findOne(id: string): Promise<SupplierInvoice> {
    const invoice = await this.getRawInvoice(id);
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
        throw new BadRequestException(
          "Textract returned no ExpenseDocuments for this file",
        );
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
          case "VENDOR_NAME":
            extractedSupplierName = value;
            break;
          case "INVOICE_RECEIPT_DATE":
            invoiceDateExtracted = value;
            break;
          case "DELIVERY_DATE":
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

          const quantity = parseInt(fields.QUANTITY ?? "1", 10);
          const unitPrice = parseFloat(
            (fields.UNIT_PRICE ?? "0").replace(/[^0-9.]/g, ""),
          );
          const extractedAmount = parseFloat(
            (fields.PRICE ?? "0").replace(/[^0-9.]/g, ""),
          );

          if (Math.abs(extractedAmount - quantity * unitPrice) > 0.01) {
            lowConfidenceFields.push(
              `line item "${fields.ITEM}" amount mismatch`,
            );
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

      if (itemsToCreate.length === 0) {
        const tableItems = await this.extractLineItemsFromTables(
          this.S3_BUCKET,
          s3Key,
        );
        for (const item of tableItems) {
          itemsToCreate.push({
            supplierInvoiceId: invoice.id,
            extractedProductName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            matchedProductId: undefined,
          });
        }
        if (tableItems.length === 0) {
          lowConfidenceFields.push(
            "No line items detected by either extraction method",
          );
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
      throw new NotFoundException(
        `Item ${itemId} not found on invoice ${invoiceId}`,
      );
    }
    item.matchedProductId = matchedProductId;
    return this.itemRepo.save(item);
  }

  async updateItemPrice(
    invoiceId: string,
    itemId: string,
    unitPrice: number,
  ): Promise<SupplierInvoiceItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, supplierInvoiceId: invoiceId },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${itemId} not found on invoice ${invoiceId}`,
      );
    }
    item.unitPrice = unitPrice;
    return this.itemRepo.save(item);
  }

  async confirm(
    id: string,
    reviewerCognitoSub?: string,
  ): Promise<{ invoice: SupplierInvoice; calendarEvent: CalendarEventResult }> {
    const invoice = await this.getRawInvoice(id);

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
    const saved = await this.invoiceRepo.save(invoice);

    const calendarEvent = await this.invokeEventAgent(saved);
    const withUrl = await this.withPresignedUrl(saved);

    return { invoice: withUrl, calendarEvent };
  }

  async reject(
    id: string,
    reviewerCognitoSub?: string,
  ): Promise<SupplierInvoice> {
    const invoice = await this.getRawInvoice(id);
    invoice.status = SupplierInvoiceStatus.REJECTED;
    invoice.reviewedBy = await this.resolveReviewerId(reviewerCognitoSub);
    const saved = await this.invoiceRepo.save(invoice);
    return this.withPresignedUrl(saved);
  }

  async deliver(id: string): Promise<SupplierInvoice> {
    const invoice = await this.getRawInvoice(id);

    if (invoice.status !== SupplierInvoiceStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only confirmed invoices can be delivered (current: "${invoice.status}")`,
      );
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      for (const item of invoice.items) {
        if (!item.matchedProductId) continue;

        let stock = await manager.findOne(WarehouseProduct, {
          where: {
            warehouseId: invoice.warehouseId,
            productId: item.matchedProductId,
          },
          lock: { mode: "pessimistic_write" },
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

    return this.withPresignedUrl(saved);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.getRawInvoice(id);
    await this.invoiceRepo.remove(invoice);
  }
}