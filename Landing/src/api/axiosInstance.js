import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true
})

export default axiosClient;