"use client";

import { useState, useEffect } from "react";
import { createTicket, getTickets, updateTicketStatus, deleteTicket } from "@/app/actions";
import { 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ConfirmModal } from "@/components/confirm-modal";

type Ticket = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "done";
  created_at: string;
};

const PRIORITIES = {
  low: { label: "Baja", color: "text-gray-400", bg: "bg-gray-500/10" },
  medium: { label: "Media", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  high: { label: "Alta", color: "text-red-500", bg: "bg-red-500/10" },
};

const STATUSES = {
  open: { label: "Abierto", icon: AlertCircle, color: "text-blue-500" },
  in_progress: { label: "En progreso", icon: Clock, color: "text-yellow-500" },
  done: { label: "Resuelto", icon: CheckCircle2, color: "text-green-500" },
};

export default function TicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "medium" as const });

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const { success, tickets } = await getTickets();
    if (success && tickets) setTickets(tickets);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTicket.title.trim()) return;
    const { success } = await createTicket(newTicket);
    if (success) {
      toast("Ticket creado", "success");
      setIsModalOpen(false);
      setNewTicket({ title: "", description: "", priority: "medium" });
      fetchTickets();
    } else {
      toast("Error al crear ticket", "error");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    const { success } = await updateTicketStatus(id, status);
    if (success) {
      toast("Estado actualizado", "success");
      fetchTickets();
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { success } = await deleteTicket(deleteId);
    if (success) {
      toast("Ticket eliminado", "success");
      setDeleteId(null);
      fetchTickets();
    }
  }

  const filtered = filterStatus === "all" 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pedidos / Tickets</h1>
          <p className="text-gray-400 text-sm">Creá mejoras y reportá problemas del sistema.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gold-600 text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gold-500 transition-all text-sm self-start"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            filterStatus === "all" ? "bg-gold-600 text-black" : "bg-white/5 text-gray-400"
          )}
        >
          Todos ({tickets.length})
        </button>
        {Object.entries(STATUSES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filterStatus === key ? "bg-gold-600 text-black" : "bg-white/5 text-gray-400"
            )}
          >
            {label} ({tickets.filter(t => t.status === key).length})
          </button>
        ))}
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((ticket) => {
            const StatusIcon = STATUSES[ticket.status].icon;
            return (
              <div key={ticket.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className={cn("w-4 h-4 shrink-0", STATUSES[ticket.status].color)} />
                      <h3 className="font-bold text-sm truncate">{ticket.title}</h3>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0", PRIORITIES[ticket.priority].bg, PRIORITIES[ticket.priority].color)}>
                        {PRIORITIES[ticket.priority].label}
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 ml-6">{ticket.description}</p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-2 ml-6">
                      {new Date(ticket.created_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs focus:border-gold-500"
                    >
                      <option value="open">Abierto</option>
                      <option value="in_progress">En progreso</option>
                      <option value="done">Resuelto</option>
                    </select>
                    <button
                      onClick={() => setDeleteId(ticket.id)}
                      className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
            No hay tickets{filterStatus !== "all" ? " con este filtro" : ""}.
          </div>
        )}
      </div>

      {/* Create modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">Nuevo Ticket</h2>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título del pedido"
                value={newTicket.title}
                onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold-500 outline-none"
              />
              <textarea
                rows={3}
                placeholder="Descripción (opcional)"
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold-500 outline-none resize-none"
              />
              <div className="flex gap-2">
                {Object.entries(PRIORITIES).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setNewTicket({...newTicket, priority: key as any})}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                      newTicket.priority === key ? "bg-gold-600 text-black" : "bg-white/5 text-gray-400"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 bg-white/5 text-gray-400 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTicket.title.trim()}
                className="flex-1 py-2.5 bg-gold-600 text-black rounded-xl font-bold text-sm hover:bg-gold-500 transition-all disabled:opacity-50"
              >
                Crear Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar ticket"
        message="¿Estás segura de que querés eliminar este ticket?"
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
