export const customerTabs = [
  { id: "notice", label: "공지사항", icon: "notice" },
  { id: "faq", label: "자주 묻는 질문", icon: "faq" },
  { id: "inquiry", label: "1:1 문의", icon: "inquiry" },
  { id: "service", label: "서비스", icon: "service" },
];

export const noticeItems = [
  { title: "서비스 시스템 점검 안내 (5월 25일)", category: "점검 안내", date: "2024-05-20" },
  { title: "안전한 거래를 위한 본인인증 정책 강화 안내", category: "운영 정책", date: "2024-05-18" },
  { title: "판매 수수료 정책 변경 안내 (6월 1일부터 적용)", category: "서비스 안내", date: "2024-05-15" },
  { title: "여름 시즌 특별 이벤트 안내", category: "이벤트", date: "2024-05-13" },
  { title: "가품 및 부정 거래 관련 운영정책 업데이트 안내", category: "운영 정책", date: "2024-05-10" },
  { title: "고객센터 상담 지연 시간 변경 안내", category: "서비스 안내", date: "2024-05-08" },
];

export const faqCategories = ["전체", "회원", "상품", "거래", "배송", "정산"];

export const faqItems = [
  {
    category: "회원",
    question: "회원가입은 어떻게 하나요?",
    answer: "상단 회원가입 메뉴에서 이메일과 기본 정보를 입력하면 가입할 수 있습니다.",
  },
  {
    category: "상품",
    question: "판매 상품은 어떻게 등록하나요?",
    answer: "판매 메뉴에서 상품명, 가격, 이미지, 설명을 입력해 등록할 수 있습니다.",
  },
  {
    category: "거래",
    question: "거래 중 문제가 생기면 어떻게 하나요?",
    answer: "1:1 문의를 통해 주문 정보와 문제 내용을 남겨주시면 고객센터에서 확인합니다.",
  },
  {
    category: "배송",
    question: "배송 상태는 어디서 확인하나요?",
    answer: "마이페이지의 구매/판매 내역에서 거래별 배송 상태를 확인할 수 있습니다.",
  },
  {
    category: "정산",
    question: "판매 정산은 언제 진행되나요?",
    answer: "거래 완료 후 내부 확인 절차를 거쳐 정산 대기 내역에 반영됩니다.",
  },
];

export const serviceCards = [
  {
    title: "이용안내",
    icon: "01",
    description: "Nailed에서 상품을 찾고 안전하게 거래하는 기본 절차를 확인하세요.",
    href: "/guide",
  },
  {
    title: "수수료 안내",
    icon: "02",
    description: "판매 및 결제 과정에서 적용되는 수수료 기준을 확인하세요.",
    href: "/fees",
  },
  {
    title: "배송 안내",
    icon: "03",
    description: "배송 방식, 배송비, 거래 완료까지의 흐름을 확인하세요.",
    href: "/shipping",
  },
];
