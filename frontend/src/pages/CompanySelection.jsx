import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Building2, Calendar, ChevronRight, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const CompanySelection = ({ onSelectionComplete, onLogout }) => {
    const [companies, setCompanies] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [compRes, perRes] = await Promise.all([
                api.get('/accounting/companies'),
                api.get('/accounting/periods')
            ]);
            
            setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
            setPeriods(Array.isArray(perRes.data) ? perRes.data : []);
            
            if (compRes.data && compRes.data.length === 1) {
                setSelectedCompany(compRes.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching selection data', err);
            if (err.response?.status === 401) {
                onLogout(); // Redirigir al login si la sesión expiró
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (selectedCompany && selectedPeriod) {
            localStorage.setItem('activeCompanyId', selectedCompany);
            localStorage.setItem('activePeriodId', selectedPeriod);
            onSelectionComplete();
        }
    };

    if (loading) {
        return (
            <div style={styles.overlay}>
                <div className="spin" style={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.card}
            >
                <div style={styles.header}>
                    <Building2 size={32} color="var(--primary)" />
                    <h2 style={styles.title}>Configuración de Sesión</h2>
                    <p style={styles.subtitle}>Seleccione la empresa y el periodo para comenzar</p>
                </div>

                <div style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Empresa / Hotel</label>
                        <select 
                            value={selectedCompany} 
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            style={styles.select}
                        >
                            <option value="">Seleccione una empresa...</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Periodo Contable</label>
                        <select 
                            value={selectedPeriod} 
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            style={styles.select}
                            disabled={!selectedCompany}
                        >
                            <option value="">Seleccione un periodo...</option>
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {(p.year && p.month) 
                                        ? `${new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`
                                        : 'Periodo sin fecha'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedCompany || !selectedPeriod}
                        style={{
                            ...styles.button,
                            ...( (!selectedCompany || !selectedPeriod) ? styles.buttonDisabled : {})
                        }}
                    >
                        Ingresar al Sistema
                        <ChevronRight size={18} />
                    </button>

                    <button onClick={onLogout} style={styles.logoutBtn}>
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    card: {
        background: 'white',
        padding: '40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#1e293b',
        margin: 0,
    },
    subtitle: {
        fontSize: '14px',
        color: '#64748b',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#475569',
    },
    select: {
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '15px',
        background: '#f8fafc',
        width: '100%',
    },
    button: {
        marginTop: '10px',
        padding: '14px',
        background: 'var(--primary)',
        color: 'white',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '700',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    buttonDisabled: {
        background: '#e2e8f0',
        color: '#94a3b8',
        cursor: 'not-allowed',
    },
    logoutBtn: {
        marginTop: '10px',
        background: 'none',
        border: 'none',
        color: '#ef4444',
        fontSize: '13px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTop: '4px solid white',
        borderRadius: '50%',
    }
};

export default CompanySelection;
