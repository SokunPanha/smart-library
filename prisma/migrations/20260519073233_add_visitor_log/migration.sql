-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "bookId" TEXT,
    "note" TEXT,
    "arrivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "recordedBy" TEXT NOT NULL,

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorLog_arrivedAt_idx" ON "VisitorLog"("arrivedAt" DESC);

-- CreateIndex
CREATE INDEX "VisitorLog_memberId_idx" ON "VisitorLog"("memberId");

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
