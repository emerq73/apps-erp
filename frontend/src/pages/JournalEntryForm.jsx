import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle, ArrowLeft, Search, CheckCircle2, Percent } from 'lucide-react';
import api from '../services/auth.service';
import Swal from 'sweetalert2';

const JournalEntryForm = ({ onCancel, onSuccess }) => {
    const [accounts, setAccounts] = useState([]);
    const [thirdParties, setThirdParties] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [header, setHeader] = useState({
        number: `AS-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'DIARIO'
    });

    const [entries, setEntries] = useState([
        { accountId: '', thirdPartyId: '', costCenterId: '', debit: 0, credit: 0, currencyId: '', exchangeRate: 1, foreignDebit: 0, foreignCredit: 0, taxBaseAmount: 0, description: '' },
        { accountId: '', thirdPartyId: '', costCenterId: '', debit: 0, credit: 0, currencyId: '', exchangeRate: 1, foreignDebit: 0, foreignCredit: 0, taxBaseAmount: 0, description: '' }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accs, tps, ccs, taxRes] = await Promise.all([
                    api.get('/accounting/accounts'),
                    api.get('/accounting/third-parties'),
                    api.get('/accounting/cost-centers'),
                    api.get('/accounting/taxes')
                ]);
                setAccounts(accs.data);
                setThirdParties(tps.data);
                setCostCenters(ccs.data);
                setTaxes(taxRes.data.filter(t => t.isActive));
                
                // Intentar cargar monedas si el endpoint existe, si falla no importa por ahora
                try {
                    const currRes = await api.get('/accounting/currencies');
                    setCurrencies(currRes.data || []);
                } catch(e) { /* ignore */ }
            } catch (err) {
                console.error('[Diagnostic] Error fetching form data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addLine = () => {
        setEntries([...entries, { accountId: '', thirdPartyId: '', costCenterId: '', debit: 0, credit: 0, currencyId: '', exchangeRate: 1, foreignDebit: 0, foreignCredit: 0, taxBaseAmount: 0, description: '' }]);
    };

    const removeLine = (index) => {
        if (entries.length <= 1) return;
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index, field, value) => {
        const newEntries = [...entries];
        const entry = { ...newEntries[index], [field]: value };
        
        // Lógica de cálculo bimonetario
        if (field === 'foreignDebit' || field === 'exchangeRate') {
            entry.debit = (Number(entry.foreignDebit || 0) * Number(entry.exchangeRate || 1)).toFixed(2);
        }
        if (field === 'foreignCredit' || field === 'exchangeRate') {
            entry.credit = (Number(entry.foreignCredit || 0) * Number(entry.exchangeRate || 1)).toFixed(2);
        }
        
        newEntries[index] = entry;
        setEntries(newEntries);
    };

    const handleCalculateTax = async () => {
        if (taxes.length === 0) {
            return Swal.fire('Sin impuestos', 'No hay impuestos configurados y activos.', 'warning');
        }

        const { value: taxId } = await Swal.fire({
            title: 'Calcular Impuesto',
            input: 'select',
            inputOptions: taxes.reduce((acc, t) => ({ ...acc, [t.id]: `${t.name} (${t.rate}%)` }), {}),
            inputPlaceholder: 'Seleccione un impuesto',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            inputValidator: (value) => !value && 'Debes seleccionar un impuesto'
        });

        if (!taxId) return;

        const tax = taxes.find(t => t.id === taxId);

        const { value: baseAmount } = await Swal.fire({
            title: `Base para ${tax.name}`,
            input: 'number',
            inputLabel: 'Monto base sobre el cual calcular',
            inputValue: 0,
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
        });

        if (baseAmount === undefined) return;

        const calculatedValue = (parseFloat(baseAmount) * tax.rate) / 100;
        const lastEntry = entries[entries.length - 1];

        // Determinar si es débito o crédito basado en el tipo (Heurística simple)
        const isDebit = tax.type.toLowerCase().includes('retención') ? false : true;

        const { value: side } = await Swal.fire({
            title: '¿Dónde registrar el valor?',
            html: `Monto calculado: <strong>$ ${calculatedValue.toLocaleString()}</strong>`,
            input: 'radio',
            inputOptions: {
                'debit': 'Débito',
                'credit': 'Crédito'
            },
            inputValue: isDebit ? 'debit' : 'credit',
            confirmButtonColor: 'var(--primary)',
        });

        if (!side) return;

        setEntries([...entries, {
            accountId: tax.account?.id || '',
            thirdPartyId: lastEntry.thirdPartyId,
            costCenterId: lastEntry.costCenterId,
            debit: side === 'debit' ? calculatedValue : 0,
            credit: side === 'credit' ? calculatedValue : 0,
            taxBaseAmount: baseAmount,
            foreignDebit: 0,
            foreignCredit: 0,
            exchangeRate: 1,
            description: `${tax.name} sobre $ ${baseAmount}`
        }]);
    };

    const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01 && totalDebit > 0;

    const handleSave = async () => {
        if (!isBalanced) {
            Swal.fire('Error', 'El asiento no está balanceado o no tiene movimientos.', 'error');
            return;
        }

        try {
            const payload = {
                ...header,
                entries: entries.filter(e => e.accountId && (Number(e.debit) > 0 || Number(e.credit) > 0))
            };
            await api.post('/accounting/vouchers', payload);
            Swal.fire('Éxito', 'Comprobante guardado correctamente', 'success');
            onSuccess();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Error al guardar el comprobante', 'error');
        }
    };

    if (loading) return <div style={styles.loader}>Cargando maestros contables...</div>;

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <button onClick={onCancel} style={styles.backBtn}><ArrowLeft size={18} /> Volver</button>
                <div style={styles.titleGroup}>
                    <h2 style={styles.title}>Nuevo Comprobante Contable</h2>
                    <span style={styles.subtitle}>Registro multilínea con partida doble</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleCalculateTax} style={styles.taxBtn}>
                        <Percent size={18} /> Calc. Impuesto
                    </button>
                    <button onClick={handleSave} style={{ ...styles.saveBtn, opacity: isBalanced ? 1 : 0.6 }} disabled={!isBalanced}>
                        <Save size={18} /> Guardar
                    </button>
                </div>
            </div>

            <div style={styles.headerGrid}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Número de Documento</label>
                    <input
                        style={styles.input}
                        value={header.number}
                        onChange={e => setHeader({ ...header, number: e.target.value })}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Fecha</label>
                    <input
                        type="date"
                        style={styles.input}
                        value={header.date}
                        onChange={e => setHeader({ ...header, date: e.target.value })}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Tipo de Comprobante</label>
                    <select
                        style={styles.input}
                        value={header.type}
                        onChange={e => setHeader({ ...header, type: e.target.value })}
                    >
                        <option value="DIARIO">Nota de Contabilidad (Diario)</option>
                        <option value="EGRESO">Comprobante de Egreso</option>
                        <option value="INGRESO">Recibo de Caja (Ingreso)</option>
                    </select>
                </div>
                <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
                    <label style={styles.label}>Descripción General</label>
                    <input
                        placeholder="Ej: Registro de gastos mensuales de energía..."
                        style={styles.input}
                        value={header.description}
                        onChange={e => setHeader({ ...header, description: e.target.value })}
                    />
                </div>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Cuenta Contable</th>
                            <th style={styles.th}>Tercero / C.C.</th>
                            <th style={styles.th}>Moneda / Tasa</th>
                            <th style={styles.th}>Extranjero (D/C)</th>
                            <th style={styles.th}>Base Fisc.</th>
                            <th style={styles.th}>Débito (L)</th>
                            <th style={styles.th}>Crédito (L)</th>
                            <th style={styles.th}>Desc.</th>
                            <th style={styles.th}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, index) => (
                            <tr key={index} style={styles.tr}>
                                <td style={styles.td}>
                                    <select
                                        style={styles.tableSelect}
                                        value={entry.accountId}
                                        onChange={e => updateEntry(index, 'accountId', e.target.value)}
                                    >
                                        <option value="">{accounts.length ? 'Seleccione Cuenta...' : 'Cargando cuentas...'}</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <select
                                            style={styles.tableSelect}
                                            value={entry.thirdPartyId}
                                            onChange={e => updateEntry(index, 'thirdPartyId', e.target.value)}
                                        >
                                            <option value="">Tercero...</option>
                                            {thirdParties.map(tp => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                                        </select>
                                        <select
                                            style={styles.tableSelect}
                                            value={entry.costCenterId}
                                            onChange={e => updateEntry(index, 'costCenterId', e.target.value)}
                                        >
                                            <option value="">C. Costo...</option>
                                            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                                        </select>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <select
                                            style={styles.tableSelect}
                                            value={entry.currencyId || ''}
                                            onChange={e => updateEntry(index, 'currencyId', e.target.value)}
                                        >
                                            <option value="">Local (COP)</option>
                                            {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                                        </select>
                                        {entry.currencyId && (
                                            <input
                                                type="number"
                                                placeholder="Tasa"
                                                style={styles.tableInputSmall}
                                                value={entry.exchangeRate}
                                                onChange={e => updateEntry(index, 'exchangeRate', e.target.value)}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    {entry.currencyId ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <input
                                                type="number"
                                                placeholder="Débito"
                                                style={styles.tableInputSmall}
                                                value={entry.foreignDebit}
                                                onChange={e => updateEntry(index, 'foreignDebit', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Crédito"
                                                style={styles.tableInputSmall}
                                                value={entry.foreignCredit}
                                                onChange={e => updateEntry(index, 'foreignCredit', e.target.value)}
                                            />
                                        </div>
                                    ) : '-'}
                                </td>
                                <td style={styles.td}>
                                    <input
                                        type="number"
                                        style={styles.tableInput}
                                        value={entry.taxBaseAmount}
                                        onChange={e => updateEntry(index, 'taxBaseAmount', e.target.value)}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input
                                        type="number"
                                        style={{ ...styles.tableInput, background: entry.currencyId ? '#f1f5f9' : 'white' }}
                                        value={entry.debit}
                                        readOnly={!!entry.currencyId}
                                        onChange={e => updateEntry(index, 'debit', e.target.value)}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input
                                        type="number"
                                        style={{ ...styles.tableInput, background: entry.currencyId ? '#f1f5f9' : 'white' }}
                                        value={entry.credit}
                                        readOnly={!!entry.currencyId}
                                        onChange={e => updateEntry(index, 'credit', e.target.value)}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input
                                        placeholder="Desc..."
                                        style={styles.tableInput}
                                        value={entry.description}
                                        onChange={e => updateEntry(index, 'description', e.target.value)}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => removeLine(index)} style={styles.delBtn}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={addLine} style={styles.addBtn}><Plus size={18} /> Agregar Línea</button>
            </div>

            <div style={styles.footer}>
                <div style={isBalanced ? styles.balanceSuccess : styles.balanceError}>
                    {isBalanced ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {isBalanced ? 'Asiento Balanceado Correctamente' : `Diferencia: $${difference.toLocaleString()}`}
                </div>
                <div style={styles.totals}>
                    <div style={styles.totalItem}>Total Débito: <strong>$ {totalDebit.toLocaleString()}</strong></div>
                    <div style={styles.totalItem}>Total Crédito: <strong>$ {totalCredit.toLocaleString()}</strong></div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-lg)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px', background: 'none' },
    titleGroup: { textAlign: 'center' },
    title: { fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 },
    subtitle: { fontSize: '13px', color: 'var(--text-muted)' },
    saveBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: '700', boxShadow: '0 4px 6px rgba(0,74,124,0.2)', cursor: 'pointer', border: 'none' },
    taxBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#f8fafc', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    headerGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' },
    input: { padding: '10px 14px', borderRadius: '10px', fontSize: '14px' },
    tableWrapper: { flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { position: 'sticky', top: 0, background: '#f1f5f9', padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', zIndex: 1 },
    tr: { '&:hover': { background: '#fcfcfc' } },
    td: { padding: '8px 16px', borderBottom: '1px solid #f1f5f9' },
    tableSelect: { width: '100%', padding: '8px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', outline: 'none' },
    tableInput: { width: '100%', padding: '8px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', fontSize: '13px', outline: 'none' },
    tableInputSmall: { width: '100%', padding: '4px 8px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', fontSize: '12px', outline: 'none' },
    addBtn: { margin: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '700', fontSize: '14px', background: 'none' },
    delBtn: { color: '#cbd5e1', '&:hover': { color: 'var(--danger)' }, background: 'none' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' },
    balanceSuccess: { display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: '700', fontSize: '14px' },
    balanceError: { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', fontWeight: '700', fontSize: '14px' },
    totals: { display: 'flex', gap: '32px' },
    totalItem: { fontSize: '14px', color: 'var(--text-muted)' },
    loader: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' },
    spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid var(--primary)', borderRadius: '50%' },
};

export default JournalEntryForm;
