import type { Request, Response } from "express";
import type { ApiErrorResponse, ApiResponse } from "../../types/api.types.js";
import { UserService } from "./user.service.js";
import { SessionRepository } from "../auth/session.repository.js";
import { UserRepository } from "./user.repository.js";

export class UserController {
    static async setPassword(req: Request, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const { newPassword } = req.body;
        const user = await UserRepository.findById(userId);
        if(!user) return res.status(404).json({success: false, error: "User not found"});
        if(user.hasPassword){
            return res.status(400).json({success: false, error: "Password is already set. Please use update password option."});
        }
        const isPasswordUpdated = await UserRepository.updatePassword(userId, newPassword);
        if(!isPasswordUpdated){
            return res.status(500).json({success: false, error: "Failed to set password"});
        }
        await SessionRepository.deleteAllSessionsForUser(userId);
        res.clearCookie("sid");
        return res.status(200).json({success: true, message: "Password set successfully. Please log in again."});
    }
    static async updatePassword(req: Request, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const { currentPassword, newPassword } = req.body;
        const isUpdated = await UserService.updatePassword(userId, { currentPassword, newPassword });
        if(!isUpdated){
            return res.status(400).json({success: false, error: "Current password is incorrect"});
        }
        await SessionRepository.deleteAllSessionsForUser(userId);
        res.clearCookie("sid");
        return res.status(200).json({success: true, message: "Password updated successfully. Please log in again."});
    }

    static async deleteAccount(req: Request, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const { password } = req.body;
        const isPasswordCorrect = await UserRepository.validatePassword(userId, password);
        if(!isPasswordCorrect){
            return res.status(400).json({success: false, error: "Current password is incorrect"});
        }
        await UserService.deleteAccount(userId);
        res.clearCookie("sid");
        return res.status(200).json({success: true, message: "Account deleted successfully"});
    }
}