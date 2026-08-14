-- Adiciona campo para o código (ID) do paciente digitado livremente no
-- registro de produção (pacientes que não fazem parte do cadastro do sistema).
ALTER TABLE "ProductionRecord" ADD COLUMN "patientCode" TEXT;
