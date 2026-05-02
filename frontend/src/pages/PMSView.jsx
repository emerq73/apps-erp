import React, { useState, useEffect } from 'react';
import { Bed, Users, Calendar, Settings, BarChart2, Search, Wallet } from 'lucide-react';
import api from '../services/auth.service';
import Swal from 'sweetalert2';
import RoomManager from './pms/RoomManager';
import GuestManager from './pms/GuestManager';
import ReservationManager from './pms/ReservationManager';
import ReservationCalendar from './pms/ReservationCalendar';
import RateManager from './pms/RateManager';
import ReportManager from './pms/ReportManager';
import HousekeepingManager from './pms/HousekeepingManager';
import MaintenanceManager from './pms/MaintenanceManager';
import RestaurantManager from './pms/RestaurantManager';
import TapeChart from './pms/TapeChart';


const BookingEngineWidget = () => {
    const userStr = localStorage.getItem('user');
    const companyId = userStr ? JSON.parse(userStr).companyId : '';
    const url = `${window.location.origin}/booking/${companyId}`;
    return (
        <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{marginTop:0}}>Motor de Reservas Públicas</h2>
            <p style={{ color: '#475569', marginBottom: '16px' }}>Comparte este enlace con tus clientes para que reserven directamente:</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                <input type="text" readOnly value={url} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px' }} />
                <button style={{padding: '10px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => { navigator.clipboard.writeText(url); Swal.fire('Copiado', 'Enlace copiado al portapapeles', 'success'); }}>Copiar</button>
                <a href={url} target="_blank" rel="noreferrer" style={{ padding: '10px 16px', background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none' }}>Abrir URL</a>
            </div>
            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', color: '#166534', fontSize: '14px' }}>
                <strong>💡 Tip:</strong> Puedes añadir este enlace en tu Instagram, Facebook o enviarlo por WhatsApp.
            </div>
        </div>
    );
};

const STATUS_CONFIG = {
    AVAILABLE: { label: 'Disponible', color: '#10b981', bg: '#d1fae5' },
    OCCUPIED: { label: 'Ocupada', color: '#f59e0b', bg: '#fef3c7' },
    CLEANING: { label: 'Limpieza', color: '#8b5cf6', bg: '#ede9fe' },
    MAINTENANCE: { label: 'Mantenimiento', color: '#ef4444', bg: '#fee2e2' },
    BLOCKED: { label: 'Bloqueada', color: '#6b7280', bg: '#f3f4f6' },
};

const s = {
    container: { display: 'flex', height: '100%', background: 'white', borderRadius: '16px', overflow: 'hidden' },
    sidebar: { width: '220px', background: '#f8fafc', borderRight: '1px solid var(--border)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' },
    sidebarHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px 20px', borderBottom: '1px solid var(--border)', marginBottom: '8px' },
    sidebarTitle: { fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' },
    tab: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px', textAlign: 'left' },
    tabActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '700', fontSize: '14px', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    content: { flex: 1, padding: '28px', overflowY: 'auto' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    pageTitle: { fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: 0 },
    btnIcon: { display: 'flex', alignItems: 'center', padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '12px', marginBottom: '20px' },
    kpiCard: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '16px' },
    kpiValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#1e293b', lineHeight: 1 },
    kpiLabel: { display: 'block', fontSize: '13px', fontWeight: '600', marginTop: '4px' },
    sectionTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' },
    roomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '14px' },
    roomCard: { background: 'white', border: '2px solid', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' },
    roomNumber: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '16px', padding: '6px 10px', borderRadius: '8px' },
    roomType: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' },
    roomBadge: { fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' },
    statusSelect: { width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', background: 'white', cursor: 'pointer', marginTop: '4px' },
    searchInput: { width: '100%', padding: '12px 16px', border: '2px solid var(--border)', borderRadius: '10px', fontSize: '15px', marginBottom: '20px' },
    resultCard: { background: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
    drawerOpen: { background: '#d1fae5', border: '2px solid #10b981', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
    drawerClosed: { background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
    drawerAmount: { fontSize: '28px', fontWeight: '800' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    btnSec: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' },
};

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await api.get(`/pms/reservations/search?q=${encodeURIComponent(query)}`);
            setResults(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <h2 style={s.pageTitle}>Búsqueda Global</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
                <input style={s.searchInput} placeholder="Buscar por nombre, número de confirmación, ID..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <button style={s.btnPrimary} onClick={handleSearch}><Search size={18} /> Buscar</button>
            </div>
            {results && (
                <div>
                    {results.guests?.length > 0 && (
                        <>
                            <h3 style={s.sectionTitle}>Huéspedes</h3>
                            {results.guests.map(g => (
                                <div key={g.id} style={s.resultCard}>
                                    <strong>{g.firstName} {g.lastName}</strong>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>{g.email} • {g.phone}</div>
                                </div>
                            ))}
                        </>
                    )}
                    {results.reservations?.length > 0 && (
                        <>
                            <h3 style={s.sectionTitle}>Reservas</h3>
                            {results.reservations.map(r => (
                                <div key={r.id} style={s.resultCard}>
                                    <strong>#{r.reservationNumber}</strong>
                                    <div>{r.guest?.firstName} {r.guest?.lastName}</div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const CashDrawerView = () => {
    const [drawer, setDrawer] = useState(null);
    const [openingAmount, setOpeningAmount] = useState(0);
    const [actualAmount, setActualAmount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchDrawer = async () => {
        try {
            const res = await api.get('/pms/cash-drawer');
            setDrawer(res.data);
            setActualAmount(res.data?.actualAmount || 0);
        } catch (e) { setDrawer(null); }
    };

    useEffect(() => { fetchDrawer(); }, []);

    const handleOpen = async () => {
        setLoading(true);
        try {
            await api.post('/pms/cash-drawer/open', { openingAmount: Number(openingAmount) });
            fetchDrawer();
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
        finally { setLoading(false); }
    };

    const handleClose = async () => {
        setLoading(true);
        try {
            await api.post('/pms/cash-drawer/close', { actualAmount: Number(actualAmount) });
            fetchDrawer();
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
        finally { setLoading(false); }
    };

    const handleAudit = async () => {
        setLoading(true);
        try {
            await api.post('/pms/cash-drawer/audit', { auditType: 'HOURLY', actualAmount: Number(actualAmount) });
            fetchDrawer();
            Swal.fire('Éxito', 'Cuadre realizado', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <h2 style={s.pageTitle}>Caja</h2>
            {!drawer ? (
                <div style={s.drawerClosed}>
                    <h3>Caja Cerrada</h3>
                    <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Monto de Apertura</label>
                        <input type="number" style={s.input} value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} />
                        <button style={s.btnPrimary} onClick={handleOpen} disabled={loading}><Wallet size={16} /> Abrir Caja</button>
                    </div>
                </div>
            ) : (
                <div style={s.drawerOpen}>
                    <h3>Caja Abierta</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginTop: '16px' }}>
                        <div><span style={{ fontSize: '12px', color: '#64748b' }}>Monto Apertura</span><div style={s.drawerAmount}>${Number(drawer.openingAmount).toLocaleString()}</div></div>
                        <div><span style={{ fontSize: '12px', color: '#64748b' }}>Esperado</span><div style={s.drawerAmount}>${Number(drawer.expectedAmount).toLocaleString()}</div></div>
                        <div><span style={{ fontSize: '12px', color: '#64748b' }}>Diferencia</span><div style={{ ...s.drawerAmount, color: Number(drawer.difference) < 0 ? '#ef4444' : '#10b981' }}>${Number(drawer.difference || 0).toLocaleString()}</div></div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <input type="number" style={{ ...s.input, width: '150px' }} value={actualAmount} onChange={e => setActualAmount(e.target.value)} placeholder="Cantidad real" />
                        <button style={s.btnSec} onClick={handleAudit} disabled={loading}>Cuadre</button>
                        <button style={s.btnPrimary} onClick={handleClose} disabled={loading}>Cerrar Caja</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PMSView = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboard, setDashboard] = useState(null);
    const [roomFilter, setRoomFilter] = useState('ALL');
    const [roomTypeFilter, setRoomTypeFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showWalkIn, setShowWalkIn] = useState(false);

    const [viewMode, setViewMode] = useState('grid');

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/pms/dashboard');
            setDashboard(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { 
        if (activeTab === 'dashboard') {
            fetchDashboard(); 
        }
    }, [activeTab]);

    const handleStatusChange = async (roomId, status) => {
        try {
            await api.patch(`/pms/rooms/${roomId}/status`, { status });
            fetchDashboard();
        } catch (e) { Swal.fire('Error', 'No se pudo actualizar el estado', 'error'); }
    };

    const handleQuickCheckOut = async (roomId) => {
        const res = await Swal.fire({
            title: 'Check-out rápido',
            text: '¿Confirmar check-out?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, realizar',
            cancelButtonText: 'Cancelar'
        });
        if (res.isConfirmed) {
            try {
                const guests = dashboard.guestsPerRoom?.[roomId] || [];
                if (guests[0]?.reservationId) {
                    await api.patch(`/pms/reservations/${guests[0].reservationId}/check-out`);
                    fetchDashboard();
                    Swal.fire('Éxito', 'Check-out realizado', 'success');
                }
            } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo realizar check-out', 'error'); }
        }
    };

    const handleExtendStay = async (roomId) => {
        const { value: days } = await Swal.fire({
            title: 'Extender estadía',
            input: 'number',
            inputLabel: 'Días adicionales',
            inputPlaceholder: 'Cantidad de días',
            showCancelButton: true
        });
        if (days) {
            try {
                const guests = dashboard.guestsPerRoom?.[roomId] || [];
                if (guests[0]?.reservationId) {
                    await api.patch(`/pms/reservations/${guests[0].reservationId}/extend`, { additionalDays: Number(days) });
                    fetchDashboard();
                    Swal.fire('Éxito', `Estadía extendida ${days} días`, 'success');
                }
            } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo extender', 'error'); }
        }
    };

    const handleAddCharge = async (roomId) => {
        const { value: formValues } = await Swal.fire({
            title: 'Agregar cargo a habitación',
            html: '<input id="swal-description" class="swal2-input" placeholder="Descripción"><input id="swal-amount" type="number" class="swal2-input" placeholder="Monto">',
            focusConfirm: false,
            preConfirm: () => ({
                description: document.getElementById('swal-description').value,
                amount: document.getElementById('swal-amount').value
            }),
            showCancelButton: true
        });
        if (formValues?.description && formValues?.amount) {
            try {
                const guests = dashboard.guestsPerRoom?.[roomId] || [];
                if (guests[0]?.reservationId) {
                    await api.post(`/pms/reservations/${guests[0].reservationId}/add-charge`, { description: formValues.description, amount: Number(formValues.amount) });
                    Swal.fire('Éxito', 'Cargo agregado', 'success');
                }
            } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo agregar cargo', 'error'); }
        }
    };

    const handleTransferRoom = async (roomId) => {
        const availableRooms = dashboard?.rooms?.filter(r => r.status === 'AVAILABLE' && r.id !== roomId) || [];
        if (availableRooms.length === 0) {
            Swal.fire('No hay habitaciones disponibles para transferir');
            return;
        }
        const { value: newRoomId } = await Swal.fire({
            title: 'Transferir a habitación',
            input: 'select',
            inputOptions: Object.fromEntries(availableRooms.map(r => [r.id, `#${r.number} - ${r.roomType?.name}`])),
            inputPlaceholder: 'Seleccionar habitación',
            showCancelButton: true
        });
        if (newRoomId) {
            try {
                const guests = dashboard.guestsPerRoom?.[roomId] || [];
                if (guests[0]?.reservationId) {
                    await api.patch(`/pms/reservations/${guests[0].reservationId}/transfer`, { newRoomId });
                    fetchDashboard();
                    Swal.fire('Éxito', 'Huésped transferido', 'success');
                }
            } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo transferir', 'error'); }
        }
    };

    const handleCreateWalkIn = async (e) => {
        e.preventDefault();
        const form = e.target;
        try {
            await api.post('/pms/reservations/walk-in', {
                guest: { firstName: form.guestFirstName.value, lastName: form.guestLastName.value, email: form.guestEmail.value, phone: form.guestPhone.value },
                roomTypeId: form.roomTypeId.value,
                checkIn: form.checkIn.value,
                checkOut: form.checkOut.value,
                adults: Number(form.adults.value),
                children: Number(form.children.value)
            });
            Swal.fire('Éxito', 'Reserva walk-in creada', 'success');
            setShowWalkIn(false);
            fetchDashboard();
        } catch (e) { Swal.fire('Error', 'No se pudo crear reserva', 'error'); }
    };

    const handleGenerateInvoice = async (roomId) => {
        const guests = dashboard.guestsPerRoom?.[roomId] || [];
        if (!guests[0]?.reservationId) {
            Swal.fire('Error', 'No hay reserva para generar factura');
            return;
        }
        try {
            const res = await api.post(`/pms/invoices/from-reservation/${guests[0].reservationId}`);
            Swal.fire('Éxito', `Factura ${res.data.invoiceNumber || 'generada'}`, 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'No se pudo generar factura', 'error'); }
    };

    const handlePreAuthorize = async (roomId) => {
        const { value: amount } = await Swal.fire({
            title: 'Pre-autorizar tarjeta',
            input: 'number',
            inputLabel: 'Monto a pre-autorizar',
            showCancelButton: true
        });
        if (amount) {
            try {
                const guests = dashboard.guestsPerRoom?.[roomId] || [];
                if (guests[0]?.reservationNumber) {
                    await api.post(`/pms/invoices/${guests[0].reservationNumber}/pre-authorize`, { amount: Number(amount) });
                    Swal.fire('Éxito', 'Pre-autorización creada', 'success');
                }
            } catch (e) { Swal.fire('Error', 'No se pudo pre-autorizar', 'error'); }
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'Tablero', icon: <BarChart2 size={18} /> },
        { id: 'search', label: 'Buscar', icon: <Search size={18} /> },
        { id: 'roomTypes', label: 'Tipos Hab.', icon: <Settings size={18} /> },
        { id: 'rooms', label: 'Habitaciones', icon: <Bed size={18} /> },
        { id: 'guests', label: 'Huéspedes', icon: <Users size={18} /> },
        { id: 'reservations', label: 'Reservas', icon: <Calendar size={18} /> },
        { id: 'calendar', label: 'Calendario', icon: <Calendar size={18} /> },
        { id: 'tapeChart', label: 'Tablero (Cinta)', icon: <span>📊</span> },
        { id: 'housekeeping', label: 'Limpieza', icon: <span>🧹</span> },
        { id: 'maintenance', label: 'Mantenimiento', icon: <span>🔧</span> },
        { id: 'restaurant', label: 'Restaurante', icon: <span>🍽️</span> },
        { id: 'cashDrawer', label: 'Caja', icon: <Wallet size={18} /> },
        { id: 'bookingEngine', label: 'Motor Reservas', icon: <span>🔗</span> },
        { id: 'rates', label: 'Tarifas', icon: <span>$</span> },
        { id: 'reports', label: 'Reportes', icon: <BarChart2 size={18} /> },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'search': return <GlobalSearch />;
            case 'cashDrawer': return <CashDrawerView />;
            case 'dashboard': return (
                <div>
                    <div style={s.pageHeader}>
                        <h2 style={s.pageTitle}>Tablero de Ocupación</h2>
                        <button style={s.btnIcon} onClick={fetchDashboard}><span>↻</span></button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <select style={{ ...s.input, width: '140px' }} value={roomFilter} onChange={e => setRoomFilter(e.target.value)}>
                            <option value="ALL">Todos los estados</option>
                            <option value="AVAILABLE">Disponible</option>
                            <option value="OCCUPIED">Ocupada</option>
                            <option value="CLEANING">Limpieza</option>
                            <option value="MAINTENANCE">Mantenimiento</option>
                            <option value="BLOCKED">Bloqueada</option>
                        </select>
                        <select style={{ ...s.input, width: '140px' }} value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}>
                            <option value="ALL">Todos los tipos</option>
                            {dashboard?.rooms?.filter((v,i,a)=>a.findIndex(t=>(t.roomType?.id===v.roomType?.id))===i).map(r => (
                                <option key={r.roomType?.id} value={r.roomType?.id}>{r.roomType?.name}</option>
                            ))}
                        </select>
                        <button style={s.btnSec} onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                            {sortOrder === 'asc' ? '↑' : '↓'} Orden
                        </button>
                    </div>

                    <div style={s.kpiGrid}>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #10b981' }}><span style={{ ...s.kpiLabel, color: '#10b981' }}>Total Hab.</span><span style={s.kpiValue}>{dashboard?.totalRooms || 0}</span></div>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #f59e0b' }}><span style={{ ...s.kpiLabel, color: '#f59e0b' }}>Ocupadas</span><span style={s.kpiValue}>{dashboard?.occupied || 0}</span></div>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #3b82f6' }}><span style={{ ...s.kpiLabel, color: '#3b82f6' }}>Disponibles</span><span style={s.kpiValue}>{dashboard?.available || 0}</span></div>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #8b5cf6' }}><span style={{ ...s.kpiLabel, color: '#8b5cf6' }}>Limpieza</span><span style={s.kpiValue}>{dashboard?.cleaning || 0}</span></div>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #ef4444' }}><span style={{ ...s.kpiLabel, color: '#ef4444' }}>Mantenimiento</span><span style={s.kpiValue}>{dashboard?.maintenance || 0}</span></div>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #0ea5e9' }}><span style={{ ...s.kpiLabel, color: '#0ea5e9' }}>Ocupación</span><span style={s.kpiValue}>{dashboard?.occupancyRate || 0}%</span></div>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #ec4899' }}><span style={{ ...s.kpiLabel, color: '#ec4899' }}>ADR</span><span style={s.kpiValue}>${dashboard?.stats?.adr?.toLocaleString() || 0}</span></div>
                        <div style={{ ...s.kpiCard, borderLeft: '4px solid #14b8a6' }}><span style={{ ...s.kpiLabel, color: '#14b8a6' }}>RevPAR</span><span style={s.kpiValue}>${dashboard?.stats?.revpar?.toLocaleString() || 0}</span></div>
                    </div>

                    {dashboard?.stats?.weeklyTrend?.length > 0 && (
                        <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Tendencia Semanal (Últimos 7 días)</div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px' }}>
                                {dashboard.stats.weeklyTrend.map((day, i) => {
                                    const maxVal = Math.max(...dashboard.stats.weeklyTrend.map(d => d.revenue || 1), 1);
                                    const height = Math.max((day.revenue / maxVal) * 60, 4);
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ width: '100%', height: `${height}px`, background: '#3b82f6', borderRadius: '4px 4px 0 0' }} title={`$${day.revenue?.toLocaleString() || 0}`}></div>
                                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>{new Date(day.date).toLocaleDateString('es-DO', { weekday: 'short' })}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {dashboard?.alerts?.length > 0 && (
                        <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            <div style={{ fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>Alertas ({dashboard.alerts.length})</div>
                            {dashboard.alerts.map((alert, i) => (
                                <div key={i} style={{ fontSize: '12px', padding: '4px 0', color: alert.type === 'RED' ? '#dc2626' : alert.type === 'YELLOW' ? '#d97706' : '#92400e' }}>
                                    {alert.type === 'RED' ? '🔴' : alert.type === 'YELLOW' ? '🟡' : '⏰'} {alert.message} - Hab. #{alert.roomNumber} ({alert.reservationNumber})
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                            <div style={{ fontWeight: '700', color: '#059669', marginBottom: '8px' }}>Llegadas Hoy ({dashboard?.arrivingToday?.length || 0})</div>
                            {dashboard?.arrivingToday?.slice(0,3).map((g, i) => (
                                <div key={i} style={{ fontSize: '13px', padding: '4px 0', color: '#065f46' }}>• {g.guestName} (Hab. #{g.roomNumber})</div>
                            ))}
                            {(!dashboard?.arrivingToday?.length) && <div style={{ fontSize: '12px', color: '#6b7280' }}>Sin llegadas</div>}
                        </div>
                        <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            <div style={{ fontWeight: '700', color: '#d97706', marginBottom: '8px' }}>Salidas Hoy ({dashboard?.departingToday?.length || 0})</div>
                            {dashboard?.departingToday?.slice(0,3).map((g, i) => (
                                <div key={i} style={{ fontSize: '13px', padding: '4px 0', color: '#92400e' }}>• {g.guestName} (Hab. #{g.roomNumber})</div>
                            ))}
                            {(!dashboard?.departingToday?.length) && <div style={{ fontSize: '12px', color: '#6b7280' }}>Sin salidas</div>}
                        </div>
                    </div>

                    <div style={s.roomGrid}>
                        {dashboard?.rooms?.filter(room => {
                            if (roomFilter !== 'ALL' && room.status !== roomFilter) return false;
                            if (roomTypeFilter !== 'ALL' && room.roomType?.id !== roomTypeFilter) return false;
                            return true;
                        }).sort((a, b) => sortOrder === 'asc' ? a.number - b.number : b.number - a.number).map(room => {
                            const roomId = room.id?.toString();
                            const guests = roomId ? (dashboard.guestsPerRoom?.[roomId] || []) : [];
                            const currentGuest = guests[0];
                            const isOccupied = room.status === 'OCCUPIED' || guests.length > 0;
                            return (
                            <div key={room.id} onClick={() => setSelectedRoom(room.id === selectedRoom ? null : room.id)} style={{ ...s.roomCard, borderColor: STATUS_CONFIG[room.status]?.color || '#e2e8f0', cursor: 'pointer' }}>
                                <div style={s.roomNumber}>#{room.number}</div>
                                <div style={s.roomType}>{room.roomType?.name}</div>
                                <div style={{ ...s.roomBadge, background: STATUS_CONFIG[room.status]?.bg, color: STATUS_CONFIG[room.status]?.color }}>{STATUS_CONFIG[room.status]?.label}</div>
                                {currentGuest && (
                                    <div style={{ marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '4px', fontSize: '12px' }}>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{currentGuest.guestName || 'Sin huésped'}</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Salida: {currentGuest.checkOut ? new Date(currentGuest.checkOut).toLocaleDateString('es-DO') : '-'}</div>
                                        {currentGuest.hasRedAlert && <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '600' }}> ⚠</span>}
                                        {currentGuest.hasYellowAlert && <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '600' }}> ⚠</span>}
                                    </div>
                                )}
                                {selectedRoom === room.id && (
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        <button style={{ ...s.btnSec, padding: '4px 8px', fontSize: '10px', flex: 1 }} onClick={(e) => { e.stopPropagation(); Swal.fire({ title: `Habitación #${room.number}`, html: `<div style="text-align:left;font-size:13px">
                                            <strong>Huésped:</strong> ${currentGuest?.guestName || '-'}<br/>
                                            <strong>Email:</strong> ${currentGuest?.guestEmail || '-'}<br/>
                                            <strong>Teléfono:</strong> ${currentGuest?.guestPhone || '-'}<br/>
                                            <strong>Check-in:</strong> ${currentGuest?.actualCheckIn ? new Date(currentGuest.actualCheckIn).toLocaleString('es-DO') : currentGuest?.checkIn ? new Date(currentGuest.checkIn).toLocaleDateString('es-DO') : '-'}<br/>
                                            <strong>Check-out:</strong> ${currentGuest?.checkOut ? new Date(currentGuest.checkOut).toLocaleDateString('es-DO') : '-'}<br/>
                                            <strong>Reserva:</strong> ${currentGuest?.reservationNumber || '-'}<br/>
                                            ${currentGuest?.alertMessage ? `<br/><strong style="color:${currentGuest?.hasRedAlert ? '#ef4444' : '#f59e0b'}">⚠ ${currentGuest.alertMessage}</strong>` : ''}
                                        </div>`, icon: 'info' }); }}>
                                            Ver
                                        </button>
                                        {isOccupied && <button style={{ ...s.btnSec, padding: '4px 8px', fontSize: '10px', flex: 1 }} onClick={(e) => { e.stopPropagation(); handleExtendStay(room.id); }}>
                                            +Días
                                        </button>}
                                        {isOccupied && <button style={{ ...s.btnSec, padding: '4px 8px', fontSize: '10px', flex: 1 }} onClick={(e) => { e.stopPropagation(); handleAddCharge(room.id); }}>
                                            +Cargo
                                        </button>}
                                        {isOccupied && <button style={{ ...s.btnSec, padding: '4px 8px', fontSize: '10px', flex: 1 }} onClick={(e) => { e.stopPropagation(); handleTransferRoom(room.id); }}>
                                            Transferir
                                        </button>}
                                        {isOccupied && <button style={{ ...s.btnSec, padding: '4px 8px', fontSize: '10px', flex: 1 }} onClick={(e) => { e.stopPropagation(); handleGenerateInvoice(room.id); }}>
                                            Factura
                                        </button>}
                                        {isOccupied && <button style={{ ...s.btnSec, padding: '4px 8px', fontSize: '10px', flex: 1 }} onClick={(e) => { e.stopPropagation(); handlePreAuthorize(room.id); }}>
                                            Pre-auth
                                        </button>}
                                        {isOccupied && <button style={{ ...s.btnPrimary, padding: '4px 8px', fontSize: '10px', flex: 1, background: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleQuickCheckOut(room.id); }}>
                                            Check-out
                                        </button>}
                                    </div>
                                )}
                                <select style={s.statusSelect} value={room.status} onChange={(e) => handleStatusChange(room.id, e.target.value)}>
                                    <option value="AVAILABLE">Disponible</option>
                                    <option value="OCCUPIED">Ocupada</option>
                                    <option value="CLEANING">Limpieza</option>
                                    <option value="MAINTENANCE">Mantenimiento</option>
                                    <option value="BLOCKED">Bloqueada</option>
                                </select>
                            </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>Acciones Rápidas</h3>
                            <button style={s.btnPrimary} onClick={() => setShowWalkIn(!showWalkIn)}>+ Walk-in</button>
                        </div>
                        {showWalkIn && (
                            <form onSubmit={handleCreateWalkIn} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: 'white', borderRadius: '8px' }}>
                                <input name="guestFirstName" placeholder="Nombre" style={s.input} required />
                                <input name="guestLastName" placeholder="Apellido" style={s.input} required />
                                <input name="guestEmail" type="email" placeholder="Email" style={s.input} />
                                <input name="guestPhone" placeholder="Teléfono" style={s.input} />
                                <select name="roomTypeId" style={s.input} required>
                                    <option value="">Seleccionar tipo</option>
                                    {dashboard?.rooms?.filter((v,i,a)=>a.findIndex(t=>(t.roomType?.id===v.roomType?.id))===i).map(r => (
                                        <option key={r.roomType?.id} value={r.roomType?.id}>{r.roomType?.name}</option>
                                    ))}
                                </select>
                                <input name="adults" type="number" placeholder="Adultos" defaultValue={1} style={s.input} />
                                <input name="children" type="number" placeholder="Niños" defaultValue={0} style={s.input} />
                                <input name="checkIn" type="date" style={s.input} required />
                                <input name="checkOut" type="date" style={s.input} required />
                                <button type="submit" style={{ ...s.btnPrimary, gridColumn: '1 / -1' }}>Crear Reserva</button>
                            </form>
                        )}
                    </div>
                </div>
            );
            case 'roomTypes': return <RoomManager showTypes />;
            case 'rooms': return <RoomManager />;
            case 'guests': return <GuestManager />;
            case 'reservations': return <ReservationManager />;
            case 'calendar': return <ReservationCalendar />;
            case 'tapeChart': return <TapeChart />;
            case 'housekeeping': return <HousekeepingManager />;
            case 'maintenance': return <MaintenanceManager />;
            case 'restaurant': return <RestaurantManager />;
            case 'bookingEngine': return <BookingEngineWidget />;
            case 'rates': return <RateManager />;
            case 'reports': return <ReportManager />;
            default: return <div>Selecciona una opción</div>;
        }
    };

    return (
        <div style={s.container}>
            <div style={s.sidebar}>
                <div style={s.sidebarHeader}>
                    <Bed size={22} color="var(--primary)" />
                    <span style={s.sidebarTitle}>PMS Hotelería</span>
                </div>
                {tabs.map(t => (
                    <button key={t.id} style={activeTab === t.id ? s.tabActive : s.tab} onClick={() => setActiveTab(t.id)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>
            <div style={s.content}>{renderContent()}</div>
        </div>
    );
};

export default PMSView;