-- Adiciona coluna para as regiões ampliadas (capturas da lupa) salvas
-- junto com as anotações da radiografia.
ALTER TABLE "RadiographAnnotation" ADD COLUMN "snapshots" JSONB;