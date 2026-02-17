/*
  Warnings:

  - Added the required column `basePrice` to the `Library` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactNumber` to the `Library` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSeats` to the `Library` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Library" ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "contactNumber" TEXT NOT NULL,
ADD COLUMN     "facilities" TEXT[],
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalSeats" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "SlotType" (
    "id" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "libraryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotTiming" (
    "id" TEXT NOT NULL,
    "slotTypeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "activeStudents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotTiming_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SlotType" ADD CONSTRAINT "SlotType_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotTiming" ADD CONSTRAINT "SlotTiming_slotTypeId_fkey" FOREIGN KEY ("slotTypeId") REFERENCES "SlotType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
