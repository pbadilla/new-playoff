# New PlayOff

Plataforma multi-tenant para gestionar extraescolares en colegios y actividades externas.

## Stack
- React 19 + Vite + TypeScript
- TanStack Query + React Router + React Hook Form + Zod
- Fastify 5 API
- MongoDB Atlas mediante el driver oficial de MongoDB
- Worker separado para jobs
- Bun workspaces + Turborepo

## Dominio

- Organizaciones y usuarios con roles.
- Colegios.
- Profesores asignables a varios colegios y grupos.
- Alumnos vinculados a un colegio.
- Actividades y grupos recurrentes.
- Sesiones con fecha concreta para asistencia, cancelaciones y actividades externas.
- Tutores, inscripciones, asistencia y auditoría preparados en la capa de datos.

Las relaciones entre profesores/colegios, profesores/grupos y alumnos/tutores se guardan en colecciones propias. Todos los documentos operativos incluyen `organizationId`; cuando se añada autenticación, el API deberá obtenerlo de la sesión y no confiar en valores enviados por el cliente.

## Desarrollo

```bash
bun install
bun run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001
- Salud: http://localhost:3001/health

Mientras no exista autenticación, el frontend usa `VITE_ORGANIZATION_ID` como organización de desarrollo. Este valor desaparecerá del cliente cuando la organización se obtenga de la sesión del usuario.

### Datos ficticios

`bun run seed` carga un conjunto idempotente de colegios, profesores, asignaciones y alumnos ficticios en `SEED_ORGANIZATION_ID`. Los correos terminan en `.invalid` y no representan personas reales. Ejecutarlo de nuevo actualiza los mismos registros sin duplicarlos.

## Endpoints iniciales

- `GET /organizations/:organizationId/schools`
- `POST /schools`
- `GET /organizations/:organizationId/teachers`
- `POST /teachers`
- `GET /organizations/:organizationId/students`
- `POST /students`
- `GET /organizations/:organizationId/activities`
- `POST /activities`
- `GET /organizations/:organizationId/activity-groups`
- `POST /activity-groups`
- `GET /organizations/:organizationId/sessions`
- `POST /sessions`
