-- DropIndex
DROP INDEX "Library_token_key";

-- AlterTable
ALTER TABLE "Library" ALTER COLUMN "token" DROP NOT NULL,
ALTER COLUMN "token" DROP DEFAULT;
