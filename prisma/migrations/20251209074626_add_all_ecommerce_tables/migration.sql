/*
  Warnings:

  - You are about to drop the `collection_products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `collection_products` DROP FOREIGN KEY `collection_products_collection_id_fkey`;

-- DropForeignKey
ALTER TABLE `collection_products` DROP FOREIGN KEY `collection_products_product_id_fkey`;

-- DropTable
DROP TABLE `collection_products`;

-- CreateTable
CREATE TABLE `products_collections` (
    `collection_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,

    PRIMARY KEY (`collection_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products_collections` ADD CONSTRAINT `products_collections_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products_collections` ADD CONSTRAINT `products_collections_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
