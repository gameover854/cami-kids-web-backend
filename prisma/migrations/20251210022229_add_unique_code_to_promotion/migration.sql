-- DropIndex
DROP INDEX `promotions_code_key` ON `promotions`;

-- AlterTable
ALTER TABLE `promotions` MODIFY `code` VARCHAR(255) NOT NULL;
