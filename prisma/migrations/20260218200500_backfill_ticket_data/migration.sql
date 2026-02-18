-- Backfill defaults and missing computed fields
-- Set default SLA hours where missing
UPDATE "tickets"
SET "slaHours" = 24
WHERE "slaHours" IS NULL;

-- Backfill closedAt from deliveryDate when applicable
UPDATE "tickets"
SET "closedAt" = "deliveryDate"
WHERE "closedAt" IS NULL
  AND "deliveryDate" IS NOT NULL
  AND "status" = 'CLOSED';

-- Compute executionTime (minutes) where missing and closedAt is present
UPDATE "tickets"
SET "executionTime" = GREATEST(
  0,
  ROUND(EXTRACT(EPOCH FROM ("closedAt" - COALESCE("deliveryDate", "createdAt"))) / 60)
)
WHERE "executionTime" IS NULL
  AND "closedAt" IS NOT NULL;
