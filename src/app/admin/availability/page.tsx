"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, Plus, Trash2, Save, AlertCircle } from "lucide-react";

const DAYS = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Disponibilidad</h1>
        <p className="text-gray-400 text-sm mt-1">Configurá tus horarios semanales y bloqueá fechas especiales.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-500" />
            <h2 className="text-lg font-bold">Horarios Semanales</h2>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden text-sm">
            {DAYS.map((day, index) => {
              const schedule = schedules.find(s => s.day_of_week === index);
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all gap-2">
                  <div className="font-bold text-gray-300">{day}</div>
                  
                  {schedule ? (
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <input 
                          type="time" 
                          value={schedule.start_time.slice(0, 5)} 
                          className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs focus:border-gold-500"
                          onChange={(e) => updateSchedule(schedule.id, e.target.value, schedule.end_time, schedule.is_active)}
                        />
                        <span className="text-gray-600 text-xs">a</span>
                        <input 
                          type="time" 
                          value={schedule.end_time.slice(0, 5)} 
                          className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs focus:border-gold-500"
                          onChange={(e) => updateSchedule(schedule.id, schedule.start_time, e.target.value, schedule.is_active)}
                        />
                      </div>
                      <button 
                        onClick={() => updateSchedule(schedule.id, schedule.start_time, schedule.end_time, !schedule.is_active)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${schedule.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                      >
                        {schedule.is_active ? 'Activo' : 'Cerrado'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-600 italic text-xs">No configurado</div>
                  )}
                </div>
              );
            })}
          </div>
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
