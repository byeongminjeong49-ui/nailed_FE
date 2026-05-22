import { authRequest } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.error?.message || data?.message || "요청 처리에 실패했습니다.";
    throw new Error(message);
  }
  return data?.data ?? data;
}

export async function getSellerReviews(memberId, page = 0, size = 10) {
  const params = new URLSearchParams({ page, size });
  return request(`/api/users/${encodeURIComponent(memberId)}/reviews?${params.toString()}`);
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
