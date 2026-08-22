import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCustomerOrderWarehouseOptional1787296205301 implements MigrationInterface {
    name = 'MakeCustomerOrderWarehouseOptional1787296205301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_order" DROP CONSTRAINT "FK_950bef699fc43dc3ae30c225df8"`);
        await queryRunner.query(`ALTER TABLE "customer_order" ALTER COLUMN "warehouse_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customer_order" ADD CONSTRAINT "FK_950bef699fc43dc3ae30c225df8" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_order" DROP CONSTRAINT "FK_950bef699fc43dc3ae30c225df8"`);
        await queryRunner.query(`ALTER TABLE "customer_order" ALTER COLUMN "warehouse_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customer_order" ADD CONSTRAINT "FK_950bef699fc43dc3ae30c225df8" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
