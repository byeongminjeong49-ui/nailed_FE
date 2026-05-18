import { productSections } from "../data/productData";

const KEYS = {
  products: "nailed_mock_products",
  wishlists: "nailed_mock_wishlists",
};

const CONDITIONS = {
  S: { label: "새제품", description: "새제품(미사용)" },
  A: { label: "거의 새것", description: "거의 새것" },
  B: { label: "상태 좋음", description: "중고(상태 좋음)" },
  C: { label: "상태 보통", description: "중고(상태 보통)" },
  D: { label: "사용감 많음", description: "중고(사용감 많음)" },
};

export const MOCK_SELLERS = [
  { memberId: "MEMBER_001", nickname: "동네 빈티지", sellerGrade: "GOLD", completedOrderCount: 47, averageRating: 4.8 },
  { memberId: "MEMBER_002", nickname: "프리미엄 셀러", sellerGrade: "DIAMOND", completedOrderCount: 132, averageRating: 4.9 },
  { memberId: "MEMBER_003", nickname: "빠른 거래", sellerGrade: "SILVER", completedOrderCount: 23, averageRating: 4.6 },
  { memberId: "MEMBER_004", nickname: "전문 빈티지", sellerGrade: "GOLD", completedOrderCount: 88, averageRating: 4.7 },
  { memberId: "MEMBER_005", nickname: "오피스 셀러", sellerGrade: "BRONZE", completedOrderCount: 8, averageRating: 4.5 },
  { memberId: "MEMBER_006", nickname: "아웃도어 셀러", sellerGrade: "SILVER", completedOrderCount: 31, averageRating: 4.7 },
  { memberId: "MEMBER_007", nickname: "가방 전문", sellerGrade: "GOLD", completedOrderCount: 64, averageRating: 4.8 },
  { memberId: "MEMBER_008", nickname: "테크 셀러", sellerGrade: "SILVER", completedOrderCount: 19, averageRating: 4.4 },
  { memberId: "MEMBER_009", nickname: "스니커 셀러", sellerGrade: "BRONZE", completedOrderCount: 12, averageRating: 4.6 },
  { memberId: "MEMBER_010", nickname: "스트릿 셀러", sellerGrade: "SILVER", completedOrderCount: 28, averageRating: 4.5 },
  { memberId: "MEMBER_011", nickname: "셀렉트샵", sellerGrade: "GOLD", completedOrderCount: 55, averageRating: 4.9 },
  { memberId: "MEMBER_012", nickname: "라이프 셀러", sellerGrade: "BRONZE", completedOrderCount: 7, averageRating: 4.3 },
];

const SELLER_MAP = Object.fromEntries(MOCK_SELLERS.map((s) => [s.nickname, s]));
const COND_KEYS = ["S", "A", "B", "C", "D"];
const SIZES = ["XS", "S", "M", "L", "XL", "FREE", null];

function buildProducts() {
  const all = productSections.flatMap((s) => s.products);
  return all.map((p, i) => {
    const seller = SELLER_MAP[p.seller] ?? MOCK_SELLERS[i % MOCK_SELLERS.length];
    const conditionCode = COND_KEYS[i % COND_KEYS.length];
    const price = parseInt(p.price.replace(/[^0-9]/g, ""), 10);
    return {
      productId: p.id,
      title: p.name,
      price,
      conditionCode,
      conditionLabel: CONDITIONS[conditionCode].label,
      conditionDescription: CONDITIONS[conditionCode].description,
      categoryName: p.category,
      brandName: p.brand,
      size: SIZES[i % SIZES.length],
      shippingMethod: "DELIVERY",
      viewCount: Math.floor(Math.random() * 300) + 10,
      wishlistCount: p.likes,
      productStatus: "ON_SALE",
      description: p.description,
      hashtags: `${p.brand},${p.type},중고거래`,
      createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      imageUrls: [],
      seller,
      type: p.type,
    };
  });
}

function getProducts() {
  const stored = localStorage.getItem(KEYS.products);
  if (stored) return JSON.parse(stored);
  const products = buildProducts();
  localStorage.setItem(KEYS.products, JSON.stringify(products));
  return products;
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

export async function getProductDetail(productId) {
  await delay();
  const products = getProducts();
  const product = products.find((p) => p.productId === Number(productId));
  if (!product) throw new Error("상품을 찾을 수 없습니다.");

  const memberId = currentMemberId();
  const wishlists = getWishlists();
  const isWishlisted = memberId
    ? wishlists.some((w) => w.memberId === memberId && w.productId === Number(productId))
    : false;

  const related = products
    .filter((p) => p.categoryName === product.categoryName && p.productId !== product.productId)
    .slice(0, 6);

  return { ...product, isWishlisted, related };
}

export async function incrementViewCount(productId) {
  const key = `nailed_viewed_${productId}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  const products = getProducts();
  const idx = products.findIndex((p) => p.productId === Number(productId));
  if (idx !== -1) {
    products[idx].viewCount += 1;
    localStorage.setItem(KEYS.products, JSON.stringify(products));
  }
}

export async function addWishlist(productId) {
  await delay(250);
  const memberId = currentMemberId();
  if (!memberId) throw new Error("로그인이 필요합니다.");
  const list = getWishlists();
  if (list.some((w) => w.memberId === memberId && w.productId === Number(productId))) return;
  list.push({ memberId, productId: Number(productId), createdAt: new Date().toISOString() });
  saveWishlists(list);
  const products = getProducts();
  const idx = products.findIndex((p) => p.productId === Number(productId));
  if (idx !== -1) { products[idx].wishlistCount += 1; localStorage.setItem(KEYS.products, JSON.stringify(products)); }
}

export async function removeWishlist(productId) {
  await delay(250);
  const memberId = currentMemberId();
  if (!memberId) throw new Error("로그인이 필요합니다.");
  saveWishlists(getWishlists().filter((w) => !(w.memberId === memberId && w.productId === Number(productId))));
  const products = getProducts();
  const idx = products.findIndex((p) => p.productId === Number(productId));
  if (idx !== -1 && products[idx].wishlistCount > 0) { products[idx].wishlistCount -= 1; localStorage.setItem(KEYS.products, JSON.stringify(products)); }
}

export { getProducts };
