import React, { useState, useEffect } from 'react';
import api from '../services/auth.service';
import { Edit2, Save, X, Search, CheckCircle, XCircle, ShieldCheck, User, Layers, FileSpreadsheet, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const PUCManager = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingAccount, setEditingAccount] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/accounting/accounts');
            setAccounts(res.data);
        } catch (err) {
            console.error('Error fetching PUC:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (acc) => {
        setEditingAccount(acc.id);
        setEditData({
            type: acc.type || 'activo',
            nature: acc.nature || 'débito',
            niifGroup: acc.niifGroup || 'grupo2',
            niifClassification: acc.niifClassification || '',
            requiresThirdParty: acc.requiresThirdParty || false,
            requiresCostCenter: acc.requiresCostCenter || false,
            isActive: acc.isActive !== false
        });
    };

    const handleSave = async (id) => {
        try {
            await api.put(`/accounting/accounts/${id}`, editData);
            Swal.fire({
                icon: 'success',
                title: 'Cuenta Actualizada',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
            setEditingAccount(null);
            fetchAccounts();
        } catch (err) {
            Swal.fire('Error', 'No se pudo actualizar la cuenta', 'error');
        }
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) throw new Error("Archivo vacío");

                const result = await Swal.fire({
                    title: '¿Importar PUC?',
                    text: `Se detectaron ${data.length} cuentas. Esto actualizará los registros existentes y creará los nuevos.`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, importar'
                });

                if (result.isConfirmed) {
                    await api.post('/accounting/accounts/bulk-import', { accounts: data });
                    Swal.fire('Éxito', 'PUC actualizado correctamente', 'success');
                    fetchAccounts();
                }
            } catch (err) {
                Swal.fire('Error', 'No se pudo procesar el archivo. Asegúrate de que las columnas coincidan con el modelo (code, name, type, nature).', 'error');
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.code.includes(searchTerm) ||
        acc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={styles.loader}>Cargando Plan Único de Cuentas...</div>;

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Administración del PUC</h2>
                    <p style={styles.subtitle}>Plan Único de Cuentas con soporte NIIF</p>
                </div>
                
                <div style={styles.actionsHeader}>
                    <div style={styles.searchBox}>
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <label style={styles.importBtn}>
                        <FileSpreadsheet size={18} />
                        Importar Excel
                        <input type="file" hidden accept=".xlsx, .xls" onChange={handleExcelImport} />
                    </label>
                </div>
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Código</th>
                            <th style={styles.th}>Nombre</th>
                            <th style={styles.th}>Tipo / NIIF</th>
                            <th style={styles.th}>Naturaleza</th>
                            <th style={styles.th} title="Requiere Tercero">TP</th>
                            <th style={styles.th} title="Requiere Centro de Costo">CC</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAccounts.map(acc => (
                            <tr key={acc.id} style={{ ...styles.tr, opacity: acc.isActive ? 1 : 0.6 }}>
                                <td style={styles.tdCode}>{acc.code}</td>
                                <td style={styles.tdName}>{acc.name}</td>
                                <td style={styles.td}>
                                    {editingAccount === acc.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <select
                                                style={styles.select}
                                                value={editData.type}
                                                onChange={e => setEditData({ ...editData, type: e.target.value })}
                                            >
                                                <option value="activo">Activo</option>
                                                <option value="pasivo">Pasivo</option>
                                                <option value="patrimonio">Patrimonio</option>
                                                <option value="ingreso">Ingreso</option>
                                                <option value="gasto">Gasto</option>
                                                <option value="costo">Costo</option>
                                            </select>
                                            <select
                                                style={styles.select}
                                                value={editData.niifGroup}
                                                onChange={e => setEditData({ ...editData, niifGroup: e.target.value })}
                                            >
                                                <option value="grupo1">NIIF Grupo 1</option>
                                                <option value="grupo2">NIIF Grupo 2</option>
                                                <option value="grupo3">NIIF Grupo 3</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={styles.badge}>{acc.type?.toUpperCase()}</span>
                                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{acc.niifGroup?.toUpperCase()}</span>
                                        </div>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    {editingAccount === acc.id ? (
                                        <select
                                            style={styles.select}
                                            value={editData.nature}
                                            onChange={e => setEditData({ ...editData, nature: e.target.value })}
                                        >
                                            <option value="débito">Débito</option>
                                            <option value="crédito">Crédito</option>
                                        </select>
                                    ) : (
                                        <span>{acc.nature}</span>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    {editingAccount === acc.id ? (
                                        <input
                                            type="checkbox"
                                            checked={editData.requiresThirdParty}
                                            onChange={e => setEditData({ ...editData, requiresThirdParty: e.target.checked })}
                                        />
                                    ) : (
                                        acc.requiresThirdParty ? <User size={16} color="var(--primary)" /> : '-'
                                    )}
                                </td>
                                <td style={styles.td}>
                                    {editingAccount === acc.id ? (
                                        <input
                                            type="checkbox"
                                            checked={editData.requiresCostCenter}
                                            onChange={e => setEditData({ ...editData, requiresCostCenter: e.target.checked })}
                                        />
                                    ) : (
                                        acc.requiresCostCenter ? <Layers size={16} color="var(--primary)" /> : '-'
                                    )}
                                </td>
                                <td style={styles.td}>
                                    {editingAccount === acc.id ? (
                                        <div style={styles.actions}>
                                            <button style={styles.saveBtn} onClick={() => handleSave(acc.id)}><Save size={16} /></button>
                                            <button style={styles.cancelBtn} onClick={() => setEditingAccount(null)}><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <button style={styles.editBtn} onClick={() => handleEdit(acc)}><Edit2 size={16} /></button>
                                    )}
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
    container: { padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    actionsHeader: { display: 'flex', gap: '15px', alignItems: 'center' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px' },
    searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%' },
    importBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    tableCard: { background: 'white', borderRadius: '20px', boxShadow: 'var(--shadow-md)', overflow: 'hidden', border: '1px solid #e2e8f0', flex: 1, overflowY: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#f8fafc', padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 },
    tr: { transition: 'all 0.2s', borderBottom: '1px solid #f8fafc' },
    td: { padding: '12px 20px', fontSize: '14px', color: '#334155' },
    tdCode: { padding: '12px 20px', fontSize: '14px', fontWeight: '800', color: 'var(--primary)' },
    tdName: { padding: '12px 20px', fontSize: '14px', fontWeight: '600' },
    badge: { background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
    select: { padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' },
    actions: { display: 'flex', gap: '8px' },
    editBtn: { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
    saveBtn: { background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
    cancelBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
    loader: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }
};

export default PUCManager;
