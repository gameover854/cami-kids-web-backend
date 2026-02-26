-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_promotion_id_fkey`;

-- DropIndex
DROP INDEX `products_promotion_id_fkey` ON `products`;

-- CreateTable
CREATE TABLE `products_promotions` (
    `promotion_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,

    PRIMARY KEY (`promotion_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products_promotions` ADD CONSTRAINT `products_promotions_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products_promotions` ADD CONSTRAINT `products_promotions_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
