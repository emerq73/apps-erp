import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar } from 'lucide-react';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

const RateManager = () => {
    const [rates, setRates] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});

    const fetchData = async () => {
        const [r, rt] = await Promise.all([api.get('/pms/room-rates'), api.get('/pms/room-types')]);
        setRates(r.data);
        setRoomTypes(rt.data);
    };

    useEffect(() => { fetchData(); }, []);

    const openForm = (item = null) => {
        setEditing(item);
        setForm(item || { roomTypeId: '', rateCode: '', price: '', startDate: '', endDate: '', minNights: 1, maxNights: 0, isActive: true });
        setShowForm(true);
    };

    const handleSave = async () => {
        try {
            editing ? await api.put(`/pms/room-rates/${editing.id}`, form) : await api.post('/pms/room-rates', form);
            setShowForm(false);
            fetchData();
            Swal.fire('Guardado', '', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
    };

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar tarifa?', icon: 'warning', showCancelButton: true });
        if (!isConfirmed) return;
        try {
            await api.delete(`/pms/room-rates/${id}`);
            fetchData();
        } catch (e) { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    };

    const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
    const fmtMoney = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v || 0);

    return (
        <div className="fade-in">
            <div style={s.header}>
                <h2 style={s.title}>Tarifas</h2>
                <button style={s.btnPrimary} onClick={() => openForm()}>
                    <Plus size={16}/> Nueva Tarifa
                </button>
            </div>

            {showForm && (
                <div style={s.formCard}>
                    <h3 style={s.formTitle}>{editing ? 'Editar' : 'Nueva'} Tarifa</h3>
                    <div style={s.grid}>
                        <div style={s.ig}><label style={s.lbl}>Tipo Habitación</label>
                            <select style={s.inp} value={form.roomTypeId || ''} onChange={f('roomTypeId')}>
                                <option value="">Seleccionar...</option>
                                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                            </select>
                        </div>
                        <div style={s.ig}><label style={s.lbl}>Código</label><input style={s.inp} value={form.rateCode || ''} onChange={f('rateCode')} placeholder="STD"/></div>
                        <div style={s.ig}><label style={s.lbl}>Precio/Noche</label><input style={s.inp} type="number" value={form.price || ''} onChange={f('price')} placeholder="80000"/></div>
                        <div style={s.ig}><label style={s.lbl}>Fecha Inicio</label><input style={s.inp} type="date" value={fmtDate(form.startDate)} onChange={f('startDate')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Fecha Fin</label><input style={s.inp} type="date" value={fmtDate(form.endDate)} onChange={f('endDate')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Mín. Noches</label><input style={s.inp} type="number" value={form.minNights || 1} onChange={f('minNights')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Máx. Noches</label><input style={s.inp} type="number" value={form.maxNights || 0} onChange={f('maxNights')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Activa</label>
                            <select style={s.inp} value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>
                    <div style={s.formActions}>
                        <button style={s.btnSec} onClick={() => setShowForm(false)}>Cancelar</button>
                        <button style={s.btnPrimary} onClick={handleSave}>Guardar</button>
                    </div>
                </div>
            )}

            <div style={s.table}>
                <div style={s.thead}>
                    <div style={s.th}>Código</div><div style={s.th}>Tipo</div><div style={s.th}>Precio</div><div style={s.th}>Vigencia</div><div style={s.th}>Estado</div>
                </div>
                {rates.length === 0 && <div style={s.empty}>No hay tarifas. Crea la primera.</div>}
                {rates.map(r => (
                    <div key={r.id} style={s.row}>
                        <div style={s.td}><strong>{r.rateCode}</strong></div>
                        <div style={s.td}>{r.roomType?.name || '-'}</div>
                        <div style={s.td}>{fmtMoney(r.price)}</div>
                        <div style={s.td}>{fmtDate(r.startDate)} - {fmtDate(r.endDate)}</div>
                        <div style={s.td}><span style={{ ...s.badge, background: r.isActive ? '#d1fae5' : '#f3f4f6', color: r.isActive ? '#065f46' : '#6b7280' }}>{r.isActive ? 'Activa' : 'Inactiva'}</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', color: '#1e293b' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    btnSec: { padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    formCard: { background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    formTitle: { margin: '0 0 16px', fontSize: '18px', color: '#1e293b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
    ig: { display: 'flex', flexDirection: 'column', gap: '4px' },
    lbl: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
    inp: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
    table: { background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    thead: { display: 'grid', gridTemplateColumns: '100px 1fr 120px 1fr 80px', background: '#f8fafc', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#475569' },
    row: { display: 'grid', gridTemplateColumns: '100px 1fr 120px 1fr 80px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155', alignItems: 'center' },
    td: { display: 'flex', alignItems: 'center' },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8' },
    badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
};

export default RateManager;