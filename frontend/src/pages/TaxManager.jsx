import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Plus, Edit2, Trash2, Percent, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const TaxManager = () => {
    const [taxes, setTaxes] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'IVA',
        rate: 0,
        baseAmount: 0,
        accountId: '',
        isActive: true
    });

    useEffect(() => {
        fetchTaxes();
        fetchAccounts();
    }, []);

    const fetchTaxes = async () => {
        try {
            const res = await api.get('/accounting/taxes');
            setTaxes(res.data);
        } catch (err) {
            console.error('Error fetching taxes:', err);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounting/accounts');
            // Filtrar cuentas auxiliares: aquellas con código largo (>= 6 dígitos) 
            // o que no tienen hijos (en esta demo asumimos >= 6 como auxiliares)
            const filtered = res.data.filter(acc => acc.code.length >= 6);
            setAccounts(filtered);
        } catch (err) {
            console.error('Error fetching accounts:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                account: formData.accountId ? { id: formData.accountId } : null
            };

            if (editingTax) {
                await api.put(`/accounting/taxes/${editingTax.id}`, payload);
                Swal.fire('Actualizado', 'Impuesto actualizado correctamente', 'success');
            } else {
                await api.post('/accounting/taxes', payload);
                Swal.fire('Creado', 'Impuesto creado correctamente', 'success');
            }
            setShowForm(false);
            setEditingTax(null);
            setFormData({ name: '', type: 'IVA', rate: 0, baseAmount: 0, accountId: '', isActive: true });
            fetchTaxes();
        } catch (err) {
            Swal.fire('Error', 'No se pudo guardar el impuesto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tax) => {
        setEditingTax(tax);
        setFormData({
            name: tax.name,
            type: tax.type,
            rate: tax.rate,
            baseAmount: tax.baseAmount,
            accountId: tax.account?.id || '',
            isActive: tax.isActive
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/accounting/taxes/${id}`);
                Swal.fire('Eliminado', 'El impuesto ha sido eliminado', 'success');
                fetchTaxes();
            } catch (err) {
                Swal.fire('Error', 'No se pudo eliminar el impuesto', 'error');
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Tabla de Impuestos</h2>
                <button style={styles.addButton} onClick={() => { setShowForm(!showForm); setEditingTax(null); }}>
                    <Plus size={18} />
                    {showForm ? 'Cancelar' : 'Nuevo Impuesto'}
                </button>
            </div>

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>{editingTax ? 'Editar Impuesto' : 'Configurar Nuevo Impuesto'}</h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nombre</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    placeholder="Ej: IVA 19% Ventas"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Tipo</label>
                                <select
                                    style={styles.input}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="IVA">IVA</option>
                                    <option value="Retención Fuente">Retención Fuente</option>
                                    <option value="Retención IVA">Retención IVA</option>
                                    <option value="ICA">ICA</option>
                                    <option value="Impoconsumo">Impoconsumo</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Tarifa (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    style={styles.input}
                                    value={formData.rate}
                                    onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Base Mínima ($)</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={formData.baseAmount}
                                    onChange={e => setFormData({ ...formData, baseAmount: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Cuenta Contable</label>
                                <select
                                    style={styles.input}
                                    value={formData.accountId}
                                    onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecciona una cuenta...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Estado</label>
                                <select
                                    style={styles.input}
                                    value={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.formActions}>
                            <button type="submit" style={styles.saveButton} disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Impuesto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Nombre</th>
                            <th style={styles.th}>Tipo</th>
                            <th style={styles.th}>Tarifa</th>
                            <th style={styles.th}>Base</th>
                            <th style={styles.th}>Cuenta PUC</th>
                            <th style={styles.th}>Estado</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taxes.map(tax => (
                            <tr key={tax.id} style={styles.tr}>
                                <td style={styles.td}>{tax.name}</td>
                                <td style={styles.td}><span style={styles.badge}>{tax.type}</span></td>
                                <td style={styles.td}><strong>{tax.rate}%</strong></td>
                                <td style={styles.td}>$ {tax.baseAmount?.toLocaleString()}</td>
                                <td style={styles.td}>{tax.account?.code} - {tax.account?.name}</td>
                                <td style={styles.td}>
                                    {tax.isActive ? (
                                        <CheckCircle size={18} color="#10b981" title="Activo" />
                                    ) : (
                                        <XCircle size={18} color="#ef4444" title="Inactivo" />
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actions}>
                                        <button style={styles.editBtn} onClick={() => handleEdit(tax)}><Edit2 size={16} /></button>
                                        <button style={styles.deleteBtn} onClick={() => handleDelete(tax.id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {taxes.length === 0 && (
                            <tr>
                                <td colSpan="7" style={styles.noData}>No hay impuestos configurados</td>
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
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 },
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
    badge: { background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
    actions: { display: 'flex', gap: '8px' },
    editBtn: { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    noData: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '15px' }
};

export default TaxManager;
