import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccessRequests1786959242776 implements MigrationInterface {
    name = 'AddAccessRequests1786959242776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."access_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "access_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "status" "public"."access_requests_status_enum" NOT NULL DEFAULT 'pending', "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "reviewed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f89e51c15e3dbea13aa248fe128" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "access_requests"`);
        await queryRunner.query(`DROP TYPE "public"."access_requests_status_enum"`);
    }

}
