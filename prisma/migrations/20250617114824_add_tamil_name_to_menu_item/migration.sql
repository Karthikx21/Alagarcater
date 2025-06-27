/*
  Warnings:

  - You are about to drop the column `tamilName` on the `Customer` table. All the data in the column will be lost.
  - Made the column `tamilName` on table `MenuItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "tamilName";

-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "tamilName" SET NOT NULL;
