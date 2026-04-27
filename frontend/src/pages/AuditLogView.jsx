import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { History, Search, Filter, Eye, User, Calendar, Database, ShieldAlert } from 'lucide-react';

const AuditLogView = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/audit-logs');
            setLogs(res.data);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionStyle = (action) => {
        switch (action) {
            case 'INSERT': return { background: '#ecfdf5', color: '#059669' };
            case 'UPDATE': return { background: '#eff6ff', color: '#2563eb' };
            case 'DELETE': return { background: '#fef2f2', color: '#dc2626' };
            default: return { background: '#f1f5f9', color: '#475569' };
        }
    };

    if (loading) return <div style={styles.loader}>Cargando historial de auditoría...</div>;

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <ShieldAlert size={24} color="var(--primary)" />
                    <h2 style={styles.title}>Auditoría de Datos (Logs de Cambios)</h2>
                </div>
                <div style={styles.searchBox}>
                    <Search size={18} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Buscar por tabla, acción o usuario..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.content}>
                <div style={styles.tableCard}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Fecha</th>
                                <th style={styles.th}>Usuario</th>
                                <th style={styles.th}>Tabla</th>
                                <th style={styles.th}>Acción</th>
                                <th style={styles.th}>ID Registro</th>
                                <th style={styles.th}>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={styles.dateCell}>
                                            <Calendar size={14} color="#94a3b8" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.userCell}>
                                            <User size={14} color="#94a3b8" />
                                            {log.user?.fullName || 'Sistema'}
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.tableCell}>
                                            <Database size={14} color="#94a3b8" />
                                            <strong>{log.tableName}</strong>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, ...getActionStyle(log.action) }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={styles.td}><code style={styles.code}>{log.recordId}</code></td>
                                    <td style={styles.td}>
                                        <button style={styles.viewBtn} onClick={() => setSelectedLog(log)}>
                                            <Eye size={16} /> Ver Cambios
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedLog && (
                    <div style={styles.detailSidebar} className="slide-in-right">
                        <div style={styles.sidebarHeader}>
                            <h3 style={styles.sidebarTitle}>Detalle del Cambio</h3>
                            <button style={styles.closeBtn} onClick={() => setSelectedLog(null)}><X size={20} /></button>
                        </div>
                        <div style={styles.sidebarBody}>
                            <div style={styles.diffSection}>
                                <h4 style={styles.diffLabel}>Valor Anterior</h4>
                                <pre style={styles.preOld}>{JSON.stringify(selectedLog.oldValue, null, 2) || 'N/A'}</pre>
                            </div>
                            <div style={styles.diffSection}>
                                <h4 style={styles.diffLabel}>Valor Nuevo</h4>
                                <pre style={styles.preNew}>{JSON.stringify(selectedLog.newValue, null, 2) || 'N/A'}</pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    titleSection: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 },
    searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '350px' },
    searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%' },
    content: { display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' },
    tableCard: { background: 'white', borderRadius: '20px', boxShadow: 'var(--shadow-md)', border: '1px solid #e2e8f0', flex: 1, overflowY: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#f8fafc', padding: '15px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 },
    tr: { transition: 'all 0.2s', borderBottom: '1px solid #f8fafc' },
    td: { padding: '12px 20px', fontSize: '13px', color: '#334155' },
    dateCell: { display: 'flex', alignItems: 'center', gap: '6px' },
    userCell: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' },
    tableCell: { display: 'flex', alignItems: 'center', gap: '6px' },
    badge: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' },
    code: { background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#475569' },
    viewBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#64748b' },
    detailSidebar: { width: '400px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)' },
    sidebarHeader: { padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    sidebarTitle: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
    sidebarBody: { padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
    diffSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
    diffLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
    preOld: { background: '#fef2f2', padding: '15px', borderRadius: '12px', fontSize: '11px', color: '#991b1b', whiteSpace: 'pre-wrap', border: '1px solid #fee2e2' },
    preNew: { background: '#f0fdf4', padding: '15px', borderRadius: '12px', fontSize: '11px', color: '#166534', whiteSpace: 'pre-wrap', border: '1px solid #dcfce7' },
    loader: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }
};

const X = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default AuditLogView;
