import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Plus, Wallet, Calendar, Users, TrendingUp, CheckCircle, Search, DollarSign } from 'lucide-react';
import Swal from 'sweetalert2';

const AccountsReceivableManager = () => {
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        customerId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        totalAmount: '',
        notes: ''
    });

    useEffect(() => {
        fetchInvoices();
        fetchCustomers();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/accounting/accounts-receivable');
            setInvoices(res.data);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/accounting/third-parties');
            setCustomers(res.data);
        } catch (err) {
            console.error('Error fetching customers:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/accounting/accounts-receivable', formData);
            Swal.fire('Registrado', 'Factura de cliente registrada con éxito', 'success');
            setShowForm(false);
            setFormData({
                invoiceNumber: '',
                customerId: '',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date().toISOString().split('T')[0],
                totalAmount: '',
                notes: ''
            });
            fetchInvoices();
        } catch (err) {
            Swal.fire('Error', 'No se pudo registrar la factura', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status, dueDate) => {
        const isOverdue = new Date(dueDate) < new Date() && status !== 'PAID';
        if (isOverdue) return { bg: '#fef2f2', text: '#ef4444', label: 'VENCIDA' };
        
        switch (status) {
            case 'PAID': return { bg: '#ecfdf5', text: '#10b981', label: 'COBRADA' };
            case 'PARTIAL': return { bg: '#eff6ff', text: '#3b82f6', label: 'PARCIAL' };
            default: return { bg: '#fffbeb', text: '#f59e0b', label: 'PENDIENTE' };
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <Wallet size={24} color="#10b981" />
                    <h2 style={styles.title}>Cuentas por Cobrar (CxC)</h2>
                </div>
                <button style={{ ...styles.addButton, background: '#10b981' }} onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} />
                    {showForm ? 'Cancelar' : 'Nueva Factura'}
                </button>
            </div>

            {showForm && (
                <div style={styles.formCard} className="fade-in">
                    <h3 style={styles.formTitle}>Registrar Factura de Venta / Cartera</h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Número de Factura</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={formData.invoiceNumber}
                                    onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                    required
                                    placeholder="V-1001"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Cliente</label>
                                <select
                                    style={styles.input}
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione Cliente...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.nit})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Fecha Factura</label>
                                <input
                                    type="date"
                                    style={styles.input}
                                    value={formData.issueDate}
                                    onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Fecha Vencimiento</label>
                                <input
                                    type="date"
                                    style={styles.input}
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Valor a Cobrar</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={formData.totalAmount}
                                    onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                    required
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div style={styles.formActions}>
                            <button type="submit" style={{ ...styles.saveButton, background: '#10b981' }} disabled={loading}>
                                {loading ? 'Guardando...' : 'Registrar CxC'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.statsRow}>
                <div style={{ ...styles.statCard, borderLeftColor: '#10b981' }}>
                    <span style={styles.statLabel}>Cartera Total</span>
                    <span style={{ ...styles.statValue, color: '#10b981' }}>$ {invoices.reduce((acc, inv) => acc + Number(inv.balance), 0).toLocaleString()}</span>
                </div>
                <div style={{ ...styles.statCard, borderLeftColor: '#f59e0b' }}>
                    <span style={styles.statLabel}>Recaudo Pendiente</span>
                    <span style={{ ...styles.statValue, color: '#f59e0b' }}>
                        $ {invoices.filter(inv => inv.status !== 'PAID').reduce((acc, inv) => acc + Number(inv.balance), 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Cliente / Factura</th>
                            <th style={styles.th}>Vencimiento</th>
                            <th style={styles.th}>Estado</th>
                            <th style={styles.th}>Valor</th>
                            <th style={styles.th}>Saldo</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => {
                            const status = getStatusStyle(inv.status, inv.dueDate);
                            return (
                                <tr key={inv.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: '700' }}>{inv.customer?.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fact: {inv.invoiceNumber}</div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} />
                                            {new Date(inv.dueDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.statusBadge,
                                            background: status.bg,
                                            color: status.text
                                        }}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td style={styles.td}>$ {Number(inv.totalAmount).toLocaleString()}</td>
                                    <td style={{ ...styles.td, fontWeight: '800' }}>$ {Number(inv.balance).toLocaleString()}</td>
                                    <td style={styles.td}>
                                        <button style={{ ...styles.paymentBtn, background: '#ecfdf5', color: '#059669' }}>
                                            Recaudar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {invoices.length === 0 && (
                    <div style={styles.empty}>No hay cuentas por cobrar registradas.</div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titleSection: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 },
    addButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' },
    formCard: { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '24px', border: '1px solid #e2e8f0' },
    formTitle: { fontSize: '16px', fontWeight: '800', color: '#475569', marginBottom: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
    formActions: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end' },
    saveButton: { background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' },
    statCard: { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '4px' },
    statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
    statValue: { fontSize: '24px', fontWeight: '800', color: '#1e293b' },
    tableContainer: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '16px', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '700', borderBottom: '2px solid #e2e8f0' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '16px', fontSize: '14px', color: '#475569' },
    statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
    paymentBtn: { background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
    empty: { padding: '40px', textAlign: 'center', color: '#64748b' }
};

export default AccountsReceivableManager;
