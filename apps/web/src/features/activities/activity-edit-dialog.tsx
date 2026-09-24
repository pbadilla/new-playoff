import { type FormEvent, useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../components/ui/dialog";
import type { Activity } from "../../lib/api";
import { inputClass, labelClass } from "../shared/backoffice-ui";
import { activityTypes } from "./activity-options";

type ActivityEditDialogProps = {
  activity: Activity | null;
  open: boolean;
  pending: boolean;
  error?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    description?: string;
    category?: string;
    minimumAge?: number;
    maximumAge?: number;
  }) => void;
};

export function ActivityEditDialog({
  activity,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: ActivityEditDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Otros");
  const [description, setDescription] = useState("");
  const [minimumAge, setMinimumAge] = useState("");
  const [maximumAge, setMaximumAge] = useState("");

  useEffect(() => {
    if (!activity) return;
    setName(activity.name);
    setCategory(activity.category ?? "Otros");
    setDescription(activity.description ?? "");
    setMinimumAge(
      activity.minimumAge === null ? "" : String(activity.minimumAge),
    );
    setMaximumAge(
      activity.maximumAge === null ? "" : String(activity.maximumAge),
    );
  }, [activity]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      category: category || undefined,
      description: description.trim() || undefined,
      minimumAge: minimumAge ? Number(minimumAge) : undefined,
      maximumAge: maximumAge ? Number(maximumAge) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title="Editar actividad"
          description="Actualiza los datos generales y revisa las asociaciones actuales."
        />
        {activity && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Summary label="Grupos" value={activity.groupCount ?? 0} />
              <Summary label="Profesores" value={activity.teacherCount ?? 0} />
              <Summary label="Alumnos" value={activity.participantCount ?? 0} />
              <Summary label="Centros" value={activity.schoolCount ?? 0} />
            </div>
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
                Tipo
                <select
                  className={inputClass}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
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
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>
                  Edad mínima
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="21"
                    value={minimumAge}
                    onChange={(event) => setMinimumAge(event.target.value)}
                  />
                </label>
                <label className={labelClass}>
                  Edad máxima
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="21"
                    value={maximumAge}
                    onChange={(event) => setMaximumAge(event.target.value)}
                  />
                </label>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[4px] border border-border bg-muted/20 p-2 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
