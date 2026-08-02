"use server";

import { sendConfirmationEmail } from "@/lib/emails";

export async function processBookingAction({
  email,
  name,
  date,
  time,
  service
}: {
  email: string;
  name: string;
  date: string;
  time: string;
  service: string;
}) {
  return await sendConfirmationEmail({ email, name, date, time, service });
}

const PROJECT_CONTEXT = `
Sos el asistente virtual de UP! Estudio, un sistema de gestión de turnos para un estudio de estética y belleza.

FUNCIONALIDADES DEL SISTEMA:
- Landing page pública con servicios de Maquillaje y Nails
- Sistema de reservas online para clientes (página /booking)
- Panel de administración (/admin) con:

PÁGINAS DEL ADMIN:
- Dashboard (/admin): Resumen con estadísticas, próximos turnos, acciones rápidas
- Turnos (/admin/appointments): Lista de todos los turnos, filtros, exportar CSV, eliminar turnos
- Nuevo Turno Manual (/admin/appointments/new): Crear turnos para clientes existentes o nuevos
- Calendario (/admin/calendar): Vista mensual de turnos
- Disponibilidad (/admin/availability): Configurar horarios semanales (días activos, hora inicio/fin) y bloquear fechas
- Servicios (/admin/services): CRUD de servicios (nombre, categoría, duración, precio, activo/inactivo)
- Clientes (/admin/clients): Base de datos de clientes, editar, eliminar, exportar CSV
- Configuración (/admin/settings): WhatsApp de recepción, cuentas bancarias para cobrar señas

ACCIONES COMUNES:
- Para crear un turno manual: Ir a Turnos > Nuevo Turno (botón dorado)
- Para ver turnos: Ir a Turnos en el menú lateral
- Para configurar horarios: Ir a Disponibilidad, usar los toggles L M X J V S D
- Para agregar servicios: Ir a Servicios > Nuevo Servicio
- Para ver clientes: Ir a Clientes
- Para bloquear días: Ir a Disponibilidad > Bloqueos de Fecha

ESTILO: Responder en español, de forma breve y clara. Si no sabés la respuesta, decí que no estás seguro y sugerí contactar al desarrollador.
`;

export async function askAssistant(question: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "API key no configurada" };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: PROJECT_CONTEXT }] },
            { role: "model", parts: [{ text: "Entendido. Soy el asistente de UP! Estudio. Puedo ayudar con dudas sobre el sistema." }] },
            { role: "user", parts: [{ text: question }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return { success: true, answer: data.candidates[0].content.parts[0].text };
    }
    
    return { success: false, error: "No se pudo obtener respuesta" };
  } catch (error) {
    return { success: false, error: "Error al conectar con la IA" };
  }
}

export async function createTicket({ title, description, priority }: { title: string; description: string; priority: string }) {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("tickets")
    .insert({ title, description, priority, status: "open" })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, ticket: data };
}

export async function getTickets() {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, tickets: data };
}

export async function updateTicketStatus(id: string, status: string) {
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTicket(id: string) {
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
