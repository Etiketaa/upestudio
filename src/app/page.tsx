import Link from "next/link";
import { ChevronRight, MessageCircle, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-gold-500 selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            UP! <span className="text-gold-500">ESTUDIO</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium">
            <Link href="#servicios" className="hover:text-gold-400 transition-colors">Servicios</Link>
            <Link href="#sobre-mi" className="hover:text-gold-400 transition-colors">Sobre Mí</Link>
            <Link href="/booking" className="px-6 py-2 bg-gold-600 text-black hover:bg-gold-500 transition-all rounded-full font-bold">
              Reservar
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
          <div className="absolute right-0 top-0 w-1/2 h-full bg-[url('https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-50" />
          
          <div className="container mx-auto px-6 relative z-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px w-12 bg-gold-500" />
                <span className="text-gold-500 uppercase tracking-[0.3em] text-sm font-semibold">Up! Estudio</span>
              </div>
              <h1 className="text-7xl md:text-8xl font-bold leading-none mb-8 tracking-tighter">
                Tu mejor <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-700">Versión</span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-lg">
                Servicios de belleza premium diseñados para realzar tu estilo. 
                Especialistas en maquillaje social y estética de uñas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/booking" className="px-10 py-4 bg-gold-600 text-black hover:bg-gold-500 transition-all rounded-full font-bold text-center group flex items-center justify-center gap-2">
                  Reservar Turno
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="https://wa.me/5491123456789" target="_blank" className="px-10 py-4 border border-white/20 hover:border-gold-500 transition-all rounded-full font-bold text-center flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5 text-gold-500" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-6 z-20 hidden lg:flex gap-12">
            <div>
              <div className="text-3xl font-bold text-gold-500">+5</div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Años de Exp.</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gold-500">100%</div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Personalizado</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gold-500">⭐</div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Premium</div>
            </div>
          </div>
        </section>

        {/* Services Categories */}
        <section id="servicios" className="py-32 bg-zinc-950">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-gold-500 uppercase tracking-widest text-sm font-semibold">Lo que hago</span>
              <h2 className="text-5xl font-bold mt-4">Nuestros Servicios</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Category: Maquillaje */}
              <div className="group relative h-[500px] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-x-0 bottom-0 p-10 z-20 bg-gradient-to-t from-black via-black/60 to-transparent">
                  <h3 className="text-4xl font-bold mb-4">Maquillaje</h3>
                  <p className="text-gray-300 mb-6 max-w-sm">Social, Novias y Eventos. Realzamos tu belleza natural con productos de alta gama.</p>
                  <Link href="/booking?category=Maquillaje" className="text-gold-500 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                    Ver Disponibilidad <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Category: Nails */}
              <div className="group relative h-[500px] overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-x-0 bottom-0 p-10 z-20 bg-gradient-to-t from-black via-black/60 to-transparent">
                  <h3 className="text-4xl font-bold mb-4">Nails</h3>
                  <p className="text-gray-300 mb-6 max-w-sm">Semipermanente, Soft Gel, Poligel. Cuidado y diseño para tus manos.</p>
                  <Link href="/booking?category=Nails" className="text-gold-500 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                    Ver Disponibilidad <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gold-600/10 z-0" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-6xl font-bold mb-8">¿Lista para tu próxima cita?</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Elegí el servicio, el día y el horario que mejor te quede. Reservá en segundos y recibí confirmación por email.
            </p>
            <Link href="/booking" className="px-12 py-6 bg-white text-black hover:bg-gold-500 transition-all rounded-full font-bold text-xl inline-block">
              Reservar Ahora
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/10 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-bold">UP! ESTUDIO</div>
          <div className="flex gap-8 text-gray-500 text-sm uppercase tracking-widest">
            <a href="#" className="hover:text-gold-500 transition-colors">Instagram</a>
            <a href="#" className="hover:text-gold-500 transition-colors">WhatsApp</a>
          </div>
          <div className="text-gray-600 text-xs">
            © 2024 UP! ESTUDIO. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5491123456789"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 p-4 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/30 hover:scale-110 active:scale-95 transition-all group"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
          ¿Tenés alguna duda?
        </span>
      </a>
    </div>
  );
}
