import React, { useState, useEffect } from 'react';
import kakaoIcon from '../assets/kakaopay.png';
import naverIcon from '../assets/naverpay.png';
import tossIcon  from '../assets/tosspay.png';

const s = {
  page: { minHeight: '100vh', background: '#f5f6f7', padding: '40px 20px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  inner: { maxWidth: '560px', margin: '0 auto' },
  title: { fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #168f88' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: '12px', fontWeight: '700', color: '#168f88', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e8f5f4' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px' },
  rowLast: { display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '14px' },
  rowLabel: { color: '#888' },
  rowTotal: { display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '16px', fontWeight: '700', color: '#168f88' },
  steps: { display: 'flex', alignItems: 'flex-start', padding: '0 0 24px' },
  step: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative' },
  stepLine: { position: 'absolute', top: '13px', left: '50%', width: '100%', height: '1px', background: '#e0e0e0' },
  methodGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
  methodBtn: (selected) => ({
    padding: '14px', border: `2px solid ${selected ? '#168f88' : '#e0e0e0'}`,
    borderRadius: '10px', background: selected ? '#f0faf9' : '#fff',
    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
    fontSize: '15px', fontWeight: selected ? '700' : '500', color: selected ? '#168f88' : '#333',
  }),
  methodIcon: { fontSize: '20px', marginBottom: '4px', display: 'block' },
  payBtn: { display: 'block', width: '100%', padding: '16px', background: '#168f88', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
  alertSuccess: { padding: '14px', borderRadius: '8px', background: '#e8f5f4', border: '1px solid #168f88', color: '#168f88', textAlign: 'center', marginBottom: '12px', fontSize: '15px', fontWeight: '600' },
  alertError: { padding: '12px', borderRadius: '8px', background: '#fff0f0', border: '1px solid #e05c5c', color: '#e05c5c', marginBottom: '12px', fontSize: '13px' },
  safeBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: '#f0faf9', border: '1px solid #c0e8e4',
    borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
  },
  noticeBanner: {
    background: '#fffbea', border: '1px solid #ffe08a',
    borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
    fontSize: '13px', color: '#7a6000', lineHeight: '1.6',
  },
  sellerRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  badge: (color) => ({
    fontSize: '11px', fontWeight: '700', color: '#fff',
    background: color, borderRadius: '4px', padding: '2px 7px',
  }),
  divider: { borderBottom: '1px solid #f5f5f5', margin: '10px 0' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '14px' },
  refundBox: {
    background: '#f9f9f9', borderRadius: '8px', padding: '14px 16px',
    fontSize: '13px', color: '#666', lineHeight: '1.7', marginTop: '12px',
  },
};

const STEPS = ['주문서', '결제', '완료'];
const COMMISSION_RATE = 0.02;

const METHODS = [
  { id: 'card',  icon: '💳',      label: '신용/체크카드' },
  { id: 'kakao', icon: kakaoIcon, label: '카카오페이' },
  { id: 'naver', icon: naverIcon, label: '네이버페이' },
  { id: 'toss',  icon: tossIcon,  label: '토스페이' },
  { id: 'phone', icon: '📱',      label: '휴대폰 결제' },
  { id: 'bank',  icon: '🏧',      label: '무통장 입금' },
];

const METHOD_LABELS = {
  card: '신용/체크카드', kakao: '카카오페이',
  naver: '네이버페이', toss: '토스페이',
  phone: '휴대폰 결제', bank: '무통장 입금',
};

const BADGE_COLOR = { BRONZE: '#cd7f32', SILVER: '#9e9e9e', GOLD: '#f5a623', DIAMOND: '#5c9bd6' };

function getExpectedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function PaymentPage() {
  const [pendingPayment, setPendingPayment] = useState(null);
  const [pendingOrder,   setPendingOrder]   = useState(null);
  const [orderForm,      setOrderForm]      = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [paying, setPaying] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    const pay  = sessionStorage.getItem('pendingPayment');
    const ord  = sessionStorage.getItem('pendingOrder');
    const form = sessionStorage.getItem('orderForm');
    if (pay)  setPendingPayment(JSON.parse(pay));
    else setError('잘못된 접근이거나 결제 정보가 존재하지 않습니다.');
    if (ord)  setPendingOrder(JSON.parse(ord));
    if (form) setOrderForm(JSON.parse(form));
  }, []);

  if (error && !pendingPayment) return (
    <div style={s.page}>
      <div style={{ ...s.inner, textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '16px', color: '#555', marginBottom: '8px' }}>잘못된 접근이거나 결제 정보가 존재하지 않습니다.</div>
        <button style={{ ...s.payBtn, width: 'auto', padding: '10px 24px', marginTop: '20px' }} onClick={() => navigate('/')}>홈으로</button>
      </div>
    </div>
  );

  if (!pendingPayment) return <div style={s.page}><div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>로딩 중...</div></div>;

  const { orderId, finalPrice, title } = pendingPayment;
  const productAmount = pendingOrder?.productAmount || 0;
  const shippingFee   = pendingOrder?.shippingFee   || 0;
  const commission    = Math.floor(productAmount * COMMISSION_RATE);
  const sellerNick    = pendingOrder?.sellerNickname || '판매자';
  const sellerBadge   = pendingOrder?.sellerBadge    || 'Bronze';

  const onPay = async () => {
    if (paying) return;
    setPaying(true);
    setError('');
    try {
      await new Promise((res) => setTimeout(res, 1500));
      const mockImpUid = `mock_imp_${Date.now()}`;
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ impUid: mockImpUid, amount: finalPrice }),
      });
      if (!res.ok) throw new Error('결제 처리 실패');
      sessionStorage.removeItem('orderForm');
      sessionStorage.removeItem('pendingOrder');
      sessionStorage.removeItem('pendingPayment');
      sessionStorage.setItem('completedOrder', JSON.stringify({
        orderId, finalPrice, title, method: selectedMethod,
        receiver: orderForm,
        productAmount, shippingFee, commission,
      }));
      setDone(true);
    } catch (e) {
      setError(e.message || '결제 중 오류가 발생했습니다.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* 스텝바 */}
        <div style={s.steps}>
          {STEPS.map((label, i) => {
            const done_ = done ? i <= 2 : i <= 1;
            const active = done ? i === 2 : i === 1;
            return (
              <div key={label} style={s.step}>
                {i < STEPS.length - 1 && <div style={s.stepLine} />}
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', background: done_ ? '#168f88' : '#fff', border: `2px solid ${done_ || active ? '#168f88' : '#ddd'}`, color: done_ ? '#fff' : active ? '#168f88' : '#ccc', fontWeight: '600' }}>
                  {done_ ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '11px', color: done_ || active ? '#168f88' : '#bbb' }}>{label}</span>
              </div>
            );
          })}
        </div>

        <div style={s.title}>{done ? '결제 완료' : '결제 진행'}</div>

        {/* ── 결제 진행 화면 ── */}
        {!done && (<>

          {/* 안전결제 배너 */}
          <div style={s.safeBanner}>
            <span style={{ fontSize: '22px' }}>🔒</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#168f88' }}>네일드 안전결제로 구매자를 보호합니다</div>
              <div style={{ fontSize: '12px', color: '#5aa39e', marginTop: '2px' }}>결제 금액은 판매자 발송 확인 후 정산됩니다</div>
            </div>
          </div>

          {/* 주문 확인 */}
          <div style={s.card}>
            <div style={s.cardTitle}>주문 확인</div>
            <div style={s.row}><span style={s.rowLabel}>주문 번호</span><span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{orderId}</span></div>
            <div style={s.row}><span style={s.rowLabel}>상품명</span><span style={{ fontWeight: '500' }}>{title}</span></div>
            <div style={s.row}><span style={s.rowLabel}>상품 금액</span><span>{productAmount.toLocaleString()}원</span></div>
            <div style={s.row}><span style={s.rowLabel}>배송비</span><span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span></div>
            <div style={s.row}><span style={s.rowLabel}>수수료 ({(COMMISSION_RATE * 100).toFixed(0)}%)</span><span>{commission.toLocaleString()}원</span></div>
            <div style={s.rowTotal}><span>총 결제 금액</span><span>{(finalPrice || 0).toLocaleString()}원</span></div>
          </div>

          {/* 판매자 정보 */}
          <div style={s.card}>
            <div style={s.cardTitle}>판매자 정보</div>
            <div style={s.sellerRow}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{sellerNick}</div>
                <span style={s.badge(BADGE_COLOR[sellerBadge] || '#cd7f32')}>{sellerBadge}</span>
              </div>
            </div>
          </div>

          {/* 배송지 요약 */}
          {orderForm && (
            <div style={s.card}>
              <div style={s.cardTitle}>배송지 정보</div>
              <div style={s.infoRow}><span style={s.rowLabel}>받는 분</span><span>{orderForm.receiverName}</span></div>
              <div style={s.infoRow}><span style={s.rowLabel}>연락처</span><span>{orderForm.receiverPhone}</span></div>
              <div style={s.infoRow}><span style={s.rowLabel}>주소</span><span style={{ textAlign: 'right', maxWidth: '60%' }}>{orderForm.address} {orderForm.addressDetail}</span></div>
              {orderForm.deliveryRequest && (
                <div style={s.infoRow}><span style={s.rowLabel}>요청사항</span><span>{orderForm.deliveryRequest}</span></div>
              )}
            </div>
          )}

          {/* 결제 수단 */}
          <div style={s.card}>
            <div style={s.cardTitle}>결제 수단 선택</div>
            <div style={s.methodGrid}>
              {METHODS.map(({ id, icon, label }) => (
                <button key={id} style={s.methodBtn(selectedMethod === id)} onClick={() => setSelectedMethod(id)}>
                {['kakao', 'naver', 'toss'].includes(id)
                ? <img src={icon} alt={label} style={{ width: '35px', height: '35px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />
  : <span style={s.methodIcon}>{icon}</span>
}
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {error && <div style={s.alertError}>{error}</div>}
            <button style={s.payBtn} onClick={onPay} disabled={paying}>
              {paying ? '처리 중...' : `${(finalPrice || 0).toLocaleString()}원 결제하기`}
            </button>
            <button style={{ display: 'block', width: '100%', padding: '14px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
              onClick={() => window.history.back()}>돌아가기</button>
          </div>

          {/* 결제 취소 안내 */}
          <div style={s.noticeBanner}>
            💡 <strong>결제 취소 안내</strong><br />
            판매자가 배송 처리 전이라면 마이페이지에서 주문 취소가 가능합니다.<br />
            배송 시작 후에는 판매자와 직접 협의가 필요합니다.
          </div>

        </>)}

        {/* ── 결제 완료 화면 ── */}
        {done && (<>

          <div style={s.card}>
            <div style={s.alertSuccess}>✓ 결제가 완료되었습니다</div>

            <div style={s.cardTitle}>주문 확인</div>
            <div style={s.infoRow}><span style={s.rowLabel}>주문 번호</span><span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{orderId}</span></div>
            <div style={s.infoRow}><span style={s.rowLabel}>상품명</span><span style={{ fontWeight: '500' }}>{title}</span></div>
            <div style={s.infoRow}><span style={s.rowLabel}>결제 수단</span><span>{METHOD_LABELS[selectedMethod]}</span></div>
            <div style={{ ...s.rowTotal, paddingTop: '10px' }}><span>결제 금액</span><span>{(finalPrice || 0).toLocaleString()}원</span></div>
          </div>

          {/* 배송지 */}
          {orderForm && (
            <div style={s.card}>
              <div style={s.cardTitle}>배송지 정보</div>
              <div style={s.infoRow}><span style={s.rowLabel}>받는 분</span><span>{orderForm.receiverName}</span></div>
              <div style={s.infoRow}><span style={s.rowLabel}>연락처</span><span>{orderForm.receiverPhone}</span></div>
              <div style={s.infoRow}><span style={s.rowLabel}>주소</span><span style={{ textAlign: 'right', maxWidth: '60%' }}>{orderForm.address} {orderForm.addressDetail}</span></div>
            </div>
          )}

          {/* 배송 예정 */}
          <div style={s.card}>
            <div style={s.cardTitle}>배송 안내</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
              <span style={{ fontSize: '28px' }}>📦</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>오늘 출발 시 {getExpectedDelivery()} 도착 예정</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>판매자 발송 후 택배사 사정에 따라 달라질 수 있습니다</div>
              </div>
            </div>
            <div style={s.refundBox}>
              <strong>취소 / 환불 정책</strong><br />
              · 배송 전: 마이페이지에서 직접 취소 가능<br />
              · 배송 후: 판매자와 협의 후 반품 진행<br />
              · 상품 상태 허위 기재 시 Nailed 고객센터에 신고 가능
            </div>
          </div>

          <button style={s.payBtn} onClick={() => navigate(`/order/detail/${orderId}`)}>주문 상세 보기</button>
          <button style={{ display: 'block', width: '100%', padding: '14px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
            onClick={() => navigate('/')}>홈으로 돌아가기</button>

        </>)}

      </div>
    </div>
  );
}
