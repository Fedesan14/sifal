# Sifal Stock

Aplicación desktop completamente offline para administrar medicamentos e insumos biomédicos. No usa servidor HTTP, servicios cloud ni recursos externos en tiempo de ejecución.

## Stack y requisitos

Electron, React, TypeScript, Vite, SQLite, Drizzle ORM, React Router, styled-components y Zod. Para desarrollar se requiere Node.js LTS y npm. Para compilar el instalador de Windows se necesita ejecutar el proceso en Windows.

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Verificaciones y build:

```bash
npm run typecheck
npm run lint
npm run build
npm run dist:win
```

`build` genera los bundles en `out/`. `dist:win` prepara el instalador NSIS en `release/`.
