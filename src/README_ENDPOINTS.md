# Manual de endpoints - Landing Leads API

Base local sugerida:

```txt
http://localhost:3001/api
```

> Nota: en `main.ts` se configuró `app.setGlobalPrefix('api')`, por eso todas las rutas inician con `/api`.

---

## Tecnologías
- Next.js
- React
- TypeScript
- Tailwind CSS
- NestJS
- Prisma ORM
- Railway PostgreSQL

## Funcionalidades
- Landing page responsive
- Captura de leads
- Panel administrativo
- Exportación CSV/Excel
- API REST
- Base de datos en Railway

## Frontend

cd frontendlanding
npm install
npm run dev

http://localhost:3000

## Backend

cd backendlanding
npm install
npm run start:dev

http://localhost:3001/api

## Variables de entorno

DATABASE_URL=
PORT=3001

## Endpoints principales

POST /api/leads

GET /api/leads

GET /api/leads/export/csv

## Panel Administrativo

http://localhost:3000/admin