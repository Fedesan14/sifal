import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BiomedicalSuppliesPage } from "./pages/BiomedicalSuppliesPage";
import { DrogasPage } from "./pages/DrogasPage";
import { DosisPage, GruposPage, MarcasPage } from "./pages/NamedEntitiesPage";
import { PresentacionesPage } from "./pages/PresentacionesPage";
import { UbicacionesPage } from "./pages/UbicacionesPage";
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/drogas" element={<DrogasPage />} />
        <Route
          path="/biomedical-supplies"
          element={<BiomedicalSuppliesPage />}
        />
        <Route path="/grupos" element={<GruposPage />} />
        <Route path="/marcas" element={<MarcasPage />} />
        <Route path="/dosis" element={<DosisPage />} />
        <Route path="/presentaciones" element={<PresentacionesPage />} />
        <Route path="/ubicaciones" element={<UbicacionesPage />} />
        <Route path="*" element={<Navigate to="/drogas" replace />} />
      </Route>
    </Routes>
  );
}
