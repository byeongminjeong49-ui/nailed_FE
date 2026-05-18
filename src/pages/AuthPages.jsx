import { useMemo, useState } from 'react'
import {
  checkEmail,
  checkNickname,
  findPassword,
  login,
  requestEmailVerification,
  signUp,
  verifyEmailCode,
} from '../api/authApi'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,16}$/

function AuthLayout({ children, onNavigate }) {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <button className="auth-brand" type="button" onClick={() => onNavigate('/')}>
          Nailed
        </button>
        <nav className="auth-nav" aria-label="회원 메뉴">
          <button type="button" onClick={() => onNavigate('/login')}>로그인</button>
          <button type="button" onClick={() => onNavigate('/signup')}>회원가입</button>
        </nav>
      </header>
      {children}
      <footer className="auth-footer">
        <strong>Nailed</strong>
        <span>mock 기반 회원 화면입니다. API와 JWT 발급은 아직 연결하지 않았습니다.</span>
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

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      await login({ email: form.email, password: form.password })
      setMessage({ type: 'success', text: '로그인되었습니다. 홈으로 이동합니다.' })
      window.setTimeout(() => onNavigate('/'), 600)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '로그인에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout onNavigate={onNavigate}>
      <main className="auth-shell auth-shell-narrow">
        <section className="auth-panel">
          <div className="auth-title">
            
            <h1>로그인</h1>

          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Field label="이메일">
              <input
                type="email"
                placeholder="이메일을 입력해주세요"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
              />
            </Field>

            <Field label="비밀번호">
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
              />
            </Field>

            <StatusMessage message={message} />

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="auth-actions">
            <button type="button" onClick={() => onNavigate('/password/reset')}>
              비밀번호 찾기
            </button>
            <button type="button" onClick={() => onNavigate('/signup')}>
              회원가입
            </button>
          </div>
        </section>
      </main>
    </AuthLayout>
  )
}

