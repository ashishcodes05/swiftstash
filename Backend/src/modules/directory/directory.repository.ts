import type { ClientSession } from "mongoose";
import type { DirectoryMetadata, PopulatedAncestor } from "./directory.types.js";
import Directory from "./directory.model.js";
import type { UserProfile } from "../user/user.types.js";

export class DirectoryRepository {
    static async createDirectory(directoryData: DirectoryMetadata, session?: ClientSession) {
        const directory = new Directory(directoryData);
        if(session) {
            return await directory.save({ session });
        }
        return await directory.save();
    }

    static async insertDirectory(directoryName: string, userId: string, parentDirectoryId: string, ancestors: string[]) {
        return await Directory.findOneAndUpdate(
            { name: directoryName, parentDirectoryId, userId },
            { $setOnInsert: { name: directoryName, parentDirectoryId, userId, ancestors } },
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
        return await Directory.find({ parentDirectoryId: parentDirectoryId, userId }).select("-parentDirectoryId").populate<{ userId: UserProfile}>([{ path: "userId", select: "_id name email picture" }]).lean();
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

    static async getAncestorsById(userId: string, directoryId: string) {
        const directory = await Directory.findOne({ _id: directoryId, userId }).select("ancestors").lean();
        if(!directory) return [];
        return directory.ancestors.map((id) => id.toString());
    }

    static async getAncestorsWithNamesById(userId: string, directoryId: string) {
        const directory = await Directory.findOne({ _id: directoryId, userId }).select("ancestors").populate<{ ancestors: PopulatedAncestor[] }>([{ path: "ancestors", select: "_id name" }]).lean();
        if(!directory) return [];
        return directory.ancestors.map((ancestor) => ({ _id: ancestor._id.toString(), name: ancestor.name }));
    }

    static async updateSizeByIds(ancestorIds: string[], deltaSize: number, session?: ClientSession) {
        if(session) {
            return await Directory.updateMany({ _id: { $in: ancestorIds } }, { $inc: { size: deltaSize } }, { session });
        }
        return await Directory.updateMany({ _id: { $in: ancestorIds } }, { $inc: { size: deltaSize } });
    }
}