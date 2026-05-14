import { useEffect, useState } from 'react'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { getMyPage, logout, updateMyProfile, withdrawMember } from '../api/authApi'

function MyPage({ onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadProfile() {
    try {
      const data = await getMyPage()
      setProfile(data)
      setNickname(data.nickname || '')
      setMessage({ type: '', text: '' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReadableError(error.message, '마이페이지 정보를 불러오지 못했습니다.'),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProfile()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  async function handleSave(event) {
    event.preventDefault()

    if (!nickname.trim()) {
      setMessage({ type: 'error', text: '닉네임을 입력해주세요.' })
      return
    }

    if (nickname.trim().length > 30) {
      setMessage({ type: 'error', text: '닉네임은 30자 이하로 입력해주세요.' })
      return
    }

    setSaving(true)

    try {
      const data = await updateMyProfile({ nickname: nickname.trim() })
      setProfile(data)
      setNickname(data.nickname || '')
      setMessage({ type: 'success', text: '프로필이 수정되었습니다.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReadableError(error.message, '프로필 수정에 실패했습니다.'),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // 이미 만료된 세션이어도 클라이언트 상태는 정리합니다.
    }
    localStorage.removeItem('nailedMember')
    onNavigate('/login')
  }

  async function handleWithdraw() {
    const confirmed = window.confirm('정말 탈퇴하시겠습니까?')
    if (!confirmed) return

    try {
      await withdrawMember()
      handleLogout()
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReadableError(error.message, '회원 탈퇴에 실패했습니다.'),
      })
    }
  }

  return (
    <div className="mypage-page">
      <Header />
      <main className="mypage-main">
        <section className="mypage-panel">
          <div className="mypage-heading">
            <div>
              <h1>마이페이지</h1>
              <p>회원 정보와 프로필을 확인합니다.</p>
            </div>
            <button className="outline-button muted" type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>

          {message.text && <p className={`status-message ${message.type}`}>{message.text}</p>}

          {loading && <p className="mypage-loading">회원 정보를 불러오는 중입니다.</p>}

          {!loading && !profile && (
            <div className="mypage-empty">
              <p>마이페이지를 보려면 로그인이 필요합니다.</p>
              <button className="primary-button" type="button" onClick={() => onNavigate('/login')}>
                로그인으로 이동
              </button>
            </div>
          )}

          {profile && (
            <>
              <dl className="profile-grid">
                <div>
                  <dt>회원 번호</dt>
                  <dd>{profile.memberId}</dd>
                </div>
                <div>
                  <dt>이메일</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div>
                  <dt>휴대폰 번호</dt>
                  <dd>{formatPhone(profile.phoneNumber)}</dd>
                </div>
                <div>
                  <dt>권한</dt>
                  <dd>{profile.role}</dd>
                </div>
                <div>
                  <dt>회원 상태</dt>
                  <dd>{profile.memberStatus}</dd>
                </div>
                <div>
                  <dt>가입일</dt>
                  <dd>{formatDate(profile.createdAt)}</dd>
                </div>
              </dl>

              <form className="profile-edit" onSubmit={handleSave}>
                <label htmlFor="nickname">닉네임</label>
                <div>
                  <input
                    id="nickname"
                    maxLength="30"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                  />
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? '저장 중...' : '프로필 저장'}
                  </button>
                </div>
              </form>

              <div className="mypage-danger">
                <button type="button" onClick={handleWithdraw}>
                  회원 탈퇴
                </button>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

function formatPhone(phoneNumber) {
  if (!phoneNumber) return '-'
  const digits = phoneNumber.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  return phoneNumber
}

function formatDate(value) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

function getReadableError(message, fallback) {
  if (!message) return fallback
  if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }
  if (message.length > 80 || /[�?]/.test(message)) return fallback
  return message
}

export default MyPage
