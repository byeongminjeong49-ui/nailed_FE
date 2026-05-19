// src/api/orderApi.js

const BASE = '/api/orders';

const req = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const createOrder       = (buyerId, sellerId, body) =>
  req(`${BASE}?buyerId=${buyerId}&sellerId=${sellerId}`, { method: 'POST', body: JSON.stringify(body) });

export const getOrder          = (orderId) => req(`${BASE}/${orderId}`);

export const countSellerOrders = (sellerId, status) =>
  req(`${BASE}/seller/${sellerId}/count?status=${status}`);

export const registerTracking  = (orderId, body) =>
  req(`${BASE}/${orderId}/shipping`, { method: 'PATCH', body: JSON.stringify(body) });

export const confirmDelivery   = (orderId) =>
  req(`${BASE}/${orderId}/delivered`, { method: 'PATCH' });
