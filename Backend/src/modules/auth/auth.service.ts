import mongoose, { Types } from "mongoose";
import { UserRepository } from "../user/user.repository.js";
import type { UserData } from "./auth.types.js";
import { DirectoryRepository } from "../directory/directory.repository.js";
import crypto from "crypto";
import argon2 from "argon2";
import { OtpRepository } from "./otp.repository.js";
import { Resend } from "resend";
import { env } from "../../config/env.js";
import type { DirectoryMetadata } from "../directory/directory.types.js";

export class AuthService {
  static async registerUser(
    name: string,
    email: string,
    password: string,
  ): Promise<string> {
    const isUserExists = await UserRepository.isEmailExists(email);
    if (isUserExists) {
      throw new Error("User with this email already exists");
    }
    const mongooseSession = await mongoose.startSession();
    try {
      mongooseSession.startTransaction();
      const userId = new Types.ObjectId();
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
        password,
        hasPassword: false,
        rootDirectory: directoryData._id,
      };
      await UserRepository.createUser(userData, mongooseSession);
      await DirectoryRepository.createDirectory(directoryData, mongooseSession);
      await mongooseSession.commitTransaction();
      return userId.toString();
    } catch (err) {
      await mongooseSession.abortTransaction();
      throw err;
    } finally {
      mongooseSession.endSession();
    }
  }

  static async validateUser(
    email: string,
    password: string,
  ): Promise<string | null> {
    const user = await UserRepository.findByEmail(email);
    if (!user) return null;
    if (user.isDisabled) throw new Error("User is disabled");
    const isPasswordCorrect = user.comparePassword(password);
    if (!isPasswordCorrect) return null;
    return user._id.toString();
  }

  static readonly #resendClient = new Resend(env.RESEND_API_KEY);

  static async #createOtp(email: string) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = await argon2.hash(otp);
    await OtpRepository.saveOtp(email, hashedOtp, 5 * 60);
    return otp;
  }

  static async sendOtp(email: string) {
    const otp = await this.#createOtp(email);
    const messageHtml = `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your SwiftStash Login Code</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                <td align="center">
                    
                    <!-- Clean, rounded card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Purple & Blue Gradient Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">SwiftStash</h1>
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td align="center" style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 12px 0; font-size: 22px; color: #27272a; font-weight: 600;">Here is your login code</h2>
                        
                        <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.5; color: #52525b;">
                            Enter the code below to access your files.
                        </p>
                        
                        <!-- Centered, highlighted OTP -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 30px auto;">
                            <tr>
                            <td align="center" style="background-color: #f3e8ff; border-radius: 12px; padding: 16px 32px;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6d28d9;">${otp}</span>
                            </td>
                            </tr>
                        </table>

                        <p style="margin: 0; font-size: 14px; color: #71717a;">
                            This code expires in 10 minutes.
                        </p>
                        </td>
                    </tr>
                    
                    <!-- Minimal Footer -->
                    <tr>
                        <td align="center" style="background-color: #fafafa; padding: 20px; border-top: 1px solid #e4e4e7;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa;">
                            Didn't request this? You can safely ignore this email.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                            &copy; 2026 SwiftStash
                        </p>
                        </td>
                    </tr>

                    </table>
                    
                </td>
                </tr>
            </table>

            </body>
            </html>`;
    

    const { data, error } = await this.#resendClient.emails.send({
      from: 'SwiftStash <security@auth.swiftstash.app>',
      to: [email],
      subject: 'Your Email Verification Code',
      html: messageHtml,
    });
    if(error){
        console.log(error);
        await OtpRepository.deleteOtp(email);
    }

    console.log({ data });
  }

  static async verifyOtp(email : string, otp : string) : Promise<boolean> {
    const hashedOtp = await OtpRepository.getOtp(email);
    console.log({ hashedOtp });
    if(!hashedOtp) return false;
    const isVerified = await argon2.verify(hashedOtp, otp);
    console.log({ isVerified });
    return isVerified;
  }
}
