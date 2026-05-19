const KEYS = {
  wishlists: "nailed_mock_wishlists",
};

function getProducts() {
  return [];
}

function getWishlists() {
  const raw = localStorage.getItem(KEYS.wishlists);
  return raw ? JSON.parse(raw) : [];
}

function saveWishlists(list) {
  localStorage.setItem(KEYS.wishlists, JSON.stringify(list));
}

function currentMemberId() {
  try { return JSON.parse(localStorage.getItem("nailed_session") ?? "null")?.member_id ?? null; }
  catch { return null; }
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
  await delay(250);
  const memberId = currentMemberId();
  if (!memberId) throw new Error("로그인이 필요합니다.");

  const list = getWishlists();
  if (list.some((w) => w.memberId === memberId && w.productId === Number(productId))) return;
  list.push({ memberId, productId: Number(productId), createdAt: new Date().toISOString() });
  saveWishlists(list);
}

export async function removeWishlist(productId) {
  await delay(250);
  const memberId = currentMemberId();
  if (!memberId) throw new Error("로그인이 필요합니다.");

  saveWishlists(getWishlists().filter((w) => !(w.memberId === memberId && w.productId === Number(productId))));
}

export { getProducts };
