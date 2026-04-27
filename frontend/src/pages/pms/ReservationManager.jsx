import React, { useState, useEffect } from 'react';
import { Plus, LogIn, LogOut, Calendar } from 'lucide-react';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

const STATUS_COLORS = {
    PENDING:     { bg:'#fef3c7', color:'#92400e', label:'Pendiente' },
    CONFIRMED:   { bg:'#d1fae5', color:'#065f46', label:'Confirmada' },
    CHECKED_IN:  { bg:'#dbeafe', color:'#1e40af', label:'Check-In' },
    CHECKED_OUT: { bg:'#f3f4f6', color:'#374151', label:'Check-Out' },
    CANCELLED:   { bg:'#fee2e2', color:'#991b1b', label:'Cancelada' },
    NO_SHOW:     { bg:'#fce7f3', color:'#9d174d', label:'No Show' },
};

const ReservationManager = () => {
    const [reservations, setReservations] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [filter, setFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ adults:1, children:0, source:'DIRECT', ratePerNight:'', checkIn:'', checkOut:'', roomId:'', guestId:'', autoConfirm:false });
    const [loadingRooms, setLoadingRooms] = useState(false);

    const fetchAll = async () => {
        const [res, gst] = await Promise.all([
            api.get(`/pms/reservations${filter ? `?status=${filter}` : ''}`),
            api.get('/pms/guests'),
        ]);
        setReservations(res.data);
        setGuests(gst.data);
    };

    const fetchAvailableRooms = async (checkIn, checkOut) => {
        setLoadingRooms(true);
        try {
            if (checkIn && checkOut) {
                const avail = await api.get(`/pms/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
                setRooms(avail.data.rooms || []);
            } else {
                const rm = await api.get('/pms/rooms');
                setRooms(rm.data);
            }
        } catch (e) {
            const rm = await api.get('/pms/rooms');
            setRooms(rm.data);
        } finally {
            setLoadingRooms(false);
        }
    };

    const openForm = () => {
        setForm({ adults:1, children:0, source:'DIRECT', ratePerNight:'', checkIn:'', checkOut:'', roomId:'', guestId:'', autoConfirm:false });
        fetchAvailableRooms('', '');
        setShowForm(true);
    };

    useEffect(() => { fetchAll(); }, [filter]);

    const handleSave = async () => {
        if (!form.roomId || !form.guestId || !form.checkIn || !form.checkOut || !form.ratePerNight) {
            Swal.fire('Campos incompletos', 'Completa todos los campos requeridos', 'warning'); return;
        }
        try {
            await api.post('/pms/reservations', form);
            setShowForm(false);
            setForm({ adults:1, children:0, source:'DIRECT', ratePerNight:'', checkIn:'', checkOut:'', roomId:'', guestId:'', autoConfirm:false });
            fetchAll();
            Swal.fire('Reserva creada', '', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error al guardar', 'error'); }
    };

    const action = async (id, type) => {
        const labels = { 'check-in':'Hacer Check-In', 'check-out':'Hacer Check-Out', 'cancel':'Cancelar reserva', 'confirm':'Confirmar reserva' };
        
        if (type === 'check-out') {
            const { isConfirmed, value } = await Swal.fire({ 
                title: 'Check-Out', 
                text: '¿Aplicar cargo por late check-out?',
                icon:'question', 
                showCancelButton:true,
                confirmButtonText: 'Con cargo',
                cancelButtonText: 'Sin cargo',
            });
            if (!isConfirmed && !value) return;
            try {
                await api.patch(`/pms/reservations/${id}/${type}`, { applyLateFee: isConfirmed });
                fetchAll();
            } catch (e) { 
                if (e.response?.data?.requiresConfirmation) {
                    Swal.fire('Info', e.response.data.message, 'info');
                } else {
                    Swal.fire('Error', e.response?.data?.message || 'No se pudo completar la acción', 'error'); 
                }
            }
            return;
        }

        const { isConfirmed } = await Swal.fire({ title: labels[type], icon:'question', showCancelButton:true });
        if (!isConfirmed) return;
        try {
            await api.patch(`/pms/reservations/${id}/${type}`);
            fetchAll();
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo completar la acción', 'error'); }
    };

    const nights = (ci, co) => {
        if (!ci || !co) return 0;
        return Math.ceil((new Date(co) - new Date(ci)) / (1000*60*60*24));
    };

    const f = (k) => (e) => setForm({...form, [k]: e.target.value});

    return (
        <div className="fade-in">
            <div style={s.header}>
                <h2 style={s.title}>Reservas</h2>
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                    <select style={s.filterSel} value={filter} onChange={e=>setFilter(e.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(STATUS_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button style={s.btnPrimary} onClick={openForm}><Plus size={16}/> Nueva Reserva</button>
                </div>
            </div>

            {showForm && (
                <div style={s.modal}>
                    <h3 style={s.formTitle}>Nueva Reserva</h3>
                    <div style={s.grid}>
                        <div style={s.ig}><label style={s.lbl}>Huésped *</label>
                            {guests.length === 0 ? (
                                <div style={{ ...s.inp, background:'#fef3c7', color:'#92400e' }}>No hay huéspedes</div>
                            ) : (
                                <select style={s.inp} value={form.guestId} onChange={f('guestId')}>
                                    <option value="">Seleccionar huésped...</option>
                                    {guests.map(g=><option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                                </select>
                            )}
                        </div>
                        <div style={s.ig}><label style={s.lbl}>Habitación *</label>
                            {loadingRooms ? (
                                <div style={{ ...s.inp, background:'#f1f5f9' }}>Cargando...</div>
                            ) : rooms.length === 0 ? (
                                <div style={{ ...s.inp, background:'#fef3c7', color:'#92400e' }}>Sin habitaciones</div>
                            ) : (
                                <select style={s.inp} value={form.roomId} onChange={f('roomId')}>
                                    <option value="">Seleccionar...</option>
                                    {rooms.map(r=><option key={r.id} value={r.id}>#{r.number} · {r.roomType?.name}</option>)}
                                </select>
                            )}
                        </div>
                        <div style={s.ig}><label style={s.lbl}>Check-In *</label><input style={s.inp} type="date" value={form.checkIn} onChange={f('checkIn')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Check-Out *</label><input style={s.inp} type="date" value={form.checkOut} onChange={f('checkOut')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Tarifa/Noche *</label><input style={s.inp} type="number" value={form.ratePerNight} onChange={f('ratePerNight')} placeholder="150000"/></div>
                        <div style={s.ig}><label style={s.lbl}>Adultos</label><input style={s.inp} type="number" min="1" value={form.adults} onChange={f('adults')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Niños</label><input style={s.inp} type="number" min="0" value={form.children} onChange={f('children')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Canal</label>
                            <select style={s.inp} value={form.source} onChange={f('source')}>
                                <option value="DIRECT">Directo</option>
                                <option value="PHONE">Teléfono</option>
                                <option value="WALK_IN">Walk-in</option>
                                <option value="OTA">OTA</option>
                                <option value="CORPORATE">Corporativo</option>
                            </select>
                        </div>
                        <div style={{...s.ig, gridColumn:'1 / -1', flexDirection:'row', alignItems:'center', gap:'8px', marginTop:'8px'}}>
                            <input type="checkbox" id="autoConfirm" checked={form.autoConfirm} onChange={e=>setForm({...form, autoConfirm:e.target.checked})}/>
                            <label htmlFor="autoConfirm" style={{fontSize:'13px', cursor:'pointer'}}>Confirmar automáticamente</label>
                        </div>
                    </div>
                    {form.checkIn && form.checkOut && form.ratePerNight && (
                        <div style={s.preview}>
                            {nights(form.checkIn, form.checkOut)} noches × $ {Number(form.ratePerNight).toLocaleString()} = <strong style={{color:'var(--primary)'}}>$ {(nights(form.checkIn,form.checkOut)*Number(form.ratePerNight)).toLocaleString()}</strong>
                        </div>
                    )}
                    <div style={s.fa}>
                        <button style={s.btnSec} onClick={()=>setShowForm(false)}>Cancelar</button>
                        <button style={s.btnPrimary} onClick={handleSave}>Crear Reserva</button>
                    </div>
                </div>
            )}

            <div style={s.table}>
                <div style={s.thead}>
                    <div style={s.th}>N°</div><div style={s.th}>Huésped</div><div style={s.th}>Habitación</div><div style={s.th}>Fechas</div><div style={s.th}>Total</div><div style={s.th}>Estado</div><div style={s.th}>Acción</div>
                </div>
                {reservations.length===0 && <div style={s.empty}><Calendar size={32} color="#cbd5e1"/><p>No hay reservas</p></div>}
                {reservations.map(r => {
                    const cfg = STATUS_COLORS[r.status] || STATUS_COLORS.PENDING;
                    return (
                        <div key={r.id} style={s.row}>
                            <div style={s.td}><strong style={{color:'var(--primary)'}}>{r.reservationNumber}</strong></div>
                            <div style={s.td}>{r.guest?.firstName} {r.guest?.lastName}</div>
                            <div style={s.td}>#{r.room?.number}</div>
                            <div style={s.td}>{new Date(r.checkIn).toLocaleDateString()} → {new Date(r.checkOut).toLocaleDateString()}</div>
                            <div style={{...s.td, fontWeight:'700'}}>$ {Number(r.totalAmount).toLocaleString()}</div>
                            <div style={s.td}><span style={{...s.badge, background:cfg.bg, color:cfg.color}}>{cfg.label}</span></div>
                            <div style={{...s.td, display:'flex', gap:'4px'}}>
                                {r.status === 'PENDING' && <button style={s.btnConfirm} onClick={()=>action(r.id,'confirm')}>✓</button>}
                                {r.status === 'CONFIRMED' && <button style={s.btnCi} onClick={()=>action(r.id,'check-in')}>CI</button>}
                                {r.status === 'CHECKED_IN' && <button style={s.btnCo} onClick={()=>action(r.id,'check-out')}>CO</button>}
                                {['PENDING','CONFIRMED'].includes(r.status) && <button style={s.btnCancel} onClick={()=>action(r.id,'cancel')}>✕</button>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const s = {
    header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
    title: { fontSize:'22px', fontWeight:'800', color:'var(--text-main)', margin:0 },
    filterSel: { padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'10px', fontSize:'13px', background:'white' },
    btnPrimary: { display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:'var(--primary)', color:'white', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px' },
    btnSec: { padding:'10px 20px', background:'#f1f5f9', color:'var(--text-main)', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px' },
    modal: { background:'white', border:'1px solid var(--border)', borderRadius:'14px', padding:'24px', marginBottom:'20px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)' },
    formTitle: { fontSize:'16px', fontWeight:'700', margin:'0 0 16px' },
    grid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px', marginBottom:'16px' },
    ig: { display:'flex', flexDirection:'column', gap:'6px' },
    lbl: { fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase' },
    inp: { padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' },
    preview: { background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px', fontSize:'14px', color:'#0369a1' },
    fa: { display:'flex', justifyContent:'flex-end', gap:'10px' },
    table: { border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' },
    thead: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.5fr 1fr 1fr 1fr', background:'#f8fafc', padding:'12px 20px', borderBottom:'1px solid var(--border)' },
    th: { fontSize:'11px', fontWeight:'800', textTransform:'uppercase', color:'var(--text-muted)' },
    row: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.5fr 1fr 1fr 1fr', padding:'14px 20px', borderBottom:'1px solid #f1f5f9', alignItems:'center' },
    td: { fontSize:'13px', color:'var(--text-main)' },
    badge: { padding:'3px 10px', borderRadius:'20px', fontWeight:'700', fontSize:'12px' },
    btnConfirm: { padding:'5px 10px', background:'#d1fae5', color:'#065f46', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
    btnCi: { padding:'5px 10px', background:'#d1fae5', color:'#065f46', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
    btnCo: { padding:'5px 10px', background:'#dbeafe', color:'#1e40af', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
    btnCancel: { padding:'5px 10px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
    empty: { display:'flex', flexDirection:'column', alignItems:'center', padding:'48px', color:'var(--text-muted)', gap:'8px' },
};

export default ReservationManager;