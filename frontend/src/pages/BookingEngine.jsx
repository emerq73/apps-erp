import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STEPS = ['Buscar', 'Elegir Habitación', 'Confirmar'];

// ─── Step 1: Search ───────────────────────────────────────────────────────────
function SearchStep({ onSearch }) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const [form, setForm] = useState({ checkIn: today, checkOut: tomorrow, guests: 2 });
    const [error, setError] = useState('');

    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSubmit = e => {
        e.preventDefault();
        if (form.checkOut <= form.checkIn) { setError('El check-out debe ser posterior al check-in'); return; }
        setError('');
        onSearch(form);
    };

    return (
        <div style={st.card}>
            <div style={st.cardIcon}>🏨</div>
            <h2 style={st.cardTitle}>¿Cuándo nos visitas?</h2>
            <p style={st.cardSub}>Selecciona tus fechas y encuentra la habitación perfecta</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={st.row2}>
                    <label style={st.fieldWrap}>
                        <span style={st.label}>📅 Check-in</span>
                        <input type="date" style={st.input} value={form.checkIn} min={today} onChange={set('checkIn')} required />
                    </label>
                    <label style={st.fieldWrap}>
                        <span style={st.label}>📅 Check-out</span>
                        <input type="date" style={st.input} value={form.checkOut} min={form.checkIn} onChange={set('checkOut')} required />
                    </label>
                </div>
                <label style={st.fieldWrap}>
                    <span style={st.label}>👥 Huéspedes</span>
                    <select style={st.input} value={form.guests} onChange={set('guests')}>
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>)}
                    </select>
                </label>
                {error && <div style={st.error}>{error}</div>}
                <button type="submit" style={st.btnPrimary}>Buscar disponibilidad →</button>
            </form>
        </div>
    );
}

