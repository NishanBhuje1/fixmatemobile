-- Booking time slots + booking reference. Additive only: existing leads are not modified.
ALTER TABLE "Lead" ADD COLUMN "slotStart" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "reference" TEXT;

CREATE UNIQUE INDEX "Lead_reference_key" ON "Lead"("reference");
CREATE INDEX "Lead_slotStart_idx" ON "Lead"("slotStart");

-- Opening hours (Australia/Melbourne local time, minutes after midnight)
CREATE TABLE "StoreHours" (
    "dayOfWeek" INTEGER NOT NULL,
    "openMinute" INTEGER,
    "closeMinute" INTEGER,

    CONSTRAINT "StoreHours_pkey" PRIMARY KEY ("dayOfWeek")
);

CREATE TABLE "StoreDateOverride" (
    "date" DATE NOT NULL,
    "openMinute" INTEGER,
    "closeMinute" INTEGER,
    "note" TEXT,

    CONSTRAINT "StoreDateOverride_pkey" PRIMARY KEY ("date")
);

-- Seed with the hours currently shown on the Visit Store page
INSERT INTO "StoreHours" ("dayOfWeek", "openMinute", "closeMinute") VALUES
  (0, 600, 1020),  -- Sunday    10:00 – 17:00
  (1, 540, 1050),  -- Monday     9:00 – 17:30
  (2, 540, 1050),  -- Tuesday    9:00 – 17:30
  (3, 540, 1050),  -- Wednesday  9:00 – 17:30
  (4, 540, 1260),  -- Thursday   9:00 – 21:00
  (5, 540, 1260),  -- Friday     9:00 – 21:00
  (6, 540, 1020);  -- Saturday   9:00 – 17:00
