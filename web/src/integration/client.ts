import axios, { type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/lib/config";

/** Single axios instance for the API; base URL already includes /api/v1. */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
