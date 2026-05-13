import AdminManagementPage from "./AdminManagementPage";
import { reportsPageData } from "../../data/adminDummyData";

function AdminReportsPage() {
  return <AdminManagementPage data={reportsPageData} tableActions={["상세", "처리"]} />;
}

export default AdminReportsPage;
