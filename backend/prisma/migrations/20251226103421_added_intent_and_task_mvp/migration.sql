-- CreateTable
CREATE TABLE "Intent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "topic" TEXT,
    "confidence" DOUBLE PRECISION,
    "relatedThoughtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "priority" INTEGER,
    "relatedIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Intent" ADD CONSTRAINT "Intent_relatedThoughtId_fkey" FOREIGN KEY ("relatedThoughtId") REFERENCES "Thought"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_relatedIntentId_fkey" FOREIGN KEY ("relatedIntentId") REFERENCES "Intent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
