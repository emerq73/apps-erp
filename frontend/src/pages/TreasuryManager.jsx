import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Wallet, Landmark, Plus, Search, CheckCircle, XCircle, Info } from 'lucide-react';
import Swal from 'sweetalert2';

const TreasuryManager = () => {
    const [cashBoxes, setCashBoxes] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('cash'); // 'cash' or 'banks'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cbRes, baRes, accRes] = await Promise.all([
                api.get('/accounting/treasury/cash-boxes'),
                api.get('/accounting/treasury/bank-accounts'),
                api.get('/accounting/accounts')
            ]);
            setCashBoxes(cbRes.data);
            setBankAccounts(baRes.data);
            setAccounts(accRes.data.filter(a => a.type === 'activo'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCashBox = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nueva Caja Registradora',
            html:
                '<input id="swal-name" class="swal2-input" placeholder="Nombre de la Caja">' +
                '<select id="swal-acc" class="swal2-input">' +
                accounts.map(a => `<option value="${a.id}">${a.code} - ${a.name}</option>`).join('') +
                '</select>',
            focusConfirm: false,
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    accountId: document.getElementById('swal-acc').value
                };
            }
        });

        if (formValues) {
            try {
                await api.post('/accounting/treasury/cash-boxes', formValues);
                Swal.fire('Éxito', 'Caja creada correctamente', 'success');
                fetchData();
            } catch (err) {
                Swal.fire('Error', 'No se pudo crear la caja', 'error');
            }
        }
    };

    const handleCreateBankAccount = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nueva Cuenta Bancaria',
            html:
                '<input id="swal-bank" class="swal2-input" placeholder="Nombre del Banco">' +
                '<input id="swal-num" class="swal2-input" placeholder="Número de Cuenta">' +
                '<select id="swal-type" class="swal2-input"><option value="SAVINGS">Ahorros</option><option value="CHECKING">Corriente</option></select>' +
                '<select id="swal-acc" class="swal2-input">' +
                accounts.map(a => `<option value="${a.id}">${a.code} - ${a.name}</option>`).join('') +
                '</select>',
            focusConfirm: false,
            preConfirm: () => {
                return {
                    bankName: document.getElementById('swal-bank').value,
                    accountNumber: document.getElementById('swal-num').value,
                    type: document.getElementById('swal-type').value,
                    accountId: document.getElementById('swal-acc').value
                };
            }
        });

        if (formValues) {
            try {
                await api.post('/accounting/treasury/bank-accounts', formValues);
                Swal.fire('Éxito', 'Cuenta bancaria creada', 'success');
                fetchData();
            } catch (err) {
                Swal.fire('Error', 'No se pudo crear la cuenta', 'error');
            }
        }
    };

    if (loading) return <div style={styles.loader}>Cargando Tesorería...</div>;

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Tesorería</h2>
                    <p style={styles.subtitle}>Gestión de Cajas y Bancos</p>
                </div>
                <div style={styles.tabGroup}>
                    <button style={{ ...styles.tabBtn, ...(view === 'cash' ? styles.tabBtnActive : {}) }} onClick={() => setView('cash')}>
                        <Wallet size={16} /> Cajas
                    </button>
                    <button style={{ ...styles.tabBtn, ...(view === 'banks' ? styles.tabBtnActive : {}) }} onClick={() => setView('banks')}>
                        <Landmark size={16} /> Bancos
                    </button>
                </div>
                <button style={styles.createBtn} onClick={view === 'cash' ? handleCreateCashBox : handleCreateBankAccount}>
                    <Plus size={18} /> Nuevo {view === 'cash' ? 'Caja' : 'Banco'}
                </button>
            </div>

            <div style={styles.grid}>
                {(view === 'cash' ? cashBoxes : bankAccounts).map(item => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.iconCircle}>
                                {view === 'cash' ? <Wallet color="var(--primary)" /> : <Landmark color="var(--primary)" />}
                            </div>
                            <div style={styles.cardTitleSection}>
                                <h4 style={styles.cardTitle}>{item.name || item.bankName}</h4>
                                <span style={styles.cardSubtitle}>{item.account?.code} - {item.account?.name}</span>
                            </div>
                            <div style={{ ...styles.statusDot, background: item.isActive ? '#10b981' : '#ef4444' }} />
                        </div>
                        {view === 'banks' && (
                            <div style={styles.cardInfo}>
                                <div style={styles.infoRow}>
                                    <Info size={14} color="#94a3b8" />
                                    <span>No. {item.accountNumber} ({item.type})</span>
                                </div>
                            </div>
                        )}
                        <div style={styles.cardFooter}>
                            <div style={styles.balanceSection}>
                                <span style={styles.balanceLabel}>Saldo Disponible</span>
                                <span style={styles.balanceValue}>$ 0.00</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    tabGroup: { display: 'flex', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '4px' },
    tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', background: 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' },
    tabBtnActive: { background: '#f1f5f9', color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    createBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: 'var(--shadow-md)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s', cursor: 'default' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
    iconCircle: { width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardTitleSection: { flex: 1 },
    cardTitle: { margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' },
    cardSubtitle: { fontSize: '11px', color: '#94a3b8', fontWeight: '600' },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
    cardInfo: { padding: '12px', background: '#f8fafc', borderRadius: '12px', marginBottom: '15px' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' },
    cardFooter: { borderTop: '1px solid #f1f5f9', paddingTop: '15px' },
    balanceSection: { display: 'flex', flexDirection: 'column', gap: '2px' },
    balanceLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
    balanceValue: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
    loader: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }
};

export default TreasuryManager;
