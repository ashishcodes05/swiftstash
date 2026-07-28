import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";

export const zodValidationMiddleware = (schema : ZodObject<any>) => {
    return async (req : Request, res : Response, next : NextFunction) => {
        const validationResult = await schema.safeParseAsync({
            body: req.body,
            query: req.query,
            params: req.params
        });
        if (!validationResult.success) {
            console.log(validationResult.error.issues);
            return res.status(400).json({ error: "Invalid Input" });
        }
        if(validationResult.data.body) req.body = validationResult.data.body;
        if(validationResult.data.query) req.query = validationResult.data.query as any;
        if(validationResult.data.params) req.params = validationResult.data.params as any;
        next();
    }
}
