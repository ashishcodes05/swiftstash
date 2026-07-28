import { rm } from "node:fs/promises";

export class StorageService {
    static async getFilePath(fileId: string, extension: string) {
        const basePath = process.cwd();
        const filePath = `${basePath}/Storage/${fileId}${extension}`;
        return filePath;
    }

    static async deletePhysicalFile(fileId: string, extension: string) {
        const filePath = await this.getFilePath(fileId, extension);
        try {
            await rm(filePath);
        } catch (err) {
            console.error(`Error deleting file: ${filePath}`, err);
            throw err;
        }
    }
}