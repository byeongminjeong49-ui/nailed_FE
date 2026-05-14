const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

let accessToken = ''

export function setAccessToken(token) {
  accessToken = token || ''
}

export function clearAccessToken() {
  accessToken = ''
}

async function request(path, options = {}) {
  const { auth = false, retry = true, ...fetchOptions } = options

  if (auth && !accessToken) {
    await refreshAccessToken()
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...fetchOptions.headers,
      },
    })
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. localhost:8080 실행 상태를 확인해주세요.')
  }

  if (response.status === 401 && auth && retry) {
    await refreshAccessToken()
    return request(path, { ...options, retry: false })
  }

  let payload

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    const message =
      (typeof payload === 'string' ? payload : null) ||
      payload?.error?.message ||
      payload?.message ||
      '요청을 처리하지 못했습니다.'
    throw new Error(message)
  }

  return payload?.data ?? payload
}

export async function refreshAccessToken() {
  const data = await request('/api/auth/refresh', {
    method: 'POST',
    retry: false,
  })
  setAccessToken(data.accessToken)
  return data
}

export function checkEmail(email) {
  return request(`/api/auth/check-email?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  })
}

export function checkNickname(nickname) {
  return request(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
    method: 'GET',
  })
}

export function requestEmailVerification({ email }) {
  return request('/api/auth/send-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function confirmEmailVerification({ email, verificationCode }) {
  return request('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, verificationCode }),
  })
}

export async function login({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAccessToken(data.accessToken)
  return data
}

export function signUp({ email, nickname, password, verificationCode }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, nickname, password, verificationCode }),
  })
}

export function findPassword({ email }) {
  return request('/api/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function logout() {
  await request('/api/auth/logout', { method: 'POST' })
  clearAccessToken()
}

export function getMyPage() {
  return request('/api/members/me', {
    method: 'GET',
    auth: true,
  })
}

export function updateMyProfile({ nickname }) {
  return request('/api/members/me/profile', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ nickname }),
  })
}

export function withdrawMember() {
  return request('/api/members/me', {
    method: 'DELETE',
    auth: true,
  })
}
