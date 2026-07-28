
import redisClient from "../../config/connectRedis.js";
export class OtpRepository {
    static async getOtp(email : string) {
        const key = `swiftstash:${email}`;
        const otp = await redisClient.get(key);
        return otp;
    }

    static async saveOtp(email : string, otp : string, ttl : number) {
        const key = `swiftstash:${email}`;
        await redisClient.set(key, otp, {
            expiration: {
                type: "EX",
                value: ttl
            }
        });
        return otp;
    }

    static async deleteOtp(email : string) {
        const key = `swiftstash:${email}`;
        await redisClient.del(key);
    }
}