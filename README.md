# Club Platform Boilerplate

Base para un SaaS multi-tenant de asociaciones, clubes deportivos y academias.

## Stack
- React 19 + Vite + TypeScript
- TanStack Query + React Router + React Hook Form + Zod
- Fastify 5 API
- Supabase: PostgreSQL, Auth, Storage, RLS
- Drizzle ORM
- Worker separado para jobs
- Bun workspaces + Turborepo

## Inicio rápido
1. Copia `.env.example` a `.env` y configura Supabase/Postgres.
2. `bun install`
3. `bun run dev`

API: http://localhost:3001/health
Web: http://localhost:5173

## Arquitectura
El frontend nunca usa una service-role key. La lógica de negocio vive en Fastify. RLS aporta defensa adicional por tenant. El esquema inicial incluye organizations, organization_users, seasons, members, families, teams y enrollments.

## Siguiente iteración recomendada
Añadir módulos de actividades/asistencia, billing/SEPA, reservas, documentos, auditoría, RBAC granular y jobs persistentes (pg-boss/BullMQ).
