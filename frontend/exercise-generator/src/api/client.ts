import axios from "axios";

export const rootURL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: rootURL
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token){
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // mark it before retrying
      try {
        const refresh = localStorage.getItem("refresh_token");
        const response = await axios.post(`${rootURL}/token/refresh/`, { refresh });
        localStorage.setItem("access_token", response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
)

export default apiClient;