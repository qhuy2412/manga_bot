import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api/v1";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Hàm lấy cookie bằng JS thuần
const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
};

// Interceptor tự động gắn JWT token từ Cookie hoặc LocalStorage vào header Authorization
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = getCookie("admin_token") || localStorage.getItem("admin_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor xử lý lỗi 401 (Unauthorized) tự động xóa token và chuyển hướng về trang login
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== "undefined") {
                // Xóa cả Cookie và LocalStorage
                document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                localStorage.removeItem("admin_token");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);
