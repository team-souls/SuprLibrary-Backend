/*
  Warnings:

  - The `status` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('TRIAL', 'PENDING', 'SUCCESS', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "trialEndDate" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus";

-- AlterTable
ALTER TABLE "Library" ADD COLUMN     "address" TEXT NOT NULL DEFAULT ' ',
ADD COLUMN     "trialDuration" INTEGER NOT NULL DEFAULT 0;
