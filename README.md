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

## Arquitectura

```text
React Renderer → API tipada del Preload → IPC → Services → Repositories → Drizzle → SQLite
```

- `src/renderer`: interfaz, rutas, formularios y estados de UI.
- `src/preload`: API limitada expuesta con `contextBridge`.
- `src/main/ipc`: valida toda entrada no confiable y traduce errores.
- `src/main/services`: reglas de aplicación y casos de uso.
- `src/main/repositories`: persistencia mediante Drizzle.
- `src/main/database`: conexión, esquema y migraciones.
- `src/shared`: contratos TypeScript y validaciones Zod compartidas.

El renderer tiene `nodeIntegration: false`, `contextIsolation: true` y sandbox habilitado. No recibe acceso genérico a IPC, Node, archivos ni SQLite.

## Base de datos y migraciones

SQLite se crea en `<userData>/stock.db`, donde `<userData>` es la ruta persistente que entrega Electron para el usuario actual. Esto la mantiene fuera del paquete y conserva los datos entre cierres y actualizaciones.

Al iniciar, la aplicación lee en orden los archivos `.sql` de `src/main/database/migrations` (o `resources/migrations` en la versión empaquetada). Cada migración pendiente se ejecuta en una transacción y queda registrada en `_migrations`. Para un cambio de esquema, agregue un archivo nuevo con prefijo correlativo; no modifique una migración ya distribuida ni use `drizzle-kit push` en producción.

## Agregar otra entidad CRUD

1. Definir el tipo y el esquema Zod en `src/shared`.
2. Agregar tabla Drizzle y una migración SQL versionada.
3. Crear repository y service.
4. Registrar handlers IPC específicos que vuelvan a validar los argumentos.
5. Exponer solamente esas operaciones en preload y actualizar `DesktopApi`.
6. Crear la ruta, página y formulario en renderer.

Esta separación permite incorporar luego servicios transversales, como `ExportService`, sin acoplar SQLite ni APIs de Electron a los componentes React.
