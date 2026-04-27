import React, { useState, useEffect } from 'react';
import api from '../../services/auth.service';
import { Search, Calendar, FileText, FileSpreadsheet, Download, Printer, PieChart } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BalanceSheet = () => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Reutilizamos el motor del balance de prueba pero con fecha inicial muy antigua para tener saldos acumulados
            const res = await api.get(`/accounting/reports/trial-balance?startDate=2000-01-01&endDate=${date}`);
            // Filtrar solo cuentas reales (Activo: 1, Pasivo: 2, Patrimonio: 3)
            const filtered = res.data.filter(acc => ['1', '2', '3'].includes(acc.code[0]));
            setReportData(filtered);
        } catch (err) {
            console.error('Error fetching report:', err);
            Swal.fire('Error', 'No se pudo generar el balance general', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompany = async () => {
        try {
            const res = await api.get('/accounting/company');
            return res.data;
        } catch (err) {
            return null;
        }
    };

    const assets = reportData.filter(acc => acc.code.startsWith('1'));
    const liabilities = reportData.filter(acc => acc.code.startsWith('2'));
    const equity = reportData.filter(acc => acc.code.startsWith('3'));

    const totalAssets = assets.reduce((acc, curr) => acc + curr.finalBalance, 0);
    const totalLiabilities = liabilities.reduce((acc, curr) => acc + curr.finalBalance, 0);
    const totalEquity = equity.reduce((acc, curr) => acc + curr.finalBalance, 0);

    const exportToExcel = () => {
        if (reportData.length === 0) return Swal.fire('Sin datos', 'No hay información para exportar', 'warning');

        const worksheetData = reportData.map(row => ({
            'Código': row.code,
            'Cuenta': row.name,
            'Saldo': row.finalBalance,
            'Categoría': row.code.startsWith('1') ? 'ACTIVO' : row.code.startsWith('2') ? 'PASIVO' : 'PATRIMONIO'
        }));

        const ws = XLSX.utils.json_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Balance General");
        XLSX.writeFile(wb, `Balance_General_${date}.xlsx`);
    };

    const exportToPDF = async () => {
        if (reportData.length === 0) return Swal.fire('Sin datos', 'No hay información para exportar', 'warning');

        const companyInfo = await fetchCompany();
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text(companyInfo?.name?.toUpperCase() || "HOTEL ERP", 105, 15, { align: 'center' });
        doc.setFontSize(10);
        if (companyInfo?.nit) doc.text(`NIT: ${companyInfo.nit}`, 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.text("BALANCE GENERAL", 105, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`A fecha de corte: ${date}`, 105, 36, { align: 'center' });

        const createSection = (title, data, startY) => {
            doc.setFontSize(12);
            doc.text(title, 14, startY);
            autoTable(doc, {
                head: [["Código", "Cuenta", "Saldo"]],
                body: data.map(row => [row.code, row.name, `$ ${row.finalBalance.toLocaleString()}`]),
                startY: startY + 5,
                theme: 'striped',
                headStyles: { fillColor: [71, 85, 105] },
                columnStyles: { 2: { halign: 'right' } }
            });
            return doc.lastAutoTable.finalY + 10;
        };

        let currentY = 45;
        currentY = createSection("ACTIVOS", assets, currentY);
        currentY = createSection("PASIVOS", liabilities, currentY);
        currentY = createSection("PATRIMONIO", equity, currentY);

        // Totals summary
        doc.setFontSize(12);
        doc.text(`TOTAL ACTIVOS: $ ${totalAssets.toLocaleString()}`, 110, currentY, { align: 'right' });
        doc.text(`TOTAL PASIVO + PATRIMONIO: $ ${(totalLiabilities + totalEquity).toLocaleString()}`, 110, currentY + 7, { align: 'right' });

        doc.save(`Balance_General_${date}.pdf`);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <div style={styles.iconBox}>
                        <PieChart size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h2 style={styles.title}>Balance General</h2>
                        <p style={styles.subtitle}>Estado financiero de Activos, Pasivos y Patrimonio.</p>
                    </div>
                </div>

                <div style={styles.controls}>
                    <div style={styles.datePicker}>
                        <Calendar size={16} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <button style={styles.button} onClick={fetchReport} disabled={loading}>
                        <Search size={18} />
                        {loading ? 'Generando...' : 'Generar'}
                    </button>
                    <div style={styles.divider} />
                    <button style={{ ...styles.iconButton, color: '#10b981' }} title="Exportar Excel" onClick={exportToExcel}>
                        <FileSpreadsheet size={18} />
                    </button>
                    <button style={{ ...styles.iconButton, color: '#ef4444' }} title="Exportar PDF" onClick={exportToPDF}>
                        <FileText size={18} />
                    </button>
                </div>
            </div>

            <div style={styles.reportContent}>
                <div style={styles.summaryCards}>
                    <div style={{ ...styles.card, borderLeft: '5px solid #10b981' }}>
                        <span style={styles.cardLabel}>Total Activos</span>
                        <span style={styles.cardValue}>$ {totalAssets.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.card, borderLeft: '5px solid #ef4444' }}>
                        <span style={styles.cardLabel}>Total Pasivos</span>
                        <span style={styles.cardValue}>$ {totalLiabilities.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.card, borderLeft: '5px solid #3b82f6' }}>
                        <span style={styles.cardLabel}>Total Patrimonio</span>
                        <span style={styles.cardValue}>$ {totalEquity.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.card, borderLeft: '5px solid #6366f1', background: '#f8fafc' }}>
                        <span style={styles.cardLabel}>Ecuación Patrimonial (A - P - Pt)</span>
                        <span style={{ ...styles.cardValue, color: totalAssets - totalLiabilities - totalEquity === 0 ? '#10b981' : '#f59e0b' }}>
                            $ {(totalAssets - totalLiabilities - totalEquity).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div style={styles.grid}>
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>ACTIVOS</h3>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Código</th>
                                        <th style={styles.th}>Cuenta</th>
                                        <th style={{ ...styles.th, textAlign: 'right' }}>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map(acc => (
                                        <tr key={acc.id} style={styles.tr}>
                                            <td style={styles.td}>{acc.code}</td>
                                            <td style={styles.td}>{acc.name}</td>
                                            <td style={{ ...styles.td, textAlign: 'right' }}>$ {acc.finalBalance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>PASIVOS Y PATRIMONIO</h3>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Código</th>
                                        <th style={styles.th}>Cuenta</th>
                                        <th style={{ ...styles.th, textAlign: 'right' }}>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td colSpan="3" style={styles.categoryTitle}>Pasivos</td></tr>
                                    {liabilities.map(acc => (
                                        <tr key={acc.id} style={styles.tr}>
                                            <td style={styles.td}>{acc.code}</td>
                                            <td style={styles.td}>{acc.name}</td>
                                            <td style={{ ...styles.td, textAlign: 'right' }}>$ {acc.finalBalance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr><td colSpan="3" style={styles.categoryTitle}>Patrimonio</td></tr>
                                    {equity.map(acc => (
                                        <tr key={acc.id} style={styles.tr}>
                                            <td style={styles.td}>{acc.code}</td>
                                            <td style={styles.td}>{acc.name}</td>
                                            <td style={{ ...styles.td, textAlign: 'right' }}>$ {acc.finalBalance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' },
    titleSection: { display: 'flex', alignItems: 'center', gap: '15px' },
    iconBox: { padding: '10px', background: '#f1f5f9', borderRadius: '10px' },
    title: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' },
    subtitle: { margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' },
    controls: { display: 'flex', alignItems: 'center', gap: '12px' },
    datePicker: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' },
    input: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#1e293b', cursor: 'pointer' },
    button: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
    iconButton: { background: 'white', border: '1px solid #e2e8f0', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
    divider: { width: '1px', height: '24px', background: '#e2e8f0', margin: '0 8px' },

    summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
    card: { background: 'white', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '4px' },
    cardLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
    cardValue: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },

    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    section: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0' },
    sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#475569', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f1f5f9' },
    tableWrapper: { maxHeight: '500px', overflowY: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #f1f5f9', fontWeight: '700' },
    td: { padding: '12px', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f8fafc' },
    tr: { transition: 'background 0.2s' },
    categoryTitle: { padding: '15px 12px 5px 12px', fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', background: '#f8fafc' }
};

export default BalanceSheet;
