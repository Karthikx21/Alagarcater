-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tamilName" TEXT,
    "mobile" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "selectedItems" JSONB NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "serviceCharge" DECIMAL(65,30) NOT NULL,
    "gst" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "amountPaid" DECIMAL(65,30) NOT NULL,
    "amountDue" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tamilName" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "userId" INTEGER,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MenuItem" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'lunch';
ALTER TABLE "MenuItem" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'veg';
ALTER TABLE "MenuItem" ADD COLUMN "description" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "MenuItem" SET "category" = 'lunch' WHERE "category" IS NULL;
UPDATE "MenuItem" SET "type" = 'veg' WHERE "type" IS NULL;
UPDATE "MenuItem" SET "isActive" = true WHERE "isActive" IS NULL;