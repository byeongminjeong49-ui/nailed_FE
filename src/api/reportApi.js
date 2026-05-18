const KEY = "nailed_mock_reports";

export const REPORT_REASONS = [
  { code: "FRAUD", label: "사기" },
  { code: "ABUSE", label: "욕설/비방" },
  { code: "PROHIBITED_ITEM", label: "금지상품" },
  { code: "ETC", label: "기타" },
];

const LABEL_MAP = Object.fromEntries(REPORT_REASONS.map((r) => [r.code, r.label]));

function load() { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
function genId(list) {
  const max = list.reduce((m, r) => { const n = parseInt(r.reportId.replace("RPT_", ""), 10); return n > m ? n : m; }, 0);
  return `RPT_${String(max + 1).padStart(3, "0")}`;
}
function currentMemberId() {
  try { return JSON.parse(localStorage.getItem("nailed_session") ?? "null")?.member_id ?? null; } catch { return null; }
}

export async function submitReport({ targetMemberId, reasonCode, detail }) {
  await new Promise((r) => setTimeout(r, 450));
  const reporterId = currentMemberId();
  if (!reporterId) throw new Error("로그인이 필요합니다.");
  const list = load();
  const report = { reportId: genId(list), reporterId, targetMemberId, reasonCode, reasonLabel: LABEL_MAP[reasonCode] ?? reasonCode, detail: detail || null, reportStatus: "PENDING", createdAt: new Date().toISOString() };
  save([report, ...list]);
  return report;
}
