"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const user_entity_1 = require("./modules/users/entities/user.entity");
const warehouse_entity_1 = require("./modules/warehouse/entities/warehouse.entity");
const product_entity_1 = require("./modules/products/entities/product.entity");
const warehouse_prouct_entity_1 = require("./modules/stock/entities/warehouse-prouct.entity");
const stock_movement_entity_1 = require("./modules/stock/entities/stock-movement.entity");
const warehouse_transfer_entity_1 = require("./modules/transfers/entities/warehouse-transfer.entity");
const supplier_invoice_entity_1 = require("./modules/supplier-invoices/entities/supplier-invoice.entity");
const supplier_invoice_item_entity_1 = require("./modules/supplier-invoices/entities/supplier-invoice-item.entity");
const customer_order_entity_1 = require("./modules/customer-orders/entities/customer-order.entity");
const customer_order_item_entity_1 = require("./modules/customer-orders/entities/customer-order-item.entity");
const access_request_entity_1 = require("./modules/access-requests/entities/access-request.entity");
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5433,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'mini_ERP_system',
    entities: [
        user_entity_1.User,
        warehouse_entity_1.Warehouse,
        product_entity_1.Product,
        warehouse_prouct_entity_1.WarehouseProduct,
        stock_movement_entity_1.StockMovement,
        warehouse_transfer_entity_1.WarehouseTransfer,
        supplier_invoice_entity_1.SupplierInvoice,
        supplier_invoice_item_entity_1.SupplierInvoiceItem,
        customer_order_entity_1.CustomerOrder,
        customer_order_item_entity_1.CustomerOrderItem,
        access_request_entity_1.AccessRequest,
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});
//# sourceMappingURL=data-source.js.map