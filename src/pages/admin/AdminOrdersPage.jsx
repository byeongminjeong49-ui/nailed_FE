import AdminManagementPage from "./AdminManagementPage";
import { ordersPageData } from "../../data/adminDummyData";

function AdminOrdersPage() {
  return <AdminManagementPage data={ordersPageData} tableActions={["상세", "상태변경"]} />;
}

export default AdminOrdersPage;
