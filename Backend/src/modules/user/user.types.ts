import type { Types } from "mongoose";
import type { SetOptional, Simplify } from "type-fest";

export interface UserSchema {
    name: string;
    email: string;
    password: string;
    hasPassword: boolean;
    picture: string;
    rootDirectory: Types.ObjectId;
    role: 'user' | 'admin';
    currentStorageSize?: number;
    maxStorageSize?: number;
    isDisabled: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type UserData = Simplify<{_id: Types.ObjectId} & SetOptional<UserSchema, 'password' | 'hasPassword' | 'picture' | 'role' | 'isDisabled' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'currentStorageSize' | 'maxStorageSize'>>;
export type UserMetadata = Simplify<Omit<UserData, 'password' | 'hasPassword' | 'rootDirectory'>>;
export type UserProfile = Simplify<Required<Pick<UserData, '_id' | 'name' | 'email' | 'picture'>>>;

export interface UserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}