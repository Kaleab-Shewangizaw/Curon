-- AlterTable
ALTER TABLE "Thought" ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
