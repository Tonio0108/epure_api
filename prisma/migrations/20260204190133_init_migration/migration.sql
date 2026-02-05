-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobTitle" TEXT NOT NULL,
    "candidateName" TEXT,
    "score" INTEGER NOT NULL,
    "missingSkills" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "rawText" TEXT NOT NULL
);
