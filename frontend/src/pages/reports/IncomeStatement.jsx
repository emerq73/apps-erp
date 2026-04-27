import React, { useState, useEffect } from 'react';
import api from '../../services/auth.service';
import { Search, Calendar, FileText, FileSpreadsheet, Download, Printer, BarChart3 } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const IncomeStatement = () => {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [dates, setDates] = useState({ start: firstDay, end: today });
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/reports/trial-balance?startDate=${dates.start}&endDate=${dates.end}`);
            // Filtrar solo cuentas nominales (Ingresos: 4, Gastos: 5, Costos: 6)
            const filtered = res.data.filter(acc => ['4', '5', '6'].includes(acc.code[0]));
            setReportData(filtered);
        } catch (err) {
            console.error('Error fetching report:', err);
            Swal.fire('Error', 'No se pudo generar el estado de resultados', 'error');
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

    const revenues = reportData.filter(acc => acc.code.startsWith('4'));
    const expenses = reportData.filter(acc => acc.code.startsWith('5'));
    const costs = reportData.filter(acc => acc.code.startsWith('6'));

    // Calcular totales de periodo (Movimiento Neto = Créditos - Débitos para ingresos, Débitos - Créditos para gastos)
    const totalRevenues = revenues.reduce((acc, curr) => acc + (curr.credit - curr.debit), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.debit - curr.credit), 0);
    const totalCosts = costs.reduce((acc, curr) => acc + (curr.debit - curr.credit), 0);
    const netIncome = totalRevenues - totalExpenses - totalCosts;

    const exportToExcel = () => {
        if (reportData.length === 0) return Swal.fire('Sin datos', 'No hay información para exportar', 'warning');

        const worksheetData = reportData.map(row => ({
            'Código': row.code,
            'Cuenta': row.name,
            'Monto': row.code.startsWith('4') ? (row.credit - row.debit) : (row.debit - row.credit),
            'Categoría': row.code.startsWith('4') ? 'INGRESOS' : row.code.startsWith('5') ? 'GASTOS' : 'COSTOS'
        }));

        const ws = XLSX.utils.json_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estado de Resultados");
        XLSX.writeFile(wb, `P&G_${dates.start}_a_${dates.end}.xlsx`);
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
        doc.text("ESTADO DE RESULTADOS (P&G)", 105, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Periodo: ${dates.start} a ${dates.end}`, 105, 36, { align: 'center' });

        const createSection = (title, data, startY, type) => {
            doc.setFontSize(12);
            doc.text(title, 14, startY);
            autoTable(doc, {
                head: [["Código", "Cuenta", "Monto"]],
                body: data.map(row => [
                    row.code,
                    row.name,
                    `$ ${(type === 'rev' ? (row.credit - row.debit) : (row.debit - row.credit)).toLocaleString()}`
                ]),
                startY: startY + 5,
                theme: 'striped',
                headStyles: { fillColor: [71, 85, 105] },
                columnStyles: { 2: { halign: 'right' } }
            });
            return doc.lastAutoTable.finalY + 10;
        };

        let currentY = 45;
        currentY = createSection("INGRESOS OPERACIONALES", revenues, currentY, 'rev');
        currentY = createSection("COSTOS DE VENTAS", costs, currentY, 'cost');
        currentY = createSection("GASTOS OPERACIONALES", expenses, currentY, 'exp');

        // Totals summary
        doc.setFontSize(12);
        doc.text(`UTILIDAD / PÉRDIDA NETA: $ ${netIncome.toLocaleString()}`, 110, currentY, { align: 'right' });

        doc.save(`Estado_Resultados_${dates.start}_a_${dates.end}.pdf`);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <div style={styles.iconBox}>
                        <BarChart3 size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h2 style={styles.title}>Estado de Resultados (P&G)</h2>
                        <p style={styles.subtitle}>Relación de Ingresos, Gastos y Costos del periodo.</p>
                    </div>
                </div>

                <div style={styles.controls}>
                    <div style={styles.dateRange}>
                        <Calendar size={16} />
                        <input
                            type="date"
                            value={dates.start}
                            onChange={(e) => setDates({ ...dates, start: e.target.value })}
                            style={styles.input}
                        />
                        <span>a</span>
                        <input
                            type="date"
                            value={dates.end}
                            onChange={(e) => setDates({ ...dates, end: e.target.value })}
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
                        <span style={styles.cardLabel}>Total Ingresos</span>
                        <span style={styles.cardValue}>$ {totalRevenues.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.card, borderLeft: '5px solid #f59e0b' }}>
                        <span style={styles.cardLabel}>Total Costos</span>
                        <span style={styles.cardValue}>$ {totalCosts.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.card, borderLeft: '5px solid #ef4444' }}>
                        <span style={styles.cardLabel}>Total Gastos</span>
                        <span style={styles.cardValue}>$ {totalExpenses.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.card, borderLeft: `5px solid ${netIncome >= 0 ? '#10b981' : '#dc2626'}`, background: '#f8fafc' }}>
                        <span style={styles.cardLabel}>Utilidad / Pérdida del Ejercicio</span>
                        <span style={{ ...styles.cardValue, color: netIncome >= 0 ? '#10b981' : '#dc2626' }}>
                            $ {netIncome.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div style={styles.sectionsFlow}>
                    {/* INGRESOS */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>INGRESOS OPERACIONALES</h3>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Código</th>
                                        <th style={styles.th}>Cuenta</th>
                                        <th style={{ ...styles.th, textAlign: 'right' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {revenues.map(acc => (
                                        <tr key={acc.id} style={styles.tr}>
                                            <td style={styles.td}>{acc.code}</td>
                                            <td style={styles.td}>{acc.name}</td>
                                            <td style={{ ...styles.td, textAlign: 'right' }}>$ {(acc.credit - acc.debit).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {revenues.length === 0 && <tr><td colSpan="3" style={styles.noData}>Sin ingresos registrados</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* COSTOS */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>COSTOS DE VENTAS</h3>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Código</th>
                                        <th style={styles.th}>Cuenta</th>
                                        <th style={{ ...styles.th, textAlign: 'right' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {costs.map(acc => (
                                        <tr key={acc.id} style={styles.tr}>
                                            <td style={styles.td}>{acc.code}</td>
                                            <td style={styles.td}>{acc.name}</td>
                                            <td style={{ ...styles.td, textAlign: 'right' }}>$ {(acc.debit - acc.credit).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {costs.length === 0 && <tr><td colSpan="3" style={styles.noData}>Sin costos registrados</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* GASTOS */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>GASTOS OPERACIONALES</h3>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Código</th>
                                        <th style={styles.th}>Cuenta</th>
                                        <th style={{ ...styles.th, textAlign: 'right' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(acc => (
                                        <tr key={acc.id} style={styles.tr}>
                                            <td style={styles.td}>{acc.code}</td>
                                            <td style={styles.td}>{acc.name}</td>
                                            <td style={{ ...styles.td, textAlign: 'right' }}>$ {(acc.debit - acc.credit).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && <tr><td colSpan="3" style={styles.noData}>Sin gastos registrados</td></tr>}
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
    iconBox: { padding: '10px', background: '#f8fafc', borderRadius: '10px' },
    title: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' },
    subtitle: { margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' },
    controls: { display: 'flex', alignItems: 'center', gap: '12px' },
    dateRange: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' },
    input: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1e293b', cursor: 'pointer' },
    button: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
    iconButton: { background: 'white', border: '1px solid #e2e8f0', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    divider: { width: '1px', height: '24px', background: '#e2e8f0', margin: '0 8px' },

    summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
    card: { background: 'white', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '4px' },
    cardLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
    cardValue: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },

    sectionsFlow: { display: 'flex', flexDirection: 'column', gap: '24px' },
    section: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0' },
    sectionTitle: { fontSize: '15px', fontWeight: '800', color: '#475569', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f1f5f9' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #f1f5f9', fontWeight: '700' },
    td: { padding: '12px', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f8fafc' },
    tr: { transition: 'background 0.2s' },
    noData: { textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }
};

export default IncomeStatement;
