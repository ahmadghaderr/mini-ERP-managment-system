"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const users_module_1 = require("./modules/users/users.module");
const warehouses_module_1 = require("./modules/warehouse/warehouses.module");
const products_module_1 = require("./modules/products/products.module");
const stock_module_1 = require("./modules/stock/stock.module");
const transfers_module_1 = require("./modules/transfers/transfers.module");
const supplier_invoices_module_1 = require("./modules/supplier-invoices/supplier-invoices.module");
const customer_orders_module_1 = require("./modules/customer-orders/customer-orders.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const host = configService.get('DB_HOST') || '127.0.0.1';
                    const port = Number(configService.get('DB_PORT')) || 5433;
                    const username = configService.get('DB_USERNAME') || 'postgres';
                    const password = configService.get('DB_PASSWORD') || 'postgres';
                    const database = configService.get('DB_NAME') || 'mini_ERP_system';
                    return {
                        type: 'postgres',
                        host,
                        port,
                        username,
                        password,
                        database,
                        autoLoadEntities: true,
                        synchronize: false,
                        migrations: [__dirname + '/migrations/*{.ts,.js}'],
                    };
                },
            }),
            users_module_1.UsersModule,
            warehouses_module_1.WarehousesModule,
            products_module_1.ProductsModule,
            stock_module_1.StockModule,
            transfers_module_1.TransfersModule,
            supplier_invoices_module_1.SupplierInvoicesModule,
            customer_orders_module_1.CustomerOrdersModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map