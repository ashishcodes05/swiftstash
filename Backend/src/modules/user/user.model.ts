import { Model, model, Schema } from "mongoose";
import argon2 from "argon2";
import { env } from '../../config/env.js';
import type { UserMethods, UserSchema } from "./user.types.js";

const userSchema = new Schema<UserSchema, Model<UserSchema, {}, UserMethods>, UserMethods>({
    name: {
        type: String,
        minlength: [3, 'Name must be at least 3 characters long'],
        trim: true,
        required: true,
    },
    email: {
        type: String,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address'],
        trim: true,
        unique: true,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        minlength: [8, 'Password must be at least 8 characters long'],
        trim: true,
        select: false,
    },
    hasPassword: {
        type: Boolean,
        default: false,
    },
    picture: {
        type: String,
        trim: true,
        default: function () {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
        },
    },
    rootDirectory: {
        type: Schema.Types.ObjectId,
        ref: 'Directory',
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    currentStorageSize: {
        type: Number,
        default: 0,
    },
    maxStorageSize: {
        type: Number,
        default: 1073741824, // 1 GB in bytes
    },
    isDisabled: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { 
    timestamps: true,
    strict: true,
    methods: {
        comparePassword : async function(candidatePassword : string) : Promise<boolean> {
            try {
                if(!this.password || this.password.trim() === ""){
                    return false;
                }
                return await argon2.verify(this.password, candidatePassword, {secret: Buffer.from(env.ARGON_SECRET) });
            } catch (err){
                console.log("Error in Compare Password method");
                return false;
            }
        }
    }
 });

userSchema.pre('save', async function () {
    if (this.isModified('password') && this.password && this.password.trim() != "") {
        try {
            this.password = await argon2.hash(this.password, { secret: Buffer.from(env.ARGON_SECRET) });
        } catch (error) {
            console.log('Error hashing password:', error);
        }
    }
});

const User = model('User', userSchema);

export default User;