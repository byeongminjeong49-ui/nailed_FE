import { authRequest } from "./authApi";

const KEY = "nailed_mock_reviews";

const SEEDS = [
  { reviewId: 1, orderId: "ORDER_001", buyerNickname: "구매자A", rating: 5, content: "상태가 사진과 동일하게 새것 같아요! 포장도 꼼꼼하게 해주셨고 배송도 빠릅니다.", createdAt: "2026-04-10T10:00:00", sellerId: "MEMBER_001" },
  { reviewId: 2, orderId: "ORDER_002", buyerNickname: "구매자B", rating: 4, content: "설명과 동일한 상품입니다. 배송도 빠르고 좋아요.", createdAt: "2026-04-05T14:30:00", sellerId: "MEMBER_001" },
  { reviewId: 3, orderId: "ORDER_003", buyerNickname: "구매자C", rating: 5, content: "완전 만족합니다. 다음에 또 거래하고 싶어요!", createdAt: "2026-03-28T09:15:00", sellerId: "MEMBER_001" },
  { reviewId: 4, orderId: "ORDER_004", buyerNickname: "구매자D", rating: 3, content: "상태가 설명보다 조금 아쉬웠지만 가격 대비 괜찮아요.", createdAt: "2026-03-20T16:00:00", sellerId: "MEMBER_001" },
  { reviewId: 5, orderId: "ORDER_005", buyerNickname: "구매자E", rating: 5, content: "빠른 배송, 꼼꼼한 포장, 완벽한 상품 상태! 최고의 거래였습니다.", createdAt: "2026-04-15T11:00:00", sellerId: "MEMBER_002" },
  { reviewId: 6, orderId: "ORDER_006", buyerNickname: "구매자F", rating: 4, content: "깔끔하고 신속하게 보내주셨어요.", createdAt: "2026-04-08T13:20:00", sellerId: "MEMBER_002" },
  { reviewId: 7, orderId: "ORDER_007", buyerNickname: "구매자G", rating: 5, content: "설명 그대로의 상품이에요. 믿을 수 있는 셀러!", createdAt: "2026-03-30T10:45:00", sellerId: "MEMBER_003" },
  { reviewId: 8, orderId: "ORDER_008", buyerNickname: "구매자H", rating: 4, content: "좋았어요. 다음에도 이용할게요.", createdAt: "2026-03-22T15:30:00", sellerId: "MEMBER_004" },
];

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(KEY, JSON.stringify(SEEDS));
  return SEEDS;
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
function nextId(list) { return list.length ? Math.max(...list.map((r) => r.reviewId)) + 1 : 1; }
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

async function requestWithAuth(path, options = {}) {
  return authRequest(path, options);
}

export async function getSellerReviews(memberId, page = 0, size = 10) {
  await delay();
  const all = load().filter((r) => r.sellerId === memberId);
  const avg = all.length ? parseFloat((all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1)) : null;
  const start = page * size;
  return {
    averageRating: avg,
    reviews: {
      content: all.slice(start, start + size),
      pageNumber: page,
      pageSize: size,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
      first: page === 0,
      last: start + size >= all.length,
    },
  };
}

export async function writeReview({ orderId, sellerId, rating, content }) {
  return requestWithAuth("/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      rating,
      content: content || null,
    }),
  });
}
