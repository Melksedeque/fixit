-- Ensure required ticket columns exist (idempotent)
ALTER TABLE "tickets" 
  ADD COLUMN IF NOT EXISTS "deadlineForecast" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "executionTime" INTEGER,
  ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "slaHours" INTEGER;

-- Ensure indexes exist (skip if already created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tickets_status_idx') THEN
    CREATE INDEX "tickets_status_idx" ON "tickets"("status");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tickets_priority_idx') THEN
    CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tickets_assignedToId_idx') THEN
    CREATE INDEX "tickets_assignedToId_idx" ON "tickets"("assignedToId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tickets_customerId_idx') THEN
    CREATE INDEX "tickets_customerId_idx" ON "tickets"("customerId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tickets_deadlineForecast_idx') THEN
    CREATE INDEX "tickets_deadlineForecast_idx" ON "tickets"("deadlineForecast");
  END IF;
END$$;
