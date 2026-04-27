import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Plus, Receipt, Calendar, Users, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';
import Swal from 'sweetalert2';

const AccountsPayableManager = () => {
    const [invoices, setInvoices] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        vendorId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        totalAmount: '',
        notes: ''
    });

    useEffect(() => {
        fetchInvoices();
        fetchVendors();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/accounting/accounts-payable');
            setInvoices(res.data);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await api.get('/accounting/third-parties');
            setVendors(res.data);
        } catch (err) {
            console.error('Error fetching vendors:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/accounting/accounts-payable', formData);
            Swal.fire('Registrado', 'Factura de proveedor registrada con éxito', 'success');
            setShowForm(false);
            setFormData({
                invoiceNumber: '',
                vendorId: '',
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
            case 'PAID': return { bg: '#ecfdf5', text: '#10b981', label: 'PAGADA' };
            case 'PARTIAL': return { bg: '#eff6ff', text: '#3b82f6', label: 'PARCIAL' };
            default: return { bg: '#fffbeb', text: '#f59e0b', label: 'PENDIENTE' };
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <Receipt size={24} color="var(--primary)" />
                    <h2 style={styles.title}>Cuentas por Pagar (CxP)</h2>
                </div>
                <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} />
                    {showForm ? 'Cancelar' : 'Nueva Factura'}
                </button>
            </div>

            {showForm && (
                <div style={styles.formCard} className="fade-in">
                    <h3 style={styles.formTitle}>Registrar Obligación / Factura</h3>
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
                                    placeholder="FE-12345"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Proveedor</label>
                                <select
                                    style={styles.input}
                                    value={formData.vendorId}
                                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione Proveedor...</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name} ({v.nit})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Fecha Emisión</label>
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
                                <label style={styles.label}>Valor Total</label>
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
                            <button type="submit" style={styles.saveButton} disabled={loading}>
                                {loading ? 'Guardando...' : 'Registrar CxP'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Total Deuda</span>
                    <span style={styles.statValue}>$ {invoices.reduce((acc, inv) => acc + Number(inv.balance), 0).toLocaleString()}</span>
                </div>
                <div style={{ ...styles.statCard, borderLeftColor: '#ef4444' }}>
                    <span style={styles.statLabel}>Vencido</span>
                    <span style={{ ...styles.statValue, color: '#ef4444' }}>
                        $ {invoices.filter(inv => new Date(inv.dueDate) < new Date() && inv.status !== 'PAID')
                            .reduce((acc, inv) => acc + Number(inv.balance), 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Proveedor / Factura</th>
                            <th style={styles.th}>Vencimiento</th>
                            <th style={styles.th}>Estado</th>
                            <th style={styles.th}>Total</th>
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
                                        <div style={{ fontWeight: '700' }}>{inv.vendor?.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Doc: {inv.invoiceNumber}</div>
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
                                        <button style={styles.paymentBtn}>
                                            Abonar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {invoices.length === 0 && (
                    <div style={styles.empty}>No hay cuentas por pagar registradas.</div>
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

export default AccountsPayableManager;
