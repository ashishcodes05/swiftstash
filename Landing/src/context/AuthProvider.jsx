import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import MainLoader from "../components/MainLoader.jsx";
import axiosClient from "../api/axiosInstance.js";
import { getRestoredUser } from "../config/navigation.js";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axiosClient.get("/auth/me");
                setUser(getRestoredUser(response));
            } catch(error) {
                setUser(null);
                if (error.response?.status !== 401) {
                    console.error("Error fetching user:", error.response?.data || error.message);
                }
            } finally {
                setIsLoading(false);
            }
        }
        fetchUser();
    }, []);

    const value = { user, setUser };

    return (
        <AuthContext.Provider value={value}>
            {isLoading ? <MainLoader /> : children}
        </AuthContext.Provider>
    );
};
