import { authRequest } from "./authApi";

function getProducts() {
  return [];
}

async function requestWithAuth(path, options = {}) {
  return authRequest(path, options);
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
