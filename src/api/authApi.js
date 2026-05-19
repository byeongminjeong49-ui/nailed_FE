const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ACCESS_TOKEN_KEY = "nailed_access_token";
const SESSION_KEY = "nailed_session";
const UNUSED_MOCK_KEYS = [
  "nailed_mock_users",
  "nailed_mock_email_verifications",
  "nailed_mock_members",
  "nailed_mock_products",
  "nailed_mock_wishlists",
];

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

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

function normalizeUserId(userId) {
  return userId.trim();
}

function saveSession(user) {
  const session = {
    member_id: user.memberId,
    memberId: user.memberId,
    id: user.memberId,
    userId: user.userid,
    userid: user.userid,
    nickname: user.nickname,
    name: user.name,
    role: user.role || "USER",
    member_status: "ACTIVE",
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function saveLoginResult(data) {
  if (!data?.accessToken) {
    throw new Error("로그인 응답에 accessToken이 없습니다.");
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);

  const hasMemberInfo = data.memberId || data.userid || data.nickname || data.name || data.role;
  const session = hasMemberInfo ? saveSession(data) : null;

  window.dispatchEvent(new Event("storage"));
  return session || data;
}

export async function checkUserId(userId) {
  const userid = normalizeUserId(userId);
  const params = new URLSearchParams({ userid });
  const data = await request(`/api/auth/check-userid?${params.toString()}`);
  return { available: !data.duplicated };
}

export async function checkNickname(nickname) {
  const params = new URLSearchParams({ nickname: nickname.trim() });
  const data = await request(`/api/auth/check-nickname?${params.toString()}`);
  return { available: !data.duplicated };
}

export async function signUp({
  name,
  userId,
  nickname,
  password,
  serviceTermsAgreed,
  privacyPolicyAgreed,
  marketingAgreed,
}) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      userid: normalizeUserId(userId),
      nickname: nickname.trim(),
      password,
      serviceTermsAgreed,
      privacyPolicyAgreed,
      marketingAgreed,
    }),
  });
}

export async function login({ userId, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      userid: normalizeUserId(userId),
      password,
    }),
  });

  return saveLoginResult(data);
}

export async function findPassword({ userId }) {
  return request("/api/auth/password/reset-request", {
    method: "POST",
    body: JSON.stringify({
      userid: normalizeUserId(userId),
    }),
  });
}

export async function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  UNUSED_MOCK_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("storage"));
}
