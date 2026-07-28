-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "blueprintVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "questionIds" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "average" INTEGER,
    "passed" BOOLEAN,
    "domainScores" TEXT,
    "percentages" TEXT,
    "outcome" TEXT,
    "verdict" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_status_idx" ON "ExamAttempt"("userId", "status");

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
