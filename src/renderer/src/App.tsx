import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BiomedicalSuppliesPage } from "./pages/BiomedicalSuppliesPage";
import { MedicationsPage } from "./pages/MedicationsPage";
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/medications" element={<MedicationsPage />} />
        <Route
          path="/biomedical-supplies"
          element={<BiomedicalSuppliesPage />}
        />
        <Route path="*" element={<Navigate to="/medications" replace />} />
      </Route>
    </Routes>
  );
}
