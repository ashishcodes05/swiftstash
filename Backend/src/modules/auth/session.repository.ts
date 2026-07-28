import redisClient from "../../config/connectRedis.js";
import type { SessionData } from "./auth.types.js";
import crypto from "crypto";

export class SessionRepository {
    static async createSession(userId: string, ttl: number) {
        const sessionData: SessionData = {
            sessionId: crypto.randomUUID(),
            userId,
            createdAt: new Date()
        }
        const sessionKey = `swiftstash:session:${sessionData.sessionId}`;
        await redisClient.json.set(sessionKey, '$', sessionData);
        await redisClient.expire(sessionKey, ttl);
        return sessionData.sessionId;
    }

    static async deleteSession(sessionId: string) {
        const sessionKey = `swiftstash:session:${sessionId}`;
        await redisClient.del(sessionKey);
    }

    static async enforceDeviceLimit(userId: string, limit: number) {
        const allSessions = await redisClient.ft.search("sessionIdx", `@userId:{${userId.toString()}}`, {
            RETURN: [],
            SORTBY: {
                BY: 'createdAt',
                DIRECTION: 'ASC'
            }
        })
        if(!allSessions || !allSessions.documents || allSessions.documents.length === 0) return;
        const sessionsToDelete = allSessions.documents.slice(0, Math.max(0, allSessions.documents.length - limit));
        const keysToDelete = (sessionsToDelete.map(session => session.id));
        if(keysToDelete.length > 0) {
            await redisClient.del(keysToDelete);
        }
    }

    static async deleteAllSessionsForUser(userId: string) {
        const allSessions = await redisClient.ft.search("sessionIdx", `@userId:{${userId.toString()}}`, {
            RETURN: [],
            SORTBY: {
                BY: 'createdAt',
                DIRECTION: 'ASC'
            }
        })
        if(!allSessions || !allSessions.documents || allSessions.documents.length === 0) return;
        const keysToDelete = (allSessions.documents.map(session => session.id));
        if(keysToDelete.length > 0) {
            await redisClient.del(keysToDelete);
        }
    }
}