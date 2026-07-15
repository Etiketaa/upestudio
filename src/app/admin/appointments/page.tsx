"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Search, Filter, Calendar, Clock, Trash2, 
  ChevronLeft, ChevronRight, Download, X 
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ConfirmModal } from "@/components/confirm-modal";

type Appointment = {
  id: string;
  date: string;
  time: string;
  notes: string | null;
  created_at: string;
  client: { first_name: string; last_name: string; phone: string; email: string } | null;
  service: { name: string; price: number; category: string } | null;
};

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [dateFrom, dateTo]);

  async function fetchAppointments() {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        client:clients(first_name, last_name, phone, email),
        service:services(name, price, category)
      `)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
  }

  async function deleteAppointment(id: string) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      toast("Turno eliminado", "success");
    } else {
      toast("Error al eliminar", "error");
    }
  }

  function exportCSV() {
    const headers = ["Fecha", "Hora", "Cliente", "Email", "Teléfono", "Servicio", "Precio", "Notas"];
    const rows = filtered.map(a => [
      a.date,
      a.time.slice(0, 5),
      `${a.client?.first_name} ${a.client?.last_name}`,
      a.client?.email || "",
      a.client?.phone || "",
      a.service?.name || "",
      a.service?.price || 0,
      a.notes || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `turnos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast("CSV exportado correctamente", "success");
  }

  const filtered = appointments.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || 
      `${a.client?.first_name} ${a.client?.last_name}`.toLowerCase().includes(term) ||
      a.client?.email?.toLowerCase().includes(term) ||
      a.service?.name?.toLowerCase().includes(term);
    return matchSearch;
  });

  const totalRevenue = filtered.reduce((sum, a) => sum + (a.service?.price || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turnos</h1>
          <p className="text-gray-400">{filtered.length} turnos encontrados</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
              showFilters ? "bg-gold-600 text-black" : "bg-white/5 border border-white/10 text-gray-400"
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Download className="w-4 h-4 text-gold-500" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por cliente, email o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-gold-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-gold-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total estimado: <span className="text-gold-500 font-bold">{formatCurrency(totalRevenue)}</span></span>
            {(searchTerm || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearchTerm(""); setDateFrom(format(subDays(new Date(), 7), "yyyy-MM-dd")); setDateTo(format(addDays(new Date(), 30), "yyyy-MM-dd")); }}
                className="text-gray-500 hover:text-white flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Servicio</th>
                <th className="px-6 py-4 font-bold">Precio</th>
                <th className="px-6 py-4 font-bold">Notas</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-white/[0.02]" />
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map(a => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center h-12 w-12 bg-gold-600/10 text-gold-500 rounded-xl font-bold text-sm">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs leading-none mt-0.5">{format(new Date(a.date + "T00:00:00"), "d/M")}</span>
                        </div>
                        <div>
                          <div className="font-bold">{a.time.slice(0, 5)}</div>
                          <div className="text-xs text-gray-500">{format(new Date(a.date + "T00:00:00"), "EEEE", { locale: es })}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{a.client?.first_name} {a.client?.last_name}</div>
                      <div className="text-xs text-gray-500">{a.client?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                        a.service?.category === "Maquillaje" ? "bg-pink-500/10 text-pink-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {a.service?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gold-500">
                      {formatCurrency(a.service?.price || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 max-w-[200px] truncate">
                      {a.notes || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No se encontraron turnos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteAppointment(deleteId); }}
        title="Eliminar turno"
        message="¿Estás segura de que querés eliminar este turno? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