// ─── Step 2: Room Selection ───────────────────────────────────────────────────
function RoomStep({ results, search, onSelect }) {
    const nights = Math.round((new Date(search.checkOut) - new Date(search.checkIn)) / 86400000);

    if (!results.roomTypes?.length) {
        return (
            <div style={st.card}>
                <div style={st.cardIcon}>😔</div>
                <h2 style={st.cardTitle}>Sin disponibilidad</h2>
                <p style={st.cardSub}>No hay habitaciones disponibles para las fechas seleccionadas.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={st.searchSummary}>
                📅 {new Date(search.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                {' → '}
                {new Date(search.checkOut).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                &nbsp;·&nbsp; {nights} {nights === 1 ? 'noche' : 'noches'}
                &nbsp;·&nbsp; {search.guests} {search.guests == 1 ? 'huésped' : 'huéspedes'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {results.roomTypes.map(rt => (
                    <div key={rt.roomTypeId} style={st.roomCard}>
                        {/* Image placeholder */}
                        <div style={st.roomImg}>
                            {rt.images?.length
                                ? <img src={rt.images[0]} alt={rt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', gap: 8 }}>
                                    <span style={{ fontSize: 48 }}>🛏️</span>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rt.name}</span>
                                  </div>
                            }
                        </div>
                        <div style={st.roomInfo}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={st.roomName}>{rt.name}</h3>
                                    <div style={st.roomMeta}>👥 Hasta {rt.capacity} personas &nbsp;·&nbsp; {rt.availableCount} disponibles</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={st.price}>${Number(rt.totalRate).toLocaleString()}</div>
                                    <div style={st.priceNote}>${Number(rt.nightlyRate).toLocaleString()} / noche · {nights} {nights === 1 ? 'noche' : 'noches'}</div>
                                </div>
                            </div>
                            {rt.description && <p style={st.roomDesc}>{rt.description}</p>}
                            {rt.amenities?.length > 0 && (
                                <div style={st.amenities}>
                                    {rt.amenities.slice(0, 5).map((a, i) => <span key={i} style={st.amenityTag}>{a}</span>)}
                                </div>
                            )}
                            <button style={st.btnPrimary} onClick={() => onSelect(rt)}>
                                Reservar esta habitación →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Step 3: Guest Info & Confirm ─────────────────────────────────────────────
function ConfirmStep({ selected, search, companyId, onSuccess }) {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', docNumber: '', nationality: '', specialRequests: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    const nights = Math.round((new Date(search.checkOut) - new Date(search.checkIn)) / 86400000);

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.firstName || !form.lastName || !form.email) { setError('Nombre, apellido y correo son requeridos'); return; }
        setLoading(true); setError('');
        try {
            const res = await axios.post(`${API}/pms/public/bookings`, {
                companyId, roomId: selected.suggestedRoomId, roomTypeId: selected.roomTypeId,
                checkIn: search.checkIn, checkOut: search.checkOut,
                adults: Number(search.guests), ratePerNight: selected.nightlyRate,
                guest: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, docNumber: form.docNumber, nationality: form.nationality },
                specialRequests: form.specialRequests,
            });
            onSuccess(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo completar la reserva. Intenta de nuevo.');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {/* Summary card */}
            <div style={st.summaryCard}>
                <h3 style={st.summaryTitle}>📋 Resumen de tu reserva</h3>
                <div style={st.summaryRow}><span>Habitación</span><strong>{selected.name}</strong></div>
                <div style={st.summaryRow}><span>Check-in</span><strong>{new Date(search.checkIn).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}</strong></div>
                <div style={st.summaryRow}><span>Check-out</span><strong>{new Date(search.checkOut).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}</strong></div>
                <div style={st.summaryRow}><span>{nights} {nights===1?'noche':'noches'} × ${Number(selected.nightlyRate).toLocaleString()}</span><strong>${Number(selected.totalRate).toLocaleString()} DOP</strong></div>
                <div style={{ ...st.summaryRow, borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
                    <strong style={{ fontSize: 20, color: '#2563eb' }}>${Number(selected.totalRate).toLocaleString()} DOP</strong>
                </div>
            </div>

            {/* Guest form */}
            <div style={st.card}>
                <h3 style={st.cardTitle}>Tus datos</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={st.row2}>
                        <label style={st.fieldWrap}><span style={st.label}>Nombre *</span><input style={st.input} value={form.firstName} onChange={set('firstName')} placeholder="Juan" required /></label>
                        <label style={st.fieldWrap}><span style={st.label}>Apellido *</span><input style={st.input} value={form.lastName} onChange={set('lastName')} placeholder="Pérez" required /></label>
                    </div>
                    <label style={st.fieldWrap}><span style={st.label}>Correo electrónico *</span><input type="email" style={st.input} value={form.email} onChange={set('email')} placeholder="juan@email.com" required /></label>
                    <div style={st.row2}>
                        <label style={st.fieldWrap}><span style={st.label}>Teléfono</span><input style={st.input} value={form.phone} onChange={set('phone')} placeholder="+1 809 000 0000" /></label>
                        <label style={st.fieldWrap}><span style={st.label}>Documento</span><input style={st.input} value={form.docNumber} onChange={set('docNumber')} placeholder="Cédula / Pasaporte" /></label>
                    </div>
                    <label style={st.fieldWrap}><span style={st.label}>Solicitudes especiales</span><textarea style={{ ...st.input, height: 72, resize: 'vertical' }} value={form.specialRequests} onChange={set('specialRequests')} placeholder="Cama extra, llegada tardía..." /></label>
                    {error && <div style={st.error}>{error}</div>}
                    <button type="submit" style={st.btnPrimary} disabled={loading}>
                        {loading ? '⏳ Procesando...' : '✅ Confirmar Reserva'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────
function SuccessStep({ confirmation }) {
    return (
        <div style={{ ...st.card, textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
            <h2 style={{ ...st.cardTitle, color: '#15803d' }}>¡Reserva Confirmada!</h2>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 20, margin: '20px 0' }}>
                <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}>Número de confirmación</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#15803d', letterSpacing: 2 }}>{confirmation.confirmationNumber}</div>
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
                <div>Hola <strong>{confirmation.guestName}</strong>, tu reserva ha sido recibida.</div>
                <div style={{ marginTop: 8 }}>📧 Recibirás un correo de confirmación pronto.</div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
                <div style={st.confBadge}>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>Check-in</span>
                    <strong>{new Date(confirmation.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</strong>
                </div>
                <div style={st.confBadge}>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>Total</span>
                    <strong>${Number(confirmation.totalAmount).toLocaleString()} DOP</strong>
                </div>
            </div>
        </div>
    );
}

// ─── Main Booking Engine ───────────────────────────────────────────────────────
export default function BookingEngine() {
    const { companyId } = useParams();
    const [step, setStep] = useState(0);       // 0=search, 1=rooms, 2=confirm, 3=success
    const [search, setSearch] = useState(null);
    const [results, setResults] = useState(null);
    const [selected, setSelected] = useState(null);
    const [confirmation, setConfirmation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (form) => {
        setLoading(true); setError('');
        try {
            const res = await axios.get(`${API}/pms/public/availability`, {
                params: { companyId, checkIn: form.checkIn, checkOut: form.checkOut, guests: form.guests },
            });
            setSearch(form);
            setResults(res.data);
            setStep(1);
        } catch (err) {
            setError('No se pudo consultar disponibilidad. Intenta de nuevo.');
        } finally { setLoading(false); }
    };

    const handleSelect = (roomType) => { setSelected(roomType); setStep(2); };
    const handleSuccess = (data) => { setConfirmation(data); setStep(3); };

    return (
        <div style={st.page}>
            {/* Hero header */}
            <div style={st.hero}>
                <div style={st.heroContent}>
                    <div style={st.hotelBadge}>🏨 Motor de Reservas Directo</div>
                    <h1 style={st.heroTitle}>Tu estadía perfecta, sin comisiones</h1>
                    <p style={st.heroSub}>Reserva directamente con nosotros y obtén el mejor precio garantizado</p>
                </div>
            </div>

            {/* Progress stepper */}
            {step < 3 && (
                <div style={st.stepper}>
                    {STEPS.map((s, i) => (
                        <React.Fragment key={i}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: i < step ? 'pointer' : 'default' }}
                                onClick={() => i < step && setStep(i)}>
                                <div style={{ ...st.stepDot, background: i <= step ? '#2563eb' : '#e2e8f0', color: i <= step ? '#fff' : '#94a3b8' }}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: i === step ? 700 : 500, color: i === step ? '#1e293b' : '#94a3b8' }}>{s}</span>
                            </div>
                            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#2563eb' : '#e2e8f0' }} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Main content */}
            <div style={st.content}>
                {error && <div style={st.errorBanner}>{error}</div>}
                {loading && <div style={st.loadingBanner}>⏳ Buscando disponibilidad...</div>}

                {!loading && (
                    <>
                        {step === 0 && <SearchStep onSearch={handleSearch} />}
                        {step === 1 && results && <RoomStep results={results} search={search} onSelect={handleSelect} />}
                        {step === 2 && selected && <ConfirmStep selected={selected} search={search} companyId={companyId} onSuccess={handleSuccess} />}
                        {step === 3 && confirmation && <SuccessStep confirmation={confirmation} />}
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={st.footer}>
                🔒 Reserva 100% segura &nbsp;·&nbsp; Mejor precio garantizado &nbsp;·&nbsp; Sin cargos ocultos
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#fafafa 100%)', fontFamily: "'Inter','Segoe UI',sans-serif" },
    hero: { background: 'linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#0ea5e9 100%)', padding: '60px 20px 80px', textAlign: 'center' },
    heroContent: { maxWidth: 640, margin: '0 auto' },
    hotelBadge: { display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, marginBottom: 16 },
    heroTitle: { color: '#fff', fontSize: 'clamp(24px,5vw,42px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 },
    heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: 0 },
    stepper: { display: 'flex', alignItems: 'center', gap: 8, maxWidth: 560, margin: '-28px auto 0', background: '#fff', borderRadius: 16, padding: '16px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10 },
    stepDot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s' },
    content: { maxWidth: 860, margin: '0 auto', padding: '40px 20px 60px' },
    card: { background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' },
    cardIcon: { fontSize: 48, marginBottom: 12, textAlign: 'center' },
    cardTitle: { fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 8px', textAlign: 'center' },
    cardSub: { fontSize: 14, color: '#64748b', textAlign: 'center', margin: '0 0 28px' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' },
    btnPrimary: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.35)', transition: 'transform 0.1s, box-shadow 0.1s', marginTop: 4 },
    error: { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
    errorBanner: { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', marginBottom: 20, textAlign: 'center', fontWeight: 600 },
    loadingBanner: { color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', marginBottom: 20, textAlign: 'center', fontWeight: 600 },
    searchSummary: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14, fontWeight: 600, color: '#1d4ed8' },
    roomCard: { background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '280px 1fr' },
    roomImg: { height: 200, background: 'linear-gradient(135deg,#e0e7ff,#f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    roomInfo: { padding: 24, display: 'flex', flexDirection: 'column', gap: 12 },
    roomName: { fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 },
    roomMeta: { fontSize: 13, color: '#64748b', fontWeight: 500 },
    roomDesc: { fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 },
    amenities: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    amenityTag: { background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100 },
    price: { fontSize: 26, fontWeight: 900, color: '#1e293b' },
    priceNote: { fontSize: 12, color: '#64748b' },
    summaryCard: { background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 20, padding: 24 },
    summaryTitle: { fontSize: 16, fontWeight: 800, color: '#1e293b', margin: '0 0 16px' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 14, color: '#475569', borderBottom: '1px solid rgba(0,0,0,0.05)' },
    confBadge: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 16 },
    footer: { textAlign: 'center', padding: '20px', fontSize: 13, color: '#94a3b8', borderTop: '1px solid #f1f5f9', background: '#fff' },
};
