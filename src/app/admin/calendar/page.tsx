"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, 
  addMonths, subMonths, isSameDay, isSameMonth, startOfToday 
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Appointment = {
  id: string;
  date: string;
  time: string;
  client: { first_name: string; last_name: string } | null;
  service: { name: string; price: number } | null;
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [currentMonth]);

  async function fetchAppointments() {
    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        client:clients(first_name, last_name),
        service:services(name, price)
      `)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("time");

    if (data) setAppointments(data);
    setLoading(false);
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getAppointmentsForDay = (date: Date) =>
    appointments.filter(a => isSameDay(new Date(a.date + "T00:00:00"), date));

  const selectedAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Calendario</h1>
        <p className="text-gray-400 mt-1">Vista mensual de todos los turnos.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold capitalize">{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
                <div key={d} className="text-center text-[10px] uppercase tracking-widest text-gray-500 font-bold py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array(startPadding).fill(0).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map(day => {
                const dayAppts = getAppointmentsForDay(day);
                const isToday = isSameDay(day, startOfToday());
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative",
                      isSelected
                        ? "bg-gold-600 text-black font-bold scale-105 shadow-lg shadow-gold-500/20"
                        : isToday
                          ? "bg-white/10 border border-gold-500/30"
                          : "hover:bg-white/5"
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {dayAppts.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayAppts.slice(0, 3).map((_, i) => (
                          <div key={i} className={cn("w-1 h-1 rounded-full", isSelected ? "bg-black" : "bg-gold-500")} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Detail */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">
            {selectedDay
              ? `Turnos del ${format(selectedDay, "d 'de' MMMM", { locale: es })}`
              : "Seleccioná un día"}
          </h3>

          {selectedDay && (
            <div className="space-y-3">
              {loading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)
              ) : selectedAppointments.length > 0 ? (
                selectedAppointments.map(a => (
                  <div key={a.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gold-500 font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      {a.time.slice(0, 5)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{a.client?.first_name} {a.client?.last_name}</div>
                      <div className="text-xs text-gray-400">{a.service?.name}</div>
                    </div>
                    <div className="text-xs font-bold text-gold-500">{formatCurrency(a.service?.price || 0)}</div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  No hay turnos este día.
                </div>
              )}
            </div>
          )}

          {!selectedDay && (
            <div className="p-8 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
              Hacé click en un día del calendario para ver los detalles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
