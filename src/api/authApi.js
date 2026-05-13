const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. localhost:8080 실행 상태를 확인해주세요.')
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

function getAccessToken() {
  return localStorage.getItem('nailedAccessToken')
}

function authHeaders() {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function login({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function requestPhoneVerification({ phoneNumber }) {
  return request('/api/auth/signup/phone-verification/request', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  })
}

export function confirmPhoneVerification({ phoneNumber, verificationCode }) {
  return request('/api/auth/signup/phone-verification/confirm', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, verificationCode }),
  })
}

export function signUp({ email, password, phoneNumber }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, phoneNumber }),
  })
}

export function findPassword({ email }) {
  return request('/api/auth/password/find', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function getMyPage() {
  return request('/api/members/me', {
    method: 'GET',
    headers: authHeaders(),
  })
}

export function updateMyProfile({ nickname }) {
  return request('/api/members/me/profile', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ nickname }),
  })
}

export function withdrawMember() {
  return request('/api/members/me', {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
