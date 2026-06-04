import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_EXPIRES_AT_KEY = "tokenExpiresAt";
const SESSION_KEY = "nailed_session";
const SESSION_EXPIRED_MESSAGE = "로그인 시간이 만료되었습니다. 다시 로그인해주세요.";
const AUTH_STORAGE_KEYS = [
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
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

// ─────────────────────────────────────────────
// axios 인스턴스 생성
// baseURL, withCredentials(쿠키 자동 전송) 공통 설정
// ─────────────────────────────────────────────
const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // HttpOnly 쿠키(refreshToken) 자동 전송
});

// ─────────────────────────────────────────────
// 응답 데이터 정규화: data.data ?? data 로 꺼냄
// ─────────────────────────────────────────────
function extractData(response) {
  const data = response.data;
  return data?.data ?? data;
}

// ─────────────────────────────────────────────
// 인증 없이 호출하는 공통 요청 함수
// ─────────────────────────────────────────────
async function request(path, options = {}) {
  try {
    const response = await instance({
      url: path,
      method: options.method || "GET",
      data: options.body ? JSON.parse(options.body) : undefined,
      params: options.params,
      headers: options.headers || {},
    });
    return extractData(response);
  } catch (error) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data ||
      "요청 처리에 실패했습니다.";
    throw new Error(typeof message === "string" ? message : "요청 처리에 실패했습니다.");
  }
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

  // refreshToken은 쿠키로 관리 (BE에서 HttpOnly 쿠키로 내려줌)
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
  return "Bearer";
}

function getTokenExpiresAt() {
  return sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY);
}

function isAccessTokenExpired() {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return false;

  const numericExpiresAt = Number(expiresAt);
  const expiresAtTime = Number.isFinite(numericExpiresAt)
    ? numericExpiresAt < 1000000000000
      ? numericExpiresAt * 1000
      : numericExpiresAt
    : Date.parse(expiresAt);

  if (!Number.isFinite(expiresAtTime)) return false;

  return Date.now() >= expiresAtTime - 10000;
}

export function getAuthorizationHeader(accessToken) {
  return `${getTokenType()} ${accessToken}`;
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

// ─────────────────────────────────────────────
// Access Token 재발급
// refreshToken은 HttpOnly 쿠키로 자동 전송됨
// ─────────────────────────────────────────────
async function refreshAccessToken() {
  try {
    const response = await instance.post("/api/auth/refresh");
    const result = extractData(response);

    if (!result?.accessToken) {
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    saveAuthFields(result);
    if (result.memberId || result.userid || result.nickname || result.role || result.memberStatus) {
      saveSession(result);
    }
    window.dispatchEvent(new Event("storage"));

    return result.accessToken;
  } catch (error) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      SESSION_EXPIRED_MESSAGE;
    throw new Error(message);
  }
}

export async function getValidAccessToken({
  forceRefresh = false,
  redirectOnFailure = false,
} = {}) {
  const token = getAccessToken();

  if (token && !forceRefresh && !isAccessTokenExpired()) {
    return token;
  }

  // refreshToken은 HttpOnly 쿠키로 관리 -> sessionStorage 체크 없이 바로 재발급 시도
  try {
    return await refreshAccessToken();
  } catch (error) {
    if (redirectOnFailure) {
      clearAuthStorage({ redirect: true });
      throw new Error(error.message || SESSION_EXPIRED_MESSAGE);
    }
    return null;
  }
}

function isAuthPath(path) {
  return path === "/api/auth/login" || path === "/api/auth/refresh";
}

// ─────────────────────────────────────────────
// 인증이 필요한 API 요청 함수
// Authorization 헤더 자동 추가 + 401 시 토큰 재발급 후 재시도
// ─────────────────────────────────────────────
export async function authRequest(path, options = {}, retried = false) {
  const token = await getValidAccessToken({ redirectOnFailure: true });
  if (!token) {
    clearAuthStorage({ redirect: true });
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  const { Authorization, authorization, ...optionHeaders } = options.headers || {};

  try {
    const response = await instance({
      url: path,
      method: options.method || "GET",
      data: options.body && !(options.body instanceof FormData)
        ? JSON.parse(options.body)
        : options.body,
      params: options.params,
      headers: {
        ...optionHeaders,
        Authorization: getAuthorizationHeader(token),
      },
    });

    if (response.status === 204) return null;
    return extractData(response);

  } catch (error) {
    const status = error.response?.status;

    // 401: 토큰 만료 → 재발급 후 재시도 (1회)
    if (status === 401 && !retried && !isAuthPath(path)) {
      try {
        const newAccessToken = await refreshAccessToken();
        return authRequest(
          path,
          {
            ...options,
            headers: {
              ...optionHeaders,
              Authorization: getAuthorizationHeader(newAccessToken),
            },
          },
          true,
        );
      } catch (refreshError) {
        clearAuthStorage({ redirect: true });
        throw new Error(refreshError.message || SESSION_EXPIRED_MESSAGE);
      }
    }

    if (status === 401 || status === 403) {
      clearAuthStorage({ redirect: true });
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data ||
      "요청 처리에 실패했습니다.";
    throw new Error(typeof message === "string" ? message : "요청 처리에 실패했습니다.");
  }
}

// ─────────────────────────────────────────────
// 아이디 중복 확인
// ─────────────────────────────────────────────
export async function checkUserId(userId) {
  const userid = normalizeUserId(userId);
  const data = await request("/api/auth/check-userid", {
    params: { userid },
  });
  return { available: !data.duplicated };
}

// ─────────────────────────────────────────────
// 닉네임 중복 확인
// ─────────────────────────────────────────────
export async function checkNickname(nickname) {
  const data = await request("/api/auth/check-nickname", {
    params: { nickname: nickname.trim() },
  });
  return { available: !data.duplicated };
}

// ─────────────────────────────────────────────
// 회원가입
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 로그인
// refreshToken은 BE가 HttpOnly 쿠키로 내려줌
// ─────────────────────────────────────────────
export async function login({ userId, password }) {
  try {
    const response = await instance.post("/api/auth/login", {
      userid: normalizeUserId(userId),
      password,
    });
    const data = extractData(response);
    return saveLoginResult(data);
  } catch (error) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data ||
      "로그인에 실패했습니다.";
    throw new Error(typeof message === "string" ? message : "로그인에 실패했습니다.");
  }
}

// ─────────────────────────────────────────────
// 비밀번호 찾기 (임시 비밀번호 발급)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 로그아웃
// refreshToken은 쿠키로 자동 전송 → BE에서 DB NULL 처리 + 쿠키 삭제
// ─────────────────────────────────────────────
export async function logout() {
  try {
    await instance.post("/api/auth/logout");
  } finally {
    clearAuthStorage();
  }
}
