import axiosClient from "./axiosInstance.js"

export const getDirectoryContents = async (directoryId) => {
    try {
         const response = await axiosClient.get(`/directory/${directoryId || ""}`)
         return response.data
    } catch (error) {
        console.error("Error fetching directory contents:", error)
        throw error?.response?.data || { message: "An error occurred while fetching directory contents." }
    }
}

export const createDirectory = async (parentDirectoryId, directoryName) => {
    try {
        const response = await axiosClient.post(`/directory/${parentDirectoryId || ""}`, {
            directoryName
        })
        return response.data
    } catch (error) {
        console.error("Error creating directory:", error)
        throw error?.response?.data || { message: "An error occurred while creating the directory." }
    }
}

export const renameDirectory = async (directoryId, newDirectoryName) => {
    try {
        const response = await axiosClient.patch(`/directory/${directoryId}`, {
            newDirectoryName
        })
        return response.data
    } catch (error) {
        console.error("Error renaming directory:", error)
        throw error?.response?.data || { message: "An error occurred while renaming the directory." }
    }
}

export const deleteDirectory = async (directoryId) => {
    try {
        console.log("Deleting directory with ID:", directoryId)
        const response = await axiosClient.delete(`/directory/${directoryId}`)
        return response.data
    } catch (error) {
        console.error("Error deleting directory:", error)
        throw error?.response?.data || { message: "An error occurred while deleting the directory." }
    }
}

export const deleteMultipleDirectories = async (directoryIds) => {
    try {
        const response = await axiosClient.delete(`/directory/bulk-delete`, {
            data: {
                directoryIds : directoryIds
            }
        })
        return response.data
    } catch (error) {
        console.error("Error deleting multiple directories:", error)
        throw error?.response?.data || { message: "An error occurred while deleting the directories." }
    }
}