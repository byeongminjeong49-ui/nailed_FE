import { authRequest } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.error?.message || data?.message || "요청 처리에 실패했습니다.";
    throw new Error(message);
  }
  return data?.data ?? data;
}

async function requestWithAuth(path, options = {}) {
  return authRequest(path, options);
}

export async function getProductList(categoryId, page = 0, size = 15) {
  const params = new URLSearchParams({ categoryId, page, size });
  return request(`/api/products?${params.toString()}`);
}

export async function getBrands() {
  return request("/api/products/brands");
}

export async function getProductListByCode(categoryCode, page = 0, size = 20) {
  const params = new URLSearchParams({ categoryCode, page, size });
  return request(`/api/products?${params.toString()}`);
}

export async function getNewProducts() {
  return request("/api/products/new");
}

export async function getPopularProducts() {
  return request("/api/products/popular");
}

export async function searchProducts({ categoryId, keyword, minPrice, maxPrice, conditionCode, size: sizeParam, sortBy = "latest", page = 0, size = 15 } = {}) {
  const params = new URLSearchParams();
  if (categoryId !== undefined && categoryId !== null) params.append("categoryId", categoryId);
  if (keyword) params.append("keyword", keyword);
  if (minPrice !== undefined && minPrice !== null) params.append("minPrice", minPrice);
  if (maxPrice !== undefined && maxPrice !== null) params.append("maxPrice", maxPrice);
  if (conditionCode) params.append("conditionCode", conditionCode);
  if (sizeParam) params.append("size", sizeParam);
  params.append("sortBy", sortBy);
  params.append("page", page);
  params.append("size", size);
  return request(`/api/products/search?${params.toString()}`);
}

function getOptionalAuthHeaders() {
  const token = sessionStorage.getItem("accessToken");
  if (!token) return {};
  const tokenType = sessionStorage.getItem("tokenType") || "Bearer";
  return { Authorization: `${tokenType} ${token}` };
}

export async function getProductDetail(productId) {
  const data = await request(`/api/products/${encodeURIComponent(productId)}`, {
    headers: getOptionalAuthHeaders(),
  });
  if (data && Array.isArray(data.imageUrls)) {
    data.imageUrls = data.imageUrls.map((url) =>
      url && !url.startsWith("http") ? `${API_BASE_URL}${url}` : url
    );
  }
  return data;
}

export async function incrementViewCount(productId) {
  return request(`/api/products/${encodeURIComponent(productId)}/view`, { method: "POST" });
}

export async function getUserHome(memberId) {
  return request(`/api/users/${encodeURIComponent(memberId)}`);
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return requestWithAuth("/api/products/image-upload", {
    method: "POST",
    body: formData,
  });
}

export async function registerProduct(body) {
  return requestWithAuth("/api/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateProduct(productId, body) {
  return requestWithAuth(`/api/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteProduct(productId, reason) {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return requestWithAuth(`/api/products/${encodeURIComponent(productId)}${params}`, {
    method: "DELETE",
  });
}

export async function changeProductStatus(productId, productStatus) {
  return requestWithAuth(`/api/products/${encodeURIComponent(productId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ productStatus }),
  });
}

export function getProducts() {
  return [];
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

export async function getRandomProducts(size = 10) {
  const data = await request(`/api/products/random?size=${size}`);
  return fixSummaryImages(data);
}

export function fixSummaryImages(list) {
  if (!Array.isArray(list)) return list;
  return list.map((p) => ({
    ...p,
    thumbnailUrl:
      p.thumbnailUrl && !p.thumbnailUrl.startsWith("http")
        ? `${API_BASE_URL}${p.thumbnailUrl}`
        : p.thumbnailUrl,
  }));
}

export async function getSellerProducts(sellerId, excludeId) {
  const params = new URLSearchParams();
  if (excludeId != null) params.append("exclude", excludeId);
  const qs = params.toString();
  const data = await request(
    `/api/products/seller/${encodeURIComponent(sellerId)}${qs ? `?${qs}` : ""}`
  );
  return fixSummaryImages(data);
}

export async function getRelatedProducts(productId, size = 5) {
  const data = await request(
    `/api/products/${encodeURIComponent(productId)}/related?size=${size}`
  );
  return fixSummaryImages(data);
}
