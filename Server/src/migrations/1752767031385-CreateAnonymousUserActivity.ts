import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnonymousUserActivity1752767031385 implements MigrationInterface {
    name = 'CreateAnonymousUserActivity1752767031385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "anonymous_user_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" character varying NOT NULL, "gameId" uuid NOT NULL, "startedAt" TIMESTAMP NOT NULL, "endedAt" TIMESTAMP, "durationSeconds" integer, "freeTimeLimitSeconds" integer NOT NULL, "reachedTimeLimit" boolean NOT NULL DEFAULT false, "deviceType" character varying, "country" character varying, "ipAddress" character varying, "convertedUserId" uuid, "isVerified" boolean NOT NULL DEFAULT false, "userState" character varying NOT NULL DEFAULT 'anonymous', "convertedAt" TIMESTAMP, "verifiedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3a4569255db0c558792d9aa4ab2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_774eddc43465b1648e52f7dc71" ON "anonymous_user_activity" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7d28ce2469be8bc563ca3807bb" ON "anonymous_user_activity" ("gameId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7c59e40c562c56717b1d7b6124" ON "anonymous_user_activity" ("startedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_8c6fadbd7f07fe1e2d10863e23" ON "anonymous_user_activity" ("reachedTimeLimit") `);
        await queryRunner.query(`CREATE INDEX "IDX_0337deb1f062ac6919a2d3187a" ON "anonymous_user_activity" ("deviceType") `);
        await queryRunner.query(`CREATE INDEX "IDX_aec8e7f904cfd2ddc4bc52963b" ON "anonymous_user_activity" ("country") `);
        await queryRunner.query(`CREATE INDEX "IDX_fa1c6f22c6fb482ae12e4aca4f" ON "anonymous_user_activity" ("convertedUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e84d0e4575fc0ead38a7e2b78c" ON "anonymous_user_activity" ("isVerified") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d6f670508ecc8dc5773f1666a" ON "anonymous_user_activity" ("userState") `);
        await queryRunner.query(`CREATE INDEX "IDX_b59253bb8b55932b5b49d9a49c" ON "anonymous_user_activity" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_90152ad78553a59e6bfa824d1c" ON "anonymous_user_activity" ("deviceType", "country") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a24dd57b781e69a85d9d67fc6" ON "anonymous_user_activity" ("userState", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2633816e40e7b55ecdad113935" ON "anonymous_user_activity" ("convertedUserId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_4192dd6397b2ac35b3dc7ba7f8" ON "anonymous_user_activity" ("sessionId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_6b554f57adccce329534a5b0d4" ON "anonymous_user_activity" ("sessionId", "gameId") `);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "gameId" uuid`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "convertedToAccount" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "userVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_090522ec8213c7933e798387a0" ON "signup_analytics" ("gameId") `);
        await queryRunner.query(`CREATE INDEX "IDX_efb8696dce1198bfdeb629280e" ON "signup_analytics" ("userId") `);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD CONSTRAINT "FK_090522ec8213c7933e798387a0d" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD CONSTRAINT "FK_efb8696dce1198bfdeb629280ed" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "anonymous_user_activity" ADD CONSTRAINT "FK_7d28ce2469be8bc563ca3807bb9" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "anonymous_user_activity" ADD CONSTRAINT "FK_fa1c6f22c6fb482ae12e4aca4fa" FOREIGN KEY ("convertedUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "anonymous_user_activity" DROP CONSTRAINT "FK_fa1c6f22c6fb482ae12e4aca4fa"`);
        await queryRunner.query(`ALTER TABLE "anonymous_user_activity" DROP CONSTRAINT "FK_7d28ce2469be8bc563ca3807bb9"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP CONSTRAINT "FK_efb8696dce1198bfdeb629280ed"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP CONSTRAINT "FK_090522ec8213c7933e798387a0d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efb8696dce1198bfdeb629280e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_090522ec8213c7933e798387a0"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "userVerified"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "convertedToAccount"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "gameId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b554f57adccce329534a5b0d4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4192dd6397b2ac35b3dc7ba7f8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2633816e40e7b55ecdad113935"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a24dd57b781e69a85d9d67fc6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90152ad78553a59e6bfa824d1c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b59253bb8b55932b5b49d9a49c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d6f670508ecc8dc5773f1666a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e84d0e4575fc0ead38a7e2b78c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa1c6f22c6fb482ae12e4aca4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aec8e7f904cfd2ddc4bc52963b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0337deb1f062ac6919a2d3187a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c6fadbd7f07fe1e2d10863e23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c59e40c562c56717b1d7b6124"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d28ce2469be8bc563ca3807bb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_774eddc43465b1648e52f7dc71"`);
        await queryRunner.query(`DROP TABLE "anonymous_user_activity"`);
    }

}
