// =====================================================
// Mock Auth API — members 테이블 스키마 기준
// =====================================================

const MEMBERS_KEY = 'nailed_mock_members'  // 회원 목록 (mock DB)
const SESSION_KEY = 'nailed_session'        // 로그인 세션

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getMembers() {
  try { return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]') }
  catch { return [] }
}

function saveMembers(members) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) }
  catch { return null }
}

function nextMemberId() {
  const num = getMembers().length + 1
  return `MEMBER_${String(num).padStart(3, '0')}`
}

// ── 닉네임 중복 확인 ────────────────────────────────────
export async function checkNickname(nickname) {
  await delay()
  const available = !getMembers().some((m) => m.nickname === nickname)
  return { available }
}

// ── 회원가입 ─────────────────────────────────────────────
export async function signUp({ userId, nickname, password }) {
  await delay(600)

  const members = getMembers()

  if (members.some((m) => m.userId === userId.toLowerCase())) {
    throw new Error('이미 가입된 아이디입니다.')
  }
  if (members.some((m) => m.nickname === nickname)) {
    throw new Error('이미 사용 중인 닉네임입니다.')
  }

  const now = new Date().toISOString()
  const newMember = {
    member_id:        nextMemberId(),
    userId:           userId.toLowerCase(),
    password_hash:    password,        // mock: 평문 저장 (실제 연동 시 해싱 필요)
    nickname,
    name:             nickname,        // mock: name 필드는 닉네임으로 대체
    shop_info:        null,
    member_status:    'ACTIVE',
    seller_grade:     'BRONZE',
    role:             'USER',
    bank_code:        null,
    account_number:   null,
    depositor_name:   null,
    marketing_agreed: 0,
    login_fail_count: 0,
    login_count:      0,
    last_login_at:    null,
    locked_until:     null,
    referrer_id:      null,
    created_at:       now,
    updated_at:       now,
  }

  members.push(newMember)
  saveMembers(members)
  return { success: true }
}

// ── 로그인 ───────────────────────────────────────────────
export async function login({ userId, password }) {
  await delay(500)

  const members = getMembers()
  const member  = members.find((m) => m.userId === userId.toLowerCase())

  if (!member || member.password_hash !== password) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
  }

  const statusMessages = {
    LOCKED:    '계정이 잠겼습니다. 잠시 후 다시 시도해주세요.',
    WITHDRAWN: '탈퇴한 계정입니다.',
    SUSPEND:   '이용이 일시 정지된 계정입니다.',
    BANNED:    '이용이 영구 제한된 계정입니다.',
  }
  if (statusMessages[member.member_status]) {
    throw new Error(statusMessages[member.member_status])
  }

  const idx = members.findIndex((m) => m.member_id === member.member_id)
  members[idx].login_count  += 1
  members[idx].last_login_at = new Date().toISOString()
  members[idx].updated_at    = new Date().toISOString()
  saveMembers(members)

  const session = {
    member_id:     member.member_id,
    userId:        member.userId,
    nickname:      member.nickname,
    name:          member.name,
    role:          member.role,
    seller_grade:  member.seller_grade,
    member_status: member.member_status,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

// ── 비밀번호 찾기 ────────────────────────────────────────
export async function findPassword({ userId }) {
  await delay(500)
  const member = getMembers().find((m) => m.userId === userId.toLowerCase())
  if (!member) throw new Error('가입된 회원 정보를 찾을 수 없습니다.')
  console.log(`[Mock] ${userId} 임시 비밀번호: Temp1234!`)
  return { success: true }
}

// ── 로그아웃 ─────────────────────────────────────────────
export async function logout() {
  await delay()
  localStorage.removeItem(SESSION_KEY)
}

// ── 마이페이지 조회 ──────────────────────────────────────
export async function getMyPage() {
  await delay()
  const session = getSession()
  if (!session) throw new Error('로그인이 필요합니다.')
  const member = getMembers().find((m) => m.member_id === session.member_id)
  if (!member) throw new Error('회원 정보를 찾을 수 없습니다.')
  const { password_hash, ...safeData } = member
  return safeData
}

// ── 프로필 수정 ──────────────────────────────────────────
export async function updateMyProfile({ nickname }) {
  await delay()
  const session = getSession()
  if (!session) throw new Error('로그인이 필요합니다.')
  const members = getMembers()
  const idx = members.findIndex((m) => m.member_id === session.member_id)
  if (idx === -1) throw new Error('회원 정보를 찾을 수 없습니다.')
  members[idx].nickname   = nickname
  members[idx].updated_at = new Date().toISOString()
  saveMembers(members)
  const updated = { ...session, nickname }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return members[idx]
}

// ── 회원 탈퇴 ────────────────────────────────────────────
export async function withdrawMember() {
  await delay()
  const session = getSession()
  if (!session) throw new Error('로그인이 필요합니다.')
  const members = getMembers()
  const idx = members.findIndex((m) => m.member_id === session.member_id)
  if (idx !== -1) {
    members[idx].member_status = 'WITHDRAWN'
    members[idx].updated_at    = new Date().toISOString()
    saveMembers(members)
  }
  localStorage.removeItem(SESSION_KEY)
  return { success: true }
}
