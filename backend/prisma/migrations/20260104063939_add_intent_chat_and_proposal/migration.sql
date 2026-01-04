-- AlterTable
ALTER TABLE "Intent" ADD COLUMN     "pendingProposal" JSONB;

-- CreateTable
CREATE TABLE "IntentChat" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intentId" TEXT NOT NULL,

    CONSTRAINT "IntentChat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IntentChat" ADD CONSTRAINT "IntentChat_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "Intent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
