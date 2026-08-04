-- Adiciona os tipos de produção "Fernando" e "Bernardo" ao enum ProductionType
ALTER TYPE "ProductionType" ADD VALUE IF NOT EXISTS 'FERNANDO';
ALTER TYPE "ProductionType" ADD VALUE IF NOT EXISTS 'BERNARDO';
