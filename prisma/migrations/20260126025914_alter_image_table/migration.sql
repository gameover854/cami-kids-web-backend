/*
  Warnings:

  - Made the column `product_id` on table `images` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `images` DROP FOREIGN KEY `images_product_id_fkey`;

-- DropIndex
DROP INDEX `images_product_id_fkey` ON `images`;

-- AlterTable
ALTER TABLE `images` MODIFY `product_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
