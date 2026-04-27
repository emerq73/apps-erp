import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, X, CheckCircle, Clock, ShoppingCart } from 'lucide-react';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

const ORDER_STATUS = {
    PENDING: { label: 'Pendiente', color: '#f59e0b', bg: '#fef3c7' },
    IN_PROGRESS: { label: 'En Proceso', color: '#3b82f6', bg: '#dbeafe' },
    COMPLETED: { label: 'Completado', color: '#10b981', bg: '#d1fae5' },
    PAID: { label: 'Pagado', color: '#6b7280', bg: '#f3f4f6' },
    CANCELLED: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2' },
};

const TABLE_STATUS = {
    AVAILABLE: { label: 'Disponible', color: '#10b981', bg: '#d1fae5' },
    OCCUPIED: { label: 'Ocupada', color: '#f59e0b', bg: '#fef3c7' },
    RESERVED: { label: 'Reservada', color: '#3b82f6', bg: '#dbeafe' },
    CLEANING: { label: 'Limpiando', color: '#8b5cf6', bg: '#ede9fe' },
};

const RestaurantManager = () => {
    const [view, setView] = useState('tables');
    const [tables, setTables] = useState([]);
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('');
    const [form, setForm] = useState({});
    const [showNewOrder, setShowNewOrder] = useState(false);
    const [newOrderItems, setNewOrderItems] = useState([]);
    const [showOrder, setShowOrder] = useState(null);
    const [tipPercentage, setTipPercentage] = useState(10);
    const [showPayment, setShowPayment] = useState(null);
    const [paymentData, setPaymentData] = useState({ paymentMethod: 'EFECTIVO', cashReceived: 0 });

    const fetchTables = async () => {
        const res = await api.get('/pms/restaurant-tables');
        setTables(res.data);
    };

    const fetchCategories = async () => {
        const res = await api.get('/pms/menu-categories');
        setCategories(res.data);
    };

    const fetchMenuItems = async () => {
        const res = await api.get('/pms/menu-items');
        setMenuItems(res.data);
    };

    const fetchOrders = async () => {
        const [o, s] = await Promise.all([
            api.get('/pms/restaurant-orders'),
            api.get('/pms/restaurant-stats')
        ]);
        setOrders(o.data);
        setStats(s.data);
    };

    useEffect(() => {
        fetchTables();
        fetchCategories();
        fetchMenuItems();
        fetchOrders();
    }, []);

    const openForm = (type, item = null) => {
        setFormType(type);
        if (type === 'table') {
            setForm(item || { tableNumber: '', capacity: 4, minCapacity: 2, location: '' });
        } else if (type === 'category') {
            setForm(item || { name: '', description: '', order: 1 });
        } else if (type === 'menuItem') {
            setForm(item || { name: '', description: '', price: '', categoryId: '', isAvailable: true });
        }
        setShowForm(true);
    };

    const handleSave = async () => {
        try {
            let endpoint = '';
            let data = form;
            
            if (formType === 'table') {
                endpoint = form.id ? `/pms/restaurant-tables/${form.id}` : '/pms/restaurant-tables';
                if (form.id) await api.put(endpoint, data);
                else await api.post(endpoint, data);
            } else if (formType === 'category') {
                endpoint = form.id ? `/pms/menu-categories/${form.id}` : '/pms/menu-categories';
                if (form.id) await api.put(endpoint, data);
                else await api.post(endpoint, data);
            } else if (formType === 'menuItem') {
                endpoint = form.id ? `/pms/menu-items/${form.id}` : '/pms/menu-items';
                data = { ...data, price: Number(data.price) };
                if (form.id) await api.put(endpoint, data);
                else await api.post(endpoint, data);
            }
            
            setShowForm(false);
            if (formType === 'table') fetchTables();
            if (formType === 'category') fetchCategories();
            if (formType === 'menuItem') fetchMenuItems();
            Swal.fire('Guardado', '', 'success');
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'Error', 'error');
        }
    };

    const deleteItem = async (id, type) => {
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
        if (!isConfirmed) return;
        
        try {
            if (type === 'table') await api.delete(`/pms/restaurant-tables/${id}`);
            fetchTables();
            Swal.fire('Eliminado', '', 'success');
        } catch (e) {
            Swal.fire('Error', 'No se puede eliminar', 'error');
        }
    };

    const addItemToOrder = (item) => {
        const existing = newOrderItems.find(i => i.menuItemId === item.id);
        if (existing) {
            setNewOrderItems(newOrderItems.map(i => 
                i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setNewOrderItems([...newOrderItems, { 
                menuItemId: item.id, 
                name: item.name, 
                price: item.price, 
                quantity: 1 
            }]);
        }
    };

    const removeItemFromOrder = (menuItemId) => {
        setNewOrderItems(newOrderItems.filter(i => i.menuItemId !== menuItemId));
    };

    const createNewOrder = async (tableId) => {
        if (!tableId) {
            Swal.fire('Error', 'Selecciona una mesa', 'error');
            return;
        }
        if (newOrderItems.length === 0) {
            Swal.fire('Error', 'Agrega al menos un item', 'error');
            return;
        }
        try {
            const subtotal = newOrderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            await api.post('/pms/restaurant-orders', {
                tableId,
                items: newOrderItems,
                subtotal,
                tipPercentage: tipPercentage
            });
            setShowNewOrder(false);
            setNewOrderItems([]);
            fetchOrders();
            fetchTables();
            Swal.fire('Pedido creado', '', 'success');
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'Error al crear pedido', 'error');
        }
    };

    const updateOrderStatus = async (id, status) => {
        try {
            await api.patch(`/pms/restaurant-orders/${id}`, { status });
            fetchOrders();
            fetchTables();
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'Error', 'error');
        }
    };

    const processPayment = async () => {
        if (!showPayment) return;
        
        const change = Number(paymentData.cashReceived) - showPayment.total;
        if (change < 0) {
            Swal.fire('Error', 'Monto insuficiente', 'error');
            return;
        }
        
        try {
            await api.patch(`/pms/restaurant-orders/${showPayment.id}`, {
                status: 'PAID',
                paymentMethod: paymentData.paymentMethod,
                cashReceived: Number(paymentData.cashReceived),
                change
            });
            setShowPayment(null);
            setPaymentData({ paymentMethod: 'EFECTIVO', cashReceived: 0 });
            fetchOrders();
            fetchTables();
            Swal.fire('Pago exitoso', '', 'success');
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'Error en pago', 'error');
        }
    };

    const fmtMoney = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v || 0);

    const parseOrderItems = (itemsStr) => {
        try {
            return JSON.parse(itemsStr || '[]');
        } catch { return []; }
    };

    return (
        <div>
            <div style={s.header}>
                <h2 style={s.title}>Restaurante</h2>
                <div style={s.tabs}>
                    {['tables', 'menu', 'orders'].map(v => (
                        <button key={v} style={view === v ? s.tabActive : s.tab} onClick={() => setView(v)}>
                            {v === 'tables' && 'Mesas'}
                            {v === 'menu' && 'Menú'}
                            {v === 'orders' && 'Pedidos'}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'tables' && (
                <div style={s.section}>
                    <div style={s.sectionHeader}>
                        <h3>Mesas</h3>
                        <button style={s.btnPrimary} onClick={() => openForm('table')}><Plus size={16}/> Nueva Mesa</button>
                    </div>
                    <div style={s.grid}>
                        {tables.map(t => (
                            <div key={t.id} style={{...s.card, borderLeftColor: TABLE_STATUS[t.status]?.color}}>
                                <div style={s.cardTitle}>Mesa {t.tableNumber}</div>
                                <div style={s.cardSub}>Cap: {t.capacity} personas</div>
                                <div style={{...s.badge, background: TABLE_STATUS[t.status]?.bg, color: TABLE_STATUS[t.status]?.color}}>
                                    {TABLE_STATUS[t.status]?.label}
                                </div>
                                <div style={s.cardActions}>
                                    <button style={s.btnSmall} onClick={() => openForm('table', t)}>Editar</button>
                                    <button style={s.btnDelete} onClick={() => deleteItem(t.id, 'table')}>Eliminar</button>
                                </div>
                            </div>
                        ))}
                        {tables.length === 0 && <div style={s.empty}>No hay mesas</div>}
                    </div>
                </div>
            )}

            {view === 'menu' && (
                <div style={s.section}>
                    <div style={s.sectionHeader}>
                        <h3>Categorías</h3>
                        <button style={s.btnPrimary} onClick={() => openForm('category')}><Plus size={16}/> Nueva Categoría</button>
                    </div>
                    <div style={s.grid}>
                        {categories.map(c => (
                            <div key={c.id} style={s.card}>
                                <div style={s.cardTitle}>{c.name}</div>
                                <div style={s.cardSub}>{c.description || 'Sin descripción'}</div>
                                <div style={s.cardActions}>
                                    <button style={s.btnSmall} onClick={() => openForm('category', c)}>Editar</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{...s.sectionHeader, marginTop: '24px'}}>
                        <h3>Items del Menú</h3>
                        <button style={s.btnPrimary} onClick={() => openForm('menuItem')}><Plus size={16}/> Nuevo Item</button>
                    </div>
                    <div style={s.grid}>
                        {menuItems.map(m => (
                            <div key={m.id} style={s.card}>
                                <div style={s.cardTitle}>{m.name}</div>
                                <div style={s.cardSub}>{m.category?.name}</div>
                                <div style={s.cardPrice}>{fmtMoney(m.price)}</div>
                                <div style={s.cardActions}>
                                    <button style={s.btnSmall} onClick={() => openForm('menuItem', m)}>Editar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'orders' && stats && (
                <div style={s.section}>
                    <div style={s.sectionHeader}>
                        <h3>Pedidos</h3>
                        <button style={s.btnPrimary} onClick={() => { setShowNewOrder(true); setNewOrderItems([]); }}><Plus size={16}/> Nuevo Pedido</button>
                    </div>
                    <div style={s.statsRow}>
                        {Object.entries(ORDER_STATUS).map(([k, v]) => (
                            <div key={k} style={{...s.statCard, borderLeftColor: v.color}}>
                                <span style={{color: v.color}}>{v.label}</span>
                                <span style={s.statValue}>{stats[k.toLowerCase()] || 0}</span>
                            </div>
                        ))}
                        <div style={{...s.statCard, borderLeftColor: '#10b981'}}>
                            <span style={{color: '#10b981'}}>Ingresos</span>
                            <span style={s.statValue}>{fmtMoney(stats.totalRevenue || 0)}</span>
                        </div>
                        <div style={{...s.statCard, borderLeftColor: '#f59e0b'}}>
                            <span style={{color: '#f59e0b'}}>Propinas</span>
                            <span style={s.statValue}>{fmtMoney(stats.totalTips || 0)}</span>
                        </div>
                    </div>

                    <div style={s.filterRow}>
                        <select style={s.filterSel} onChange={async (e) => {
                            const res = await api.get(`/pms/restaurant-orders${e.target.value ? `?status=${e.target.value}` : ''}`);
                            setOrders(res.data);
                        }}>
                            <option value="">Todos los pedidos</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="IN_PROGRESS">En Proceso</option>
                            <option value="COMPLETED">Completado</option>
                            <option value="PAID">Pagado</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>

                    <div style={s.orderList}>
                        {orders.map(o => (
                            <div key={o.id} style={{...s.orderCard, borderLeftColor: ORDER_STATUS[o.status]?.color}} onClick={() => setShowOrder(o)}>
                                <div style={s.orderHeader}>
                                    <strong>{o.orderNumber}</strong>
                                    <span style={{...s.badge, background: ORDER_STATUS[o.status]?.bg, color: ORDER_STATUS[o.status]?.color}}>
                                        {ORDER_STATUS[o.status]?.label}
                                    </span>
                                </div>
                                <div style={s.orderInfo}>
                                    Mesa: {o.table?.tableNumber || 'N/A'} | Total: {fmtMoney(o.total)}
                                </div>
                                <div style={s.orderActions}>
                                    {o.status === 'PENDING' && (
                                        <button style={s.btnAction} onClick={() => updateOrderStatus(o.id, 'IN_PROGRESS')}>
                                            <Clock size={14}/> Iniciar
                                        </button>
                                    )}
                                    {o.status === 'IN_PROGRESS' && (
                                        <button style={s.btnAction} onClick={() => updateOrderStatus(o.id, 'COMPLETED')}>
                                            <CheckCircle size={14}/> Completar
                                        </button>
                                    )}
                                    {(o.status === 'COMPLETED' || o.status === 'IN_PROGRESS') && (
                                        <button style={{...s.btnAction, background: '#d1fae5', color: '#065f46'}} onClick={() => { setShowPayment(o); setPaymentData({ paymentMethod: 'EFECTIVO', cashReceived: o.total }); }}>
                                            <DollarSign size={14}/> Pagar
                                        </button>
                                    )}
                                    {o.status === 'PENDING' && (
                                        <button style={{...s.btnAction, background: '#fee2e2', color: '#991b1b'}} onClick={() => updateOrderStatus(o.id, 'CANCELLED')}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <div style={s.empty}>No hay pedidos</div>}
                    </div>
                </div>
            )}

            {showForm && (
                <div style={s.formCard}>
                    <div style={s.formHeader}>
                        <h3 style={s.formTitle}>
                            {formType === 'table' && (form.id ? 'Editar Mesa' : 'Nueva Mesa')}
                            {formType === 'category' && (form.id ? 'Editar Categoría' : 'Nueva Categoría')}
                            {formType === 'menuItem' && (form.id ? 'Editar Item' : 'Nuevo Item')}
                        </h3>
                        <button style={s.btnClose} onClick={() => setShowForm(false)}>X</button>
                    </div>
                    
                    {formType === 'table' && (
                        <div style={s.formRow}>
                            <div style={s.formGroup}><label>Numero</label><input style={s.input} value={form.tableNumber || ''} onChange={e => setForm({...form, tableNumber: e.target.value})}/></div>
                            <div style={s.formGroup}><label>Capacidad</label><input style={s.input} type="number" value={form.capacity || ''} onChange={e => setForm({...form, capacity: e.target.value})}/></div>
                            <div style={s.formGroup}><label>Ubicacion</label><input style={s.input} value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})}/></div>
                            <div style={s.formActionsRow}>
                                <button style={s.btnSec} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button style={s.btnPrimary} onClick={handleSave}>Guardar</button>
                            </div>
                        </div>
                    )}

                    {formType === 'category' && (
                        <div style={s.formRow}>
                            <div style={s.formGroup}><label>Nombre</label><input style={s.input} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})}/></div>
                            <div style={s.formGroup}><label>Descripcion</label><input style={s.input} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})}/></div>
                            <div style={s.formGroup}><label>Orden</label><input style={s.input} type="number" value={form.order || ''} onChange={e => setForm({...form, order: e.target.value})}/></div>
                            <div style={s.formActionsRow}>
                                <button style={s.btnSec} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button style={s.btnPrimary} onClick={handleSave}>Guardar</button>
                            </div>
                        </div>
                    )}

                    {formType === 'menuItem' && (
                        <div style={s.formRow}>
                            <div style={s.formGroup}><label>Nombre</label><input style={s.input} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})}/></div>
                            <div style={s.formGroup}><label>Precio</label><input style={s.input} type="number" value={form.price || ''} onChange={e => setForm({...form, price: e.target.value})}/></div>
                            <div style={s.formGroup}><label>Categoria</label>
                                <select style={s.input} value={form.categoryId || ''} onChange={e => setForm({...form, categoryId: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={s.formGroupFull}><label>Descripcion</label><textarea style={s.textarea} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})}/></div>
                            <div style={s.formActionsRow}>
                                <button style={s.btnSec} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button style={s.btnPrimary} onClick={handleSave}>Guardar</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showNewOrder && (
                <div style={s.formCard}>
                    <div style={s.formHeader}>
                        <h3 style={s.formTitle}>Nuevo Pedido</h3>
                        <button style={s.btnClose} onClick={() => setShowNewOrder(false)}>X</button>
                    </div>
                    
                    <div style={s.formGroup}>
                        <label>Mesa</label>
                        <select style={s.input} onChange={e => setForm({...form, tableId: e.target.value})}>
                            <option value="">Seleccionar mesa...</option>
                            {tables.filter(t => t.status === 'AVAILABLE').map(t => (
                                <option key={t.id} value={t.id}>Mesa {t.tableNumber}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{...s.sectionHeader, marginTop: '16px'}}>
                        <h4>Menu - Agregar Items</h4>
                    </div>
                    <div style={s.grid}>
                        {menuItems.map(item => (
                            <div key={item.id} style={s.card}>
                                <div style={s.cardTitle}>{item.name}</div>
                                <div style={s.cardPrice}>{fmtMoney(item.price)}</div>
                                <button style={s.btnSmall} onClick={() => addItemToOrder(item)}>
                                    <Plus size={12}/> Agregar
                                </button>
                            </div>
                        ))}
                    </div>

                    {newOrderItems.length > 0 && (
                        <div style={{marginTop: '16px'}}>
                            <div style={s.sectionHeader}>
                                <h4>Items del Pedido</h4>
                            </div>
                            {newOrderItems.map((item, idx) => (
                                <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e2e8f0'}}>
                                    <span>{item.name} x{item.quantity}</span>
                                    <span style={{fontWeight: '600'}}>{fmtMoney(item.price * item.quantity)}</span>
                                    <button style={s.btnDelete} onClick={() => removeItemFromOrder(item.menuItemId)}>X</button>
                                </div>
                            ))}
                            
                            <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e2e8f0'}}>
                                <span>Subtotal:</span>
                                <span>{fmtMoney(newOrderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0))}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e2e8f0'}}>
                                <span>IVA 19%:</span>
                                <span>{fmtMoney(newOrderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 0.19)}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', alignItems: 'center'}}>
                                <span>Propina {tipPercentage}%:</span>
                                <span>{fmtMoney(newOrderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) * (tipPercentage / 100))}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px', fontWeight: '700', fontSize: '18px'}}>
                                <span>Total:</span>
                                <span>{fmtMoney(newOrderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 1.19 * (1 + tipPercentage / 100))}</span>
                            </div>
                            
                            <div style={{...s.formGroup, marginTop: '12px'}}>
                                <label>Propina (%)</label>
                                <select style={s.input} value={tipPercentage} onChange={e => setTipPercentage(Number(e.target.value))}>
                                    <option value={0}>0%</option>
                                    <option value={10}>10%</option>
                                    <option value={15}>15%</option>
                                    <option value={20}>20%</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div style={s.formActionsRow}>
                        <button style={s.btnSec} onClick={() => setShowNewOrder(false)}>Cancelar</button>
                        <button style={s.btnPrimary} onClick={() => createNewOrder(form.tableId)}>
                            <ShoppingCart size={16}/> Crear Pedido
                        </button>
                    </div>
                </div>
            )}

            {showOrder && (
                <div style={s.formCard}>
                    <div style={s.formHeader}>
                        <h3 style={s.formTitle}>Pedido {showOrder.orderNumber}</h3>
                        <button style={s.btnClose} onClick={() => setShowOrder(null)}>X</button>
                    </div>
                    <div style={s.orderDetail}>
                        <div style={s.orderDetailRow}><span>Mesa</span><strong>{showOrder.table?.tableNumber || 'N/A'}</strong></div>
                        <div style={s.orderDetailRow}><span>Estado</span><span style={s.badge}>{ORDER_STATUS[showOrder.status]?.label}</span></div>
                        <div style={s.orderDetailRow}><span>Fecha</span><strong>{new Date(showOrder.createdAt).toLocaleString()}</strong></div>
                    </div>
                    <div style={{marginTop: '12px'}}>
                        <h4>Items</h4>
                        {parseOrderItems(showOrder.items).map((item, idx) => (
                            <div key={idx} style={s.orderDetailRow}>
                                <span>{item.name} x{item.quantity}</span>
                                <span>{fmtMoney(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{marginTop: '12px', borderTop: '2px solid #1e293b', paddingTop: '8px'}}>
                        <div style={s.orderDetailRow}><span>Subtotal</span><span>{fmtMoney(showOrder.subtotal)}</span></div>
                        <div style={s.orderDetailRow}><span>IVA 19%</span><span>{fmtMoney(showOrder.taxAmount || 0)}</span></div>
                        <div style={s.orderDetailRow}><span>Propina {showOrder.tipPercentage || 0}%</span><span>{fmtMoney(showOrder.tipAmount || 0)}</span></div>
                        <div style={{...s.orderDetailRow, fontWeight: '700', fontSize: '18px', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px'}}>
                            <span>TOTAL</span><span>{fmtMoney(showOrder.total)}</span>
                        </div>
                    </div>
                </div>
            )}

            {showPayment && (
                <div style={s.formCard}>
                    <div style={s.formHeader}>
                        <h3 style={s.formTitle}>Pago - Orden {showPayment.orderNumber}</h3>
                        <button style={s.btnClose} onClick={() => setShowPayment(null)}>X</button>
                    </div>
                    
                    <div style={{marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px'}}>
                        <div style={{fontSize: '24px', fontWeight: '700', textAlign: 'center'}}>
                            {fmtMoney(showPayment.total)}
                        </div>
                    </div>

                    <div style={s.formGroup}>
                        <label>Metodo de Pago</label>
                        <select style={s.input} value={paymentData.paymentMethod} onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})}>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                        </select>
                    </div>

                    {paymentData.paymentMethod === 'EFECTIVO' && (
                        <div style={s.formGroup}>
                            <label>Dinero Recibido</label>
                            <input style={s.input} type="number" value={paymentData.cashReceived} onChange={e => setPaymentData({...paymentData, cashReceived: e.target.value})}/>
                        </div>
                    )}

                    {paymentData.paymentMethod === 'EFECTIVO' && (
                        <div style={{marginTop: '16px', padding: '12px', background: Number(paymentData.cashReceived) >= showPayment.total ? '#d1fae5' : '#fef3c7', borderRadius: '8px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                <span>Cambio:</span>
                                <span style={{fontWeight: '700', fontSize: '18px'}}>
                                    {fmtMoney(Math.max(0, Number(paymentData.cashReceived) - showPayment.total))}
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={s.formActionsRow}>
                        <button style={s.btnSec} onClick={() => setShowPayment(null)}>Cancelar</button>
                        <button style={s.btnPrimary} onClick={processPayment}>
                            Confirmar Pago
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
    title: { margin: 0, fontSize: '20px', color: '#1e293b' },
    tabs: { display: 'flex', gap: '8px' },
    tab: { padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
    tabActive: { padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#fff' },
    section: { marginBottom: '24px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    btnSec: { padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    btnClose: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', padding: '4px 8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '16px' },
    cardTitle: { fontWeight: '700', fontSize: '16px', color: '#1e293b', marginBottom: '4px' },
    cardSub: { fontSize: '13px', color: '#64748b', marginBottom: '8px' },
    cardPrice: { fontWeight: '700', fontSize: '18px', color: '#10b981', marginBottom: '8px' },
    cardActions: { display: 'flex', gap: '8px', marginTop: '8px' },
    btnSmall: { padding: '4px 8px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
    btnDelete: { padding: '4px 8px', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#991b1b' },
    badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' },
    statsRow: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
    statCard: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '12px 16px', minWidth: '100px' },
    statValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#1e293b' },
    orderList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    orderCard: { background: '#fff', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderRadius: '8px', padding: '16px' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    orderInfo: { fontSize: '13px', color: '#64748b', marginBottom: '8px' },
    orderActions: { display: 'flex', gap: '8px' },
    btnAction: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    formCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
    formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    formTitle: { margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    formGroupFull: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' },
    formActionsRow: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' },
    input: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    textarea: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box', minHeight: '60px' },
    filterRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
    filterSel: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' },
    orderDetail: { padding: '12px', background: '#f8fafc', borderRadius: '8px', marginTop: '12px' },
    orderDetailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' },
};

export default RestaurantManager;