import AdminManagementPage from "./AdminManagementPage";
import { membersPageData } from "../../data/adminDummyData";

function AdminMembersPage() {
  return <AdminManagementPage data={membersPageData} tableActions={["상세", "제재", "보기"]} />;
}

export default AdminMembersPage;
