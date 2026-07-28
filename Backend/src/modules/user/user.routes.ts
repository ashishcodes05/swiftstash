import express from "express";
import { UserController } from "./user.controller.js";

const router = express.Router();

router.post("/set-password", UserController.setPassword);
router.post("/update-password", UserController.updatePassword);
router.delete("/delete-account", UserController.deleteAccount);

export default router;