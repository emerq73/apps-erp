import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/auth.service';
import Swal from 'sweetalert2';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'No se pudo procesar la solicitud.',
                confirmButtonColor: '#004a7c'
            });
        }
    };

    if (sent) {
        return (
            <div style={styles.container}>
                <div className="fade-in" style={styles.card}>
                    <div style={styles.header}>
                        <CheckCircle size={64} color="#10b981" />
                        <h1 style={styles.title}>¡Enviado!</h1>
                        <p style={styles.subtitle}>
                            Si la cuenta existe, hemos enviado un código de recuperación a <strong>{email}</strong>.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        style={styles.buttonSecondary}
                    >
                        Volver al Login
                    </button>
                    <p style={styles.note}>
                        * En esta demo, verás el código en la consola del servidor.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div className="fade-in" style={styles.card}>
                <button
                    onClick={() => navigate('/login')}
                    style={styles.backButton}
                >
                    <ArrowLeft size={18} />
                    <span>Volver</span>
                </button>

                <div style={styles.header}>
                    <div style={styles.logoWrapper}>
                        <img src="/logo.png" alt="Clou Qore" style={styles.logoImage} />
                    </div>
                    <h1 style={styles.title}>Recuperar Acceso</h1>
                    <p style={styles.subtitle}>
                        Ingrese su correo institucional para recibir instrucciones de recuperación.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Correo Electrónico</label>
                        <div style={styles.inputWrapper}>
                            <Mail size={18} style={styles.inputIcon} />
                            <input
                                type="email"
                                placeholder="usuario@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={styles.input}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? <Loader2 className="spin" size={20} /> : (
                            <>
                                <Send size={18} style={{ marginRight: '8px' }} />
                                <span>Enviar Código</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #004a7c 0%, #002d4d 100%)' },
    card: { background: '#ffffff', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', position: 'relative' },
    backButton: { position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
    header: { textAlign: 'center', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    logoWrapper: { marginBottom: '16px' },
    logoImage: { maxHeight: '60px', width: 'auto' },
    title: { fontSize: '22px', fontWeight: '700', color: '#004a7c', marginBottom: '8px' },
    subtitle: { color: '#64748b', fontSize: '13px', lineHeight: '1.6' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#475569', textAlign: 'left' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '12px', color: '#94a3b8' },
    input: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
    button: { background: '#f29100', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(242, 145, 0, 0.5)' },
    buttonSecondary: { width: '100%', background: '#e2e8f0', color: '#475569', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', marginTop: '16px' },
    note: { fontSize: '11px', color: '#94a3b8', marginTop: '24px', textAlign: 'center', fontStyle: 'italic' }
};

export default ForgotPassword;
