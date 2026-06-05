import axios from "axios";
import { authRequest } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

async function request(path, params) {
  try {
    const response = await instance.get(path, { params });
    const data = response.data;
    return data?.data ?? data;
  } catch (error) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data ||
      "요청 처리에 실패했습니다.";
    throw new Error(typeof message === "string" ? message : "요청 처리에 실패했습니다.");
  }
}

export async function getSellerReviews(memberId, page = 0, size = 10) {
  return request(`/api/users/${encodeURIComponent(memberId)}/reviews`, { page, size });
}

export async function writeReview({ orderId, rating, content }) {
  return authRequest("/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      rating,
      content: content || null,
    }),
  });
}
