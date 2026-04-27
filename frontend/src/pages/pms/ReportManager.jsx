import React, { useState } from 'react';
import { BarChart3, TrendingUp, Home } from 'lucide-react';
import api from '../../services/auth.service';

const ReportManager = () => {
    const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
    const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);
    const [occupancy, setOccupancy] = useState(null);
    const [revenue, setRevenue] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchOccupancy = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/pms/reports/occupancy?start=${start}&end=${end}`);
            setOccupancy(res.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/pms/reports/revenue?start=${start}&end=${end}`);
            setRevenue(res.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fmtMoney = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v || 0);
    const fmtPct = (v) => `${v || 0}%`;

    return (
        <div className="fade-in">
            <div style={s.header}>
                <h2 style={s.title}>Reportes</h2>
            </div>

            <div style={s.filters}>
                <input style={s.inp} type="date" value={start} onChange={e => setStart(e.target.value)}/>
                <input style={s.inp} type="date" value={end} onChange={e => setEnd(e.target.value)}/>
                <button style={s.btnPrimary} onClick={() => { fetchOccupancy(); fetchRevenue(); }}>Cargar</button>
            </div>

            {occupancy && (
                <div style={s.card}>
                    <h3 style={s.cardTitle}><BarChart3 size={18}/> Ocupación</h3>
                    <div style={s.stats}>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Habitaciones</span>
                            <span style={s.statValue}>{occupancy.totalRooms}</span>
                        </div>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Ocupadas</span>
                            <span style={s.statValue}>{occupancy.occupiedNights}</span>
                        </div>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Tasa Ocupación</span>
                            <span style={s.statValue}>{fmtPct(occupancy.occupancyRate)}</span>
                        </div>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Ingresos Netos</span>
                            <span style={s.statValue}>{fmtMoney(occupancy.netRevenue)}</span>
                        </div>
                    </div>
                </div>
            )}

            {revenue && (
                <div style={s.card}>
                    <h3 style={s.cardTitle}><TrendingUp size={18}/> Ingresos</h3>
                    <div style={s.stats}>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Reservas</span>
                            <span style={s.statValue}>{revenue.bookings}</span>
                        </div>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Check-ins</span>
                            <span style={s.statValue}>{revenue.checkedIn}</span>
                        </div>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Canceladas</span>
                            <span style={s.statValue}>{revenue.cancelled}</span>
                        </div>
                        <div style={s.stat}>
                            <span style={s.statLabel}>Neto</span>
                            <span style={s.statValue}>{fmtMoney(revenue.netRevenue)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    header: { marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', color: '#1e293b' },
    filters: { display: 'flex', gap: '10px', marginBottom: '20px' },
    inp: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' },
    btnPrimary: { padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    card: { background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    cardTitle: { margin: '0 0 16px', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
    stat: { textAlign: 'center' },
    statLabel: { display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' },
    statValue: { display: 'block', fontSize: '20px', fontWeight: '600', color: '#1e293b' },
};

export default ReportManager;