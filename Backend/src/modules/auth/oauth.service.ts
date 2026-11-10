import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { UserRepository } from "../user/user.repository.js";
import { SessionRepository } from "./session.repository.js";
import type { UserData } from "./auth.types.js";
import mongoose, { Types } from "mongoose";
import { DirectoryRepository } from "../directory/directory.repository.js";
import type { DirectoryMetadata } from "../directory/directory.types.js";

export class OAuthService {
    static readonly #googleClient = new OAuth2Client({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectUri: "postmessage"
    })

    static async fetchUserFromGoogle(code: string) {
        const { tokens } = await this.#googleClient.getToken(code);
        const loginTicket = await this.#googleClient.verifyIdToken({
            idToken: tokens.id_token!,
            audience: env.GOOGLE_CLIENT_ID
        });
        const payload = loginTicket.getPayload();
        if (!payload) {
            throw new Error("Failed to fetch user from Google");
        }
        return payload;
    }

    static async handleLogin(name: string, email: string, picture: string) {
        const user = await UserRepository.findByEmail(email);
        if (user) {
            if(user.picture.includes("ui-avatars.com")) {
                await UserRepository.updateProfilePicture(user._id.toString(), picture);
            }
            await SessionRepository.enforceDeviceLimit(user._id.toString(), 2);
            const sessionId = await SessionRepository.createSession(user._id.toString(), 7 * 24 * 60 * 60);
            return sessionId;
        }
        const mongooseSession = await mongoose.startSession();
        const userId = new Types.ObjectId();
        try {
            mongooseSession.startTransaction();
            const directoryData: DirectoryMetadata = {
                _id: new Types.ObjectId(),
                name: `root-${email}`,
                type: "directory",
                parentDirectoryId: null,
                userId: userId,
                isShared: false,
            };
            const userData: UserData = {
                _id: userId,
                name,
                email,
                picture,
                hasPassword: false,
                rootDirectory: directoryData._id,
                currentStorageSize: 0,
                maxStorageSize: 1073741824,
            };
            await UserRepository.createUser(userData, mongooseSession);
            await DirectoryRepository.createDirectory(directoryData, mongooseSession);
            await mongooseSession.commitTransaction();
        } catch (err) {
            if (mongooseSession.inTransaction()) {
                await mongooseSession.abortTransaction();
            }
            throw err;
        } finally {
            await mongooseSession.endSession();
        }
        await SessionRepository.enforceDeviceLimit(userId.toString(), 2);
        const sessionId = await SessionRepository.createSession(userId.toString(), 7 * 24 * 60 * 60);
        return sessionId;
    }
}
