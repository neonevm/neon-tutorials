module.exports = class Data1709595469208 {
    name = 'Data1709595469208'

    async up(db) {
        await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "src" text NOT NULL, "dst" text NOT NULL, "wad" numeric NOT NULL, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_3861814f25e18e8529c82196f2" ON "transfer" ("src") `)
        await db.query(`CREATE INDEX "IDX_d77f67f4c020c71d6fe6e20a52" ON "transfer" ("dst") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "transfer"`)
        await db.query(`DROP INDEX "public"."IDX_3861814f25e18e8529c82196f2"`)
        await db.query(`DROP INDEX "public"."IDX_d77f67f4c020c71d6fe6e20a52"`)
    }
}
