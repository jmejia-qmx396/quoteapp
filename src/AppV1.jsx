import { useState, useEffect, useRef } from "react";

// ── Datos iniciales ──────────────────────────────────────────────
const INIT_PRODUCTS = [
  { id: 1, sku: "SRV-001", name: "Consultoría IT (hora)", category: "Servicios", price: 150, unit: "hr" },
  { id: 2, sku: "SRV-002", name: "Soporte Técnico", category: "Servicios", price: 80, unit: "hr" },
  { id: 3, sku: "HW-001",  name: 'Monitor 27" 4K',     category: "Hardware",  price: 420, unit: "pza" },
  { id: 4, sku: "HW-002",  name: "Laptop Pro 16",      category: "Hardware",  price: 1800, unit: "pza" },
  { id: 5, sku: "SW-001",  name: "Licencia Office 365",category: "Software",  price: 120, unit: "año" },
  { id: 6, sku: "SW-002",  name: "Antivirus Empresarial",category:"Software", price: 60,  unit: "año" },
];

const INIT_CLIENTS = [
  { id: 1, name: "Acme Corp", contact: "Luis Ramírez", email: "luis@acme.com", phone: "+52 55 1234 5678", rfc: "ACM010101AAA" },
  { id: 2, name: "Tech Solutions", contact: "Ana Gómez", email: "ana@techsol.mx", phone: "+52 55 8765 4321", rfc: "TSO200202BBB" },
];

// ── localStorage hook ────────────────────────────────────────────
function usePersisted(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

// El contador de cotizaciones también persiste
const getCounter = () => {
  try { return Number(localStorage.getItem("qa_counter")) || 1001; } catch { return 1001; }
};
const saveCounter = (n) => {
  try { localStorage.setItem("qa_counter", String(n)); } catch {}
};
let quoteCounter = getCounter();

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const today = () => new Date().toISOString().split("T")[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split("T")[0]; };

// ── Estilos globales ──────────────────────────────────────────────
const G = {
  bg:       "#0d0f14",
  surface:  "#13161e",
  card:     "#1a1e2a",
  border:   "#252a38",
  accent:   "#3b82f6",
  accentH:  "#60a5fa",
  success:  "#10b981",
  danger:   "#ef4444",
  warn:     "#f59e0b",
  text:     "#e2e8f0",
  muted:    "#64748b",
  font:     "'DM Sans', sans-serif",
  mono:     "'JetBrains Mono', monospace",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${G.bg};color:${G.text};font-family:${G.font};font-size:14px}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:${G.surface}}
::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
input,select,textarea{background:${G.surface};border:1px solid ${G.border};color:${G.text};
  font-family:${G.font};font-size:13px;border-radius:6px;padding:7px 10px;outline:none;width:100%;transition:.15s}
input:focus,select:focus,textarea:focus{border-color:${G.accent}}
button{font-family:${G.font};cursor:pointer;border:none;border-radius:6px;transition:.15s;font-size:13px}
table{border-collapse:collapse;width:100%}
th{background:${G.surface};color:${G.muted};font-weight:600;font-size:11px;letter-spacing:.08em;
   text-transform:uppercase;padding:10px 14px;text-align:left;border-bottom:1px solid ${G.border}}
