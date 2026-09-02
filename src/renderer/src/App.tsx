import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BiomedicalSuppliesPage } from "./pages/BiomedicalSuppliesPage";
import { MedicamentosPage } from "./pages/DrogasPage";
import { DrogasCatalogPage } from "./pages/DrogasCatalogPage";
import { DosisPage, GruposPage, MarcasPage } from "./pages/NamedEntitiesPage";
import { PresentacionesPage } from "./pages/PresentacionesPage";
import { UbicacionesPage } from "./pages/UbicacionesPage";
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/medicamentos" element={<MedicamentosPage />} />
        <Route
          path="/biomedical-supplies"
          element={<BiomedicalSuppliesPage />}
        />
        <Route path="/grupos" element={<GruposPage />} />
        <Route path="/drogas" element={<DrogasCatalogPage />} />
        <Route path="/marcas" element={<MarcasPage />} />
        <Route path="/dosis" element={<DosisPage />} />
        <Route path="/presentaciones" element={<PresentacionesPage />} />
        <Route path="/ubicaciones" element={<UbicacionesPage />} />
        <Route path="*" element={<Navigate to="/medicamentos" replace />} />
      </Route>
    </Routes>
  );
}
