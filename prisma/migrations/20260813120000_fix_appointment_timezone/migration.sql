-- Corrige horários de agendamentos criados antes da correção de fuso horário.
-- O cliente enviava "YYYY-MM-DDTHH:MM:SS" sem fuso; o servidor (UTC) gravava o
-- horário local como UTC. Para um usuário em UTC-3 (Brasil), um agendamento das
-- 10:00 aparecia às 07:00. Ajusta os registros existentes somando 3 horas.
UPDATE "Appointment"
SET "startsAt" = "startsAt" + interval '3 hours',
    "endsAt" = "endsAt" + interval '3 hours'
WHERE "startsAt" IS NOT NULL;
