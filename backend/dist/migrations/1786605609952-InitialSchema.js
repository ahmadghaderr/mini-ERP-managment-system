"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1786605609952 = void 0;
class InitialSchema1786605609952 {
    name = 'InitialSchema1786605609952';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'staff')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_name" character varying(150) NOT NULL, "user_email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'staff', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_643a0bfb9391001cf11e581bdd6" UNIQUE ("user_email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "warehouses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouse_name" character varying(150) NOT NULL, "warehouse_location" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_56ae21ee2432b2270b48867e4be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."products_category_enum" AS ENUM('water', 'food', 'healthcare', 'electronics')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_name" character varying(255) NOT NULL, "category" "public"."products_category_enum" NOT NULL, "price" numeric(12,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."stock_movement_reason_enum" AS ENUM('invoice_delivered', 'order_delivered', 'transfer_out', 'transfer_in', 'adjustment')`);
        await queryRunner.query(`CREATE TABLE "stock_movement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouse_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity_change" integer NOT NULL, "reason" "public"."stock_movement_reason_enum" NOT NULL, "reference_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "PK_9fe1232f916686ae8cf00294749" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "warehouse_transfer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "from_warehouse_id" uuid NOT NULL, "to_warehouse_id" uuid NOT NULL, "quantity" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "PK_941ddf7509ae1af0786a29efa98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "supplier_invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "supplier_invoice_id" uuid NOT NULL, "extracted_product_name" character varying(255) NOT NULL, "matched_product_id" uuid, "quantity" integer NOT NULL, "unit_price" numeric(12,2), CONSTRAINT "PK_fcc1294c12b69b3ab3c0a33d12c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."supplier_invoice_status_enum" AS ENUM('pending_extraction', 'extracted', 'confirmed', 'delivered', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "supplier_invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_url" text NOT NULL, "extracted_supplier_name" character varying(200), "invoice_date_extracted" date, "extracted_delivery_date" date, "warehouse_id" uuid NOT NULL, "status" "public"."supplier_invoice_status_enum" NOT NULL DEFAULT 'pending_extraction', "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "confirmed_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "reviewed_by" uuid, CONSTRAINT "PK_7f48116a8ee69cefa62cf50d2f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customer_order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_order_id" uuid NOT NULL, "extracted_product_name" character varying(255) NOT NULL, "matched_product_id" uuid, "quantity" integer NOT NULL, "unit_price" numeric(12,2), CONSTRAINT "PK_109f14f4feec8f45a57e39c4660" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."customer_order_status_enum" AS ENUM('pending', 'confirmed', 'delivered', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "customer_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_url" text NOT NULL, "extracted_customer_name" character varying(200), "warehouse_id" uuid NOT NULL, "status" "public"."customer_order_status_enum" NOT NULL DEFAULT 'pending', "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "confirmed_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "rejected_at" TIMESTAMP WITH TIME ZONE, "reviewed_by" uuid, CONSTRAINT "PK_c70aef746523b2c4a0af0945209" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_84dea70c36df8700e616018f256" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_c1bf5ff45511ecaad0b28440e30" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_5a799806278a60e9c7839a58d93" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" ADD CONSTRAINT "FK_7e5ea9c1a0bbdac6beae9c75b82" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" ADD CONSTRAINT "FK_65e0fc80710f2d0678df28edb1e" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" ADD CONSTRAINT "FK_0c70b6806d629e0876808c402b5" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" ADD CONSTRAINT "FK_e33e764ddb6b93d7279e77aa06d" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "FK_3adb1eb6f95c6064f661c42ff3d" FOREIGN KEY ("supplier_invoice_id") REFERENCES "supplier_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "FK_e69095b837b170d7e87e4461d6f" FOREIGN KEY ("matched_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice" ADD CONSTRAINT "FK_1f5d1b2f2703d3f7532139b7424" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice" ADD CONSTRAINT "FK_94b0a9f4a3da8f7d4bcad46da73" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_order_items" ADD CONSTRAINT "FK_b9e59e7b59ba5c0c5ab21c851f8" FOREIGN KEY ("customer_order_id") REFERENCES "customer_order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_order_items" ADD CONSTRAINT "FK_5ae104163a85e45a252153a06bf" FOREIGN KEY ("matched_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_order" ADD CONSTRAINT "FK_950bef699fc43dc3ae30c225df8" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_order" ADD CONSTRAINT "FK_55f7977d77e41154afe705ec9bf" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "customer_order" DROP CONSTRAINT "FK_55f7977d77e41154afe705ec9bf"`);
        await queryRunner.query(`ALTER TABLE "customer_order" DROP CONSTRAINT "FK_950bef699fc43dc3ae30c225df8"`);
        await queryRunner.query(`ALTER TABLE "customer_order_items" DROP CONSTRAINT "FK_5ae104163a85e45a252153a06bf"`);
        await queryRunner.query(`ALTER TABLE "customer_order_items" DROP CONSTRAINT "FK_b9e59e7b59ba5c0c5ab21c851f8"`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice" DROP CONSTRAINT "FK_94b0a9f4a3da8f7d4bcad46da73"`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice" DROP CONSTRAINT "FK_1f5d1b2f2703d3f7532139b7424"`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice_items" DROP CONSTRAINT "FK_e69095b837b170d7e87e4461d6f"`);
        await queryRunner.query(`ALTER TABLE "supplier_invoice_items" DROP CONSTRAINT "FK_3adb1eb6f95c6064f661c42ff3d"`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" DROP CONSTRAINT "FK_e33e764ddb6b93d7279e77aa06d"`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" DROP CONSTRAINT "FK_0c70b6806d629e0876808c402b5"`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" DROP CONSTRAINT "FK_65e0fc80710f2d0678df28edb1e"`);
        await queryRunner.query(`ALTER TABLE "warehouse_transfer" DROP CONSTRAINT "FK_7e5ea9c1a0bbdac6beae9c75b82"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_5a799806278a60e9c7839a58d93"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_c1bf5ff45511ecaad0b28440e30"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_84dea70c36df8700e616018f256"`);
        await queryRunner.query(`DROP TABLE "customer_order"`);
        await queryRunner.query(`DROP TYPE "public"."customer_order_status_enum"`);
        await queryRunner.query(`DROP TABLE "customer_order_items"`);
        await queryRunner.query(`DROP TABLE "supplier_invoice"`);
        await queryRunner.query(`DROP TYPE "public"."supplier_invoice_status_enum"`);
        await queryRunner.query(`DROP TABLE "supplier_invoice_items"`);
        await queryRunner.query(`DROP TABLE "warehouse_transfer"`);
        await queryRunner.query(`DROP TABLE "stock_movement"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movement_reason_enum"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_category_enum"`);
        await queryRunner.query(`DROP TABLE "warehouses"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
}
exports.InitialSchema1786605609952 = InitialSchema1786605609952;
//# sourceMappingURL=1786605609952-InitialSchema.js.map