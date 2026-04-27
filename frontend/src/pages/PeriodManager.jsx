import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Plus, Lock, Unlock, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

const PeriodManager = () => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        status: 'OPEN'
    });

    useEffect(() => {
        fetchPeriods();
    }, []);

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
            await api.post('/accounting/periods', formData);
            Swal.fire('Creado', 'Periodo contable configurado correctamente', 'success');
            setShowForm(false);
            fetchPeriods();
        } catch (err) {
            Swal.fire('Error', 'No se pudo crear el periodo (posiblemente ya existe)', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (period) => {
        const newStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        const actionText = newStatus === 'CLOSED' ? 'CERRAR' : 'ABRIR';
        
        const result = await Swal.fire({
            title: `¿${actionText} periodo?`,
            text: newStatus === 'CLOSED' 
                ? "Al cerrar el periodo, no se podrán registrar nuevos movimientos contables en este mes."
                : "Al abrir el periodo, se habilitará nuevamente el registro de movimientos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: newStatus === 'CLOSED' ? '#ef4444' : '#10b981',
            confirmButtonText: `Sí, ${actionText}`
        });

        if (result.isConfirmed) {
            try {
                await api.put(`/accounting/periods/${period.id}`, { status: newStatus });
                Swal.fire('Actualizado', `Periodo ${newStatus === 'OPEN' ? 'abierto' : 'cerrado'} con éxito`, 'success');
                fetchPeriods();
            } catch (err) {
                Swal.fire('Error', 'No se pudo actualizar el estado del periodo', 'error');
            }
        }
    };

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <Calendar size={24} color="var(--primary)" />
                    <h2 style={styles.title}>Periodos Contables</h2>
                </div>
                <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} />
                    {showForm ? 'Cancelar' : 'Nuevo Periodo'}
                </button>
            </div>

            <div style={styles.alert}>
                <AlertTriangle size={20} color="#f59e0b" />
                <p style={styles.alertText}>
                    <strong>Importante:</strong> Los periodos cerrados bloquean automáticamente cualquier intento de registro de vouchers o transacciones para asegurar la integridad de la información.
                </p>
            </div>

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>Configurar Nuevo Periodo</h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Año</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Mes</label>
                                <select
                                    style={styles.input}
                                    value={formData.month}
                                    onChange={e => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                >
                                    {months.map((name, i) => (
                                        <option key={i} value={i + 1}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Estado Inicial</label>
                                <select
                                    style={styles.input}
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="OPEN">Abierto</option>
                                    <option value="CLOSED">Cerrado</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.formActions}>
                            <button type="submit" style={styles.saveButton} disabled={loading}>
                                {loading ? 'Guardando...' : 'Habilitar Periodo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.grid}>
                {periods.map(period => (
                    <div key={period.id} style={{
                        ...styles.periodCard,
                        borderLeft: `6px solid ${period.status === 'OPEN' ? '#10b981' : '#ef4444'}`
                    }}>
                        <div style={styles.periodInfo}>
                            <h4 style={styles.periodTitle}>{months[period.month - 1]} {period.year}</h4>
                            <span style={{
                                ...styles.statusBadge,
                                background: period.status === 'OPEN' ? '#ecfdf5' : '#fef2f2',
                                color: period.status === 'OPEN' ? '#059669' : '#dc2626'
                            }}>
                                {period.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                            </span>
                        </div>
                        <button 
                            style={{
                                ...styles.actionBtn,
                                color: period.status === 'OPEN' ? '#ef4444' : '#10b981'
                            }}
                            onClick={() => toggleStatus(period)}
                        >
                            {period.status === 'OPEN' ? (
                                <><Lock size={16} /> Cerrar Periodo</>
                            ) : (
                                <><Unlock size={16} /> Abrir Periodo</>
                            )}
                        </button>
                    </div>
                ))}
                {periods.length === 0 && (
                    <div style={styles.emptyState}>
                        <p>No hay periodos configurados. Comienza habilitando el mes actual.</p>
                    </div>
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
    alert: { display: 'flex', alignItems: 'center', gap: '12px', background: '#fffbeb', border: '1px solid #fde68a', padding: '15px', borderRadius: '12px', marginBottom: '24px' },
    alertText: { margin: 0, fontSize: '13px', color: '#92400e' },
    formCard: { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '24px', border: '1px solid #e2e8f0' },
    formTitle: { fontSize: '16px', fontWeight: '800', color: '#475569', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
    formActions: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end' },
    saveButton: { background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    periodCard: { background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' },
    periodInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    periodTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' },
    statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
    actionBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' },
    emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: '#f1f5f9', borderRadius: '16px', color: '#64748b' }
};

export default PeriodManager;
