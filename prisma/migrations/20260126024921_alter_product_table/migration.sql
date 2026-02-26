/*
  Warnings:

  - You are about to drop the column `original_price` on the `products` table. All the data in the column will be lost.
  - Added the required column `selling_price` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `products` DROP COLUMN `original_price`,
    ADD COLUMN `selling_price` DECIMAL(10, 2) NOT NULL;
