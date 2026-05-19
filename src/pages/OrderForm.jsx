import React, { useState } from 'react';
import axios from 'axios';

const s = {
  page: { minHeight: '100vh', background: '#f5f6f7', padding: '40px 20px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  inner: { maxWidth: '560px', margin: '0 auto' },
  title: { fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #168f88' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: '12px', fontWeight: '700', color: '#168f88', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e8f5f4' },
  productRow: { display: 'flex', gap: '14px', alignItems: 'center' },
  productImg: { width: '64px', height: '64px', borderRadius: '8px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  productName: { fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '4px' },
  productPrice: { fontSize: '18px', fontWeight: '700', color: '#168f88' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px' },
  rowLabel: { color: '#888' },
  rowTotal: { display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '16px', fontWeight: '700', color: '#168f88' },
  formGroup: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: '500' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#fafafa', outline: 'none', boxSizing: 'border-box' },
  agreeBox: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', background: '#f9fffe', border: '1px solid #d0eeec', borderRadius: '8px', marginBottom: '12px', cursor: 'pointer' },
  agreeText: { fontSize: '13px', color: '#333', lineHeight: 1.5 },
  checkbox: { width: '18px', height: '18px', accentColor: '#168f88', flexShrink: 0, marginTop: '1px', cursor: 'pointer' },
  btn: { display: 'block', width: '100%', padding: '16px', background: '#168f88', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' },
  btnDisabled: { display: 'block', width: '100%', padding: '16px', background: '#ccc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'not-allowed' },
};

const COMMISSION_RATE = 0.04; // 4%

export default function OrderForm() {
  const [pendingOrder] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pendingOrder');
      return saved ? JSON.parse(saved) : { productId: 1, title: '기본 상품', productAmount: 0, finalPrice: 0, shippingFee: 0 };
    } catch { return { productId: 1, title: '기본 상품', productAmount: 0, finalPrice: 0, shippingFee: 0 }; }
  });

  const [form, setForm] = useState({
    receiverName: '', receiverPhone: '', zipcode: '',
    address: '', addressDetail: '', deliveryRequest: '',
  });
  const [agree1, setAgree1] = useState(false);

  const commission = Math.floor((pendingOrder.productAmount || 0) * COMMISSION_RATE);
  const shippingFee = pendingOrder.shippingFee || 0;
  const totalPrice = (pendingOrder.productAmount || 0) + shippingFee + commission;
  const canPay = agree1 && form.receiverName && form.receiverPhone && form.address;

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handlePayment = async () => {
    if (!canPay) return;
    try {
      const orderData = {
        productId:             pendingOrder.productId,
        productAmount:         pendingOrder.productAmount,
        shippingFee:           shippingFee,
        receiverName:          form.receiverName,
        receiverPhone:         form.receiverPhone,
        receiverZipcode:       form.zipcode,
        receiverAddress:       form.address,
        receiverAddressDetail: form.addressDetail,
        deliveryRequest:       form.deliveryRequest,
      };
      const response = await axios.post(
        `/api/orders?buyerId=${pendingOrder.buyerId}&sellerId=${pendingOrder.sellerId}`,
        orderData
      );
      if (response.status === 200 || response.status === 201) {
        sessionStorage.removeItem('pendingOrder');
        sessionStorage.setItem('pendingPayment', JSON.stringify({
          orderId:    response.data.orderId,
          finalPrice: totalPrice,
          title:      pendingOrder.title,
          productId:  pendingOrder.productId,
        }));
        window.history.pushState({}, '', '/order/payment');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (error) {
      console.error('주문 처리 중 에러 발생:', error);
      alert('주문 요청에 실패했습니다.');
    }
  };

  const fields = [
    { key: 'receiverName',   label: '수령인 *',      placeholder: '홍길동' },
    { key: 'receiverPhone',  label: '연락처 *',       placeholder: '010-0000-0000' },
    { key: 'zipcode',        label: '우편번호',        placeholder: '12345' },
    { key: 'address',        label: '도로명 주소 *',   placeholder: '서울시 강남구...' },
    { key: 'addressDetail',  label: '상세 주소',       placeholder: '101동 202호' },
    { key: 'deliveryRequest',label: '배송 요청사항',   placeholder: '문 앞에 놓아주세요' },
  ];

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.title}>주문서 작성</div>

        {/* 상품 정보 */}
        <div style={s.card}>
          <div style={s.cardTitle}>상품 정보</div>
          <div style={s.productRow}>
            <div style={s.productImg}>👕</div>
            <div>
              <div style={s.productName}>{pendingOrder.title}</div>
              <div style={s.productPrice}>{(pendingOrder.productAmount || 0).toLocaleString()}원</div>
            </div>
          </div>
        </div>

        {/* 배송지 */}
        <div style={s.card}>
          <div style={s.cardTitle}>배송지 정보</div>
          {fields.map(({ key, label, placeholder }) => (
            <div style={s.formGroup} key={key}>
              <label style={s.label}>{label}</label>
              <input
                style={s.input}
                value={form[key]}
                onChange={onChange(key)}
                placeholder={placeholder}
                onFocus={(e) => e.target.style.borderColor = '#168f88'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>
          ))}
        </div>

        {/* 결제 금액 */}
        <div style={s.card}>
          <div style={s.cardTitle}>결제 금액</div>
          <div style={s.row}><span style={s.rowLabel}>상품 금액</span><span>{(pendingOrder.productAmount || 0).toLocaleString()}원</span></div>
          <div style={s.row}><span style={s.rowLabel}>배송비</span><span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span></div>
          <div style={s.row}><span style={s.rowLabel}>수수료 ({(COMMISSION_RATE * 100).toFixed(0)}%)</span><span>{commission.toLocaleString()}원</span></div>
          <div style={s.rowTotal}><span>총 결제 금액</span><span>{totalPrice.toLocaleString()}원</span></div>
        </div>

        {/* 동의 */}
        <div style={s.card}>
          <div style={s.cardTitle}>결제 동의</div>
          <label style={s.agreeBox}>
            <input type="checkbox" style={s.checkbox} checked={agree1} onChange={(e) => setAgree1(e.target.checked)} />
            <span style={s.agreeText}>주문할 상품의 결제, 배송, 주문정보를 확인하였으며 이에 동의합니다. <span style={{ color: '#168f88', fontWeight: 600 }}>[필수]</span></span>
          </label>

        </div>

        <button style={canPay ? s.btn : s.btnDisabled} onClick={handlePayment} disabled={!canPay}>
          {totalPrice.toLocaleString()}원 안전결제
        </button>
        {!canPay && <p style={{ textAlign: 'center', fontSize: '12px', color: '#e05c5c', marginTop: '8px' }}>배송지 입력 및 필수 동의를 완료해 주세요.</p>}
      </div>
    </div>
  );
}
