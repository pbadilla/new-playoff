import type { FastifyReply } from 'fastify'
import type { ZodType } from 'zod'

export function parseBody<T>(schema: ZodType<T>, body: unknown, reply: FastifyReply) {
  const result = schema.safeParse(body)

  if (!result.success) {
    reply.code(400).send({ error: result.error.flatten() })
    return null
  }

  return result.data
}

export function getOrganizationParams(params: unknown) {
  return params as { organizationId: string }
}

export function getListQuery(query: unknown) {
  const value = query as {
    search?: string
    page?: string
    pageSize?: string
    schoolId?: string
    active?: string
    status?: string
    initial?: string
  }
  const page = Math.max(1, Number.parseInt(value.page ?? '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(value.pageSize ?? '10', 10) || 10))

  return {
    search: value.search?.trim() ?? '',
    schoolId: value.schoolId?.trim() || undefined,
    active: value.active === 'true' ? true : value.active === 'false' ? false : undefined,
    status: ['active', 'inactive', 'paused'].includes(value.status ?? '') ? value.status as 'active' | 'inactive' | 'paused' : undefined,
    initial: /^[A-ZÑ]$/i.test(value.initial?.trim() ?? '') ? value.initial!.trim().toUpperCase() : undefined,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  }
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
