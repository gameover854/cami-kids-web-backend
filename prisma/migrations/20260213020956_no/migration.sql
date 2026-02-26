/*
  Warnings:

  - You are about to drop the `products_promotions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `products_promotions` DROP FOREIGN KEY `products_promotions_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `products_promotions` DROP FOREIGN KEY `products_promotions_promotion_id_fkey`;

-- DropTable
DROP TABLE `products_promotions`;

-- CreateTable
CREATE TABLE `collections_promotions` (
    `collection_id` INTEGER NOT NULL,
    `promotion_id` INTEGER NOT NULL,

    PRIMARY KEY (`collection_id`, `promotion_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `collections_promotions` ADD CONSTRAINT `collections_promotions_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collections_promotions` ADD CONSTRAINT `collections_promotions_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
