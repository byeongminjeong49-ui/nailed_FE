const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_TYPE_KEY = "tokenType";
const TOKEN_EXPIRES_AT_KEY = "tokenExpiresAt";
const SESSION_KEY = "nailed_session";
const SESSION_EXPIRED_MESSAGE = "로그인 시간이 만료되었습니다. 다시 로그인해주세요.";
const AUTH_STORAGE_KEYS = [
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_TYPE_KEY,
  TOKEN_EXPIRES_AT_KEY,
  SESSION_KEY,
];
const LEGACY_AUTH_KEYS = [
  ...AUTH_STORAGE_KEYS,
  "userid",
  "nickname",
  "role",
  "memberStatus",
  "nailed_access_token",
  "nailed_refresh_token",
  "nailed_token_type",
  "nailed_token_expires_at",
  "nailed_userid",
  "nailed_nickname",
  "nailed_role",
  "nailed_member_status",
  "nailedAccessToken",
  "nailedRefreshToken",
];
const UNUSED_SESSION_AUTH_KEYS = [
  "userid",
  "nickname",
  "role",
  "memberStatus",
  "nailed_access_token",
  "nailed_refresh_token",
  "nailed_token_type",
  "nailed_token_expires_at",
  "nailed_userid",
  "nailed_nickname",
  "nailed_role",
  "nailed_member_status",
  "nailedAccessToken",
  "nailedRefreshToken",
];

let sessionExpiredNotified = false;

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponseData(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? await response.json()
    : await response.text();
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await parseResponseData(response);

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
    memberId: user.memberId,
    userid: user.userid,
    nickname: user.nickname,
    role: user.role || "USER",
    memberStatus: user.memberStatus || user.member_status || "ACTIVE",
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearLegacyAuthLocalStorage() {
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

function saveAuthFields(data) {
  clearLegacyAuthLocalStorage();
  UNUSED_SESSION_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));

  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);

  if (data.refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  if (data.tokenType) {
    sessionStorage.setItem(TOKEN_TYPE_KEY, data.tokenType);
  }
  if (data.tokenExpiresAt) {
    sessionStorage.setItem(TOKEN_EXPIRES_AT_KEY, data.tokenExpiresAt);
  }
}

function saveLoginResult(data) {
  if (!data?.accessToken) {
    throw new Error("로그인 응답에 accessToken이 없습니다.");
  }

  sessionExpiredNotified = false;
  saveAuthFields(data);

  const hasMemberInfo = data.memberId || data.userid || data.nickname || data.name || data.role;
  const session = hasMemberInfo ? saveSession(data) : null;

  window.dispatchEvent(new Event("storage"));
  return session || data;
}

function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

function getTokenType() {
  return sessionStorage.getItem(TOKEN_TYPE_KEY) || "Bearer";
}

function redirectToLoginWithMessage() {
  if (sessionExpiredNotified) return;
  sessionExpiredNotified = true;
  window.alert(SESSION_EXPIRED_MESSAGE);

  if (window.location.pathname !== "/login") {
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export function clearAuthStorage({ redirect = false } = {}) {
  AUTH_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
  UNUSED_SESSION_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
  clearLegacyAuthLocalStorage();
  window.dispatchEvent(new Event("storage"));

  if (redirect) {
    redirectToLoginWithMessage();
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  const response = await fetch(buildUrl("/api/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await parseResponseData(response);

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.error?.message || data?.message || SESSION_EXPIRED_MESSAGE;
    throw new Error(message);
  }

  const result = data?.data ?? data;
  if (!result?.accessToken) {
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  saveAuthFields(result);
  if (result.memberId || result.userid || result.nickname || result.role || result.memberStatus) {
    saveSession(result);
  }
  window.dispatchEvent(new Event("storage"));

  return result.accessToken;
}

function isAuthPath(path) {
  return path === "/api/auth/login" || path === "/api/auth/refresh";
}

export async function authRequest(path, options = {}, retried = false) {
  const token = getAccessToken();
  if (!token) {
    clearAuthStorage({ redirect: true });
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `${getTokenType()} ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401 && !retried && !isAuthPath(path)) {
    try {
      const newAccessToken = await refreshAccessToken();
      return authRequest(
        path,
        {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `${getTokenType()} ${newAccessToken}`,
          },
        },
        true,
      );
    } catch (error) {
      clearAuthStorage({ redirect: true });
      throw new Error(error.message || SESSION_EXPIRED_MESSAGE);
    }
  }

  if (response.status === 401 || response.status === 403) {
    clearAuthStorage({ redirect: true });
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  const data = await parseResponseData(response);

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.error?.message || data?.message || "요청 처리에 실패했습니다.";
    throw new Error(message);
  }

  return data?.data ?? data;
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
  const data = await request("/api/auth/password/reset-request", {
    method: "POST",
    body: JSON.stringify({
      userid: normalizeUserId(userId),
    }),
  });

  return {
    temporaryPassword:
      data?.temporaryPassword ?? data?.data?.temporaryPassword ?? data?.data?.data?.temporaryPassword ?? "",
  };
}

export async function logout() {
  const refreshToken = getRefreshToken();

  try {
    await fetch(buildUrl("/api/auth/logout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearAuthStorage();
  }
}
