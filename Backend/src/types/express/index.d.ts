import type { Types } from "mongoose";

export {};

declare global {
  namespace Express {
    export interface Request {
      // Add your custom properties here
      userId?: string;
      sessionId?: string;
    }
  }
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        _id?: string; // Make it optional since it won't exist until you set it
        extension?: string;
      }
    }
  }
}