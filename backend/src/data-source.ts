import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

import { User } from './modules/users/entities/user.entity';
import { Warehouse } from './modules/warehouse/entities/warehouse.entity';
import { Product } from './modules/products/entities/product.entity';
import { WarehouseProduct } from './modules/stock/entities/warehouse-prouct.entity';
import { StockMovement } from './modules/stock/entities/stock-movement.entity';
import { WarehouseTransfer } from './modules/transfers/entities/warehouse-transfer.entity';
import { SupplierInvoice } from './modules/supplier-invoices/entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './modules/supplier-invoices/entities/supplier-invoice-item.entity';
import { CustomerOrder } from './modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderItem } from './modules/customer-orders/entities/customer-order-item.entity';
import { CustomerOrderItemAllocation } from './modules/customer-orders/entities/customer-order-item-allocation.entity';
import { AccessRequest } from './modules/access-requests/entities/access-request.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { PushSubscription } from './modules/notifications/entities/push-subscription.entity';
import { ChatSession } from './modules/chatbot/entities/chat-session.entity';
import { ChatMessage } from './modules/chatbot/entities/chat-message.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5433,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mini_ERP_system',
  entities: [
    User,
    Warehouse,
    Product,
    WarehouseProduct,
    StockMovement,
    WarehouseTransfer,
    SupplierInvoice,
    SupplierInvoiceItem,
    CustomerOrder,
    CustomerOrderItem,
    CustomerOrderItemAllocation,
    AccessRequest,
    Notification,
    PushSubscription,
    ChatSession,
    ChatMessage

  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});