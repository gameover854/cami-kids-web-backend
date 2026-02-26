/*
  Warnings:

  - You are about to drop the column `color` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `product_variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `product_variants` DROP COLUMN `color`,
    DROP COLUMN `size`;
