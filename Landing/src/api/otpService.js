import axiosClient from "./axiosInstance.js";

export const generateOtp = async (email) => {
    try {
        const response = await axiosClient.post("/auth/generate-otp", {
            email
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data;
    }
}

export const verifyOtp = async (email, otp) => {
    try {
        const response = await axiosClient.post("/auth/verify-otp", {
            email,
            otp
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data;
    }
}