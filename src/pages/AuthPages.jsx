import { useState } from 'react'
import {
  checkEmail,
  checkNickname,
  confirmEmailVerification,
  findPassword,
  login,
  requestEmailVerification,
  signUp,
} from '../api/authApi'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,16}$/

function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <a className="auth-brand" href="/">
          Nailed
        </a>
        <nav className="auth-nav" aria-label="인증 메뉴">
          <a href="/login">로그인</a>
          <a href="/signup">회원가입</a>
        </nav>
      </header>
      {children}
      <footer className="auth-footer">
        <strong>Nailed</strong>
        <span>프리미엄 중고 패션 거래 플랫폼</span>
      </footer>
    </div>
  )
}

export function LoginPage({ onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.email.trim() || !form.password) {
      setMessage({ type: 'error', text: '이메일과 비밀번호를 입력해주세요.' })
      return
    }

    if (!emailPattern.test(form.email.trim())) {
      setMessage({ type: 'error', text: '이메일 형식이 올바르지 않습니다.' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const data = await login({ email: form.email.trim(), password: form.password })
      localStorage.setItem(
        'nailedMember',
        JSON.stringify({ memberId: data.memberId, email: data.email, nickname: data.nickname }),
      )
      setMessage({ type: 'success', text: '로그인되었습니다. 마이페이지로 이동합니다.' })
      window.setTimeout(() => onNavigate('/mypage'), 500)
    } catch (error) {
      setMessage({ type: 'error', text: getReadableError(error.message, '로그인에 실패했습니다.') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <main className="auth-section login-section">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="form-heading centered">
            <h1>로그인</h1>
            <p>NAILED에 오신 것을 환영합니다.</p>
          </div>

          <label className="icon-field">
            <span aria-hidden="true">✉</span>
            <span className="sr-only">이메일</span>
            <input
              type="email"
              placeholder="이메일"
              autoComplete="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </label>

          <label className="icon-field">
            <span aria-hidden="true">▣</span>
            <span className="sr-only">비밀번호</span>
            <input
              type="password"
              placeholder="비밀번호"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
            />
          </label>

          <div className="form-links split">
            <button type="button" onClick={() => onNavigate('/find-password')}>
              아이디 찾기
            </button>
            <button type="button" onClick={() => onNavigate('/find-password')}>
              비밀번호 찾기
            </button>
          </div>

          <StatusMessage message={message} />

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>

          <p className="bottom-copy">
            NAILED 회원이 아니신가요?
            <button type="button" onClick={() => onNavigate('/signup')}>
              회원가입
            </button>
          </p>
        </form>
      </main>
    </AuthLayout>
  )
}

export function SignupPage({ onNavigate }) {
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: '',
    verificationCode: '',
  })
  const [agreements, setAgreements] = useState({ terms: false, privacy: false, age: false })
  const [emailChecked, setEmailChecked] = useState(false)
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [codeRequested, setCodeRequested] = useState(false)
  const [codeConfirmed, setCodeConfirmed] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  function update(key, value) {
    const nextValue = key === 'verificationCode' ? value.replace(/\D/g, '') : value
    setForm((current) => ({ ...current, [key]: nextValue }))

    if (key === 'email') {
      setEmailChecked(false)
      setCodeRequested(false)
      setCodeConfirmed(false)
    }

    if (key === 'nickname') {
      setNicknameChecked(false)
    }

    if (key === 'verificationCode') {
      setCodeConfirmed(false)
    }
  }

  async function handleEmailCheck() {
    if (!emailPattern.test(form.email.trim())) {
      setMessage({ type: 'error', text: '올바른 이메일을 입력해주세요.' })
      return
    }

    try {
      const data = await checkEmail(form.email.trim())
      if (!data.available) {
        setEmailChecked(false)
        setMessage({ type: 'error', text: '이미 사용 중인 이메일입니다.' })
        return
      }

      setEmailChecked(true)
      setMessage({ type: 'success', text: '사용 가능한 이메일입니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: getReadableError(error.message, '이메일 확인에 실패했습니다.') })
    }
  }

  async function handleNicknameCheck() {
    if (!form.nickname.trim()) {
      setMessage({ type: 'error', text: '닉네임을 입력해주세요.' })
      return
    }

    try {
      const data = await checkNickname(form.nickname.trim())
      if (!data.available) {
        setNicknameChecked(false)
        setMessage({ type: 'error', text: '이미 사용 중인 닉네임입니다.' })
        return
      }

      setNicknameChecked(true)
      setMessage({ type: 'success', text: '사용 가능한 닉네임입니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: getReadableError(error.message, '닉네임 확인에 실패했습니다.') })
    }
  }

  async function handleRequestCode() {
    if (!emailChecked) {
      setMessage({ type: 'error', text: '먼저 이메일 확인을 완료해주세요.' })
      return
    }

    try {
      await requestEmailVerification({ email: form.email.trim() })
      setCodeRequested(true)
      setCodeConfirmed(false)
      setMessage({ type: 'success', text: '이메일로 인증번호가 발송되었습니다. 인증번호는 3분간 유효합니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: getReadableError(error.message, '인증번호 발송에 실패했습니다.') })
    }
  }

  async function handleConfirmCode() {
    if (!codeRequested) {
      setMessage({ type: 'error', text: '먼저 인증번호 요청을 해주세요.' })
      return
    }

    if (!form.verificationCode || form.verificationCode.length !== 6) {
      setMessage({ type: 'error', text: '인증번호 6자리를 입력해주세요.' })
      return
    }

    try {
      await confirmEmailVerification({
        email: form.email.trim(),
        verificationCode: form.verificationCode,
      })
      setCodeConfirmed(true)
      setMessage({ type: 'success', text: '이메일 인증이 완료되었습니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: getReadableError(error.message, '인증번호 확인에 실패했습니다.') })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationMessage = validateSignup(
      form,
      agreements,
      emailChecked,
      nicknameChecked,
      codeConfirmed,
    )
    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage })
      return
    }

    setSubmitting(true)

    try {
      await signUp({
        email: form.email.trim(),
        nickname: form.nickname.trim(),
        password: form.password,
        verificationCode: form.verificationCode,
      })
      setMessage({ type: 'success', text: '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.' })
      window.setTimeout(() => onNavigate('/login'), 700)
    } catch (error) {
      setMessage({ type: 'error', text: getReadableError(error.message, '회원가입에 실패했습니다.') })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    form.nickname.trim() &&
    emailPattern.test(form.email.trim()) &&
    passwordPattern.test(form.password) &&
    form.password === form.passwordConfirm &&
    emailChecked &&
    nicknameChecked &&
    codeConfirmed &&
    agreements.terms &&
    agreements.privacy &&
    agreements.age &&
    !submitting

  return (
    <AuthLayout>
      <main className="signup-layout">
        <div className="signup-copy">
          <h1>회원가입</h1>
          <p>
            NAILED의 다양한 혜택을 누리기
            <br />
            위해 정보를 입력해주세요.
          </p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <FormRow label="닉네임">
            <input
              placeholder="닉네임을 입력해주세요."
              value={form.nickname}
              onChange={(event) => update('nickname', event.target.value)}
            />
          </FormRow>

          <FormRow label="이메일">
            <input
              type="email"
              placeholder="이메일을 입력해주세요."
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </FormRow>

          <FormRow label="비밀번호" hint="영문, 숫자, 특수문자 포함 8~16자">
            <input
              type="password"
              placeholder="비밀번호를 입력해주세요."
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
            />
          </FormRow>

          <FormRow label="비밀번호 확인">
            <input
              type="password"
              placeholder="비밀번호를 다시 입력해주세요."
              value={form.passwordConfirm}
              onChange={(event) => update('passwordConfirm', event.target.value)}
            />
          </FormRow>

          <FormRow label="이메일 확인">
            <div className="email-check-field">
              <input type="email" value={form.email} readOnly />
              <button className="outline-button" type="button" onClick={handleEmailCheck}>
                이메일 확인
              </button>
            </div>
          </FormRow>

          <FormRow label="닉네임 확인">
            <div className="email-check-field">
              <input value={form.nickname} readOnly />
              <button className="outline-button" type="button" onClick={handleNicknameCheck}>
                닉네임 확인
              </button>
            </div>
          </FormRow>

          <FormRow label="인증번호" hint={codeRequested ? '인증번호는 5분간 유효합니다.' : ''}>
            <div className="verification-field">
              <input
                inputMode="numeric"
                maxLength="6"
                placeholder="인증번호 6자리"
                value={form.verificationCode}
                onChange={(event) => update('verificationCode', event.target.value)}
                disabled={!codeRequested}
              />
              <button className="outline-button" type="button" onClick={handleRequestCode}>
                인증번호 요청
              </button>
              <button className="outline-button muted" type="button" onClick={handleConfirmCode}>
                확인
              </button>
            </div>
          </FormRow>

          <FormRow label="약관 동의">
            <div className="terms-box">
              <Agreement
                checked={agreements.terms}
                label="[필수] NAILED 이용약관 동의"
                onChange={(checked) => setAgreements((current) => ({ ...current, terms: checked }))}
              />
              <Agreement
                checked={agreements.privacy}
                label="[필수] 개인정보 수집 및 이용 동의"
                onChange={(checked) =>
                  setAgreements((current) => ({ ...current, privacy: checked }))
                }
              />
              <Agreement
                checked={agreements.age}
                label="[필수] 만 14세 이상입니다."
                onChange={(checked) => setAgreements((current) => ({ ...current, age: checked }))}
              />
            </div>
          </FormRow>

          <StatusMessage className="signup-status" message={message} />

          <button className="primary-button" type="submit" disabled={!canSubmit}>
            {submitting ? '가입 중...' : '회원가입 완료'}
          </button>

          <p className="bottom-copy">
            이미 계정이 있으신가요?
            <button type="button" onClick={() => onNavigate('/login')}>
              로그인
            </button>
          </p>
        </form>
      </main>
    </AuthLayout>
  )
}

export function FindPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!emailPattern.test(email.trim())) {
      setMessage({ type: 'error', text: '이메일 형식이 올바르지 않습니다.' })
      return
    }

    setSubmitting(true)

    try {
      await findPassword({ email: email.trim() })
      setMessage({ type: 'success', text: '이메일로 임시 비밀번호가 발송되었습니다.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReadableError(error.message, '비밀번호 찾기에 실패했습니다.'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <main className="find-page">
        <div className="find-heading">
          <h1>ID/PW 찾기</h1>
          <p>가입하신 이메일로 임시 비밀번호를 발급받아 로그인해주세요.</p>
        </div>
        <form className="find-card" onSubmit={handleSubmit}>
          <FormRow label="이메일">
            <input
              type="email"
              placeholder="이메일을 입력해주세요."
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormRow>

          <StatusMessage message={message} />

          <button className="dark-button" type="submit" disabled={submitting}>
            {submitting ? '발급 중...' : '비밀번호 찾기'}
          </button>
          <p className="bottom-copy">
            로그인 페이지로 돌아가기
            <button type="button" onClick={() => onNavigate('/login')}>
              로그인
            </button>
          </p>
        </form>
      </main>
    </AuthLayout>
  )
}

function FormRow({ children, hint, label }) {
  return (
    <div className="form-row">
      <label>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

function Agreement({ checked, label, onChange }) {
  return (
    <label className="agreement">
      <input
        checked={checked}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
      <button type="button">보기</button>
    </label>
  )
}

function StatusMessage({ className = '', message }) {
  if (!message.text) {
    return null
  }

  return <p className={`status-message ${message.type} ${className}`.trim()}>{message.text}</p>
}

function validateSignup(form, agreements, emailChecked, nicknameChecked, codeConfirmed) {
  if (!form.nickname.trim()) return '닉네임을 입력해주세요.'
  if (!emailPattern.test(form.email.trim())) return '올바른 이메일을 입력해주세요.'
  if (!passwordPattern.test(form.password)) {
    return '비밀번호는 영문, 숫자, 특수문자를 포함해 8~16자로 입력해주세요.'
  }
  if (form.password !== form.passwordConfirm) return '비밀번호 확인이 일치하지 않습니다.'
  if (!emailChecked) return '이메일 확인을 완료해주세요.'
  if (!nicknameChecked) return '닉네임 확인을 완료해주세요.'
  if (!codeConfirmed) return '인증번호 확인을 완료해주세요.'
  if (!agreements.terms || !agreements.privacy || !agreements.age) {
    return '필수 약관에 동의해주세요.'
  }
  return ''
}

function getReadableError(message, fallback) {
  if (!message) return fallback
  if (message.includes('email format')) return '이메일 형식이 올바르지 않습니다.'
  if (message.includes('M010')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (message.includes('M001')) return '가입된 회원 정보를 찾을 수 없습니다.'
  if (message.includes('M002')) return '이미 가입된 이메일입니다.'
  if (message.length > 80 || /[�?]/.test(message)) return fallback
  return message
}
