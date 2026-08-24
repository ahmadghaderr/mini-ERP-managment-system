import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1787562484862 implements MigrationInterface {
    name = 'AddNotifications1787562484862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying(50) NOT NULL, "message" text NOT NULL, "product_id" uuid, "warehouse_id" uuid, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "push_subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "endpoint" text NOT NULL, "p256dh_key" text NOT NULL, "auth_key" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_27ae9074fc39a09bc1aee263df5" UNIQUE ("endpoint"), CONSTRAINT "PK_07fc861c0d2c38c1b830fb9cb5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_2214f26425f028015596476d32e" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_50a831ccfdc7e4d658bc65a6256" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD CONSTRAINT "FK_ae9b58d71ea5fff546507fae207" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP CONSTRAINT "FK_ae9b58d71ea5fff546507fae207"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_50a831ccfdc7e4d658bc65a6256"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_2214f26425f028015596476d32e"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`);
        await queryRunner.query(`DROP TABLE "push_subscription"`);
        await queryRunner.query(`DROP TABLE "notification"`);
    }

}
