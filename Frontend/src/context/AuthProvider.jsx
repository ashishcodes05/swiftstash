import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import MainLoader from "../components/MainLoader.jsx";
import axiosClient from "../api/axiosInstance.js";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axiosClient.get("/auth/me");
                if (response.data.success) {
                    console.log("User fetched successfully:", response.data.data);
                    setUser(response.data.data); 
                }
            } catch(error) {
                console.error("Error fetching user:", error.response?.data || error.message);
                window.location.href = "http://localhost:5174/login";
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