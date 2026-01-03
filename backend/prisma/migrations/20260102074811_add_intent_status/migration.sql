/*
  Warnings:

  - You are about to drop the column `relatedThoughtId` on the `Intent` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `Intent` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Intent` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `relatedIntentId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Thought` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Thought` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `Thought` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Thought` table. All the data in the column will be lost.
  - Added the required column `thoughtId` to the `Intent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Intent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intentId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Thought` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('ACTIVE', 'FORGOTTEN');

-- DropForeignKey
ALTER TABLE "Intent" DROP CONSTRAINT "Intent_relatedThoughtId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_relatedIntentId_fkey";

-- DropForeignKey
ALTER TABLE "Thought" DROP CONSTRAINT "Thought_ownerId_fkey";

-- AlterTable
ALTER TABLE "Intent" DROP COLUMN "relatedThoughtId",
DROP COLUMN "topic",
DROP COLUMN "updatedAt",
ADD COLUMN     "status" "IntentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "thoughtId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "dueDate",
DROP COLUMN "relatedIntentId",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "intentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Thought" DROP COLUMN "ownerId",
DROP COLUMN "source",
DROP COLUMN "topic",
DROP COLUMN "updatedAt",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intent" ADD CONSTRAINT "Intent_thoughtId_fkey" FOREIGN KEY ("thoughtId") REFERENCES "Thought"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intent" ADD CONSTRAINT "Intent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "Intent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
