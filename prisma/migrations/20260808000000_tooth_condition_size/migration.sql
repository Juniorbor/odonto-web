-- Campo size (tamanho do ponto de cárie: S/M/L) nas condições do odontograma
ALTER TABLE "ToothCondition" ADD COLUMN "size" TEXT NOT NULL DEFAULT 'M';