td{padding:10px 14px;border-bottom:1px solid ${G.border};vertical-align:middle}
tr:hover td{background:rgba(59,130,246,.04)}
.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600}
.badge-blue{background:rgba(59,130,246,.15);color:${G.accentH}}
.badge-green{background:rgba(16,185,129,.15);color:${G.success}}
.badge-warn{background:rgba(245,158,11,.15);color:${G.warn}}
.badge-red{background:rgba(239,68,68,.15);color:${G.danger}}
`;

// ── Componentes base ──────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", style = {} }) => {
  const colors = {
    primary:  { bg: G.accent,   color: "#fff", hov: G.accentH },
    success:  { bg: G.success,  color: "#fff", hov: "#34d399"  },
    danger:   { bg: G.danger,   color: "#fff", hov: "#f87171"  },
    ghost:    { bg: "transparent", color: G.muted, border: `1px solid ${G.border}` },
    outline:  { bg: "transparent", color: G.accent, border: `1px solid ${G.accent}` },
  };
  const c = colors[variant];
  const pad = size === "sm" ? "5px 12px" : size === "lg" ? "10px 22px" : "7px 16px";
  return (
    <button onClick={onClick}
      style={{ background: c.bg, color: c.color, border: c.border || "none",
               padding: pad, fontWeight: 500, ...style }}
      onMouseOver={e => c.hov && (e.currentTarget.style.background = c.hov)}
      onMouseOut={e => (e.currentTarget.style.background = c.bg)}>
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: G.card, border: `1px solid ${G.border}`,
                borderRadius: 10, padding: 20, ...style }}>
    {children}
  </div>
);

const Modal = ({ title, onClose, children, width = 680 }) => (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.7)",
                display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}>
    <div style={{ background:G.card,border:`1px solid ${G.border}`,borderRadius:12,
                  width:"100%",maxWidth:width,maxHeight:"90vh",overflow:"auto" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"18px 22px",borderBottom:`1px solid ${G.border}`,position:"sticky",top:0,background:G.card,zIndex:1 }}>
        <span style={{ fontWeight:700,fontSize:16 }}>{title}</span>
        <button onClick={onClose} style={{ background:"none",border:"none",color:G.muted,
                                           fontSize:20,cursor:"pointer",lineHeight:1 }}>✕</button>
      </div>
      <div style={{ padding:22 }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, children, style = {} }) => (
  <div style={{ marginBottom:14, ...style }}>
    <label style={{ display:"block",color:G.muted,fontSize:11,fontWeight:600,
                    textTransform:"uppercase",letterSpacing:".06em",marginBottom:5 }}>{label}</label>
    {children}
  </div>
);

const StatCard = ({ label, value, color = G.accent, icon }) => (
  <Card style={{ flex:1 }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
      <div>
        <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>{label}</p>
        <p style={{ fontSize:22,fontWeight:700,color }}>{value}</p>
      </div>
      <span style={{ fontSize:22,opacity:.5 }}>{icon}</span>
    </div>
  </Card>
);

// ── SIDEBAR ───────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", label:"Dashboard",    icon:"⬛" },
  { id:"quotes",    label:"Cotizaciones", icon:"📋" },
  { id:"clients",   label:"Clientes",     icon:"👥" },
  { id:"products",  label:"Catálogo",     icon:"📦" },
];

const Sidebar = ({ view, setView }) => (
  <div style={{ width:220,background:G.surface,borderRight:`1px solid ${G.border}`,
                display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,flexShrink:0 }}>
    <div style={{ padding:"22px 20px",borderBottom:`1px solid ${G.border}` }}>
      <div style={{ fontFamily:G.mono,fontWeight:700,fontSize:17,color:G.accent,letterSpacing:"-.02em" }}>
        ◈ QuoteApp
      </div>
      <div style={{ color:G.muted,fontSize:11,marginTop:2 }}>Sistema de Cotizaciones</div>
    </div>
    <nav style={{ flex:1,padding:"14px 10px" }}>
      {NAV.map(n => (
        <div key={n.id} onClick={() => setView(n.id)}
          style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                   borderRadius:7,marginBottom:2,cursor:"pointer",
                   background: view === n.id ? `rgba(59,130,246,.12)` : "transparent",
                   color: view === n.id ? G.accentH : G.muted,
                   fontWeight: view === n.id ? 600 : 400,
                   transition:".15s" }}>
          <span>{n.icon}</span>{n.label}
        </div>
      ))}
    </nav>
    <div style={{ padding:"14px 20px",borderTop:`1px solid ${G.border}`,color:G.muted,fontSize:11 }}>
      v1.0.0 · QuoteApp Pro
    </div>
  </div>
);

// ── STATUS BADGE ─────────────────────────────────────────────────
const StatusBadge = ({ s }) => {
  const m = { Pendiente:"warn",Aprobada:"green",Rechazada:"red",Enviada:"blue" };
  return <span className={`badge badge-${m[s]||"blue"}`}>{s}</span>;
};

// ── DASHBOARD ────────────────────────────────────────────────────
const Dashboard = ({ quotes, clients, products }) => {
  const total = quotes.reduce((s, q) => s + (q.total||0), 0);
  const approved = quotes.filter(q => q.status === "Aprobada");
  return (
    <div style={{ padding:30 }}>
      <h1 style={{ fontSize:22,fontWeight:700,marginBottom:6 }}>Dashboard</h1>
      <p style={{ color:G.muted,marginBottom:24 }}>Resumen general de tu negocio</p>

      <div style={{ display:"flex",gap:16,marginBottom:24,flexWrap:"wrap" }}>
        <StatCard label="Total Cotizado" value={fmt(total)} icon="💰" color={G.accent} />
        <StatCard label="Cotizaciones" value={quotes.length} icon="📋" color={G.success} />
        <StatCard label="Aprobadas" value={approved.length} icon="✅" color={G.success} />
        <StatCard label="Clientes" value={clients.length} icon="👥" color={G.warn} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
        <Card>
          <p style={{ fontWeight:700,marginBottom:14 }}>Últimas Cotizaciones</p>
          {quotes.slice(-5).reverse().map(q => (
            <div key={q.id} style={{ display:"flex",justifyContent:"space-between",
                                     padding:"8px 0",borderBottom:`1px solid ${G.border}` }}>
              <div>
                <span style={{ fontFamily:G.mono,fontSize:12,color:G.accent }}>#{q.number}</span>
                <span style={{ marginLeft:8 }}>{q.clientName}</span>
              </div>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                <span style={{ color:G.muted,fontSize:12 }}>{fmt(q.total||0)}</span>
                <StatusBadge s={q.status} />
              </div>
            </div>
          ))}
          {!quotes.length && <p style={{ color:G.muted }}>Sin cotizaciones aún.</p>}
        </Card>

        <Card>
          <p style={{ fontWeight:700,marginBottom:14 }}>Estado de Cotizaciones</p>
          {[["Pendiente","warn"],["Aprobada","green"],["Rechazada","red"],["Enviada","blue"]].map(([s,c])=>{
            const cnt = quotes.filter(q=>q.status===s).length;
            const pct = quotes.length ? Math.round(cnt/quotes.length*100) : 0;
            return (
              <div key={s} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12 }}>{s}</span>
                  <span style={{ fontSize:12,color:G.muted }}>{cnt} ({pct}%)</span>
                </div>
                <div style={{ background:G.border,borderRadius:4,height:6 }}>
                  <div style={{ width:`${pct}%`,height:6,borderRadius:4,
                                background: c==="green"?G.success:c==="red"?G.danger:c==="warn"?G.warn:G.accent,
                                transition:".4s" }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};

// ── RECALCULAR TOTALES ────────────────────────────────────────────
const recalc = (q) => {
  const subtotal = q.items.reduce((s, i) => s + (Number(i.qty) * Number(i.price)), 0);
  const disc = subtotal * ((q.discount||0) / 100);
  const taxAmt = (subtotal - disc) * ((q.tax||0) / 100);
  return { ...q, subtotal, discountAmt: disc, taxAmt, total: subtotal - disc + taxAmt };
};

// ── COTIZACIONES ─────────────────────────────────────────────────
const QuotesView = ({ quotes, setQuotes, clients, products }) => {
  const [modal, setModal] = useState(null);
  const [current, setCurrent] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const openNew = () => {
    const c0 = clients[0];
    const num = quoteCounter++;
    saveCounter(quoteCounter);
    setCurrent(recalc({
      id: Date.now(), number: num,
      date: today(), validUntil: addDays(today(), 30),
      clientId: c0?.id || null,
      clientName: c0?.name || "",
      clientContact: c0?.contact || "",
      clientEmail: c0?.email || "",
      status: "Pendiente", notes: "", discount: 0, tax: 16, items: [], currency: "MXN",
    }));
    setModal("new");
  };

  const openEdit = (q) => { setCurrent({ ...q }); setModal("edit"); };
  const openView = (q) => { setCurrent({ ...q }); setModal("view"); };

  const save = () => {
    if (modal === "new") setQuotes(qs => [...qs, current]);
    else setQuotes(qs => qs.map(q => q.id === current.id ? current : q));
    setModal(null);
  };

  const remove = (id) => { if (window.confirm("¿Eliminar cotización?")) setQuotes(qs => qs.filter(q => q.id !== id)); };

  const filtered = quotes.filter(q => {
    const ok = filterStatus === "Todos" || q.status === filterStatus;
    const srch = search.toLowerCase();
    return ok && (q.clientName.toLowerCase().includes(srch) ||
                  String(q.number).includes(srch) || q.status.toLowerCase().includes(srch));
  });

  return (
    <div style={{ padding:30 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>Cotizaciones</h1>
          <p style={{ color:G.muted }}>{quotes.length} cotización(es) en total</p>
        </div>
        <Btn onClick={openNew}>+ Nueva Cotización</Btn>
      </div>

      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
          <input placeholder="Buscar por cliente, número…" value={search}
            onChange={e=>setSearch(e.target.value)} style={{ flex:1,minWidth:180 }} />
          {["Todos","Pendiente","Enviada","Aprobada","Rechazada"].map(s => (
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{ padding:"6px 14px",borderRadius:20,border:`1px solid ${filterStatus===s?G.accent:G.border}`,
                       background:filterStatus===s?`rgba(59,130,246,.15)`:"transparent",
                       color:filterStatus===s?G.accent:G.muted,cursor:"pointer",fontSize:12,fontFamily:G.font }}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      <Card style={{ padding:0,overflow:"hidden" }}>
        <table>
          <thead><tr>
            <th>#</th><th>Cliente</th><th>Fecha</th><th>Válida hasta</th>
            <th>Total</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody>
            {filtered.map(q => (
              <tr key={q.id}>
                <td><span style={{ fontFamily:G.mono,color:G.accent,fontWeight:600 }}>#{q.number}</span></td>
                <td>
                  <div style={{ fontWeight:500 }}>{q.clientName}</div>
                  <div style={{ color:G.muted,fontSize:12 }}>{q.clientEmail}</div>
                </td>
                <td style={{ color:G.muted }}>{q.date}</td>
                <td style={{ color:G.muted }}>{q.validUntil}</td>
                <td style={{ fontWeight:700,fontFamily:G.mono }}>{fmt(q.total||0)}</td>
                <td><StatusBadge s={q.status} /></td>
                <td>
                  <div style={{ display:"flex",gap:6 }}>
                    <Btn size="sm" variant="ghost" onClick={()=>openView(q)}>Ver</Btn>
                    <Btn size="sm" variant="outline" onClick={()=>openEdit(q)}>Editar</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>remove(q.id)}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} style={{ textAlign:"center",color:G.muted,padding:30 }}>
                Sin cotizaciones. Crea la primera con "+ Nueva Cotización".
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {(modal === "new" || modal === "edit") && current && (
        <QuoteForm quote={current} setQuote={setCurrent} clients={clients} products={products}
          onSave={save} onClose={()=>setModal(null)} isNew={modal==="new"} />
      )}
      {modal === "view" && current && (
        <QuotePreview quote={current} onClose={()=>setModal(null)} onEdit={()=>setModal("edit")} />
      )}
    </div>
  );
};

// ── QUOTE FORM ───────────────────────────────────────────────────
const QuoteForm = ({ quote, setQuote, clients, products, onSave, onClose, isNew }) => {
  const [prodSearch, setProdSearch] = useState("");

  const set = (k, v) => setQuote(q => recalc({ ...q, [k]: v }));

  const addItem = (prod) => {
    const item = { id: Date.now(), productId: prod.id, sku: prod.sku,
                   name: prod.name, qty: 1, price: prod.price, unit: prod.unit };
    setQuote(q => recalc({ ...q, items: [...q.items, item] }));
  };

  const updateItem = (id, k, v) =>
    setQuote(q => recalc({ ...q, items: q.items.map(i => i.id===id ? { ...i, [k]: Number(v)||v } : i) }));

  const removeItem = (id) =>
    setQuote(q => recalc({ ...q, items: q.items.filter(i => i.id !== id) }));

  const selectClient = (id) => {
    const c = clients.find(c => c.id === Number(id));
    if (c) setQuote(q => ({ ...q, clientId: c.id, clientName: c.name,
                             clientContact: c.contact, clientEmail: c.email }));
  };

  const filtProd = products.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(prodSearch.toLowerCase()));

  return (
    <Modal title={isNew ? "Nueva Cotización" : `Editar Cotización #${quote.number}`}
           onClose={onClose} width={940}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20 }}>
        <Field label="Cliente">
          <select value={quote.clientId || ""} onChange={e=>selectClient(e.target.value)}>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            {!clients.length && <option>— Sin clientes —</option>}
          </select>
        </Field>
        <Field label="Estado">
          <select value={quote.status} onChange={e=>set("status",e.target.value)}>
            {["Pendiente","Enviada","Aprobada","Rechazada"].map(s=><option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" value={quote.date} onChange={e=>set("date",e.target.value)} />
        </Field>
        <Field label="Válida Hasta">
          <input type="date" value={quote.validUntil} onChange={e=>set("validUntil",e.target.value)} />
        </Field>
        <Field label="Descuento (%)">
          <input type="number" min={0} max={100} value={quote.discount}
            onChange={e=>setQuote(q=>recalc({...q,discount:Number(e.target.value)}))} />
        </Field>
        <Field label="IVA (%)">
          <input type="number" min={0} value={quote.tax}
            onChange={e=>setQuote(q=>recalc({...q,tax:Number(e.target.value)}))} />
        </Field>
      </div>

      <p style={{ fontWeight:700,marginBottom:10,fontSize:13 }}>Agregar del Catálogo</p>
      <div style={{ background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,padding:14,marginBottom:18 }}>
        <input placeholder="Buscar producto o SKU…" value={prodSearch}
          onChange={e=>setProdSearch(e.target.value)} style={{ marginBottom:10 }} />
        <div style={{ display:"flex",flexWrap:"wrap",gap:8,maxHeight:120,overflowY:"auto" }}>
          {filtProd.map(p=>(
            <button key={p.id} onClick={()=>addItem(p)}
              style={{ background:G.card,border:`1px solid ${G.border}`,borderRadius:6,
                       padding:"6px 12px",color:G.text,cursor:"pointer",fontSize:12,fontFamily:G.font }}>
              <span style={{ color:G.accent,fontFamily:G.mono,marginRight:6 }}>{p.sku}</span>
              {p.name}
              <span style={{ marginLeft:8,color:G.muted }}>{fmt(p.price)}/{p.unit}</span>
            </button>
          ))}
          {!filtProd.length && <span style={{ color:G.muted,fontSize:12 }}>Sin coincidencias.</span>}
        </div>
      </div>

      <Card style={{ padding:0,overflow:"hidden",marginBottom:18 }}>
        <table>
          <thead><tr>
            <th>SKU</th><th>Descripción</th><th style={{width:80}}>Qty</th>
            <th style={{width:130}}>P. Unitario</th><th>Total</th><th></th>
          </tr></thead>
          <tbody>
            {quote.items.map(item=>(
              <tr key={item.id}>
                <td style={{ fontFamily:G.mono,fontSize:12,color:G.accent,whiteSpace:"nowrap" }}>{item.sku}</td>
                <td>
                  <input value={item.name} onChange={e=>updateItem(item.id,"name",e.target.value)}
                    style={{ padding:"4px 8px" }} />
                </td>
                <td>
                  <input type="number" min={1} value={item.qty}
                    onChange={e=>updateItem(item.id,"qty",e.target.value)}
                    style={{ padding:"4px 8px" }} />
                </td>
                <td>
                  <input type="number" min={0} value={item.price}
                    onChange={e=>updateItem(item.id,"price",e.target.value)}
                    style={{ padding:"4px 8px" }} />
                </td>
                <td style={{ fontFamily:G.mono,fontWeight:600,whiteSpace:"nowrap" }}>
                  {fmt(Number(item.qty)*Number(item.price))}
                </td>
                <td>
                  <button onClick={()=>removeItem(item.id)}
                    style={{ background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:18,lineHeight:1 }}>✕</button>
                </td>
              </tr>
            ))}
            {!quote.items.length && (
              <tr><td colSpan={6} style={{ textAlign:"center",color:G.muted,padding:24,fontStyle:"italic" }}>
                Agrega productos del catálogo de arriba.
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:18 }}>
        <div style={{ width:290,background:G.surface,borderRadius:8,padding:14 }}>
          {[["Subtotal", fmt(quote.subtotal||0), G.text],
            [`- Descuento (${quote.discount}%)`, `-${fmt(quote.discountAmt||0)}`, G.danger],
            [`+ IVA (${quote.tax}%)`, fmt(quote.taxAmt||0), G.text]].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",
                                   padding:"5px 0",borderBottom:`1px solid ${G.border}`,
                                   fontSize:12,color:G.muted }}>
              <span>{l}</span><span style={{ fontFamily:G.mono,color:c }}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontWeight:700,fontSize:15 }}>
            <span>TOTAL</span>
            <span style={{ fontFamily:G.mono,color:G.accent }}>{fmt(quote.total||0)}</span>
          </div>
        </div>
      </div>

      <Field label="Notas / Condiciones">
        <textarea rows={3} value={quote.notes} onChange={e=>set("notes",e.target.value)}
          placeholder="Términos de pago, garantías, condiciones especiales…" />
      </Field>

      <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:14 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="success" onClick={onSave}>💾 {isNew?"Crear Cotización":"Guardar Cambios"}</Btn>
      </div>
    </Modal>
  );
};

