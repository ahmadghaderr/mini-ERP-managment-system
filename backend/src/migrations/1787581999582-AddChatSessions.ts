import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatSessions1787581999582 implements MigrationInterface {
    name = 'AddChatSessions1787581999582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying(255) NOT NULL DEFAULT 'New chat', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9017c2ee500cd1ba895752a0aa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chat_session_id" uuid NOT NULL, "role" character varying(20) NOT NULL, "text" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chat_session" ADD CONSTRAINT "FK_cf8aa366e235b6d4c650bd51b3d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_a984e2d665b96db53261520c773" FOREIGN KEY ("chat_session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_a984e2d665b96db53261520c773"`);
        await queryRunner.query(`ALTER TABLE "chat_session" DROP CONSTRAINT "FK_cf8aa366e235b6d4c650bd51b3d"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`DROP TABLE "chat_session"`);
    }

}
