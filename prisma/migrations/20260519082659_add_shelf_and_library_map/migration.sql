-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "shelfId" TEXT;

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "section" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMap" (
    "id" TEXT NOT NULL,
    "rows" INTEGER NOT NULL DEFAULT 8,
    "cols" INTEGER NOT NULL DEFAULT 12,
    "cells" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shelf_code_key" ON "Shelf"("code");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;