// ── QUOTE PREVIEW / PDF ──────────────────────────────────────────
const QuotePreview = ({ quote, onClose, onEdit }) => {
  const handlePrint = () => {
    const w = window.open("","_blank","width=900,height=700");
    w.document.write(`
      <html><head><title>Cotización #${quote.number}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#111;padding:40px;font-size:13px}
        h1{color:#1d4ed8;font-size:24px;margin:0}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px}
        .badge{background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;display:inline-block;margin-top:6px}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th{background:#f1f5f9;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b}
        td{padding:9px 12px;border-bottom:1px solid #e2e8f0}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
        .info-box{background:#f8fafc;padding:14px;border-radius:8px}
        .lbl{font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px}
        .notes-box{background:#fffbeb;border-left:3px solid #f59e0b;padding:12px;margin-top:20px}
        .total-row td{font-weight:700;font-size:15px;border-top:2px solid #1d4ed8;color:#1d4ed8}
        code{font-family:monospace;color:#1d4ed8}
      </style></head><body>
        <div class="header">
          <div><h1>◈ QuoteApp</h1><p style="color:#64748b;margin:4px 0 0">Sistema de Cotizaciones Profesional</p></div>
          <div style="text-align:right">
            <p style="font-size:22px;font-weight:700;color:#1d4ed8;margin:0">COTIZACIÓN</p>
            <p style="font-size:18px;font-weight:600;color:#475569">#${quote.number}</p>
            <span class="badge">${quote.status}</span>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <div class="lbl">Cliente</div>
            <strong>${quote.clientName}</strong>
            <p>${quote.clientContact||""}</p>
            <p>${quote.clientEmail||""}</p>
          </div>
          <div class="info-box">
            <div class="lbl">Detalles</div>
            <p><strong>Fecha:</strong> ${quote.date}</p>
            <p><strong>Válida hasta:</strong> ${quote.validUntil}</p>
            <p><strong>Moneda:</strong> MXN</p>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>SKU</th><th>Descripción</th><th>Cant.</th><th>P. Unitario</th><th>Total</th></tr></thead>
          <tbody>
            ${quote.items.map((it,i)=>`<tr>
              <td>${i+1}</td><td><code>${it.sku}</code></td><td>${it.name}</td>
              <td>${it.qty} ${it.unit||""}</td>
              <td>$${Number(it.price).toFixed(2)}</td>
              <td>$${(Number(it.qty)*Number(it.price)).toFixed(2)}</td>
            </tr>`).join("")}
          </tbody>
          <tfoot>
            <tr><td colspan="5" style="text-align:right;color:#64748b">Subtotal</td><td>$${(quote.subtotal||0).toFixed(2)}</td></tr>
            <tr><td colspan="5" style="text-align:right;color:#ef4444">- Descuento (${quote.discount}%)</td><td style="color:#ef4444">-$${(quote.discountAmt||0).toFixed(2)}</td></tr>
            <tr><td colspan="5" style="text-align:right;color:#64748b">+ IVA (${quote.tax}%)</td><td>$${(quote.taxAmt||0).toFixed(2)}</td></tr>
            <tr class="total-row"><td colspan="5" style="text-align:right">TOTAL MXN</td><td>$${(quote.total||0).toFixed(2)}</td></tr>
          </tfoot>
        </table>
        ${quote.notes?`<div class="notes-box"><strong>Notas:</strong><br>${quote.notes}</div>`:""}
        <p style="margin-top:40px;color:#94a3b8;font-size:11px;text-align:center">Generado con QuoteApp · Válida hasta ${quote.validUntil}</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(), 500);
  };

  return (
    <Modal title={`Vista Previa — Cotización #${quote.number}`} onClose={onClose} width={740}>
      <div style={{ background:G.surface,borderRadius:8,padding:20,marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
          <div>
            <p style={{ fontFamily:G.mono,fontSize:20,fontWeight:700,color:G.accent }}>◈ QuoteApp</p>
            <p style={{ color:G.muted,fontSize:12 }}>Sistema de Cotizaciones</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:18,fontWeight:700 }}>COTIZACIÓN #{quote.number}</p>
            <StatusBadge s={quote.status} />
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div style={{ background:G.card,padding:12,borderRadius:6 }}>
            <p style={{ color:G.muted,fontSize:10,textTransform:"uppercase",marginBottom:4 }}>Cliente</p>
            <p style={{ fontWeight:600 }}>{quote.clientName}</p>
            <p style={{ color:G.muted,fontSize:12 }}>{quote.clientContact}</p>
            <p style={{ color:G.muted,fontSize:12 }}>{quote.clientEmail}</p>
          </div>
          <div style={{ background:G.card,padding:12,borderRadius:6 }}>
            <p style={{ color:G.muted,fontSize:10,textTransform:"uppercase",marginBottom:4 }}>Detalles</p>
            <p style={{ fontSize:12 }}>📅 Fecha: <strong>{quote.date}</strong></p>
            <p style={{ fontSize:12 }}>⏳ Válida: <strong>{quote.validUntil}</strong></p>
          </div>
        </div>
      </div>

      <Card style={{ padding:0,overflow:"hidden",marginBottom:16 }}>
        <table>
          <thead><tr><th>SKU</th><th>Descripción</th><th>Qty</th><th>P. Unit.</th><th>Total</th></tr></thead>
          <tbody>
            {quote.items.map(it=>(
              <tr key={it.id}>
                <td style={{ fontFamily:G.mono,fontSize:11,color:G.accent }}>{it.sku}</td>
                <td>{it.name}</td>
                <td>{it.qty} {it.unit}</td>
                <td style={{ fontFamily:G.mono }}>{fmt(Number(it.price))}</td>
                <td style={{ fontFamily:G.mono,fontWeight:700 }}>{fmt(Number(it.qty)*Number(it.price))}</td>
              </tr>
            ))}
            {!quote.items.length && <tr><td colSpan={5} style={{ textAlign:"center",color:G.muted,padding:16 }}>Sin ítems.</td></tr>}
          </tbody>
        </table>
      </Card>

      <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:16 }}>
        <div style={{ width:270,background:G.surface,borderRadius:8,padding:14 }}>
          {[["Subtotal",fmt(quote.subtotal||0),G.text],
            [`- Descuento (${quote.discount}%)`,`-${fmt(quote.discountAmt||0)}`,G.danger],
            [`+ IVA (${quote.tax}%)`,fmt(quote.taxAmt||0),G.text]].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",
                                   borderBottom:`1px solid ${G.border}`,fontSize:12,color:G.muted }}>
              <span>{l}</span><span style={{ fontFamily:G.mono,color:c }}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontWeight:700,fontSize:16 }}>
            <span>TOTAL</span>
            <span style={{ fontFamily:G.mono,color:G.accent }}>{fmt(quote.total||0)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div style={{ background:"rgba(245,158,11,.08)",border:`1px solid rgba(245,158,11,.3)`,
                      borderRadius:8,padding:12,marginBottom:16 }}>
          <p style={{ color:G.warn,fontSize:11,fontWeight:700,marginBottom:4 }}>NOTAS</p>
          <p style={{ fontSize:12,color:G.muted }}>{quote.notes}</p>
        </div>
      )}

      <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn variant="outline" onClick={onEdit}>✏️ Editar</Btn>
        <Btn variant="primary" onClick={handlePrint}>🖨️ Imprimir / PDF</Btn>
      </div>
    </Modal>
  );
};

