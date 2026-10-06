import { type FormEvent, useDeferredValue, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Pencil, Trash2, Users } from "lucide-react";

import { Card } from "../../components/ui/card";
import { type Activity, backofficeApi } from "../../lib/api";
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
import { activityTypes } from "./activity-options";

export function ActivitiesPage() {
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [categoryGroup, setCategoryGroup] = useState<
    "" | "casals" | "extraescolares" | "otros"
  >("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Activity | null>(null);
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [
      "activities",
      deferredSearch,
      active,
      categoryGroup,
      page,
      pageSize,
    ],
    queryFn: () =>
      backofficeApi.activities.list({
        search: deferredSearch,
        active: active || undefined,
        categoryGroup: categoryGroup || undefined,
        page,
        pageSize,
      }),
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
      <div className="grid items-start gap-4">
        <div className="grid min-w-0 gap-4">
          <div className="grid gap-4">
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
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filtrar actividades por tipo"
            >
              {(
                [
                  ["", "Todas"],
                  ["casals", "Casals"],
                  ["extraescolares", "Extraescolares"],
                  ["otros", "Otros"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value || "todas"}
                  type="button"
                  role="tab"
                  aria-selected={categoryGroup === value}
                  onClick={() => {
                    setCategoryGroup(value);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${categoryGroup === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
    </>
  );
}
