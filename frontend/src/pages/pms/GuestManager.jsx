import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, User } from 'lucide-react';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

const GuestManager = () => {
    const [guests, setGuests] = useState([]);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ docType: 'CC', nationality: 'Colombia' });

    const fetchGuests = async () => {
        const res = await api.get(`/pms/guests?search=${search}`);
        setGuests(res.data);
    };

    useEffect(() => { fetchGuests(); }, [search]);

    const openForm = (g = null) => { setEditing(g); setForm(g || { docType: 'CC', nationality: 'Colombia' }); setShowForm(true); };

    const handleSave = async () => {
        try {
            editing ? await api.put(`/pms/guests/${editing.id}`, form) : await api.post('/pms/guests', form);
            setShowForm(false); fetchGuests();
            Swal.fire('Guardado', '', 'success');
        } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Error', 'error'); }
    };

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar huésped?', icon: 'warning', showCancelButton: true });
        if (!isConfirmed) return;
        await api.delete(`/pms/guests/${id}`);
        fetchGuests();
    };

    const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    return (
        <div className="fade-in">
            <div style={s.header}>
                <h2 style={s.title}>Huéspedes</h2>
                <div style={{ display:'flex', gap:'10px' }}>
                    <div style={s.searchBox}>
                        <Search size={16} color="#94a3b8"/>
                        <input style={s.searchInput} placeholder="Buscar por nombre, doc, email..." value={search} onChange={e=>setSearch(e.target.value)}/>
                    </div>
                    <button style={s.btnPrimary} onClick={()=>openForm()}><Plus size={16}/> Nuevo Huésped</button>
                </div>
            </div>

            {showForm && (
                <div style={s.formCard}>
                    <h3 style={s.formTitle}>{editing ? 'Editar' : 'Nuevo'} Huésped</h3>
                    <div style={s.grid}>
                        <div style={s.ig}><label style={s.lbl}>Nombre</label><input style={s.inp} value={form.firstName||''} onChange={f('firstName')} placeholder="Juan"/></div>
                        <div style={s.ig}><label style={s.lbl}>Apellido</label><input style={s.inp} value={form.lastName||''} onChange={f('lastName')} placeholder="Pérez"/></div>
                        <div style={s.ig}><label style={s.lbl}>Tipo Doc.</label>
                            <select style={s.inp} value={form.docType||'CC'} onChange={f('docType')}>
                                <option value="CC">Cédula (CC)</option>
                                <option value="CE">Cédula Extranjería (CE)</option>
                                <option value="PASSPORT">Pasaporte</option>
                                <option value="NIT">NIT</option>
                            </select>
                        </div>
                        <div style={s.ig}><label style={s.lbl}>Número Documento</label><input style={s.inp} value={form.docNumber||''} onChange={f('docNumber')} placeholder="1234567890"/></div>
                        <div style={s.ig}><label style={s.lbl}>Email</label><input style={s.inp} type="email" value={form.email||''} onChange={f('email')} placeholder="juan@mail.com"/></div>
                        <div style={s.ig}><label style={s.lbl}>Teléfono</label><input style={s.inp} value={form.phone||''} onChange={f('phone')} placeholder="+57 300 000 0000"/></div>
                        <div style={s.ig}><label style={s.lbl}>Nacionalidad</label><input style={s.inp} value={form.nationality||''} onChange={f('nationality')} placeholder="Colombia"/></div>
                        <div style={s.ig}><label style={s.lbl}>Dirección</label><input style={s.inp} value={form.address||''} onChange={f('address')}/></div>
                        <div style={s.ig}><label style={s.lbl}>Notas</label><input style={s.inp} value={form.notes||''} onChange={f('notes')}/></div>
                    </div>
                    <div style={s.fa}><button style={s.btnSec} onClick={()=>setShowForm(false)}>Cancelar</button><button style={s.btnPrimary} onClick={handleSave}>Guardar</button></div>
                </div>
            )}

            <div style={s.table}>
                <div style={s.thead}><div style={s.th}>Nombre</div><div style={s.th}>Documento</div><div style={s.th}>Email</div><div style={s.th}>Teléfono</div><div style={s.th}>Nacionalidad</div><div style={s.th}></div></div>
                {guests.length === 0 && <div style={s.empty}><User size={32} color="#cbd5e1"/><p>No hay huéspedes registrados.</p></div>}
                {guests.map(g => (
                    <div key={g.id} style={s.row}>
                        <div style={s.td}><strong>{g.firstName} {g.lastName}</strong></div>
                        <div style={s.td}><span style={s.badge}>{g.docType}</span> {g.docNumber}</div>
                        <div style={s.td}>{g.email || '-'}</div>
                        <div style={s.td}>{g.phone || '-'}</div>
                        <div style={s.td}>{g.nationality || '-'}</div>
                        <div style={{...s.td, display:'flex', gap:'6px', justifyContent:'flex-end'}}>
                            <button style={s.btnEdit} onClick={()=>openForm(g)}><Edit2 size={14}/></button>
                            <button style={s.btnDel} onClick={()=>handleDelete(g.id)}><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const s = {
    header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
    title: { fontSize:'22px', fontWeight:'800', color:'var(--text-main)', margin:0 },
    searchBox: { display:'flex', alignItems:'center', gap:'10px', background:'#f8fafc', border:'1px solid var(--border)', borderRadius:'10px', padding:'8px 14px' },
    searchInput: { border:'none', background:'transparent', outline:'none', fontSize:'14px', width:'220px' },
    btnPrimary: { display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:'var(--primary)', color:'white', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px', flexShrink:0 },
    btnSec: { padding:'10px 20px', background:'#f1f5f9', color:'var(--text-main)', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px' },
    formCard: { background:'white', border:'1px solid var(--border)', borderRadius:'14px', padding:'24px', marginBottom:'20px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)' },
    formTitle: { fontSize:'16px', fontWeight:'700', margin:'0 0 16px' },
    grid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'16px' },
    ig: { display:'flex', flexDirection:'column', gap:'6px' },
    lbl: { fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase' },
    inp: { padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' },
    fa: { display:'flex', justifyContent:'flex-end', gap:'10px' },
    table: { border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' },
    thead: { display:'grid', gridTemplateColumns:'1.5fr 1.2fr 1.5fr 1fr 1fr 80px', background:'#f8fafc', padding:'12px 20px', borderBottom:'1px solid var(--border)' },
    th: { fontSize:'11px', fontWeight:'800', textTransform:'uppercase', color:'var(--text-muted)' },
    row: { display:'grid', gridTemplateColumns:'1.5fr 1.2fr 1.5fr 1fr 1fr 80px', padding:'14px 20px', borderBottom:'1px solid #f1f5f9', alignItems:'center' },
    td: { fontSize:'14px', color:'var(--text-main)' },
    badge: { display:'inline-block', padding:'2px 8px', background:'#eff6ff', color:'var(--primary)', borderRadius:'6px', fontWeight:'700', fontSize:'11px', marginRight:'4px' },
    btnEdit: { padding:'6px', background:'#eff6ff', color:'var(--primary)', border:'none', borderRadius:'6px', cursor:'pointer' },
    btnDel: { padding:'6px', background:'#fef2f2', color:'#ef4444', border:'none', borderRadius:'6px', cursor:'pointer' },
    empty: { display:'flex', flexDirection:'column', alignItems:'center', padding:'48px', color:'var(--text-muted)', gap:'8px' },
};

export default GuestManager;
