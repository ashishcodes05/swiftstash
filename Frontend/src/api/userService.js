import axiosClient from "./axiosInstance"

export const updatePassword = async (currentPassword, newPassword) => {
    const response = await axiosClient.post("/user/update-password", {
        currentPassword,
        newPassword
    });
    return response;
}

export const setPassword = async (newPassword) => {
    const response = await axiosClient.post("/user/set-password", {
        newPassword
    });
    return response;
}