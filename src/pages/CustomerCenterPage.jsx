import { useMemo, useState } from "react";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import { submitInquiry } from "../api/inquiryApi";
import {
  customerTabs,
  faqCategories,
  faqItems,
  noticeItems,
  serviceCards,
} from "../data/customerCenterMock";

const initialInquiryForm = {
  category: "",
  title: "",
  content: "",
};

const inquiryCategoryOptions = [
  { value: "ORDER", label: "주문 문의" },
  { value: "PAYMENT", label: "결제 문의" },
  { value: "PRODUCT", label: "상품 문의" },
  { value: "DELIVERY", label: "배송 문의" },
  { value: "ACCOUNT", label: "회원/계정 문의" },
  { value: "ETC", label: "기타 문의" },
];

const tabIcons = {
  notice: "!",
  faq: "?",
  inquiry: "✎",
  service: "□",
};

function getInitialTab() {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return customerTabs.some((item) => item.id === tab) ? tab : "notice";
}

function CustomerCenterPage() {
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [activeFaqCategory, setActiveFaqCategory] = useState("전체");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [inquiryForm, setInquiryForm] = useState(initialInquiryForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFaqItems = useMemo(() => {
    if (activeFaqCategory === "전체") {
      return faqItems;
    }

    return faqItems.filter((item) => item.category === activeFaqCategory);
  }, [activeFaqCategory]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMessage("");
    window.history.pushState({}, "", `/customer-center?tab=${tabId}`);
  };

  const handleInquiryChange = (event) => {
    const { name, value } = event.target;
    setInquiryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage("");
  };

  const handleInquirySubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await submitInquiry({
        category: inquiryForm.category,
        title: inquiryForm.title.trim(),
        content: inquiryForm.content.trim(),
      });
      setInquiryForm(initialInquiryForm);
      setMessage("문의가 접수되었습니다.");
    } catch (error) {
      setMessage(error.message || "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-center-page">
      <Header />
      <main>
        <section className="customer-hero" aria-label="고객센터 소개">
          <div className="customer-hero-inner">
            <h1>Nailed 고객센터</h1>
            <p>
              공지사항, 자주 묻는 질문과 문의를 통해
              <br />
              도움이 필요한 정보를 빠르게 확인할 수 있습니다.
            </p>
          </div>
        </section>

        <section className="customer-center-content">
          <aside className="customer-tabs" aria-label="고객센터 메뉴">
            <h2>고객센터 메뉴</h2>
            {customerTabs.map((tab) => (
              <button
                type="button"
                className={activeTab === tab.id ? "active" : ""}
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
              >
                <span aria-hidden="true">{tabIcons[tab.icon]}</span>
                {tab.label}
                <b aria-hidden="true">›</b>
              </button>
            ))}
          </aside>

          <div className="customer-panel">
            {activeTab === "notice" && (
              <section>
                <div className="customer-panel-head">
                  <h2>공지사항</h2>
                  <div className="notice-tools">
                    <select aria-label="공지 구분">
                      <option>전체</option>
                      <option>점검 안내</option>
                      <option>운영 정책</option>
                      <option>서비스 안내</option>
                      <option>이벤트</option>
                    </select>
                    <input type="search" placeholder="검색어를 입력해주세요." aria-label="공지 검색" />
                  </div>
                </div>
                <div className="notice-table">
                  <div className="notice-row notice-head">
                    <span>제목</span>
                    <span>구분</span>
                    <span>작성일</span>
                  </div>
                  {noticeItems.map((item) => (
                    <div className="notice-row" key={item.title}>
                      <strong>{item.title}</strong>
                      <span className="notice-badge">{item.category}</span>
                      <time dateTime={item.date}>{item.date}</time>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "faq" && (
              <section>
                <div className="customer-panel-head">
                  <h2>자주 묻는 질문</h2>
                </div>
                <div className="faq-categories" aria-label="FAQ 카테고리">
                  {faqCategories.map((category) => (
                    <button
                      type="button"
                      className={activeFaqCategory === category ? "active" : ""}
                      key={category}
                      onClick={() => {
                        setActiveFaqCategory(category);
                        setOpenFaqIndex(0);
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="faq-list">
                  {filteredFaqItems.map((item, index) => (
                    <div className="faq-item" key={item.question}>
                      <button type="button" onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}>
                        <span>{item.category}</span>
                        {item.question}
                        <b aria-hidden="true">{openFaqIndex === index ? "−" : "+"}</b>
                      </button>
                      {openFaqIndex === index && <p>{item.answer}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "inquiry" && (
              <section>
                <div className="customer-panel-head">
                  <h2>1:1 문의</h2>
                </div>
                <form className="inquiry-form" onSubmit={handleInquirySubmit}>
                  <label>
                    문의 유형
                    <select name="category" value={inquiryForm.category} onChange={handleInquiryChange} required>
                      <option value="">문의 유형을 선택해주세요.</option>
                      {inquiryCategoryOptions.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    제목
                    <input
                      type="text"
                      name="title"
                      value={inquiryForm.title}
                      onChange={handleInquiryChange}
                      placeholder="제목을 입력해주세요."
                      required
                    />
                  </label>
                  <label>
                    내용
                    <textarea
                      name="content"
                      value={inquiryForm.content}
                      onChange={handleInquiryChange}
                      placeholder="문의 내용을 입력해주세요."
                      rows="7"
                      required
                    />
                  </label>
                  {message && <p className="inquiry-message">{message}</p>}
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "접수 중..." : "문의 접수"}
                  </button>
                </form>
              </section>
            )}

            {activeTab === "service" && (
              <section>
                <div className="customer-panel-head">
                  <h2>서비스</h2>
                </div>
                <div className="service-card-list">
                  {serviceCards.map((item) => (
                    <a href={item.href} className="service-card" key={item.title}>
                      <span className="service-card-icon" aria-hidden="true">{item.icon}</span>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <span className="service-card-button">자세히 보기</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default CustomerCenterPage;
