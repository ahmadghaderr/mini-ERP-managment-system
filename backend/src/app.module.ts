import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './modules/users/users.module';
import { WarehousesModule } from './modules/warehouse/warehouses.module';
import { ProductsModule } from './modules/products/products.module';
import { StockModule } from './modules/stock/stock.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { SupplierInvoicesModule } from './modules/supplier-invoices/supplier-invoices.module';
import { CustomerOrdersModule } from './modules/customer-orders/customer-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST') || '127.0.0.1';
        const port = Number(configService.get('DB_PORT')) || 5433;
        const username = configService.get<string>('DB_USERNAME') || 'postgres';
        const password = configService.get<string>('DB_PASSWORD') || 'postgres';
        const database =
          configService.get<string>('DB_NAME') || 'mini_ERP_system';
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

    UsersModule,
    WarehousesModule,
    ProductsModule,
    StockModule,
    TransfersModule,
    SupplierInvoicesModule,
    CustomerOrdersModule,
  ],
})
export class AppModule {}
