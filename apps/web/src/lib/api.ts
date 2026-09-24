const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const ORGANIZATION_ID =
  import.meta.env.VITE_ORGANIZATION_ID ??
  "20000000-0000-4000-8000-000000000001";

export interface School {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  contactEmail: string | null;
  active: boolean;
}

export interface Teacher {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  schoolIds: string[];
  active: boolean;
}

export interface Student {
  id: string;
  organizationId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  notes: string | null;
  foodIntolerances: string[];
  scholarships: Scholarship[];
  status: StudentStatus;
  active: boolean;
}

export type StudentStatus = "active" | "inactive" | "paused";

export interface Scholarship {
  academicYear: string;
  activityType: string;
  percentage: number;
  approved: boolean;
}

export interface Activity {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: string | null;
  minimumAge: number | null;
  maximumAge: number | null;
  active: boolean;
  groupCount?: number;
  teacherCount?: number;
  participantCount?: number;
  schoolCount?: number;
}

export type PaymentMethod =
  "card" | "direct-debit" | "cash" | "bizum" | "transfer";

export interface PaymentSettings {
  id?: string;
  method: PaymentMethod;
  accountHolder?: string | null;
  last4?: string | null;
  cardBrand?: string | null;
  phone?: string | null;
  reference?: string | null;
}

export interface Guardian {
  id?: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string | null;
  isPrimary: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListParams {
  search?: string;
  initial?: string;
  page?: number;
  pageSize?: number;
  schoolId?: string;
  active?: "true" | "false";
  status?: StudentStatus;
}

export interface ActivityGroup {
  id: string;
  activityId: string;
  activityName?: string;
  name: string;
  capacity: number;
  schedule: { dayOfWeek: number; startsAt: string; endsAt: string }[];
  teacherIds: string[];
  studentIds: string[];
  scope: "school" | "external";
  schoolId: string | null;
  venueId: string | null;
  participantCount: number;
  active: boolean;
}

export type ImportEntity = "schools" | "teachers" | "students";
export type ExportFormat = "csv" | "xlsx";

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  rejected: number;
  errors: { row: number; message: string }[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: unknown;
    } | null;
    const detail =
      typeof payload?.error === "string"
        ? payload.error
        : "No se pudo completar la operación";
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

function post<T>(path: string, payload: Record<string, unknown>) {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify({ organizationId: ORGANIZATION_ID, ...payload }),
  });
}

function put<T>(path: string, payload: Record<string, unknown>) {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify({ organizationId: ORGANIZATION_ID, ...payload }),
  });
}

function list<T>(resource: string, params: ListParams = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });

  return request<Paginated<T>>(
    `/organizations/${ORGANIZATION_ID}/${resource}?${search}`,
  );
}

export const backofficeApi = {
  schools: {
    list: (params?: ListParams) => list<School>("schools", params),
    create: (payload: {
      name: string;
      address?: string;
      contactEmail?: string;
    }) => post<School>("/schools", payload),
    update: (
      id: string,
      payload: { name: string; address?: string; contactEmail?: string },
    ) => put<School>(`/schools/${id}`, payload),
  },
  teachers: {
    list: (params?: ListParams) => list<Teacher>("teachers", params),
    create: (payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      schoolIds: string[];
    }) => post<Teacher>("/teachers", payload),
    update: (
      id: string,
      payload: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        schoolIds: string[];
      },
    ) => put<Teacher>(`/teachers/${id}`, payload),
  },
  students: {
    list: (params?: ListParams) => list<Student>("students", params),
    create: (payload: {
      schoolId: string;
      firstName: string;
      lastName: string;
      birthDate?: string;
      notes?: string;
      foodIntolerances: string[];
      scholarships: Scholarship[];
      status: StudentStatus;
    }) => post<Student>("/students", payload),
    update: (
      id: string,
      payload: {
        schoolId: string;
        firstName: string;
        lastName: string;
        birthDate?: string;
        notes?: string;
        foodIntolerances: string[];
        scholarships: Scholarship[];
        status: StudentStatus;
      },
    ) => put<Student>(`/students/${id}`, payload),
    getPaymentSettings: (id: string) =>
      request<PaymentSettings | null>(
        `/students/${id}/payment-settings?organizationId=${ORGANIZATION_ID}`,
      ),
    updatePaymentSettings: (id: string, payload: Omit<PaymentSettings, "id">) =>
      put<PaymentSettings>(`/students/${id}/payment-settings`, payload),
    getGuardians: (id: string) =>
      request<Guardian[]>(
        `/students/${id}/guardians?organizationId=${ORGANIZATION_ID}`,
      ),
    updateGuardians: (id: string, guardians: Guardian[]) =>
      put<Guardian[]>(`/students/${id}/guardians`, { guardians }),
  },
  activities: {
    list: (params?: ListParams) => list<Activity>("activities", params),
    create: (payload: {
      name: string;
      description?: string;
      category?: string;
      minimumAge?: number;
      maximumAge?: number;
    }) => post<Activity>("/activities", payload),
    update: (
      id: string,
      payload: {
        name: string;
        description?: string;
        category?: string;
        minimumAge?: number;
        maximumAge?: number;
      },
    ) => put<Activity>(`/activities/${id}`, payload),
    remove: (id: string) =>
      request<Activity>(`/activities/${id}?organizationId=${ORGANIZATION_ID}`, {
        method: "DELETE",
        body: JSON.stringify({ organizationId: ORGANIZATION_ID }),
      }),
  },
  activityGroups: {
    list: () =>
      request<ActivityGroup[]>(
        `/organizations/${ORGANIZATION_ID}/activity-groups`,
      ),
    update: (
      id: string,
      payload: {
        activityId: string;
        name: string;
        scope: "school" | "external";
        schoolId?: string;
        venueId?: string;
        teacherIds: string[];
        studentIds: string[];
        capacity: number;
        schedule: { dayOfWeek: number; startsAt: string; endsAt: string }[];
      },
    ) => put<ActivityGroup>(`/activity-groups/${id}`, payload),
    remove: (id: string) =>
      request<ActivityGroup>(`/activity-groups/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ organizationId: ORGANIZATION_ID }),
      }),
  },
  communication: {
    import: (entity: ImportEntity, rows: Record<string, unknown>[]) =>
      request<ImportResult>(`/organizations/${ORGANIZATION_ID}/import`, {
        method: "POST",
        body: JSON.stringify({ entity, rows }),
      }),
    export: async (entity: ImportEntity, format: ExportFormat) => {
      const response = await fetch(
        `${API_URL}/organizations/${ORGANIZATION_ID}/export/${entity}?format=${format}`,
      );
      if (!response.ok) throw new Error("No se pudo exportar el archivo");
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="([^"]+)"/)?.[1] ?? `${entity}.${format}`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    },
  },
};
