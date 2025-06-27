-- Add customer notes and order improvements
-- Run: npx prisma migrate dev --name add_customer_notes_and_order_improvements

-- Add notes column to customers table
ALTER TABLE "customers" ADD COLUMN "notes" TEXT;

-- Add notes and lastModified columns to Order table
ALTER TABLE "Order" ADD COLUMN "notes" TEXT;
ALTER TABLE "Order" ADD COLUMN "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing orders to have the new default status
UPDATE "Order" SET "status" = 'confirmed' WHERE "status" = 'pending';

-- Create index for faster customer lookup by mobile
CREATE INDEX "customers_mobile_idx" ON "customers"("mobile");

-- Create index for faster order lookup by event date
CREATE INDEX "orders_eventDate_idx" ON "Order"("eventDate");

-- Create index for faster order lookup by status
CREATE INDEX "orders_status_idx" ON "Order"("status");
