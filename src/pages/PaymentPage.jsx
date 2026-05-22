import React, { useState, useEffect } from 'react';

const s = {
  page: { minHeight: '100vh', background: '#f5f6f7', padding: '40px 20px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  inner: { maxWidth: '560px', margin: '0 auto' },
  title: { fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #168f88' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: '12px', fontWeight: '700', color: '#168f88', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e8f5f4' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px' },
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
    fontSize: '13px', fontWeight: selected ? '700' : '500', color: selected ? '#168f88' : '#333',
  }),
  methodIcon: { fontSize: '20px', marginBottom: '4px', display: 'block' },
  payBtn: { display: 'block', width: '100%', padding: '16px', background: '#168f88', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
  alertSuccess: { padding: '14px', borderRadius: '8px', background: '#e8f5f4', border: '1px solid #168f88', color: '#168f88', textAlign: 'center', marginBottom: '12px', fontSize: '15px', fontWeight: '600' },
  alertError: { padding: '12px', borderRadius: '8px', background: '#fff0f0', border: '1px solid #e05c5c', color: '#e05c5c', marginBottom: '12px', fontSize: '13px' },
};

const STEPS = ['주문서', '결제', '완료'];
const METHODS = [
  { id: 'card',   icon: '💳', label: '신용/체크카드' },
  { id: 'kakao',  icon: '💛', label: '카카오페이',   color: '#FEE500' },
  { id: 'naver',  icon: '🟢', label: '네이버페이',   color: '#03C75A' },
  { id: 'toss',   icon: '🔵', label: '토스페이',     color: '#0064FF' },
  { id: 'phone',  icon: '📱', label: '휴대폰 결제' },
  { id: 'bank',   icon: '🏦', label: '무통장 입금' },
];

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function PaymentPage() {
  const [pendingPayment, setPendingPayment] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [paying, setPaying]   = useState(false);
  const [done,   setDone]     = useState(false);
  const [error,  setError]    = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('pendingPayment');
    if (saved) setPendingPayment(JSON.parse(saved));
    else setError('잘못된 접근이거나 결제 정보가 존재하지 않습니다.');
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

  const onPay = async () => {
    setPaying(true);
    await new Promise((res) => setTimeout(res, 1500));
    alert('결제가 완료되었습니다.');
    sessionStorage.setItem('completedOrder', JSON.stringify({ orderId, finalPrice, title, method: selectedMethod }));
    sessionStorage.removeItem('pendingPayment');
    setDone(true);
    setPaying(false);
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* 스텝바 */}
        <div style={s.steps}>
          {STEPS.map((label, i) => {
            const done_ = i < 1, active = i === 1;
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

        <div style={s.title}>결제 진행</div>

        {/* 주문 확인 */}
        <div style={s.card}>
          <div style={s.cardTitle}>주문 확인</div>
          <div style={s.row}><span style={s.rowLabel}>주문 번호</span><span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{orderId}</span></div>
          <div style={s.row}><span style={s.rowLabel}>상품명</span><span style={{ fontWeight: '500' }}>{title}</span></div>
          <div style={s.rowTotal}><span>결제 금액</span><span>{(finalPrice || 0).toLocaleString()}원</span></div>
        </div>

        {/* 결제 수단 */}
        {!done && (
          <div style={s.card}>
            <div style={s.cardTitle}>결제 수단 선택</div>
            <div style={s.methodGrid}>
              {METHODS.map(({ id, icon, label, color }) => (
                <button key={id} style={s.methodBtn(selectedMethod === id)} onClick={() => setSelectedMethod(id)}>
                  <span style={s.methodIcon}>{icon}</span>
                  <span style={{ color: selectedMethod === id ? '#168f88' : (color || '#333') }}>{label}</span>
                </button>
              ))}
            </div>
            {error && <div style={s.alertError}>{error}</div>}
            <button style={s.payBtn} onClick={onPay} disabled={paying}>
              {paying ? '처리 중...' : `${(finalPrice || 0).toLocaleString()}원 결제하기`}
            </button>
            <button style={{ display: 'block', width: '100%', padding: '14px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }} onClick={() => window.history.back()}>돌아가기</button>
            <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', marginTop: '12px' }}></p>
          </div>
        )}

        {/* 결제 완료 */}
        {done && (
          <div style={s.card}>
            <div style={s.alertSuccess}>✓ 결제가 완료되었습니다</div>
            <button style={s.payBtn} onClick={() => navigate(`/order/detail/${orderId}`)}>주문 상세 보기</button>
          </div>
        )}
      </div>
    </div>
  );
}
