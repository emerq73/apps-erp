import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Plus, Building2, MapPin, Hash, Phone, Mail, Save, Edit2, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const CompanyManager = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nit: '',
        address: '',
        phone: '',
        email: '',
        country: 'Colombia'
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/accounting/companies');
            setCompanies(res.data);
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/accounting/company/${editingId}`, formData);
                Swal.fire('Actualizado', 'Empresa actualizada correctamente', 'success');
            } else {
                await api.post('/accounting/companies', formData);
                Swal.fire('Creado', 'Nueva empresa registrada correctamente', 'success');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', nit: '', address: '', phone: '', email: '', country: 'Colombia' });
            fetchCompanies();
        } catch (err) {
            Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (company) => {
        setFormData({
            name: company.name,
            nit: company.nit || '',
            address: company.address || '',
            phone: company.phone || '',
            email: company.email || '',
            country: company.country || 'Colombia'
        });
        setEditingId(company.id);
        setShowForm(true);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <Building2 size={24} color="var(--primary)" />
                    <h2 style={styles.title}>Gestión de Empresas / Hoteles</h2>
                </div>
                <button style={styles.addButton} onClick={() => {
                    setShowForm(!showForm);
                    setEditingId(null);
                    setFormData({ name: '', nit: '', address: '', phone: '', email: '', country: 'Colombia' });
                }}>
                    <Plus size={18} />
                    {showForm ? 'Cancelar' : 'Nueva Empresa'}
                </button>
            </div>

            {showForm && (
                <div style={styles.formCard} className="fade-in">
                    <h3 style={styles.formTitle}>{editingId ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nombre / Razón Social</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ej. Hotel Plaza Real"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>NIT / ID Tributario</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={formData.nit}
                                    onChange={e => setFormData({ ...formData, nit: e.target.value })}
                                    placeholder="900.000.000-1"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Dirección</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Teléfono</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Correo Electrónico</label>
                                <input
                                    type="email"
                                    style={styles.input}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>País</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={styles.formActions}>
                            <button type="submit" style={styles.saveButton} disabled={loading}>
                                <Save size={18} />
                                {loading ? 'Procesando...' : (editingId ? 'Actualizar Empresa' : 'Crear Empresa')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Empresa</th>
                            <th style={styles.th}>NIT</th>
                            <th style={styles.th}>Ubicación / Contacto</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(company => (
                            <tr key={company.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: '800', color: 'var(--primary)' }}>{company.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {company.id}</div>
                                </td>
                                <td style={styles.td}>{company.nit || '-'}</td>
                                <td style={styles.td}>
                                    <div style={{ fontSize: '13px' }}><MapPin size={12} inline /> {company.address || 'N/A'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}><Phone size={12} inline /> {company.phone || '-'}</div>
                                </td>
                                <td style={styles.td}>
                                    <button style={styles.editBtn} onClick={() => handleEdit(company)}>
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
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
    formTitle: { fontSize: '16px', fontWeight: '800', color: '#475569', marginBottom: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
    formActions: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end' },
    saveButton: { display: 'flex', alignItems: 'center', gap: '10px', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' },
    tableContainer: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '16px', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '16px', fontSize: '14px', color: '#475569' },
    editBtn: { background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer' }
};

export default CompanyManager;
