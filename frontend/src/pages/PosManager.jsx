import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, X, CheckCircle } from 'lucide-react';
import api from '../services/auth.service';
import Swal from 'sweetalert2';

const PosManager = () => {
    const [view, setView] = useState('sales');
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [showNewProduct, setShowNewProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Bebidas' });
    const [saleItems, setSaleItems] = useState([]);
    const [showPayment, setShowPayment] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [cashReceived, setCashReceived] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const productsRes = await api.get('/pos/products');
            setProducts(productsRes.data);
            
            const salesRes = await api.get('/pos/sales');
            setSales(salesRes.data);
            
            const summaryRes = await api.get('/pos/sales/daily-summary');
            setSummary(summaryRes.data);
        } catch (e) {
            console.error('[POS] Error:', e);
        }
        setLoading(false);
    };

    const addToSale = (product) => {
        const existing = saleItems.find(i => i.productId === product.id);
        if (existing) {
            setSaleItems(saleItems.map(i => 
                i.productId === product.id 
                    ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * Number(product.price) }
                    : i
            ));
        } else {
            setSaleItems([...saleItems, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                total: product.price
            }]);
        }
    };

    const removeFromSale = (productId) => {
        setSaleItems(saleItems.filter(i => i.productId !== productId));
    };

    const calculateTotals = () => {
        const subtotal = saleItems.reduce((sum, i) => sum + i.total, 0);
        const tax = subtotal * 0.19;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const { subtotal, tax, total } = calculateTotals();

    const handleNewSale = async () => {
        if (saleItems.length === 0) {
            Swal.fire('Error', 'Agregue productos a la venta', 'error');
            return;
        }
        try {
            const res = await api.post('/pos/sales', {
                items: saleItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
                sellerId: localStorage.getItem('userId')
            });
            setShowPayment(res.data);
            setCashReceived(res.data.total);
        } catch (e) {
            Swal.fire('Error', 'No se pudo crear la venta', 'error');
        }
    };

    const handleCreateProduct = async () => {
        if (!newProduct.name || !newProduct.price) {
            Swal.fire('Error', 'Nombre y precio son requeridos', 'error');
            return;
        }
        try {
            await api.post('/pos/products', {
                name: newProduct.name,
                price: Number(newProduct.price),
                category: newProduct.category,
                isActive: true
            });
            Swal.fire('Éxito', 'Producto creado', 'success');
            setShowNewProduct(false);
            setNewProduct({ name: '', price: '', category: 'Bebidas' });
            fetchData();
        } catch (e) {
            console.error('Error:', e);
            Swal.fire('Error', 'No se pudo crear el producto', 'error');
        }
    };

    const handlePayment = async () => {
        try {
            await api.post(`/pos/sales/${showPayment.id}/complete`, {
                paymentMethod,
                cashReceived: Number(cashReceived)
            });
            Swal.fire('Éxito', 'Venta completada', 'success');
            setShowPayment(null);
            setSaleItems([]);
            fetchData();
        } catch (e) {
            Swal.fire('Error', 'No se pudo completar el pago', 'error');
        }
    };

    const fmtMoney = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v || 0);

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;
    }

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Punto de Venta (POS)</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        style={view === 'sales' ? styles.tabOn : styles.tabOff} 
                        onClick={() => { setView('sales'); fetchData(); }}
                    >
                        Ventas
                    </button>
                    <button 
                        style={view === 'products' ? styles.tabOn : styles.tabOff} 
                        onClick={() => { setView('products'); fetchData(); }}
                    >
                        Productos
                    </button>
                </div>
            </div>

            {summary && (
                <div style={styles.statsRow}>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Ventas Hoy</span>
                        <span style={styles.statValue}>{summary.totalSales}</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Ingresos</span>
                        <span style={styles.statValue}>{fmtMoney(summary.totalRevenue)}</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Efectivo</span>
                        <span style={styles.statValue}>{fmtMoney(summary.byPaymentMethod?.cash)}</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Tarjeta</span>
                        <span style={styles.statValue}>{fmtMoney(summary.byPaymentMethod?.card)}</span>
                    </div>
                </div>
            )}

            {view === 'products' && (
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>Productos</h3>
                        {!showNewProduct && (
                            <button style={styles.btnPrimary} onClick={() => setShowNewProduct(true)}>
                                <Plus size={16} /> Nuevo
                            </button>
                        )}
                    </div>

                    {showNewProduct && (
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Nombre</label>
                                    <input 
                                        style={styles.input} 
                                        value={newProduct.name} 
                                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                        placeholder="Ej: Café" 
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Precio</label>
                                    <input 
                                        style={styles.input} 
                                        type="number"
                                        value={newProduct.price} 
                                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                                        placeholder="2500" 
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Categoría</label>
                                    <select 
                                        style={styles.input}
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                    >
                                        <option value="Bebidas">Bebidas</option>
                                        <option value="Comida">Comida</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={styles.btnSec} onClick={() => { setShowNewProduct(false); setNewProduct({ name: '', price: '', category: 'Bebidas' }); }}>
                                        Cancelar
                                    </button>
                                    <button style={styles.btnPrimary} onClick={handleCreateProduct}>
                                        Crear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {products.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            No hay productos. ¡Crea el primero!
                        </div>
                    )}
                    <div style={styles.grid}>
                        {products.map(p => (
                            <div key={p.id} style={styles.productCard}>
                                <div style={styles.productName}>{p.name}</div>
                                <div style={styles.productPrice}>{fmtMoney(p.price)}</div>
                                <button style={styles.btnSmall} onClick={() => addToSale(p)}>
                                    <Plus size={12} /> Agregar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'sales' && (
                <div style={styles.twoCols}>
                    <div style={styles.card}>
                        <h3>Productos</h3>
                        <input style={styles.input} placeholder="Buscar..." />
                        <div style={styles.productList}>
                            {products.filter(p => p.isActive).map(p => (
                                <div key={p.id} style={styles.productItem} onClick={() => addToSale(p)}>
                                    <span>{p.name}</span>
                                    <span style={{ fontWeight: 600 }}>{fmtMoney(p.price)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={styles.card}>
                        <h3>Carrito</h3>
                        {saleItems.length === 0 ? (
                            <div style={styles.empty}>Sin productos</div>
                        ) : (
                            <>
                                {saleItems.map(item => (
                                    <div key={item.productId} style={styles.cartItem}>
                                        <div>
                                            <div>{item.productName}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                {item.quantity} x {fmtMoney(item.unitPrice)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 600 }}>{fmtMoney(item.total)}</span>
                                            <button style={styles.btnDel} onClick={() => removeFromSale(item.productId)}>
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div style={styles.totals}>
                                    <div style={styles.totalRow}>
                                        <span>Subtotal:</span>
                                        <span>{fmtMoney(subtotal)}</span>
                                    </div>
                                    <div style={styles.totalRow}>
                                        <span>IVA (19%):</span>
                                        <span>{fmtMoney(tax)}</span>
                                    </div>
                                    <div style={{ ...styles.totalRow, fontSize: '18px', fontWeight: 700 }}>
                                        <span>Total:</span>
                                        <span>{fmtMoney(total)}</span>
                                    </div>
                                </div>
                                <button style={styles.btnPrimary} onClick={handleNewSale}>
                                    <DollarSign size={16} /> Cobrar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {view === 'sales' && saleItems.length > 0 && (
                <div style={styles.card}>
                    <h3>Pago</h3>
                    <div style={styles.totalDisplay}>{fmtMoney(total)}</div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Método de Pago</label>
                        <select style={styles.input} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="CASH">Efectivo</option>
                            <option value="CARD">Tarjeta</option>
                            <option value="TRANSFER">Transferencia</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Dinero Recibido</label>
                        <input 
                            style={styles.input} 
                            type="number" 
                            value={cashReceived} 
                            onChange={e => setCashReceived(e.target.value)} 
                        />
                    </div>
                    {Number(cashReceived) >= total && (
                        <div style={styles.changeDisplay}>
                            Cambio: {fmtMoney(Number(cashReceived) - total)}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button style={styles.btnSec} onClick={() => setSaleItems([])}>
                            Cancelar
                        </button>
                        <button style={styles.btnPrimary} onClick={handlePayment}>
                            <CheckCircle size={16} /> Completar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    tabOn: { padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    tabOff: { padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
    statCard: { background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' },
    statLabel: { fontSize: '12px', color: '#64748b', textTransform: 'uppercase' },
    statValue: { fontSize: '24px', fontWeight: 700 },
    card: { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' },
    productCard: { padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
    productName: { fontWeight: 600 },
    productPrice: { color: 'var(--primary)', fontWeight: 700 },
    btnSmall: { padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' },
    btnPrimary: { padding: '12px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' },
    btnSec: { padding: '12px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 },
    btnDel: { padding: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    twoCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    input: { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%' },
    productList: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', maxHeight: '400px', overflowY: 'auto' },
    productItem: { padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' },
    cartItem: { padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' },
    totals: { borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '32px', borderRadius: '16px', width: '400px', maxWidth: '90vw' },
    totalDisplay: { fontSize: '36px', fontWeight: 700, textAlign: 'center', margin: '16px 0' },
    changeDisplay: { fontSize: '24px', fontWeight: 700, color: '#10b981', textAlign: 'center' },
    empty: { padding: '40px', textAlign: 'center', color: '#64748b' }
};

export default PosManager;