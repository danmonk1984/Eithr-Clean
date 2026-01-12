-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "creatorId" TEXT;

-- CreateIndex
CREATE INDEX "Poll_creatorId_idx" ON "Poll"("creatorId");
