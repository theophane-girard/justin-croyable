INSERT INTO "varieties" ("garden_id", "slug", "crop_id", "label", "reference_variety_id")
SELECT NULL, s.slug, s.crop_id, s.label, NULL
FROM (VALUES
  ('tomate-grappe', 'tomate', 'Tomate grappe'),
  ('tomate-ronde', 'tomate', 'Tomate ronde'),
  ('tomate-coeur-de-boeuf', 'tomate', 'Tomate cœur de bœuf'),
  ('tomate-cerise', 'tomate', 'Tomate cerise'),
  ('tomate-allongee', 'tomate', 'Tomate allongée (Roma)'),
  ('tomate-noire-de-crimee', 'tomate', 'Tomate noire de Crimée'),
  ('tomate-ananas', 'tomate', 'Tomate ananas'),
  ('tomate-green-zebra', 'tomate', 'Tomate Green Zebra'),
  ('courgette', 'courgette', 'Courgette'),
  ('carotte', 'carotte', 'Carotte'),
  ('pomme-de-terre', 'pomme-de-terre', 'Pomme de terre'),
  ('salade', 'salade', 'Salade'),
  ('haricot-vert', 'haricot-vert', 'Haricot vert'),
  ('poivron', 'poivron', 'Poivron'),
  ('aubergine', 'aubergine', 'Aubergine'),
  ('concombre', 'concombre', 'Concombre'),
  ('radis', 'radis', 'Radis'),
  ('oignon', 'oignon', 'Oignon'),
  ('poireau', 'poireau', 'Poireau'),
  ('epinard', 'epinard', 'Épinard'),
  ('courge', 'courge', 'Courge'),
  ('fraise', 'fraise', 'Fraise'),
  ('framboise', 'framboise', 'Framboise'),
  ('pomme', 'pomme', 'Pomme'),
  ('poire', 'poire', 'Poire'),
  ('prune', 'prune', 'Prune'),
  ('cerise', 'cerise', 'Cerise'),
  ('abricot', 'abricot', 'Abricot'),
  ('peche', 'peche', 'Pêche'),
  ('raisin', 'raisin', 'Raisin'),
  ('rhubarbe', 'rhubarbe', 'Rhubarbe')
) AS s(slug, crop_id, label)
WHERE NOT EXISTS (SELECT 1 FROM "varieties" v WHERE v."slug" = s.slug AND v."garden_id" IS NULL);--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "variety_uuid" uuid;--> statement-breakpoint
UPDATE "harvests" AS h SET "variety_uuid" = v."id" FROM "varieties" AS v WHERE v."slug" = h."variety_id";--> statement-breakpoint
ALTER TABLE "harvests" DROP COLUMN "variety_id";--> statement-breakpoint
ALTER TABLE "harvests" RENAME COLUMN "variety_uuid" TO "variety_id";--> statement-breakpoint
ALTER TABLE "harvests" ALTER COLUMN "variety_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "variety_uuid" uuid;--> statement-breakpoint
UPDATE "plants" AS p SET "variety_uuid" = v."id" FROM "varieties" AS v WHERE v."slug" = p."variety_id";--> statement-breakpoint
ALTER TABLE "plants" DROP COLUMN "variety_id";--> statement-breakpoint
ALTER TABLE "plants" RENAME COLUMN "variety_uuid" TO "variety_id";--> statement-breakpoint
ALTER TABLE "variety_prices" ADD COLUMN "variety_uuid" uuid;--> statement-breakpoint
UPDATE "variety_prices" AS vp SET "variety_uuid" = v."id" FROM "varieties" AS v WHERE v."slug" = vp."variety_id";--> statement-breakpoint
ALTER TABLE "variety_prices" DROP COLUMN "variety_id";--> statement-breakpoint
ALTER TABLE "variety_prices" RENAME COLUMN "variety_uuid" TO "variety_id";--> statement-breakpoint
ALTER TABLE "variety_prices" ALTER COLUMN "variety_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_variety_id_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."varieties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_variety_id_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."varieties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variety_prices" ADD CONSTRAINT "variety_prices_variety_id_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."varieties"("id") ON DELETE cascade ON UPDATE no action;
