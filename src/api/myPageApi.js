const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ACCESS_TOKEN_KEY = "nailed_access_token";
const SESSION_KEY = "nailed_session";
const RECENTLY_VIEWED_KEY = "nailed_recently_viewed";

function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("nailedAccessToken");
  localStorage.removeItem("nailedRefreshToken");
  window.dispatchEvent(new Event("storage"));
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function getMemberId() {
  const session = readSession();
  return session?.member_id || session?.memberId || session?.id || null;
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    clearAuthStorage();
    throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string" ? data : data?.message || data?.error || "요청 처리에 실패했습니다.";
    throw new Error(message);
  }

  return data;
}

export function getCurrentMemberId() {
  return getMemberId();
}

export async function fetchMyProfile() {
  const data = await request("/api/members/me/profile");
  return data?.data ?? data;
}

export async function updateMyProfile(payload) {
  return request("/api/members/me/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchMyProducts() {
  return request("/api/members/me/products");
}

export async function updateMyProductStatus(productId, payload) {
  return request(`/api/products/${encodeURIComponent(productId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMyProduct(productId) {
  return request(`/api/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export async function fetchWishlist() {
  return request("/api/members/me/wishlist");
}

export async function deleteWishlist(productId) {
  return request(`/api/members/me/wishlist/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export async function fetchOrders() {
  return request("/api/members/me/orders");
}

export async function fetchSettlements() {
  return request("/api/members/me/settlements");
}

export async function withdrawMe() {
  return request("/api/members/me", {
    method: "DELETE",
  });
}

export function fetchRecentlyViewed() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, 10) : [];
  } catch {
    return [];
  }
}
