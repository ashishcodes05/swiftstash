import type { Request, Response } from "express";
import { UserRepository } from "../user/user.repository.js";
import type { UserMetadata } from "../user/user.types.js";
import type { ApiErrorResponse, ApiResponse } from "../../types/api.types.js";
import { AuthService } from "./auth.service.js";
import { SessionRepository } from "./session.repository.js";
import type { GenerateAndSendOtpBody, LoginBody, LoginWithGoogleBody, RegisterBody, VerifyOtpBody } from "./auth.types.js";
import { OAuthService } from "./oauth.service.js";

export class AuthController {
    static async checkUserExists(req: Request<{}, {}, { email: string }>, res: Response<ApiResponse<{ exists: boolean }> | ApiErrorResponse>) {
        const { email } = req.body;
        const userExists = await UserRepository.checkUserExists(email);
        res.status(200).json({
            success: true,
            message: "User existence checked",
            data: { exists: userExists }
        });
    }
    static async getUser(req: Request, res: Response<ApiResponse<UserMetadata> | ApiErrorResponse>) {
        const userId = req.userId!;
        const userMetadata = await UserRepository.getUserMetadata(userId);
        if(!userMetadata) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User found",
            data: userMetadata
        });
    }

    static async registerUser(req: Request<{}, {}, RegisterBody>, res: Response<ApiResponse | ApiErrorResponse>) {
        const { name , email, password } = req.body;
        await AuthService.registerUser(name, email, password);
        return res.status(201).json({success: true, message: 'User registered successfully'});
    }

    static async loginUser(req: Request<{}, {}, LoginBody>, res: Response<ApiResponse | ApiErrorResponse>) {
        const { email, password } = req.body;
        const userId = await AuthService.validateUser(email, password);
        if(!userId){
            return res.status(400).json({success: false, error: "Wrong Credentials"});
        }
        await SessionRepository.enforceDeviceLimit(userId, 2);
        const sessionId = await SessionRepository.createSession(userId, 7 * 24 * 60 * 60);
        res.cookie("sid", sessionId, {
            httpOnly: true,
            signed: true,
            sameSite: "lax",
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.status(200).json({ success: true, message: "User Logged in Successfully" });
    }

    static async logoutUser(req: Request, res: Response<ApiResponse | ApiErrorResponse>) {
        const sessionId = req.signedCookies.sid;
        if(!sessionId){
            return res.status(400).json({success: false, error: "No session found"});
        }
        await SessionRepository.deleteSession(sessionId);
        res.clearCookie("sid");
        return res.status(200).json({success: true, message: "User Logged out Successfully"});
    }

    static async logoutAllDevices(req: Request, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        await SessionRepository.deleteAllSessionsForUser(userId);
        res.clearCookie("sid");
        return res.status(200).json({success: true, message: "User Logged out from all devices Successfully"});
    }

    static async generateAndSendOtp(req: Request<{}, {}, GenerateAndSendOtpBody>, res: Response<ApiResponse | ApiErrorResponse>) {
        const { email } = req.body;
        await AuthService.sendOtp(email);
        return res.status(200).json({success: true, message: "OTP sent successfully"});
    }

    static async verifyOtp(req: Request<{}, {}, VerifyOtpBody>, res: Response<ApiResponse | ApiErrorResponse>) {
        const { email, otp } = req.body;
        const isValid = await AuthService.verifyOtp(email, otp);
        if(!isValid){
            return res.status(400).json({success: false, error: "Invalid OTP"});
        }
        return res.status(200).json({success: true, message: "OTP verified successfully"});
    }

    static async googleLogin(req: Request<{}, {}, LoginWithGoogleBody>, res: Response<ApiResponse | ApiErrorResponse>) {
        const { code } = req.body;
        const { name, email, picture } = await OAuthService.fetchUserFromGoogle(code);
        if(!name || !email || !picture){
            return res.status(400).json({success: false, error: "Failed to fetch user data from Google"});
        }
        const sessionId = await OAuthService.handleLogin(name, email, picture);
        res.cookie("sid", sessionId, {
            httpOnly: true,
            signed: true,
            sameSite: "lax",
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({ success: true, message: "User Logged in Successfully" });
    }
}