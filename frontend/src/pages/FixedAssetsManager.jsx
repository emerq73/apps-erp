import React from 'react';
import { PackageOpen, AlertCircle } from 'lucide-react';

const FixedAssetsManager = () => {
    return (
        <div style={styles.container} className="fade-in">
            <div style={styles.header}>
                <h2 style={styles.title}>Activos Fijos</h2>
                <button style={styles.btnPrimary}>+ Nuevo Activo</button>
            </div>
            
            <div style={styles.emptyState}>
                <PackageOpen size={48} color="#cbd5e1" />
                <h3 style={styles.emptyTitle}>Gestión de Activos Fijos</h3>
                <p style={styles.emptyText}>El módulo para calcular la depreciación y vida útil está en desarrollo.</p>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '24px', background: 'white', borderRadius: '16px', height: '100%' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 },
    btnPrimary: { background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: 'var(--text-muted)' },
    emptyTitle: { fontSize: '18px', fontWeight: '700', marginTop: '16px', color: '#475569' },
    emptyText: { fontSize: '14px', marginTop: '8px' }
};

export default FixedAssetsManager;
