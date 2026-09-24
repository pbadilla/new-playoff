import { useEffect, useState } from "react";

import {
  Activity,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Command as CommandIcon,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Pencil,
  School,
  Search,
  Settings,
  Star,
  Sun,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { ActivitiesPage } from "../features/activities/activities-page";
import { CommunicationPage } from "../features/communication/communication-page";
import { FinancePage } from "../features/finance/finance-page";
import { SchoolsPage } from "../features/schools/schools-page";
import { StudentsPage } from "../features/students/students-page";
import { TeachersPage } from "../features/teachers/teachers-page";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

const nav = [
  ["Dashboard", LayoutDashboard],
  ["Alumnos", Users],
  ["Colegios", School],
  ["Profesores", UserRound],
  ["Finanzas", WalletCards],
  ["Comunicación", MessageCircle],
  ["Actividades", CalendarDays],
  ["Más", MoreHorizontal],
] as const;

type Section = (typeof nav)[number][0];

const stats = [
  {
    label: "Alumnos activos",
    value: "486",
    change: "+14,2%",
    tone: "text-emerald-600",
    helper: "vs. curso anterior",
  },
  {
    label: "Colegios",
    value: "12",
    change: "+2",
    tone: "text-emerald-600",
    helper: "este curso",
  },
  {
    label: "Grupos activos",
    value: "38",
    change: "+8,6%",
    tone: "text-emerald-600",
    helper: "vs. curso anterior",
  },
  {
    label: "Profesores",
    value: "21",
    change: "+9,0%",
    tone: "text-emerald-600",
    helper: "vs. curso anterior",
  },
];

const receiptData = [
  { name: "Cobrados", value: 18419, color: "#2eae66" },
  { name: "Pendientes", value: 1526, color: "#f59e0b" },
  { name: "Remesa SEPA", value: 245, color: "#7c3aed" },
  { name: "Impagados", value: 875, color: "#ef4444" },
];

const categories = [
  "Robótica y tecnología",
  "Idiomas",
  "Deporte",
  "Arte y creatividad",
  "Apoyo escolar",
];

const activities = [
  ["03-02-2026", "Programa de Detección de Talento", "Campus"],
  ["15-11-2025", "Campus de Tecnificación", "Formación"],
  ["08-11-2025", "Jornada de puertas abiertas", "Club"],
];

export function Dashboard() {
  const [active, setActive] = useState<Section>("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const goTo = (section: Section) => {
    setActive(section);
    setMobileOpen(false);
    setCommandOpen(false);
  };

  return (
    <div className="min-h-screen bg-muted/45 text-foreground">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-2 px-3 lg:px-6">
          <button
            className="mr-2 flex shrink-0 items-center gap-2 rounded-[4px] p-1.5 hover:bg-white/10"
            onClick={() => goTo("Dashboard")}
          >
            <span className="grid size-8 place-items-center rounded-full bg-white text-violet-700">
              <Trophy size={17} />
            </span>
            <span className="hidden text-base font-bold tracking-tight sm:block">
              PlayRG360
            </span>
          </button>

          <button
            className="hidden h-9 w-52 items-center gap-2 rounded-[4px] bg-white/95 px-3 text-xs text-slate-500 shadow-sm md:flex"
            onClick={() => setCommandOpen(true)}
          >
            <Search size={14} />
            <span>Buscar</span>
            <kbd className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
              <CommandIcon size={10} />K
            </kbd>
          </button>

          <nav
            className="ml-2 hidden h-full items-center xl:flex"
            aria-label="Navegación principal"
          >
            {nav.slice(1).map(([label, Icon]) => (
              <button
                key={label}
                className={`relative flex h-full items-center gap-1.5 px-3 text-xs font-medium transition hover:bg-white/10 ${active === label ? "bg-white/12" : "text-white/90"}`}
                onClick={() => goTo(label)}
              >
                <Icon size={14} />
                {label}
                {active === label && (
                  <motion.span
                    layoutId="top-nav"
                    className="absolute inset-x-3 bottom-0 h-0.5 bg-white"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <Button
              className="text-white hover:bg-white/10 hover:text-white md:hidden"
              variant="ghost"
              size="icon"
              aria-label="Buscar"
              onClick={() => setCommandOpen(true)}
            >
              <Search size={17} />
            </Button>
            <Button
              className="text-white hover:bg-white/10 hover:text-white"
              variant="ghost"
              size="icon"
              aria-label="Favoritos"
            >
              <Star size={17} />
            </Button>
            <Button
              className="text-white hover:bg-white/10 hover:text-white"
              variant="ghost"
              size="icon"
              aria-label="Notificaciones"
            >
              <Bell size={17} />
            </Button>
            <Button
              className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
              variant="ghost"
              size="icon"
              aria-label={`Activar modo ${theme === "dark" ? "claro" : "oscuro"}`}
              onClick={toggle}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <button className="ml-1 grid size-8 place-items-center rounded-full bg-amber-100 text-amber-800 ring-2 ring-white/50">
              <UserRound size={17} />
            </button>
            <Button
              className="text-white hover:bg-white/10 hover:text-white xl:hidden"
              variant="ghost"
              size="icon"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={19} />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/35"
            onMouseDown={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="ml-auto h-full w-72 bg-card p-4 shadow-2xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold">PlayRG360</p>
                  <p className="text-xs text-muted-foreground">
                    Menú principal
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                >
                  <X size={18} />
                </Button>
              </div>
              <nav className="space-y-1">
                {nav.map(([label, Icon]) => (
                  <button
                    key={label}
                    className={`flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm ${active === label ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    onClick={() => goTo(label)}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
              </nav>
              <Button
                className="mt-5 w-full"
                variant="outline"
                onClick={toggle}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                Cambiar tema
              </Button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1500px] p-3 sm:p-5 lg:p-6">
        {active === "Dashboard" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Domingo, 21 de septiembre
                </p>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  ¡Buenos días, Alex!
                </h1>
              </div>
              <Button variant="outline" size="sm" className="bg-card">
                <Pencil size={14} />
                Editar panel
              </Button>
            </div>

            <section
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="Indicadores principales"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="relative overflow-hidden rounded-[4px] border-0 p-4 shadow-sm ring-1 ring-border/70">
                    <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-3xl font-bold tracking-tight">
                          {stat.value}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${stat.tone}`}>
                          {stat.change}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {stat.helper}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.85fr]">
              <Card className="overflow-hidden rounded-[4px] border-0 shadow-sm ring-1 ring-border/70">
                <PanelHeader
                  title="Recibos"
                  icon={CircleDollarSign}
                  action="Ver todos los recibos"
                />
                <div className="grid min-h-80 gap-4 p-4 lg:grid-cols-[1fr_1.05fr]">
                  <div className="relative h-52 lg:h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={receiptData}
                          dataKey="value"
                          innerRadius="68%"
                          outerRadius="88%"
                          startAngle={200}
                          endAngle={-20}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {receiptData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-items-center pt-5 text-center">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Total
                        </p>
                        <p className="text-2xl font-bold">21.374,25 €</p>
                        <p className="text-xs text-muted-foreground">
                          411 recibos
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid content-center grid-cols-2 gap-x-5 gap-y-5">
                    {receiptData.map((item, index) => (
                      <div
                        key={item.name}
                        className="border-l-2 pl-3"
                        style={{ borderColor: item.color }}
                      >
                        <p className="text-sm font-bold">
                          {item.value.toLocaleString("es-ES")}
                          ,00 €
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {index === 0
                            ? "Recibos cobrados"
                            : index === 1
                              ? "Pendientes de cobro"
                              : index === 2
                                ? "Por remesa SEPA"
                                : "Recibos impagados"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="grid gap-4">
                <Card className="overflow-hidden rounded-[4px] border-0 shadow-sm ring-1 ring-border/70">
                  <PanelHeader title="Categorías" icon={Users} />
                  <div className="divide-y divide-border">
                    {categories.map((category) => (
                      <button
                        key={category}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold uppercase transition hover:bg-muted/60"
                      >
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground"
                        />
                        {category}
                        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          Ver
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[.55fr_1.45fr]">
              <Card className="rounded-[4px] border-0 p-4 shadow-sm ring-1 ring-border/70">
                <div className="flex items-center gap-2">
                  <Star size={16} />
                  <h2 className="text-sm font-semibold">Favoritos</h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    ["Nuevo alumno", UserPlus],
                    ["Colegios", School],
                    ["Grupos", Trophy],
                    ["Agenda", CalendarDays],
                  ].map(([label, Icon]) => (
                    <button
                      key={label as string}
                      className="flex flex-col items-center gap-2 rounded-[4px] border border-border p-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <Icon size={18} className="text-primary" />
                      {label as string}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="overflow-hidden rounded-[4px] border-0 shadow-sm ring-1 ring-border/70">
                <PanelHeader
                  title="Actividades"
                  icon={CalendarDays}
                  action="Ver todas las actividades"
                />
                <div className="flex gap-5 border-b border-border px-4 text-xs font-medium">
                  <button className="border-b-2 border-primary py-3 text-primary">
                    Activas
                  </button>
                  <button className="py-3 text-muted-foreground">
                    Por tipología
                  </button>
                  <button className="py-3 text-muted-foreground">
                    Por agrupación
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {activities.map(([date, title, category]) => (
                    <button
                      key={title}
                      className="grid w-full grid-cols-[88px_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                    >
                      <span className="text-xs text-muted-foreground">
                        {date}
                      </span>
                      <span className="truncate text-sm font-medium text-primary">
                        {title}
                      </span>
                      <span className="hidden rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary sm:block">
                        {category}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </section>
          </>
        ) : active === "Colegios" ? (
          <SchoolsPage />
        ) : active === "Profesores" ? (
          <TeachersPage />
        ) : active === "Alumnos" ? (
          <StudentsPage />
        ) : active === "Comunicación" ? (
          <CommunicationPage />
        ) : active === "Actividades" ? (
          <ActivitiesPage onNavigate={goTo} />
        ) : active === "Finanzas" ? (
          <FinancePage />
        ) : (
          <ComingSoon section={active} />
        )}
      </main>

      <AnimatePresence>
        {commandOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex justify-center bg-black/40 p-4 pt-[15vh] backdrop-blur-sm"
            onMouseDown={() => setCommandOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="h-fit w-full max-w-xl overflow-hidden rounded-[4px] border border-border bg-card shadow-2xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <Command loop>
                <CommandInput
                  autoFocus
                  placeholder="Buscar secciones y acciones..."
                />
                <CommandList>
                  <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                  <CommandGroup heading="Navegación">
                    {nav.map(([label, Icon]) => (
                      <CommandItem
                        key={label}
                        value={label}
                        onSelect={() => goTo(label)}
                      >
                        <Icon size={17} />
                        <span>Ir a{label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Acciones rápidas">
                    <CommandItem
                      value="Crear nuevo alumno"
                      onSelect={() => goTo("Alumnos")}
                    >
                      <UserPlus size={17} />
                      <span>Crear nuevo alumno</span>
                    </CommandItem>
                    <CommandItem
                      value="Registrar un pago"
                      onSelect={() => goTo("Finanzas")}
                    >
                      <WalletCards size={17} />
                      <span>Registrar un pago</span>
                    </CommandItem>
                    <CommandItem
                      value="Crear actividad"
                      onSelect={() => goTo("Actividades")}
                    >
                      <Activity size={17} />
                      <span>Crear actividad</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: typeof Users;
  action?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Icon size={16} className="text-muted-foreground" />
      <h2 className="text-sm font-semibold">{title}</h2>
      {action && (
        <button className="ml-auto text-xs font-medium text-primary hover:underline">
          {action}
        </button>
      )}
      <button className="ml-1 rounded-[4px] p-1 text-muted-foreground hover:bg-muted">
        <ChevronDown size={14} />
      </button>
    </div>
  );
}

function ComingSoon({ section }: { section: Section }) {
  return (
    <Card className="grid min-h-[420px] place-items-center border-0 p-8 text-center shadow-sm ring-1 ring-border/70">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Próximamente
        </p>
        <h1 className="mt-2 text-2xl font-bold">{section}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Este módulo se construirá sobre la nueva base de colegios, profesores,
          alumnos y actividades.
        </p>
      </div>
    </Card>
  );
}
