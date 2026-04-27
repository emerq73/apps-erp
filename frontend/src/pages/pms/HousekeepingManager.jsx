import React, { useState, useEffect } from 'react';
import { Plus, Play, CheckCircle, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

const STATUS_CONFIG = {
    PENDING:    { label: 'Pendiente',  color: '#f59e0b', bg: '#fef3c7' },
    IN_PROGRESS: { label: 'En Proceso', color: '#3b82f6', bg: '#dbeafe' },
    COMPLETED:  { label: 'Completado', color: '#10b981', bg: '#d1fae5' },
    VERIFIED:   { label: 'Verificado', color: '#6b7280', bg: '#f3f4f6' },
};

const TYPE_CONFIG = {
    STANDARD:  { label: 'Estándar', color: '#64748b' },
    DEEP:     { label: 'Profunda', color: '#8b5cf6' },
    TURNOVER:  { label: 'Turnover', color: '#f59e0b' },
    MAINTENANCE:{ label: 'Mantenimiento', color: '#ef4444' },
};

const HousekeepingManager = () => {
    const [requests, setRequests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState(null);
    const [filter, setFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [form, setForm] = useState({});
    const [staffForm, setStaffForm] = useState({});

    const fetchData = async () => {
        const query = filter ? `?status=${filter}` : '';
        const [r, s] = await Promise.all([
            api.get(`/pms/cleaning-requests${query}`),
            api.get('/pms/cleaning-stats'),
        ]);
        setRequests(r.data);
        setStats(s.data);
    };

    const fetchRooms = async () => {
        const r = await api.get('/pms/rooms');
        setRooms(r.data);
    };

    const fetchStaff = async () => {
        const s = await api.get('/pms/cleaning-staff');
        setStaff(s.data);
    };

    useEffect(() => { 
        fetchData(); 
        fetchRooms(); 
        fetchStaff();
    }, [filter]);

    const syncCleaning = async () => {
        try {
            await api.post('/pms/cleaning-requests/sync');
        } catch (e) { console.error('Sync error:', e); }
    };

    const openForm = () => {
        setForm({ roomId: '', type: 'STANDARD', scheduledDate: new Date().toISOString().split('T')[0], isUrgent: false, notes: '' });
        setShowForm(true);
    };

    const openStaffForm = (s = null) => {
        setStaffForm(s || { name: '', email: '', phone: '', role: 'HOUSEKEEPER', isActive: true });
        setShowStaffForm(true);
    };

    const handleSaveStaff = async () => {
        if (!staffForm.name) { Swal.fire('Error', 'El nombre es requerido', 'warning'); return; }
        try {
            if (staffForm.id) {
                await api.put(`/pms/cleaning-staff/${staffForm.id}`, staffForm);
            } else {
                await api.post('/pms/cleaning-staff', staffForm);
            }
            setShowStaffForm(false);
            fetchStaff();
            Swal.fire('Guardado', '', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
    };

    const deleteStaff = async (id) => {
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar personal?', icon: 'warning', showCancelButton: true });
        if (!isConfirmed) return;
        await api.delete(`/pms/cleaning-staff/${id}`);
        fetchStaff();
    };

    const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const f2 = (k) => (e) => setStaffForm({ ...staffForm, [k]: e.target.value });

    const handleSave = async () => {
        if (!form.roomId) { Swal.fire('Error', 'Selecciona una habitación', 'warning'); return; }
        try {
            await api.post('/pms/cleaning-requests', form);
            setShowForm(false);
            fetchData();
            Swal.fire('Guardado', '', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
    };

    const action = async (id, type, request) => {
        let res;
        switch (type) {
            case 'start':
                const housekeepers = staff.filter(s => s.role === 'HOUSEKEEPER');
                if (housekeepers.length === 0) {
                    Swal.fire('Info', 'No hay personal de limpieza disponible', 'info');
                    return;
                }
                const { value: staffId } = await Swal.fire({
                    title: 'Asignar a',
                    input: 'select',
                    inputOptions: Object.fromEntries(housekeepers.map(s => [s.id, s.name])),
                    inputPlaceholder: 'Seleccionar personal',
                    showCancelButton: true,
                });
                if (!staffId) return;
                res = await api.patch(`/pms/cleaning-requests/${id}/assign`, { staffId, isSupervisor: false });
                break;
            case 'complete':
                res = await api.patch(`/pms/cleaning-requests/${id}/complete`);
                break;
            case 'verify':
                const supervisors = staff.filter(s => s.role === 'SUPERVISOR');
                if (supervisors.length === 0) {
                    Swal.fire('Info', 'No hay supervisores disponibles', 'info');
                    return;
                }
                const { value: supId } = await Swal.fire({
                    title: 'Verificado por',
                    input: 'select',
                    inputOptions: Object.fromEntries(supervisors.map(s => [s.id, s.name])),
                    inputPlaceholder: 'Seleccionar supervisor',
                    showCancelButton: true,
                });
                if (!supId) return;
                res = await api.patch(`/pms/cleaning-requests/${id}/assign`, { staffId: supId, isSupervisor: true });
                break;
        }
        fetchData();
    };

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar solicitud?', icon: 'warning', showCancelButton: true });
        if (!isConfirmed) return;
        try {
            await api.delete(`/pms/cleaning-requests/${id}`);
            fetchData();
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se puede eliminar', 'error'); }
    };

    return (
        <div className="fade-in">
            <div style={s.header}>
                <h2 style={s.title}>Limpieza</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select style={s.filterSel} value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button style={s.btnPrimary} onClick={openForm}><Plus size={16} /> Nueva Solicitud</button>
                </div>
            </div>

            {stats && (
                <div style={s.statsGrid}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <div key={k} style={{ ...s.statCard, borderLeftColor: v.color }}>
                            <span style={{ ...s.statLabel, color: v.color }}>{v.label}</span>
                            <span style={s.statValue}>{stats[k.toLowerCase()] || 0}</span>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div style={s.formCard}>
                    <h3 style={s.formTitle}>Nueva Solicitud de Limpieza</h3>
                    <div style={s.grid}>
                        <div style={s.ig}><label style={s.lbl}>Habitación *</label>
                            <select style={s.inp} value={form.roomId || ''} onChange={f('roomId')}>
                                <option value="">Seleccionar...</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>#{r.number} - {r.roomType?.name}</option>)}
                            </select>
                        </div>
                        <div style={s.ig}><label style={s.lbl}>Tipo</label>
                            <select style={s.inp} value={form.type || 'STANDARD'} onChange={f('type')}>
                                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div style={s.ig}><label style={s.lbl}>Fecha</label><input style={s.inp} type="date" value={form.scheduledDate || ''} onChange={f('scheduledDate')} /></div>
                        <div style={s.ig}><label style={s.lbl}>Urgente</label>
                            <select style={s.inp} value={form.isUrgent ? 'true' : 'false'} onChange={e => setForm({ ...form, isUrgent: e.target.value === 'true' })}>
                                <option value="false">No</option>
                                <option value="true">Sí</option>
                            </select>
                        </div>
                        <div style={{ ...s.ig, gridColumn: '1 / -1' }}><label style={s.lbl}>Notas</label><textarea style={s.inp} rows={2} value={form.notes || ''} onChange={f('notes')} /></div>
                    </div>
                    <div style={s.formActions}>
                        <button style={s.btnSec} onClick={() => setShowForm(false)}>Cancelar</button>
                        <button style={s.btnPrimary} onClick={handleSave}>Guardar</button>
                    </div>
                </div>
            )}

            {showStaffForm && (
                <div style={s.formCard}>
                    <h3 style={s.formTitle}>{staffForm.id ? 'Editar' : 'Nuevo'} Personal</h3>
                    <div style={s.grid}>
                        <div style={s.ig}><label style={s.lbl}>Nombre *</label><input style={s.inp} value={staffForm.name || ''} onChange={(e) => setStaffForm({...staffForm, name: e.target.value})} /></div>
                        <div style={s.ig}><label style={s.lbl}>Email</label><input style={s.inp} type="email" value={staffForm.email || ''} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} /></div>
                        <div style={s.ig}><label style={s.lbl}>Teléfono</label><input style={s.inp} value={staffForm.phone || ''} onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} /></div>
                        <div style={s.ig}><label style={s.lbl}>Rol</label>
                            <select style={s.inp} value={staffForm.role || 'HOUSEKEEPER'} onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}>
                                <option value="HOUSEKEEPER">Limpieza</option>
                                <option value="TECHNICIAN">Técnico</option>
                                <option value="SUPERVISOR">Supervisor</option>
                            </select>
                        </div>
                    </div>
                    <div style={s.formActions}>
                        <button style={s.btnSec} onClick={() => setShowStaffForm(false)}>Cancelar</button>
                        <button style={s.btnPrimary} onClick={handleSaveStaff}>Guardar</button>
                    </div>
                </div>
            )}

            {!showForm && !showStaffForm && (
                <div style={{ ...s.formCard, marginBottom: '20px', background: '#f8fafc' }}>
                    <h3 style={{ ...s.formTitle, marginBottom: '12px' }}>Personal de Limpieza</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {staff.length === 0 && <div style={{ color: '#94a3b8', padding: '20px 0' }}>No hay personal. Agrega miembros del equipo.</div>}
                        {staff.map(s => (
                            <div key={s.id} style={{ ...s.staffChip, border: s.role === 'SUPERVISOR' ? '2px solid #8b5cf6' : s.role === 'TECHNICIAN' ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                <span style={{ fontWeight: '600' }}>{s.name}</span>
                                <span style={{ fontSize: '11px', color: s.role === 'SUPERVISOR' ? '#8b5cf6' : s.role === 'TECHNICIAN' ? '#f59e0b' : '#64748b' }}>
                                    {s.role === 'SUPERVISOR' ? 'SUP' : s.role === 'TECHNICIAN' ? 'TEC' : 'LIMP'}
                                </span>
                                <button style={{ fontSize: '10px', padding: '2px 6px', marginLeft: '4px' }} onClick={() => openStaffForm(s)}>✎</button>
                            </div>
                        ))}
                        <button style={{ ...s.staffChip, border: '1px dashed #94a3b8', background: 'transparent', cursor: 'pointer' }} onClick={() => openStaffForm()}>+ Agregar</button>
                    </div>
                </div>
            )}

            <div style={s.list}>
                {requests.length === 0 && <div style={s.empty}>No hay solicitudes</div>}
                {requests.map(req => (
                    <div key={req.id} style={{ ...s.item, borderLeftColor: req.isUrgent ? '#ef4444' : STATUS_CONFIG[req.status].color }}>
                        <div style={s.itemHeader}>
                            <span style={s.itemRoom}>#{req.room?.number || req.roomId}</span>
                            <span style={{ ...s.badge, background: STATUS_CONFIG[req.status].bg, color: STATUS_CONFIG[req.status].color }}>
                                {STATUS_CONFIG[req.status].label}
                            </span>
                            <span style={{ ...s.badge, background: '#f3f4f6', color: TYPE_CONFIG[req.type]?.color || '#64748b' }}>
                                {TYPE_CONFIG[req.type]?.label}
                            </span>
                            {req.isUrgent && <AlertTriangle size={14} color="#ef4444" />}
                        </div>
                        <div style={s.itemDate}>
                            {new Date(req.scheduledDate).toLocaleDateString('es-CO')} {req.scheduledTime || ''}
                        </div>
                        {req.assignedTo && <div style={s.itemAssign}>Asignado a: {req.assignedTo}</div>}
                        {req.notes && <div style={s.itemNotes}>{req.notes}</div>}
                        <div style={s.itemActions}>
                            {req.status === 'PENDING' && <button style={s.btnAction} onClick={() => action(req.id, 'start')}><Play size={14} /> Iniciar</button>}
                            {req.status === 'IN_PROGRESS' && <button style={s.btnAction} onClick={() => action(req.id, 'complete')}><CheckCircle size={14} /> Completar</button>}
                            {req.status === 'COMPLETED' && <button style={s.btnAction} onClick={() => action(req.id, 'verify')}><ShieldCheck size={14} /> Verificar</button>}
                            {req.status === 'PENDING' && <button style={s.btnDelete} onClick={() => handleDelete(req.id)}><Trash2 size={14} /></button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', color: '#1e293b' },
    filterSel: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    btnSec: { padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' },
    statCard: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '16px' },
    statLabel: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' },
    statValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#1e293b' },
    formCard: { background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    formTitle: { margin: '0 0 16px', fontSize: '18px', color: '#1e293b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    ig: { display: 'flex', flexDirection: 'column', gap: '4px' },
    lbl: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
    inp: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
    list: { display: 'flex', flexDirection: 'column', gap: '8px' },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8' },
    item: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '16px' },
    itemHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
    itemRoom: { fontWeight: '700', fontSize: '16px', color: '#1e293b' },
    badge: { padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
    itemDate: { fontSize: '13px', color: '#64748b', marginBottom: '4px' },
    itemAssign: { fontSize: '13px', color: '#3b82f6', marginBottom: '4px' },
    itemNotes: { fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginBottom: '8px' },
    itemActions: { display: 'flex', gap: '8px', marginTop: '8px' },
    btnAction: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    btnDelete: { padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    btnSecondary: { padding: '8px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    btnEdit: { padding: '4px 8px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
    staffSection: { marginBottom: '20px' },
    staffHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    sectionTitle: { margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' },
    staffList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    staffCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', minWidth: '150px' },
    staffInfo: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
    staffActions: { display: 'flex', gap: '4px', marginTop: '8px' },
    staffRole: { fontSize: '11px', fontWeight: '600', marginLeft: '6px' },
    staffChip: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', background: '#fff' },
};

export default HousekeepingManager;