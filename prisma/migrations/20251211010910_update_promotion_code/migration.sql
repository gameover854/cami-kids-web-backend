/*
  Warnings:

  - You are about to alter the column `code` on the `promotions` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - A unique constraint covering the columns `[code]` on the table `promotions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `promotions` MODIFY `code` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `promotions_code_key` ON `promotions`(`code`);
