"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Check, Search } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast";

type Service = { id: string; name: string; duration_minutes: number; price: number; category: string };
type Client = { id: string; first_name: string; last_name: string; email: string; phone: string };

export default function NewAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(startOfToday(), 1));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: svcs } = await supabase.from("services").select("*").eq("is_active", true).order("name");
      const { data: cls } = await supabase.from("clients").select("*").order("first_name");
      if (svcs) setServices(svcs);
      if (cls) setClients(cls);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedService && selectedDate) generateSlots();
  }, [selectedService, selectedDate]);

  async function generateSlots() {
    if (!selectedService || !selectedDate) return;
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data: blocks } = await supabase.from("blocks").select("*").eq("date", dateStr);
    if (blocks && blocks.length > 0) { setAvailableSlots([]); return; }

    const { data: schedule } = await supabase
      .from("schedules").select("*")
      .eq("day_of_week", dayOfWeek).eq("is_active", true).single();

    if (!schedule) { setAvailableSlots([]); return; }

    // Get occupied slots
    const { data: occupied } = await supabase
      .from("appointments").select("time")
      .eq("date", dateStr);

    const occupiedTimes = new Set((occupied || []).map(o => o.time.slice(0, 5)));

    const slots: string[] = [];
    let current = schedule.start_time;
    const end = schedule.end_time;

    while (current < end) {
      const slot = current.slice(0, 5);
      if (!occupiedTimes.has(slot)) {
        slots.push(slot);
      }
      const [h, m] = current.split(":").map(Number);
      const nextH = h + Math.floor((m + 60) / 60);
      const nextM = (m + 60) % 60;
      current = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}:00`;
    }

    setAvailableSlots(slots);
  }

  const filteredClients = clients.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      let clientId: string;

      if (selectedClient) {
        clientId = selectedClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({ first_name: formData.firstName, last_name: formData.lastName, email: formData.email, phone: formData.phone })
          .select()
          .single();
        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const { error } = await supabase
        .from("appointments")
        .insert({
          client_id: clientId,
          service_id: selectedService?.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          notes: notes || null,
        });

      if (error) throw error;
      toast("Turno creado correctamente", "success");
      router.push("/admin");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast("Error al crear el turno", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Nuevo Turno Manual</h1>
          <p className="text-gray-400 text-sm">Creá un turno para un cliente existente o nuevo.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
        <span className={cn(step >= 1 && "text-gold-500 font-bold")}>Servicio</span>
        <ChevronRight className="w-3 h-3" />
        <span className={cn(step >= 2 && "text-gold-500 font-bold")}>Fecha</span>
        <ChevronRight className="w-3 h-3" />
        <span className={cn(step >= 3 && "text-gold-500 font-bold")}>Cliente</span>
      </div>

      {/* Step 1: Service */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold">Elegí el servicio</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)
            ) : services.map(service => (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service); setStep(2); }}
                className={cn(
                  "text-left p-5 rounded-2xl border transition-all",
                  selectedService?.id === service.id
                    ? "bg-gold-600 border-gold-500 text-black"
                    : "bg-white/5 border-white/10 hover:border-gold-500/50"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold bg-gold-500/20 text-gold-500">{service.category}</span>
                  <span className="font-bold text-sm">{formatCurrency(service.price)}</span>
                </div>
                <h3 className="font-bold">{service.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                  <Clock className="w-3 h-3" /> {service.duration_minutes} min
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" /> Volver a servicios
          </button>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Elegí la fecha</h3>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array(21).fill(0).map((_, i) => {
                  const date = addDays(startOfToday(), i + 1);
                  const isSelected = isSameDay(date, selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all",
                        isSelected ? "bg-gold-600 text-black font-bold scale-105" : "bg-white/5 border border-white/5 hover:border-gold-500/30"
                      )}
                    >
                      <span className="text-[10px] uppercase opacity-60">{format(date, "EEE", { locale: es })}</span>
                      <span className="text-lg">{format(date, "d")}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold-500" /> Horarios
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.length > 0 ? availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => { setSelectedTime(time); setStep(3); }}
                    className={cn(
                      "py-3 rounded-xl border text-sm font-medium transition-all",
                      selectedTime === time ? "bg-gold-600 border-gold-500 text-black font-bold scale-105" : "bg-white/5 border-white/10 hover:border-gold-500/50"
                    )}
                  >
                    {time}
                  </button>
                )) : (
                  <div className="col-span-3 py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    No hay horarios disponibles.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Client */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" /> Volver a horarios
          </button>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">¿Quién es el cliente?</h2>

            <div className="flex gap-3">
              <button
                onClick={() => { setIsNewClient(false); setSelectedClient(null); }}
                className={cn("px-5 py-2.5 rounded-xl font-bold text-sm transition-all", !isNewClient ? "bg-gold-600 text-black" : "bg-white/5 border border-white/10 text-gray-400")}
              >
                Cliente Existente
              </button>
              <button
                onClick={() => { setIsNewClient(true); setSelectedClient(null); }}
                className={cn("px-5 py-2.5 rounded-xl font-bold text-sm transition-all", isNewClient ? "bg-gold-600 text-black" : "bg-white/5 border border-white/10 text-gray-400")}
              >
                Nuevo Cliente
              </button>
            </div>

            {!isNewClient ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all",
                        selectedClient?.id === client.id
                          ? "bg-gold-600/10 border-gold-500/50"
                          : "bg-white/5 border-white/5 hover:border-gold-500/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold">{client.first_name} {client.last_name}</div>
                          <div className="text-xs text-gray-400">{client.email}</div>
                        </div>
                        {selectedClient?.id === client.id && <Check className="w-5 h-5 text-gold-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Nombre</label>
                    <input required type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500" placeholder="Ej: Ana" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Apellido</label>
                    <input required type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500" placeholder="Ej: García" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Email</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500" placeholder="ana@email.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Teléfono</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500" placeholder="+54 9 11 1234 5678" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Notas (Opcional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500 resize-none" placeholder="Notas internas..." />
            </div>

            {/* Summary */}
            <div className="bg-white/5 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-gold-500 text-sm uppercase tracking-widest">Resumen</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Servicio:</span> {selectedService?.name}</p>
                <p><span className="text-gray-500">Fecha:</span> {format(selectedDate, "eeee d 'de' MMMM", { locale: es })}</p>
                <p><span className="text-gray-500">Hora:</span> {selectedTime} hs</p>
                <p><span className="text-gray-500">Cliente:</span> {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : isNewClient ? `${formData.firstName} ${formData.lastName}` : "—"}</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!selectedClient && !isNewClient) || (isNewClient && (!formData.firstName || !formData.lastName || !formData.email || !formData.phone))}
              className="w-full py-4 bg-gold-600 text-black font-bold rounded-xl hover:bg-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {isSubmitting ? "Creando..." : "Crear Turno"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
