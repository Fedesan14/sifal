import { NavLink, Outlet } from "react-router-dom";
import styled from "styled-components";
const Shell = styled.div`
  display: grid;
  grid-template-columns: 230px 1fr;
  height: 100vh;
`;
const Aside = styled.aside`
  background: #152a32;
  color: white;
  padding: 28px 18px;
  overflow-y: auto;
  .brand {
    font-size: 21px;
    font-weight: 800;
    margin: 0 12px 34px;
  }
  .section {
    margin: 0 12px 10px;
    color: #92a7ae;
    font-size: 12px;
    text-transform: uppercase;
  }
  a {
    display: block;
    color: #d7e1e4;
    text-decoration: none;
    padding: 12px;
    border-radius: 8px;
    margin: 4px 0;
  }
  a.active {
    background: #1e705c;
    color: white;
    font-weight: 700;
  }
`;
export function Layout() {
  return (
    <Shell>
      <Aside>
        <div className="brand">Sifal</div>
        <div className="section">Stock</div>
        <NavLink to="/medicamentos">Medicamentos</NavLink>
        {/* <NavLink to="/biomedical-supplies">Biomédicos</NavLink> */}
        <div className="section" style={{ marginTop: 28 }}>
          Catálogos
        </div>
        <NavLink to="/grupos">Grupos</NavLink>
        <NavLink to="/drogas">Drogas</NavLink>
        <NavLink to="/marcas">Marcas</NavLink>
        <NavLink to="/dosis">Dosis</NavLink>
        <NavLink to="/presentaciones">Presentaciones</NavLink>
        <NavLink to="/ubicaciones">Ubicaciones</NavLink>
      </Aside>
      <Outlet />
    </Shell>
  );
}
