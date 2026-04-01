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

const INIT_CONFIG = {
  companyName: "Casa Inteligente",
  slogan: "Todo bajo control",
  vendorName: "Jorge Mejia Jaramillo",
  vendorPhone: "3182854896",
  vendorEmail: "jmejia@casainteligente.com",
  website: "www.casainteligente.com",
  nit: "901.841.945-1",
  bankName: "Bancolombia",
  bankAccount: "259.000.026.54",
  bankType: "Ahorros",
  accountHolder: "Ecomotica Automatizacion",
  defaultNotes: "- Esta cotización tiene una validéz de 10 días.\n- Forma de pago:\n  80% Anticipado.\n  20% Contra entrega.",
  logoUrl: "",
  primaryColor: "#0d6e6e",
};

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
const fmt    = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits:0 }).format(n);
const fmtUSD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtCur = (n, cur) => cur === "USD" ? fmtUSD(n) : fmt(n);
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
  { id:"config",    label:"Mi Empresa",   icon:"⚙️" },
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
  const trm = Number(q.trm) || 1;
  const items = q.items.map(i => {
    const priceCOP   = i.currency === "USD" ? Number(i.price) * trm : Number(i.price);
    const costCOP    = i.currency === "USD" ? Number(i.cost||0) * trm : Number(i.cost||0);
    const discAmt    = priceCOP * ((Number(i.discount)||0) / 100);
    const netCOP     = priceCOP - discAmt;
    return { ...i, priceCOP, costCOP, discAmt, netCOP };
  });
  const subtotal   = items.reduce((s, i) => s + Number(i.qty) * i.priceCOP, 0);
  const totalDisc  = items.reduce((s, i) => s + Number(i.qty) * i.discAmt,  0);
  const totalCost  = items.reduce((s, i) => s + Number(i.qty) * i.costCOP,  0);
  const netSub     = subtotal - totalDisc;
  const taxAmt     = netSub * ((q.tax||0) / 100);
  const totalSale  = netSub + taxAmt;
  const profit     = totalSale - totalCost;
  const profitPct  = totalSale > 0 ? Math.round((profit / totalSale) * 100) : 0;
  return { ...q, items, subtotal, totalDisc, discountAmt: totalDisc, taxAmt, total: totalSale, totalCost, profit, profitPct };
};

// ── COTIZACIONES ─────────────────────────────────────────────────
const QuotesView = ({ quotes, setQuotes, clients, products, config }) => {
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
      status: "Pendiente", notes: config?.defaultNotes||"", discount: 0, tax: 19, trm: 4200, items: [], currency: "COP",
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
          onSave={save} onClose={()=>setModal(null)} isNew={modal==="new"} config={config} />
      )}
      {modal === "view" && current && (
        <QuotePreview quote={current} onClose={()=>setModal(null)} onEdit={()=>setModal("edit")} config={config} />
      )}
    </div>
  );
};

