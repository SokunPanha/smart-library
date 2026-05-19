/*
  Warnings:

  - You are about to drop the column `block` on the `Shelf` table. All the data in the column will be lost.
  - You are about to drop the column `floor` on the `Shelf` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shelf" DROP COLUMN "block",
DROP COLUMN "floor",
ADD COLUMN     "cabinet" TEXT,
ADD COLUMN     "level" INTEGER;
