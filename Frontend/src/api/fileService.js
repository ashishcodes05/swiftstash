import axiosClient from "./axiosInstance"

export const getFileData = async (fileId) => {
    try {
        const response = await axiosClient.get(`/file/${fileId}`)
        return response.data
    } catch (error) {
        console.error("Error fetching file data:", error)
        throw error?.response?.data || { message: "An error occurred while fetching file data." }
    }
}

export const renameFile = async (fileId, newFileName) => {
    try {
        const response = await axiosClient.patch(`/file/${fileId}`, {
            newFileName
        })
        return response.data
    } catch (error) {
        console.error("Error renaming file:", error)
        throw error?.response?.data || { message: "An error occurred while renaming the file." }
    }
}

export const deleteFile = async (fileId) => {
    try {
        const response = await axiosClient.delete(`/file/${fileId}`)
        return response.data
    } catch (error) {
        console.error("Error deleting file:", error)
        throw error?.response?.data || { message: "An error occurred while deleting the file." }
    }
}

export const deleteMultipleFiles = async (fileIds) => {
    try {
        const response = await axiosClient.delete(`/file/bulk-delete`, {
            data: {
                fileIds : fileIds
            }
        })
        return response.data
    } catch (error) {
        console.error("Error deleting multiple files:", error)
        throw error?.response?.data || { message: "An error occurred while deleting the files." }
    }
}