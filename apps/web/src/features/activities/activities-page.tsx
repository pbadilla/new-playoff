import { type FormEvent, useDeferredValue, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  Pencil,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { Card } from "../../components/ui/card";
import {
  type Activity,
  type ActivityGroup,
  backofficeApi,
} from "../../lib/api";
import {
  EmptyState,
  FormPanel,
  inputClass,
  labelClass,
  ListToolbar,
  LoadingState,
  PageHeader,
  Pagination,
  SubmitButton,
} from "../shared/backoffice-ui";
import { ActivityEditDialog } from "./activity-edit-dialog";
import { ActivityGroupEditDialog } from "./activity-group-edit-dialog";
import { activityTypes } from "./activity-options";

const weekDays = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
];

const schoolCardColors = [
  "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30",
  "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
  "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30",
  "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30",
  "border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30",
];

export function ActivitiesPage({
  onNavigate,
}: {
  onNavigate?: (section: "Alumnos") => void;
}) {
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [editingGroup, setEditingGroup] = useState<ActivityGroup | null>(null);
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["activities", deferredSearch, active, page, pageSize],
    queryFn: () =>
      backofficeApi.activities.list({
        search: deferredSearch,
        active: active || undefined,
        page,
        pageSize,
      }),
  });
  const activityOptions = useQuery({
    queryKey: ["activities", "group-options"],
    queryFn: () =>
      backofficeApi.activities.list({ active: "true", pageSize: 100 }),
  });
  const groups = useQuery({
    queryKey: ["activity-groups"],
    queryFn: backofficeApi.activityGroups.list,
  });
  const teachers = useQuery({
    queryKey: ["teachers", "activity-options"],
    queryFn: () =>
      backofficeApi.teachers.list({ active: "true", pageSize: 100 }),
  });
  const students = useQuery({
    queryKey: ["students", "activity-options"],
    queryFn: () =>
      backofficeApi.students.list({ active: "true", pageSize: 100 }),
  });
  const schools = useQuery({
    queryKey: ["schools", "activity-options"],
    queryFn: () =>
      backofficeApi.schools.list({ active: "true", pageSize: 100 }),
  });
  const mutation = useMutation({
    mutationFn: backofficeApi.activities.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      setCreating(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof backofficeApi.activities.update>[1];
    }) => backofficeApi.activities.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      setEditing(null);
    },
  });
  const removeMutation = useMutation({
    mutationFn: backofficeApi.activities.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      setEditing(null);
    },
  });
  const updateGroupMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof backofficeApi.activityGroups.update>[1];
    }) => backofficeApi.activityGroups.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activity-groups"] });
      setEditingGroup(null);
    },
  });
  const removeGroupMutation = useMutation({
    mutationFn: backofficeApi.activityGroups.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activity-groups"] });
      setEditingGroup(null);
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const minimumAge = String(data.get("minimumAge") || "");
    const maximumAge = String(data.get("maximumAge") || "");

    mutation.mutate({
      name: String(data.get("name")),
      category: String(data.get("category")),
      description: String(data.get("description") || "") || undefined,
      minimumAge: minimumAge ? Number(minimumAge) : undefined,
      maximumAge: maximumAge ? Number(maximumAge) : undefined,
    });
  };

  return (
    <>
      <PageHeader
        title="Actividades"
        createLabel="Nueva actividad"
        onCreate={() => setCreating((value) => !value)}
      />
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        pageSize={pageSize}
        onPageSize={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      >
        <select
          className={`${inputClass} sm:w-44`}
          value={active}
          onChange={(event) => {
            setActive(event.target.value as "" | "true" | "false");
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </ListToolbar>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-4">
          <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
            {query.isLoading ? (
              <LoadingState />
            ) : query.data?.items.length ? (
              <>
                <div className="divide-y divide-border">
                  {query.data.items.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex cursor-pointer items-center gap-4 p-4 hover:bg-muted/40"
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditing(activity)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setEditing(activity);
                        }
                      }}
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary">
                        <CalendarDays size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{activity.name}</p>
                          {activity.category && (
                            <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-700">
                              {activity.category}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {activity.description && (
                            <span>{activity.description}</span>
                          )}
                          {(activity.minimumAge !== null ||
                            activity.maximumAge !== null) && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {activity.minimumAge ?? 0}–
                              {activity.maximumAge ?? 21} años
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${activity.active ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"}`}
                      >
                        {activity.active ? "Activa" : "Inactiva"}
                      </span>
                      <div
                        className="flex shrink-0 items-center gap-1"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="rounded-[4px] p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          aria-label={`Editar ${activity.name}`}
                          title="Editar"
                          onClick={() => setEditing(activity)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="rounded-[4px] p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                          aria-label={`Eliminar ${activity.name}`}
                          title="Eliminar"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar la actividad “${activity.name}”?`,
                              )
                            )
                              removeMutation.mutate(activity.id);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={query.data.page}
                  totalPages={query.data.totalPages}
                  total={query.data.total}
                  onPage={setPage}
                />
              </>
            ) : (
              <EmptyState
                title="No hay actividades"
                description={
                  search
                    ? "Prueba con otros términos o elimina los filtros."
                    : "Añade la primera actividad para comenzar a organizar grupos y sesiones."
                }
              />
            )}
          </Card>
          {creating && (
            <FormPanel
              title="Nueva actividad"
              description="Después podrás crear grupos, fechas y asignar profesores."
              error={mutation.error?.message}
            >
              <form className="grid gap-4" onSubmit={submit}>
                <label className={labelClass}>
                  Nombre
                  <input
                    className={inputClass}
                    name="name"
                    list="activity-name-options"
                    required
                    autoFocus
                  />
                  <datalist id="activity-name-options">
                    {activityTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </label>
                <label className={labelClass}>
                  Tipo
                  <select
                    className={inputClass}
                    name="category"
                    defaultValue="Otros"
                  >
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Descripción
                  <textarea
                    className={`${inputClass} min-h-20 py-2`}
                    name="description"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>
                    Edad mínima
                    <input
                      className={inputClass}
                      name="minimumAge"
                      type="number"
                      min="0"
                      max="21"
                    />
                  </label>
                  <label className={labelClass}>
                    Edad máxima
                    <input
                      className={inputClass}
                      name="maximumAge"
                      type="number"
                      min="0"
                      max="21"
                    />
                  </label>
                </div>
                <SubmitButton pending={mutation.isPending}>
                  Guardar actividad
                </SubmitButton>
              </form>
            </FormPanel>
          )}
        </div>
        <Card className="min-w-0 overflow-hidden border-0 shadow-sm ring-1 ring-border/70 lg:sticky lg:top-20">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarDays size={17} className="text-primary" />
              Agenda semanal
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Grupos, profesores y participantes de lunes a viernes.
            </p>
          </div>
          {groups.isLoading || teachers.isLoading ? (
            <LoadingState />
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[760px] grid-cols-5 divide-x divide-border">
                {weekDays.map((day) => {
                  const entries = (groups.data ?? [])
                    .flatMap((group) =>
                      group.schedule
                        .filter((slot) => slot.dayOfWeek === day.value)
                        .map((slot) => ({ group, slot })),
                    )
                    .sort((left, right) =>
                      left.slot.startsAt.localeCompare(right.slot.startsAt),
                    );

                  return (
                    <section
                      key={day.value}
                      className="min-h-[360px] bg-muted/15"
                    >
                      <h3 className="border-b border-border bg-background px-3 py-2 text-xs font-bold text-primary">
                        {day.label}
                      </h3>
                      <div className="grid gap-2 p-2">
                        {entries.length ? (
                          entries.map(({ group, slot }) => {
                            const schoolIndex =
                              schools.data?.items.findIndex(
                                (school) => school.id === group.schoolId,
                              ) ?? -1;
                            const school =
                              schoolIndex >= 0
                                ? schools.data?.items[schoolIndex]
                                : undefined;
                            const schoolColor =
                              schoolCardColors[
                                (schoolIndex >= 0 ? schoolIndex : 0) %
                                  schoolCardColors.length
                              ];
                            return (
                              <article
                                key={`${group.id}-${slot.startsAt}`}
                                className={`group relative cursor-pointer rounded-[4px] border p-3 shadow-sm ${schoolColor}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setEditingGroup(group)}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    setEditingGroup(group);
                                  }
                                }}
                              >
                                <div
                                  className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="rounded-[4px] p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                    aria-label={`Editar ${group.name}`}
                                    title="Editar"
                                    onClick={() => setEditingGroup(group)}
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-[4px] p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                                    aria-label={`Eliminar ${group.name}`}
                                    title="Eliminar"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `¿Eliminar el grupo “${group.name}”?`,
                                        )
                                      )
                                        removeGroupMutation.mutate(group.id);
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                                <p className="text-xs font-semibold leading-tight">
                                  {group.name}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold text-primary">
                                  {group.activityName ?? "Actividad"}
                                </p>
                                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                  {school?.name ??
                                    (group.scope === "school"
                                      ? "Centro sin asignar"
                                      : "Grupo externo")}
                                </p>
                                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Clock size={11} /> {slot.startsAt}–
                                  {slot.endsAt}
                                </p>
                                <p className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                                  <UserRound
                                    size={11}
                                    className="mt-0.5 shrink-0"
                                  />
                                  {group.teacherIds
                                    .map((id) => {
                                      const teacher = teachers.data?.items.find(
                                        (item) => item.id === id,
                                      );
                                      return teacher
                                        ? `${teacher.firstName} ${teacher.lastName}`
                                        : "Sin asignar";
                                    })
                                    .join(", ") || "Sin asignar"}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                                  <Users size={11} /> {group.participantCount}{" "}
                                  participantes
                                </p>
                              </article>
                            );
                          })
                        ) : (
                          <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
                            Sin actividades
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
      <ActivityEditDialog
        activity={editing}
        open={Boolean(editing)}
        pending={updateMutation.isPending}
        error={updateMutation.error?.message}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            updateMutation.reset();
          }
        }}
        onSubmit={(payload) => {
          if (editing) updateMutation.mutate({ id: editing.id, payload });
        }}
      />
      <ActivityGroupEditDialog
        group={editingGroup}
        open={Boolean(editingGroup)}
        pending={updateGroupMutation.isPending}
        error={updateGroupMutation.error?.message}
        activities={activityOptions.data?.items ?? []}
        teachers={teachers.data?.items ?? []}
        students={students.data?.items ?? []}
        schools={schools.data?.items ?? []}
        onManageStudents={() => {
          setEditingGroup(null);
          onNavigate?.("Alumnos");
        }}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGroup(null);
            updateGroupMutation.reset();
          }
        }}
        onSubmit={(payload) => {
          if (editingGroup)
            updateGroupMutation.mutate({ id: editingGroup.id, payload });
        }}
      />
    </>
  );
}
