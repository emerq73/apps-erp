import React, { useState } from 'react';
import { Package, MapPin, ArrowRightLeft } from 'lucide-react';

const InventoryView = () => {
    const [activeTab, setActiveTab] = useState('products');

    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.sidebar}>
                <h2 style={styles.title}>Inventario</h2>
                <div style={styles.menu}>
                    <button 
                        style={activeTab === 'products' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => setActiveTab('products')}
                    >
                        <Package size={18} /> Productos
                    </button>
                    <button 
                        style={activeTab === 'warehouses' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => setActiveTab('warehouses')}
                    >
                        <MapPin size={18} /> Bodegas
                    </button>
                    <button 
                        style={activeTab === 'movements' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => setActiveTab('movements')}
                    >
                        <ArrowRightLeft size={18} /> Movimientos
                    </button>
                </div>
            </div>
            
            <div style={styles.content}>
                <div style={styles.emptyState}>
                    <Package size={48} color="#cbd5e1" />
                    <h3 style={styles.emptyTitle}>Gestión de {activeTab}</h3>
                    <p style={styles.emptyText}>El módulo está en desarrollo.</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', height: '100%', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' },
    sidebar: { width: '250px', background: '#f8fafc', padding: '24px', borderRight: '1px solid var(--border)' },
    title: { fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '24px' },
    menu: { display: 'flex', flexDirection: 'column', gap: '8px' },
    menuItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px', width: '100%', textAlign: 'left' },
    menuItemActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '700', fontSize: '14px', width: '100%', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    content: { flex: 1, padding: '32px' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' },
    emptyTitle: { fontSize: '18px', fontWeight: '700', marginTop: '16px', color: '#475569', textTransform: 'capitalize' },
    emptyText: { fontSize: '14px', marginTop: '8px' }
};

export default InventoryView;
