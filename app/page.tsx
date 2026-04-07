"use client"
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://enttjeibmwmridctxifn.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudHRqZWlibXdtcmlkY3R4aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjI4OTksImV4cCI6MjA4OTMzODg5OX0.uv33QIm1GGtnhI0oZ_NwNQyRlE4-m0fXbqddJY0iXhQ'
);

export default function ClienteForm() {
  const [form, setForm] = useState({ 
    cliente: '', perro: '', servicio: '', tamano: 'pequeño', dia: '', horario: '', whatsapp: '' 
  });
  
  const [listaPrecios, setListaPrecios] = useState<any[]>([]);
  const [serviciosUnicos, setServiciosUnicos] = useState<string[]>([]);
  const [precioActual, setPrecioActual] = useState(0);
  const [horasBase, setHorasBase] = useState<any[]>([]); 
  const [horasFiltradas, setHorasFiltradas] = useState<any[]>([]); 
  const [diasActivos, setDiasActivos] = useState<any[]>([]);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: p } = await supabase.from('configuracion_precios').select('*');
      if (p && p.length > 0) {
        setListaPrecios(p);
        const servicios = Array.from(new Set(p.map(item => item.servicio)));
        setServiciosUnicos(servicios);
        setForm(prev => ({ ...prev, servicio: servicios[0] }));
      }
      const { data: h } = await supabase.from('horarios_disponibles').select('*').eq('activo', true).order('hora');
      if (h) setHorasBase(h);
      const { data: d } = await supabase.from('dias_disponibles').select('*').eq('activo', true);
      if (d) setDiasActivos(d);
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!form.dia || !horasBase.length) {
      setHorasFiltradas([]);
      return;
    }
    const fecha = new Date(form.dia + 'T00:00:00');
    const n = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    const nombreDiaSeleccionado = n.charAt(0).toUpperCase() + n.slice(1);
    const configDia = diasActivos.find(da => da.dia_nombre === nombreDiaSeleccionado);
    const filtradas = horasBase.filter(h => {
      const horaNum = parseInt(h.hora.split(':')[0]); 
      if (horaNum < 12 && configDia?.manana_activo === false) return false;
      if (horaNum >= 14 && configDia?.tarde_activo === false) return false;
      return true;
    });
    setHorasFiltradas(filtradas);
    setForm(prev => ({ ...prev, horario: '' })); 
  }, [form.dia, horasBase, diasActivos]);

  useEffect(() => {
    const encontrado = listaPrecios.find(p => p.servicio === form.servicio && p.tamano === form.tamano);
    if (encontrado) setPrecioActual(encontrado.precio);
  }, [form.servicio, form.tamano, listaPrecios]);

  const enviarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.horario) {
        alert("Por favor selecciona una hora");
        return;
    }

    const { error } = await supabase.from('citas').insert([{ 
      cliente_nombre: form.cliente, 
      perro_nombre: form.perro, 
      servicio: form.servicio, 
      tamano: form.tamano, 
      dia: form.dia, 
      horario: form.horario, 
      whatsapp: form.whatsapp.replace(/\D/g, ''), 
      precio: precioActual,
      estado: 'pendiente'
    }]);

    if (!error) {
      const telefonoNegocio = "18096485156"; 
      const texto = `¡Hola! Acabo de agendar una cita:
🐶 *Perro:* ${form.perro}
👤 *Dueño:* ${form.cliente}
✂️ *Servicio:* ${form.servicio} (${form.tamano})
📅 *Fecha:* ${form.dia}
⏰ *Hora:* ${form.horario}
💰 *Total Estimado:* $${precioActual}
¿Me podrían confirmar?`;
      
      const url = `https://api.whatsapp.com/send?phone=${telefonoNegocio}&text=${encodeURIComponent(texto)}`;
      
     
      setEnviado(true);
    } else {
      alert("Error: " + error.message);
    }
  };

  if (enviado) {
    const telefonoNegocio = "18096485156";
    const textoWhatsApp = `¡Hola! Acabo de agendar una cita:
🐶 *Perro:* ${form.perro}
👤 *Dueño:* ${form.cliente}
✂️ *Servicio:* ${form.servicio} (${form.tamano})
📅 *Fecha:* ${form.dia}
⏰ *Hora:* ${form.horario}
💰 *Total Estimado:* $${precioActual}
¿Me podrían confirmar?`;

    const urlWhatsApp = `https://wa.me/${telefonoNegocio}?text=${encodeURIComponent(textoWhatsApp)}`;

    return (
      <div className="p-10 max-w-md mx-auto bg-white shadow-2xl rounded-3xl mt-20 border text-center animate-in fade-in zoom-in duration-500">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-black text-black mb-2">¡Cita Registrada!</h2>
        <p className="text-gray-600 mb-6 text-sm">
            Gracias <b>{form.cliente}</b>. Hemos recibido los datos de <b>{form.perro}</b>.
            <br/><br/>
            Haz clic en el botón de abajo para confirmar tu cita por WhatsApp. ¡Nos vemos pronto!
        </p>

        {/* ESTE BOTÓN ES LA SOLUCIÓN PARA MÓVILES */}
        <a 
          href={urlWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
        >
          <span>Confirmar por WhatsApp</span>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.938 3.659 1.435 5.624 1.436h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

        <div className="p-4 bg-green-50 rounded-2xl text-green-700 text-xs font-bold">
            Tu solicitud está en camino 🐾
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-xl rounded-3xl mt-10 border">
      <h1 className="text-2xl font-black text-blue-600 mb-6 text-center tracking-tight">RESERVA TU CITA 🐾</h1>
      <form onSubmit={enviarCita} className="space-y-4">
        
        {/* INPUTS CON COLORES CORREGIDOS */}
        <input 
          className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 transition-all bg-white text-black opacity-100 placeholder:text-gray-400" 
          placeholder="Tu Nombre" 
          onChange={e => setForm({...form, cliente: e.target.value})} 
          required 
        />
        
        <input 
          className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 transition-all bg-white text-black opacity-100 placeholder:text-gray-400" 
          placeholder="Nombre del Perrito" 
          onChange={e => setForm({...form, perro: e.target.value})} 
          required 
        />
        
        <div className="grid grid-cols-2 gap-2">
          <select 
            className="border-2 p-3 rounded-xl bg-white text-black opacity-100 capitalize outline-none" 
            value={form.servicio} 
            onChange={e => setForm({...form, servicio: e.target.value})} 
            required
          >
            {serviciosUnicos.map(srv => <option key={srv} value={srv} className="text-black">{srv}</option>)}
          </select>

          <select 
            className="border-2 p-3 rounded-xl bg-white text-black opacity-100 outline-none" 
            onChange={e => setForm({...form, tamano: e.target.value})} 
            required
          >
            <option value="pequeño" className="text-black">Pequeño</option>
            <option value="grande" className="text-black">Grande</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select 
            className="border-2 p-3 rounded-xl bg-white text-black opacity-100 text-sm outline-none" 
            onChange={e => setForm({...form, dia: e.target.value})} 
            required
          >
            <option value="" className="text-black">Selecciona Día</option>
            {Array.from({length: 14}).map((_, i) => {
              const f = new Date(); f.setDate(f.getDate() + i);
              const n = f.toLocaleDateString('es-ES', { weekday: 'long' });
              const nombre = n.charAt(0).toUpperCase() + n.slice(1);
              if (diasActivos.some(da => da.dia_nombre === nombre)) {
                return <option key={i} value={f.toISOString().split('T')[0]} className="text-black">{nombre} {f.getDate()}</option>;
              }
            })}
          </select>

          <select 
            className="border-2 p-3 rounded-xl bg-white text-black opacity-100 text-sm outline-none disabled:bg-gray-50" 
            value={form.horario} 
            onChange={e => setForm({...form, horario: e.target.value})} 
            required 
            disabled={!form.dia}
          >
            <option value="" className="text-black">{form.dia ? 'Selecciona Hora' : 'Elige un día primero'}</option>
            {horasFiltradas.map(h => <option key={h.id} value={h.hora} className="text-black">{h.hora}</option>)}
          </select>
        </div>

        <input 
          className="w-full border-2 p-3 rounded-xl outline-none bg-white text-black opacity-100 placeholder:text-gray-400" 
          placeholder="Tu WhatsApp" 
          type="tel" 
          onChange={e => setForm({...form, whatsapp: e.target.value})} 
          required 
        />
        
        <div className="bg-blue-600 p-5 rounded-2xl text-center text-white shadow-lg">
          <p className="text-xs font-bold opacity-80 uppercase tracking-widest text-white">Total Estimado</p>
          <p className="text-4xl font-black text-white">${precioActual}</p>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
            CONFIRMAR CITA AHORA
        </button>

        {/* --- EL AVISO DE PRECIOS --- */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 mt-4">
          <span className="text-amber-500 text-lg">⚠️</span>
          <p className="text-[11px] text-amber-900 leading-tight font-bold">
            <b>Aviso importante:</b> Los precios son estimados. El monto final puede variar según el estado real del pelaje y el servicio que el perrito necesite al ser evaluado.
          </p>
        </div>
      </form>
    </div>
  );
}