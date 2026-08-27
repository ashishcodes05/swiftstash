import type { ClientSession } from "mongoose";
import User from "./user.model.js";
import type { UserData, UserMetadata } from "./user.types.js";


export class UserRepository {
    static async checkUserExists(email: string): Promise<boolean> {
        const user = await User.findOne({ email }).select("email").lean();
        return !!user;
    }
    static async createUser(userData: UserData, session?: ClientSession) {
        const user = new User(userData);
        if(session) {
            return await user.save({ session });
        }
        return await user.save();
    }

    static async findByEmail(email: string) {
        return await User.findOne({ email }).select("+password");
    }

    static async isEmailExists(email: string) {
        const user = await User.findOne({ email }).select("email hasPassword isDisabled").lean();
        if(!user) return false;
        if(user.isDisabled) throw new Error("User is disabled");
        return true;
    }

    static async findById(userId: string) {
        return await User.findById(userId).select("+password hasPassword isDisabled");
    }

    static async updatePassword(userId: string, newPassword: string) {
        const user = await User.findById(userId).select("+password");
        if(!user) return false;
        user.password = newPassword;
        user.hasPassword = true;
        await user.save();
        return true;
    }

    static async validatePassword(userId: string, password: string) {
        const user = await User.findById(userId).select("+password +hasPassword");
        if(!user) return false;
        return user.comparePassword(password);
    }

    static async getUserMetadata(userId: string) {
        return (await User.findById(userId).select("name email picture hasPassword role isDisabled isDeleted currentStorageSize maxStorageSize").lean()) as UserMetadata | null;
    }

    static async updateStorageSize(userId: string, deltaSize: number) {
        return await User.updateOne({ _id: userId }, { $inc: { currentStorageSize: deltaSize } });
    }

    static async updateProfilePicture(userId: string, pictureUrl: string) {
        const result = await User.updateOne({ _id: userId }, { $set: { picture: pictureUrl } });
        return result.modifiedCount > 0;
    }

    static async getRootDirectoryById(userId: string) {
        const user = await User.findById(userId).select("rootDirectory").lean();
        if(!user) return undefined;
        return user.rootDirectory.toString();
    }

    static async deleteById(userId: string, session?: ClientSession) {
        if(session) {
            return await User.deleteOne({ _id: userId }, { session });
        }
        return await User.deleteOne({ _id: userId });
    }
}