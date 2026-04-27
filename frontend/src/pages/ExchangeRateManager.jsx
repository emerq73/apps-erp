import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, RefreshCw, DollarSign } from 'lucide-react';
import api from '../services/auth.service';
import Swal from 'sweetalert2';

const ExchangeRateManager = () => {
    const [rates, setRates] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        baseCurrencyId: '',
        targetCurrencyId: '',
        rate: '',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ratesRes, currRes] = await Promise.all([
                api.get('/accounting/exchange-rates'),
                api.get('/accounting/currencies')
            ]);
            setRates(ratesRes.data || []);
            setCurrencies(currRes.data || []);
        } catch (e) {
            console.error('[ExchangeRateManager] Error fetching data:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async () => {
        if (!form.baseCurrencyId || !form.targetCurrencyId || !form.rate || !form.date) {
            Swal.fire('Error', 'Todos los campos son obligatorios', 'warning');
            return;
        }
        if (form.baseCurrencyId === form.targetCurrencyId) {
            Swal.fire('Error', 'La moneda base y destino no pueden ser iguales', 'warning');
            return;
        }
        try {
            await api.post('/accounting/exchange-rates', form);
            Swal.fire('Éxito', 'Tasa de cambio guardada', 'success');
            setShowForm(false);
            setForm({ baseCurrencyId: '', targetCurrencyId: '', rate: '', date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Error al guardar', 'error');
        }
    };

    if (loading) return <div style={styles.loader}>Cargando tasas de cambio...</div>;

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Tasas de Cambio</h2>
                    <p style={styles.subtitle}>Gestión de tasas diarias para operaciones en moneda extranjera</p>
                </div>
                <button style={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} /> Nueva Tasa
                </button>
            </div>

            {/* Cards de monedas activas */}
            <div style={styles.cardsGrid}>
                {currencies.map(cur => (
                    <div key={cur.id} style={styles.currencyCard}>
                        <div style={styles.currencyIcon}>{cur.symbol}</div>
                        <div>
                            <div style={styles.currencyCode}>{cur.code}</div>
                            <div style={styles.currencyName}>{cur.name}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Formulario Nueva Tasa */}
            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>Registrar Tasa de Cambio</h3>
                    <div style={styles.formGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Moneda Base (Origen)</label>
                            <select style={styles.select} value={form.baseCurrencyId} onChange={e => setForm({...form, baseCurrencyId: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Moneda Destino (Local)</label>
                            <select style={styles.select} value={form.targetCurrencyId} onChange={e => setForm({...form, targetCurrencyId: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Tasa de Cambio (1 Base = ? Destino)</label>
                            <input style={styles.input} type="number" step="0.0001" placeholder="Ej: 4200.50" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Fecha de Vigencia</label>
                            <input style={styles.input} type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                        </div>
                    </div>
                    <div style={styles.formActions}>
                        <button style={styles.btnSecondary} onClick={() => setShowForm(false)}>Cancelar</button>
                        <button style={styles.btnPrimary} onClick={handleSave}>Guardar Tasa</button>
                    </div>
                </div>
            )}

            {/* Tabla de Tasas Históricas */}
            <div style={styles.tableCard}>
                <div style={styles.tableHeader}>
                    <h3 style={styles.tableTitle}><TrendingUp size={18} /> Historial de Tasas</h3>
                    <button style={styles.btnIcon} onClick={fetchData}><RefreshCw size={16} /></button>
                </div>
                {rates.length === 0 ? (
                    <div style={styles.empty}>
                        <DollarSign size={40} color="#cbd5e1" />
                        <p>No hay tasas registradas. Registra la primera tasa de cambio.</p>
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Fecha</th>
                                <th style={styles.th}>Par de Monedas</th>
                                <th style={styles.th}>Tasa</th>
                                <th style={styles.th}>Inversa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rates.map((r, i) => (
                                <tr key={i} style={styles.tr}>
                                    <td style={styles.td}>{new Date(r.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>{r.baseCurrency?.code}</span>
                                        <span style={{ color: '#94a3b8', margin: '0 8px' }}>→</span>
                                        <span style={styles.badge}>{r.targetCurrency?.code}</span>
                                    </td>
                                    <td style={{ ...styles.td, fontWeight: '700', color: 'var(--primary)' }}>
                                        {Number(r.rate).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </td>
                                    <td style={{ ...styles.td, color: '#64748b', fontSize: '13px' }}>
                                        1 {r.targetCurrency?.code} = {(1 / Number(r.rate)).toFixed(6)} {r.baseCurrency?.code}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '4px', display: 'flex', flexDirection: 'column', gap: '24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: 0 },
    subtitle: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
    btnSecondary: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f1f5f9', color: 'var(--text-main)', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
    btnIcon: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f1f5f9', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' },
    currencyCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    currencyIcon: { width: '42px', height: '42px', background: 'linear-gradient(135deg, var(--primary), #0ea5e9)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '800', flexShrink: 0 },
    currencyCode: { fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' },
    currencyName: { fontSize: '12px', color: 'var(--text-muted)' },
    formCard: { background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
    formTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '20px', marginTop: 0 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' },
    input: { padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' },
    select: { padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', cursor: 'pointer', background: 'white' },
    tableCard: { background: 'white', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
    tableTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', background: '#f8fafc', borderBottom: '1px solid var(--border)' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '14px 20px', fontSize: '14px', color: 'var(--text-main)' },
    badge: { display: 'inline-block', padding: '2px 8px', background: '#eff6ff', color: 'var(--primary)', borderRadius: '6px', fontWeight: '700', fontSize: '13px' },
    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'var(--text-muted)', gap: '12px' },
    loader: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'var(--text-muted)' },
};

export default ExchangeRateManager;
