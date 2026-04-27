import React, { useState, useEffect } from 'react';
import {
    Book,
    ListTree,
    Plus,
    Search,
    ChevronDown,
    ChevronRight,
    Loader2,
    ArrowUpRight,
    ArrowDownLeft,
    Users,
    Layers,
    BarChart2,
    Percent,
    Settings,
    ShieldAlert,
    Calendar,
    Target,
    Wallet
} from 'lucide-react';
import api from '../services/auth.service';
import Swal from 'sweetalert2';
import ThirdPartyManager from './ThirdPartyManager';
import CostCenterManager from './CostCenterManager';
import JournalEntryForm from './JournalEntryForm';
import TrialBalance from './reports/TrialBalance';
import BalanceSheet from './reports/BalanceSheet';
import IncomeStatement from './reports/IncomeStatement';
import BudgetExecutionReport from './reports/BudgetExecutionReport';
import TaxManager from './TaxManager';
import PUCManager from './PUCManager';
import CompanyManager from './CompanyManager';
import PeriodManager from './PeriodManager';
import BudgetManager from './BudgetManager';
import AuditLogView from './AuditLogView';
import TreasuryManager from './TreasuryManager';
import AccountsPayableManager from './AccountsPayableManager';
import AccountsReceivableManager from './AccountsReceivableManager';
import FixedAssetsManager from './FixedAssetsManager';
import ExchangeRateManager from './ExchangeRateManager';

