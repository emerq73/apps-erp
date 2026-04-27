import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Plus, FolderTree, Layers, Edit2, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const CostCenterManager = () => {
    const [costCenters, setCostCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        parentId: null
    });

    useEffect(() => {
        fetchCostCenters();
    }, []);

    const fetchCostCenters = async () => {
        try {
            const res = await api.get('/accounting/cost-centers');
            setCostCenters(res.data);
        } catch (err) {
            console.error('Error fetching cost centers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        console.log('Intentando guardar centro de costo:', { editingId, formData });
        try {
            if (editingId) {
                console.log('Enviando PUT a:', `/accounting/cost-centers/${editingId}`);
                await api.put(`/accounting/cost-centers/${editingId}`, formData);
                Swal.fire('Actualizado', 'Centro de costo actualizado correctamente', 'success');
            } else {
                console.log('Enviando POST a:', '/accounting/cost-centers');
                await api.post('/accounting/cost-centers', formData);
                Swal.fire('Éxito', 'Centro de costo creado correctamente', 'success');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ code: '', name: '', parentId: null });
            fetchCostCenters();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo guardar el registro';
            Swal.fire('Error', msg, 'error');
        }
    };

    const handleEdit = (cc) => {
        setEditingId(cc.id);
        setFormData({
            code: cc.code,
            name: cc.name,
            parentId: cc.parent ? cc.parent.id : null
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar Centro de Costo?',
            text: 'Verifique que no existan sub-centros o transacciones asociadas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/accounting/cost-centers/${id}`);
                Swal.fire('Eliminado', 'Registro borrado con éxito', 'success');
                fetchCostCenters();
            } catch (err) {
                Swal.fire('Error', 'No se pudo eliminar. Verifique dependencias.', 'error');
            }
        }
    };

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <div style={styles.headerInfo}>
                    <h2 style={styles.title}>
                        <FolderTree size={28} style={styles.titleIcon} />
                        Centros de Costo
                    </h2>
                    <p style={styles.subtitle}>Estructura departamental para control de gastos y rentabilidad</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ code: '', name: '', parentId: null });
                        setIsModalOpen(true);
                    }}
                    style={styles.primaryButton}
                >
                    <Plus size={20} /> Nuevo Centro
                </button>
            </div>

            {loading ? (
                <div style={styles.loaderContainer}>
                    <div className="spin" style={styles.spinner}></div>
                    <span>Cargando estructura corporativa...</span>
                </div>
            ) : (
                <div style={styles.tableWrapper} className="card-premium">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre del Centro</th>
                                <th>Padre / Dependencia</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costCenters.map(cc => (
                                <tr key={cc.id}>
                                    <td style={{ width: '150px' }}>
                                        <span style={styles.codeBadge}>
                                            {cc.code}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{cc.name}</td>
                                    <td>
                                        {cc.parent ? (
                                            <div style={styles.parentBadge}>
                                                <Layers size={12} /> {cc.parent.name}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Nivel Raíz</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button onClick={() => handleEdit(cc)} style={styles.actionBtn}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(cc.id)} style={{ ...styles.actionBtn, color: '#ef4444' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal} className="fade-in">
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>{editingId ? 'Editar Centro de Costo' : 'Crear Centro de Costo'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>×</button>
                        </div>
                        <form onSubmit={handleSave} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Código Contable</label>
                                <input
                                    required
                                    placeholder="Ej: 100, 201, ADM-01"
                                    style={styles.input}
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nombre Descriptivo</label>
                                <input
                                    required
                                    placeholder="Ej: Recepción, Housekeeping..."
                                    style={styles.input}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Pertenece a (Opcional)</label>
                                <select
                                    style={styles.input}
                                    value={formData.parentId || ''}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value || null })}
                                >
                                    <option value="">Ninguno (Principal)</option>
                                    {costCenters.filter(c => c.id !== editingId).map(cc => (
                                        <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formFooter}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
                                <button type="submit" style={styles.saveBtn}>{editingId ? 'Actualizar' : 'Crear Centro'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    headerInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
    title: { fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 },
    titleIcon: { color: 'var(--primary)' },
    subtitle: { color: 'var(--text-muted)', fontSize: '14px' },
    primaryButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: '700', fontSize: '14px', boxShadow: 'var(--shadow-md)' },
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px', color: 'var(--text-muted)' },
    spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid var(--primary)', borderRadius: '50%' },
    tableWrapper: { overflow: 'hidden' },
    codeBadge: { background: '#f1f5f9', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', border: '1px solid var(--border)' },
    parentBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', background: '#f8fafc', padding: '4px 10px', borderRadius: '100px', border: '1px solid var(--border)', width: 'fit-content' },
    actionBtn: { padding: '8px', borderRadius: '8px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
    modalHeader: { padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' },
    closeBtn: { background: 'none', fontSize: '28px', color: '#94a3b8' },
    form: { padding: '32px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
    label: { fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' },
    input: { width: '100%', padding: '12px' },
    formFooter: { marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' },
    cancelBtn: { padding: '10px 20px', color: 'var(--text-muted)', fontWeight: '600' },
    saveBtn: { padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: '700' }
};

export default CostCenterManager;
