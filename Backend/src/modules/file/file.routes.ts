import express from "express";
import { FileController } from "./file.controller.js";
import upload from "../../middlewares/multerMiddleware.js";
import { zodValidationMiddleware } from "../../middlewares/zodMiddleware.js";
import { completeUploadSchema, deleteFileByIdSchema, deleteMultipleFilesSchema, downloadMultipleFilesSchema, getFileByIdSchema, initiateUploadSchema, renameFileSchema} from "./file.schema.js";

const router = express.Router();

router.get("/:fileId",zodValidationMiddleware(getFileByIdSchema), FileController.getFileById);
// router.post("/upload", upload.single("file"), zodValidationMiddleware(uploadFileSchema), FileController.uploadFile);
router.post("/upload/initiate", zodValidationMiddleware(initiateUploadSchema), FileController.initiateUpload);
router.post("/upload/complete", zodValidationMiddleware(completeUploadSchema), FileController.completeUpload);
router.post("/upload/cancel", zodValidationMiddleware(completeUploadSchema), FileController.cancelUpload);
router.post("/bulk-download", zodValidationMiddleware(downloadMultipleFilesSchema), FileController.downloadMultipleFiles);
router.patch("/:fileId", zodValidationMiddleware(renameFileSchema), FileController.renameFile);
router.delete("/bulk-delete", zodValidationMiddleware(deleteMultipleFilesSchema), FileController.deleteMultipleFiles);
router.delete("/:fileId", zodValidationMiddleware(deleteFileByIdSchema), FileController.deleteFileById);

export default router;