-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "checkedOutBy" TEXT,
ADD COLUMN     "closedBy" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;
