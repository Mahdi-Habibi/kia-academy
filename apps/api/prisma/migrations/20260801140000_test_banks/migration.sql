-- CreateTable
CREATE TABLE "TestBank" (
    "id" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TestBank_pkey" PRIMARY KEY ("id")
);
