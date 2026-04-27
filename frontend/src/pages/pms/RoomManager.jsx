import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Bed } from 'lucide-react';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

const RoomManager = ({ showTypes = false }) => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [view, setView] = useState(showTypes ? 'types' : 'rooms');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});

    const fetchData = async () => {
        const [r, rt] = await Promise.all([api.get('/pms/rooms'), api.get('/pms/room-types')]);
        setRooms(r.data);
        setRoomTypes(rt.data);
    };

    useEffect(() => { fetchData(); }, []);

    const openForm = (item = null) => {
        setEditing(item);
        setForm(item ? { ...item, roomTypeId: item.roomType?.id } : {});
        setShowForm(true);
    };

    const handleSave = async () => {
        try {
            if (view === 'rooms') {
                editing ? await api.put(`/pms/rooms/${editing.id}`, form) : await api.post('/pms/rooms', form);
            } else {
                editing ? await api.put(`/pms/room-types/${editing.id}`, form) : await api.post('/pms/room-types', form);
            }
            setShowForm(false);
            fetchData();
            Swal.fire('Guardado', '', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
    };

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
        if (!isConfirmed) return;
        try {
            view === 'rooms' ? await api.delete(`/pms/rooms/${id}`) : await api.delete(`/pms/room-types/${id}`);
            fetchData();
        } catch (e) { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    };

    const data = view === 'rooms' ? rooms : roomTypes;

    return (
        <div className="fade-in">
            <div style={s.header}>
                <div style={s.tabs}>
                    <button style={view==='rooms' ? s.tabOn : s.tabOff} onClick={() => setView('rooms')}>Habitaciones ({rooms.length})</button>
                    <button style={view==='types' ? s.tabOn : s.tabOff} onClick={() => setView('types')}>Tipos de Habitación ({roomTypes.length})</button>
                </div>
                <button style={s.btnPrimary} onClick={() => openForm()}>
                    <Plus size={16}/> Nuevo
                </button>
            </div>

            {showForm && (
                <div style={s.formCard}>
                    <h3 style={s.formTitle}>{editing ? 'Editar' : 'Nuevo'} {view === 'rooms' ? 'Habitación' : 'Tipo'}</h3>
                    <div style={s.grid}>
                        {view === 'rooms' ? (<>
                            <div style={s.ig}><label style={s.lbl}>Número</label><input style={s.inp} value={form.number||''} onChange={e=>setForm({...form,number:e.target.value})} placeholder="101"/></div>
                            <div style={s.ig}><label style={s.lbl}>Piso</label><input style={s.inp} value={form.floor||''} onChange={e=>setForm({...form,floor:e.target.value})} placeholder="1"/></div>
                            <div style={s.ig}><label style={s.lbl}>Tipo de Habitación</label>
                                <select style={s.inp} value={form.roomTypeId||''} onChange={e=>setForm({...form,roomTypeId:e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    {roomTypes.map(rt=><option key={rt.id} value={rt.id}>{rt.name}</option>)}
                                </select>
                            </div>
                        </>) : (<>
                            <div style={s.ig}><label style={s.lbl}>Nombre</label><input style={s.inp} value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Suite Deluxe"/></div>
                            <div style={s.ig}><label style={s.lbl}>Precio Base/Noche</label><input style={s.inp} type="number" value={form.basePrice||''} onChange={e=>setForm({...form,basePrice:e.target.value})} placeholder="150000"/></div>
                            <div style={s.ig}><label style={s.lbl}>Capacidad (personas)</label><input style={s.inp} type="number" value={form.capacity||2} onChange={e=>setForm({...form,capacity:e.target.value})}/></div>
                            <div style={{...s.ig, gridColumn:'1/-1'}}><label style={s.lbl}>Descripción</label><textarea style={s.inp} rows={2} value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/></div>
                        </>)}
                    </div>
                    <div style={s.formActions}>
                        <button style={s.btnSec} onClick={() => setShowForm(false)}>Cancelar</button>
                        <button style={s.btnPrimary} onClick={handleSave}>Guardar</button>
                    </div>
                </div>
            )}

            <div style={s.table}>
                <div style={s.thead}>
                    {view === 'rooms' ? (<>
                        <div style={s.th}>N° Hab.</div><div style={s.th}>Piso</div><div style={s.th}>Tipo</div><div style={s.th}>Estado</div><div style={s.th}></div>
                    </>) : (<>
                        <div style={s.th}>Nombre</div><div style={s.th}>Precio/Noche</div><div style={s.th}>Capacidad</div><div style={s.th}>Habitaciones</div><div style={s.th}></div>
                    </>)}
                </div>
                {data.length === 0 && <div style={s.empty}>No hay registros. Crea el primero.</div>}
                {data.map(item => (
                    <div key={item.id} style={s.row}>
                        {view === 'rooms' ? (<>
                            <div style={s.td}><strong>{item.number}</strong></div>
                            <div style={s.td}>{item.floor || '-'}</div>
                            <div style={s.td}>{item.roomType?.name || '-'}</div>
                            <div style={s.td}><span style={{ ...s.badge, background: item.status==='AVAILABLE'?'#d1fae5':item.status==='OCCUPIED'?'#fef3c7':item.status==='MAINTENANCE'?'#fce7f3':item.status==='CLEANING'?'#ede9fe':item.status==='BLOCKED'?'#fee2e2':item.status==='OUT_OF_ORDER'?'#f3f4f6':'#dbeafe', color: item.status==='AVAILABLE'?'#065f46':item.status==='OCCUPIED'?'#92400e':item.status==='MAINTENANCE'?'#be185d':item.status==='CLEANING'?'#6d28d9':item.status==='BLOCKED'?'#991b1b':item.status==='OUT_OF_ORDER'?'#374151':'#1e40af' }}>{item.status}</span></div>
                        </>) : (<>
                            <div style={s.td}><strong>{item.name}</strong></div>
                            <div style={s.td}>$ {Number(item.basePrice).toLocaleString()}</div>
                            <div style={s.td}>{item.capacity} personas</div>
                            <div style={s.td}>{item.rooms?.length || 0} hab.</div>
                        </>)}
                        <div style={{...s.td, display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                            <button style={s.btnEdit} onClick={()=>openForm(item)}><Edit2 size={14}/></button>
                            <button style={s.btnDel} onClick={()=>handleDelete(item.id)}><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const s = {
    header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
    tabs: { display:'flex', gap:'8px', background:'#f1f5f9', padding:'4px', borderRadius:'10px' },
    tabOn: { padding:'8px 16px', background:'white', border:'none', borderRadius:'8px', fontWeight:'700', color:'var(--primary)', cursor:'pointer', fontSize:'13px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' },
    tabOff: { padding:'8px 16px', background:'transparent', border:'none', borderRadius:'8px', fontWeight:'600', color:'var(--text-muted)', cursor:'pointer', fontSize:'13px' },
    btnPrimary: { display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:'var(--primary)', color:'white', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px' },
    btnSec: { display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:'#f1f5f9', color:'var(--text-main)', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px' },
    formCard: { background:'white', border:'1px solid var(--border)', borderRadius:'14px', padding:'24px', marginBottom:'20px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)' },
    formTitle: { fontSize:'16px', fontWeight:'700', margin:'0 0 16px' },
    grid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'16px' },
    ig: { display:'flex', flexDirection:'column', gap:'6px' },
    lbl: { fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase' },
    inp: { padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' },
    formActions: { display:'flex', justifyContent:'flex-end', gap:'10px' },
    table: { border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' },
    thead: { display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr 1fr 80px', background:'#f8fafc', padding:'12px 20px', borderBottom:'1px solid var(--border)' },
    th: { fontSize:'11px', fontWeight:'800', textTransform:'uppercase', color:'var(--text-muted)' },
    row: { display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr 1fr 80px', padding:'14px 20px', borderBottom:'1px solid #f1f5f9', alignItems:'center' },
    td: { fontSize:'14px', color:'var(--text-main)' },
    badge: { padding:'3px 10px', borderRadius:'20px', fontWeight:'700', fontSize:'12px' },
    btnEdit: { padding:'6px', background:'#eff6ff', color:'var(--primary)', border:'none', borderRadius:'6px', cursor:'pointer' },
    btnDel: { padding:'6px', background:'#fef2f2', color:'#ef4444', border:'none', borderRadius:'6px', cursor:'pointer' },
    empty: { padding:'40px', textAlign:'center', color:'var(--text-muted)', fontStyle:'italic' },
};

export default RoomManager;
