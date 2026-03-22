-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('BIRTHDAY', 'FOLLOW_UP', 'PLEDGE', 'REMINDER', 'MANUAL');

-- CreateTable
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "donorId" TEXT,
    "beneficiaryId" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
CREATE INDEX IF NOT EXISTS "tasks_type_idx" ON "tasks"("type");
CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX IF NOT EXISTS "tasks_dueDate_idx" ON "tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "tasks_donorId_idx" ON "tasks"("donorId");
CREATE INDEX IF NOT EXISTS "tasks_beneficiaryId_idx" ON "tasks"("beneficiaryId");
CREATE INDEX IF NOT EXISTS "tasks_assignedTo_idx" ON "tasks"("assignedTo");
CREATE INDEX IF NOT EXISTS "tasks_status_dueDate_idx" ON "tasks"("status", "dueDate");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "beneficiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
