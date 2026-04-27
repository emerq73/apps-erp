import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Building2, Save, MapPin, Phone, Mail, Globe, Hash, Flag } from 'lucide-react';
import Swal from 'sweetalert2';

const CompanySettings = () => {
    const [company, setCompany] = useState({
        name: '',
        nit: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        country: '',
        logoUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const res = await api.get('/accounting/company');
            if (res.data) {
                setCompany(res.data);
            }
        } catch (err) {
            console.error('Error fetching company:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/accounting/company/${company.id}`, company);
            Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'La información de la empresa se ha actualizado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar la información.'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={styles.loader}>Cargando configuración...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.iconBox}>
                    <Building2 size={24} color="var(--primary)" />
                </div>
                <div>
                    <h2 style={styles.title}>Configuración de la Empresa</h2>
                    <p style={styles.subtitle}>Gestiona los datos corporativos que aparecerán en tus reportes y facturas.</p>
                </div>
            </div>

            <form onSubmit={handleSave} style={styles.formCard}>
                <div style={styles.grid}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}><Building2 size={14} /> Nombre de la Empresa / Razón Social</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={company.name}
                            onChange={(e) => setCompany({ ...company, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}><Hash size={14} /> NIT / Identificación Tributaria</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={company.nit || ''}
                            onChange={(e) => setCompany({ ...company, nit: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}><MapPin size={14} /> Dirección Física</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={company.address || ''}
                            onChange={(e) => setCompany({ ...company, address: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}><Phone size={14} /> Teléfono de Contacto</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={company.phone || ''}
                            onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}><Mail size={14} /> Correo Electrónico</label>
                        <input
                            type="email"
                            style={styles.input}
                            value={company.email || ''}
                            onChange={(e) => setCompany({ ...company, email: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}><Globe size={14} /> Sitio Web</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={company.website || ''}
                            onChange={(e) => setCompany({ ...company, website: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}><Flag size={14} /> País</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={company.country || ''}
                            onChange={(e) => setCompany({ ...company, country: e.target.value })}
                        />
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="submit" style={styles.saveButton} disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container: { maxWidth: '900px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    iconBox: { background: 'white', padding: '12px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' },
    title: { fontSize: '24px', fontWeight: '800', margin: 0, color: '#1e293b' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: '5px 0 0 0' },
    formCard: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-md)', border: '1px solid #e2e8f0' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' },
    input: { padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', transition: 'border 0.2s' },
    footer: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '24px' },
    saveButton: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 74, 124, 0.2)' },
    loader: { textAlign: 'center', padding: '50px', color: '#64748b' }
};

export default CompanySettings;
