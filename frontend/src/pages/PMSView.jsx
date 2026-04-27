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
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px', marginBottom: '20px' },
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

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/pms/dashboard');
            setDashboard(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchDashboard(); }, []);

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
                if (guests[0]?.reservationNumber) {
                    await api.post(`/pms/reservations/${guests[0].reservationNumber}/check-out`);
                    fetchDashboard();
                    Swal.fire('Éxito', 'Check-out realizado', 'success');
                }
            } catch (e) { Swal.fire('Error', 'No se pudo realizar check-out', 'error'); }
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
        { id: 'cashDrawer', label: 'Caja', icon: <Wallet size={18} /> },
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
                    </div>

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
                            const guests = dashboard.guestsPerRoom?.[room.id] || [];
                            return (
                            <div key={room.id} onClick={() => setSelectedRoom(room.id === selectedRoom ? null : room.id)} style={{ ...s.roomCard, borderColor: STATUS_CONFIG[room.status]?.color || '#e2e8f0', cursor: 'pointer' }}>
                                <div style={s.roomNumber}>#{room.number}</div>
                                <div style={s.roomType}>{room.roomType?.name}</div>
                                <div style={{ ...s.roomBadge, background: STATUS_CONFIG[room.status]?.bg, color: STATUS_CONFIG[room.status]?.color }}>{STATUS_CONFIG[room.status]?.label}</div>
                                {guests.length > 0 && (
                                    <div style={{ marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '4px', fontSize: '12px' }}>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{guests[0].guestName}</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Salida: {guests[0].checkOut ? new Date(guests[0].checkOut).toLocaleDateString('es-DO') : '-'}</div>
                                        {guests[0].hasRedAlert && <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '600' }}> ⚠</span>}
                                        {guests[0].hasYellowAlert && <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '600' }}> ⚠</span>}
                                    </div>
                                )}
                                {selectedRoom === room.id && guests.length > 0 && (
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                                        <button style={{ ...s.btnSec, padding: '6px 10px', fontSize: '11px', flex: 1 }} onClick={(e) => { e.stopPropagation(); Swal.fire({ title: `Habitación #${room.number}`, html: `<div style="text-align:left;font-size:13px">
                                            <strong>Huésped:</strong> ${guests[0].guestName}<br/>
                                            <strong>Email:</strong> ${guests[0].guestEmail || '-'}<br/>
                                            <strong>Teléfono:</strong> ${guests[0].guestPhone || '-'}<br/>
                                            <strong>Check-in:</strong> ${guests[0].actualCheckIn ? new Date(guests[0].actualCheckIn).toLocaleString('es-DO') : guests[0].checkIn ? new Date(guests[0].checkIn).toLocaleDateString('es-DO') : '-'}<br/>
                                            <strong>Check-out:</strong> ${guests[0].checkOut ? new Date(guests[0].checkOut).toLocaleDateString('es-DO') : '-'}<br/>
                                            <strong>Reserva:</strong> ${guests[0].reservationNumber || '-'}<br/>
                                            ${guests[0].alertMessage ? `<br/><strong style="color:${guests[0].hasRedAlert ? '#ef4444' : '#f59e0b'}">⚠ ${guests[0].alertMessage}</strong>` : ''}
                                        </div>`, icon: 'info' }); }}>
                                            Ver
                                        </button>
                                        <button style={{ ...s.btnPrimary, padding: '6px 10px', fontSize: '11px', flex: 1, background: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleQuickCheckOut(room.id); }}>
                                            Check-out
                                        </button>
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
                </div>
            );
            case 'roomTypes': return <RoomManager showTypes />;
            case 'rooms': return <RoomManager />;
            case 'guests': return <GuestManager />;
            case 'reservations': return <ReservationManager />;
            case 'calendar': return <ReservationCalendar />;
            case 'housekeeping': return <HousekeepingManager />;
            case 'maintenance': return <MaintenanceManager />;
            case 'restaurant': return <RestaurantManager />;
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