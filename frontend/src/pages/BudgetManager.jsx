import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Plus, Trash2, PieChart, Target, AlertCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';

const BudgetManager = () => {
    const [budgets, setBudgets] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        accountId: '',
        costCenterId: '',
        periodId: '',
        amount: 0
    });

    useEffect(() => {
        fetchBudgets();
        fetchAccounts();
        fetchCostCenters();
        fetchPeriods();
    }, []);

    const fetchBudgets = async () => {
        try {
            const res = await api.get('/accounting/budgets');
            setBudgets(res.data);
        } catch (err) {
            console.error('Error fetching budgets:', err);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounting/accounts');
            setAccounts(res.data.filter(acc => acc.code.length >= 4));
        } catch (err) {
            console.error('Error fetching accounts:', err);
        }
    };

    const fetchCostCenters = async () => {
        try {
            const res = await api.get('/accounting/cost-centers');
            setCostCenters(res.data);
        } catch (err) {
            console.error('Error fetching cost centers:', err);
        }
    };

    const fetchPeriods = async () => {
        try {
            const res = await api.get('/accounting/periods');
            setPeriods(res.data);
        } catch (err) {
            console.error('Error fetching periods:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/accounting/budgets', formData);
            Swal.fire('Guardado', 'Presupuesto configurado con éxito', 'success');
            setShowForm(false);
            setFormData({ accountId: '', costCenterId: '', periodId: '', amount: 0 });
            fetchBudgets();
        } catch (err) {
            Swal.fire('Error', 'No se pudo guardar el presupuesto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar presupuesto?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/accounting/budgets/${id}`);
                Swal.fire('Eliminado', 'Presupuesto eliminado', 'success');
                fetchBudgets();
            } catch (err) {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <Target size={24} color="var(--primary)" />
                    <h2 style={styles.title}>Gestión de Presupuestos</h2>
                </div>
                <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} />
                    {showForm ? 'Cancelar' : 'Nuevo Presupuesto'}
                </button>
            </div>

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>Configurar Presupuesto Estimado</h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Periodo</label>
                                <select 
                                    style={styles.input} 
                                    value={formData.periodId} 
                                    onChange={e => setFormData({ ...formData, periodId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecciona Periodo...</option>
                                    {periods.map(p => (
                                        <option key={p.id} value={p.id}>{p.month}/{p.year}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Centro de Costo</label>
                                <select 
                                    style={styles.input} 
                                    value={formData.costCenterId} 
                                    onChange={e => setFormData({ ...formData, costCenterId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecciona Centro...</option>
                                    {costCenters.map(cc => (
                                        <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Cuenta Contable</label>
                                <select 
                                    style={styles.input} 
                                    value={formData.accountId} 
                                    onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecciona Cuenta...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Monto Estimado ($)</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                        <div style={styles.formActions}>
                            <button type="submit" style={styles.saveButton} disabled={loading}>
                                {loading ? 'Guardando...' : 'Asignar Presupuesto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Periodo</th>
                            <th style={styles.th}>Centro de Costo</th>
                            <th style={styles.th}>Cuenta</th>
                            <th style={styles.th}>Presupuesto</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {budgets.map(budget => (
                            <tr key={budget.id} style={styles.tr}>
                                <td style={styles.td}>{budget.period?.month}/{budget.period?.year}</td>
                                <td style={styles.td}>{budget.costCenter?.name}</td>
                                <td style={styles.td}>{budget.account?.code} - {budget.account?.name}</td>
                                <td style={styles.td}><strong>$ {budget.amount?.toLocaleString()}</strong></td>
                                <td style={styles.td}>
                                    <button style={styles.deleteBtn} onClick={() => handleDelete(budget.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {budgets.length === 0 && (
                            <tr>
                                <td colSpan="5" style={styles.noData}>No hay presupuestos configurados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
    formTitle: { fontSize: '16px', fontWeight: '800', color: '#475569', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
    formActions: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end' },
    saveButton: { background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' },
    tableCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '15px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '15px 20px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc' },
    deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    noData: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '15px' }
};

export default BudgetManager;
