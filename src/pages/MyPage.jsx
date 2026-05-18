import { MOCK_SELLERS } from "../api/productApi";
import UserProfilePage from "./UserProfilePage";

const DEMO_MEMBER_ID = "MEMBER_002";
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
  const currentMemberId = getCurrentMemberId();
  const hasSellerProfile = MOCK_SELLERS.some((seller) => seller.memberId === currentMemberId);

  return hasSellerProfile ? currentMemberId : DEMO_MEMBER_ID;
}

function MyPage() {
  return <UserProfilePage memberId={getMyPageMemberId()} hideFooter />;
}

export default MyPage;
