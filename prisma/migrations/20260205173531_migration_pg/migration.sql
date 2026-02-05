-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobTitle" TEXT NOT NULL,
    "candidateName" TEXT,
    "score" INTEGER NOT NULL,
    "missingSkills" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);
