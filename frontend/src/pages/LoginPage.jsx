import React, { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { login, verify2FA } from '../services/auth.service';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    
    // 2FA State
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempUserId, setTempUserId] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('expired')) {
            Swal.fire({
                icon: 'warning',
                title: 'Sesión Finalizada',
                text: 'Su sesión ha expirado por inactividad. Inicie sesión de nuevo.',
                confirmButtonColor: '#004a7c'
            });
        }
    }, [location]);

    const handleCapsLock = (e) => {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await login(email, password, rememberMe);

            if (res.requires2FA) {
                setRequires2FA(true);
                setTempUserId(res.userId); // Necesitaríamos que el backend devuelva userId o usar el tempToken
                setLoading(false);
                return;
            }

            handleSuccess();

        } catch (err) {
            setLoading(false);
            const errorMessage = typeof err === 'string' ? err : (err.response?.data?.message || err.message || 'Error de conexión con el servidor');
            
            Swal.fire({
                icon: 'error',
                title: 'Error de Acceso',
                text: errorMessage,
                confirmButtonColor: '#004a7c',
                confirmButtonText: 'Entendido',
                footer: '<span style="color: #64748b; font-size: 11px;">Consulte con el administrador si el problema persiste.</span>',
                showClass: {
                    popup: 'animate__animated animate__shakeX'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                },
                customClass: {
                    popup: 'premium-swal-popup',
                    title: 'premium-swal-title',
                    confirmButton: 'premium-swal-button'
                }
            });
        }
    };

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verify2FA(tempUserId, twoFactorCode);
            handleSuccess();
        } catch (err) {
            setLoading(false);
            Swal.fire('Error', 'Código 2FA incorrecto', 'error');
        }
    };

    const handleSuccess = () => {
        setLoading(false);
        setValidating(true);
        setTimeout(() => {
            localStorage.removeItem('activeCompanyId');
            localStorage.removeItem('activePeriodId');
            if (onLogin) onLogin();
            navigate('/');
        }, 1500);
    };

    return (
        <div style={styles.container}>
            {validating && (
                <div style={styles.overlay}>
                    <div style={styles.overlayContent}>
                        <Loader2 className="spin" size={48} color="#f29100" />
                        <h2 style={styles.overlayText}>Espere, validando usuario...</h2>
                        <p style={styles.overlaySubtext}>Preparando su espacio de trabajo corporativo</p>
                    </div>
                </div>
            )}

            <div className="fade-in" style={styles.loginCard}>
                <div style={styles.header}>
                    <div style={styles.logoWrapper}>
                        <img src="/logo.png" alt="Clou Qore" style={styles.logoImage} />
                    </div>
                    <h1 style={styles.title}>Sistema ERP</h1>
                    <p style={styles.subtitle}>{requires2FA ? 'Verificación de Seguridad' : 'Gestión Hotelera Profesional'}</p>
                </div>

                {!requires2FA ? (
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
                                    disabled={loading || validating}
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Contraseña</label>
                            <div style={styles.inputWrapper}>
                                <Lock size={18} style={styles.inputIcon} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyUp={handleCapsLock}
                                    style={styles.input}
                                    disabled={loading || validating}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.eyeButton}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {isCapsLockOn && (
                                <div style={styles.capsAlert}>
                                    <AlertCircle size={14} />
                                    <span>Bloq Mayús activado</span>
                                </div>
                            )}
                        </div>

                        <div style={styles.extraActions}>
                            <label style={styles.rememberMe}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Recordarme</span>
                            </label>
                            <button
                                type="button"
                                style={styles.forgotLink}
                                onClick={() => navigate('/forgot-password')}
                            >
                                ¿Olvidó su contraseña?
                            </button>
                        </div>

                        <button type="submit" style={styles.button} disabled={loading || validating}>
                            {loading ? <Loader2 className="spin" size={20} /> : 'Acceder al Sistema'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handle2FASubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Código de Verificación (2FA)</label>
                            <div style={styles.inputWrapper}>
                                <ShieldCheck size={18} style={styles.inputIcon} />
                                <input
                                    type="text"
                                    placeholder="Ingrese el código de 6 dígitos"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    style={styles.input}
                                    maxLength={6}
                                    disabled={loading}
                                    required
                                    autoFocus
                                />
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                                Abra su aplicación de autenticación para ver el código dinámico.
                            </p>
                        </div>

                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? <Loader2 className="spin" size={20} /> : 'Verificar e Ingresar'}
                        </button>
                        
                        <button 
                            type="button" 
                            style={{ ...styles.forgotLink, textAlign: 'center', marginTop: '10px' }}
                            onClick={() => setRequires2FA(false)}
                        >
                            Volver al login
                        </button>
                    </form>
                )}

                <div style={styles.footer}>
                    <p style={styles.footerText}>© 2026 ClouQore</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #004a7c 0%, #002d4d 100%)', position: 'relative' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 74, 124, 0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
    overlayContent: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    overlayText: { color: '#ffffff', fontSize: '24px', fontWeight: '600' },
    overlaySubtext: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' },
    loginCard: { background: '#ffffff', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' },
    header: { textAlign: 'center', marginBottom: '24px' },
    logoWrapper: { marginBottom: '0px', display: 'flex', justifyContent: 'center' },
    logoImage: { maxHeight: '120px', width: 'auto' },
    title: { fontSize: '22px', fontWeight: '700', color: 'var(--primary)', marginBottom: '4px', marginTop: '10px' },
    subtitle: { color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '12px', color: '#94a3b8' },
    input: { width: '100%', padding: '12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' },
    eyeButton: { position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
    capsAlert: { display: 'flex', alignItems: 'center', gap: '6px', color: '#f29100', fontSize: '12px', fontWeight: '600', marginTop: '4px' },
    extraActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' },
    rememberMe: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' },
    forgotLink: { background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0 },
    button: { background: 'var(--accent)', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(242, 145, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    footer: { marginTop: '32px', textAlign: 'center' },
    footerText: { fontSize: '12px', color: '#94a3b8' }
};

export default LoginPage;
