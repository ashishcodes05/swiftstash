import express from "express";
import { AuthController } from "./auth.controller.js";
import { zodValidationMiddleware } from "../../middlewares/zodMiddleware.js";
import { checkUserExistsSchema, generateAndSendOtpSchema, loginSchema, loginWithGoogleSchema, registerSchema, verifyOtpSchema } from "./auth.schema.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, AuthController.getUser);

router.post("/check-user-exists", zodValidationMiddleware(checkUserExistsSchema), AuthController.checkUserExists);
router.post("/register", zodValidationMiddleware(registerSchema), AuthController.registerUser);
router.post("/login", zodValidationMiddleware(loginSchema), AuthController.loginUser);
router.post("/logout", authMiddleware, AuthController.logoutUser);
router.post("/logout-all-devices", authMiddleware, AuthController.logoutAllDevices);
router.post("/send-otp", zodValidationMiddleware(generateAndSendOtpSchema), AuthController.generateAndSendOtp);
router.post("/verify-otp", zodValidationMiddleware(verifyOtpSchema), AuthController.verifyOtp);
router.post("/google-login", zodValidationMiddleware(loginWithGoogleSchema), AuthController.googleLogin);

export default router;