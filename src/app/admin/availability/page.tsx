"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, Plus, Trash2, AlertCircle, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
  { name: "Lunes", short: "L", index: 1 },
  { name: "Martes", short: "M", index: 2 },
  { name: "Miércoles", short: "X", index: 3 },
  { name: "Jueves", short: "J", index: 4 },
  { name: "Viernes", short: "V", index: 5 },
  { name: "Sábado", short: "S", index: 6 },
  { name: "Domingo", short: "D", index: 0 },
];

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [copiedTimes, setCopiedTimes] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: schedData } = await supabase.from("schedules").select("*").order("day_of_week");
    const { data: blockData } = await supabase.from("blocks").select("*").order("date");
    
    if (schedData) setSchedules(schedData);
    if (blockData) setBlocks(blockData);
    setLoading(false);
  }

  async function updateSchedule(id: string, startTime: string, endTime: string, isActive: boolean) {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, start_time: startTime, end_time: endTime, is_active: isActive } : s));
    const { error } = await supabase
      .from("schedules")
      .update({ start_time: startTime, end_time: endTime, is_active: isActive })
      .eq("id", id);
    
    if (error) fetchData();
  }

  async function toggleDay(dayIndex: number) {
    const existing = schedules.find(s => s.day_of_week === dayIndex);
    if (existing) {
      await updateSchedule(existing.id, existing.start_time, existing.end_time, !existing.is_active);
    } else {
      const { error } = await supabase
        .from("schedules")
        .insert({ day_of_week: dayIndex, start_time: "09:00:00", end_time: "18:00:00", is_active: true });
      if (!error) fetchData();
    }
  }

  function copyTimes(dayIndex: number) {
    const schedule = schedules.find(s => s.day_of_week === dayIndex);
    if (schedule) {
      setCopiedTimes({ start: schedule.start_time.slice(0, 5), end: schedule.end_time.slice(0, 5) });
    }
  }

  function pasteTimes(dayIndex: number) {
    if (!copiedTimes) return;
    const existing = schedules.find(s => s.day_of_week === dayIndex);
    if (existing) {
      updateSchedule(existing.id, copiedTimes.start + ":00", copiedTimes.end + ":00", existing.is_active);
    }
  }

  function applyToAll() {
    if (!copiedTimes) return;
    schedules.forEach(s => {
      if (s.is_active) {
        updateSchedule(s.id, copiedTimes.start + ":00", copiedTimes.end + ":00", true);
      }
    });
  }

  async function addBlock() {
    if (!newBlockDate) return;
    const { error } = await supabase
      .from("blocks")
      .insert({ date: newBlockDate, reason: newBlockReason });
    
    if (!error) {
      setNewBlockDate("");
      setNewBlockReason("");
      fetchData();
    }
  }

  async function deleteBlock(id: string) {
    const { error } = await supabase.from("blocks").delete().eq("id", id);
    if (!error) fetchData();
  }

  const activeDays = schedules.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Disponibilidad</h1>
        <p className="text-gray-400 text-sm mt-1">Configurá tus horarios semanales y bloqueá fechas especiales.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              <h2 className="text-lg font-bold">Horarios</h2>
            </div>
            <span className="text-xs text-gray-500">{activeDays} días activos</span>
          </div>

          {/* Quick day toggles */}
          <div className="flex gap-2">
            {DAYS.map((day) => {
              const schedule = schedules.find(s => s.day_of_week === day.index);
              const isActive = schedule?.is_active;
              return (
                <button
                  key={day.index}
                  onClick={() => toggleDay(day.index)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                    isActive
                      ? "bg-gold-600 text-black"
                      : "bg-white/5 text-gray-500 hover:bg-white/10"
                  )}
                >
                  {day.short}
                </button>
              );
            })}
          </div>

          {/* Detailed schedule */}
          <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden text-sm">
            {DAYS.map((day) => {
              const schedule = schedules.find(s => s.day_of_week === day.index);
              const isActive = schedule?.is_active;
              
              return (
                <div key={day.index} className={cn(
                  "border-b border-white/5 last:border-0 transition-all",
                  isActive ? "bg-white/[0.02]" : "opacity-50"
                )}>
                  <div className="flex items-center justify-between p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleDay(day.index)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isActive ? "bg-gold-600 border-gold-600" : "border-gray-600"
                        )}
                      >
                        {isActive && <Check className="w-3 h-3 text-black" />}
                      </button>
                      <span className={cn("font-bold", isActive ? "text-gray-300" : "text-gray-600")}>{day.name}</span>
                    </div>
                    
                    {isActive && schedule && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input 
                            type="time" 
                            value={schedule.start_time.slice(0, 5)} 
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs focus:border-gold-500 w-24"
                            onChange={(e) => updateSchedule(schedule.id, e.target.value, schedule.end_time, true)}
                          />
                          <span className="text-gray-600 text-xs">a</span>
                          <input 
                            type="time" 
                            value={schedule.end_time.slice(0, 5)} 
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs focus:border-gold-500 w-24"
                            onChange={(e) => updateSchedule(schedule.id, schedule.start_time, e.target.value, true)}
                          />
                        </div>
                        <button
                          onClick={() => copyTimes(day.index)}
                          className="p-1 text-gray-500 hover:text-gold-500 transition-colors"
                          title="Copiar horario"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedTimes && (
                          <button
                            onClick={() => pasteTimes(day.index)}
                            className="p-1 text-gray-500 hover:text-gold-500 transition-colors"
                            title="Pegar horario"
                          >
                            <Copy className="w-3.5 h-3.5 rotate-90" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {copiedTimes && (
            <button
              onClick={applyToAll}
              className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/10 transition-all"
            >
              Aplicar horario {copiedTimes.start} - {copiedTimes.end} a todos los días activos
            </button>
          )}
        </div>

        {/* Date Blocks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold">Bloqueos de Fecha</h2>
          </div>

          {/* Add Block Form */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm">Añadir bloqueo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                type="date" 
                value={newBlockDate}
                onChange={(e) => setNewBlockDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-gold-500"
              />
              <input 
                type="text" 
                placeholder="Motivo (ej: Vacaciones)" 
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-gold-500"
              />
            </div>
            <button 
              onClick={addBlock}
              className="w-full py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gold-500 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Añadir
            </button>
          </div>

          {/* Blocks List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {blocks.length > 0 ? (
              blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div>
                    <div className="font-bold text-sm">{format(new Date(block.date + "T00:00:00"), "d 'de' MMMM, yyyy", { locale: es })}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">{block.reason || "Sin motivo"}</div>
                  </div>
                  <button 
                    onClick={() => deleteBlock(block.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-600 bg-white/5 rounded-2xl border border-dashed border-white/10 italic text-sm">
                No hay fechas bloqueadas.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-2xl flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">
          Los horarios configurados aquí controlan los turnos que aparecen disponibles para los clientes en la página de reservas. 
          Los bloqueos de fecha eliminan completamente ese día de la agenda.
        </p>
      </div>
    </div>
  );
}
