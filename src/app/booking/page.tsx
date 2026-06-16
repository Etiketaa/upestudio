"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, isSameDay, startOfToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import { processBookingAction } from "@/app/actions";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, User, CheckCircle2, Star } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  price: number;
};

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  // State
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(startOfToday(), 1));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showTrialOption, setShowTrialOption] = useState(false);
  const [needsTrial, setNeedsTrial] = useState(false);
  const [trialDate, setTrialDate] = useState<Date | null>(null);
  const [trialTime, setTrialTime] = useState<string | null>(null);
  const [trialSlots, setTrialSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  // Fetch services
  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (data) setServices(data);
      setLoading(false);
    }
    fetchServices();
  }, []);

  // Update showTrialOption when service changes
  useEffect(() => {
    if (selectedService?.name === "Maquillaje Social") {
      setShowTrialOption(true);
    } else {
      setShowTrialOption(false);
      setNeedsTrial(false);
    }
  }, [selectedService]);

  // Calculate available slots when date or service changes
  useEffect(() => {
    if (selectedService && selectedDate) {
      generateSlots(selectedDate, setAvailableSlots);
    }
  }, [selectedService, selectedDate]);

  useEffect(() => {
    if (needsTrial && trialDate) {
      generateSlots(trialDate, setTrialSlots);
    }
  }, [needsTrial, trialDate]);

  const generateSlots = async (date: Date, setter: (slots: string[]) => void) => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, "yyyy-MM-dd");

    // Check for blocks
    const { data: blocks } = await supabase
      .from("blocks")
      .select("*")
      .eq("date", dateStr);

    if (blocks && blocks.length > 0) {
      setter([]);
      return;
    }

    // Get schedule
    const { data: schedule } = await supabase
      .from("schedules")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    if (!schedule) {
      setter([]);
      return;
    }

    // Generate intervals (every 60 mins for simplicity)
    const slots: string[] = [];
    let current = schedule.start_time;
    const end = schedule.end_time;

    while (current < end) {
      slots.push(current.slice(0, 5));
      const [h, m] = current.split(":").map(Number);
      const nextH = h + Math.floor((m + 60) / 60);
      const nextM = (m + 60) % 60;
      current = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}:00`;
    }

    setter(slots);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Create/Update Client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .upsert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        }, { onConflict: "email" })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Create Appointment
      const { error: appError } = await supabase
        .from("appointments")
        .insert({
          client_id: clientData.id,
          service_id: selectedService?.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          notes: formData.notes,
        });

      if (appError) throw appError;

      // 2b. Create Trial Appointment if needed
      if (needsTrial && trialDate && trialTime) {
        await supabase
          .from("appointments")
          .insert({
            client_id: clientData.id,
            service_id: selectedService?.id,
            date: format(trialDate, "yyyy-MM-dd"),
            time: trialTime,
            notes: "ENSAYO / PRUEBA - " + formData.notes,
          });
      }

      // 3. Prepare WhatsApp Message
      const message = `¡Hola! Soy *${formData.firstName} ${formData.lastName}*. 
Quisiera confirmar mi turno para:
✨ *Servicio:* ${selectedService?.name}
📅 *Fecha:* ${format(selectedDate, "eeee d 'de' MMMM", { locale: es })}
⏰ *Hora:* ${selectedTime} hs
${needsTrial ? `🧪 *Ensayo:* ${format(trialDate!, "d/MM")} a las ${trialTime} hs` : ""}
${formData.notes ? `📝 *Notas:* ${formData.notes}` : ""}
📱 *Teléfono:* ${formData.phone}

