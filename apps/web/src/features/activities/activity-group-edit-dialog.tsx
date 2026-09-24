import { type FormEvent, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../components/ui/dialog";
import {
  type Activity,
  type ActivityGroup,
  backofficeApi,
  type School,
  type Student,
  type Teacher,
} from "../../lib/api";
import { inputClass, labelClass } from "../shared/backoffice-ui";

type Props = {
  group: ActivityGroup | null;
  open: boolean;
  pending: boolean;
  error?: string;
  activities: Activity[];
  teachers: Teacher[];
  students: Student[];
  schools: School[];
  onOpenChange: (open: boolean) => void;
  onManageStudents: () => void;
  onSubmit: (payload: {
    activityId: string;
    name: string;
    scope: "school" | "external";
    schoolId?: string;
    venueId?: string;
    teacherIds: string[];
    studentIds: string[];
    capacity: number;
    schedule: ActivityGroup["schedule"];
  }) => void;
};

const weekDays = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
];

export function ActivityGroupEditDialog({
  group,
  open,
  pending,
  error,
  activities,
  teachers,
  students,
  schools,
  onOpenChange,
  onManageStudents,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [activityId, setActivityId] = useState("");
  const [scope, setScope] = useState<"school" | "external">("external");
  const [schoolId, setSchoolId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ActivityGroup["schedule"]>([]);
  const schoolStudents = useQuery({
    queryKey: ["activity-group-students", schoolId],
    queryFn: () =>
      backofficeApi.students.list({ active: "true", schoolId, pageSize: 100 }),
    enabled: open && scope === "school" && Boolean(schoolId),
  });

  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setActivityId(group.activityId);
    setScope(group.scope);
    setSchoolId(group.schoolId ?? "");
    setVenueId(group.venueId ?? "");
    setCapacity(String(group.capacity));
    setTeacherIds(group.teacherIds);
    setStudentIds(group.studentIds);
    setSchedule(group.schedule);
  }, [group]);

  const toggle = (
    value: string,
    values: string[],
    setValues: (next: string[]) => void,
  ) =>
    setValues(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  const availableStudents =
    scope === "school" && schoolId
      ? (schoolStudents.data?.items ?? [])
      : students;
  const changeSchool = (nextSchoolId: string) => {
    setSchoolId(nextSchoolId);
    setStudentIds([]);
  };
  const toggleDay = (dayOfWeek: number) => {
    setSchedule((current) =>
      current.some((slot) => slot.dayOfWeek === dayOfWeek)
        ? current.filter((slot) => slot.dayOfWeek !== dayOfWeek)
        : [...current, { dayOfWeek, startsAt: "16:30", endsAt: "17:30" }].sort(
            (left, right) => left.dayOfWeek - right.dayOfWeek,
          ),
    );
  };
  const updateTime = (
    dayOfWeek: number,
    field: "startsAt" | "endsAt",
    value: string,
  ) =>
    setSchedule((current) =>
      current.map((slot) =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value } : slot,
      ),
    );
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      activityId,
      name: name.trim(),
      scope,
      schoolId: scope === "school" ? schoolId : undefined,
      venueId: venueId.trim() || undefined,
      capacity: Number(capacity),
      teacherIds,
      studentIds,
      schedule,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader
          title="Editar grupo"
          description="Gestiona profesores, alumnos y el centro asociado a este grupo."
        />
        {group && (
          <form className="grid gap-4" onSubmit={submit}>
            <label className={labelClass}>
              Nombre
              <input
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </label>
            <label className={labelClass}>
              Actividad
              <select
                className={inputClass}
                value={activityId}
                onChange={(event) => setActivityId(event.target.value)}
                required
              >
                <option value="">Selecciona una actividad</option>
                {activities
                  .filter((activity) => activity.active)
                  .map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Ámbito
                <select
                  className={inputClass}
                  value={scope}
                  onChange={(event) =>
                    setScope(event.target.value as "school" | "external")
                  }
                >
                  <option value="school">Centro escolar</option>
                  <option value="external">Externo</option>
                </select>
              </label>
              <label className={labelClass}>
                Aforo
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  required
                />
              </label>
            </div>
            {scope === "school" && (
              <label className={labelClass}>
                Centro / colegio
                <select
                  className={inputClass}
                  value={schoolId}
                  onChange={(event) => changeSchool(event.target.value)}
                  required
                >
                  <option value="">Selecciona un centro</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={labelClass}>
              Centro de actividad / sala
              <input
                className={inputClass}
                value={venueId}
                onChange={(event) => setVenueId(event.target.value)}
                placeholder="Nombre o referencia del espacio"
              />
            </label>
            <fieldset className="grid gap-2">
              <legend className="text-xs font-semibold">Horario</legend>
              <div className="grid gap-2 rounded-[4px] border border-border p-2">
                {weekDays.map((day) => {
                  const slot = schedule.find(
                    (item) => item.dayOfWeek === day.value,
                  );
                  return (
                    <div
                      key={day.value}
                      className="grid items-center gap-2 sm:grid-cols-[7rem_1fr_1fr]"
                    >
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean(slot)}
                          onChange={() => toggleDay(day.value)}
                        />
                        {day.label}
                      </label>
                      <input
                        className={inputClass}
                        type="time"
                        disabled={!slot}
                        value={slot?.startsAt ?? ""}
                        onChange={(event) =>
                          updateTime(day.value, "startsAt", event.target.value)
                        }
                      />
                      <input
                        className={inputClass}
                        type="time"
                        disabled={!slot}
                        value={slot?.endsAt ?? ""}
                        onChange={(event) =>
                          updateTime(day.value, "endsAt", event.target.value)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </fieldset>
            <Selection
              title="Profesores asociados"
              items={teachers.map((teacher) => ({
                id: teacher.id,
                label: `${teacher.firstName} ${teacher.lastName}`,
              }))}
              selected={teacherIds}
              onToggle={(id) => toggle(id, teacherIds, setTeacherIds)}
            />
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold">
                  Alumnos inscritos ({studentIds.length})
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={onManageStudents}
                >
                  Gestionar alumnos
                </button>
              </div>
              {schoolStudents.isLoading ? (
                <div className="rounded-[4px] border border-border p-3 text-xs text-muted-foreground">
                  Cargando alumnos del centro...
                </div>
              ) : (
                <Selection
                  title=""
                  items={availableStudents.map((student) => ({
                    id: student.id,
                    label: `${student.firstName} ${student.lastName}`,
                  }))}
                  selected={studentIds}
                  onToggle={(id) => toggle(id, studentIds, setStudentIds)}
                />
              )}
            </div>
            {error && (
              <p className="rounded-[4px] bg-rose-500/10 p-3 text-xs text-rose-600">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Selection({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      {title && (
        <legend className="text-xs font-semibold">
          {title} ({selected.length})
        </legend>
      )}
      <div className="grid max-h-36 gap-1 overflow-y-auto rounded-[4px] border border-border p-2 sm:grid-cols-2">
        {items.length ? (
          items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-xs hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
              />
              {item.label}
            </label>
          ))
        ) : (
          <span className="p-2 text-xs text-muted-foreground">
            {title
              ? "No hay registros disponibles."
              : "Este centro no tiene alumnos disponibles."}
          </span>
        )}
      </div>
    </fieldset>
  );
}
