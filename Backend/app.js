import argon2 from "argon2";
import dotenv from "dotenv";
dotenv.config();
const hp = await argon2.hash("ashish@123", {
    secret: Buffer.from("6fbfdff60a939f9de9c3226cf366b0b9eac1cc65fd95ecc08dcad71e35427e51"),
})
console.log("Hashed password:", hp);