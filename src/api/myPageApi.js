import { authRequest } from "./authApi";

const SESSION_KEY = "nailed_session";
const RECENTLY_VIEWED_KEY = "nailed_recently_viewed";

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function getMemberId() {
  const session = readSession();
  return session?.member_id || session?.memberId || session?.id || null;
}

async function request(path, options = {}) {
  return authRequest(path, options);
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
  return request("/api/members/mypage/settlements?page=0&size=20");
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
