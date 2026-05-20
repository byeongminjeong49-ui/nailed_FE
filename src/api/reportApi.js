import { authRequest } from "./authApi";

export const REPORT_REASONS = [
  { code: "FRAUD", label: "사기" },
  { code: "ABUSE", label: "욕설/비방" },
  { code: "PROHIBITED_ITEM", label: "금지상품" },
  { code: "ETC", label: "기타" },
];

async function requestWithAuth(path, options = {}) {
  return authRequest(path, options);
}

export async function submitReport({ targetMemberId, reasonCode, detail }) {
  return requestWithAuth("/api/reports", {
    method: "POST",
    body: JSON.stringify({
      targetMemberId,
      reasonCode,
      detail: detail || null,
    }),
  });
}
