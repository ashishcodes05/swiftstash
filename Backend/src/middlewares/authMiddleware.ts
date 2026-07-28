import type { NextFunction, Request, Response } from "express";
import redisClient from "../config/connectRedis.js";
import User from "../modules/user/user.model.js";
import type { SessionSchema } from "../modules/auth/auth.types.js";

export const authMiddleware = async (req : Request, res: Response, next: NextFunction) => {
    const sessionId : string | undefined = req.signedCookies.sid;
    if(!sessionId){
        res.clearCookie("sid");
        return res.status(401).json({ success: false, error: "UnAuthorised! Please Log in to access"});
    }
    const result = (await redisClient.json.get(`swiftstash:session:${sessionId}`, {
        path: "$"
    })) as SessionSchema[];
    if(!result || result.length == 0 || !result[0]){
        return res.status(401).json({ success: false, error: "Previous Session has expired. Please sign in again."});
    }
    const sessionData = result[0];
    const user = await User.findById(sessionData.userId).select("_id").lean();
    if(!user){
        return res.status(401).json({success: false, error: "Please create an account to continue."});
    }
    req.userId = user._id.toString();
    next();
}