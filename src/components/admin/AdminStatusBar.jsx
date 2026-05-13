import { adminSystemStatus } from "../../data/adminDummyData";

function AdminStatusBar() {
  return (
    <footer className="admin-status-bar">
      <div className="status-summary">
        <span className="status-check" aria-hidden="true">
          ✓
        </span>
        <div>
          <strong>{adminSystemStatus.label}</strong>
          <p>{adminSystemStatus.description}</p>
        </div>
      </div>
      <div className="status-cell">
        <span>서버 상태</span>
        <strong>{adminSystemStatus.server}</strong>
      </div>
      <div className="status-cell">
        <span>DB 상태</span>
        <strong>{adminSystemStatus.database}</strong>
      </div>
      <div className="status-cell">
        <span>최종 업데이트</span>
        <strong>{adminSystemStatus.updatedAt}</strong>
      </div>
    </footer>
  );
}

export default AdminStatusBar;
