import AdminManagementPage from "./AdminManagementPage";
import { productsPageData } from "../../data/adminDummyData";

function AdminProductsPage() {
  return <AdminManagementPage data={productsPageData} tableActions={["상세", "숨김"]} />;
}

export default AdminProductsPage;
