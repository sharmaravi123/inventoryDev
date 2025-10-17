-- CreateTable
CREATE TABLE `Stock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `boxes` INTEGER NOT NULL DEFAULT 0,
    `itemsPerBox` INTEGER NOT NULL DEFAULT 1,
    `looseItems` INTEGER NOT NULL DEFAULT 0,
    `totalItems` INTEGER NOT NULL DEFAULT 0,
    `lowStockItems` INTEGER NULL,
    `lowStockBoxes` INTEGER NULL,
    `createdByAdminId` INTEGER NULL,
    `createdByWarehouseId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Stock_productId_warehouseId_key`(`productId`, `warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_createdByWarehouseId_fkey` FOREIGN KEY (`createdByWarehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