const AccountingView = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'puc'); // 'puc', 'ledger', 'third-parties', 'cost-centers', 'reports', 'balance-sheet', 'income-statement', 'taxes', 'settings', 'periods', 'budgets', 'audit', 'treasury'
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEntryForm, setShowEntryForm] = useState(false);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accsRes, transRes, vouchersRes] = await Promise.all([
                api.get('/accounting/accounts'),
                api.get('/accounting/transactions'),
                api.get('/accounting/vouchers')
            ]);
            setAccounts(accsRes.data);
            setTransactions(transRes.data || []);
            setVouchers(vouchersRes.data || []);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Red',
                text: 'No se pudieron cargar los datos contables.'
            });
        } finally {
            setLoading(false);
        }
    };


    const renderLedger = () => {
        // Unificar transacciones antiguas y nuevos comprobantes para la vista
        const unifiedMovements = [];

        // Agregar transacciones simples (Legacy)
        transactions.forEach(tx => {
            unifiedMovements.push({
                id: tx.id,
                date: tx.date,
                number: 'TRANS-SM',
                description: tx.description,
                details: [
                    { account: tx.debitAccount.name, debit: tx.amount, credit: 0 },
                    { account: tx.creditAccount.name, debit: 0, credit: tx.amount }
                ]
            });
        });

        // Agregar Comprobantes (New)
        vouchers.forEach(v => {
            unifiedMovements.push({
                id: v.id,
                date: v.date,
                number: v.number,
                description: v.description,
                details: v.entries.map(e => ({
                    account: e.account.name,
                    debit: e.debit,
                    credit: e.credit,
                    currency: e.currency?.code,
                    foreignDebit: e.foreignDebit,
                    foreignCredit: e.foreignCredit,
                    taxBaseAmount: e.taxBaseAmount
                }))
            });
        });

        // Ordenar por fecha descendente
        unifiedMovements.sort((a, b) => new Date(b.date) - new Date(a.date));

        return (
            <div style={styles.tabContent}>
                <div style={styles.tableHeader}>
                    <h3 style={styles.tabTitle}>Libro Diario (Movimientos Unificados)</h3>
                    <button style={styles.actionButton} onClick={() => setShowEntryForm(true)}>
                        <Plus size={16} />
                        Asiento Manual
                    </button>
                </div>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Fecha</th>
                                <th style={styles.th}>Documento / Descripción</th>
                                <th style={styles.th}>Cuenta</th>
                                <th style={styles.th}>Moneda / Base</th>
                                <th style={styles.th}>Débito (L)</th>
                                <th style={styles.th}>Crédito (L)</th>
                                <th style={styles.th}>Extranjero</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unifiedMovements.length > 0 ? unifiedMovements.map((move) => (
                                <React.Fragment key={move.id}>
                                    <tr style={{ ...styles.tr, background: '#f8fafc' }}>
                                        <td style={{ ...styles.td, fontWeight: '700' }}>{new Date(move.date).toLocaleDateString()}</td>
                                        <td style={{ ...styles.td, fontWeight: '700' }} colSpan="4">
                                            <span style={{ color: 'var(--primary)', marginRight: '10px' }}>[{move.number}]</span>
                                            {move.description}
                                        </td>
                                    </tr>
                                    {move.details.map((det, idx) => (
                                        <tr key={`${move.id}-${idx}`} style={styles.tr}>
                                            <td style={styles.td}></td>
                                            <td style={styles.td}></td>
                                            <td style={styles.td}>{det.account}</td>
                                            <td style={styles.td}>
                                                {det.currency ? <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{det.currency}</span> : ''}
                                                {det.taxBaseAmount > 0 ? <div style={{ fontSize: '10px', color: '#64748b' }}>Base: $ {Number(det.taxBaseAmount).toLocaleString()}</div> : ''}
                                            </td>
                                            <td style={styles.tdAmount}>{det.debit > 0 ? `$ ${Number(det.debit).toLocaleString()}` : '-'}</td>
                                            <td style={styles.tdAmount}>{det.credit > 0 ? `$ ${Number(det.credit).toLocaleString()}` : '-'}</td>
                                            <td style={{ ...styles.tdAmount, fontSize: '11px', color: '#64748b' }}>
                                                {det.foreignDebit > 0 ? `${Number(det.foreignDebit).toLocaleString()} ${det.currency}` : ''}
                                                {det.foreignCredit > 0 ? `${Number(det.foreignCredit).toLocaleString()} ${det.currency}` : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={styles.noData}>No hay transacciones recientes</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div style={styles.container} className="fade-in">

            <div style={styles.contentArea}>
                {loading ? (
                    <div style={styles.loaderContainer}>
                        <div className="spin" style={styles.spinner}></div>
                        <span>Sincronizando con el servidor contable...</span>
                    </div>
                ) : (
                    <div style={styles.viewContainer}>
                        {activeTab === 'puc' && <PUCManager />}
                        {activeTab === 'ledger' && (
                            showEntryForm ? (
                                <JournalEntryForm
                                    onCancel={() => setShowEntryForm(false)}
                                    onSuccess={() => {
                                        setShowEntryForm(false);
                                        fetchData();
                                    }}
                                />
                            ) : renderLedger()
                        )}
                        {activeTab === 'third-parties' && <ThirdPartyManager />}
                        {activeTab === 'cost-centers' && <CostCenterManager />}
                        {activeTab === 'reports' && <TrialBalance />}
                        {activeTab === 'balance-sheet' && <BalanceSheet />}
                        {activeTab === 'income-statement' && <IncomeStatement />}
                        {activeTab === 'budget-execution' && <BudgetExecutionReport />}
                        {activeTab === 'taxes' && <TaxManager />}
                        {activeTab === 'settings' && <CompanyManager />}
                        {activeTab === 'periods' && <PeriodManager />}
                        {activeTab === 'budgets' && <BudgetManager />}
                        {activeTab === 'audit' && <AuditLogView />}
                        {activeTab === 'treasury' && <TreasuryManager />}
                        {activeTab === 'payable' && <AccountsPayableManager />}
                        {activeTab === 'receivable' && <AccountsReceivableManager />}
                        {activeTab === 'assets' && <FixedAssetsManager />}
                        {activeTab === 'exchange-rates' && <ExchangeRateManager />}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100%', display: 'flex', flexDirection: 'column', gap: '0' },
    contentArea: { flex: 1, minHeight: 0 },
    viewContainer: { height: '100%' },
    loaderContainer: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', color: 'var(--text-muted)' },
    spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid var(--primary)', borderRadius: '50%' },

    // Sobrescribir estilos internos de renderPUC y renderLedger para alinearlos
    tabContent: { height: '100%', background: 'white', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' },
    tableHeader: { padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #ffffff, #f8fafc)' },
    tabTitle: { fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: 0 },
    actionButton: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '100px', fontWeight: '700', fontSize: '14px', boxShadow: '0 10px 15px -3px rgba(0, 74, 124, 0.2)' },
    tableContainer: { flex: 1, overflowY: 'auto' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
    th: { textAlign: 'left', padding: '16px 32px', background: '#f8fafc', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)' },
    tr: { transition: 'background 0.2s', '&:hover': { background: '#f8fafc' } },
    td: { padding: '16px 32px', fontSize: '14px', color: '#475569', borderBottom: '1px solid #f1f5f9' },
    tdCode: { padding: '16px 32px', fontSize: '14px', color: 'var(--primary)', fontWeight: '800', borderBottom: '1px solid #f1f5f9' },
    tdAmount: { padding: '16px 32px', fontSize: '15px', textAlign: 'right', fontWeight: '700', borderBottom: '1px solid #f1f5f9' },
    smallAction: { padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--primary)', fontSize: '12px', fontWeight: '700' },
    accBadge: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },
    noData: { padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }
};

export default AccountingView;
