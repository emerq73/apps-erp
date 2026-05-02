import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/auth.service';
import Swal from 'sweetalert2';

// ─── Constants ────────────────────────────────────────────────────────────────
const CELL_W    = 60;   // px per day
const ROW_H     = 54;   // px per room row
const SIDEBAR_W = 188;  // px for room label column
const HEADER_H  = 58;   // px for date header
const TYPE_H    = 30;   // px for room-type separator row

const STATUS_COLORS = {
    PENDING:    { bg: '#fef9c3', text: '#92400e', border: '#fde68a' },
    CONFIRMED:  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    CHECKED_IN: { bg: '#dcfce7', text: '#14532d', border: '#86efac' },
    BLOCKED:    { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
    NO_SHOW:    { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const D0      = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const diffDays = (a, b) => Math.round((D0(b) - D0(a)) / 86400000);
const fmt     = d => new Date(d).toISOString().split('T')[0];
const todayStr = () => fmt(new Date());

// ─── Build a flat list of rows for Y-coordinate lookup ────────────────────────
// Returns [{roomId, top}] where top is relative to the start of the scrollable content area
function buildRowMap(data) {
    const rows = [];
    let y = HEADER_H;
    for (const type of data) {
        y += TYPE_H; // type separator
        for (const room of type.rooms) {
            rows.push({ roomId: room.id, top: y });
            y += ROW_H;
        }
    }
    return rows;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TapeChart() {
    const [startDate, setStartDate] = useState(() => D0(new Date()));
    const [daysCount, setDaysCount] = useState(15);
    const [data, setData]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [tooltip, setTooltip]     = useState(null);

    // Ghost state: what the reservation looks like while dragging/resizing
    const ghostRef = useRef(null);
    const [ghostKey, setGhostKey] = useState(0); // force re-render of ghost
    const dragRef   = useRef(null);
    const resizeRef = useRef(null);
    const rowMapRef = useRef([]);
    const gridRef   = useRef(null);

    const dates = Array.from({ length: daysCount }, (_, i) => addDays(startDate, i));

    // Rebuild row map whenever data changes
    useEffect(() => {
        rowMapRef.current = buildRowMap(data);
    }, [data]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchChart = useCallback(async () => {
        setLoading(true);
        try {
            const s = fmt(startDate);
            const e = fmt(addDays(startDate, daysCount));
            const res = await api.get(`/pms/tape-chart?start=${s}&end=${e}`);
            setData(res.data || []);
        } catch (err) { console.error('TapeChart fetch error:', err); }
        finally { setLoading(false); }
    }, [startDate, daysCount]);

    useEffect(() => { fetchChart(); }, [fetchChart]);

    const nav = n => setStartDate(d => addDays(d, n));

    // ── Position of a reservation block ──────────────────────────────────────
    function resPos(res) {
        const left  = diffDays(startDate, res.checkIn) * CELL_W;
        const dur   = Math.max(diffDays(res.checkIn, res.checkOut), 1);
        const width = dur * CELL_W - 4;
        const col   = STATUS_COLORS[res.status] || STATUS_COLORS.CONFIRMED;
        return { left, width, dur, ...col };
    }

    // ── Convert clientX → day index in grid ──────────────────────────────────
    function clientXToDay(clientX) {
        const rect   = gridRef.current.getBoundingClientRect();
        const scrollX = gridRef.current.scrollLeft;
        const relX   = clientX - rect.left + scrollX - SIDEBAR_W;
        return Math.round(relX / CELL_W);
    }

    // ── Convert clientY → roomId ──────────────────────────────────────────────
    function clientYToRoomId(clientY) {
        const rect   = gridRef.current.getBoundingClientRect();
        const scrollY = gridRef.current.scrollTop;
        const absY   = clientY - rect.top + scrollY; // Y within scroll content

        const rows = rowMapRef.current;
        // Find the row whose top ≤ absY < top+ROW_H
        let best = rows[0];
        for (const row of rows) {
            if (absY >= row.top) best = row;
            else break;
        }
        return best?.roomId || null;
    }

    // ── DRAG mousedown ────────────────────────────────────────────────────────
    function onResMouseDown(e, res, roomId) {
        if (e.target.dataset.resize) return;
        e.preventDefault();
        e.stopPropagation();
        setTooltip(null);

        const pos = resPos(res);
        // Offset of click inside the block (in days)
        const clickDayOffset = clientXToDay(e.clientX) - diffDays(startDate, res.checkIn);

        dragRef.current = {
            res, roomId,
            origCI: D0(res.checkIn),
            origCO: D0(res.checkOut),
            origRoomId: roomId,
            clickDayOffset,
        };
        ghostRef.current = {
            left: pos.left, width: pos.width, ...STATUS_COLORS[res.status] || STATUS_COLORS.CONFIRMED,
            checkIn: D0(res.checkIn), checkOut: D0(res.checkOut), roomId,
            rowTop: rowMapRef.current.find(r => r.roomId === roomId)?.top ?? HEADER_H + TYPE_H,
        };
        setGhostKey(k => k + 1);
    }

    // ── RESIZE mousedown ──────────────────────────────────────────────────────
    function onResizeMouseDown(e, res, edge, roomId) {
        e.preventDefault();
        e.stopPropagation();
        setTooltip(null);

        const pos = resPos(res);
        resizeRef.current = { res, edge, roomId };
        ghostRef.current = {
            left: pos.left, width: pos.width, ...STATUS_COLORS[res.status] || STATUS_COLORS.CONFIRMED,
            checkIn: D0(res.checkIn), checkOut: D0(res.checkOut), roomId,
            rowTop: rowMapRef.current.find(r => r.roomId === roomId)?.top ?? HEADER_H + TYPE_H,
        };
        setGhostKey(k => k + 1);
    }

    // ── Mouse move (on the outer wrapper — always fires) ─────────────────────
    const onMouseMove = useCallback((e) => {
        const d = dragRef.current;
        const r = resizeRef.current;
        if (!d && !r) return;

        const dayIdx  = clientXToDay(e.clientX);
        const roomId  = clientYToRoomId(e.clientY);
        const rowTop  = rowMapRef.current.find(row => row.roomId === roomId)?.top
                     ?? ghostRef.current?.rowTop
                     ?? HEADER_H + TYPE_H;

        if (d) {
            const newCIDay = dayIdx - d.clickDayOffset;
            const dur      = diffDays(d.origCI, d.origCO);
            const newCI    = addDays(startDate, newCIDay);
            const newCO    = addDays(newCI, dur);
            ghostRef.current = {
                ...ghostRef.current,
                left: newCIDay * CELL_W,
                width: dur * CELL_W - 4,
                checkIn: newCI, checkOut: newCO,
                roomId: roomId || d.roomId, rowTop,
            };
        }

        if (r) {
            const g = ghostRef.current;
            if (r.edge === 'right') {
                const newCO = addDays(startDate, dayIdx);
                if (diffDays(g.checkIn, newCO) >= 1) {
                    ghostRef.current = {
                        ...g, checkOut: newCO,
                        width: Math.max(diffDays(g.checkIn, newCO) * CELL_W - 4, CELL_W - 4),
                    };
                }
            } else {
                const newCI  = addDays(startDate, dayIdx);
                if (diffDays(newCI, g.checkOut) >= 1) {
                    ghostRef.current = {
                        ...g, checkIn: newCI,
                        left: dayIdx * CELL_W,
                        width: Math.max(diffDays(newCI, g.checkOut) * CELL_W - 4, CELL_W - 4),
                    };
                }
            }
        }

        setGhostKey(k => k + 1); // trigger re-render with new ghost
    }, [startDate]);

    // ── Mouse up: commit the move/resize ─────────────────────────────────────
    const onMouseUp = useCallback(async () => {
        const d = dragRef.current;
        const r = resizeRef.current;
        const g = ghostRef.current;

        dragRef.current   = null;
        resizeRef.current = null;
        ghostRef.current  = null;
        setGhostKey(k => k + 1);

        if (d && g) {
            const newCI   = fmt(g.checkIn);
            const newCO   = fmt(g.checkOut);
            const newRoom = g.roomId;
            if (newCI !== fmt(d.origCI) || newCO !== fmt(d.origCO) || newRoom !== d.origRoomId) {
                try {
                    await api.patch(`/pms/reservations/${d.res.id}/move`, {
                        checkIn: newCI, checkOut: newCO,
                        ...(newRoom !== d.origRoomId && { roomId: newRoom }),
                    });
                    Swal.fire({ icon: 'success', title: 'Reserva movida', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                    fetchChart();
                } catch (err) {
                    Swal.fire('Conflicto', err.response?.data?.message || 'No se pudo mover la reserva', 'error');
                    fetchChart();
                }
            }
        }

        if (r && g) {
            const newCI = fmt(g.checkIn);
            const newCO = fmt(g.checkOut);
            if (newCI !== fmt(r.res.checkIn) || newCO !== fmt(r.res.checkOut)) {
                try {
                    await api.patch(`/pms/reservations/${r.res.id}/move`, { checkIn: newCI, checkOut: newCO });
                    Swal.fire({ icon: 'success', title: 'Fechas actualizadas', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                    fetchChart();
                } catch (err) {
                    Swal.fire('Conflicto', err.response?.data?.message || 'No se pudo modificar', 'error');
                    fetchChart();
                }
            }
        }
    }, [fetchChart]);

    const ghost = ghostRef.current;
    const isDraggingOrResizing = !!(dragRef.current || resizeRef.current);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div
            style={s.wrap}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        >
            {/* Header */}
            <div style={s.header}>
                <div style={s.navGroup}>
                    <button style={s.btn} onClick={() => nav(-7)}><ChevronLeft size={15}/></button>
                    <button style={s.btnToday} onClick={() => setStartDate(D0(new Date()))}>Hoy</button>
                    <button style={s.btn} onClick={() => nav(7)}><ChevronRight size={15}/></button>
                    <span style={s.monthLabel}>
                        {startDate.toLocaleDateString('es-ES', { month:'long', year:'numeric' })}
                    </span>
                </div>
                <div style={s.navGroup}>
                    {[7,15,30].map(n => (
                        <button key={n}
                            style={daysCount===n ? s.btnActive : s.btn}
                            onClick={() => setDaysCount(n)}
                        >
                            {n===7 ? 'Semana' : n===15 ? '15 días' : 'Mes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading bar */}
            {loading && <div style={s.loadingBar}/>}

            {/* Scrollable grid */}
            <div style={s.gridOuter} ref={gridRef}>
                <div style={{ minWidth: SIDEBAR_W + CELL_W * daysCount, position: 'relative' }}>

                    {/* Sticky date header */}
                    <div style={s.dateHeaderRow}>
                        <div style={s.corner}/>
                        {dates.map((d, i) => {
                            const isWknd  = d.getDay()===0||d.getDay()===6;
                            const isToday = fmt(d)===todayStr();
                            return (
                                <div key={i} style={{
                                    ...s.dateCell,
                                    background: isToday ? '#eff6ff' : isWknd ? '#fafafa' : '#fff',
                                    borderLeft: isToday ? '2px solid #3b82f6' : '1px solid #f0f4f8',
                                }}>
                                    <span style={s.dayName}>{d.toLocaleDateString('es-ES',{weekday:'short'})}</span>
                                    <span style={{
                                        ...s.dayNum,
                                        color: isToday ? '#3b82f6' : isWknd ? '#ef4444' : '#1e293b',
                                        fontWeight: isToday ? 900 : 700,
                                    }}>{d.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Room rows */}
                    {data.map(type => (
                        <div key={type.id}>
                            {/* Type header */}
                            <div style={s.typeRow}>
                                <span>{type.name}</span>
                                <span style={s.typeCount}>{type.rooms.length} hab.</span>
                            </div>

                            {type.rooms.map(room => {
                                const statusColor =
                                    room.status==='AVAILABLE' ? '#10b981' :
                                    room.status==='OCCUPIED'  ? '#f59e0b' :
                                    room.status==='CLEANING'  ? '#8b5cf6' : '#94a3b8';
                                return (
                                    <div key={room.id} style={s.row}>
                                        {/* Sticky sidebar */}
                                        <div style={{ ...s.roomLabel, borderLeft:`3px solid ${statusColor}` }}>
                                            <span style={s.roomNum}>#{room.number}</span>
                                            <span style={{ width:7, height:7, borderRadius:'50%', background:statusColor, flexShrink:0 }}/>
                                        </div>

                                        {/* Day cells + reservation blocks */}
                                        <div style={s.cellsArea}>
                                            {/* Background grid lines */}
                                            {dates.map((d,i) => {
                                                const isToday = fmt(d)===todayStr();
                                                const isWknd  = d.getDay()===0||d.getDay()===6;
                                                return (
                                                    <div key={i} style={{
                                                        ...s.cell,
                                                        background: isToday ? 'rgba(59,130,246,0.06)' : isWknd ? '#fafafa' : 'transparent',
                                                        borderLeft: isToday ? '2px solid rgba(59,130,246,0.2)' : '1px solid #f0f4f8',
                                                    }}/>
                                                );
                                            })}

                                            {/* Reservation blocks */}
                                            {room.reservations.map(res => {
                                                const pos = resPos(res);
                                                if (pos.left + pos.width < 0 || pos.left > daysCount * CELL_W) return null;

                                                const isActive = (dragRef.current?.res?.id===res.id)||(resizeRef.current?.res?.id===res.id);

                                                return (
                                                    <div
                                                        key={res.id}
                                                        style={{
                                                            ...s.resBlock,
                                                            left: pos.left,
                                                            width: pos.width,
                                                            background: pos.bg,
                                                            color: pos.text,
                                                            borderColor: pos.border,
                                                            opacity: isActive ? 0.3 : 1,
                                                            cursor: isDraggingOrResizing ? 'grabbing' : 'grab',
                                                        }}
                                                        onMouseDown={e => onResMouseDown(e, res, room.id)}
                                                        onMouseEnter={e => !isDraggingOrResizing && setTooltip({ res, room, x: e.clientX, y: e.clientY })}
                                                        onMouseLeave={() => setTooltip(null)}
                                                    >
                                                        {/* Left resize */}
                                                        <div
                                                            data-resize="left"
                                                            style={s.handleL}
                                                            onMouseDown={e => onResizeMouseDown(e, res, 'left', room.id)}
                                                        />
                                                        <span style={s.resLabel}>{res.guestName}</span>
                                                        {/* Right resize */}
                                                        <div
                                                            data-resize="right"
                                                            style={s.handleR}
                                                            onMouseDown={e => onResizeMouseDown(e, res, 'right', room.id)}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Ghost block — positioned inside gridOuter scroll content */}
                    {ghost && isDraggingOrResizing && (
                        <div style={{
                            ...s.ghost,
                            left: ghost.left + SIDEBAR_W,
                            top: ghost.rowTop + (ROW_H - (ROW_H - 14)) / 2,
                            width: ghost.width,
                            background: ghost.bg,
                            borderColor: ghost.border,
                            color: ghost.text,
                        }}>
                            <span style={{ pointerEvents:'none', padding:'0 8px', fontSize:11, fontWeight:700, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                                {dragRef.current?.res?.guestName || resizeRef.current?.res?.guestName}
                            </span>
                            <span style={{ marginLeft:'auto', paddingRight:8, fontSize:10, opacity:0.8, whiteSpace:'nowrap' }}>
                                {fmt(ghost.checkIn)} → {fmt(ghost.checkOut)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tooltip (fixed position) */}
            {tooltip && !isDraggingOrResizing && (
                <div style={{ ...s.tooltip, left: Math.min(tooltip.x+14, window.innerWidth-240), top: tooltip.y-8 }}>
                    <div style={{ fontWeight:800, fontSize:13 }}>{tooltip.res.guestName}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 }}>Hab. #{tooltip.room.number}</div>
                    <div style={{ fontSize:11, marginTop:6, display:'flex', gap:4, alignItems:'center' }}>
                        📅 {new Date(tooltip.res.checkIn).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                        {' → '}
                        {new Date(tooltip.res.checkOut).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                        {' · '}{diffDays(tooltip.res.checkIn, tooltip.res.checkOut)}n
                    </div>
                    <div style={{
                        marginTop:8, display:'inline-block', fontSize:10, fontWeight:700,
                        padding:'2px 8px', borderRadius:4,
                        background: STATUS_COLORS[tooltip.res.status]?.bg,
                        color: STATUS_COLORS[tooltip.res.status]?.text,
                    }}>
                        {tooltip.res.status}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    wrap: {
        display:'flex', flexDirection:'column', height:'100%', background:'#fff',
        borderRadius:12, overflow:'hidden', border:'1px solid #e2e8f0',
        position:'relative', userSelect:'none',
    },
    header: {
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'10px 16px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc',
        flexShrink:0, gap:8,
    },
    navGroup: { display:'flex', alignItems:'center', gap:6 },
    btn: { padding:'5px 11px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600, color:'#475569', display:'flex', alignItems:'center' },
    btnActive: { padding:'5px 11px', background:'#2563eb', border:'1px solid #2563eb', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, color:'#fff' },
    btnToday: { padding:'5px 13px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:12, color:'#1e293b' },
    monthLabel: { fontSize:14, fontWeight:800, color:'#1e293b', textTransform:'capitalize' },
    loadingBar: { height:3, background:'linear-gradient(90deg,#2563eb,#7c3aed,#0ea5e9)', flexShrink:0 },
    gridOuter: { flex:1, overflow:'auto', position:'relative' },
    dateHeaderRow: {
        display:'flex', position:'sticky', top:0, zIndex:20,
        background:'#fff', borderBottom:'2px solid #e2e8f0', height:HEADER_H,
        boxShadow:'0 2px 6px rgba(0,0,0,0.06)',
    },
    corner: { width:SIDEBAR_W, flexShrink:0, borderRight:'1px solid #e2e8f0', background:'#f8fafc' },
    dateCell: { width:CELL_W, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 },
    dayName: { fontSize:9, color:'#94a3b8', textTransform:'uppercase', fontWeight:700, letterSpacing:0.5 },
    dayNum: { fontSize:15 },
    typeRow: {
        display:'flex', alignItems:'center', padding:'0 16px',
        background:'#f1f5f9', fontSize:11, fontWeight:700, color:'#475569',
        borderTop:'1px solid #e2e8f0', borderBottom:'1px solid #e2e8f0',
        height:TYPE_H, gap:6,
    },
    typeCount: { fontSize:10, opacity:0.6, fontWeight:500 },
    row: { display:'flex', height:ROW_H, borderBottom:'1px solid #f0f4f8' },
    roomLabel: {
        width:SIDEBAR_W, flexShrink:0, display:'flex', alignItems:'center',
        gap:8, padding:'0 14px', borderRight:'1px solid #e2e8f0',
        background:'#fff', position:'sticky', left:0, zIndex:10,
    },
    roomNum: { fontWeight:800, fontSize:13, color:'#1e293b', flex:1 },
    cellsArea: { flex:1, position:'relative', display:'flex' },
    cell: { width:CELL_W, flexShrink:0, height:'100%' },
    resBlock: {
        position:'absolute', top:7, height:ROW_H-14, borderRadius:7,
        border:'1.5px solid', display:'flex', alignItems:'center',
        fontSize:11, fontWeight:700, overflow:'hidden',
        boxShadow:'0 1px 4px rgba(0,0,0,0.1)',
        transition:'opacity 0.15s, box-shadow 0.15s',
    },
    resLabel: { flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:'0 6px', pointerEvents:'none' },
    handleL: {
        width:10, height:'100%', cursor:'ew-resize', flexShrink:0,
        background:'rgba(0,0,0,0.12)', borderRadius:'6px 0 0 6px',
        transition:'background 0.15s',
    },
    handleR: {
        width:10, height:'100%', cursor:'ew-resize', flexShrink:0,
        background:'rgba(0,0,0,0.12)', borderRadius:'0 6px 6px 0',
        transition:'background 0.15s',
    },
    ghost: {
        position:'absolute', height:ROW_H-14, borderRadius:7,
        border:'2px dashed', display:'flex', alignItems:'center',
        pointerEvents:'none', zIndex:50, opacity:0.9,
        boxShadow:'0 6px 20px rgba(0,0,0,0.2)',
        minWidth:CELL_W-4,
    },
    tooltip: {
        position:'fixed', zIndex:300, background:'#1e293b', color:'#fff',
        padding:'10px 14px', borderRadius:10, fontSize:12,
        boxShadow:'0 10px 30px rgba(0,0,0,0.3)', pointerEvents:'none',
        maxWidth:230, minWidth:180,
    },
};
