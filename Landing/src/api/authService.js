import axiosClient from "./axiosInstance.js"

export const registerUser = async ({ email, password, username }) => {
    try {
        const response = await axiosClient.post("/auth/register", {
        email,
        password,
        name : username
        })
        return response.data;
    } catch (error) {
        throw error?.response?.data;
    }
}

export const loginUser = async ({ email, password }) => {
    try {
        const response = await axiosClient.post("/auth/login", {
            email,
            password
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data;
    }
}

export const loginWithGoogle = async (code) => {
    try {
        const response = await axiosClient.post("/auth/google-login", {
            code
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data;
    }
}