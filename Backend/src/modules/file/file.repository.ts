import type { UserProfile } from "../user/user.types.js";
import File from "./file.model.js";
import type { FileMetadata } from "./file.types.js";

export class FileRepository {
    static async getFileById(userId: string, fileId: string) {
        return await File.findOne({_id: fileId, userId}).select("name type extension size parentDirectoryId updatedAt createdAt").lean()
    }

    static async getExtensionById(userId: string, fileId: string) {
        const fileData = await File.findOne({_id: fileId, userId}).select("extension").lean();
        if(!fileData) return null;
        return fileData.extension;
    }

    static async updateFileName(userId: string, fileId: string, newName: string) {
        const result = await File.updateOne({_id: fileId, userId}, { $set: { name: newName } });
        return result.modifiedCount > 0;
    }

    static async findByIdAndDelete(userId: string, fileId: string) {
        return await File.findOneAndDelete({_id: fileId, userId}).select("_id extension size parentDirectoryId isUploading").lean();
    }

    static async findFilesByIdsAndDelete(userId: string, fileIds: string[]) {
        const filesData = await File.find({ _id: { $in: fileIds }, userId }).select("_id extension size parentDirectoryId isUploading").lean();
        if(!filesData || filesData.length === 0) return null;
        await File.deleteMany({ _id: { $in: fileIds }, userId });
        return filesData;
    }

    static async saveFileMetadata(fileData: FileMetadata) {
        const file = new File(fileData);
        return await file.save();
    }

    static async getFilesByDirectoryId(userId: string, directoryId: string) {
        return await File.find({ parentDirectoryId: directoryId, userId }).select("_id extension size parentDirectoryId isUploading").lean();
    }

    static async getFilesWithOwner(directoryId: string, userId: string) {
        return await File.find({ parentDirectoryId: directoryId, userId }).select("-parentDirectoryId").populate<{ userId: UserProfile }>("userId", "_id name email picture").lean();
    }

    static async deleteFilesByIds(userId: string, fileIds: string[]) {
        return await File.deleteMany({ _id: { $in: fileIds }, userId });
    }

    static async getFilesByUserId(userId: string) {
        return await File.find({ userId }).select("extension _id").lean();
    }

    static async updateUploadStatus(userId: string, fileId: string, isUploading: boolean) {
        const result = await File.updateOne({ _id: fileId, userId }, { $set: { isUploading } });
        return result.modifiedCount > 0;
    }

    static async deleteUploadingFile(userId: string, fileId: string) {
        return await File.findOneAndDelete({ _id: fileId, userId, isUploading: true })
            .select("_id extension parentDirectoryId")
            .lean();
    }
    
}