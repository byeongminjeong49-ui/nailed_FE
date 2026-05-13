const footerGroups = [
  {
    title: "서비스",
    links: ["판매하기", "이용안내", "수수료 안내", "배송 안내"],
  },
  {
    title: "마이페이지",
    links: ["주문 내역", "찜 목록", "내가 판매한 상품", "정산 내역"],
  },
  {
    title: "고객센터",
    links: ["공지사항", "자주 묻는 질문", "1:1 문의", "제휴/입점/사업문의"],
  },
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <a className="brand" href="/">
            Nailed
          </a>
          <p>
            프리미엄 중고 거래 플랫폼, NAILED
            <br />
            당신의 가치를 가장 잘 보여주는 거래
          </p>
          <div className="social-links">
            <a href="/" aria-label="인스타그램">◎</a>
            <a href="/" aria-label="페이스북">f</a>
            <a href="/" aria-label="트위터">t</a>
            <a href="/" aria-label="유튜브">▶</a>
          </div>
        </div>
        {footerGroups.map((group) => (
          <div className="footer-links" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <a href="/" key={link}>
                {link}
              </a>
            ))}
          </div>
        ))}
        <div className="footer-contact">
          <h2>고객센터</h2>
          <strong>02-1234-5678</strong>
          <p>평일 10:00 - 18:00 (주말/공휴일 휴무)</p>
          <span>이메일</span>
          <a href="mailto:help@nailed.co.kr">help@nailed.co.kr</a>
        </div>
      </div>
      <p className="copyright">© 2026 NAILED, Inc. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
