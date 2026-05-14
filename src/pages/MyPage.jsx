import { useEffect, useState } from 'react'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { getMyPage, logout, updateMyProfile, withdrawMember } from '../api/authApi'
import '../styles/mypage.css'

function MyPage({ onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  async function loadProfile() {
    setLoading(true)

    try {
      const data = await getMyPage()
      setProfile(data)
      setNickname(data?.nickname || '')
      setMessage({ type: '', text: '' })
    } catch (error) {
      setProfile(null)
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

    const nextNickname = nickname.trim()

    if (!nextNickname) {
      setMessage({ type: 'error', text: '닉네임을 입력해주세요.' })
      return
    }

    if (nextNickname.length > 30) {
      setMessage({ type: 'error', text: '닉네임은 30자 이하로 입력해주세요.' })
      return
    }

    setSaving(true)

    try {
      const data = await updateMyProfile({ nickname: nextNickname })
      const nextProfile = data || { ...profile, nickname: nextNickname }
      setProfile(nextProfile)
      setNickname(nextProfile.nickname || nextNickname)
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

    clearMemberStorage()
    onNavigate('/login')
  }

  async function handleWithdraw() {
    const confirmed = window.confirm('정말 탈퇴하시겠습니까?')
    if (!confirmed) return

    setWithdrawing(true)

    try {
      await withdrawMember()
      clearMemberStorage()
      onNavigate('/login')
    } catch (error) {
      setMessage({
        type: 'error',
        text: getReadableError(error.message, '회원 탈퇴에 실패했습니다.'),
      })
    } finally {
      setWithdrawing(false)
    }
  }

  const displayName = profile?.nickname || profile?.name || '회원'
  const email = profile?.email || '-'
  const memberId = profile?.memberId ?? profile?.id ?? '-'
  const phoneNumber = profile?.phoneNumber || profile?.phone || profile?.tel
  const role = formatRole(profile?.role)
  const status = formatMemberStatus(profile?.memberStatus || profile?.status)
  const createdAt = profile?.createdAt || profile?.createdDate || profile?.joinedAt
  const updatedAt = profile?.updatedAt || profile?.modifiedAt

  return (
    <div className="mypage-page">
      <Header />
      <main className="mypage-main">
        <section className="mypage-hero" aria-labelledby="mypage-title">
          <div>
            <span className="mypage-eyebrow">MY PAGE</span>
            <h1 id="mypage-title">마이페이지</h1>
            <p>회원 정보 확인과 프로필 수정을 할 수 있습니다.</p>
          </div>
          <button className="outline-button muted mypage-logout" type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </section>

        {message.text && <p className={`status-message ${message.type}`}>{message.text}</p>}

        {loading && (
          <section className="mypage-panel mypage-loading-card" aria-live="polite">
            <div className="mypage-skeleton large" />
            <div className="mypage-skeleton" />
            <div className="mypage-skeleton short" />
          </section>
        )}

        {!loading && !profile && (
          <section className="mypage-panel mypage-empty">
            <strong>로그인이 필요합니다.</strong>
            <p>마이페이지를 보려면 로그인 후 다시 이용해주세요.</p>
            <button className="primary-button" type="button" onClick={() => onNavigate('/login')}>
              로그인으로 이동
            </button>
          </section>
        )}

        {profile && (
          <div className="mypage-layout">
            <aside className="mypage-summary" aria-label="회원 요약">
              <div className="profile-avatar" aria-hidden="true">
                {getInitial(displayName)}
              </div>
              <h2>{displayName}</h2>
              <p>{email}</p>
              <div className="profile-tags">
                <span>{role}</span>
                <span>{status}</span>
              </div>
            </aside>

            <section className="mypage-panel">
              <div className="mypage-section-heading">
                <div>
                  <h2>회원 정보</h2>
                  <p>백엔드에 저장된 내 계정 정보를 확인합니다.</p>
                </div>
              </div>

              <dl className="profile-grid">
                <ProfileItem label="회원 번호" value={memberId} />
                <ProfileItem label="이메일" value={email} />
                <ProfileItem label="휴대폰 번호" value={formatPhone(phoneNumber)} />
                <ProfileItem label="권한" value={role} />
                <ProfileItem label="회원 상태" value={status} />
                <ProfileItem label="가입일" value={formatDate(createdAt)} />
                <ProfileItem label="최근 수정일" value={formatDate(updatedAt)} />
              </dl>

              <form className="profile-edit" onSubmit={handleSave}>
                <div className="profile-edit-copy">
                  <label htmlFor="nickname">닉네임</label>
                  <p>서비스에서 보여지는 이름입니다.</p>
                </div>
                <div>
                  <input
                    id="nickname"
                    maxLength="30"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                  />
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </form>

              <div className="mypage-danger">
                <div>
                  <strong>회원 탈퇴</strong>
                  <p>탈퇴 후 계정 복구가 제한될 수 있습니다.</p>
                </div>
                <button type="button" onClick={handleWithdraw} disabled={withdrawing}>
                  {withdrawing ? '처리 중...' : '회원 탈퇴'}
                </button>
              </div>
            </section>

            <section className="mypage-panel mypage-notice">
              <div className="mypage-section-heading">
                <div>
                  <h2>이용 안내</h2>
                  <p>현재 화면은 실제 회원 API 기반입니다.</p>
                </div>
              </div>
              <ul>
                <li>주문, 찜, 판매 내역은 관련 백엔드 API 확인 후 연결해야 합니다.</li>
                <li>프로필 수정은 닉네임만 전송하도록 구성했습니다.</li>
                <li>로그인 만료 시 다시 로그인하도록 안내합니다.</li>
              </ul>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '-'}</dd>
    </div>
  )
}

function clearMemberStorage() {
  localStorage.removeItem('nailedMember')
}

function formatPhone(phoneNumber) {
  if (!phoneNumber) return '-'
  const digits = String(phoneNumber).replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  return phoneNumber
}

function formatDate(value) {
  if (!value || typeof value !== 'string') return '-'
  return value.replace('T', ' ').slice(0, 16)
}

function formatRole(role) {
  if (!role) return '일반 회원'
  const roleMap = {
    ROLE_ADMIN: '관리자',
    ADMIN: '관리자',
    ROLE_MEMBER: '일반 회원',
    MEMBER: '일반 회원',
    USER: '일반 회원',
  }
  return roleMap[role] || role
}

function formatMemberStatus(status) {
  if (!status) return '정상'
  const statusMap = {
    ACTIVE: '정상',
    INACTIVE: '휴면',
    WITHDRAWN: '탈퇴',
    BLOCKED: '정지',
  }
  return statusMap[status] || status
}

function getInitial(value) {
  if (!value) return 'N'
  return value.trim().slice(0, 1).toUpperCase()
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