// ── QUOTE FORM ───────────────────────────────────────────────────
const QuoteForm = ({ quote, setQuote, clients, products, onSave, onClose, isNew, config }) => {
  const [prodSearch, setProdSearch] = useState("");

  const set = (k, v) => setQuote(q => recalc({ ...q, [k]: v }));

  const addItem = (prod) => {
    const item = { id: Date.now(), productId: prod.id, sku: prod.sku,
                   name: prod.name, qty: 1, price: prod.price, cost: prod.cost||0,
                   currency: prod.currency||"COP", unit: prod.unit };
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
        <Field label="IVA (%)">
          <input type="number" min={0} value={quote.tax}
            onChange={e=>setQuote(q=>recalc({...q,tax:Number(e.target.value)}))} />
        </Field>
        <Field label="TRM (USD → COP)" style={{ gridColumn:"1/-1" }}>
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <input type="number" min={1} value={quote.trm||4200}
              onChange={e=>setQuote(q=>recalc({...q,trm:Number(e.target.value)}))}
              style={{ maxWidth:180 }} />
            <div style={{ background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",
                          borderRadius:6,padding:"7px 14px",fontSize:12,color:G.muted,flex:1 }}>
              💡 Solo aplica a productos marcados en USD. Los productos en COP no se afectan.
            </div>
          </div>
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
              <span style={{ marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:10,
                             background: p.currency==="USD"?"rgba(245,158,11,.15)":"rgba(16,185,129,.15)",
                             color: p.currency==="USD"?G.warn:G.success,fontWeight:700 }}>
                {p.currency||"COP"}
              </span>
              <span style={{ marginLeft:6,color:G.muted }}>{fmtCur(p.price, p.currency||"COP")}/{p.unit}</span>
            </button>
          ))}
          {!filtProd.length && <span style={{ color:G.muted,fontSize:12 }}>Sin coincidencias.</span>}
        </div>
      </div>

      <Card style={{ padding:0,overflow:"hidden",marginBottom:18 }}>
        <table>
          <thead><tr>
            <th>SKU</th><th>Descripción</th><th style={{width:55}}>Mon.</th>
            <th style={{width:65}}>Qty</th><th style={{width:120}}>P. Unitario</th>
            <th style={{width:80}}>Dto%</th>
            <th>Total COP</th>
            <th style={{background:"rgba(16,185,129,.08)",color:G.success}}>Utilidad</th>
            <th></th>
          </tr></thead>
          <tbody>
            {quote.items.map(item=>{
              const lineNetCOP   = Number(item.qty) * (item.netCOP||item.priceCOP||Number(item.price));
              const lineCostCOP  = Number(item.qty) * (item.costCOP||Number(item.cost||0));
              const lineProfit   = lineNetCOP - lineCostCOP;
              const linePct      = lineNetCOP > 0 ? Math.round((lineProfit/lineNetCOP)*100) : 0;
              return (
              <tr key={item.id}>
                <td style={{ fontFamily:G.mono,fontSize:12,color:G.accent,whiteSpace:"nowrap" }}>{item.sku}</td>
                <td>
                  <input value={item.name} onChange={e=>updateItem(item.id,"name",e.target.value)}
                    style={{ padding:"4px 8px" }} />
                </td>
                <td>
                  <span style={{ fontSize:11,padding:"2px 7px",borderRadius:10,fontWeight:700,
                                 background: item.currency==="USD"?"rgba(245,158,11,.15)":"rgba(16,185,129,.15)",
                                 color: item.currency==="USD"?G.warn:G.success }}>
                    {item.currency||"COP"}
                  </span>
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
                <td>
                  <input type="number" min={0} max={100} value={item.discount||0}
                    onChange={e=>updateItem(item.id,"discount",e.target.value)}
                    style={{ padding:"4px 8px" }}
                    placeholder="0" />
                </td>
                <td style={{ fontFamily:G.mono,fontWeight:600,whiteSpace:"nowrap" }}>
                  {fmt(Number(item.qty) * (item.netCOP||item.priceCOP||Number(item.price)))}
                </td>
                <td style={{ background:"rgba(16,185,129,.04)" }}>
                  <div style={{ fontFamily:G.mono,fontSize:12,color:lineProfit>=0?G.success:G.danger }}>
                    {fmt(lineProfit)}
                  </div>
                  <div style={{ fontSize:10,color:G.muted }}>{linePct}% GM</div>
                </td>
                <td>
                  <button onClick={()=>removeItem(item.id)}
                    style={{ background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:18,lineHeight:1 }}>✕</button>
                </td>
              </tr>
              );
            })}
            {!quote.items.length && (
              <tr><td colSpan={9} style={{ textAlign:"center",color:G.muted,padding:24,fontStyle:"italic" }}>
                Agrega productos del catálogo de arriba.
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <div style={{ display:"flex",gap:14,justifyContent:"flex-end",marginBottom:18 }}>
        {/* Panel de utilidad — solo visible aquí, no se imprime */}
        <div style={{ width:240,background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",
                      borderRadius:8,padding:14 }}>
          <p style={{ color:G.success,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:10 }}>
            🔒 Utilidad (solo tú ves esto)
          </p>
          {[["Costo total",fmt(quote.totalCost||0)],
            ["Venta neta",fmt((quote.subtotal||0)-(quote.totalDisc||0))],
            ["Utilidad bruta",fmt(quote.profit||0)]].map(([l,v])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",
                                   padding:"4px 0",borderBottom:`1px solid rgba(16,185,129,.15)`,fontSize:12 }}>
              <span style={{ color:G.muted }}>{l}</span>
              <span style={{ fontFamily:G.mono,color:G.success }}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex",justifyContent:"space-between",padding:"8px 0 0",fontWeight:700 }}>
            <span style={{ color:G.success }}>GM Total</span>
            <span style={{ fontFamily:G.mono,color:G.success,fontSize:18 }}>{quote.profitPct||0}%</span>
          </div>
        </div>
        <div style={{ width:290,background:G.surface,borderRadius:8,padding:14 }}>
          {[["Subtotal bruto", fmt(quote.subtotal||0), G.text],
            ...(quote.totalDisc>0 ? [[`- Descuentos`, `-${fmt(quote.totalDisc||0)}`, G.danger]] : []),
            [`+ IVA (${quote.tax}%)`, fmt(quote.taxAmt||0), G.text]].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",
                                   padding:"5px 0",borderBottom:`1px solid ${G.border}`,
                                   fontSize:12,color:G.muted }}>
              <span>{l}</span><span style={{ fontFamily:G.mono,color:c}}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontWeight:700,fontSize:15 }}>
            <span>TOTAL COP</span>
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
const QuotePreview = ({ quote, onClose, onEdit, config = {} }) => {
  const handlePrint = () => {
    const w = window.open("","_blank","width=900,height=700");
    const pc = config.primaryColor || "#0d6e6e";
    const fmtCOP = (n) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
    w.document.write(`
      <html><head><title>Cotización #${quote.number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',Arial,sans-serif;color:#1e293b;padding:36px;font-size:12.5px;line-height:1.5}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid ${pc}}
        .logo-circle{width:54px;height:54px;border-radius:50%;background:${pc};color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .company-name{font-size:20px;font-weight:700;color:${pc}}
        .badge{background:${pc}22;color:${pc};padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;display:inline-block}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
        .info-box{background:#f8fafc;padding:12px 16px;border-radius:8px;border-left:3px solid ${pc}}
        .lbl{font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:700;margin-bottom:6px;letter-spacing:.06em}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th{background:${pc};color:#fff;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
        td{padding:9px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
        tr:nth-child(even) td{background:#f8fafc}
        .total-row td{font-weight:700;font-size:14px;border-top:2px solid ${pc};color:${pc};background:#fff}
        .notes-box{background:#fffbeb;border-left:3px solid #f59e0b;padding:14px;margin-top:20px;border-radius:0 8px 8px 0;white-space:pre-line}
        .bank-box{background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 16px;border-radius:8px;margin-top:16px}
        .footer{margin-top:36px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;color:#94a3b8;font-size:10px}
        code{font-family:monospace;color:${pc};font-size:11px}
      </style></head><body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:14px">
            ${config.logoUrl
              ? `<img src="${config.logoUrl}" alt="logo" style="height:60px;object-fit:contain">`
              : `<div class="logo-circle">${(config.companyName||"C")[0]}</div>`}
            <div>
              <div class="company-name">${config.companyName||"Mi Empresa"}</div>
              <div style="color:#64748b;font-size:12px">${config.slogan||""}</div>
              ${config.website?`<div style="color:${pc};font-size:11px">${config.website}</div>`:""}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:24px;font-weight:700;color:${pc};letter-spacing:-.02em">COTIZACIÓN</div>
            <div style="font-size:15px;color:#475569;font-weight:600">N° ${quote.number}</div>
            <div style="margin:4px 0"><span class="badge">${quote.status}</span></div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="lbl">Señor(a)</div>
            <strong style="font-size:14px">${quote.clientName}</strong>
            <div style="color:#64748b">${quote.clientContact||""}</div>
            <div style="color:#64748b">${quote.clientEmail||""}</div>
          </div>
          <div class="info-box">
            <div class="lbl">Vendedor</div>
            <strong>${config.vendorName||""}</strong>
            <div style="color:#64748b">${config.vendorPhone||""}</div>
            <div style="color:#64748b">${config.vendorEmail||""}</div>
            <div style="margin-top:8px;font-size:11px;color:#94a3b8">
              Fecha: <strong style="color:#1e293b">${quote.date}</strong> &nbsp;|&nbsp;
              Válida hasta: <strong style="color:#1e293b">${quote.validUntil}</strong>
            </div>
          </div>
        </div>

        <table>
          <thead><tr><th>#</th><th>Ref.</th><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:right">P. Unitario</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>
            ${quote.items.map((it,i)=>{
              const priceCOP  = it.priceCOP || Number(it.price);
              const disc      = Number(it.discount)||0;
              const discAmt   = priceCOP * disc / 100;
              const netCOP    = priceCOP - discAmt;
              const totalLine = Number(it.qty) * netCOP;
              return `<tr>
                <td style="color:#94a3b8">${i+1}</td>
                <td><code>${it.sku}</code></td>
                <td>${it.name}</td>
                <td style="text-align:center">${it.qty} ${it.unit||""}</td>
                <td style="text-align:right">${fmtCOP(priceCOP)}${disc>0?` <span style="color:#ef4444;font-size:10px">-${disc}%</span>`:""}</td>
                <td style="text-align:right;font-weight:600">${fmtCOP(totalLine)}</td>
              </tr>`;
            }).join("")}
          </tbody>
          <tfoot>
            <tr><td colspan="5" style="text-align:right;color:#64748b;padding:8px 12px">SubTotal</td><td style="text-align:right;padding:8px 12px">${fmtCOP(quote.subtotal||0)}</td></tr>
            ${(quote.totalDisc>0)?`<tr><td colspan="5" style="text-align:right;color:#ef4444;padding:6px 12px">- Descuentos</td><td style="text-align:right;color:#ef4444;padding:6px 12px">-${fmtCOP(quote.totalDisc||0)}</td></tr>`:""}
            <tr><td colspan="5" style="text-align:right;color:#64748b;padding:6px 12px">IVA (${quote.tax}%)</td><td style="text-align:right;padding:6px 12px">${fmtCOP(quote.taxAmt||0)}</td></tr>
            <tr class="total-row"><td colspan="5" style="text-align:right;padding:10px 12px">TOTAL</td><td style="text-align:right;padding:10px 12px;font-size:15px">${fmtCOP(quote.total||0)}</td></tr>
          </tfoot>
        </table>

        ${quote.notes?`<div class="notes-box">${quote.notes}</div>`:""}

        ${(config.bankName||config.bankAccount)?`
        <div class="bank-box">
          <div class="lbl" style="color:#16a34a">Datos para Consignación</div>
          <div>Consignar a nombre de: <strong>${config.accountHolder||config.companyName}</strong></div>
          <div>NIT: <strong>${config.nit||""}</strong></div>
          <div>Cuenta ${config.bankType} ${config.bankName}: <strong>${config.bankAccount}</strong></div>
        </div>`:""}

        <div class="footer">
          <span>${config.companyName||"QuoteApp"} · ${config.nit||""}</span>
          <span>Cotización válida hasta ${quote.validUntil} · Página 1 de 1</span>
        </div>
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
  const blank = () => ({ id:Date.now(),sku:"",name:"",category:"Servicios",cost:0,margin:40,price:0,unit:"pza" });
  const calcPrice = (cost, margin) => margin >= 100 ? 0 : Math.round((cost / (1 - margin/100)) * 100) / 100;
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
          <thead><tr><th>SKU</th><th>Producto / Servicio</th><th>Categoría</th><th>Moneda</th><th>Costo</th><th>Margen</th><th>P. Venta</th><th>Unidad</th><th></th></tr></thead>
          <tbody>
            {filt.map(p=>(
              <tr key={p.id}>
                <td style={{ fontFamily:G.mono,color:G.accent,fontSize:12 }}>{p.sku}</td>
                <td><strong>{p.name}</strong></td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td>
                  <span style={{ fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:700,
                                 background: p.currency==="USD"?"rgba(245,158,11,.15)":"rgba(16,185,129,.15)",
                                 color: p.currency==="USD"?G.warn:G.success }}>
                    {p.currency||"COP"}
                  </span>
                </td>
                <td style={{ fontFamily:G.mono,color:G.muted }}>{fmtCur(p.cost||0,p.currency||"COP")}</td>
                <td><span className="badge badge-warn">{p.margin||0}%</span></td>
                <td style={{ fontFamily:G.mono,fontWeight:700,color:G.success }}>{fmtCur(p.price,p.currency||"COP")}</td>
                <td style={{ color:G.muted }}>{p.unit}</td>
                <td>
                  <div style={{ display:"flex",gap:6 }}>
                    <Btn size="sm" variant="outline" onClick={()=>openEdit(p)}>Editar</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>remove(p.id)}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {!filt.length && <tr><td colSpan={9} style={{ textAlign:"center",color:G.muted,padding:24 }}>Sin productos.</td></tr>}
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
            <Field label="Moneda del Producto">
              <select value={cur.currency||"COP"} onChange={e=>setCur({...cur,currency:e.target.value})}>
                <option value="COP">COP — Peso Colombiano</option>
                <option value="USD">USD — Dólar Americano</option>
              </select>
            </Field>
            <Field label={`Costo (${cur.currency||"COP"})`}>
              <input type="number" min={0} step={0.01} value={cur.cost||0}
                onChange={e=>{const cost=Number(e.target.value);setCur({...cur,cost,price:calcPrice(cost,cur.margin||0)});}} />
            </Field>
            <Field label="Gross Margin (%)">
              <select value={cur.margin||0} onChange={e=>{const margin=Number(e.target.value);setCur({...cur,margin,price:calcPrice(cur.cost||0,margin)});}}>
                {[10,15,20,25,30,35,40,45,50,55,60,65,70].map(m=><option key={m} value={m}>{m}%</option>)}
              </select>
            </Field>
            <Field label="Precio de Venta Sugerido (MXN)" style={{ gridColumn:"1/-1" }}>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                <input type="number" min={0} step={0.01} value={cur.price||0}
                  onChange={e=>setCur({...cur,price:Number(e.target.value)})}
                  style={{ flex:1 }} />
                <div style={{ background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",
                              borderRadius:6,padding:"7px 14px",whiteSpace:"nowrap",color:G.success,fontWeight:700,fontSize:13 }}>
                  GM real: {cur.price>0?Math.round((1-(cur.cost||0)/cur.price)*100):0}%
                </div>
              </div>
              <p style={{ color:G.muted,fontSize:11,marginTop:4 }}>Puedes ajustar el precio manualmente. El GM real se actualizará.</p>
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

// ── CONFIGURACIÓN ────────────────────────────────────────────────
const ConfigView = ({ config, setConfig }) => {
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Section = ({ title, children }) => (
    <Card style={{ marginBottom:20 }}>
      <p style={{ fontWeight:700,fontSize:14,marginBottom:16,color:G.accentH,
                  borderBottom:`1px solid ${G.border}`,paddingBottom:10 }}>{title}</p>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>{children}</div>
    </Card>
  );

  return (
    <div style={{ padding:30,maxWidth:860 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>Mi Empresa</h1>
          <p style={{ color:G.muted }}>Estos datos aparecerán en todas tus cotizaciones impresas</p>
        </div>
        <Btn variant="success" onClick={handleSave}>{saved ? "✅ Guardado!" : "💾 Guardar Cambios"}</Btn>
      </div>

      <Section title="🏢 Datos de la Empresa">
        <Field label="Nombre de la Empresa" style={{ gridColumn:"1/-1" }}>
          <input value={config.companyName} onChange={e=>set("companyName",e.target.value)} placeholder="Casa Inteligente" />
        </Field>
        <Field label="Slogan / Descripción">
          <input value={config.slogan} onChange={e=>set("slogan",e.target.value)} placeholder="Todo bajo control" />
        </Field>
        <Field label="NIT / RUT">
          <input value={config.nit} onChange={e=>set("nit",e.target.value)} placeholder="900.000.000-1" />
        </Field>
        <Field label="Sitio Web" style={{ gridColumn:"1/-1" }}>
          <input value={config.website} onChange={e=>set("website",e.target.value)} placeholder="www.miempresa.com" />
        </Field>
        <Field label="Color Principal">
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <input type="color" value={config.primaryColor} onChange={e=>set("primaryColor",e.target.value)}
              style={{ width:48,height:36,padding:2,cursor:"pointer" }} />
            <input value={config.primaryColor} onChange={e=>set("primaryColor",e.target.value)}
              style={{ flex:1 }} placeholder="#0d6e6e" />
          </div>
        </Field>
        <Field label="URL del Logo (opcional)">
          <input value={config.logoUrl} onChange={e=>set("logoUrl",e.target.value)} placeholder="https://miempresa.com/logo.png" />
        </Field>
      </Section>

      <Section title="👤 Datos del Vendedor">
        <Field label="Nombre del Vendedor" style={{ gridColumn:"1/-1" }}>
          <input value={config.vendorName} onChange={e=>set("vendorName",e.target.value)} placeholder="Jorge Mejia Jaramillo" />
        </Field>
        <Field label="Teléfono">
          <input value={config.vendorPhone} onChange={e=>set("vendorPhone",e.target.value)} placeholder="3182854896" />
        </Field>
        <Field label="Email">
          <input value={config.vendorEmail} onChange={e=>set("vendorEmail",e.target.value)} placeholder="correo@empresa.com" />
        </Field>
      </Section>

      <Section title="🏦 Datos Bancarios">
        <Field label="Nombre del Titular" style={{ gridColumn:"1/-1" }}>
          <input value={config.accountHolder} onChange={e=>set("accountHolder",e.target.value)} placeholder="Nombre o Razón Social" />
        </Field>
        <Field label="Banco">
          <input value={config.bankName} onChange={e=>set("bankName",e.target.value)} placeholder="Bancolombia" />
        </Field>
        <Field label="Tipo de Cuenta">
          <select value={config.bankType} onChange={e=>set("bankType",e.target.value)}>
            {["Ahorros","Corriente"].map(t=><option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Número de Cuenta" style={{ gridColumn:"1/-1" }}>
          <input value={config.bankAccount} onChange={e=>set("bankAccount",e.target.value)} placeholder="000.000.000.00" />
        </Field>
      </Section>

      <Card style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700,fontSize:14,marginBottom:16,color:G.accentH,
                    borderBottom:`1px solid ${G.border}`,paddingBottom:10 }}>📝 Notas por Defecto</p>
        <p style={{ color:G.muted,fontSize:12,marginBottom:10 }}>
          Estas notas aparecerán automáticamente al crear una nueva cotización. Puedes editarlas por cotización.
        </p>
        <textarea rows={6} value={config.defaultNotes} onChange={e=>set("defaultNotes",e.target.value)}
          placeholder="Condiciones de pago, validez, términos…"
          style={{ width:"100%",resize:"vertical" }} />
      </Card>

      {/* Preview */}
      <Card>
        <p style={{ fontWeight:700,fontSize:14,marginBottom:16,color:G.accentH,
                    borderBottom:`1px solid ${G.border}`,paddingBottom:10 }}>👁️ Vista Previa del Encabezado</p>
        <div style={{ background:"#fff",borderRadius:8,padding:20,color:"#111" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div style={{ display:"flex",alignItems:"center",gap:14 }}>
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="logo" style={{ height:60,objectFit:"contain" }} />
              ) : (
                <div style={{ width:60,height:60,borderRadius:"50%",background:config.primaryColor,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              color:"#fff",fontSize:24,fontWeight:700 }}>
                  {config.companyName?.[0]||"C"}
                </div>
              )}
              <div>
                <p style={{ fontWeight:700,fontSize:18,color:config.primaryColor }}>{config.companyName||"Mi Empresa"}</p>
                <p style={{ color:"#64748b",fontSize:12 }}>{config.slogan}</p>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontWeight:700,fontSize:20,color:config.primaryColor }}>COTIZACIÓN</p>
              <p style={{ color:"#64748b",fontSize:12 }}>{config.vendorName}</p>
              <p style={{ color:"#64748b",fontSize:12 }}>{config.vendorPhone}</p>
              <p style={{ color:"#64748b",fontSize:12 }}>{config.vendorEmail}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [quotes, setQuotes]     = usePersisted("qa_quotes",   []);
  const [clients, setClients]   = usePersisted("qa_clients",  INIT_CLIENTS);
  const [products, setProducts] = usePersisted("qa_products", INIT_PRODUCTS);
  const [config, setConfig]     = usePersisted("qa_config",   INIT_CONFIG);

  return (
    <>
      <style>{css}</style>
      <div style={{ display:"flex",minHeight:"100vh" }}>
        <Sidebar view={view} setView={setView} />
        <main style={{ flex:1,overflowY:"auto" }}>
          {view==="dashboard" && <Dashboard quotes={quotes} clients={clients} products={products} />}
          {view==="quotes"    && <QuotesView quotes={quotes} setQuotes={setQuotes} clients={clients} products={products} config={config} />}
          {view==="clients"   && <ClientsView clients={clients} setClients={setClients} />}
          {view==="products"  && <ProductsView products={products} setProducts={setProducts} />}
          {view==="config"    && <ConfigView config={config} setConfig={setConfig} />}
        </main>
      </div>
    </>
  );
}
