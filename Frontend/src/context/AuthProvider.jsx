import { useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import MainLoader from "../components/MainLoader.jsx";
import axiosClient from "../api/axiosInstance.js";
import { getLandingLoginUrl } from "../config/navigation.js";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const redirectStarted = useRef(false);

    useEffect(() => {
        const redirectToLandingLogin = () => {
            if (redirectStarted.current) return;
            const loginUrl = getLandingLoginUrl();
            if (!loginUrl) {
                console.error("VITE_LANDING_ORIGIN must be configured to redirect to login.");
                return;
            }
            if (window.location.href === loginUrl) return;
            redirectStarted.current = true;
            window.location.replace(loginUrl);
        };

        const fetchUser = async () => {
            try {
                const response = await axiosClient.get("/auth/me");
                const restoredUser = response.data?.success ? response.data.data : null;
                if (restoredUser) setUser(restoredUser);
                else redirectToLandingLogin();
            } catch(error) {
                setUser(null);
                console.error("Error fetching user:", error.response?.data || error.message);
                redirectToLandingLogin();
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