export function SignupPage({ onNavigate }) {
  const [form, setForm] = useState({
    email: '',
    emailCode: '',
    nickname: '',
    password: '',
    passwordConfirm: '',
  })
  const [agreements, setAgreements] = useState({
    age: false,
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [checks, setChecks] = useState({
    email: false,
    emailCodeSent: false,
    emailVerified: false,
    nickname: false,
  })
  const [mockCode, setMockCode] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    return (
      checks.emailVerified &&
      checks.nickname &&
      passwordPattern.test(form.password) &&
      form.password === form.passwordConfirm &&
      agreements.age &&
      agreements.terms &&
      agreements.privacy &&
      !submitting
    )
  }, [agreements, checks, form, submitting])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))

    if (key === 'email') {
      setChecks((current) => ({
        ...current,
        email: false,
        emailCodeSent: false,
        emailVerified: false,
      }))
      setMockCode('')
    }
    if (key === 'nickname') {
      setChecks((current) => ({ ...current, nickname: false }))
    }
  }

  async function handleEmailCheck() {
    if (!emailPattern.test(form.email.trim())) {
      setMessage({ type: 'error', text: '올바른 이메일 형식으로 입력해주세요.' })
      return
    }

    try {
      const result = await checkEmail(form.email)
      if (!result.available) {
        setChecks((current) => ({ ...current, email: false }))
        setMessage({ type: 'error', text: '이미 가입된 이메일입니다.' })
        return
      }

      setChecks((current) => ({ ...current, email: true }))
      setMessage({ type: 'success', text: '사용 가능한 이메일입니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '이메일 중복 확인에 실패했습니다.' })
    }
  }

  async function handleSendCode() {
    if (!checks.email) {
      setMessage({ type: 'error', text: '이메일 중복 확인을 먼저 완료해주세요.' })
      return
    }

    try {
      const result = await requestEmailVerification(form.email)
      setMockCode(result.code)
      setChecks((current) => ({ ...current, emailCodeSent: true, emailVerified: false }))
      setMessage({ type: 'success', text: `이메일 인증번호: ${result.code}` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '인증번호 발송에 실패했습니다.' })
    }
  }

  async function handleVerifyCode() {
    if (!form.emailCode.trim()) {
      setMessage({ type: 'error', text: '인증번호를 입력해주세요.' })
      return
    }

    try {
      await verifyEmailCode({ email: form.email, code: form.emailCode })
      setChecks((current) => ({ ...current, emailVerified: true }))
      setMessage({ type: 'success', text: '이메일 인증이 완료되었습니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '이메일 인증에 실패했습니다.' })
    }
  }

  async function handleNicknameCheck() {
    if (!form.nickname.trim()) {
      setMessage({ type: 'error', text: '닉네임을 입력해주세요.' })
      return
    }

    try {
      const result = await checkNickname(form.nickname)
      if (!result.available) {
        setChecks((current) => ({ ...current, nickname: false }))
        setMessage({ type: 'error', text: '이미 사용 중인 닉네임입니다.' })
        return
      }

      setChecks((current) => ({ ...current, nickname: true }))
      setMessage({ type: 'success', text: '사용 가능한 닉네임입니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '닉네임 중복 확인에 실패했습니다.' })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationMessage = validateSignup(form, agreements, checks)
    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      await signUp({
        email: form.email,
        nickname: form.nickname,
        password: form.password,
        agreements,
      })
      setMessage({ type: 'success', text: '회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.' })
      window.setTimeout(() => onNavigate('/login'), 700)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '회원가입에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout onNavigate={onNavigate}>
      <main className="auth-shell">
        <section className="auth-panel signup-panel">
          <div className="auth-title">
            
            <h1>회원가입</h1>
            
          </div>

          <form className="auth-form signup-form" onSubmit={handleSubmit}>
            <Field label="이메일" hint="중복 확인 후 인증번호를 요청해주세요.">
              <div className="inline-field">
                <input
                  type="email"
                  placeholder="example@nailed.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
                <button className="outline-button" type="button" onClick={handleEmailCheck}>
                  중복 확인
                </button>
              </div>
              <button
                className="secondary-button"
                type="button"
                disabled={!checks.email}
                onClick={handleSendCode}
              >
                인증번호 받기
              </button>
            </Field>

            <Field label="이메일 인증" hint={mockCode ? ` ` : ''}>
              <div className="inline-field">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="인증번호 6자리"
                  value={form.emailCode}
                  onChange={(event) => update('emailCode', event.target.value)}
                />
                <button
                  className="outline-button"
                  type="button"
                  disabled={!checks.emailCodeSent}
                  onClick={handleVerifyCode}
                >
                  인증 확인
                </button>
              </div>
            </Field>

            <Field label="닉네임">
              <div className="inline-field">
                <input
                  type="text"
                  placeholder="닉네임을 입력해주세요"
                  value={form.nickname}
                  onChange={(event) => update('nickname', event.target.value)}
                />
                <button className="outline-button" type="button" onClick={handleNicknameCheck}>
                  중복 확인
                </button>
              </div>
            </Field>

            <Field label="비밀번호" hint="영문, 숫자, 특수문자를 포함해 8~16자로 입력해주세요.">
              <input
                type="password"
                placeholder="비밀번호"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
              />
            </Field>

            <Field label="비밀번호 확인">
              <input
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                autoComplete="new-password"
                value={form.passwordConfirm}
                onChange={(event) => update('passwordConfirm', event.target.value)}
              />
            </Field>

            <div className="terms-box">
              <Agreement
                checked={agreements.age}
                label="[필수] 만 14세 이상입니다."
                onChange={(checked) => setAgreements((current) => ({ ...current, age: checked }))}
              />
              <Agreement
                checked={agreements.terms}
                label="[필수] 서비스 이용약관에 동의합니다."
                onChange={(checked) => setAgreements((current) => ({ ...current, terms: checked }))}
              />
              <Agreement
                checked={agreements.privacy}
                label="[필수] 개인정보 수집 및 이용에 동의합니다."
                onChange={(checked) => setAgreements((current) => ({ ...current, privacy: checked }))}
              />
              <Agreement
                checked={agreements.marketing}
                label="[선택] 마케팅 정보 수신에 동의합니다."
                onChange={(checked) => setAgreements((current) => ({ ...current, marketing: checked }))}
              />
            </div>

            <StatusMessage message={message} />

            <button className="primary-button" type="submit" disabled={!canSubmit}>
              {submitting ? '가입 처리 중...' : '회원가입 완료'}
            </button>
          </form>

          <div className="auth-actions">
            <span>이미 계정이 있으신가요?</span>
            <button type="button" onClick={() => onNavigate('/login')}>
              로그인
            </button>
          </div>
        </section>
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
      setMessage({ type: 'error', text: '가입한 이메일을 입력해주세요.' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      await findPassword({ email })
      setMessage({
        type: 'success',
        text: ' 비밀번호 재설정 링크 발송을 성공 처리했습니다.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '비밀번호 찾기에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout onNavigate={onNavigate}>
      <main className="auth-shell auth-shell-narrow">
        <section className="auth-panel">
          <div className="auth-title">
            <h1>비밀번호 찾기</h1>
          
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Field label="이메일">
              <input
                type="email"
                placeholder="가입한 이메일을 입력해주세요"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <StatusMessage message={message} />

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? '요청 중...' : '재설정 링크 발송'}
            </button>
          </form>

          <div className="auth-actions">
            <button type="button" onClick={() => onNavigate('/login')}>
              로그인으로 돌아가기
            </button>
          </div>
        </section>
      </main>
    </AuthLayout>
  )
}

function Field({ children, hint, label }) {
  return (
    <label className="form-row">
      <span>{label}</span>
      <div className="field-control">
        {children}
        {hint && <small>{hint}</small>}
      </div>
    </label>
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

function StatusMessage({ message }) {
  if (!message.text) return null
  return <p className={`status-message ${message.type}`}>{message.text}</p>
}

function validateSignup(form, agreements, checks) {
  if (!emailPattern.test(form.email.trim())) return '올바른 이메일을 입력해주세요.'
  if (!checks.email) return '이메일 중복 확인을 완료해주세요.'
  if (!checks.emailVerified) return '이메일 인증을 완료해주세요.'
  if (!form.nickname.trim()) return '닉네임을 입력해주세요.'
  if (!checks.nickname) return '닉네임 중복 확인을 완료해주세요.'
  if (!passwordPattern.test(form.password)) {
    return '비밀번호는 영문, 숫자, 특수문자를 포함해 8~16자로 입력해주세요.'
  }
  if (form.password !== form.passwordConfirm) return '비밀번호 확인이 일치하지 않습니다.'
  if (!agreements.age || !agreements.terms || !agreements.privacy) {
    return '필수 약관에 모두 동의해주세요.'
  }
  return ''
}
