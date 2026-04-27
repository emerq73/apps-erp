import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit, Bed, Plus, LogIn, LogOut, CheckCircle } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

const STATUS_COLORS = {
    PENDING:     { bg: '#fef3c7', color: '#92400e', border: '#f59e0b', label: 'Pendiente' },
    CONFIRMED:   { bg: '#d1fae5', color: '#065f46', border: '#10b981', label: 'Confirmada' },
    CHECKED_IN:  { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6', label: 'Check-In' },
    CHECKED_OUT: { bg: '#f3f4f6', color: '#374151', border: '#9ca3af', label: 'Check-Out' },
    CANCELLED:   { bg: '#fee2e2', color: '#991b1b', border: '#ef4444', label: 'Cancelada' },
    NO_SHOW:     { bg: '#fce7f3', color: '#9d174d', border: '#ec4899', label: 'No Show' },
};

const ReservationCalendar = ({ onEditReservation }) => {
    const [reservations, setReservations] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({ checkIn: '', checkOut: '', roomId: '', guestId: '', ratePerNight: '', adults: 1, children: 0, source: 'DIRECT' });
    const [loading, setLoading] = useState(true);
    const [availableRooms, setAvailableRooms] = useState([]);
    const calendarRef = useRef(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('[Calendar] Fetching data...');
            const [res, rm, gst] = await Promise.all([
                api.get('/pms/reservations/calendar'),
                api.get('/pms/rooms'),
                api.get('/pms/guests'),
            ]);
            console.log('[Calendar] Reservations:', res.data?.length);
            console.log('[Calendar] Rooms:', rm.data?.length);
            console.log('[Calendar] Guests:', gst.data?.length);
            setReservations(res.data || []);
            setRooms(rm.data || []);
            setGuests(gst.data || []);
        } catch (e) { 
            console.error('[Calendar] Error:', e);
            console.error('[Calendar] Error response:', e.response?.data);
            Swal.fire('Error', e.response?.data?.message || e.message || 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableRooms = async (checkIn, checkOut) => {
        if (!checkIn || !checkOut) {
            setAvailableRooms(rooms);
            return;
        }
        try {
            const avail = await api.get(`/pms/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
            setAvailableRooms(avail.data.rooms || []);
        } catch (e) {
            setAvailableRooms(rooms);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const events = reservations
        .filter(r => r.status !== 'CANCELLED')
        .map(r => {
            const cfg = STATUS_COLORS[r.status] || STATUS_COLORS.PENDING;
            return {
                id: r.id,
                title: `${r.guest?.firstName || ''} ${r.guest?.lastName || ''}`,
                start: r.checkIn,
                end: r.checkOut,
                backgroundColor: cfg.bg,
                borderColor: cfg.border,
                textColor: cfg.color,
                extendedProps: {
                    reservationNumber: r.reservationNumber,
                    room: r.room,
                    guest: r.guest,
                    status: r.status,
                    totalAmount: r.totalAmount,
                    ratePerNight: r.ratePerNight,
                    nights: Math.ceil((new Date(r.checkOut) - new Date(r.checkIn)) / (1000 * 60 * 60 * 24)),
                }
            };
        });

    const handleDateSelect = (selectInfo) => {
        setCreateForm({
            checkIn: selectInfo.startStr.split('T')[0],
            checkOut: selectInfo.endStr.split('T')[0],
            roomId: '',
            guestId: '',
            ratePerNight: '',
            adults: 1,
            children: 0,
            source: 'DIRECT'
        });
        setShowCreateForm(true);
    };
    
    const handleRoomChange = (roomId) => {
        const room = (availableRooms.length > 0 ? availableRooms : rooms).find(r => r.id === roomId);
        setCreateForm(prev => ({
            ...prev,
            roomId,
            ratePerNight: room?.roomType?.basePrice || ''
        }));
    };

    const handleDatesChange = (checkIn, checkOut) => {
        setCreateForm(prev => ({ ...prev, checkIn, checkOut }));
        fetchAvailableRooms(checkIn, checkOut);
    };

    const handleCreateReservation = async () => {
        if (!createForm.roomId || !createForm.guestId || !createForm.checkIn || !createForm.checkOut || !createForm.ratePerNight) {
            Swal.fire('Campos incompletos', 'Completa todos los campos requeridos', 'warning');
            return;
        }
        
        const conflicts = reservations.filter(r => {
            if (r.room?.id !== createForm.roomId) return false;
            if (r.status === 'CANCELLED') return false;
            const rCheckIn = new Date(r.checkIn);
            const rCheckOut = new Date(r.checkOut);
            const fCheckIn = new Date(createForm.checkIn);
            const fCheckOut = new Date(createForm.checkOut);
            return rCheckIn < fCheckOut && rCheckOut > fCheckIn;
        });
        
        if (conflicts.length > 0) {
            Swal.fire('Habitación ocupada', `La habitación ya tiene reservas en esas fechas`, 'warning');
            return;
        }
        
        try {
            await api.post('/pms/reservations', createForm);
            setShowCreateForm(false);
            fetchData();
            Swal.fire('Reserva creada', '', 'success');
        } catch (e) { 
            Swal.fire('Error', e.response?.data?.message || 'Error al crear reserva', 'error'); 
        }
    };
    
    const handleCheckIn = async (id) => {
        try {
            await api.patch(`/pms/reservations/${id}/check-in`);
            setShowDetail(false);
            fetchData();
            Swal.fire('Check-In realizado', 'Huésped registrado', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo hacer Check-In', 'error'); }
    };
    
    const handleCheckOut = async (id) => {
        const { isConfirmed } = await Swal.fire({ 
            title: 'Check-Out', 
            text: '¿Aplicar cargo por late check-out?',
            icon:'question', 
            showCancelButton:true,
            confirmButtonText: 'Con cargo',
            cancelButtonText: 'Sin cargo',
        });
        if (!isConfirmed && !isConfirmed) return;
        try {
            await api.patch(`/pms/reservations/${id}/check-out`, { applyLateFee: isConfirmed });
            setShowDetail(false);
            fetchData();
            Swal.fire('Check-Out realizado', 'Huésped checkout', 'success');
        } catch (e) { 
            if (e.response?.data?.requiresConfirmation) {
                Swal.fire('Info', e.response.data.message, 'info');
            } else {
                Swal.fire('Error', e.response?.data?.message || 'No se pudo hacer Check-Out', 'error'); 
            }
        }
    };

    const handleConfirm = async (id) => {
        try {
            await api.patch(`/pms/reservations/${id}/confirm`);
            setShowDetail(false);
            fetchData();
            Swal.fire('Confirmada', 'Reserva confirmada', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo confirmar', 'error'); }
    };

    const handleEventClick = ({ event }) => {
        setSelectedEvent(event);
        setShowDetail(true);
    };

    const handleEventDrop = async (info) => {
        const newCheckIn = info.event.startStr.split('T')[0];
        const newCheckOut = info.event.endStr.split('T')[0];
        try {
            await api.patch(`/pms/reservations/${info.event.id}/move`, { checkIn: newCheckIn, checkOut: newCheckOut });
            fetchData();
            Swal.fire('Movida', 'Reserva movida exitosamente', 'success');
        } catch (e) {
            info.revert();
            Swal.fire('Error', 'No se pudo mover la reserva', 'error');
        }
    };

    const handleDeleteReservation = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Cancelar reserva?',
            icon: 'warning',
            showCancelButton: true,
        });
        if (!isConfirmed) return;
        try {
            await api.patch(`/pms/reservations/${id}/cancel`);
            setShowDetail(false);
            fetchData();
            Swal.fire('Cancelada', 'Reserva cancelada', 'success');
        } catch (e) { Swal.fire('Error', 'No se pudo cancelar', 'error'); }
    };

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>Calendario de Reservas</h2>
                    <p style={s.subtitle}>Clic y arrastra para crear o mover reservas</p>
                </div>
                <div style={s.legend}>
                    {Object.entries(STATUS_COLORS).map(([k, v]) => (
                        <div key={k} style={{ ...s.legendItem, background: v.bg, color: v.color, border: `2px solid ${v.border}` }}>
                            {v.label}
                        </div>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={s.loader}>Cargando...</div>
            ) : (
                <div style={s.calendar}>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek'
                        }}
                        locale={esLocale}
                        buttonText={{
                            today: 'Hoy',
                            month: 'Mes',
                            week: 'Semana',
                            list: 'Lista'
                        }}
                        events={events}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        eventContent={(arg) => (
                            <div style={{ ...s.eventContent, background: arg.event.backgroundColor, borderColor: arg.event.borderColor }}>
                                <strong style={{ color: arg.event.textColor }}>{arg.event.title}</strong>
                                <div style={{ fontSize: '11px', color: arg.event.textColor, opacity: 0.8 }}>
                                    #{arg.event.extendedProps.reservationNumber}
                                </div>
                                <div style={{ fontSize: '11px', color: arg.event.textColor, opacity: 0.8 }}>
                                    Hab. {arg.event.extendedProps.room?.number}
                                </div>
                            </div>
                        )}
                        eventClassNames={(arg) => [s.fcEvent]}
                    />
                </div>
            )}

            {showCreateForm && (
                <div style={s.modalOverlay} onClick={() => setShowCreateForm(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>Nueva Reserva</h3>
                            <button style={s.btnClose} onClick={() => setShowCreateForm(false)}><X size={18} /></button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={s.ig}><label style={s.lbl}>Huésped *</label>
                                <select style={s.inp} value={createForm.guestId} onChange={e => setCreateForm({ ...createForm, guestId: e.target.value })}>
                                    <option value="">Seleccionar huésped...</option>
                                    {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName} - {g.docNumber}</option>)}
                                </select>
                            </div>
                            <div style={s.ig}><label style={s.lbl}>Habitación *</label>
                                <select style={s.inp} value={createForm.roomId} onChange={e => handleRoomChange(e.target.value)}>
                                    <option value="">Seleccionar...</option>
                                    {availableRooms.length > 0 ? availableRooms.map(r => (
                                        <option key={r.id} value={r.id}>Hab. {r.number} - {r.roomType?.name} ($ {Number(r.roomType?.basePrice || 0).toLocaleString()})</option>
                                    )) : rooms.map(r => (
                                        <option key={r.id} value={r.id}>Hab. {r.number} - {r.roomType?.name} ($ {Number(r.roomType?.basePrice || 0).toLocaleString()}/noche)</option>
                                    ))}
                                </select>
                            </div>
                            <div style={s.ig}><label style={s.lbl}>Check-In *</label><input style={s.inp} type="date" value={createForm.checkIn} onChange={e => handleDatesChange(e.target.value, createForm.checkOut)} /></div>
                            <div style={s.ig}><label style={s.lbl}>Check-Out *</label><input style={s.inp} type="date" value={createForm.checkOut} onChange={e => handleDatesChange(createForm.checkIn, e.target.value)} /></div>
                            <div style={s.ig}><label style={s.lbl}>Tarifa/Noche *</label><input style={s.inp} type="number" value={createForm.ratePerNight} onChange={e => setCreateForm({ ...createForm, ratePerNight: e.target.value })} placeholder="150000" /></div>
                            <div style={s.ig}><label style={s.lbl}>Adultos</label><input style={s.inp} type="number" min="1" value={createForm.adults} onChange={e => setCreateForm({ ...createForm, adults: Number(e.target.value) })} /></div>
                            <div style={s.ig}><label style={s.lbl}>Niños</label><input style={s.inp} type="number" min="0" value={createForm.children} onChange={e => setCreateForm({ ...createForm, children: Number(e.target.value) })} /></div>
                            <div style={s.ig}><label style={s.lbl}>Canal</label>
                                <select style={s.inp} value={createForm.source} onChange={e => setCreateForm({ ...createForm, source: e.target.value })}>
                                    <option value="DIRECT">Directo</option>
                                    <option value="PHONE">Teléfono</option>
                                    <option value="WALK_IN">Walk-in</option>
                                    <option value="OTA">OTA</option>
                                    <option value="CORPORATE">Corporativo</option>
                                </select>
                            </div>
                        </div>
                        <div style={s.modalFooter}>
                            <button style={s.btnSec} onClick={() => setShowCreateForm(false)}>Cancelar</button>
                            <button style={s.btnPrimary} onClick={handleCreateReservation}><Plus size={14} /> Crear</button>
                        </div>
                    </div>
                </div>
            )}

            {showDetail && selectedEvent && (
                <div style={s.modalOverlay} onClick={() => setShowDetail(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>Reserva {selectedEvent.extendedProps.reservationNumber}</h3>
                            <button style={s.btnClose} onClick={() => setShowDetail(false)}><X size={18} /></button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={s.detailRow}><span style={s.detailLabel}>Huésped</span><span style={s.detailValue}>{selectedEvent.extendedProps.guest?.firstName} {selectedEvent.extendedProps.guest?.lastName}</span></div>
                            <div style={s.detailRow}><span style={s.detailLabel}>Habitación</span><span style={s.detailValue}>#{selectedEvent.extendedProps.room?.number} - {selectedEvent.extendedProps.room?.roomType?.name}</span></div>
                            <div style={s.detailRow}><span style={s.detailLabel}>Check-In</span><span style={s.detailValue}>{new Date(selectedEvent.start).toLocaleDateString('es-CO')}</span></div>
                            <div style={s.detailRow}><span style={s.detailLabel}>Check-Out</span><span style={s.detailValue}>{new Date(selectedEvent.end).toLocaleDateString('es-CO')}</span></div>
                            <div style={s.detailRow}><span style={s.detailLabel}>Noches</span><span style={s.detailValue}>{selectedEvent.extendedProps.nights}</span></div>
                            <div style={s.detailRow}><span style={s.detailLabel}>Total</span><span style={{ ...s.detailValue, fontWeight: '800', color: 'var(--primary)' }}>$ {Number(selectedEvent.extendedProps.totalAmount).toLocaleString()}</span></div>
                            <div style={s.detailRow}>
                                <span style={s.detailLabel}>Estado</span>
                                <span style={{ ...s.badge, background: STATUS_COLORS[selectedEvent.extendedProps.status]?.bg, color: STATUS_COLORS[selectedEvent.extendedProps.status]?.color }}>
                                    {STATUS_COLORS[selectedEvent.extendedProps.status]?.label}
                                </span>
                            </div>
                        </div>
                        <div style={s.modalFooter}>
                            {selectedEvent.extendedProps.status === 'PENDING' && (
                                <button style={s.btnConfirm} onClick={() => handleConfirm(selectedEvent.id)}>
                                    <CheckCircle size={14} /> Confirmar
                                </button>
                            )}
                            {selectedEvent.extendedProps.status === 'CONFIRMED' && (
                                <button style={s.btnCheckIn} onClick={() => handleCheckIn(selectedEvent.id)}>
                                    <LogIn size={14} /> Check-In
                                </button>
                            )}
                            {selectedEvent.extendedProps.status === 'CHECKED_IN' && (
                                <button style={s.btnCheckOut} onClick={() => handleCheckOut(selectedEvent.id)}>
                                    <LogOut size={14} /> Check-Out
                                </button>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(selectedEvent.extendedProps.status) && (
                                <button style={s.btnDelete} onClick={() => handleDeleteReservation(selectedEvent.id)}>
                                    <Trash2 size={14} /> Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    container: { display: 'flex', flexDirection: 'column', height: '100%' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 },
    subtitle: { fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' },
    legend: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    legendItem: { padding: '4px 10px', borderRadius: 16, fontSize: '11px', fontWeight: '700' },
    calendar: { flex: 1, overflow: 'hidden' },
    loader: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' },
    fcEvent: { borderRadius: '6px !important', overflow: 'hidden' },
    eventContent: { padding: '4px 6px', height: '100%' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: 'white', borderRadius: 20, width: 480, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' },
    modalTitle: { fontSize: '18px', fontWeight: '800', margin: 0 },
    btnClose: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' },
    modalBody: { padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
    modalFooter: { display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' },
    ig: { display: 'flex', flexDirection: 'column', gap: 6 },
    lbl: { fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' },
    inp: { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnSec: { padding: '10px 20px', background: '#f1f5f9', color: 'var(--text-main)', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnDelete: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnConfirm: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnCheckIn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnCheckOut: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
    detailLabel: { fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' },
    detailValue: { fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' },
    badge: { padding: '4px 12px', borderRadius: 20, fontWeight: '700', fontSize: '12px' },
};

export default ReservationCalendar;