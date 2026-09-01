import styled from "styled-components";
export const Page = styled.main`
  padding: 32px;
  min-width: 0;
  overflow: auto;
`;
export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h1 {
    margin: 0;
    font-size: 26px;
  }
  p {
    margin: 6px 0 0;
    color: #68737d;
  }
`;
export const Button = styled.button<{
  $secondary?: boolean;
  $danger?: boolean;
}>`
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 600;
  background: ${(p) => (p.$danger ? "#c93434" : p.$secondary ? "#e7ebef" : "#166b57")};
  color: ${(p) => (p.$secondary ? "#26323c" : "white")};
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
export const Card = styled.section`
  background: white;
  border: 1px solid #dfe4e8;
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 2px 8px #1d2b3610;
`;
export const Table = styled.table`
  width: 100%;
  min-width: 900px;
  th,
  td {
    text-align: left;
    padding: 13px 14px;
    border-bottom: 1px solid #e9edf0;
    white-space: nowrap;
  }
  th {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #5f6c76;
    background: #f9fafb;
  }
  tbody tr:hover {
    background: #fafcfb;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
`;
export const Message = styled.div<{ $error?: boolean }>`
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  background: ${(p) => (p.$error ? "#feecec" : "#e7f6f0")};
  color: ${(p) => (p.$error ? "#9e2525" : "#145944")};
`;
export const Center = styled.div`
  padding: 48px;
  text-align: center;
  color: #68737d;
`;
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: #14212bbb;
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 10;
`;
export const Dialog = styled.div`
  width: min(700px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: white;
  border-radius: 14px;
  padding: 26px;
  box-shadow: 0 18px 60px #0005;
  h2 {
    margin: 0 0 22px;
  }
`;
export const FormGrid = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  label {
    display: grid;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
  }
  input {
    border: 1px solid #bdc7ce;
    border-radius: 7px;
    padding: 10px;
    min-width: 0;
  }
  .full {
    grid-column: 1/-1;
  }
  .buttons {
    grid-column: 1/-1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;
  }
  .field-error {
    font-size: 12px;
    color: #b62c2c;
    font-weight: 400;
  }
`;

export const MultipleRegisterContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`