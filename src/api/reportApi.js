const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ACCESS_TOKEN_KEY = "nailed_access_token";
const SESSION_KEY = "nailed_session";

export const REPORT_REASONS = [
  { code: "FRAUD", label: "사기" },
  { code: "ABUSE", label: "욕설/비방" },
  { code: "PROHIBITED_ITEM", label: "금지상품" },
  { code: "ETC", label: "기타" },
];

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

export async function submitReport({ targetMemberId, reasonCode, detail }) {
  return requestWithAuth("/api/reports", {
    method: "POST",
    body: JSON.stringify({
      targetMemberId,
      reasonCode,
      detail: detail || null,
    }),
  });
}
