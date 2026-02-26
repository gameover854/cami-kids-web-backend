-- CreateIndex
CREATE INDEX `idx_orders_status` ON `orders`(`status`);

-- CreateIndex
CREATE INDEX `idx_orders_created_at` ON `orders`(`created_at`);

-- CreateIndex
CREATE INDEX `idx_products_is_active` ON `products`(`is_active`);

-- CreateIndex
CREATE INDEX `idx_products_created_at` ON `products`(`created_at`);

-- RedefineIndex
CREATE INDEX `idx_orders_user_id` ON `orders`(`user_id`);

-- RedefineIndex
CREATE INDEX `idx_products_category_id` ON `products`(`category_id`);
