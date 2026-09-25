-- CreateTable
CREATE TABLE "ResourceBusinessHours" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "schedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceBusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceBusinessHours_resourceId_key" ON "ResourceBusinessHours"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceBusinessHours_resourceId_idx" ON "ResourceBusinessHours"("resourceId");

-- AddForeignKey
ALTER TABLE "ResourceBusinessHours" ADD CONSTRAINT "ResourceBusinessHours_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
