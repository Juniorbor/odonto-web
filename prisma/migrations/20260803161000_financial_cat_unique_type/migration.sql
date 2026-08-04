-- DropIndex
DROP INDEX "FinancialCategory_tenantId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "FinancialCategory_tenantId_name_type_key" ON "FinancialCategory"("tenantId", "name", "type");
