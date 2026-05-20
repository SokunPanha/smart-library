/*
  Warnings:

  - You are about to drop the column `block` on the `Shelf` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Shelf` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `Shelf` table. All the data in the column will be lost.
  - You are about to drop the column `bookId` on the `VisitorLog` table. All the data in the column will be lost.
  - Added the required column `sectionNo` to the `Shelf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shelfNo` to the `Shelf` table without a default value. This is not possible if the table is not empty.
  - Made the column `cabinet` on table `Shelf` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "VisitorLog" DROP CONSTRAINT "VisitorLog_bookId_fkey";

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "fineNote" TEXT,
ADD COLUMN     "finePaidAt" TIMESTAMP(3),
ADD COLUMN     "fineWaived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "renewalCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Shelf" DROP COLUMN "block",
DROP COLUMN "level",
DROP COLUMN "section",
ADD COLUMN     "sectionNo" INTEGER NOT NULL,
ADD COLUMN     "shelfNo" INTEGER NOT NULL,
ADD COLUMN     "side" TEXT,
ADD COLUMN     "zone" TEXT,
ALTER COLUMN "cabinet" SET NOT NULL;

-- AlterTable
ALTER TABLE "VisitorLog" DROP COLUMN "bookId";

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorLogBook" (
    "id" TEXT NOT NULL,
    "visitorLogId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorLogBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_bookId_status_idx" ON "Reservation"("bookId", "status");

-- CreateIndex
CREATE INDEX "Reservation_memberId_status_idx" ON "Reservation"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorLogBook_visitorLogId_bookId_key" ON "VisitorLogBook"("visitorLogId", "bookId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLogBook" ADD CONSTRAINT "VisitorLogBook_visitorLogId_fkey" FOREIGN KEY ("visitorLogId") REFERENCES "VisitorLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLogBook" ADD CONSTRAINT "VisitorLogBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
