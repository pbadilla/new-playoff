import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  type Activity,
  type ActivityGroup,
  backofficeApi,
} from "../../lib/api";
import { ActivityGroupEditDialog } from "../activities/activity-group-edit-dialog";
import { LoadingState } from "../shared/backoffice-ui";

const weekDays = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
];

const schoolCardAccents = [
  "#e11d48",
  "#ea580c",
  "#f59e0b",
  "#a16207",
  "#65a30d",
  "#16a34a",
  "#0f766e",
  "#06b6d4",
  "#0284c7",
  "#2563eb",
  "#4338ca",
  "#7c3aed",
  "#c026d3",
  "#e879f9",
  "#db2777",
  "#9f1239",
  "#92400e",
  "#475569",
];

const getAgendaCategory = (
  group: ActivityGroup,
  activities: Activity[],
): "extraescolares" | "casals" | "particulares" => {
  const activity = activities.find((item) => item.id === group.activityId);
  const categoryText = `${activity?.category ?? ""} ${activity?.name ?? ""} ${group.activityName ?? ""}`;
  if (/casal/i.test(categoryText)) return "casals";
  if (/particular/i.test(categoryText) || group.scope === "external")
    return "particulares";
  if (/extraescolar/i.test(categoryText)) return "extraescolares";
  return "particulares";
};

// Weekly agenda of activity groups (moved out of the Activities page into its own section).
export function CalendarPage({
  onNavigate,
}: {
  onNavigate?: (section: "Alumnos") => void;
}) {
  const [editingGroup, setEditingGroup] = useState<ActivityGroup | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [agendaCategory, setAgendaCategory] = useState<
    "all" | "extraescolares" | "casals" | "particulares"
  >("all");
  const agendaGridRef = useRef<HTMLDivElement>(null);
  const agendaCardsRef = useRef(new Map<string, HTMLElement>());
  const queryClient = useQueryClient();
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
  const scheduledSchoolIds = new Set(
    (groups.data ?? []).flatMap((group) =>
      group.schoolId ? [group.schoolId] : [],
    ),
  );
  const scheduledSchools = [...(schools.data?.items ?? [])]
    .filter((school) => scheduledSchoolIds.has(school.id))
    .sort((left, right) => left.name.localeCompare(right.name));
  const schoolColors = new Map(
    scheduledSchools.map((school, index) => [
      school.id,
      schoolCardAccents[index] ?? `hsl(${(index * 137.5) % 360} 75% 48%)`,
    ]),
  );
  useLayoutEffect(() => {
    const grid = agendaGridRef.current;
    if (!grid) return;

    const equalizeCardHeights = () => {
      const cards = [...agendaCardsRef.current.values()];
      cards.forEach((card) => (card.style.height = "auto"));
      const tallest = Math.max(
        0,
        ...cards.map((card) => card.getBoundingClientRect().height),
      );
      if (tallest > 0)
        cards.forEach((card) => (card.style.height = `${tallest}px`));
    };

    equalizeCardHeights();
    const observer = new ResizeObserver(equalizeCardHeights);
    observer.observe(grid);
    window.addEventListener("resize", equalizeCardHeights);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", equalizeCardHeights);
    };
  }, [agendaCategory, groups.data, schools.data, teachers.data]);
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
  const createGroupMutation = useMutation({
    mutationFn: backofficeApi.activityGroups.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activity-groups"] });
      setCreatingGroup(false);
    },
  });
  const removeGroupMutation = useMutation({
    mutationFn: backofficeApi.activityGroups.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activity-groups"] });
      setEditingGroup(null);
    },
  });

  return (
    <>
      <Card className="min-w-0 overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarDays size={17} className="text-primary" />
              Agenda semanal
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Grupos, profesores y participantes de lunes a viernes.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setCreatingGroup(true);
              createGroupMutation.reset();
            }}
          >
            <Plus size={15} /> Añadir
          </Button>
        </div>
        <div
          className="flex flex-wrap gap-2 border-b border-border p-3"
          role="tablist"
          aria-label="Filtrar agenda por tipo"
        >
          {(
            [
              ["all", "Todas"],
              ["extraescolares", "Extraescolares"],
              ["casals", "Casals"],
              ["particulares", "Particulares"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={agendaCategory === value}
              onClick={() => setAgendaCategory(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${agendaCategory === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {groups.isLoading || teachers.isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <div
              ref={agendaGridRef}
              className="grid min-w-[760px] grid-cols-5 divide-x divide-border"
            >
              {weekDays.map((day) => {
                const entries = (groups.data ?? [])
                  .filter(
                    (group) =>
                      agendaCategory === "all" ||
                      getAgendaCategory(
                        group,
                        activityOptions.data?.items ?? [],
                      ) === agendaCategory,
                  )
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
                          const school = schools.data?.items.find(
                            (item) => item.id === group.schoolId,
                          );
                          const schoolColor = school
                            ? schoolColors.get(school.id)
                            : undefined;
                          return (
                            <article
                              key={`${group.id}-${slot.startsAt}`}
                              ref={(node) => {
                                const key = `${group.id}-${slot.startsAt}`;
                                if (node) agendaCardsRef.current.set(key, node);
                                else agendaCardsRef.current.delete(key);
                              }}
                              className={`group relative cursor-pointer rounded-[4px] border p-3 shadow-sm ${schoolColor === undefined ? "border-border bg-card" : "agenda-school-card"}`}
                              style={
                                schoolColor === undefined
                                  ? undefined
                                  : ({
                                      "--agenda-school-accent": schoolColor,
                                    } as CSSProperties & {
                                      "--agenda-school-accent": string;
                                    })
                              }
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
      <ActivityGroupEditDialog
        group={editingGroup}
        open={Boolean(editingGroup) || creatingGroup}
        pending={
          creatingGroup
            ? createGroupMutation.isPending
            : updateGroupMutation.isPending
        }
        error={
          creatingGroup
            ? createGroupMutation.error?.message
            : updateGroupMutation.error?.message
        }
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
            setCreatingGroup(false);
            updateGroupMutation.reset();
            createGroupMutation.reset();
          }
        }}
        onSubmit={(payload) => {
          if (creatingGroup) createGroupMutation.mutate(payload);
          else if (editingGroup)
            updateGroupMutation.mutate({ id: editingGroup.id, payload });
        }}
      />
    </>
  );
}
