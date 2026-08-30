import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminPortal } from "./pages/AdminPortal";
import { OneBillSimulator } from "./pages/OneBillSimulator";
import { SettlementFlow } from "./pages/SettlementFlow";
import { StudentPortal } from "./pages/StudentPortal";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<StudentPortal />} />
        <Route path="/1bill" element={<OneBillSimulator />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/settlement" element={<SettlementFlow />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
