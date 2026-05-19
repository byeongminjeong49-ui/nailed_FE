const SESSION_KEY = "nailed_session";
const USERS_KEY = "nailed_mock_users";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_USERS = [
  {
    memberId: "MEMBER_002",
    userId: "demo",
    nickname: "데모회원",
    password: "Demo123!",
    role: "USER",
  },
];

function normalizeUserId(userId) {
  return userId.trim().toLowerCase();
}

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "null");
    return Array.isArray(users) && users.length > 0 ? users : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveSession(user) {
  const session = {
    member_id: user.memberId,
    memberId: user.memberId,
    id: user.memberId,
    userId: user.userId,
    nickname: user.nickname,
    name: user.nickname,
    role: user.role || "USER",
    member_status: "ACTIVE",
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("storage"));
  return session;
}

function createMemberId() {
  return `MEMBER_${Date.now().toString().slice(-6)}`;
}

function createTemporaryPassword() {
  return `Temp${Math.floor(100000 + Math.random() * 900000)}!`;
}

export async function checkUserId(userId) {
  await delay();
  const normalizedUserId = normalizeUserId(userId);
  const duplicated = readUsers().some((user) => user.userId === normalizedUserId);
  return { available: !duplicated };
}

export async function checkNickname(nickname) {
  await delay();
  const normalizedNickname = nickname.trim();
  const duplicated = readUsers().some((user) => user.nickname === normalizedNickname);
  return { available: !duplicated };
}

export async function signUp({ userId, nickname, password }) {
  await delay();
  const normalizedUserId = normalizeUserId(userId);
  const users = readUsers();

  if (users.some((user) => user.userId === normalizedUserId)) {
    throw new Error("이미 사용 중인 아이디입니다.");
  }

  const nextUser = {
    memberId: createMemberId(),
    userId: normalizedUserId,
    nickname: nickname.trim(),
    password,
    role: "USER",
  };

  saveUsers([...users, nextUser]);
  return { success: true, memberId: nextUser.memberId };
}

export async function login({ userId, password }) {
  await delay();
  const normalizedUserId = normalizeUserId(userId);
  const user = readUsers().find(
    (item) => item.userId === normalizedUserId && item.password === password,
  );

  if (!user) {
    throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
  }

  return saveSession(user);
}

export async function findPassword({ userId }) {
  await delay();
  const normalizedUserId = normalizeUserId(userId);
  const users = readUsers();
  const userIndex = users.findIndex((item) => item.userId === normalizedUserId);

  if (userIndex === -1) {
    throw new Error("등록된 아이디를 찾을 수 없습니다.");
  }

  const temporaryPassword = createTemporaryPassword();
  const nextUsers = users.map((user, index) =>
    index === userIndex ? { ...user, password: temporaryPassword } : user,
  );
  saveUsers(nextUsers);

  return {
    success: true,
    temporaryPassword,
    message: "임시 비밀번호가 mock 방식으로 발급되었습니다.",
  };
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("storage"));
}