_Enviado desde el sistema de reservas de UP! Estudio_`;

      const encodedMessage = encodeURIComponent(message);
      const phone = "5492915784649"; 
      const url = `https://wa.me/${phone}?text=${encodedMessage}`;
      setWhatsappUrl(url);

      // 4. Send Email via Server Action
      await processBookingAction({
        email: formData.email,
        name: formData.firstName,
        date: format(selectedDate, "eeee d 'de' MMMM", { locale: es }),
        time: selectedTime!,
        service: selectedService?.name || "Servicio",
      });

      setSuccess(true);
      
      // Auto redirect to WhatsApp after a short delay
      // Usamos window.location.href para evitar bloqueadores de popups y mejorar experiencia en móvil
      setTimeout(() => {
        window.location.href = url;
      }, 1500);
    } catch (error) {
      console.error("Error booking:", error);
      alert("Hubo un error al procesar tu reserva. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="w-20 h-20 text-gold-500 mx-auto" />
          <h1 className="text-4xl font-bold tracking-tighter">¡Reserva Registrada!</h1>
          <p className="text-gray-400">
            Hemos guardado tu turno correctamente. Para finalizar la confirmación, por favor enviá los detalles a nuestro WhatsApp.
          </p>
          <div className="space-y-3">
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Enviar a WhatsApp
            </a>
            <button 
              onClick={() => router.push("/")}
              className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-gold-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            UP! <span className="text-gold-500">ESTUDIO</span>
          </Link>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-gray-500">
            <span className={cn(step >= 1 ? "text-gold-500 font-bold" : "")}>Servicio</span>
            <ChevronRight className="w-3 h-3" />
            <span className={cn(step >= 2 ? "text-gold-500 font-bold" : "")}>Fecha</span>
            <ChevronRight className="w-3 h-3" />
            <span className={cn(step >= 3 ? "text-gold-500 font-bold" : "")}>Datos</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Elegí tu servicio</h2>
              <p className="text-gray-400">Seleccioná el tratamiento que deseas realizarte.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                ))
              ) : (
                services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className={cn(
                      "text-left p-6 rounded-2xl border transition-all duration-300 group",
                      selectedService?.id === service.id
                        ? "bg-gold-600 border-gold-500 text-black"
                        : "bg-white/5 border-white/10 hover:border-gold-500/50 hover:bg-white/[0.08]"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold",
                        selectedService?.id === service.id ? "bg-black/20" : "bg-gold-500/20 text-gold-500"
                      )}>
                        {service.category}
                      </span>
                      <span className="font-bold">{formatCurrency(service.price)}</span>
                    </div>
                    <h3 className="text-xl font-bold group-hover:translate-x-1 transition-transform">{service.name}</h3>
                    <p className={cn(
                      "text-sm mt-1 line-clamp-2",
                      selectedService?.id === service.id ? "text-black/70" : "text-gray-400"
                    )}>
                      {service.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration_minutes} min
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a servicios
            </button>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">¿Cuándo venís?</h2>
                  <p className="text-gray-400">Seleccioná el día para tu cita.</p>
                </div>
                
                {/* Simplified Calendar - In real app use a full calendar component */}
                <div className="grid grid-cols-7 gap-2">
                  {Array(21).fill(0).map((_, i) => {
                    const date = addDays(startOfToday(), i + 1);
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all",
                          isSelected 
                            ? "bg-gold-600 text-black font-bold scale-105 shadow-lg shadow-gold-500/20" 
                            : "bg-white/5 border border-white/5 hover:border-gold-500/30"
                        )}
                      >
                        <span className="text-[10px] uppercase opacity-60">{format(date, "EEE", { locale: es })}</span>
                        <span className="text-lg">{format(date, "d")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold-500" />
                    Horarios disponibles
                  </h3>
                  <p className="text-sm text-gray-400">Para el {format(selectedDate, "eeee d 'de' MMMM", { locale: es })}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-medium transition-all",
                          selectedTime === time
                            ? "bg-gold-600 border-gold-500 text-black font-bold scale-105"
                            : "bg-white/5 border-white/10 hover:border-gold-500/50"
                        )}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      No hay horarios disponibles para este día.
                    </div>
                  )}
                </div>

                {selectedTime && showTrialOption && (
                  <div className="mt-8 p-6 bg-gold-600/10 border border-gold-500/20 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gold-500">¿Deseas sumar un Ensayo/Prueba?</div>
                      <button 
                        type="button"
                        onClick={() => setNeedsTrial(!needsTrial)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          needsTrial ? "bg-gold-500" : "bg-white/10"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-black rounded-full transition-all",
                          needsTrial ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                    {needsTrial && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs text-gray-400">Seleccioná la fecha y hora para tu ensayo previo.</p>
                        <div className="grid grid-cols-7 gap-1">
                          {Array(14).fill(0).map((_, i) => {
                            const date = addDays(startOfToday(), i + 1);
                            const isSelected = trialDate && isSameDay(date, trialDate);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setTrialDate(date)}
                                className={cn(
                                  "aspect-square flex items-center justify-center rounded-lg text-[10px] transition-all",
                                  isSelected ? "bg-gold-500 text-black font-bold" : "bg-white/5 border border-white/5"
                                )}
                              >
                                {format(date, "d")}
                              </button>
                            );
                          })}
                        </div>
                        {trialDate && (
                          <div className="grid grid-cols-4 gap-2">
                            {trialSlots.map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setTrialTime(t)}
                                className={cn(
                                  "py-1.5 rounded-lg border text-[10px] transition-all",
                                  trialTime === t ? "bg-gold-500 border-gold-500 text-black font-bold" : "bg-white/5 border-white/10"
                                )}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedTime && (!needsTrial || (trialDate && trialTime)) && (
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gold-500 transition-all flex items-center justify-center gap-2 mt-8"
                  >
                    Siguiente paso
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 3 && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <button 
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a horarios
            </button>

            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tus datos</h2>
                <p className="text-gray-400">Completá la información para confirmar la reserva.</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Nombre</label>
                    <input
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors"
                      placeholder="Ej: Ana"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Apellido</label>
                    <input
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors"
                      placeholder="Ej: García"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="ana.garcia@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">WhatsApp / Teléfono</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="Ej: +54 9 11 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Notas (Opcional)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors resize-none"
                    placeholder="Contanos algo extra..."
                  />
                </div>

                <div className="pt-6 border-t border-white/5 mt-8 space-y-6">
                  <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-lg">Resumen del turno</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Star className="w-4 h-4 text-gold-500" />
                        <span>{selectedService?.name}</span>
                        <span className="ml-auto font-bold">{formatCurrency(selectedService?.price || 0)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarIcon className="w-4 h-4 text-gold-500" />
                        <span>{format(selectedDate, "eeee d 'de' MMMM", { locale: es })} a las {selectedTime} hs</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-gold-500" />
                        <span>Duración: {selectedService?.duration_minutes} min</span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-4 bg-gold-600 text-black font-bold rounded-xl hover:bg-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-xl shadow-gold-500/20"
                  >
                    {isSubmitting ? "Procesando..." : "Confirmar Reserva"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gold-500 font-bold tracking-widest animate-pulse">CARGANDO...</div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
