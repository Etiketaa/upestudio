"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  X,
  Scissors,
  Trash2,
  Crown,
  Star
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ConfirmModal } from "@/components/confirm-modal";

type AppointmentWithDetails = {
  id: string;
  date: string;
  time: string;
  notes: string | null;
  client: { first_name: string; last_name: string; phone: string } | null;
  service: { name: string; price: number } | null;
};

type ServiceStat = { name: string; count: number; revenue: number };
type ClientStat = { name: string; count: number; phone: string; email: string };

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({ totalAppointments: 0, totalClients: 0, revenue: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentWithDetails[]>([]);
  const [topServices, setTopServices] = useState<ServiceStat[]>([]);
  const [topClients, setTopClients] = useState<ClientStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function deleteAppointment(id: string) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) {
      setUpcomingAppointments(prev => prev.filter(a => a.id !== id));
      toast("Turno eliminado correctamente", "success");
    } else {
      toast("Error al eliminar el turno", "error");
    }
  }

  useEffect(() => {
    async function fetchData() {
      // Fetch upcoming appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          *,
          client:clients(first_name, last_name, phone),
          service:services(name, price)
        `)
        .gte("date", format(new Date(), "yyyy-MM-dd"))
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(20);

      if (appointments) setUpcomingAppointments(appointments);

      // Counts
      const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true });
      const { count: appCount } = await supabase.from("appointments").select("*", { count: "exact", head: true });

      // Revenue: sum service prices for all appointments
      const { data: allApps } = await supabase
        .from("appointments")
        .select("service:services(price)");
      
      let revenue = 0;
      if (allApps) {
        revenue = allApps.reduce((sum, a) => {
          const price = (a.service as any)?.price || 0;
          return sum + price;
        }, 0);
      }

      setStats({
        totalClients: clientCount || 0,
        totalAppointments: appCount || 0,
        revenue,
      });

      // Top services (by appointment count)
      if (allApps) {
        const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
        for (const a of allApps) {
          const svc = a.service as any;
          if (!svc) continue;
          const key = svc.name;
          const existing = serviceMap.get(key);
          if (existing) {
            existing.count++;
            existing.revenue += svc.price || 0;
          } else {
            serviceMap.set(key, { name: svc.name, count: 1, revenue: svc.price || 0 });
          }
        }
        setTopServices(
          Array.from(serviceMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      }

      // Top clients (by appointment count)
      if (allApps) {
        const { data: appWithClients } = await supabase
          .from("appointments")
          .select("client:clients(first_name, last_name, phone, email)");
        
        if (appWithClients) {
          const clientMap = new Map<string, ClientStat>();
          for (const a of appWithClients) {
            const c = a.client as any;
            if (!c) continue;
            const key = c.email || `${c.first_name}-${c.last_name}`;
            const existing = clientMap.get(key);
            if (existing) {
              existing.count++;
            } else {
              clientMap.set(key, { name: `${c.first_name} ${c.last_name}`, count: 1, phone: c.phone, email: c.email });
            }
          }
          setTopClients(
            Array.from(clientMap.values())
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          );
        }
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const statCards = [
    { label: "Turnos Totales", value: stats.totalAppointments, icon: CalendarIcon, color: "text-blue-500" },
    { label: "Clientes", value: stats.totalClients, icon: Users, color: "text-purple-500" },
    { label: "Ingresos Totales", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bienvenida, Peim</h1>
          <p className="text-gray-400 text-sm mt-1">Acá tenés un resumen de lo que está pasando en UP! Estudio.</p>
        </div>
        <div className="sm:text-right">
          <div className="text-xs font-medium text-gold-500 uppercase tracking-widest">Hoy es</div>
          <div className="text-sm font-bold">{format(new Date(), "eeee d 'de' MMMM", { locale: es })}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div className={cn(stat.color, "mb-2")}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold">Próximos Turnos</h2>

          <div className="space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
              ))
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-6 group hover:bg-white/[0.08] transition-all">
                  <div className="flex flex-col items-center justify-center h-14 w-14 bg-gold-600/10 text-gold-500 rounded-xl font-bold">
                    <span className="text-[10px] uppercase">{format(new Date(app.date + "T00:00:00"), "EEE", { locale: es })}</span>
                    <span className="text-xl leading-none">{format(new Date(app.date + "T00:00:00"), "d")}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold text-lg">{app.client?.first_name} {app.client?.last_name}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold-500" />
                      {app.service?.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xl flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      {app.time.slice(0, 5)}
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">{app.client?.phone}</div>
                  </div>

                  <button 
                    onClick={() => setDeleteId(app.id)}
                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                No hay turnos próximos programados.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Quick Actions + Top Services + Top Clients */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Acciones Rápidas</h2>
          <div className="grid gap-3">
            <Link
              href="/admin/appointments/new"
              className="p-4 bg-gold-600 text-black font-bold rounded-xl hover:bg-gold-500 transition-all text-left flex items-center justify-between"
            >
              Nuevo Turno Manual
              <CalendarIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/admin/services"
              className="p-4 bg-white/5 border border-white/10 hover:border-gold-500/50 rounded-xl transition-all text-left flex items-center justify-between"
            >
              Gestionar Servicios
              <Scissors className="w-5 h-5 text-gold-500" />
            </Link>
            <Link
              href="/admin/availability"
              className="p-4 bg-white/5 border border-white/10 hover:border-gold-500/50 rounded-xl transition-all text-left flex items-center justify-between"
            >
              Bloquear Fecha
              <X className="w-5 h-5 text-red-500" />
            </Link>
          </div>

          {/* Top Services */}
          {!loading && topServices.length > 0 && (
            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
              <h3 className="font-bold text-gold-500 uppercase tracking-widest text-xs flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Servicios Populares
              </h3>
              <div className="space-y-3">
                {topServices.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        i === 0 ? "bg-gold-500/20 text-gold-500" : "bg-white/5 text-gray-500"
                      )}>
                        {i + 1}
                      </span>
                      <span className="text-gray-300">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{s.count}</span>
                      <span className="text-gray-600 ml-1">turnos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Clients */}
          {!loading && topClients.length > 0 && (
            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
              <h3 className="font-bold text-gold-500 uppercase tracking-widest text-xs flex items-center gap-2">
                <Star className="w-4 h-4" />
                Clientes Frecuentes
              </h3>
              <div className="space-y-3">
                {topClients.map((c, i) => (
                  <div key={c.email} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        i === 0 ? "bg-gold-500/20 text-gold-500" : "bg-white/5 text-gray-500"
                      )}>
                        {i + 1}
                      </span>
                      <span className="text-gray-300">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{c.count}</span>
                      <span className="text-gray-600 ml-1">turnos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 bg-gold-600/5 border border-gold-600/10 rounded-2xl">
            <h3 className="font-bold text-gold-500 mb-2 uppercase tracking-widest text-xs">Tip del día</h3>
            <p className="text-sm text-gray-400">Recordá confirmar los turnos de mañana para reducir el ausentismo.</p>
          </div>
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
