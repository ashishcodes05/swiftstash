import { FileRepository } from "../file/file.repository.js";
import { StorageService } from "../file/storage.service.js";
import { DirectoryRepository } from "./directory.repository.js";

export class DirectoryService {
    static async getDirectoryItems(userId: string, directoryId: string) {
        const directories = await DirectoryRepository.getDirectoriesWithOwner(directoryId, userId);
        const files = await FileRepository.getFilesWithOwner(directoryId, userId);
        return { directories, files };
    }

    static async createDirectory(userId: string, directoryName: string, parentDirectoryId: string) {
        const directory = await DirectoryRepository.insertDirectory(directoryName, userId, parentDirectoryId);
        return directory;
    }

    static async renameDirectory(userId: string, directoryId: string, newName: string) {
        const directory = await DirectoryRepository.getNameById(userId, directoryId);
        if(!directory) return false;
        if(directory === newName) return true;
        const result = await DirectoryRepository.updateDirectoryName(userId, directoryId, newName);
        return result.modifiedCount > 0;
    }

    static async #recursiveDeleteDirectory(userId: string, directoryId: string) {
        const allFiles : { _id: string; extension: string }[] = [], allDirectories : { _id: string, name: string }[] = [];
        const directories = (await DirectoryRepository.getNestedDirectories(userId, directoryId));
        allDirectories.push(...(directories.map(dir => ({ _id: dir._id.toString(), name: dir.name }))));
        await Promise.all(
            directories.map(async(directory) => {
                const childItems = await this.#recursiveDeleteDirectory(userId, directory._id.toString());
                allFiles.push(...childItems.files);
                allDirectories.push(...childItems.directories);
            })
        )
        const files = await FileRepository.getFilesByDirectoryId(userId, directoryId);
        allFiles.push(...(files.map(file => ({ _id: file._id.toString(), extension: file.extension }))));
        return { files: allFiles, directories: allDirectories };
    }

    static async deleteDirectory(userId: string, directoryId: string) {
        const { files, directories } = await this.#recursiveDeleteDirectory(userId, directoryId);
        const directoryIds = directories.map(dir => dir._id);
        directoryIds.push(directoryId);
        if(files.length > 0){
            const fileIds = files.map(file => file._id);
            await FileRepository.deleteFilesByIds(userId, fileIds);
            await Promise.all(
                files.map(async(file) => {
                    await StorageService.deletePhysicalFile(file._id, file.extension);
                })
            )
        }
        await DirectoryRepository.deleteManyDirectories(userId, directoryIds);
    }

    static async deleteMultipleDirectories(userId: string, directoryIds: string[]) {
        const allFiles : { _id: string; extension: string }[] = [], allDirectories : { _id: string, name: string }[] = [];
        await Promise.all(
            directoryIds.map(async(directoryId) => {
                const { files, directories } = await this.#recursiveDeleteDirectory(userId, directoryId);
                allFiles.push(...files);
                allDirectories.push(...directories);
            })
        )
        const allDirectoryIds = allDirectories.map(dir => dir._id);
        allDirectoryIds.push(...directoryIds);
        if(allFiles.length > 0){
            const fileIds = allFiles.map(file => file._id);
            await FileRepository.deleteFilesByIds(userId, fileIds);
            await Promise.all(
                allFiles.map(async(file) => {
                    await StorageService.deletePhysicalFile(file._id, file.extension);
                })
            )
        }
        await DirectoryRepository.deleteManyDirectories(userId, allDirectoryIds);
    }
}