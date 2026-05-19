import React, { useState, useEffect } from 'react';
import axios from 'axios';

const STATUS_LABEL = {
  REQUESTED: '주문접수',
  PAID:      '결제완료',
  SHIPPING:  '배송중',
  DELIVERED: '배송완료',
  COMPLETED: '구매확정',
  CANCELLED: '취소됨',
};

const STATUS_STEPS = [
  { key: 'REQUESTED', label: '주문접수' },
  { key: 'PAID',      label: '결제완료' },
  { key: 'SHIPPING',  label: '배송중'   },
  { key: 'DELIVERED', label: '배송완료' },
  { key: 'COMPLETED', label: '구매확정' },
];

const METHOD_LABEL = {
  card: '신용/체크카드', kakao: '카카오페이',
  naver: '네이버페이',  toss: '토스페이',
  phone: '휴대폰 결제', bank: '무통장 입금',
};

const s = {
  page: { minHeight: '100vh', background: '#f5f6f7', padding: '40px 20px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  inner: { maxWidth: '560px', margin: '0 auto' },
  title: { fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '8px' },
  orderId: { fontSize: '13px', color: '#888', fontFamily: 'monospace', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: '12px', fontWeight: '700', color: '#168f88', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e8f5f4' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px', gap: '12px' },
  rowLabel: { color: '#888', minWidth: '90px' },
  rowValue: { textAlign: 'right', wordBreak: 'break-all' },
  steps: { display: 'flex', padding: '20px 0 28px' },
  step: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative' },
  stepLine: (done) => ({ position: 'absolute', top: '13px', left: '50%', width: '100%', height: '2px', background: done ? '#168f88' : '#e0e0e0' }),
  backBtn: { display: 'block', width: '100%', padding: '14px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit' },
  badge: (status) => {
    const colors = { REQUESTED: ['#fff3e0','#f57c00'], PAID: ['#e8f5e9','#2e7d32'], SHIPPING: ['#e3f2fd','#1565c0'], DELIVERED: ['#f3e5f5','#6a1b9a'], COMPLETED: ['#e8f5f4','#168f88'], CANCELLED: ['#ffebee','#c62828'] };
    const [bg, color] = colors[status] || ['#f5f5f5','#555'];
    return { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: bg, color };
  },
  productRow: { display: 'flex', gap: '14px', alignItems: 'center' },
  productImg: { width: '64px', height: '64px', borderRadius: '8px', background: '#f0f0f0', objectFit: 'cover', flexShrink: 0 },
};

const fmt = (v) => v ? new Date(v).toLocaleString('ko-KR') : '-';
const won = (v) => v != null ? `${Number(v).toLocaleString()}원` : '-';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function getProductImageUrl(product) {
  if (product?.imageUrl) {
    return product.imageUrl;
  }

  if (Array.isArray(product?.imageUrls)) {
    return product.imageUrls.find(Boolean) ?? '';
  }

  return '';
}

export default function OrderDetail({ orderId }) {
  const [order,      setOrder]      = useState(null);
  const [product,    setProduct]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const completed = (() => { try { return JSON.parse(sessionStorage.getItem('completedOrder') || 'null'); } catch { return null; } })();
  const productId = completed?.productId;

  useEffect(() => {
    if (!orderId) { setError('주문 번호가 없습니다.'); setLoading(false); return; }

    const fetchOrder   = axios.get(`/api/orders/${orderId}`);
    const fetchProduct = productId ? axios.get(`/api/products/${productId}`) : Promise.resolve(null);

    Promise.all([fetchOrder, fetchProduct])
      .then(([orderRes, productRes]) => {
        setOrder(orderRes.data);
        if (productRes) setProduct(productRes.data);
      })
      .catch(() => {
        // 상품 조회 실패는 무시, 주문만 표시
        axios.get(`/api/orders/${orderId}`)
          .then((res) => setOrder(res.data))
          .catch(() => setError('주문 정보를 불러오지 못했습니다.'));
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div style={s.page}><div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>로딩 중...</div></div>;

  if (error || !order) return (
    <div style={s.page}>
      <div style={{ ...s.inner, textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '16px', color: '#555', marginBottom: '8px' }}>{error || '주문 정보를 찾을 수 없습니다.'}</div>
        <button style={{ ...s.backBtn, width: 'auto', padding: '10px 24px', marginTop: '20px', display: 'inline-block' }} onClick={() => navigate('/')}>홈으로</button>
      </div>
    </div>
  );

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order.orderStatus);
  const imageUrl = getProductImageUrl(product);
  const title = completed?.title || product?.title || '-';

  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* 스텝바 */}
        {order.orderStatus !== 'CANCELLED' && (
          <div style={s.steps}>
            {STATUS_STEPS.map((step, i) => {
              const done = i < currentStep, active = i === currentStep;
              return (
                <div key={step.key} style={s.step}>
                  {i < STATUS_STEPS.length - 1 && <div style={s.stepLine(done)} />}
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', background: done ? '#168f88' : '#fff', border: `2px solid ${done || active ? '#168f88' : '#ddd'}`, color: done ? '#fff' : active ? '#168f88' : '#ccc', fontWeight: '600' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '11px', color: done || active ? '#168f88' : '#bbb', whiteSpace: 'nowrap' }}>{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={s.title}>주문 상세 내역</div>
        <div style={s.orderId}>
          {order.orderId}
          <span style={s.badge(order.orderStatus)}>{STATUS_LABEL[order.orderStatus] || order.orderStatus}</span>
        </div>

        {/* 상품 정보 */}
        <div style={s.card}>
          <div style={s.cardTitle}>상품 정보</div>
          <div style={s.productRow}>
            {imageUrl && <img src={imageUrl} alt={title} style={s.productImg} />}
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>{title}</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#168f88' }}>{won(order.finalPrice)}</div>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div style={s.card}>
          <div style={s.cardTitle}>기본 정보</div>
          <div style={s.row}><span style={s.rowLabel}>주문 번호</span><span style={{ ...s.rowValue, fontFamily: 'monospace', fontSize: '13px' }}>{order.orderId}</span></div>
          <div style={{ ...s.row, borderBottom: 'none' }}><span style={s.rowLabel}>주문 상태</span><span style={s.rowValue}><span style={s.badge(order.orderStatus)}>{STATUS_LABEL[order.orderStatus] || order.orderStatus}</span></span></div>
        </div>

        {/* 결제 정보 */}
        <div style={s.card}>
          <div style={s.cardTitle}>결제 정보</div>
          <div style={s.row}><span style={s.rowLabel}>상품 금액</span><span style={s.rowValue}>{won(order.productAmount)}</span></div>
          <div style={s.row}><span style={s.rowLabel}>배송비</span><span style={s.rowValue}>{order.shippingFee === 0 ? '무료' : won(order.shippingFee)}</span></div>
          <div style={s.row}><span style={s.rowLabel}>수수료율</span><span style={s.rowValue}>{order.commission}%</span></div>
          <div style={{ ...s.row, color: '#168f88', fontWeight: '700' }}><span style={{ ...s.rowLabel, color: '#168f88' }}>최종 결제 금액</span><span style={{ ...s.rowValue, fontSize: '16px' }}>{won(order.finalPrice)}</span></div>
          {completed?.method && <div style={{ ...s.row, borderBottom: 'none' }}><span style={s.rowLabel}>결제 수단</span><span style={s.rowValue}>{METHOD_LABEL[completed.method] || completed.method}</span></div>}
        </div>

        {/* 배송지 */}
        <div style={s.card}>
          <div style={s.cardTitle}>배송지 정보</div>
          <div style={s.row}><span style={s.rowLabel}>수령자</span><span style={s.rowValue}>{order.receiverName}</span></div>
          <div style={s.row}><span style={s.rowLabel}>연락처</span><span style={s.rowValue}>{order.receiverPhone}</span></div>
          <div style={s.row}><span style={s.rowLabel}>주소</span><span style={s.rowValue}>[{order.receiverZipcode}] {order.receiverAddress} {order.receiverAddressDetail}</span></div>
          {order.deliveryRequest && <div style={{ ...s.row, borderBottom: 'none' }}><span style={s.rowLabel}>배송 요청</span><span style={s.rowValue}>{order.deliveryRequest}</span></div>}
        </div>

        {/* 타임라인 */}
        <div style={s.card}>
          <div style={s.cardTitle}>주문 타임라인</div>
          {[
            { label: '주문접수', val: order.createdAt },
            { label: '결제완료', val: order.paidAt },
            { label: '배송중',   val: order.shippedAt },
            { label: '배송완료', val: order.deliveredAt },
            { label: '구매확정', val: order.completedAt },
            { label: '취소됨',  val: order.cancelledAt },
          ].filter((t) => t.val).map((t, i, arr) => (
            <div key={t.label} style={{ ...s.row, ...(i === arr.length - 1 ? { borderBottom: 'none' } : {}) }}>
              <span style={s.rowLabel}>{t.label}</span>
              <span style={{ ...s.rowValue, fontFamily: 'monospace', fontSize: '12px' }}>{fmt(t.val)}</span>
            </div>
          ))}
          {!order.createdAt && <div style={{ color: '#bbb', fontSize: '13px', textAlign: 'center' }}>타임라인 정보가 없습니다.</div>}
        </div>

        {/* 뒤로가기 — ProductDetailPage로 이동 */}
        <button
          style={s.backBtn}
          onClick={() => productId ? navigate(`/product/${productId}`) : navigate('/')}
        >
          상품 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}
