import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWarehouseProduct1786627039770 implements MigrationInterface {
    name = 'AddWarehouseProduct1786627039770'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "warehouse_product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouse_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity_on_hand" integer NOT NULL DEFAULT '0', "quantity_reserved" integer NOT NULL DEFAULT '0', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_02c0dec6b08c276ba52a11267bf" UNIQUE ("warehouse_id", "product_id"), CONSTRAINT "PK_327c519be4aeb4ddabc14e595ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouse_product" ADD CONSTRAINT "FK_0807ef7b83c85174136ec70052f" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_product" ADD CONSTRAINT "FK_0087b9f97cf71de757d307015c1" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_product" DROP CONSTRAINT "FK_0087b9f97cf71de757d307015c1"`);
        await queryRunner.query(`ALTER TABLE "warehouse_product" DROP CONSTRAINT "FK_0807ef7b83c85174136ec70052f"`);
        await queryRunner.query(`DROP TABLE "warehouse_product"`);
    }

}
