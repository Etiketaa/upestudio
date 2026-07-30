"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Smartphone, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  CreditCard,
  Building2,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ConfirmModal } from "@/components/confirm-modal";

type BankAccount = {
  id: string;
  bank_name: string;
  account_holder: string;
  cvu: string;
  alias: string | null;
  is_active: boolean;
  created_at: string;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [current, setCurrent] = useState<Partial<BankAccount>>({
    bank_name: "",
    account_holder: "",
    cvu: "",
    alias: "",
    is_active: true,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    const { data } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAccounts(data);
    setLoading(false);
  }

  async function handleSave() {
    try {
      if (current.id) {
        const { error } = await supabase
          .from("bank_accounts")
          .update({
            bank_name: current.bank_name,
            account_holder: current.account_holder,
            cvu: current.cvu,
            alias: current.alias || null,
            is_active: current.is_active,
          })
          .eq("id", current.id);
        if (error) throw error;
        toast("Cuenta bancaria actualizada", "success");
      } else {
        const { error } = await supabase
          .from("bank_accounts")
          .insert([{
            bank_name: current.bank_name,
            account_holder: current.account_holder,
            cvu: current.cvu,
            alias: current.alias || null,
            is_active: current.is_active,
          }]);
        if (error) throw error;
        toast("Cuenta bancaria creada", "success");
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error("Error saving bank account:", error);
      toast("Error al guardar la cuenta bancaria", "error");
    }
  }

  async function deleteAccount(id: string) {
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (!error) {
      fetchAccounts();
      toast("Cuenta bancaria eliminada", "success");
    } else {
      toast("Error al eliminar", "error");
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("bank_accounts")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (!error) {
      fetchAccounts();
      toast(`Cuenta ${!currentStatus ? "activada" : "desactivada"}`, "success");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast("Copiado al portapapeles", "info");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-gray-400 text-sm mt-1">Gestioná las preferencias de tu estudio y de la plataforma.</p>
      </div>

      {/* General Settings */}
      <div className="grid gap-6 max-w-2xl">
        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-6">
          <div className="h-12 w-12 bg-gold-600/10 text-gold-500 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">WhatsApp de Recepción</h3>
            <p className="text-sm text-gray-400">El número al que llegan las notificaciones de los clientes.</p>
            <div className="mt-2 text-gold-500 font-mono">+54 9 291 5784649</div>
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-6 opacity-50">
          <div className="h-12 w-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Notificaciones Email</h3>
            <p className="text-sm text-gray-400">Configurá los avisos automáticos por correo.</p>
          </div>
          <span className="text-[10px] uppercase bg-white/10 px-2 py-1 rounded font-bold">Próximamente</span>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gold-600/10 text-gold-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cuentas Bancarias</h2>
              <p className="text-sm text-gray-400">Datos para cobrar la seña del 50%.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setCurrent({ bank_name: "", account_holder: "", cvu: "", alias: "", is_active: true });
              setIsModalOpen(true);
            }}
            className="bg-gold-600 text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gold-500 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Cuenta
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {loading ? (
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
            ))
          ) : accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4 hover:border-gold-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gold-600/10 text-gold-500 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold">{acc.bank_name}</div>
                      <div className="text-xs text-gray-400">{acc.account_holder}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(acc.id, acc.is_active)}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      acc.is_active ? "bg-gold-600" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                      acc.is_active ? "left-5.5" : "left-0.5"
                    )} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">CVU</div>
                      <div className="text-sm font-mono text-gold-500">{acc.cvu}</div>
                    </div>
                    <button onClick={() => copyToClipboard(acc.cvu)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                  {acc.alias && (
                    <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Alias</div>
                        <div className="text-sm font-mono text-gold-500">{acc.alias}</div>
                      </div>
                      <button onClick={() => copyToClipboard(acc.alias!)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setCurrent(acc); setIsModalOpen(true); }}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteId(acc.id)}
                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
              No hay cuentas bancarias configuradas. Agregá una para que los clientes puedan abonar la seña.
            </div>
          )}
        </div>
      </div>

      {/* Modal / Sidepanel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{current.id ? "Editar" : "Nueva"} Cuenta Bancaria</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Banco</label>
                <input
                  type="text"
                  value={current.bank_name}
                  onChange={(e) => setCurrent({...current, bank_name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-gold-500 outline-none"
                  placeholder="Ej: Mercado Pago"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Titular</label>
                <input
                  type="text"
                  value={current.account_holder}
                  onChange={(e) => setCurrent({...current, account_holder: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-gold-500 outline-none"
                  placeholder="Nombre como aparece en la cuenta"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">CVU / CBU</label>
                <input
                  type="text"
                  value={current.cvu}
                  onChange={(e) => setCurrent({...current, cvu: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-gold-500 outline-none font-mono"
                  placeholder="0000000000000000000000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Alias (Opcional)</label>
                <input
                  type="text"
                  value={current.alias || ""}
                  onChange={(e) => setCurrent({...current, alias: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-gold-500 outline-none font-mono"
                  placeholder="Ej: UP.ESTUDIO.MP"
                />
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSave}
                  disabled={!current.bank_name || !current.account_holder || !current.cvu}
                  className="w-full py-4 bg-gold-600 text-black font-bold rounded-xl hover:bg-gold-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  Guardar Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteAccount(deleteId); }}
        title="Eliminar cuenta bancaria"
        message="¿Estás segura de que querés eliminar esta cuenta bancaria? Los clientes no podrán verla para abonar la seña."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
