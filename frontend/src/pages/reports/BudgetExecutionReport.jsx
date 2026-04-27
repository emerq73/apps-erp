import React, { useState, useEffect } from 'react';
import api from '../../services/auth.service';
import { Target, TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';

const BudgetExecutionReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchReport();
    }, [year]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/reports/budget-vs-execution?year=${year}`);
            setReportData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPerformanceColor = (perf) => {
        if (perf > 100) return '#ef4444'; // Over budget
        if (perf > 90) return '#f59e0b'; // Near limit
        return '#10b981'; // Good
    };

    if (loading) return <div style={styles.loader}>Calculando ejecución presupuestal...</div>;

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Presupuesto vs. Ejecución</h2>
                    <p style={styles.subtitle}>Comparativa anual de metas financieras</p>
                </div>
                <div style={styles.filterBox}>
                    <Calendar size={18} color="#94a3b8" />
                    <select style={styles.select} value={year} onChange={e => setYear(e.target.value)}>
                        <option value="2024">Año 2024</option>
                        <option value="2025">Año 2025</option>
                        <option value="2026">Año 2026</option>
                    </select>
                </div>
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Cuenta / Centro</th>
                            <th style={styles.th}>Presupuestado</th>
                            <th style={styles.th}>Ejecutado</th>
                            <th style={styles.th}>Variación</th>
                            <th style={styles.th}>% Ejecución</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, idx) => (
                            <tr key={idx} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={styles.accName}>{item.account}</span>
                                        <span style={styles.ccName}>{item.costCenter}</span>
                                    </div>
                                </td>
                                <td style={styles.tdAmount}>$ {Number(item.budget).toLocaleString()}</td>
                                <td style={styles.tdAmount}>$ {Number(item.actual).toLocaleString()}</td>
                                <td style={{ ...styles.tdAmount, color: item.variance < 0 ? '#ef4444' : '#10b981' }}>
                                    {item.variance < 0 ? '-' : '+'} $ {Math.abs(item.variance).toLocaleString()}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.perfWrapper}>
                                        <div style={styles.progressBg}>
                                            <div style={{ 
                                                ...styles.progressFill, 
                                                width: `${Math.min(item.performance, 100)}%`,
                                                background: getPerformanceColor(item.performance)
                                            }} />
                                        </div>
                                        <span style={{ ...styles.perfLabel, color: getPerformanceColor(item.performance) }}>
                                            {item.performance.toFixed(1)}%
                                        </span>
                                    </div>
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
    container: { padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    filterBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    select: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#1e293b' },
    tableCard: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-md)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#f8fafc', padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '16px 24px' },
    tdAmount: { padding: '16px 24px', textAlign: 'right', fontWeight: '700', fontSize: '14px' },
    accName: { fontSize: '14px', fontWeight: '700', color: '#1e293b' },
    ccName: { fontSize: '11px', color: '#94a3b8', fontWeight: '600' },
    perfWrapper: { display: 'flex', alignItems: 'center', gap: '12px' },
    progressBg: { flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', transition: 'width 0.5s ease-out' },
    perfLabel: { fontSize: '12px', fontWeight: '800', width: '45px' },
    loader: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }
};

export default BudgetExecutionReport;
