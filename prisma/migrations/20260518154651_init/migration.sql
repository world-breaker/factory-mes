-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assignedLine" INTEGER
);

-- CreateTable
CREATE TABLE "ProductionLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL DEFAULT '个',
    "material" TEXT,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL DEFAULT '个',
    "category" TEXT,
    "minStock" REAL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "batchNo" TEXT,
    "location" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "batchNo" TEXT,
    "workOrderId" INTEGER,
    "operatorId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialRecord_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaterialRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessTemplate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER,
    "qualityCheckRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProcessTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityDone" INTEGER NOT NULL DEFAULT 0,
    "quantityDefect" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "assignedLineId" INTEGER,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_assignedLineId_fkey" FOREIGN KEY ("assignedLineId") REFERENCES "ProductionLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrderProcess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workOrderId" INTEGER NOT NULL,
    "stepId" INTEGER,
    "stepOrder" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "operatorId" INTEGER,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "WorkOrderProcess_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderProcess_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProcessStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderProcess_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workOrderId" INTEGER NOT NULL,
    "processId" INTEGER,
    "operatorId" INTEGER NOT NULL,
    "quantityGood" INTEGER NOT NULL DEFAULT 0,
    "quantityDefect" INTEGER NOT NULL DEFAULT 0,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionRecord_processId_fkey" FOREIGN KEY ("processId") REFERENCES "WorkOrderProcess" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionRecord_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityCheckpoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stepId" INTEGER,
    "checkType" TEXT NOT NULL DEFAULT 'visual',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityCheckpoint_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProcessStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workOrderId" INTEGER NOT NULL,
    "processId" INTEGER,
    "checkpointId" INTEGER,
    "inspectorId" INTEGER NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'pass',
    "defectType" TEXT,
    "defectQty" INTEGER NOT NULL DEFAULT 0,
    "defectDesc" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityRecord_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "QualityCheckpoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualityRecord_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BomItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '个',
    "notes" TEXT,
    CONSTRAINT "BomItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BomItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLine_code_key" ON "ProductionLine"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_orderNo_key" ON "WorkOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "BomItem_productId_materialId_key" ON "BomItem"("productId", "materialId");
