import React, { useState, useEffect } from 'react';
import { Plus, Play, CheckCircle, ShieldCheck, Trash2, AlertTriangle, Coffee, List } from 'lucide-react';
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

const HousekeepingManager = ({ onRefresh }) => {
    const [requests, setRequests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState(null);
    const [filter, setFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [form, setForm] = useState({});
    const [staffForm, setStaffForm] = useState({});
    const [minibarItems, setMinibarItems] = useState([]);

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

    const fetchMinibar = async () => {
        try {
            // Intentar buscar items de categoría minibar
            const res = await api.get('/inventory/menu-items?category=Minibar');
            setMinibarItems(res.data || []);
        } catch (e) { 
            console.warn('No se pudieron cargar items de minibar');
            setMinibarItems([
                { id: '1', name: 'Agua Mineral', price: 2.5 },
                { id: '2', name: 'Gaseosa', price: 3.0 },
                { id: '3', name: 'Snack Mix', price: 4.5 },
                { id: '4', name: 'Cerveza', price: 5.0 }
            ]);
        }
    };

    useEffect(() => { 
        fetchData(); 
        fetchRooms(); 
        fetchStaff();
        fetchMinibar();
    }, [filter]);

    const handleSave = async () => {
        if (!form.roomId) { Swal.fire('Error', 'Selecciona una habitación', 'warning'); return; }
        try {
            await api.post('/pms/cleaning-requests', form);
            setShowForm(true); // Close form
            setShowForm(false);
            fetchData();
            if (onRefresh) onRefresh();
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
                await api.patch(`/pms/cleaning-requests/${id}`, { status: 'IN_PROGRESS', assignedToId: staffId, assignedTo: staff.find(s=>s.id===staffId)?.name });
                break;
            case 'complete':
                // Modal avanzado estilo Cloudbeds
                const { value: completionData } = await Swal.fire({
                    title: 'Completar Limpieza',
                    html: `
                        <div style="text-align: left; font-family: sans-serif;">
                            <h4 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;"><i class="lucide-list"></i> Checklist de Tareas</h4>
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin: 5px 0;"><input type="checkbox" id="check_linen" checked> Cambio de lencería (sábanas/toallas)</label>
                                <label style="display: block; margin: 5px 0;"><input type="checkbox" id="check_amenities" checked> Reposición de amenities</label>
                                <label style="display: block; margin: 5px 0;"><input type="checkbox" id="check_beds" checked> Tendido de camas profesional</label>
                                <label style="display: block; margin: 5px 0;"><input type="checkbox" id="check_floor" checked> Limpieza de pisos y superficies</label>
                            </div>
                            
                            <h4 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;"><i class="lucide-coffee"></i> Consumo de Minibar</h4>
                            <div id="minibar_list" style="max-height: 150px; overflow-y: auto; padding: 5px; background: #f8fafc; borderRadius: 8px;">
                                ${minibarItems.map(item => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 13px;">${item.name} ($${item.price})</span>
                                        <input type="number" class="minibar-qty" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" value="0" min="0" style="width: 50px; padding: 2px;">
                                    </div>
                                `).join('')}
                            </div>
                            
                            <h4 style="margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Notas de la camarera</h4>
                            <textarea id="cleaning_notes" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;" placeholder="Opcional..."></textarea>
                        </div>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: 'Finalizar y Postear Cargos',
                    preConfirm: () => {
                        const consumptions = [];
                        document.querySelectorAll('.minibar-qty').forEach(input => {
                            const qty = parseInt(input.value);
                            if (qty > 0) {
                                consumptions.push({
                                    id: input.dataset.id,
                                    name: input.dataset.name,
                                    price: input.dataset.price,
                                    quantity: qty
                                });
                            }
                        });

                        return {
                            checklist: {
                                linen: document.getElementById('check_linen').checked,
                                amenities: document.getElementById('check_amenities').checked,
                                beds: document.getElementById('check_beds').checked,
                                floor: document.getElementById('check_floor').checked,
                            },
                            minibarConsumptions: consumptions,
                            notes: document.getElementById('cleaning_notes').value
                        };
                    }
                });

                if (!completionData) return;

                await api.patch(`/pms/cleaning-requests/${id}`, {
                    status: 'COMPLETED',
                    ...completionData
                });
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
                await api.patch(`/pms/cleaning-requests/${id}/verify`, { staffId: supId });
                break;
        }
        fetchData();
        if (onRefresh) onRefresh();
    };

    // ... (rest of the component stays similar but using s styles)
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

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar solicitud?', icon: 'warning', showCancelButton: true });
        if (!isConfirmed) return;
        try {
            await api.delete(`/pms/cleaning-requests/${id}`);
            fetchData();
            if (onRefresh) onRefresh();
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se puede eliminar', 'error'); }
    };

    const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    return (
        <div className="fade-in">
            <div style={s.header}>
                <h2 style={s.title}>Limpieza y Operaciones</h2>
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
                    <div style={{ ...s.statCard, borderLeftColor: '#f59e0b' }}><span style={{ ...s.statLabel, color: '#f59e0b' }}>Pendientes</span><span style={s.statValue}>{stats.pending || 0}</span></div>
                    <div style={{ ...s.statCard, borderLeftColor: '#3b82f6' }}><span style={{ ...s.statLabel, color: '#3b82f6' }}>En Proceso</span><span style={s.statValue}>{stats.inProgress || 0}</span></div>
                    <div style={{ ...s.statCard, borderLeftColor: '#10b981' }}><span style={{ ...s.statLabel, color: '#10b981' }}>Completadas (Hoy)</span><span style={s.statValue}>{stats.completed || 0}</span></div>
                    <div style={{ ...s.statCard, borderLeftColor: '#6b7280' }}><span style={{ ...s.statLabel, color: '#6b7280' }}>Verificadas (Hoy)</span><span style={s.statValue}>{stats.verified || 0}</span></div>
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
                    <h3 style={{ ...s.formTitle, marginBottom: '12px' }}>Equipo de Operaciones</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {staff.map(s_item => (
                            <div key={s_item.id} style={{ ...s.staffChip, border: s_item.role === 'SUPERVISOR' ? '2px solid #8b5cf6' : '1px solid #e2e8f0' }}>
                                <span style={{ fontWeight: '600' }}>{s_item.name}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{s_item.role}</span>
                                <button style={{ fontSize: '10px', padding: '2px 6px', marginLeft: '4px', background:'none', border:'none', cursor:'pointer' }} onClick={() => openStaffForm(s_item)}>✎</button>
                            </div>
                        ))}
                        <button style={{ ...s.staffChip, border: '1px dashed #94a3b8', background: 'transparent', cursor: 'pointer' }} onClick={() => openStaffForm()}>+ Agregar</button>
                    </div>
                </div>
            )}

            <div style={s.list}>
                {requests.length === 0 && <div style={s.empty}>No hay solicitudes activas</div>}
                {requests.map(req => (
                    <div key={req.id} style={{ ...s.item, borderLeftColor: req.isUrgent ? '#ef4444' : STATUS_CONFIG[req.status]?.color || '#ccc' }}>
                        <div style={s.itemHeader}>
                            <span style={s.itemRoom}>#{req.room?.number || req.roomId}</span>
                            <span style={{ ...s.badge, background: STATUS_CONFIG[req.status]?.bg || '#eee', color: STATUS_CONFIG[req.status]?.color || '#666' }}>
                                {STATUS_CONFIG[req.status]?.label || req.status}
                            </span>
                            <span style={{ ...s.badge, background: '#f3f4f6', color: TYPE_CONFIG[req.type]?.color || '#64748b' }}>
                                {TYPE_CONFIG[req.type]?.label || req.type}
                            </span>
                            {req.isUrgent && <AlertTriangle size={14} color="#ef4444" />}
                            {req.startedAt && <span style={{ fontSize:'11px', color:'#3b82f6', fontWeight:'600' }}>Inició: {new Date(req.startedAt).toLocaleTimeString()}</span>}
                        </div>
                        <div style={s.itemDate}>
                            Programado: {new Date(req.scheduledDate).toLocaleDateString()} {req.scheduledTime || ''}
                        </div>
                        {req.assignedTo && <div style={s.itemAssign}>Asignado a: {req.assignedTo}</div>}
                        {req.notes && <div style={s.itemNotes}>{req.notes}</div>}
                        
                        {req.checklist && (
                            <div style={{ fontSize: '12px', marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '4px' }}>
                                <strong>Checklist:</strong> {Object.entries(req.checklist).filter(([k,v])=>v).map(([k])=>k).join(', ')}
                            </div>
                        )}

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
    title: { margin: 0, fontSize: '20px', color: '#1e293b', fontWeight:'800' },
    filterSel: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight:'600' },
    btnSec: { padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' },
    statCard: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '16px' },
    statLabel: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' },
    statValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#1e293b' },
    formCard: { background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border:'1px solid #e2e8f0' },
    formTitle: { margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight:'700' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    ig: { display: 'flex', flexDirection: 'column', gap: '4px' },
    lbl: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
    inp: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', background:'#f8fafc', borderRadius:'8px' },
    item: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '16px', transition:'all 0.2s' },
    itemHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
    itemRoom: { fontWeight: '800', fontSize: '18px', color: '#1e293b' },
    badge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform:'uppercase' },
    itemDate: { fontSize: '13px', color: '#64748b', marginBottom: '4px' },
    itemAssign: { fontSize: '13px', color: '#3b82f6', marginBottom: '4px', fontWeight:'600' },
    itemNotes: { fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginBottom: '8px', padding:'4px 8px', background:'#f1f5f9', borderRadius:'4px' },
    itemActions: { display: 'flex', gap: '8px', marginTop: '12px', borderTop:'1px solid #f1f5f9', paddingTop:'12px' },
    btnAction: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight:'600' },
    btnDelete: { padding: '8px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    staffChip: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', background: '#fff', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' },
};

export default HousekeepingManager;