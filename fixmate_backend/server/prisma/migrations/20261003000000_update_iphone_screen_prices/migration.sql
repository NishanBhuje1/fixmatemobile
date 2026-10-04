-- Update iPhone 13–16 screen replacement prices (stored in cents).
-- Fails (and changes nothing) unless exactly 21 rows are updated.
-- An empty table (fresh dev or Prisma shadow database) is skipped so `migrate dev` still works.
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE "Pricing" AS p
  SET "price" = v.price, "updatedAt" = CURRENT_TIMESTAMP
  FROM (VALUES
    ('iPhone 16',         'Screen Replacement - Premium',     25900),
    ('iPhone 16 Plus',    'Screen Replacement - Premium',     26900),
    ('iPhone 16 Pro',     'Screen Replacement - Premium',     27900),
    ('iPhone 16 Pro Max', 'Screen Replacement - Premium',     29900),
    ('iPhone 15',         'Screen Replacement - Premium',     24900),
    ('iPhone 15 Plus',    'Screen Replacement - Premium',     25900),
    ('iPhone 15 Pro',     'Screen Replacement - Premium',     26900),
    ('iPhone 15 Pro Max', 'Screen Replacement - Premium',     28900),
    ('iPhone 14',         'Screen Replacement - Premium',     23900),
    ('iPhone 14 Plus',    'Screen Replacement - Premium',     25900),
    ('iPhone 14 Pro',     'Screen Replacement - Premium',     26900),
    ('iPhone 14 Pro Max', 'Screen Replacement - Premium',     27900),
    ('iPhone 13',         'Screen Replacement - Premium',     22900),
    ('iPhone 13 Pro',     'Screen Replacement - Premium',     24900),
    ('iPhone 13 Pro Max', 'Screen Replacement - Premium',     25900),
    ('iPhone 16',         'Screen Replacement - Aftermarket', 17900),
    ('iPhone 16 Plus',    'Screen Replacement - Aftermarket', 18900),
    ('iPhone 16 Pro',     'Screen Replacement - Aftermarket', 18900),
    ('iPhone 16 Pro Max', 'Screen Replacement - Aftermarket', 19900),
    ('iPhone 15 Pro',     'Screen Replacement - Aftermarket', 18900),
    ('iPhone 15 Pro Max', 'Screen Replacement - Aftermarket', 19900)
  ) AS v(model, issue, price)
  WHERE p."brand" = 'Apple iPhone'
    AND p."model" = v.model
    AND p."issue" = v.issue;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 21 AND EXISTS (SELECT 1 FROM "Pricing") THEN
    RAISE EXCEPTION 'Expected to update 21 Pricing rows, updated %', updated_count;
  END IF;
END $$;
