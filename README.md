# HACCPHOENIX Frontend

Frontend para la plataforma HACCPHOENIX (administracion residencial).

## Requisitos

- Node.js >= 18
- pnpm (o npm)

## Instalacion

```bash
pnpm install
# o
npm install
```

## Configuracion

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` para apuntar al backend:

```
VITE_API_URL=http://localhost:8080
```

## Desarrollo

```bash
pnpm dev
# o
npm run dev
```

Abre http://localhost:5173

## Build

```bash
pnpm build
# o
npm run build
```

## Estructura

```
src/
  main.tsx                  - Entry point
  styles/                   - Estilos globales, tailwind, tema
  app/
    App.tsx                 - Router principal
    api/                    - Cliente API por entidad
      client.ts             - Fetch wrapper
      auth.ts               - Login
      usuarios.ts
      propietarios.ts
      edificios.ts
      departamentos.ts
      inquilinos.ts
      tiposCargos.ts
      cargos.ts
      tiposGastos.ts
      gastos.ts
      pagos.ts
      reportes.ts
      index.ts              - Barrel
    components/
      ui/                   - Componentes shadcn/ui (48)
      figma/                - Componentes auxiliares
      RegisterModal.tsx     - Registro de usuarios
    pages/
      AuthContext.tsx       - Estado de autenticacion
      LoginPage.tsx
      AdminDashboard.tsx    - Panel admin con CRUD completo
      ResidentView.tsx      - Vista del propietario
```
