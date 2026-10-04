-- Add iPhone 17, 17 Pro and 17 Pro Max with the same 7 repairs as the iPhone 16 series.
-- Premium screen is priced (cents); aftermarket screen is not available; every other repair is quote only.
-- Plain INSERT on purpose: fails on the unique (brand, model, issue) key if any row already exists.
INSERT INTO "Pricing" ("id", "brand", "model", "issue", "price", "available", "updatedAt")
SELECT gen_random_uuid()::text, 'Apple iPhone', v.model, v.issue, v.price, v.available, CURRENT_TIMESTAMP
FROM (VALUES
  ('iPhone 17',         'Screen Replacement - Premium',     29900, true),
  ('iPhone 17',         'Screen Replacement - Aftermarket', NULL,  false),
  ('iPhone 17',         'Battery Replacement',              NULL,  true),
  ('iPhone 17',         'Charging Port Repair',             NULL,  true),
  ('iPhone 17',         'Back Glass Replacement',           NULL,  true),
  ('iPhone 17',         'Camera Replacement - Front',       NULL,  true),
  ('iPhone 17',         'Camera Replacement - Rear',        NULL,  true),

  ('iPhone 17 Pro',     'Screen Replacement - Premium',     34900, true),
  ('iPhone 17 Pro',     'Screen Replacement - Aftermarket', NULL,  false),
  ('iPhone 17 Pro',     'Battery Replacement',              NULL,  true),
  ('iPhone 17 Pro',     'Charging Port Repair',             NULL,  true),
  ('iPhone 17 Pro',     'Back Glass Replacement',           NULL,  true),
  ('iPhone 17 Pro',     'Camera Replacement - Front',       NULL,  true),
  ('iPhone 17 Pro',     'Camera Replacement - Rear',        NULL,  true),

  ('iPhone 17 Pro Max', 'Screen Replacement - Premium',     36900, true),
  ('iPhone 17 Pro Max', 'Screen Replacement - Aftermarket', NULL,  false),
  ('iPhone 17 Pro Max', 'Battery Replacement',              NULL,  true),
  ('iPhone 17 Pro Max', 'Charging Port Repair',             NULL,  true),
  ('iPhone 17 Pro Max', 'Back Glass Replacement',           NULL,  true),
  ('iPhone 17 Pro Max', 'Camera Replacement - Front',       NULL,  true),
  ('iPhone 17 Pro Max', 'Camera Replacement - Rear',        NULL,  true)
) AS v(model, issue, price, available);
