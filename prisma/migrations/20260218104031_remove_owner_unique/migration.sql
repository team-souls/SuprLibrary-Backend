/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Review` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Library_ownerId_key";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "ownerId";
