import UserProfilePage from "./UserProfilePage";

const SESSION_KEY = "nailed_session";

function getCurrentMemberId() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return session?.member_id || session?.memberId || session?.id || null;
  } catch {
    return null;
  }
}

function getMyPageMemberId() {
  return getCurrentMemberId();
}

function MyPage() {
  return <UserProfilePage memberId={getMyPageMemberId()} hideFooter />;
}

export default MyPage;
