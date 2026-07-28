import type { ClientSession } from "mongoose";
import type { DirectoryMetadata } from "./directory.types.js";
import Directory from "./directory.model.js";
import type { UserProfile } from "../user/user.types.js";
import type { QueryOptions } from "../../types/repository.types.js";

export class DirectoryRepository {
    static async createDirectory(directoryData: DirectoryMetadata, session?: ClientSession) {
        const directory = new Directory(directoryData);
        if(session) {
            return await directory.save({ session });
        }
        return await directory.save();
    }

    static async insertDirectory(directoryName: string, userId: string, parentDirectoryId: string) {
        return await Directory.findOneAndUpdate(
            { name: directoryName, parentDirectoryId, userId },
            { $setOnInsert: { name: directoryName, parentDirectoryId, userId } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
    }

    static async getNameById(userId: string, directoryId: string) {
        const directoryData = await Directory.findOne({ _id: directoryId, userId }).select("name").lean();
        if(!directoryData) return null;
        return directoryData.name;
    }

    static async getNestedDirectories(userId: string, parentDirectoryId: string) {
        return await Directory.find({ parentDirectoryId, userId }).select("name _id").lean();
    }

    static async getDirectoriesWithOwner(parentDirectoryId: string, userId: string) {
        return await Directory.find({ parentDirectoryId: parentDirectoryId, userId }).select("-parentDirectoryId").populate<{ userId: UserProfile }>("userId", "_id name email picture").lean();
    }

    static async updateDirectoryName(userId: string, directoryId: string, newName: string) {
        const result = await Directory.updateOne({ _id: directoryId, userId }, { $set: { name: newName } });
        return result;
    }

    static async deleteManyDirectories(userId: string, directoryIds: string[]) {
        return await Directory.deleteMany({ _id: { $in: directoryIds }, userId });
    }

    static async deleteByUserId(userId: string, session?: ClientSession) {
        if(session) {
            return await Directory.deleteMany({ userId }, { session });
        }
        return await Directory.deleteMany({ userId });
    }
}