/*
  Warnings:

  - You are about to drop the column `promotion_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `product_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promotion_variants` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `variant_id` to the `images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promotion_id` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_promotion_id_fkey`;

-- DropForeignKey
ALTER TABLE `product_images` DROP FOREIGN KEY `product_images_image_id_fkey`;

-- DropForeignKey
ALTER TABLE `product_images` DROP FOREIGN KEY `product_images_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `promotion_variants` DROP FOREIGN KEY `promotion_variants_promotion_id_fkey`;

-- DropForeignKey
ALTER TABLE `promotion_variants` DROP FOREIGN KEY `promotion_variants_variant_id_fkey`;

-- DropIndex
DROP INDEX `orders_promotion_id_fkey` ON `orders`;

-- AlterTable
ALTER TABLE `images` ADD COLUMN `is_main` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `variant_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `promotion_id`;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `promotion_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `product_images`;

-- DropTable
DROP TABLE `promotion_variants`;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
