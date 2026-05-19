const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ACCESS_TOKEN_KEY = "nailed_access_token";
const SESSION_KEY = "nailed_session";

function getProducts() {
  return [];
}

function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("nailedAccessToken");
  localStorage.removeItem("nailedRefreshToken");
  window.dispatchEvent(new Event("storage"));
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

async function requestWithAuth(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
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
      typeof data === "string"
        ? data
        : data?.error?.message || data?.message || "요청 처리에 실패했습니다.";
    throw new Error(message);
  }

  return data?.data ?? data;
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export async function getProductDetail() {
  await delay();
  throw new Error("상품 정보를 불러올 수 없습니다.");
}

export async function incrementViewCount() {
  return undefined;
}

export async function addWishlist(productId) {
  return requestWithAuth(`/api/products/${encodeURIComponent(productId)}/wishlist`, {
    method: "POST",
  });
}

export async function removeWishlist(productId) {
  return requestWithAuth(`/api/products/${encodeURIComponent(productId)}/wishlist`, {
    method: "DELETE",
  });
}

export { getProducts };
