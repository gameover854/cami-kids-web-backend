/*
  Warnings:

  - Added the required column `barcode` to the `product_variants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product_variants` ADD COLUMN `barcode` VARCHAR(191) NOT NULL;
