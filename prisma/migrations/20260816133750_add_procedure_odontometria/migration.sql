-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "indication" TEXT,
    "contraindications" TEXT,
    "materials" TEXT,
    "anesthesia" TEXT,
    "suggestedValue" DECIMAL(12,2),
    "estimatedDuration" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureRecord" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "procedureId" TEXT,
    "procedureName" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "teeth" JSONB,
    "faces" TEXT,
    "materials" TEXT,
    "anesthesia" TEXT,
    "professionalId" TEXT,
    "performedAt" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "value" DECIMAL(12,2),
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADO',
    "observations" TEXT,
    "clinicalEvolution" TEXT,
    "returnAt" TIMESTAMP(3),
    "photoIds" JSONB,
    "radiographIds" JSONB,
    "documentIds" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Procedure_clinicId_idx" ON "Procedure"("clinicId");

-- CreateIndex
CREATE INDEX "Procedure_clinicId_category_idx" ON "Procedure"("clinicId", "category");

-- CreateIndex
CREATE INDEX "ProcedureRecord_clinicId_idx" ON "ProcedureRecord"("clinicId");

-- CreateIndex
CREATE INDEX "ProcedureRecord_patientId_idx" ON "ProcedureRecord"("patientId");

-- CreateIndex
CREATE INDEX "ProcedureRecord_procedureId_idx" ON "ProcedureRecord"("procedureId");

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
