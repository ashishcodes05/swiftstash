import mongoose from "mongoose";
import { UserRepository } from "./user.repository.js";
import { DirectoryRepository } from "../directory/directory.repository.js";
import { FileRepository } from "../file/file.repository.js";
import { StorageService } from "../file/storage.service.js";
import { SessionRepository } from "../auth/session.repository.js";

export class UserService {
    static async updatePassword(userId : string, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }) : Promise<boolean> {
        const user = await UserRepository.findById(userId);
        if(!user) return false;
        if(!user.hasPassword){
            const isPasswordUpdated = await UserRepository.updatePassword(userId, newPassword);
            return isPasswordUpdated;
        }
        if(!currentPassword) return false;
        const isPasswordCorrect = user.comparePassword(currentPassword);
        if(!isPasswordCorrect) return false;
        const isPasswordUpdated = await UserRepository.updatePassword(userId, newPassword);
        return isPasswordUpdated;
    }

    static async deleteAccount(userId : string){
        const mongooseSession = await mongoose.startSession();
        try {
            mongooseSession.startTransaction();
            await DirectoryRepository.deleteByUserId(userId, mongooseSession);
            const files = await FileRepository.getFilesByUserId(userId);
            await FileRepository.deleteFilesByIds(userId, files.map(file => file._id.toString()));
            await UserRepository.deleteById(userId, mongooseSession);
            await Promise.all(files.map(async({ extension, _id }) => {
                await StorageService.deletePhysicalFile(_id.toString(), extension);
            }))
            await SessionRepository.deleteAllSessionsForUser(userId);
            await mongooseSession.commitTransaction();
        } catch (err){
            await mongooseSession.abortTransaction();
            throw err;
        } finally {
            await mongooseSession.endSession();
        }
    }
}