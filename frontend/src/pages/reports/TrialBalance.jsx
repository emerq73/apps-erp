import React, { useState, useEffect } from 'react';
import api from '../../services/auth.service';
import { Search, Calendar, FileText, FileSpreadsheet, Download, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TrialBalance = () => {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [dates, setDates] = useState({ start: firstDay, end: today });
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/reports/trial-balance?startDate=${dates.start}&endDate=${dates.end}`);
            setReportData(res.data);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el balance de prueba.'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCompany = async () => {
        try {
            const res = await api.get('/accounting/company');
            return res.data;
        } catch (err) {
            console.error('Error fetching company for PDF:', err);
            return null;
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const exportToExcel = () => {
        if (reportData.length === 0) return Swal.fire('Sin datos', 'No hay información para exportar', 'warning');

        const worksheetData = reportData.map(row => ({
            'Código': row.code,
            'Cuenta': row.name,
            'Saldo Inicial': row.initialBalance,
            'Débitos': row.debit,
            'Créditos': row.credit,
            'Saldo Final': row.finalBalance
        }));

        const ws = XLSX.utils.json_to_sheet(worksheetData);

        // Add totals row
        const totalRow = {
            'Código': '',
            'Cuenta': 'TOTALES',
            'Saldo Inicial': totals.initial,
            'Débitos': totals.debit,
            'Créditos': totals.credit,
            'Saldo Final': totals.final
        };
        XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Balance de Prueba");
        XLSX.writeFile(wb, `Balance_de_Prueba_${dates.start}_a_${dates.end}.xlsx`);
    };

    const exportToPDF = async () => {
        if (reportData.length === 0) return Swal.fire('Sin datos', 'No hay información para exportar', 'warning');

        const companyInfo = await fetchCompany();
        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.text(companyInfo?.name?.toUpperCase() || "HOTEL ERP", 105, 15, { align: 'center' });
        doc.setFontSize(10);
        if (companyInfo?.nit) doc.text(`NIT: ${companyInfo.nit}`, 105, 20, { align: 'center' });
        if (companyInfo?.address) doc.text(companyInfo.address, 105, 25, { align: 'center' });

        doc.setFontSize(12);
        doc.text("BALANCE DE PRUEBA", 105, 35, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Periodo: ${dates.start} a ${dates.end}`, 105, 40, { align: 'center' });
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 45, { align: 'center' });

        const tableColumn = ["Código", "Cuenta", "Saldo Inicial", "Débitos", "Créditos", "Saldo Final"];
        const tableRows = reportData.map(row => [
            row.code,
            row.name,
            `$ ${row.initialBalance.toLocaleString()}`,
            `$ ${row.debit.toLocaleString()}`,
            `$ ${row.credit.toLocaleString()}`,
            `$ ${row.finalBalance.toLocaleString()}`
        ]);

        // Add totals row
        tableRows.push([
            '',
            'TOTALES',
            `$ ${totals.initial.toLocaleString()}`,
            `$ ${totals.debit.toLocaleString()}`,
            `$ ${totals.credit.toLocaleString()}`,
            `$ ${totals.final.toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [0, 74, 124], textColor: 255 },
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontWeight: 'bold' },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
            },
            didParseCell: function (data) {
                if (data.row.index === tableRows.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save(`Balance_de_Prueba_${dates.start}_a_${dates.end}.pdf`);
    };

    const totals = reportData.reduce((acc, curr) => ({
        initial: acc.initial + curr.initialBalance,
        debit: acc.debit + curr.debit,
        credit: acc.credit + curr.credit,
        final: acc.final + curr.finalBalance
    }), { initial: 0, debit: 0, credit: 0, final: 0 });

    return (
        <div style={styles.container}>
            <div style={styles.filterBar}>
                <div style={styles.filterGroup}>
                    <div style={styles.inputWithIcon}>
                        <Calendar size={16} color="#64748b" />
                        <input
                            type="date"
                            style={styles.dateInput}
                            value={dates.start}
                            onChange={e => setDates({ ...dates, start: e.target.value })}
                        />
                    </div>
                    <span style={styles.dateSeparator}>a</span>
                    <div style={styles.inputWithIcon}>
                        <Calendar size={16} color="#64748b" />
                        <input
                            type="date"
                            style={styles.dateInput}
                            value={dates.end}
                            onChange={e => setDates({ ...dates, end: e.target.value })}
                        />
                    </div>
                    <button style={styles.searchButton} onClick={fetchReport} disabled={loading}>
                        <Search size={16} />
                        {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
                </div>

                <div style={styles.actionGroup}>
                    <button style={{ ...styles.iconButton, color: '#10b981' }} title="Descargar Excel" onClick={exportToExcel}>
                        <FileSpreadsheet size={18} />
                    </button>
                    <button style={{ ...styles.iconButton, color: '#ef4444' }} title="Descargar PDF" onClick={exportToPDF}>
                        <FileText size={18} />
                    </button>
                </div>
            </div>

            <div style={styles.reportCard}>
                <div style={styles.reportHeader}>
                    <h2 style={styles.reportTitle}>Balance de Prueba</h2>
                    <p style={styles.reportSubtitle}>Periodo: {dates.start} al {dates.end}</p>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Código</th>
                                <th style={styles.th}>Cuenta</th>
                                <th style={styles.thRight}>Saldo Inicial</th>
                                <th style={styles.thRight}>Débitos</th>
                                <th style={styles.thRight}>Créditos</th>
                                <th style={styles.thRight}>Saldo Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? reportData.map((row, idx) => (
                                <tr key={idx} style={styles.tr}>
                                    <td style={styles.tdCode}>{row.code}</td>
                                    <td style={styles.td}>{row.name}</td>
                                    <td style={styles.tdAmount}>$ {row.initialBalance.toLocaleString()}</td>
                                    <td style={styles.tdAmount}>$ {row.debit.toLocaleString()}</td>
                                    <td style={styles.tdAmount}>$ {row.credit.toLocaleString()}</td>
                                    <td style={{ ...styles.tdAmount, fontWeight: '700', color: row.finalBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                                        $ {row.finalBalance.toLocaleString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={styles.noData}>No hay movimientos en este periodo</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={styles.footerRow}>
                                <td colSpan="2" style={styles.tdTotalLabel}>TOTALES</td>
                                <td style={styles.tdTotalAmount}>$ {totals.initial.toLocaleString()}</td>
                                <td style={styles.tdTotalAmount}>$ {totals.debit.toLocaleString()}</td>
                                <td style={styles.tdTotalAmount}>$ {totals.credit.toLocaleString()}</td>
                                <td style={styles.tdTotalAmount}>$ {totals.final.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {reportData.length > 0 && Math.abs(totals.debit - totals.credit) > 0.01 && (
                    <div style={styles.warningBox}>
                        ⚠️ El balance no está cuadrado. Diferencia: $ {(totals.debit - totals.credit).toLocaleString()}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '20px' },
    filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
    inputWithIcon: { display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', background: '#f8fafc' },
    dateInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#1e293b' },
    dateSeparator: { color: '#64748b', fontSize: '14px' },
    searchButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', padding: '9px 18px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
    actionGroup: { display: 'flex', gap: '8px' },
    iconButton: { padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', background: 'white' },

    reportCard: { background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow-md)', border: '1px solid #e2e8f0' },
    reportHeader: { textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' },
    reportTitle: { fontSize: '22px', color: 'var(--primary)', fontWeight: '700', marginBottom: '5px' },
    reportSubtitle: { fontSize: '14px', color: '#64748b' },

    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px 15px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' },
    thRight: { textAlign: 'right', padding: '12px 15px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
    td: { padding: '12px 15px', fontSize: '14px', color: '#334155' },
    tdCode: { padding: '12px 15px', fontSize: '13px', color: 'var(--primary)', fontWeight: '600' },
    tdAmount: { padding: '12px 15px', fontSize: '14px', textAlign: 'right', fontFamily: 'monospace' },
    noData: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '15px' },

    footerRow: { background: '#f8fafc', borderTop: '2px solid #e2e8f0' },
    tdTotalLabel: { padding: '15px', fontSize: '14px', fontWeight: '800', color: 'var(--primary)' },
    tdTotalAmount: { padding: '15px', fontSize: '15px', fontWeight: '800', textAlign: 'right', color: 'var(--primary)' },

    warningBox: { marginTop: '20px', padding: '12px 20px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', color: '#c2410c', fontSize: '14px', fontWeight: '600', textAlign: 'center' }
};

export default TrialBalance;
