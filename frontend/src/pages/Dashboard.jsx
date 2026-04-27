import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/auth.service';
import api from '../services/auth.service';
import Swal from 'sweetalert2';
import AccountingView from './AccountingView';
import InventoryView from './InventoryView';
import PMSView from './PMSView';
import PosManager from './PosManager';
import RestaurantManager from './pms/RestaurantManager';

import {
    Building2,
    LayoutDashboard,
    Users,
    ShoppingCart,
    Utensils,
    Calculator,
    LogOut,
    ChevronRight,
    Building,
    ChevronDown,
    Settings,
    User as UserIcon,
    Calendar,
    Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = ({ onLogout }) => {
    const [activeModule, setActiveModule] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [activeCompany, setActiveCompany] = useState(localStorage.getItem('activeCompanyId') || '');
    const [activePeriod, setActivePeriod] = useState(localStorage.getItem('activePeriodId') || '');

    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState({});

    useEffect(() => {
        const userData = getCurrentUser();
        if (!userData) {
            if (onLogout) onLogout();
            navigate('/login');
        } else {
            setUser(userData);
            fetchData();
        }
    }, [navigate, onLogout]);

    const fetchData = async () => {
        try {
            const [compRes, perRes] = await Promise.all([
                api.get('/accounting/companies'),
                api.get('/accounting/periods')
            ]);
            
            setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
            setPeriods(Array.isArray(perRes.data) ? perRes.data : []);
            
            if (!activeCompany && compRes.data && compRes.data.length > 0) {
                const firstId = compRes.data[0].id;
                setActiveCompany(firstId);
                localStorage.setItem('activeCompanyId', firstId);
            }
        } catch (err) {
            console.error('Error fetching data', err);
        }
    };

    const toggleMenu = (title) => {
        setOpenMenus(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleLogout = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: '¿Estás seguro de que deseas salir del sistema?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#004a7c',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                if (onLogout) onLogout();
                navigate('/login');
            }
        });
    };

    const menuItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { title: 'PMS (Hotelería)', icon: <Building2 size={20} /> },
        { title: 'POS (Ventas)', icon: <ShoppingCart size={20} /> },
        { title: 'Restaurante', icon: <Utensils size={20} /> },
        { title: 'Inventarios', icon: <Package size={20} /> },
        { title: 'CRM (Clientes)', icon: <Users size={20} /> },
        {
            title: 'Contabilidad',
            icon: <Calculator size={20} />,
            subItems: [
                { title: 'Configuración Empresa', id: 'acc_settings' },
                { title: 'Periodos Contables', id: 'acc_periods' },
                { title: 'Plan de Cuentas', id: 'acc_puc' },
                { title: 'Libro Diario', id: 'acc_ledger' },
                { title: 'Terceros', id: 'acc_third' },
                { title: 'Centros de Costo', id: 'acc_cc' },
                { title: 'Impuestos', id: 'acc_taxes' },
                { title: 'Presupuestos', id: 'acc_budgets' },
                { title: 'Cuentas por Pagar (CxP)', id: 'acc_payable' },
                { title: 'Cuentas por Cobrar (CxC)', id: 'acc_receivable' },
                { title: 'Activos Fijos', id: 'acc_assets' },
                { title: 'Tasas de Cambio', id: 'acc_exchange' },
                { title: 'Auditoría (Logs)', id: 'acc_audit' },
                {
                    title: 'Reportes',
                    id: 'acc_reports',
                    subItems: [
                        { title: 'Balance de Prueba', id: 'acc_reports_trial' },
                        { title: 'Balance General', id: 'acc_reports_general' },
                        { title: 'Estado de Resultados', id: 'acc_reports_p&g' },
                        { title: 'Presupuesto vs Ejecución', id: 'acc_reports_budget' },
                    ]
                },
            ]
        },
    ];

    const renderContent = () => {
        if (activeModule.startsWith('acc_')) {
            const tabMap = {
                'acc_puc': 'puc',
                'acc_ledger': 'ledger',
                'acc_third': 'third-parties',
                'acc_cc': 'cost-centers',
                'acc_reports': 'reports',
                'acc_reports_trial': 'reports',
                'acc_reports_general': 'balance-sheet',
                'acc_reports_p&g': 'income-statement',
                'acc_reports_budget': 'budget-execution',
                'acc_taxes': 'taxes',
                'acc_settings': 'settings',
                'acc_periods': 'periods',
                'acc_budgets': 'budgets',
                'acc_audit': 'audit',
                'acc_payable': 'payable',
                'acc_receivable': 'receivable',
                'acc_treasury': 'treasury',
                'acc_assets': 'assets',
                'acc_exchange': 'exchange-rates'
            };
            return <AccountingView initialTab={tabMap[activeModule] || 'puc'} />;
        }

        switch (activeModule) {
            case 'Contabilidad':
                return <AccountingView />;
            case 'PMS (Hotelería)':
                return <PMSView />;
            case 'Inventarios':
                return <InventoryView />;
            case 'POS (Ventas)':
                return <PosManager />;
            case 'Restaurante':
                return <RestaurantManager />;
            default:
                return (
                    <>
                        <div className="fade-in" style={styles.welcomeCard}>
                            <h3>Bienvenido al Sistema de Gestión</h3>
                            <p>Selecciona un módulo en el menú lateral para comenzar a trabajar. Módulo activo: {activeModule}</p>
                        </div>

                        <div style={styles.statsGrid}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={styles.statCard}>
                                    <div style={styles.statLabel}>Métrica {i}</div>
                                    <div style={styles.statValue}>0.00</div>
                                </div>
                            ))}
                        </div>
                    </>
                );
        }
    };

    return (
        <div style={styles.layout}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <img src="/logo.png" alt="Logo" style={styles.logoDashboard} />
                </div>

                <nav style={styles.nav}>
                    {menuItems.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                            <div
                                onClick={() => {
                                    if (item.subItems) {
                                        toggleMenu(item.title);
                                    } else {
                                        setActiveModule(item.title);
                                    }
                                }}
                                style={{
                                    ...styles.navItem,
                                    ...(activeModule === item.title || openMenus[item.title] ? styles.navItemActive : {})
                                }}
                            >
                                <div style={styles.navIcon}>{item.icon}</div>
                                <span style={styles.navTitle}>{item.title}</span>
                                {item.subItems ? (
                                    <ChevronRight
                                        size={14}
                                        style={{
                                            opacity: 0.5,
                                            transform: openMenus[item.title] ? 'rotate(90deg)' : 'none',
                                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    />
                                ) : (
                                    activeModule === item.title && <div style={styles.activeDot} />
                                )}
                            </div>

                            {/* Sub-items (Level 1) */}
                            {item.subItems && openMenus[item.title] && (
                                <div style={styles.subMenu} className="fade-in">
                                    {item.subItems.map(sub => (
                                        <div key={sub.id}>
                                            <div
                                                onClick={() => {
                                                    if (sub.subItems) toggleMenu(sub.id);
                                                    else setActiveModule(sub.id);
                                                }}
                                                style={{
                                                    ...styles.subNavItem,
                                                    ...(activeModule === sub.id || openMenus[sub.id] ? styles.subNavItemActive : {})
                                                }}
                                            >
                                                <span style={{ flex: 1 }}>{sub.title}</span>
                                                {sub.subItems && (
                                                    <ChevronRight
                                                        size={12}
                                                        style={{
                                                            opacity: 0.5,
                                                            transform: openMenus[sub.id] ? 'rotate(90deg)' : 'none',
                                                            transition: 'transform 0.3s'
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Sub-sub-items (Level 2 - Reports) */}
                                            {sub.subItems && openMenus[sub.id] && (
                                                <div style={styles.nestedSubMenu} className="fade-in">
                                                    {sub.subItems.map(nested => (
                                                        <div
                                                            key={nested.id}
                                                            onClick={() => setActiveModule(nested.id)}
                                                            style={{
                                                                ...styles.subNavItem,
                                                                ...(activeModule === nested.id ? styles.subNavItemActive : {}),
                                                                fontSize: '12px',
                                                                paddingLeft: '16px'
                                                            }}
                                                        >
                                                            • {nested.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div style={styles.sidebarFooter}>
                    <div style={styles.navItem} onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={styles.main}>
                <header style={styles.topbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px' }}>
                            <LayoutDashboard size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <h2 style={styles.pageTitle}>{activeModule.startsWith('acc_') ? 'Contabilidad' : activeModule}</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Gestión Corporativa Clou Qore</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={styles.infoBadge}>
                            <Building size={16} color="#64748b" />
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Empresa:</span>
                            <span style={styles.infoText}>
                                {companies.find(c => c.id === activeCompany)?.name || 'Sin Empresa Seleccionada'}
                            </span>
                        </div>

                        <div style={styles.infoBadge}>
                            <Calendar size={16} color="#64748b" />
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Periodo:</span>
                            <span style={styles.infoText}>
                                {periods.find(p => p.id === activePeriod) 
                                    ? (() => {
                                        const p = periods.find(p => p.id === activePeriod);
                                        return (p.year && p.month) 
                                            ? `${new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`
                                            : 'Periodo sin fecha';
                                      })()
                                    : 'Sin Periodo Seleccionado'}
                            </span>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div 
                                style={styles.userInfo} 
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="user-info-trigger"
                            >
                                <div style={styles.userText}>
                                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{user?.fullName || 'Usuario'}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</span>
                                </div>
                                <div style={styles.avatar}>
                                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </div>
                                <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>

                            <AnimatePresence>
                                {showUserMenu && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={styles.userDropdown}
                                    >
                                        <div style={styles.dropdownHeader}>
                                            <span style={{ fontWeight: '800', fontSize: '13px' }}>{user?.fullName}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {user?.id?.substring(0, 8)}</span>
                                        </div>
                                        <div style={styles.dropdownDivider} />
                                        <div style={styles.dropdownItem} className="dropdown-item-premium">
                                            <UserIcon size={16} />
                                            <span>Mi Perfil</span>
                                        </div>
                                        <div style={styles.dropdownItem} className="dropdown-item-premium">
                                            <Settings size={16} />
                                            <span>Ajustes</span>
                                        </div>
                                        <div style={styles.dropdownDivider} />
                                        <div 
                                            style={{ ...styles.dropdownItem, color: 'var(--danger)' }}
                                            className="dropdown-item-premium danger"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                handleLogout();
                                            }}
                                        >
                                            <LogOut size={16} />
                                            <span style={{ fontWeight: '700' }}>Cerrar Sesión</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div style={styles.content}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

const styles = {
    layout: {
        display: 'flex',
        height: '100vh',
        background: '#f8fafc',
    },
    sidebar: {
        width: '280px',
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 0',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 50,
    },
    sidebarHeader: {
        padding: '0 32px 32px',
        display: 'flex',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '24px',
    },
    logoDashboard: {
        maxHeight: '70px',
        width: 'auto',
        filter: 'brightness(1.2)',
    },
    nav: {
        flex: 1,
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        gap: '12px',
        color: '#94a3b8',
        fontSize: '14px',
        fontWeight: '600',
    },
    navItemActive: {
        background: 'rgba(255,255,255,0.05)',
        color: '#ffffff',
    },
    navIcon: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '20px',
    },
    navTitle: {
        flex: 1,
    },
    activeDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--accent)',
        boxShadow: '0 0 8px var(--accent)',
    },
    sidebarFooter: {
        padding: '24px 16px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: 'auto',
    },
    main: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
    },
    topbar: {
        height: '80px',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
    },
    pageTitle: {
        fontSize: '20px',
        fontWeight: '800',
        color: '#1e293b',
        margin: 0,
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        padding: '6px 12px',
        borderRadius: '16px',
        transition: 'all 0.2s',
        '&:hover': {
            background: '#f1f5f9',
        }
    },
    userText: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '2px',
    },
    avatar: {
        width: '42px',
        height: '42px',
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '700',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 74, 124, 0.3)',
        border: '2px solid #ffffff',
    },
    userDropdown: {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '12px',
        width: '220px',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        zIndex: 100,
        padding: '8px',
    },
    dropdownHeader: {
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    dropdownDivider: {
        height: '1px',
        background: '#f1f5f9',
        margin: '4px 0',
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        color: '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
            background: '#f8fafc',
            color: 'var(--primary)',
        }
    },
    logoutTopBtn: {
        marginLeft: '8px',
        padding: '8px',
        borderRadius: '10px',
        color: '#64748b',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
    },
    content: {
        padding: '40px',
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        flex: 1,
    },
    welcomeCard: {
        background: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
    },
    statCard: {
        background: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
    },
    statLabel: {
        fontSize: '12px',
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: '8px',
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
    },
    subMenu: {
        paddingLeft: '48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginTop: '4px',
        marginBottom: '12px',
    },
    subNavItem: {
        padding: '10px 16px',
        fontSize: '13px',
        color: '#64748b',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
    },
    subNavItemActive: {
        color: '#ffffff',
        background: 'rgba(255,255,255,0.05)',
        fontWeight: '700',
    },
    nestedSubMenu: {
        paddingLeft: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        marginTop: '2px',
        marginBottom: '4px',
    },
    infoBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'white',
        padding: '6px 12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    infoText: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#1e293b',
    }
};

export default Dashboard;
