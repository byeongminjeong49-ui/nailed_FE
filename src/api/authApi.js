const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const SESSION_KEY = 'nailed_session'
const ACCESS_TOKEN_KEY = 'nailed_access_token'
const REFRESH_TOKEN_KEY = 'nailed_refresh_token'
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken'

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function getAccessToken() {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ||
    readSession()?.accessToken ||
    ''
  )
}

function saveSession(loginData) {
  const session = {
    member_id: loginData.memberId,
    memberId: loginData.memberId,
    email: loginData.email,
    userId: loginData.email,
    nickname: loginData.nickname,
    name: loginData.nickname,
    role: loginData.role,
    member_status: 'ACTIVE',
    accessToken: loginData.accessToken,
    refreshToken: loginData.refreshToken,
    tokenType: loginData.tokenType || 'Bearer',
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  if (loginData.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, loginData.accessToken)
    localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, loginData.accessToken)
  }
  if (loginData.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, loginData.refreshToken)
  }

  window.dispatchEvent(new Event('storage'))
  return session
}

async function request(path, options = {}) {
  const shouldAttachToken = options.auth !== false && !path.startsWith('/api/auth/')
  const token = shouldAttachToken ? getAccessToken() : ''
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const { auth, ...fetchOptions } = options
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...fetchOptions,
    headers,
  })

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      (typeof payload === 'string' ? payload : '') ||
      '요청 처리에 실패했습니다.'
    throw new Error(message)
  }

  return payload?.data ?? payload
}

export async function checkEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  const data = await request(`/api/auth/check-email?email=${encodeURIComponent(normalizedEmail)}`)
  return { available: !data.duplicated }
}

export async function checkNickname(nickname) {
  const data = await request(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname.trim())}`)
  return { available: !data.duplicated }
}

export async function requestEmailVerification(email) {
  await request('/api/auth/email/send-code', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: normalizeEmail(email) }),
  })
  return { success: true }
}

export async function verifyEmailCode({ email, code }) {
  await request('/api/auth/email/verify-code', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: normalizeEmail(email), code: code.trim() }),
  })
  return { success: true }
}

export async function signUp({ email, nickname, password, agreements }) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      email: normalizeEmail(email),
      nickname: nickname.trim(),
      password,
      name: nickname.trim(),
      serviceTermsAgreed: Boolean(agreements?.terms),
      privacyPolicyAgreed: Boolean(agreements?.privacy),
      marketingAgreed: Boolean(agreements?.marketing),
    }),
  })

  return { success: true, memberId: data.memberId }
}

export async function login({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  })

  return saveSession(data)
}

export async function findPassword({ email }) {
  await request('/api/auth/password/reset-request', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: normalizeEmail(email) }),
  })

  return {
    success: true,
    message: '비밀번호 재설정 안내 메일 발송을 요청했습니다.',
  }
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  window.dispatchEvent(new Event('storage'))
}

export async function getMyPage() {
  return request('/api/members/me/profile')
}

export async function updateMyProfile({ nickname }) {
  return request('/api/members/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ nickname }),
  })
}

export async function withdrawMember() {
  await request('/api/members/me', {
    method: 'DELETE',
  })
  await logout()
  return { success: true }
}
