/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Library` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Library" ADD COLUMN     "token" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Library_token_key" ON "Library"("token");
