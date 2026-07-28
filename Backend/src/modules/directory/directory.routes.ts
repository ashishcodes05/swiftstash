import express from "express";
import { DirectoryController } from "./directory.controller.js";
import { zodValidationMiddleware } from "../../middlewares/zodMiddleware.js";
import { createDirectorySchema, deleteDirectoryByIdSchema, deleteMultipleDirectoriesSchema, getDirectoryItemsByIdSchema, renameDirectorySchema } from "./directory.schema.js";

const router = express.Router();

router.get("/{:dirId}", zodValidationMiddleware(getDirectoryItemsByIdSchema), DirectoryController.getDirectoryItemsById);
router.post("/{:dirId}", zodValidationMiddleware(createDirectorySchema), DirectoryController.createDirectory);
router.patch("/:dirId", zodValidationMiddleware(renameDirectorySchema), DirectoryController.renameDirectory);
router.delete("/:dirId", zodValidationMiddleware(deleteDirectoryByIdSchema), DirectoryController.deleteDirectoryById);
router.delete("/bulk-delete", zodValidationMiddleware(deleteMultipleDirectoriesSchema), DirectoryController.deleteMultipleDirectories);

export default router;