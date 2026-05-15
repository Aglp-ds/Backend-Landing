# Manual de endpoints - Landing Leads API

Base local sugerida:

```txt
http://localhost:3001/api
```

> Nota: en `main.ts` se configuró `app.setGlobalPrefix('api')`, por eso todas las rutas inician con `/api`.

---

## 1. Health check

### GET `/api`

Sirve para validar que la API está viva.

Respuesta esperada:

```json
{
  "ok": true,
  "name": "Landing Leads API",
  "message": "API funcionando correctamente",
  "timestamp": "2026-05-15T00:00:00.000Z"
}
```

---

## 2. Leads

### POST `/api/leads`

Crea un lead desde la landing page.

Body ejemplo:

```json
{
  "firstName": "Carlos",
  "lastName": "López",
  "email": "carlos.lopez@email.com",
  "phone": "+502 5555 1111",
  "company": "Empresa Demo",
  "jobTitle": "Gerente Comercial",
  "message": "Me interesa recibir más información",
  "source": "LANDING_PAGE",
  "campaignSlug": "landing-desarrollador",
  "metadata": {
    "formVersion": "v1",
    "utm_source": "google"
  }
}
```

Campos mínimos:

```json
{
  "firstName": "Carlos",
  "email": "carlos@email.com",
  "phone": "+502 5555 1111"
}
```

Valores permitidos para `source`:

```txt
LANDING_PAGE, FACEBOOK, INSTAGRAM, GOOGLE, WHATSAPP, REFERRAL, OTHER
```

---

### GET `/api/leads`

Lista leads con filtros y paginación.

Query params disponibles:

```txt
page=1
limit=10
search=carlos
status=NEW
source=LANDING_PAGE
campaignId=uuid
assignedToId=uuid
dateFrom=2026-05-01
dateTo=2026-05-31
includeDeleted=false
```

Ejemplo:

```txt
GET /api/leads?page=1&limit=10&search=carlos&status=NEW
```

Valores permitidos para `status`:

```txt
NEW, CONTACTED, QUALIFIED, CONVERTED, REJECTED, ARCHIVED
```

---

### GET `/api/leads/:id`

Obtiene el detalle de un lead.

Ejemplo:

```txt
GET /api/leads/00000000-0000-0000-0000-000000000000
```

---

### PATCH `/api/leads/:id`

Actualiza datos de un lead.

Body ejemplo:

```json
{
  "status": "CONTACTED",
  "company": "Nueva Empresa",
  "assignedToId": "00000000-0000-0000-0000-000000000000"
}
```

---

### POST `/api/leads/:id/notes`

Agrega una nota interna al lead.

Body ejemplo:

```json
{
  "note": "Se contactó al lead y pidió información por WhatsApp.",
  "adminUserId": "00000000-0000-0000-0000-000000000000"
}
```

---

### DELETE `/api/leads/:id`

Elimina el lead de forma lógica usando `deletedAt`. No borra físicamente el registro.

---

### GET `/api/leads/stats/summary`

Devuelve resumen para dashboard.

Incluye:

```txt
total
newLeads
contacted
qualified
converted
byStatus
bySource
```

---

### GET `/api/leads/export/csv`

Exporta leads en CSV. Usa los mismos filtros del listado.

Ejemplo:

```txt
GET /api/leads/export/csv?status=NEW&source=LANDING_PAGE
```

En navegador descarga un archivo `.csv`. En Postman puedes usar `Send and Download`.

---

## 3. Campañas

### POST `/api/campaigns`

Crea una campaña.

Body ejemplo:

```json
{
  "name": "Landing Desarrollador",
  "slug": "landing-desarrollador",
  "description": "Campaña principal de captación",
  "isActive": true,
  "startsAt": "2026-05-01",
  "endsAt": "2026-05-31"
}
```

Si no envías `slug`, se genera automáticamente desde el nombre.

---

### GET `/api/campaigns`

Lista campañas.

Query params:

```txt
active=true
search=landing
```

---

### GET `/api/campaigns/:id`

Obtiene una campaña por ID.

---

### GET `/api/campaigns/slug/:slug`

Obtiene una campaña por slug.

Ejemplo:

```txt
GET /api/campaigns/slug/landing-desarrollador
```

---

### PATCH `/api/campaigns/:id`

Actualiza una campaña.

Body ejemplo:

```json
{
  "name": "Landing Desarrollador Actualizada",
  "isActive": false
}
```

---

### DELETE `/api/campaigns/:id`

Elimina una campaña. Si tiene leads relacionados, puede fallar por integridad referencial según tu schema.

---

## 4. Usuarios administradores

> Estos endpoints son básicos para la prueba técnica. Todavía no implementan JWT/login.

### POST `/api/admin-users`

Crea un administrador.

Body ejemplo:

```json
{
  "name": "Admin Demo",
  "email": "admin@demo.com",
  "passwordHash": "hash-demo-no-produccion",
  "role": "ADMIN",
  "isActive": true
}
```

Roles permitidos:

```txt
SUPER_ADMIN, ADMIN, VIEWER
```

---

### GET `/api/admin-users`

Lista administradores sin exponer `passwordHash`.

Query params:

```txt
active=true
search=admin
```

---

### GET `/api/admin-users/:id`

Obtiene un administrador por ID.

---

### PATCH `/api/admin-users/:id`

Actualiza un administrador.

Body ejemplo:

```json
{
  "role": "VIEWER",
  "isActive": true
}
```

---

### DELETE `/api/admin-users/:id`

Elimina físicamente un administrador.

---

## 5. Flujo recomendado para probar

1. Levantar backend:

```bash
npm run start:dev
```

2. Probar health:

```txt
GET http://localhost:3001/api
```

3. Crear campaña:

```txt
POST http://localhost:3001/api/campaigns
```

4. Crear lead:

```txt
POST http://localhost:3001/api/leads
```

5. Ver listado:

```txt
GET http://localhost:3001/api/leads
```

6. Ver estadísticas:

```txt
GET http://localhost:3001/api/leads/stats/summary
```

7. Exportar CSV:

```txt
GET http://localhost:3001/api/leads/export/csv
```

---

## 6. Notas importantes

- La conexión a Railway se maneja con `DATABASE_URL` en `.env`.
- Prisma 7 usa adapter PostgreSQL en `src/prisma/prisma.service.ts`.
- El endpoint de leads valida manualmente nombre, correo y teléfono.
- No se agregaron dependencias extra como `class-validator` para mantener el proyecto simple.
- El panel admin puede consumir directamente `/api/leads`, `/api/leads/stats/summary` y `/api/leads/export/csv`.
