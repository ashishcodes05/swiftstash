import { FileRepository } from "../file/file.repository.js";
import { StorageService } from "../file/storage.service.js";
import { DirectoryRepository } from "./directory.repository.js";
import { UserRepository } from "../user/user.repository.js";

export class DirectoryService {
    static async getDirectoryItems(userId: string, directoryId: string) {
        const directories = await DirectoryRepository.getDirectoriesWithOwner(directoryId, userId);
        const files = await FileRepository.getFilesWithOwner(directoryId, userId);
        const ancestors = await DirectoryRepository.getAncestorsWithNamesById(userId, directoryId);
        if (ancestors.length === 0) {
            return { directories, files, path: [{ _id: "root", name: "My Drive" }] };
        }
        const path = [{ _id: "root", name: "My Drive" }];
        path.push(...ancestors.filter((ancestor) => !ancestor.name.startsWith("root-")));
        const currentDirectoryName = await DirectoryRepository.getNameById(userId, directoryId);
        if (currentDirectoryName) {
            path.push({ _id: directoryId, name: currentDirectoryName });
        }
        return { directories, files, path };
    }

    static async createDirectory(userId: string, directoryName: string, parentDirectoryId: string) {
        const ancestors = await DirectoryRepository.getAncestorsById(userId, parentDirectoryId);
        ancestors.push(parentDirectoryId);
        const directory = await DirectoryRepository.insertDirectory(directoryName, userId, parentDirectoryId, ancestors);
        return directory;
    }

    static async updateParentDirectorySize(userId: string, parentDirectoryId: string, deltaSize: number) {
        if(!parentDirectoryId) return;
        const ancestorIds = await DirectoryRepository.getAncestorsById(userId, parentDirectoryId);
        ancestorIds.push(parentDirectoryId);
        await DirectoryRepository.updateSizeByIds(ancestorIds, deltaSize);
    }

    static async renameDirectory(userId: string, directoryId: string, newName: string) {
        const directory = await DirectoryRepository.getNameById(userId, directoryId);
        if(!directory) return false;
        if(directory === newName) return true;
        const result = await DirectoryRepository.updateDirectoryName(userId, directoryId, newName);
        return result.modifiedCount > 0;
    }

    static async #recursiveDeleteDirectory(userId: string, directoryId: string) {
        const allFiles : { _id: string; extension: string; size: number; parentDirectoryId: string; isUploading: boolean }[] = [], allDirectories : { _id: string, name: string }[] = [];
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
        allFiles.push(...(files.map(file => ({
            _id: file._id.toString(),
            extension: file.extension,
            size: file.size,
            parentDirectoryId: file.parentDirectoryId.toString(),
            isUploading: file.isUploading
        }))));
        return { files: allFiles, directories: allDirectories };
    }

    static async deleteDirectory(userId: string, directoryId: string) {
        const { files, directories } = await this.#recursiveDeleteDirectory(userId, directoryId);
        const uniqueFiles = [...new Map(files.map(file => [file._id, file])).values()];
        const directoryIds = [...new Set(directories.map(dir => dir._id))];
        directoryIds.push(directoryId);
        if(uniqueFiles.length > 0){
            const fileIds = uniqueFiles.map(file => file._id);
            await FileRepository.deleteFilesByIds(userId, fileIds);
            await Promise.all(
                uniqueFiles.map(async(file) => {
                    await StorageService.deletePhysicalFile(file._id, file.extension);
                    await DirectoryService.updateParentDirectorySize(userId, file.parentDirectoryId, -file.size);
                })
            )
            const allocatedSize = uniqueFiles
                .filter(file => !file.isUploading)
                .reduce((total, file) => total + file.size, 0);
            if (allocatedSize > 0) {
                await UserRepository.updateStorageSize(userId, -allocatedSize);
            }
        }
        await DirectoryRepository.deleteManyDirectories(userId, directoryIds);
    }

    static async deleteMultipleDirectories(userId: string, directoryIds: string[]) {
        const allFiles : { _id: string; extension: string; size: number; parentDirectoryId: string; isUploading: boolean }[] = [], allDirectories : { _id: string, name: string }[] = [];
        await Promise.all(
            directoryIds.map(async(directoryId) => {
                const { files, directories } = await this.#recursiveDeleteDirectory(userId, directoryId);
                allFiles.push(...files);
                allDirectories.push(...directories);
            })
        )
        const uniqueFiles = [...new Map(allFiles.map(file => [file._id, file])).values()];
        const allDirectoryIds = [...new Set(allDirectories.map(dir => dir._id))];
        allDirectoryIds.push(...directoryIds);
        if(uniqueFiles.length > 0){
            const fileIds = uniqueFiles.map(file => file._id);
            await FileRepository.deleteFilesByIds(userId, fileIds);
            await Promise.all(
                uniqueFiles.map(async(file) => {
                    await StorageService.deletePhysicalFile(file._id, file.extension);
                    await DirectoryService.updateParentDirectorySize(userId, file.parentDirectoryId, -file.size);
                })
            )
            const allocatedSize = uniqueFiles
                .filter(file => !file.isUploading)
                .reduce((total, file) => total + file.size, 0);
            if (allocatedSize > 0) {
                await UserRepository.updateStorageSize(userId, -allocatedSize);
            }
        }
        await DirectoryRepository.deleteManyDirectories(userId, allDirectoryIds);
    }
}
