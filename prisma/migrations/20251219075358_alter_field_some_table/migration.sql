/*
  Warnings:

  - You are about to drop the column `createdAt` on the `cart` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.
  - The primary key for the `variant_attributes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `valueId` on the `variant_attributes` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `variant_attributes` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value_id` to the `variant_attributes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variant_id` to the `variant_attributes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `variant_attributes` DROP FOREIGN KEY `variant_attributes_valueId_fkey`;

-- DropForeignKey
ALTER TABLE `variant_attributes` DROP FOREIGN KEY `variant_attributes_variantId_fkey`;

-- DropIndex
DROP INDEX `variant_attributes_valueId_fkey` ON `variant_attributes`;

-- AlterTable
ALTER TABLE `cart` DROP COLUMN `createdAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `payment` DROP COLUMN `createdAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `variant_attributes` DROP PRIMARY KEY,
    DROP COLUMN `valueId`,
    DROP COLUMN `variantId`,
    ADD COLUMN `value_id` INTEGER NOT NULL,
    ADD COLUMN `variant_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`variant_id`, `value_id`);

-- AddForeignKey
ALTER TABLE `variant_attributes` ADD CONSTRAINT `variant_attributes_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attributes` ADD CONSTRAINT `variant_attributes_value_id_fkey` FOREIGN KEY (`value_id`) REFERENCES `product_attribute_values`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
