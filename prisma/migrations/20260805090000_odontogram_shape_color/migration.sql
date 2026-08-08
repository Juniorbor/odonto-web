-- Campo shape (marca gráfica: NONE/ARROW/CIRCLE/SQUARE) e color (cor baseada na lesão) nas condições do odontograma
ALTER TABLE "ToothCondition" ADD COLUMN "shape" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "ToothCondition" ADD COLUMN "color" TEXT;