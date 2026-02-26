/*
  Warnings:

  - You are about to drop the `products_collections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `products_collections` DROP FOREIGN KEY `products_collections_collection_id_fkey`;

-- DropForeignKey
ALTER TABLE `products_collections` DROP FOREIGN KEY `products_collections_product_id_fkey`;

-- DropTable
DROP TABLE `products_collections`;

-- CreateTable
CREATE TABLE `collections_products` (
    `collection_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,

    PRIMARY KEY (`collection_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `collections_products` ADD CONSTRAINT `collections_products_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collections_products` ADD CONSTRAINT `collections_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
