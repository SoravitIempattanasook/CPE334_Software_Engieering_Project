import SidebarLayout from "../components/SidebarLayout";
import { Outlet } from "react-router-dom";

export default function Layout() {
  // SidebarLayout ภายในมี <Outlet/> อยู่แล้วก็ได้
  // ถ้า SidebarLayout ไม่มี <Outlet/> ให้ใส่ที่นี่แทน
  return <SidebarLayout><Outlet /></SidebarLayout>;
}
