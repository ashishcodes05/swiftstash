import type { NextFunction, Request, Response } from "express";

const rateLimitMap = new Map<string, { tokens: number, lastUpdated: number }>();

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [identifier, bucket] of rateLimitMap.entries()) {
    if (now - bucket.lastUpdated > CLEANUP_INTERVAL_MS) {
      rateLimitMap.delete(identifier);
    }
  }
}, CLEANUP_INTERVAL_MS);

export const rateLimiter = (options : {capacity: number, refillRate: number}) => {
    const { capacity, refillRate } = options;
    return (req : Request, res : Response, next : NextFunction) => {
        const ip = req.ip!;
        const now = Date.now();

        if(!rateLimitMap.has(ip)){
            rateLimitMap.set(ip, { tokens: capacity, lastUpdated: now });
        }

        const userBucket = rateLimitMap.get(ip)!;
        const timeElapsed = (now - userBucket.lastUpdated) / 1000;
        const tokensToAdd = Math.floor(timeElapsed * refillRate);
        if(tokensToAdd > 0){
            userBucket.tokens = Math.min(capacity, userBucket.tokens + tokensToAdd);
            userBucket.lastUpdated = now;
        }

        res.setHeader('X-RateLimit-Limit', capacity);

        if(userBucket.tokens > 0){
            userBucket.tokens -= 1;
            res.setHeader('X-RateLimit-Remaining', userBucket.tokens);
            next();
        } else {
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('Retry-After', Math.ceil(1 / refillRate));
            res.status(429).json({ success: false, error: "Too many requests. Please try again later." });
        }
    }
}