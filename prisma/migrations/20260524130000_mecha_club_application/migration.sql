-- Additive — new table, no impact on existing rows.
CREATE TABLE "mecha_club_application" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mecha_club_application_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mecha_club_application_status_submittedAt_idx" ON "mecha_club_application"("status", "submittedAt");
CREATE INDEX "mecha_club_application_submittedAt_idx" ON "mecha_club_application"("submittedAt");
