import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import "../styles/error-page.css";

const ERROR_CONTENT = {
  400: {
    title: "잘못된 요청입니다",
    description: "요청 정보가 올바르지 않습니다. 입력한 주소나 요청 내용을 다시 확인해주세요.",
    tone: "!",
    primary: { label: "홈으로 이동", path: "/" },
    secondary: { label: "이전 페이지", action: "back" },
  },
  401: {
    title: "로그인이 필요한 페이지입니다",
    description: "이 페이지는 로그인이 필요한 서비스입니다. 로그인 후 다시 시도해주세요.",
    tone: "lock",
    primary: { label: "로그인하기", path: "/login" },
    secondary: { label: "홈으로 이동", path: "/" },
  },
  403: {
    title: "접근 권한이 없습니다",
    description: "요청하신 페이지에 접근할 권한이 없습니다.",
    tone: "shield",
    primary: { label: "홈으로 이동", path: "/" },
    secondary: { label: "이전 페이지", action: "back" },
  },
  404: {
    title: "페이지를 찾을 수 없습니다",
    description: "입력하신 주소가 올바르지 않거나, 페이지가 삭제되었거나 변경되었을 수 있습니다.",
    tone: "search",
    primary: { label: "홈으로 이동", path: "/" },
    secondary: { label: "이전 페이지", action: "back" },
  },
  500: {
    title: "서비스에 일시적인 문제가 발생했습니다",
    description: "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    tone: "tool",
    primary: { label: "홈으로 이동", path: "/" },
    secondary: { label: "다시 시도", action: "reload" },
  },
  503: {
    title: "일시적으로 서비스를 이용할 수 없습니다",
    description: "서비스 점검 또는 일시적인 문제로 이용이 어렵습니다. 잠시 후 다시 시도해주세요.",
    tone: "clock",
    primary: { label: "홈으로 이동", path: "/" },
    secondary: { label: "다시 시도", action: "reload" },
  },
};

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function handleAction(action) {
  if (!action) return;
  if (action.path) {
    navigate(action.path);
    return;
  }
  if (action.action === "back") {
    window.history.length > 1 ? window.history.back() : navigate("/");
    return;
  }
  if (action.action === "reload") {
    window.location.reload();
  }
}

function ErrorPage({ statusCode = 404 }) {
  const code = Number(statusCode);
  const content = ERROR_CONTENT[code] || ERROR_CONTENT[404];

  return (
    <div className="error-page">
      <Header />
      <main className="error-page-main">
        <section className="error-card" aria-labelledby="error-page-title">
          <div className="error-visual" aria-hidden="true">
            <div className={`error-symbol error-symbol-${content.tone}`}>
              <span>{content.tone === "search" ? "?" : content.tone === "tool" ? "!" : ""}</span>
            </div>
          </div>
          <div className="error-copy">
            <p className="error-code">{code}</p>
            <h1 id="error-page-title">{content.title}</h1>
            <p className="error-description">{content.description}</p>
            <div className="error-actions">
              <button type="button" className="error-primary" onClick={() => handleAction(content.primary)}>
                {content.primary.label}
              </button>
              {content.secondary && (
                <button type="button" className="error-secondary" onClick={() => handleAction(content.secondary)}>
                  {content.secondary.label}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ErrorPage;
