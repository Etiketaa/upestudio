"use client";

import { Settings as SettingsIcon, Bell, Shield, Smartphone } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Configuración</h1>
        <p className="text-gray-400 mt-1">Gestioná las preferencias de tu estudio y de la plataforma.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-6">
          <div className="h-12 w-12 bg-gold-600/10 text-gold-500 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">WhatsApp de Recepción</h3>
            <p className="text-sm text-gray-400">El número al que llegan las notificaciones de los clientes.</p>
            <div className="mt-2 text-gold-500 font-mono">+54 291 5784649</div>
          </div>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all">
            Cambiar
          </button>
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

        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-6 opacity-50">
          <div className="h-12 w-12 bg-purple-600/10 text-purple-500 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Seguridad y RLS</h3>
            <p className="text-sm text-gray-400">Gestioná los permisos de acceso a la base de datos.</p>
          </div>
          <span className="text-[10px] uppercase bg-white/10 px-2 py-1 rounded font-bold">Admin Only</span>
        </div>
      </div>
      
      <div className="p-6 bg-gold-600/5 border border-gold-600/10 rounded-2xl max-w-2xl">
        <h3 className="font-bold text-gold-500 mb-2 uppercase tracking-widest text-xs flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          Nota de Desarrollo
        </h3>
        <p className="text-sm text-gray-400">
          Esta sección está siendo construida. Por ahora, las variables críticas como el número de WhatsApp se gestionan directamente desde el código fuente o variables de entorno.
        </p>
      </div>
    </div>
  );
}