// ── CLIENTES ─────────────────────────────────────────────────────
const ClientsView = ({ clients, setClients }) => {
  const [modal, setModal] = useState(false);
  const [cur, setCur] = useState(null);
  const [search, setSearch] = useState("");

  const blank = () => ({ id:Date.now(),name:"",contact:"",email:"",phone:"",rfc:"" });
  const openNew = () => { setCur(blank()); setModal(true); };
  const openEdit = (c) => { setCur({...c}); setModal(true); };
  const isExisting = cur && clients.some(c=>c.id===cur.id);
  const save = () => {
    if (isExisting) setClients(cs=>cs.map(c=>c.id===cur.id?cur:c));
    else setClients(cs=>[...cs,cur]);
    setModal(false);
  };
  const remove = (id) => { if(window.confirm("¿Eliminar cliente?")) setClients(cs=>cs.filter(c=>c.id!==id)); };

  const filt = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding:30 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>Clientes</h1>
          <p style={{ color:G.muted }}>{clients.length} cliente(s) registrado(s)</p>
        </div>
        <Btn onClick={openNew}>+ Nuevo Cliente</Btn>
      </div>
      <Card style={{ marginBottom:16 }}>
        <input placeholder="Buscar por nombre o email…" value={search} onChange={e=>setSearch(e.target.value)} />
      </Card>
      <Card style={{ padding:0,overflow:"hidden" }}>
        <table>
          <thead><tr><th>Empresa</th><th>Contacto</th><th>Email</th><th>Teléfono</th><th>RFC</th><th></th></tr></thead>
          <tbody>
            {filt.map(c=>(
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.contact}</td>
                <td style={{ color:G.muted }}>{c.email}</td>
                <td style={{ fontFamily:G.mono,fontSize:12 }}>{c.phone}</td>
                <td style={{ fontFamily:G.mono,fontSize:12,color:G.accent }}>{c.rfc}</td>
                <td>
                  <div style={{ display:"flex",gap:6 }}>
                    <Btn size="sm" variant="outline" onClick={()=>openEdit(c)}>Editar</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>remove(c.id)}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {!filt.length && <tr><td colSpan={6} style={{ textAlign:"center",color:G.muted,padding:24 }}>Sin clientes registrados.</td></tr>}
          </tbody>
        </table>
      </Card>

      {modal && cur && (
        <Modal title={isExisting?"Editar Cliente":"Nuevo Cliente"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <Field label="Empresa"><input value={cur.name} onChange={e=>setCur({...cur,name:e.target.value})} placeholder="Nombre de la empresa" /></Field>
            <Field label="Contacto"><input value={cur.contact} onChange={e=>setCur({...cur,contact:e.target.value})} placeholder="Nombre del contacto" /></Field>
            <Field label="Email"><input type="email" value={cur.email} onChange={e=>setCur({...cur,email:e.target.value})} placeholder="correo@empresa.com" /></Field>
            <Field label="Teléfono"><input value={cur.phone} onChange={e=>setCur({...cur,phone:e.target.value})} placeholder="+52 55 0000 0000" /></Field>
            <Field label="RFC" style={{ gridColumn:"1/-1" }}><input value={cur.rfc} onChange={e=>setCur({...cur,rfc:e.target.value})} placeholder="RFC000000AAA" /></Field>
          </div>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn variant="success" onClick={save}>💾 Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── CATÁLOGO ─────────────────────────────────────────────────────
const ProductsView = ({ products, setProducts }) => {
  const [modal, setModal] = useState(false);
  const [cur, setCur] = useState(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todos");

  const cats = ["Todos", ...new Set(products.map(p=>p.category))];
  const blank = () => ({ id:Date.now(),sku:"",name:"",category:"Servicios",price:0,unit:"pza" });
  const openNew = () => { setCur(blank()); setModal(true); };
  const openEdit = (p) => { setCur({...p}); setModal(true); };
  const isExisting = cur && products.some(p=>p.id===cur.id);
  const save = () => {
    if(isExisting) setProducts(ps=>ps.map(p=>p.id===cur.id?cur:p));
    else setProducts(ps=>[...ps,cur]);
    setModal(false);
  };
  const remove = (id) => { if(window.confirm("¿Eliminar producto?")) setProducts(ps=>ps.filter(p=>p.id!==id)); };

  const filt = products.filter(p=>{
    const ok = cat==="Todos" || p.category===cat;
    return ok && (p.name.toLowerCase().includes(search.toLowerCase()) ||
                  p.sku.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div style={{ padding:30 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>Catálogo de Productos</h1>
          <p style={{ color:G.muted }}>{products.length} producto(s) / servicio(s)</p>
        </div>
        <Btn onClick={openNew}>+ Nuevo Producto</Btn>
      </div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
          <input placeholder="Buscar producto o SKU…" value={search}
            onChange={e=>setSearch(e.target.value)} style={{ flex:1,minWidth:150 }} />
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              style={{ padding:"6px 14px",borderRadius:20,border:`1px solid ${cat===c?G.accent:G.border}`,
                       background:cat===c?`rgba(59,130,246,.15)`:"transparent",
                       color:cat===c?G.accent:G.muted,cursor:"pointer",fontSize:12,fontFamily:G.font }}>
              {c}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{ padding:0,overflow:"hidden" }}>
        <table>
          <thead><tr><th>SKU</th><th>Producto / Servicio</th><th>Categoría</th><th>Precio</th><th>Unidad</th><th></th></tr></thead>
          <tbody>
            {filt.map(p=>(
              <tr key={p.id}>
                <td style={{ fontFamily:G.mono,color:G.accent,fontSize:12 }}>{p.sku}</td>
                <td><strong>{p.name}</strong></td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td style={{ fontFamily:G.mono,fontWeight:700 }}>{fmt(p.price)}</td>
                <td style={{ color:G.muted }}>{p.unit}</td>
                <td>
                  <div style={{ display:"flex",gap:6 }}>
                    <Btn size="sm" variant="outline" onClick={()=>openEdit(p)}>Editar</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>remove(p.id)}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {!filt.length && <tr><td colSpan={6} style={{ textAlign:"center",color:G.muted,padding:24 }}>Sin productos.</td></tr>}
          </tbody>
        </table>
      </Card>

      {modal && cur && (
        <Modal title={isExisting?"Editar Producto":"Nuevo Producto"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <Field label="SKU"><input value={cur.sku} onChange={e=>setCur({...cur,sku:e.target.value})} placeholder="HW-001" /></Field>
            <Field label="Categoría">
              <select value={cur.category} onChange={e=>setCur({...cur,category:e.target.value})}>
                {["Hardware","Software","Servicios","Consumibles","Otros"].map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Nombre del Producto" style={{ gridColumn:"1/-1" }}>
              <input value={cur.name} onChange={e=>setCur({...cur,name:e.target.value})} placeholder="Descripción del producto o servicio" />
            </Field>
            <Field label="Precio (MXN)">
              <input type="number" min={0} step={0.01} value={cur.price} onChange={e=>setCur({...cur,price:Number(e.target.value)})} />
            </Field>
            <Field label="Unidad">
              <select value={cur.unit} onChange={e=>setCur({...cur,unit:e.target.value})}>
                {["pza","hr","día","mes","año","kg","lt","m2","servicio","licencia","usuario"].map(u=><option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn variant="success" onClick={save}>💾 Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [quotes, setQuotes]     = usePersisted("qa_quotes",   []);
  const [clients, setClients]   = usePersisted("qa_clients",  INIT_CLIENTS);
  const [products, setProducts] = usePersisted("qa_products", INIT_PRODUCTS);

  return (
    <>
      <style>{css}</style>
      <div style={{ display:"flex",minHeight:"100vh" }}>
        <Sidebar view={view} setView={setView} />
        <main style={{ flex:1,overflowY:"auto" }}>
          {view==="dashboard" && <Dashboard quotes={quotes} clients={clients} products={products} />}
          {view==="quotes"    && <QuotesView quotes={quotes} setQuotes={setQuotes} clients={clients} products={products} />}
          {view==="clients"   && <ClientsView clients={clients} setClients={setClients} />}
          {view==="products"  && <ProductsView products={products} setProducts={setProducts} />}
        </main>
      </div>
    </>
  );
}
