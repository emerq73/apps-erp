import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Search, Plus, UserCircle, Building2, Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const ThirdPartyManager = () => {
    const [thirdParties, setThirdParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        identification: '',
        dv: '',
        name: '',
        type: 'PJ',
        email: '',
        phone: '',
        address: '',
        city: 'BOGOTÁ'
    });

    useEffect(() => {
        fetchThirdParties();
    }, []);

    const fetchThirdParties = async () => {
        try {
            const res = await api.get('/accounting/third-parties');
            setThirdParties(res.data);
        } catch (err) {
            console.error('Error fetching third parties:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        console.log('Intentando guardar tercero:', { editingId, formData });
        try {
            if (editingId) {
                console.log('Enviando PUT a:', `/accounting/third-parties/${editingId}`);
                await api.put(`/accounting/third-parties/${editingId}`, formData);
                Swal.fire('Éxito', 'Tercero actualizado correctamente', 'success');
            } else {
                console.log('Enviando POST a:', '/accounting/third-parties');
                await api.post('/accounting/third-parties', formData);
                Swal.fire('Éxito', 'Tercero creado correctamente', 'success');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                identification: '', dv: '', name: '', type: 'PJ',
                email: '', phone: '', address: '', city: 'BOGOTÁ'
            });
            fetchThirdParties();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo guardar el registro';
            Swal.fire('Error', msg, 'error');
        }
    };

    const handleEdit = (tp) => {
        setEditingId(tp.id);
        setFormData({
            identification: tp.identification,
            dv: tp.dv || '',
            name: tp.name,
            type: tp.type,
            email: tp.email || '',
            phone: tp.phone || '',
            address: tp.address || '',
            city: tp.city || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar Tercero?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/accounting/third-parties/${id}`);
                Swal.fire('Eliminado', 'El registro ha sido borrado', 'success');
                fetchThirdParties();
            } catch (err) {
                Swal.fire('Error', 'No se pudo eliminar el tercero. Verifique si tiene transacciones asociadas.', 'error');
            }
        }
    };

    const filtered = thirdParties.filter(tp =>
        tp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tp.identification.includes(searchTerm)
    );

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <div style={styles.searchWrapper}>
                    <Search style={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o NIT..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            identification: '', dv: '', name: '', type: 'PJ',
                            email: '', phone: '', address: '', city: 'BOGOTÁ'
                        });
                        setIsModalOpen(true);
                    }}
                    style={styles.primaryButton}
                >
                    <Plus size={20} />
                    Nuevo Tercero
                </button>
            </div>

            {loading ? (
                <div style={styles.loaderContainer}>
                    <div className="spin" style={styles.spinner}></div>
                    <span style={{ color: 'var(--text-muted)' }}>Cargando registros...</span>
                </div>
            ) : (
                <div style={styles.grid}>
                    {filtered.map(tp => (
                        <div key={tp.id} style={styles.card} className="card-premium">
                            <div style={styles.cardHeader}>
                                <div style={{
                                    ...styles.iconBox,
                                    backgroundColor: tp.type === 'PJ' ? '#e0f2fe' : '#dcfce7',
                                    color: tp.type === 'PJ' ? '#0369a1' : '#15803d'
                                }}>
                                    {tp.type === 'PJ' ? <Building2 size={24} /> : <UserCircle size={24} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <div style={styles.idBadge}>
                                        {tp.identification}{tp.dv ? `-${tp.dv}` : ''}
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => handleEdit(tp)} style={styles.iconBtn} title="Editar">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(tp.id)} style={{ ...styles.iconBtn, color: '#ef4444' }} title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <h3 style={styles.cardTitle}>{tp.name}</h3>
                            <div style={styles.cardBody}>
                                <div style={styles.infoRow}>
                                    <Mail size={14} style={styles.infoIcon} />
                                    <span>{tp.email || 'Sin correo registrado'}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <Phone size={14} style={styles.infoIcon} />
                                    <span>{tp.phone || 'Sin teléfono'}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <MapPin size={14} style={styles.infoIcon} />
                                    <span>{tp.address || tp.city}, {tp.city}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal} className="fade-in">
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>{editingId ? 'Editar Tercero' : 'Registrar Nuevo Tercero'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>×</button>
                        </div>
                        <form onSubmit={handleSave} style={styles.form}>
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Identificación (NIT/CC)</label>
                                    <input
                                        required
                                        style={styles.input}
                                        value={formData.identification}
                                        onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>DV (Opcional)</label>
                                    <input
                                        placeholder="NIT únicamente"
                                        style={styles.input}
                                        value={formData.dv}
                                        onChange={(e) => setFormData({ ...formData, dv: e.target.value })}
                                    />
                                </div>
                                <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                    <label style={styles.label}>Nombre o Razón Social</label>
                                    <input
                                        required
                                        style={styles.input}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tipo de Persona</label>
                                    <select
                                        style={styles.input}
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="PJ">Persona Jurídica</option>
                                        <option value="PN">Persona Natural</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Ciudad</label>
                                    <input
                                        style={styles.input}
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={styles.formFooter}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={styles.cancelBtn}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={styles.saveBtn}
                                >
                                    {editingId ? 'Actualizar' : 'Guardar Tercero'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' },
    searchWrapper: { position: 'relative', flex: 1, maxWidth: '500px' },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
    searchInput: { width: '100%', padding: '10px 12px 10px 40px', background: 'white', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px' },
    primaryButton: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 24px', background: 'var(--primary)', color: 'white', borderRadius: '100px', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(0, 74, 124, 0.2)' },
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '16px' },
    spinner: { width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid var(--primary)', borderRadius: '50%' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
    card: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconBox: { padding: '12px', borderRadius: '12px' },
    idBadge: { fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' },
    iconBtn: { padding: '6px', borderRadius: '8px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 },
    cardBody: { display: 'flex', flexDirection: 'column', gap: '8px' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' },
    infoIcon: { color: 'var(--primary)', opacity: 0.6 },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    modalHeader: { padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' },
    modalTitle: { margin: 0, fontSize: '20px', fontWeight: '700' },
    closeBtn: { background: 'none', fontSize: '24px', color: 'var(--text-muted)' },
    form: { padding: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' },
    input: { width: '100%' },
    formFooter: { marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    cancelBtn: { padding: '10px 20px', color: 'var(--text-muted)', fontWeight: '600' },
    saveBtn: { padding: '10px 24px', background: 'var(--primary)', color: 'white', borderRadius: '10px', fontWeight: '600' }
};

export default ThirdPartyManager;
