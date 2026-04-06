"use client"
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://enttjeibmwmridctxifn.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudHRqZWlibXdtcmlkY3R4aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjI4OTksImV4cCI6MjA4OTMzODg5OX0.uv33QIm1GGtnhI0oZ_NwNQyRlE4-m0fXbqddJY0iXhQ'
);

export default function AdminPanel() {
  const [precios, setPrecios] = useState<any[]>([]);
  const [dias, setDias] = useState<any[]>([]);
  const [horas, setHoras] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);

  // --- NUEVOS ESTADOS PARA FILTROS ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => { 
    cargarTodo(); 
  }, []);

  async function cargarTodo() {
    const { data: p } = await supabase.from('configuracion_precios').select('*').order('id');
    const { data: d } = await supabase.from('dias_disponibles').select('*').order('id');
    const { data: h } = await supabase.from('horarios_disponibles').select('*').order('hora');
    const { data: c } = await supabase.from('citas').select('*').order('created_at', { ascending: false });
    
    if (p) setPrecios(p);
    if (d) setDias(d);
    if (h) setHoras(h);
    if (c) setCitas(c || []);
  }

  // --- LÓGICA DE FILTRADO EN TIEMPO REAL ---
  const citasFiltradas = citas.filter(cita => {
    const texto = busqueda.toLowerCase();
    const coincideNombre = 
      cita.perro_nombre?.toLowerCase().includes(texto) || 
      cita.cliente_nombre?.toLowerCase().includes(texto);
    
    const coincideEstado = 
      filtroEstado === "todas" || cita.estado === filtroEstado;

    return coincideNombre && coincideEstado;
  });

  const toggleDia = async (id: number, actual: boolean) => {
    await supabase.from('dias_disponibles').update({ activo: !actual }).eq('id', id);
    cargarTodo();
  };

  const toggleEstadoGeneral = async (tabla: string, id: number, actual: boolean) => {
    await supabase.from(tabla).update({ activo: !actual }).eq('id', id);
    cargarTodo();
  };

  async function cambiarEstado(id: string, nuevoEstado: string) {
    const { error } = await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', id);
    if (!error) cargarTodo();
  }

  async function eliminarCita(id: string) {
    if (confirm("¿Seguro que quieres eliminar esta cita permanentemente?")) {
      const { error } = await supabase.from('citas').delete().eq('id', id);
      if (!error) cargarTodo();
    }
  }

  const actualizarPrecio = async (id: number, nuevo: string) => {
    await supabase.from('configuracion_precios').update({ precio: parseFloat(nuevo) }).eq('id', id);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-900">
      <h1 className="text-3xl font-black mb-8 text-gray-800">🐾Dashboard🐾</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* CONFIGURAR PRECIOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold mb-4 text-blue-600 flex items-center gap-2">💰 Precios</h2>
          {precios.map(p => (
            <div key={p.id} className="flex justify-between items-center mb-2">
              <span className="text-sm capitalize">{p.servicio} ({p.tamano})</span>
              <input type="number" defaultValue={p.precio} onBlur={(e) => actualizarPrecio(p.id, e.target.value)}
                className="w-20 border rounded p-1 text-right text-sm font-bold text-blue-700 outline-none"/>
            </div>
          ))}
        </div>

        {/* CONFIGURAR DÍAS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold mb-4 text-green-600">📅 Activar o Bloquear Días</h2>
          <div className="flex flex-col gap-2">
            {dias.map(d => (
              <button 
                key={d.id} 
                onClick={() => toggleDia(d.id, d.activo)}
                className={`w-full p-4 rounded-xl font-black text-sm flex justify-between items-center transition-all ${
                  d.activo 
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' 
                  : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                }`}
              >
                <span className="uppercase tracking-wider">{d.dia_nombre}</span>
                <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md">
                   {d.activo ? 'ACTIVADO' : 'BLOQUEADO'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* CONFIGURAR HORARIOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold mb-4 text-purple-600">⏰ Horas Específicas</h2>
          <div className="grid grid-cols-4 gap-2">
            {horas.map(h => (
              <button key={h.id} onClick={() => toggleEstadoGeneral('horarios_disponibles', h.id, h.activo)}
                className={`p-1 rounded text-[10px] font-bold ${h.activo ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {h.hora}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE FILTROS Y BÚSQUEDA --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-1/3">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar perro o dueño..." 
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {['todas', 'pendiente', 'realizada', 'cancelada'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  filtroEstado === estado 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE CITAS REGISTRADAS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Listado de Citas</h2>
          <span className="bg-blue-100 text-blue-600 text-xs font-black px-3 py-1 rounded-full">
            {citasFiltradas.length} RESULTADOS
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-widest">
                <th className="px-4 py-2">Mascota / Dueño</th>
                <th className="px-4 py-2">Servicio</th>
                <th className="px-4 py-2">Fecha y Hora</th>
                <th className="px-4 py-2 text-center">Estado</th>
                <th className="px-4 py-2 text-center">Gestión</th>
                <th className="px-4 py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.map((c) => (
                <tr key={c.id} className={`${c.estado === 'cancelada' ? 'opacity-50' : ''} transition-opacity`}>
                  <td className="px-4 py-4 bg-gray-50 rounded-l-xl">
                    <div className="font-black text-gray-700">{c.cliente_nombre}</div>
                    <div className="text-xs text-blue-500 font-bold">🐶 {c.perro_nombre}</div>
                  </td>
                  <td className="px-4 py-4 bg-gray-50 capitalize text-sm font-medium">
                    {c.servicio} <span className="text-[10px] opacity-50">({c.tamano})</span>
                  </td>
                  <td className="px-4 py-4 bg-gray-50 text-sm">
                    <div className="font-bold">{c.dia}</div>
                    <div className="text-xs text-gray-400">{c.horario}</div>
                  </td>
                  <td className="px-4 py-4 bg-gray-50 text-center">
                    <select 
                      value={c.estado || 'pendiente'} 
                      onChange={(e) => cambiarEstado(c.id, e.target.value)}
                      className="text-[10px] font-black uppercase p-1.5 rounded-lg border-2 outline-none cursor-pointer"
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="realizada">✅ Realizada</option>
                      <option value="cancelada">❌ Cancelada</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 bg-gray-50 text-center">
                    <div className="flex gap-2 justify-center">
                        <a href={`https://wa.me/${c.whatsapp?.replace(/\D/g,'')}`} target="_blank" className="bg-green-500 text-white p-2 rounded-lg text-xs font-bold hover:scale-110 transition-transform">📱</a>
                        <button onClick={() => eliminarCita(c.id)} className="bg-red-500 text-white p-2 rounded-lg text-xs font-bold hover:scale-110 transition-transform">🗑️</button>
                    </div>
                  </td>
                  <td className="px-4 py-4 bg-gray-50 text-right rounded-r-xl font-black">${c.precio}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {citasFiltradas.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-medium italic">
              No se encontraron citas que coincidan con la búsqueda.
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}