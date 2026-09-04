import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import type { BiomedicalSupply, Dosis, Droga, Medicamento, Ubicacion } from "../../../shared/types/entities";
import { Card, Center, Header, Message, Page, Table } from "../components/ui";
import { useReferenceList } from "../hooks/useReferenceList";

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 22px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
`;
const SummaryCard = styled(Card)`
  padding: 18px;
  overflow: hidden;
  span { display: block; color: #68737d; font-size: 13px; margin-bottom: 7px; }
  strong { font-size: 28px; color: #18323b; }
`;
const Toolbar = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  input { flex: 1; max-width: 480px; border: 1px solid #bdc7ce; border-radius: 8px; padding: 11px 13px; }
`;
const QuickLink = styled(Link)`
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 600;
  background: #166b57;
  color: white;
  text-decoration: none;
  white-space: nowrap;
`;
const Section = styled.section`
  margin-top: 24px;
  h2 { margin: 0 0 12px; font-size: 19px; }
`;
const AlertGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  @media (max-width: 1000px) { grid-template-columns: 1fr; }
`;
const AlertCard = styled(Card)`
  padding: 18px;
  h2 { margin: 0 0 12px; font-size: 17px; }
  ul { margin: 0; padding-left: 20px; }
  li + li { margin-top: 7px; }
  .danger { color: #a72525; font-weight: 700; }
  .muted { color: #68737d; }
`;
const LocationCard = styled(Card)`
  margin-bottom: 12px;
  h3 { margin: 0; padding: 16px 18px; border-bottom: 1px solid #e9edf0; }
`;

type Expiration = { key: string; label: string; expiration: string; months: number };

function monthsUntil(value: string): number | undefined {
  const match = /^(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return undefined;
  const now = new Date();
  return Number(match[2]) * 12 + Number(match[1]) - (now.getFullYear() * 12 + now.getMonth() + 1);
}

export function HomePage() {
  const medicamentos = useReferenceList<Medicamento, never>(window.api.medicamentos);
  const biomedicos = useReferenceList<BiomedicalSupply, never>(window.api.biomedicalSupplies);
  const drogas = useReferenceList<Droga, never>(window.api.drogas);
  const dosis = useReferenceList<Dosis, never>(window.api.dosis);
  const ubicaciones = useReferenceList<Ubicacion, never>(window.api.ubicaciones);
  const [search, setSearch] = useState("");

  const data = useMemo(() => {
    const drugNames = new Map(drogas.items.map((item) => [item.id, item.name]));
    const doseNames = new Map(dosis.items.map((item) => [item.id, item.name]));
    const medicationGroups = new Map<string, { drug: string; dose: string; quantity: number }>();
    for (const item of medicamentos.items) {
      const drug = drugNames.get(item.drogaId) ?? `Droga #${item.drogaId}`;
      const dose = doseNames.get(item.dosisId) ?? `Dosis #${item.dosisId}`;
      const key = `${item.drogaId}:${item.dosisId}`;
      const current = medicationGroups.get(key) ?? { drug, dose, quantity: 0 };
      current.quantity += item.cantidad;
      medicationGroups.set(key, current);
    }

    const expirations: Expiration[] = [];
    for (const item of medicamentos.items) {
      const months = monthsUntil(item.fechaVencimiento);
      if (months !== undefined && months <= 3) expirations.push({ key: `m-${item.id}`, label: `${drugNames.get(item.drogaId) ?? `Droga #${item.drogaId}`} ${doseNames.get(item.dosisId) ?? ""}`, expiration: item.fechaVencimiento, months });
    }
    for (const item of biomedicos.items) {
      const months = monthsUntil(item.expirationDate);
      if (months !== undefined && months <= 3) expirations.push({ key: `b-${item.id}`, label: item.name, expiration: item.expirationDate, months });
    }
    expirations.sort((a, b) => a.months - b.months);

    const locationRows = ubicaciones.items.map((location) => {
      const meds = new Map<string, { name: string; quantity: number }>();
      for (const item of medicamentos.items) {
        const quantity = item.stocks.find((stock) => stock.ubicacionId === location.id)?.cantidad ?? 0;
        if (!quantity) continue;
        const key = `${item.drogaId}:${item.dosisId}`;
        const name = `${drugNames.get(item.drogaId) ?? `Droga #${item.drogaId}`} ${doseNames.get(item.dosisId) ?? `Dosis #${item.dosisId}`}`;
        const current = meds.get(key) ?? { name, quantity: 0 };
        current.quantity += quantity;
        meds.set(key, current);
      }
      const supplies = new Map<string, number>();
      for (const item of biomedicos.items) {
        const quantity = item.stocks.find((stock) => stock.ubicacionId === location.id)?.cantidad ?? 0;
        if (quantity) supplies.set(item.name, (supplies.get(item.name) ?? 0) + quantity);
      }
      return { location, meds: [...meds.values()], supplies: [...supplies].map(([name, quantity]) => ({ name, quantity })) };
    });

    return {
      medicationGroups: [...medicationGroups.values()], expirations, locationRows,
      medicationUnits: medicamentos.items.reduce((sum, item) => sum + item.cantidad, 0),
      biomedicalUnits: biomedicos.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [medicamentos.items, biomedicos.items, drogas.items, dosis.items, ubicaciones.items]);

  const query = search.trim().toLocaleLowerCase();
  const filteredGroups = data.medicationGroups.filter((item) => `${item.drug} ${item.dose}`.toLocaleLowerCase().includes(query));
  const filteredLocations = data.locationRows.map((row) => ({
    ...row,
    meds: row.meds.filter((item) => item.name.toLocaleLowerCase().includes(query)),
    supplies: row.supplies.filter((item) => item.name.toLocaleLowerCase().includes(query)),
  })).filter((row) => !query || row.location.nombre.toLocaleLowerCase().includes(query) || row.meds.length > 0 || row.supplies.length > 0);
  const zeroStock = [
    ...data.medicationGroups.filter((item) => item.quantity === 0).map((item) => `${item.drug} ${item.dose}`),
    ...biomedicos.items.filter((item) => item.quantity === 0).map((item) => item.name),
  ];
  const loading = [medicamentos, biomedicos, drogas, dosis, ubicaciones].some((state) => state.loading);
  const error = [medicamentos, biomedicos, drogas, dosis, ubicaciones].map((state) => state.error).find(Boolean);

  return (
    <Page>
      <Header>
        <div><h1>Inicio</h1><p>Resumen general del stock y su distribución.</p></div>
        <Toolbar>
          <input aria-label="Buscar en el inventario" placeholder="Buscar droga, dosis, biomédico o ubicación…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <QuickLink to="/medicamentos">+ Medicamento</QuickLink>
          <QuickLink to="/biomedical-supplies">+ Biomédico</QuickLink>
        </Toolbar>
      </Header>
      {error && <Message $error>{error}</Message>}
      {loading ? <Card><Center>Cargando resumen…</Center></Card> : <>
        <SummaryGrid>
          <SummaryCard><span>Unidades de medicamentos</span><strong>{data.medicationUnits}</strong></SummaryCard>
          <SummaryCard><span>Unidades de biomédicos</span><strong>{data.biomedicalUnits}</strong></SummaryCard>
          <SummaryCard><span>Drogas y dosis</span><strong>{data.medicationGroups.length}</strong></SummaryCard>
          <SummaryCard><span>Ubicaciones</span><strong>{ubicaciones.items.length}</strong></SummaryCard>
        </SummaryGrid>

        <AlertGrid>
          <AlertCard><h2>Vencidos y próximos a vencer</h2>{data.expirations.length ? <ul>{data.expirations.map((item) => <li key={item.key}><span className={item.months < 0 ? "danger" : ""}>{item.label}</span> — {item.expiration} ({item.months < 0 ? "vencido" : item.months === 0 ? "vence este mes" : `vence en ${item.months} ${item.months === 1 ? "mes" : "meses"}`})</li>)}</ul> : <span className="muted">No hay vencimientos dentro de los próximos 3 meses.</span>}</AlertCard>
          <AlertCard><h2>Productos sin stock</h2>{zeroStock.length ? <ul>{zeroStock.map((name) => <li key={name}>{name}</li>)}</ul> : <span className="muted">No hay productos sin stock.</span>}</AlertCard>
        </AlertGrid>

        <Section><h2>Medicamentos por droga y dosis</h2><Card>{filteredGroups.length ? <Table><thead><tr><th>Droga</th><th>Dosis</th><th>Cantidad total</th></tr></thead><tbody>{filteredGroups.map((item) => <tr key={`${item.drug}-${item.dose}`}><td>{item.drug}</td><td>{item.dose}</td><td>{item.quantity}</td></tr>)}</tbody></Table> : <Center>No hay medicamentos que coincidan.</Center>}</Card></Section>

        <Section><h2>Inventario por ubicación</h2>{filteredLocations.length ? filteredLocations.map((row) => <LocationCard key={row.location.id}><h3>{row.location.nombre}</h3>{row.meds.length || row.supplies.length ? <Table><thead><tr><th>Tipo</th><th>Producto</th><th>Cantidad</th></tr></thead><tbody>{row.meds.map((item) => <tr key={`m-${item.name}`}><td>Medicamento</td><td>{item.name}</td><td>{item.quantity}</td></tr>)}{row.supplies.map((item) => <tr key={`b-${item.name}`}><td>Biomédico</td><td>{item.name}</td><td>{item.quantity}</td></tr>)}</tbody></Table> : <Center>Ubicación sin stock asignado.</Center>}</LocationCard>) : <Card><Center>No hay ubicaciones que coincidan.</Center></Card>}</Section>
      </>}
    </Page>
  );
}
