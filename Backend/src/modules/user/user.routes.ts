import express from "express";
import { UserController } from "./user.controller.js";
import { deleteAccountSchema, setPasswordSchema, updatePasswordSchema } from "./user.schema.js";
import { zodValidationMiddleware } from "../../middlewares/zodMiddleware.js";

const router = express.Router();

router.post("/set-password", zodValidationMiddleware(setPasswordSchema), UserController.setPassword);
router.post("/update-password", zodValidationMiddleware(updatePasswordSchema), UserController.updatePassword);
router.delete("/delete-account", zodValidationMiddleware(deleteAccountSchema), UserController.deleteAccount);

export default router;