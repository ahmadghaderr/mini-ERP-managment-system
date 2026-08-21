import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerOrderItemAllocations1787293932929 implements MigrationInterface {
    name = 'AddCustomerOrderItemAllocations1787293932929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customer_order_item_allocations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_order_item_id" uuid NOT NULL, "warehouse_id" uuid NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "PK_dd909e2c52511b1d29aa45db76c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "customer_order_item_allocations" ADD CONSTRAINT "FK_ffeb50915dcdd50107a78aa4f57" FOREIGN KEY ("customer_order_item_id") REFERENCES "customer_order_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_order_item_allocations" ADD CONSTRAINT "FK_926fb80d397be21bed0478b5ebc" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_order_item_allocations" DROP CONSTRAINT "FK_926fb80d397be21bed0478b5ebc"`);
        await queryRunner.query(`ALTER TABLE "customer_order_item_allocations" DROP CONSTRAINT "FK_ffeb50915dcdd50107a78aa4f57"`);
        await queryRunner.query(`DROP TABLE "customer_order_item_allocations"`);
    }

}
