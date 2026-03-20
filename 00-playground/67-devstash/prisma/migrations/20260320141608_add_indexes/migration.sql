-- CreateIndex
CREATE INDEX "collections_updatedAt_idx" ON "collections"("updatedAt");

-- CreateIndex
CREATE INDEX "collections_isFavorite_idx" ON "collections"("isFavorite");

-- CreateIndex
CREATE INDEX "items_updatedAt_idx" ON "items"("updatedAt");

-- CreateIndex
CREATE INDEX "items_isPinned_idx" ON "items"("isPinned");

-- CreateIndex
CREATE INDEX "items_isFavorite_idx" ON "items"("isFavorite");
