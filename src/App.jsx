import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client ───────────────────────────────────────────────

const SUPA_URL = "https://sivewzjtgyylnpsdpwwd.supabase.co";
const SUPA_KEY = "sb_publishable__0KaY2d7V8AHFtaSy7JHAw_UGKb3Zsa";
const sb = createClient(SUPA_URL, SUPA_KEY);

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

// ── Quote counter (en memoria, se sincroniza con Supabase) ──────
let quoteCounter = 1001;

// Normalize quote fields from Supabase snake_case to camelCase
const normalizeQuote = (q) => ({
  ...q,
  items:         q.items||[],
  clientName:    q.client_name    || q.clientName    || "",
  clientEmail:   q.client_email   || q.clientEmail   || "",
  clientContact: q.client_contact || q.clientContact || "",
  clientId:      q.client_id      || q.clientId      || null,
  validUntil:    q.valid_until    || q.validUntil    || "",
  totalDisc:     q.total_disc     || q.totalDisc     || 0,
  taxAmt:        q.tax_amt        || q.taxAmt        || 0,
  totalCost:     q.total_cost     || q.totalCost     || 0,
  profitPct:     q.profit_pct     || q.profitPct     || 0,
  version:       q.version        || 1,
  parentId:      q.parent_id      || null,
  isLatest:      q.is_latest      !== false,
});

// ── Helpers ──────────────────────────────────────────────────────
const fmtInput = (n) => n ? new Intl.NumberFormat("es-CO",{maximumFractionDigits:0}).format(n) : "";
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
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
input[type=number]{-moz-appearance:textfield}
table{border-collapse:collapse;width:100%}
.qa-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
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

// ── NumInput: input numérico con separadores de miles ───────────
const NumInput = ({ value, onChange, placeholder="", style={} }) => {
  const fmt = (n) => n ? new Intl.NumberFormat("es-CO",{maximumFractionDigits:2}).format(n) : "";
  const [display, setDisplay] = useState(fmt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(fmt(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={focused ? display : fmt(value)}
      onFocus={() => { setFocused(true); setDisplay(value ? String(value) : ""); }}
      onBlur={() => {
        setFocused(false);
        const raw = String(display).replace(/[.]/g,"").replace(/[,]/g,".").replace(/[^0-9.]/g,"");
        const num = parseFloat(raw)||0;
        setDisplay(fmt(num));
        onChange(num);
      }}
      onChange={e => {
        // Allow typing: digits, dots, commas
        const raw = e.target.value.replace(/[^0-9.,]/g,"");
        setDisplay(raw);
      }}
      placeholder={placeholder}
      style={{ padding:"4px 8px",width:"100%",fontFamily:"'JetBrains Mono',monospace",
               textAlign:"right",...style }}
    />
  );
};

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

const Modal = ({ title, onClose, children, width = 680 }) => {
  const isFullScreen = width >= 1200;
  if (isFullScreen) {
    return (
      <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,
                    background:G.card,zIndex:1000,display:"flex",flexDirection:"column" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"12px 24px",borderBottom:`1px solid ${G.border}`,
                      background:G.surface,flexShrink:0 }}>
          <span style={{ fontWeight:700,fontSize:16 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:G.muted,
                                             fontSize:22,cursor:"pointer",lineHeight:1 }}>✕</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>{children}</div>
      </div>
    );
  }
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",
                  display:"flex",alignItems:"flex-end",justifyContent:"center",
                  zIndex:1000,padding:0 }}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:G.card,border:`1px solid ${G.border}`,
                    borderRadius:"12px 12px 0 0",
                    width:"100%",maxWidth:width,
                    maxHeight:"95vh",overflow:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"16px 20px",borderBottom:`1px solid ${G.border}`,
                      position:"sticky",top:0,background:G.card,zIndex:1 }}>
          <span style={{ fontWeight:700,fontSize:15 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:G.muted,
                                             fontSize:22,cursor:"pointer",lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:"16px 20px" }}>{children}</div>
      </div>
    </div>
  );
};

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
  { id:"dashboard",   label:"Dashboard",    icon:"⬛" },
  { id:"quotes",      label:"Cotizaciones", icon:"📋" },
  { id:"clients",     label:"Clientes",     icon:"👥" },
  { id:"products",    label:"Catálogo",     icon:"📦" },
  { id:"categories",  label:"Categorías",   icon:"🏷️" },
  { id:"suppliers",   label:"Proveedores",  icon:"🏭" },
  { id:"payments",    label:"Cuentas Cobro", icon:"🧾" },
  { id:"config",      label:"Mi Empresa",   icon:"⚙️" },
];

const Sidebar = ({ view, setView, user, logout }) => (
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
    <div style={{ padding:"10px 14px",borderTop:`1px solid ${G.border}`,background:G.surface }}>
      <div style={{ fontSize:11,color:G.muted,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.email}</div>
      <button onClick={logout} style={{ fontSize:11,color:G.danger,background:"none",border:"none",cursor:"pointer",padding:0 }}>
        Cerrar sesión
      </button>
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
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastOfMonth  = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo,   setDateTo]   = useState(lastOfMonth);

  // Only latest versions
  const latestQuotes = quotes.filter(q => q.isLatest !== false);

  // Filter by date range
  const inRange = latestQuotes.filter(q => {
    const d = q.date || "";
    return d >= dateFrom && d <= dateTo;
  });

  const approvedInRange  = inRange.filter(q => q.status === "Aprobada");
  const approvedTotal    = approvedInRange.reduce((s,q) => s+(q.total||0), 0);
  const pendingInRange   = inRange.filter(q => q.status === "Pendiente" || q.status === "Enviada");
  const pendingTotal     = pendingInRange.reduce((s,q) => s+(q.total||0), 0);

  const monthName = now.toLocaleString("es-CO", { month:"long", year:"numeric" });

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Dashboard</h1>
          <p style={{ color:G.muted,fontSize:13 }}>Resumen del período seleccionado</p>
        </div>
        {/* Filtro de fechas */}
        <Card style={{ padding:"10px 14px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
          <span style={{ fontSize:12,color:G.muted,fontWeight:600 }}>📅 Período:</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ width:140,padding:"5px 8px",fontSize:12 }} />
          <span style={{ color:G.muted }}>—</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ width:140,padding:"5px 8px",fontSize:12 }} />
          <button onClick={()=>{ setDateFrom(firstOfMonth); setDateTo(lastOfMonth); }}
            style={{ fontSize:11,color:G.accent,background:"none",border:"none",cursor:"pointer",
                     fontFamily:G.font,padding:"4px 8px",borderRadius:4,
                     background:"rgba(59,130,246,.1)" }}>
            Este mes
          </button>
        </Card>
      </div>

      {/* KPIs del período */}
      <div style={{ display:"flex",gap:16,marginBottom:24,flexWrap:"wrap" }}>
        <StatCard label="Aprobadas — Valor" value={fmt(approvedTotal)} icon="✅" color={G.success} />
        <StatCard label="Aprobadas — Cant." value={approvedInRange.length} icon="🏆" color={G.success} />
        <StatCard label="En Proceso — Valor" value={fmt(pendingTotal)} icon="⏳" color={G.warn} />
        <StatCard label="Clientes Totales" value={clients.length} icon="👥" color={G.accent} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20 }}>
        <Card>
          <p style={{ fontWeight:700,marginBottom:14 }}>Cotizaciones Recientes</p>
          {latestQuotes.slice(0,6).map(q => (
            <div key={q.id} style={{ display:"flex",justifyContent:"space-between",
                                     padding:"8px 0",borderBottom:`1px solid ${G.border}` }}>
              <div>
                <span style={{ fontFamily:G.mono,fontSize:12,color:G.accent }}>#{q.number}</span>
                <span style={{ marginLeft:8,fontSize:13 }}>{q.clientName||q.client_name}</span>
              </div>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                <span style={{ color:G.muted,fontSize:12 }}>{fmt(q.total||0)}</span>
                <StatusBadge s={q.status} />
              </div>
            </div>
          ))}
          {!latestQuotes.length && <p style={{ color:G.muted }}>Sin cotizaciones aún.</p>}
        </Card>

        <Card>
          <p style={{ fontWeight:700,marginBottom:14 }}>Estado — Período Seleccionado</p>
          {[["Pendiente","warn"],["Enviada","blue"],["Aprobada","green"],["Rechazada","red"]].map(([s,c])=>{
            const cnt = inRange.filter(q=>q.status===s).length;
            const pct = inRange.length ? Math.round(cnt/inRange.length*100) : 0;
            const val = inRange.filter(q=>q.status===s).reduce((sum,q)=>sum+(q.total||0),0);
            return (
              <div key={s} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12 }}>{s} ({cnt})</span>
                  <span style={{ fontSize:12,color:G.muted }}>{fmt(val)}</span>
                </div>
                <div style={{ background:G.border,borderRadius:4,height:6 }}>
                  <div style={{ width:`${pct}%`,height:6,borderRadius:4,
                                background: c==="green"?G.success:c==="red"?G.danger:c==="warn"?G.warn:G.accent,
                                transition:".4s" }} />
                </div>
              </div>
            );
          })}
          {!inRange.length && <p style={{ color:G.muted,fontSize:12 }}>Sin cotizaciones en este período.</p>}
        </Card>
      </div>
    </div>
  );
};

// ── HELPER: subtotal por sección ────────────────────────────────
// Retorna un Map: headerId -> subtotal (lineNet) de los ítems bajo ese encabezado
const sectionSubtotals = (items) => {
  const map = {};
  let currentHeader = "__root__";
  for (const i of items) {
    if (i.type === "header") { currentHeader = i.id; map[i.id] = 0; }
    else { map[currentHeader] = (map[currentHeader]||0) + (i.lineNet||0); }
  }
  return map;
};

// ── RECALCULAR TOTALES ────────────────────────────────────────────
const recalc = (q) => {
  const trm = Number(q.trm) || 1;
  const items = q.items.map(i => {
    if (i.type === "header") return i;
    const priceCOP = i.currency === "USD" ? Number(i.price) * trm : Number(i.price);
    const costCOP  = i.currency === "USD" ? Number(i.cost||0) * trm : Number(i.cost||0);
    const discAmt  = priceCOP * ((Number(i.discount)||0) / 100);
    const netCOP   = priceCOP - discAmt;
    const itemTax  = i.tax !== undefined ? Number(i.tax) : 19;
    const taxAmt   = netCOP * (itemTax / 100);
    const lineNet  = Number(i.qty) * netCOP;
    const lineTax  = Number(i.qty) * taxAmt;
    return { ...i, priceCOP, costCOP, discAmt, netCOP, itemTax, taxAmt, lineNet, lineTax };
  });
  const prods     = items.filter(i=>i.type!=="header");
  const subtotal  = prods.reduce((s,i) => s + Number(i.qty)*i.priceCOP, 0);
  const totalDisc = prods.reduce((s,i) => s + Number(i.qty)*i.discAmt,  0);
  const totalTax  = prods.reduce((s,i) => s + (i.lineTax||0), 0);
  const totalCost = prods.reduce((s,i) => s + Number(i.qty)*i.costCOP,  0);
  // Split taxable vs non-taxable (after discount)
  const subtotalConIva   = prods.filter(i=>i.itemTax>0).reduce((s,i)=>s+Number(i.qty)*i.netCOP, 0);
  const subtotalSinIva   = prods.filter(i=>i.itemTax===0).reduce((s,i)=>s+Number(i.qty)*i.netCOP, 0);
  const totalSale    = subtotalConIva + totalTax + subtotalSinIva;
  const ventaNeta    = subtotalConIva + subtotalSinIva; // sin IVA — base para GM%
  const profit       = ventaNeta - totalCost;
  const profitPct    = ventaNeta > 0 ? Math.round((profit / ventaNeta) * 100) : 0;
  return { ...q, items, subtotal, totalDisc, discountAmt: totalDisc, taxAmt: totalTax,
           subtotalConIva, subtotalSinIva, total: totalSale, totalCost, profit, profitPct, ventaNeta };
};

// ── COTIZACIONES ─────────────────────────────────────────────────
const QuotesView = ({ quotes, setQuotes, saveQuote, deleteQuote, createRevision, clients, products, config, paymentRequests, savePaymentRequest }) => {
  const [paymentQuote, setPaymentQuote] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const [modal, setModal] = useState(null);
  const [current, setCurrent] = useState(null);

  // Auto-save draft when editing quote
  useEffect(() => {
    try {
      if (current && (modal === "new" || modal === "edit")) {
        localStorage.setItem("qa_draft_quote", JSON.stringify(current));
      }
    } catch {}
  }, [current]);

  // Listen for new quote from client view
  useEffect(() => {
    const handler = (e) => {
      const c = e.detail;
      const num = quoteCounter++;
      setCurrent(recalc({
        id: Date.now(), number: num,
        date: today(), validUntil: addDays(today(), 30),
        clientId: c.id, clientName: c.name,
        clientContact: c.contact, clientEmail: c.email, clientRut: c.rfc||"",
        status: "Pendiente", notes: config?.defaultNotes||"",
        discount: 0, tax: 19, trm: 4200, items: [], currency: "COP",
      }));
      setModal("new");
    };
    document.addEventListener("newQuoteForClient", handler);
    return () => document.removeEventListener("newQuoteForClient", handler);
  }, [config]);

  const clearQuoteDraft = () => {
    try { localStorage.removeItem("qa_draft_quote"); localStorage.removeItem("qa_draft_quote_modal"); } catch {}
  };

  const openNew = () => {
    const draft = localStorage.getItem("qa_draft_quote");
    if (draft) { try { setCurrent(JSON.parse(draft)); } catch { setCurrent(null); } }
    else {
      const c0 = clients[0];
      const num = quoteCounter++;
      setCurrent(recalc({
        id: Date.now(), number: num,
        date: today(), validUntil: addDays(today(), 30),
        clientId: c0?.id || null,
        clientName: c0?.name || "",
        clientContact: c0?.contact || "",
        clientEmail: c0?.email || "",
        status: "Pendiente", notes: config?.defaultNotes||"", discount: 0, tax: 19, trm: 4200, items: [], currency: "COP",
      }));
    }
    setModal("new");
  };

  const openEdit = (q) => { clearQuoteDraft(); setCurrent({ ...q }); setModal("edit"); };
  const openView = (q) => { setCurrent({ ...q }); setModal("view"); };

  const openRevision = async (q) => {
    const newQ = await createRevision(q);
    setCurrent(newQ);
    setModal("new");
  };

  const save = async () => {
    await saveQuote(current);
    clearQuoteDraft();
    setModal(null);
  };

  const remove = async (id) => {
    if (window.confirm("¿Eliminar cotización?")) await deleteQuote(id);
  };

  const filtered = quotes.filter(q => {
    const srch = search.toLowerCase();
    const name = (q.clientName || q.client_name || "").toLowerCase();
    const status = (q.status || "").toLowerCase();
    const matchesSearch = name.includes(srch) || String(q.number||"").includes(srch) || status.includes(srch);
    const matchesStatus = filterStatus === "Todos" || (q.status||"") === filterStatus;
    // Si se busca por número, mostrar todas las versiones; si no, solo la última
    const isSearchingByNumber = srch && /^\d+$/.test(srch.trim());
    const showVersion = isSearchingByNumber ? true : (q.isLatest !== false);
    return matchesSearch && matchesStatus && showVersion;
  });

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>
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

      <div style={{ overflowX:"auto" }}>
        <Card style={{ padding:0,overflow:"visible",minWidth:750 }}>
          <table style={{ minWidth:750 }}>
            <thead><tr>
              <th># / Ver.</th><th>Cliente</th><th>Fecha</th><th>Válida hasta</th>
              <th>Total</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} style={{ opacity: q.isLatest===false ? 0.5 : 1 }}>
                  <td>
                    <span style={{ fontFamily:G.mono,color:G.accent,fontWeight:600 }}>#{q.number}</span>
                    {(q.version||1) > 1 && (
                      <span style={{ marginLeft:6,fontSize:10,background:"rgba(245,158,11,.15)",
                                     color:G.warn,padding:"1px 6px",borderRadius:10,fontWeight:700 }}>
                        v{q.version}
                      </span>
                    )}
                    {q.isLatest===false && (
                      <span style={{ marginLeft:4,fontSize:10,color:G.muted }}>(anterior)</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight:500 }}>{q.clientName||q.client_name}</div>
                    <div style={{ color:G.muted,fontSize:12 }}>{q.clientEmail||q.client_email}</div>
                  </td>
                  <td style={{ color:G.muted }}>{q.date}</td>
                  <td style={{ color:G.muted }}>{q.validUntil||q.valid_until}</td>
                  <td style={{ fontWeight:700,fontFamily:G.mono }}>{fmt(q.total||0)}</td>
                  <td><StatusBadge s={q.status} /></td>
                  <td>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      <Btn size="sm" variant="ghost" onClick={()=>openView(q)}>Ver</Btn>
                      {q.isLatest!==false && <Btn size="sm" variant="outline" onClick={()=>openEdit(q)}>Editar</Btn>}
                      {q.isLatest!==false && (
                        <Btn size="sm" variant="outline" onClick={()=>openRevision(q)}
                          style={{ color:G.warn,borderColor:G.warn }}>
                          {q.status==="Aprobada" ? "＋ Adicionales" : "Nueva v."}
                        </Btn>
                      )}
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
      </div>

      {(modal === "new" || modal === "edit") && current && localStorage.getItem("qa_draft_quote") && (
        <div style={{ background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",
                      borderRadius:8,padding:"8px 14px",marginBottom:12,fontSize:12,color:G.warn,
                      display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span>📝 Borrador recuperado — tus cambios se guardaron automáticamente</span>
        </div>
      )}
      {(modal === "new" || modal === "edit") && current && (
        <QuoteForm quote={current} setQuote={setCurrent} clients={clients} products={products}
          onSave={save} onClose={()=>{ clearQuoteDraft(); setModal(null); }} isNew={modal==="new"} config={config} />
      )}
      {modal === "view" && current && (
        <QuotePreview quote={current} onClose={()=>setModal(null)} onEdit={()=>setModal("edit")} config={config}
          onCreatePayment={()=>{ setModal(null); setPaymentQuote(current); }} />
      )}
      {paymentQuote && (
        <PaymentRequestModal quote={paymentQuote} config={config} clients={clients}
          paymentRequests={paymentRequests}
          onSave={async (pr)=>{ await savePaymentRequest(pr); setPaymentQuote(null); }}
          onClose={()=>setPaymentQuote(null)} />
      )}
    </div>
  );
};

// ── QUOTE FORM ───────────────────────────────────────────────────
const QuoteForm = ({ quote, setQuote, clients, products, onSave, onClose, isNew, config }) => {
  const [prodSearch, setProdSearch] = useState("");
  const [uploading, setUploading]   = useState(null); // item id being uploaded

  const set = (k, v) => setQuote(q => recalc({ ...q, [k]: v }));

  const addItem = (prod) => {
    const gmPct = prod.price > 0 ? Math.round((1-(prod.cost||0)/prod.price)*100) : (prod.margin||0);
    const item = { id: Date.now(), productId: prod.id, sku: prod.sku,
                   name: prod.name, qty: 1, price: prod.price, cost: prod.cost||0,
                   currency: prod.currency||"COP", unit: prod.unit,
                   discount: 0, tax: prod.tax !== undefined ? prod.tax : 19,
                   imageUrl: prod.imageUrl || prod.image_url || "",
                   gmPct };
    setQuote(q => recalc({ ...q, items: [...q.items, item] }));
  };

  // ── Línea libre (producto manual) ──
  const addFreeItem = () => {
    const item = { id: Date.now(), productId: null, sku: "", name: "", qty: 1,
                   price: 0, cost: 0, currency: "COP", unit: "pza",
                   discount: 0, tax: 19, imageUrl: "", isFree: true, gmPct: 0 };
    setQuote(q => recalc({ ...q, items: [...q.items, item] }));
  };

  // ── Subir imagen a Supabase Storage ──
  const uploadImage = async (itemId, file) => {
    const allowed = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","image/svg+xml"];
    if (!allowed.includes(file.type)) { alert("Formato no soportado. Usa JPG, PNG, GIF, WEBP o SVG."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("La imagen no puede pesar más de 5MB."); return; }
    setUploading(itemId);
    try {
      const ext  = file.name.split(".").pop();
      const path = `quotes/${Date.now()}-${itemId}.${ext}`;
      const { error } = await sb.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = sb.storage.from("product-images").getPublicUrl(path);
      setQuote(q => recalc({ ...q, items: q.items.map(i => i.id===itemId ? { ...i, imageUrl: data.publicUrl } : i) }));
    } catch(e) { alert("Error subiendo imagen: " + e.message); }
    setUploading(null);
  };

  const updateItem = (id, k, v) =>
    setQuote(q => recalc({ ...q, items: q.items.map(i => i.id===id ? { ...i, [k]: Number(v)||v } : i) }));

  const removeItem = (id) =>
    setQuote(q => recalc({ ...q, items: q.items.filter(i => i.id !== id) }));

  const selectClient = (id) => {
    const c = clients.find(c => String(c.id) === String(id));
    if (c) setQuote(q => ({ ...q, clientId: c.id, clientName: c.name,
                             clientContact: c.contact, clientEmail: c.email,
                             clientRut: c.rfc||"" }));
  };

  const filtProd = products.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(prodSearch.toLowerCase()));

  return (
    <Modal title={isNew ? (quote.version>1 ? `Nueva Revisión v${quote.version} — #${quote.number}` : "Nueva Cotización") : `Editar Cotización #${quote.number}${(quote.version||1)>1?' v'+quote.version:''}`}
           onClose={onClose} width={1400}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20 }}>
        <Field label="Cliente">
          <select value={String(quote.clientId||"")} onChange={e=>selectClient(e.target.value)}>
            <option value="">— Seleccionar cliente —</option>
            {clients.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
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

      {/* Botón para agregar encabezado de sección */}
      <div style={{ display:"flex",gap:8,marginBottom:8 }}>
        <button onClick={()=>setQuote(q=>({...q,items:[...q.items,{id:Date.now(),type:"header",name:"Nueva Sección"}]}))}
          style={{ background:"rgba(59,130,246,.1)",border:`1px solid ${G.accent}`,color:G.accent,
                   borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:12,fontFamily:G.font,fontWeight:600 }}>
          + Encabezado de Sección
        </button>
        <button onClick={addFreeItem}
          style={{ background:"rgba(245,158,11,.1)",border:`1px solid ${G.warn}`,color:G.warn,
                   borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:12,fontFamily:G.font,fontWeight:600 }}>
          + Línea Libre
        </button>
      </div>

      <div style={{ overflowX:"auto" }}><Card style={{ padding:0,overflow:"visible",marginBottom:18 }}>
        <table style={{ minWidth:1300 }}>
          <thead><tr>
            <th style={{width:44}}>Img</th>
            <th style={{width:90}}>SKU</th><th>Descripción</th><th style={{width:55}}>Mon.</th>
            <th style={{width:140}}>Costo</th>
            <th style={{width:75}}>GM%</th>
            <th style={{width:65}}>Qty</th><th style={{width:155}}>P. Unitario</th>
            <th style={{width:80}}>Dto%</th>
            <th style={{width:100}}>IVA%</th>
            <th style={{width:150}}>Subtotal</th>
            <th style={{width:120,background:"rgba(16,185,129,.08)",color:G.success}}>Utilidad</th>
            <th style={{width:36}}></th>
          </tr></thead>
          <tbody>
            {(() => {
              const secTotals = sectionSubtotals(quote.items);
              const rows = [];
              quote.items.forEach((item, idx) => {
                const nextItem = quote.items[idx+1];
                const isLastInSection = !nextItem || nextItem.type === "header";

                if (item.type === "header") {
                  // ── Fila de ENCABEZADO ──
                  rows.push(
                    <tr key={item.id}>
                      <td colSpan={13} style={{ padding:"6px 8px",background:"rgba(59,130,246,.08)",
                                                borderTop:`2px solid ${G.accent}` }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <span style={{ color:G.accent,fontWeight:700,fontSize:13 }}>▸</span>
                          <input value={item.name}
                            onChange={e=>setQuote(q=>({...q,items:q.items.map(i=>i.id===item.id?{...i,name:e.target.value}:i)}))}
                            style={{ fontWeight:700,fontSize:13,color:G.accent,background:"transparent",
                                     border:"none",outline:"none",flex:1,padding:"2px 4px" }} />
                          <button onClick={()=>setQuote(q=>({...q,items:q.items.filter(i=>i.id!==item.id)}))}
                            style={{ background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:16 }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  // ── Fila de PRODUCTO ──
                  const lineNet     = Number(item.qty) * (item.netCOP||item.priceCOP||Number(item.price));
                  const lineCostCOP = Number(item.qty) * (item.costCOP||Number(item.cost||0));
                  const lineProfit  = lineNet - lineCostCOP;
                  const linePct     = lineNet > 0 ? Math.round((lineProfit/lineNet)*100) : 0;
                  rows.push(
                    <tr key={item.id}>
                      <td style={{ padding:"4px",textAlign:"center",width:44 }}>
                        <label style={{ cursor:"pointer",display:"block" }}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" style={{ width:36,height:36,objectFit:"cover",borderRadius:4,border:`1px solid ${G.border}` }} />
                          ) : (
                            <div style={{ width:36,height:36,borderRadius:4,border:`1px dashed ${G.border}`,
                                          display:"flex",alignItems:"center",justifyContent:"center",
                                          fontSize:16,color:G.muted,margin:"auto" }}>
                              {uploading===item.id ? "..." : "📷"}
                            </div>
                          )}
                          <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                            style={{ display:"none" }}
                            onChange={e=>e.target.files[0] && uploadImage(item.id, e.target.files[0])} />
                        </label>
                      </td>
                      <td style={{ fontFamily:G.mono,fontSize:12,color:G.accent,whiteSpace:"nowrap" }}>
                        {item.isFree ? (
                          <input value={item.sku||""} onChange={e=>setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,sku:e.target.value}:i)}))}
                            placeholder="SKU" style={{ padding:"4px 6px",width:70,fontFamily:G.mono,fontSize:12,color:G.accent }} />
                        ) : item.sku}
                      </td>
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
                      {/* Costo — siempre en moneda original del producto */}
                      <td>
                        <NumInput value={item.cost||0}
                          onChange={cost=>{
                            const price = Number(item.price||0);
                            const gm = price>0?Math.round((1-cost/price)*100):0;
                            setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,cost,gmPct:gm}:i)}));
                          }} placeholder="0" />
                      </td>
                      {/* GM% — calcula precio en moneda original */}
                      <td>
                        <input type="number" min={0} max={99}
                          value={item.gmPct !== undefined ? (item.gmPct||"") :
                            (() => {
                              const p = Number(item.price||1);
                              const c = Number(item.cost||0);
                              return p>0&&c>0 ? Math.round((1-c/p)*100)||"" : "";
                            })()
                          }
                          onChange={e=>{
                            const gm = e.target.value===""?0:Number(e.target.value);
                            const cost = Number(item.cost||0); // en moneda original
                            const newPrice = gm<100&&cost>0 ? Math.round(cost/(1-gm/100)) : Number(item.price||0);
                            setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,gmPct:gm,price:newPrice}:i)}));
                          }}
                          style={{ padding:"4px 8px",width:"100%" }} placeholder="%" />
                      </td>
                      <td style={{ textAlign:"center" }}>
                        <input type="number" min={1} value={item.qty}
                          onChange={e=>updateItem(item.id,"qty",e.target.value)}
                          style={{ padding:"4px 6px",width:"60px",textAlign:"center",
                                   fontWeight:700,fontSize:14,color:G.text }} />
                      </td>
                      <td>
                        <NumInput value={item.price||0}
                          onChange={price=>{
                            const cost = Number(item.cost||0);
                            const gm = price>0?Math.round((1-cost/price)*100):0;
                            setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,price,gmPct:gm}:i)}));
                          }} />
                        {item.currency==="USD" && item.priceCOP>0 && (
                          <div style={{ fontSize:9,color:G.muted,textAlign:"right",
                                        fontFamily:G.mono,paddingRight:4,marginTop:2 }}>
                            ={fmt(item.priceCOP)} COP
                          </div>
                        )}
                      </td>
                      <td>
                        <input type="number" min={0} max={100} value={item.discount||0}
                          onChange={e=>updateItem(item.id,"discount",e.target.value)}
                          style={{ padding:"4px 8px" }} placeholder="0" />
                      </td>
                      <td>
                        <select value={item.tax !== undefined ? item.tax : 19}
                          onChange={e=>updateItem(item.id,"tax",Number(e.target.value))}
                          style={{ padding:"4px 8px",fontSize:13,width:"100%",fontWeight:600 }}>
                          {[0,5,8,19].map(t=><option key={t} value={t}>{t}%</option>)}
                        </select>
                      </td>
                      <td style={{ fontFamily:G.mono,fontWeight:600,whiteSpace:"nowrap" }}>
                        {fmt(lineNet)}
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
                  // ── Fila de SUBTOTAL DE SECCIÓN ──
                  let sectionId = "__root__";
                  for (let k = idx; k >= 0; k--) {
                    if (quote.items[k].type === "header") { sectionId = quote.items[k].id; break; }
                  }
                  if (sectionId !== "__root__" && isLastInSection && secTotals[sectionId] > 0) {
                    rows.push(
                      <tr key={`subtotal-${sectionId}`}>
                        <td colSpan={10} style={{ textAlign:"right",padding:"6px 12px",
                                                 background:"rgba(59,130,246,.05)",
                                                 color:G.muted,fontSize:12,fontStyle:"italic" }}>
                          Subtotal sección
                        </td>
                        <td style={{ fontFamily:G.mono,fontWeight:700,color:G.accent,
                                     background:"rgba(59,130,246,.05)",padding:"6px 12px",
                                     whiteSpace:"nowrap" }}>
                          {fmt(secTotals[sectionId])}
                        </td>
                        <td colSpan={2} style={{ background:"rgba(59,130,246,.05)" }} />
                      </tr>
                    );
                  }
                }
              });
              if (!quote.items.length) {
                rows.push(
                  <tr key="empty"><td colSpan={13} style={{ textAlign:"center",color:G.muted,padding:24,fontStyle:"italic" }}>
                    Agrega productos del catálogo de arriba.
                  </td></tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </Card></div>

      <div style={{ display:"flex",gap:14,justifyContent:"flex-end",marginBottom:18 }}>
        {/* Panel de utilidad — solo visible aquí, no se imprime */}
        <div style={{ width:240,background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",
                      borderRadius:8,padding:14 }}>
          <p style={{ color:G.success,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:10 }}>
            🔒 Utilidad (solo tú ves esto)
          </p>
          {[["Costo total",fmt(quote.totalCost||0)],
            ["Venta neta (sin IVA)",fmt(quote.ventaNeta||(quote.subtotalConIva||0)+(quote.subtotalSinIva||0))],
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
          {(() => {
            const hasSinIva = (quote.subtotalSinIva||0) > 0;
            const hasConIva = (quote.subtotalConIva||0) > 0;
            const rows = [
              ...(!hasConIva && !hasSinIva ? [["Subtotal", fmt(quote.subtotal||0), G.text]] : []),
              ...(hasConIva ? [["Subtotal con IVA", fmt(quote.subtotalConIva||0), G.text]] : []),
              ...(quote.totalDisc>0 ? [[`- Descuentos`, `-${fmt(quote.totalDisc||0)}`, G.danger]] : []),
              ...(quote.taxAmt>0 ? [[`+ IVA`, fmt(quote.taxAmt||0), G.text]] : []),
              ...(hasSinIva ? [["Subtotal sin IVA", fmt(quote.subtotalSinIva||0), G.muted]] : []),
            ];
            return rows.map(([l,v,c])=>(
              <div key={l} style={{ display:"flex",justifyContent:"space-between",
                                     padding:"5px 0",borderBottom:`1px solid ${G.border}`,
                                     fontSize:12,color:G.muted }}>
                <span>{l}</span><span style={{ fontFamily:G.mono,color:c}}>{v}</span>
              </div>
            ));
          })()}
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
const QuotePreview = ({ quote, onClose, onEdit, config = {}, onCreatePayment = null }) => {
  const handlePrint = () => {
    const w = window.open("","_blank","width=900,height=700");
    const pc = config.primaryColor || "#0d6e6e";
    const fmtCOP = (n) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
    w.document.write(`
      <html><head><title>Cotización #${quote.number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',Arial,sans-serif;color:#1e293b;padding:20px 28px;font-size:10px;line-height:1.4}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;padding-bottom:10px;border-bottom:2px solid ${pc}}
        .logo-circle{width:38px;height:38px;border-radius:50%;background:${pc};color:#fff;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .company-name{font-size:13px;font-weight:700;color:${pc}}
        .badge{background:${pc}22;color:${pc};padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;display:inline-block}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
        .info-box{background:#f8fafc;padding:6px 10px;border-radius:6px;border-left:2px solid ${pc}}
        .lbl{font-size:8px;text-transform:uppercase;color:#94a3b8;font-weight:700;margin-bottom:3px;letter-spacing:.06em}
        table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10px}
        th{background:${pc};color:#fff;padding:5px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.05em}
        td{padding:5px 8px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
        tr:nth-child(even) td{background:#f8fafc}
        .total-row td{font-weight:700;font-size:11px;border-top:2px solid ${pc};color:${pc};background:#fff}
        .notes-box{background:#fffbeb;border-left:2px solid #f59e0b;padding:8px 10px;margin-top:10px;border-radius:0 6px 6px 0;white-space:pre-line;font-size:9px}
        .bank-box{background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 12px;border-radius:6px;margin-top:8px;font-size:9px}
        .footer{margin-top:14px;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;color:#94a3b8;font-size:8px}
        code{font-family:monospace;color:${pc};font-size:9px}
      </style></head><body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:14px">
            ${config.logoUrl
              ? `<img src="${config.logoUrl}" alt="logo" style="height:40px;object-fit:contain">`
              : `<div class="logo-circle">${(config.companyName||"C")[0]}</div>`}
            <div>
              <div class="company-name">${config.companyName||"Mi Empresa"}</div>
              <div style="color:#64748b;font-size:12px">${config.slogan||""}</div>
              ${config.website?`<div style="color:${pc};font-size:11px">${config.website}</div>`:""}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:16px;font-weight:700;color:${pc};letter-spacing:-.02em">COTIZACIÓN</div>
            <div style="font-size:12px;color:#475569;font-weight:600">N° ${quote.number}</div>
            <div style="margin:2px 0"><span class="badge">${quote.status}</span></div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="lbl">Señor(a)</div>
            <strong style="font-size:11px">${quote.clientName}</strong>
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
          <thead><tr><th style="width:36px">Img</th><th>Ref.</th><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:right">P. Unitario</th><th style="text-align:right">Subtotal</th></tr></thead>
          <tbody>
            ${(()=>{
              // compute section subtotals for PDF
              const secMap = {};
              let curHdr = "__root__";
              for (const i of quote.items) {
                if (i.type==="header") { curHdr=i.id; secMap[i.id]=0; }
                else {
                  const p = i.priceCOP||Number(i.price);
                  const d = p*(Number(i.discount)||0)/100;
                  secMap[curHdr] = (secMap[curHdr]||0) + Number(i.qty)*(p-d);
                }
              }
              return quote.items.map((it,i)=>{
                const nextIt = quote.items[i+1];
                const isLast = !nextIt || nextIt.type==="header";
                if (it.type === "header") {
                  return `<tr><td colspan="5" style="background:${pc}18;color:${pc};font-weight:700;font-size:13px;padding:8px 12px;border-top:2px solid ${pc}">▸ ${it.name}</td></tr>`;
                }
                const priceCOP = it.priceCOP || Number(it.price);
                const disc     = Number(it.discount)||0;
                const discAmt  = priceCOP * disc / 100;
                const netCOP   = priceCOP - discAmt;
                const lineNet  = Number(it.qty) * netCOP;
                let sectionId  = "__root__";
                for (let k=i; k>=0; k--) { if(quote.items[k].type==="header"){sectionId=quote.items[k].id;break;} }
                const subtotalRow = (sectionId!=="__root__" && isLast && secMap[sectionId]>0)
                  ? `<tr style="background:${pc}08"><td colspan="5" style="text-align:right;color:#64748b;font-style:italic;padding:5px 12px">Subtotal sección</td><td style="text-align:right;font-weight:700;color:${pc};padding:5px 12px">${fmtCOP(secMap[sectionId])}</td></tr>`
                  : "";
                const imgCell = it.imageUrl
                  ? `<td style="width:36px;padding:2px"><img src="${it.imageUrl}" style="width:32px;height:32px;object-fit:cover;border-radius:3px;border:1px solid #e2e8f0" crossorigin="anonymous"></td>`
                  : `<td style="width:36px"></td>`;
                return `<tr>
                  ${imgCell}
                  <td><code>${it.sku||""}</code></td>
                  <td>${it.name}${disc>0?` <span style="color:#ef4444;font-size:10px">(-${disc}%)</span>`:""}</td>
                  <td style="text-align:center">${it.qty} ${it.unit||""}</td>
                  <td style="text-align:right">${fmtCOP(netCOP)}</td>
                  <td style="text-align:right;font-weight:600">${fmtCOP(lineNet)}</td>
                </tr>${subtotalRow}`;
              }).join("");
            })()}
          </tbody>
          <tfoot>
            ${(quote.subtotalConIva>0)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:8px 12px">Subtotal con IVA</td><td style="text-align:right;padding:8px 12px">${fmtCOP(quote.subtotalConIva||0)}</td></tr>`:""}
            ${(!quote.subtotalConIva&&!quote.subtotalSinIva)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:8px 12px">SubTotal</td><td style="text-align:right;padding:8px 12px">${fmtCOP(quote.subtotal||0)}</td></tr>`:""}
            ${(quote.totalDisc>0)?`<tr><td colspan="6" style="text-align:right;color:#ef4444;padding:6px 12px">- Descuentos</td><td style="text-align:right;color:#ef4444;padding:6px 12px">-${fmtCOP(quote.totalDisc||0)}</td></tr>`:""}
            ${(quote.taxAmt>0)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:6px 12px">IVA</td><td style="text-align:right;padding:6px 12px">${fmtCOP(quote.taxAmt||0)}</td></tr>`:""}
            ${(quote.subtotalSinIva>0)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:6px 12px">Subtotal sin IVA</td><td style="text-align:right;padding:6px 12px">${fmtCOP(quote.subtotalSinIva||0)}</td></tr>`:""}
            <tr class="total-row"><td colspan="6" style="text-align:right;padding:10px 12px">TOTAL</td><td style="text-align:right;padding:10px 12px;font-size:15px">${fmtCOP(quote.total||0)}</td></tr>
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
    // Wait for all images to load before printing
    w.addEventListener("load", () => {
      const imgs = w.document.querySelectorAll("img");
      if (!imgs.length) { setTimeout(()=>w.print(), 300); return; }
      let loaded = 0;
      const tryPrint = () => { loaded++; if (loaded >= imgs.length) setTimeout(()=>w.print(), 300); };
      imgs.forEach(img => {
        if (img.complete) { tryPrint(); }
        else { img.onload = tryPrint; img.onerror = tryPrint; }
      });
      // Fallback: print after 3 seconds regardless
      setTimeout(()=>w.print(), 3000);
    });
  };

  const safeItems = quote.items || [];
  const safeQuote = {...quote, items: safeItems};
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
          <thead><tr><th>Ref.</th><th>Descripción</th><th style={{textAlign:"center"}}>Cant.</th><th style={{textAlign:"right"}}>P. Unit.</th><th style={{textAlign:"right"}}>Subtotal</th></tr></thead>
          <tbody>
            {(() => {
              const secTotals = sectionSubtotals(safeItems);
              const rows = [];
              safeItems.forEach((it, idx) => {
                const nextItem = safeItems[idx+1];
                const isLastInSection = !nextItem || nextItem.type === "header";
                if (it.type==="header") {
                  rows.push(
                    <tr key={it.id}>
                      <td colSpan={5} style={{ fontWeight:700,fontSize:13,color:G.accent,
                                               background:"rgba(59,130,246,.08)",padding:"8px 14px",
                                               borderTop:`2px solid ${G.accent}` }}>
                        ▸ {it.name}
                      </td>
                    </tr>
                  );
                  return;
                }
                const priceCOP = it.priceCOP||Number(it.price);
                const discAmt  = priceCOP * ((Number(it.discount)||0)/100);
                const netCOP   = priceCOP - discAmt;
                const lineNet  = Number(it.qty) * netCOP;
                rows.push(
                  <tr key={it.id}>
                    <td style={{ fontFamily:G.mono,fontSize:11,color:G.accent }}>{it.sku}</td>
                    <td>
                      {it.name}
                      {Number(it.discount)>0 && <span style={{fontSize:10,color:G.danger,marginLeft:6}}>-{it.discount}%</span>}
                    </td>
                    <td style={{ textAlign:"center",fontFamily:G.mono }}>{it.qty} {it.unit}</td>
                    <td style={{ textAlign:"right",fontFamily:G.mono }}>{fmt(netCOP)}</td>
                    <td style={{ textAlign:"right",fontFamily:G.mono,fontWeight:700 }}>{fmt(lineNet)}</td>
                  </tr>
                );
                // Subtotal de sección en preview
                let sectionId = "__root__";
                for (let k = idx; k >= 0; k--) {
                  if (safeItems[k].type === "header") { sectionId = safeItems[k].id; break; }
                }
                if (sectionId !== "__root__" && isLastInSection && secTotals[sectionId] > 0) {
                  rows.push(
                    <tr key={`st-${sectionId}`}>
                      <td colSpan={4} style={{ textAlign:"right",padding:"5px 12px",
                                               background:"rgba(59,130,246,.05)",
                                               color:G.muted,fontSize:12,fontStyle:"italic" }}>
                        Subtotal sección
                      </td>
                      <td style={{ textAlign:"right",fontFamily:G.mono,fontWeight:700,
                                   color:G.accent,background:"rgba(59,130,246,.05)",padding:"5px 12px" }}>
                        {fmt(secTotals[sectionId])}
                      </td>
                    </tr>
                  );
                }
              });
              return rows;
            })()}
            {!safeItems.filter(i=>i.type!=="header").length && <tr><td colSpan={5} style={{ textAlign:"center",color:G.muted,padding:16 }}>Sin ítems.</td></tr>}
          </tbody>
        </table>
      </Card>

      <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:16 }}>
        <div style={{ width:280,background:G.surface,borderRadius:8,padding:14 }}>
          {(() => {
            const hasSinIva = (quote.subtotalSinIva||0) > 0;
            const hasConIva = (quote.subtotalConIva||0) > 0;
            const rows = [
              ...(!hasConIva && !hasSinIva ? [["Subtotal", fmt(quote.subtotal||0), G.text]] : []),
              ...(hasConIva ? [["Subtotal con IVA", fmt(quote.subtotalConIva||0), G.text]] : []),
              ...(quote.totalDisc>0?[[`- Descuentos`,`-${fmt(quote.totalDisc||0)}`,G.danger]]:[]),
              ...(quote.taxAmt>0?[[`+ IVA`,fmt(quote.taxAmt||0),G.text]]:[]),
              ...(hasSinIva ? [["Subtotal sin IVA", fmt(quote.subtotalSinIva||0), G.muted]] : []),
            ];
            return rows.map(([l,v,c])=>(
              <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",
                                     borderBottom:`1px solid ${G.border}`,fontSize:12,color:G.muted }}>
                <span>{l}</span><span style={{ fontFamily:G.mono,color:c }}>{v}</span>
              </div>
            ));
          })()}
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

      <div style={{ display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap" }}>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn variant="outline" onClick={onEdit}>✏️ Editar</Btn>
        {onCreatePayment && <Btn variant="outline" onClick={onCreatePayment} style={{color:G.success,borderColor:G.success}}>🧾 Cuenta de Cobro</Btn>}
        <Btn variant="primary" onClick={handlePrint}>🖨️ Imprimir / PDF</Btn>
      </div>
    </Modal>
  );
};

// ── CLIENTES ─────────────────────────────────────────────────────
const ClientsView = ({ clients, setClients, saveClient, deleteClient, onNewQuoteForClient }) => {
  const [modal, setModal] = useState(false);
  const [cur, setCur] = useState(null);
  const [search, setSearch] = useState("");

  const blank = () => ({ id:Date.now(),name:"",contact:"",email:"",phone:"",rfc:"",building:"",address:"" });
  const openNew = () => { setCur(blank()); setModal(true); };
  const openEdit = (c) => { setCur({...c}); setModal(true); };
  const isExisting = cur && clients.some(c=>c.id===cur.id);
  const save = async () => { await saveClient(cur); setModal(false); };
  const remove = async (id) => {
    if(window.confirm("¿Eliminar cliente?")) await deleteClient(id);
  };

  const srch = search.toLowerCase();
  const filt = clients.filter(c =>
    (c.name||"").toLowerCase().includes(srch) ||
    (c.contact||"").toLowerCase().includes(srch) ||
    (c.email||"").toLowerCase().includes(srch) ||
    (c.building||"").toLowerCase().includes(srch)
  );

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>Clientes</h1>
          <p style={{ color:G.muted }}>{clients.length} cliente(s) registrado(s)</p>
        </div>
        <Btn onClick={openNew}>+ Nuevo Cliente</Btn>
      </div>
      <Card style={{ marginBottom:16 }}>
        <input placeholder="Buscar por empresa, contacto, email o edificio…"
          value={search} onChange={e=>setSearch(e.target.value)} />
      </Card>
      <div style={{ overflowX:"auto" }}><Card style={{ padding:0,overflow:"visible" }}>
        <table style={{ minWidth:900 }}>
          <thead><tr>
            <th>Empresa</th><th>Contacto</th><th>Edificio / Conjunto</th>
            <th>Email</th><th>Teléfono</th><th>RUT / CC</th><th></th>
          </tr></thead>
          <tbody>
            {filt.map(c=>(
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.contact}</td>
                <td style={{ color:G.muted,fontSize:12 }}>{c.building}</td>
                <td style={{ color:G.muted }}>{c.email}</td>
                <td style={{ fontFamily:G.mono,fontSize:12 }}>{c.phone}</td>
                <td style={{ fontFamily:G.mono,fontSize:12,color:G.accent }}>{c.rfc}</td>
                <td>
                  <div style={{ display:"flex",gap:6 }}>
                    {onNewQuoteForClient && (
                      <Btn size="sm" variant="success" onClick={()=>onNewQuoteForClient(c)}
                        style={{ whiteSpace:"nowrap" }}>📋 Cotizar</Btn>
                    )}
                    <Btn size="sm" variant="outline" onClick={()=>openEdit(c)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>remove(c.id)}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {!filt.length && <tr><td colSpan={7} style={{ textAlign:"center",color:G.muted,padding:24 }}>Sin clientes registrados.</td></tr>}
          </tbody>
        </table>
      </Card></div>

      {modal && cur && (
        <Modal title={isExisting?"Editar Cliente":"Nuevo Cliente"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <Field label="Empresa / Nombre"><input value={cur.name||""} onChange={e=>setCur({...cur,name:e.target.value})} placeholder="Nombre de la empresa o persona" /></Field>
            <Field label="Contacto"><input value={cur.contact||""} onChange={e=>setCur({...cur,contact:e.target.value})} placeholder="Nombre del contacto" /></Field>
            <Field label="Email"><input type="email" value={cur.email||""} onChange={e=>setCur({...cur,email:e.target.value})} placeholder="correo@empresa.com" /></Field>
            <Field label="Teléfono"><input value={cur.phone||""} onChange={e=>setCur({...cur,phone:e.target.value})} placeholder="300 000 0000" /></Field>
            <Field label="RUT / CC"><input value={cur.rfc||""} onChange={e=>setCur({...cur,rfc:e.target.value})} placeholder="NIT o Cédula" /></Field>
            <Field label="Teléfono Alternativo / Ext."><input value={cur.phone2||""} onChange={e=>setCur({...cur,phone2:e.target.value})} placeholder="Opcional" /></Field>
            <Field label="Edificio / Conjunto Residencial" style={{ gridColumn:"1/-1" }}>
              <input value={cur.building||""} onChange={e=>setCur({...cur,building:e.target.value})} placeholder="Ej: Torre Norte, Conjunto Los Pinos" />
            </Field>
            <Field label="Dirección" style={{ gridColumn:"1/-1" }}>
              <input value={cur.address||""} onChange={e=>setCur({...cur,address:e.target.value})} placeholder="Calle, Carrera, Avenida…" />
            </Field>
          </div>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
            {onNewQuoteForClient && isExisting && (
              <Btn variant="outline" onClick={()=>{ setModal(false); onNewQuoteForClient(cur); }}
                style={{ color:G.success,borderColor:G.success }}>
                📋 Nueva Cotización
              </Btn>
            )}
            <Btn variant="success" onClick={save}>💾 Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── CATÁLOGO ─────────────────────────────────────────────────────
const ProductsView = ({ products, setProducts, saveProduct, deleteProduct, categories = [], saveCategory, deleteCategory, suppliers = [] }) => {
  const [modal, setModal] = useState(false);
  const [cur, setCur] = useState(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todos");
  const [uploadingImg, setUploadingImg] = useState(false);

  const cats = ["Todos", ...categories.map(c=>c.name)];
  const blank = () => ({ id:Date.now(),sku:"",name:"",category:"Servicios",cost:0,margin:30,price:0,unit:"pza",imageUrl:"" });

  const uploadProductImage = async (file) => {
    const allowed = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","image/svg+xml"];
    if (!allowed.includes(file.type)) { alert("Formato no soportado. Usa JPG, PNG, GIF, WEBP o SVG."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("La imagen no puede pesar más de 5MB."); return; }
    setUploadingImg(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `products/${Date.now()}.${ext}`;
      const { error } = await sb.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = sb.storage.from("product-images").getPublicUrl(path);
      setCur(c => ({ ...c, imageUrl: data.publicUrl }));
    } catch(e) { alert("Error subiendo imagen: " + e.message); }
    setUploadingImg(false);
  };
  const calcPrice = (cost, margin) => margin >= 100 ? 0 : Math.round((cost / (1 - margin/100)) * 100) / 100;
  const clearDraft = () => {
    try { localStorage.removeItem("qa_draft_product"); localStorage.removeItem("qa_draft_product_modal"); } catch {}
  };
  const openNew = () => {
    const draft = localStorage.getItem("qa_draft_product");
    if (draft) { try { setCur(JSON.parse(draft)); } catch { setCur(blank()); } }
    else { setCur(blank()); }
    setModal(true);
  };
  const openEdit = (p) => { clearDraft(); setCur({...p}); setModal(true); };
  const isExisting = cur && products.some(p=>p.id===cur.id);
  const save = async () => {
    await saveProduct(cur);
    clearDraft();
    setModal(false);
  };
  const remove = async (id) => {
    if(window.confirm("¿Eliminar producto?")) await deleteProduct(id);
  };

  const filt = products.filter(p=>{
    const ok = cat==="Todos" || p.category===cat;
    return ok && (p.name.toLowerCase().includes(search.toLowerCase()) ||
                  p.sku.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>
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
      <div style={{ overflowX:"auto" }}><Card style={{ padding:0,overflow:"visible" }}>
        <table style={{ minWidth:900 }}>
          <thead><tr><th style={{width:50}}>Img</th><th>SKU</th><th>Producto / Servicio</th><th>Categoría</th><th>Moneda</th><th>Costo</th><th>Margen</th><th>P. Venta</th><th>Unidad</th><th></th></tr></thead>
          <tbody>
            {filt.map(p=>(
              <tr key={p.id}>
                <td style={{ padding:"4px 8px" }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{ width:38,height:38,objectFit:"cover",borderRadius:4,border:`1px solid ${G.border}` }} />
                    : <div style={{ width:38,height:38,borderRadius:4,background:G.surface,border:`1px dashed ${G.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:G.muted,fontSize:16 }}>📦</div>
                  }
                </td>
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
            {!filt.length && <tr><td colSpan={10} style={{ textAlign:"center",color:G.muted,padding:24 }}>Sin productos.</td></tr>}
          </tbody>
        </table>
      </Card></div>
      <div style={{display:"none"}}>
        {filt.map(p=>(
          <div key={p.id} className="qa-mobile-card">
            <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
              {/* Imagen */}
              <div style={{ flexShrink:0 }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ width:56,height:56,objectFit:"cover",borderRadius:8,border:`1px solid ${G.border}` }} />
                  : <div style={{ width:56,height:56,borderRadius:8,background:G.surface,border:`1px dashed ${G.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>📦</div>
                }
              </div>
              {/* Info */}
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:700,fontSize:15,marginBottom:2 }}>{p.name}</div>
                <div style={{ fontFamily:G.mono,fontSize:11,color:G.accent,marginBottom:4 }}>{p.sku}</div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  <span className="badge badge-blue">{p.category}</span>
                  <span style={{ fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:700,
                                 background: p.currency==="USD"?"rgba(245,158,11,.15)":"rgba(16,185,129,.15)",
                                 color: p.currency==="USD"?G.warn:G.success }}>
                    {p.currency||"COP"}
                  </span>
                </div>
              </div>
            </div>
            <div className="qa-mobile-card-row" style={{ marginTop:10 }}>
              <span className="qa-mobile-label">Precio</span>
              <span style={{ fontFamily:G.mono,fontWeight:700,color:G.success,fontSize:15 }}>
                {fmtCur(p.price,p.currency||"COP")}
              </span>
            </div>
            <div className="qa-mobile-card-row">
              <span className="qa-mobile-label">Margen</span>
              <span className="badge badge-warn">{p.margin||0}%</span>
            </div>
            <div className="qa-mobile-actions">
              <Btn size="sm" variant="outline" onClick={()=>openEdit(p)} style={{flex:1,textAlign:"center"}}>✏️ Editar</Btn>
              <Btn size="sm" variant="danger" onClick={()=>remove(p.id)}>✕</Btn>
            </div>
          </div>
        ))}
        {!filt.length && <div style={{ textAlign:"center",color:G.muted,padding:30 }}>Sin productos.</div>}
      </div>

      {modal && cur && (
        <Modal title={isExisting?"Editar Producto":"Nuevo Producto"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <Field label="SKU"><input value={cur.sku} onChange={e=>setCur({...cur,sku:e.target.value})} placeholder="HW-001" /></Field>
            <Field label="Categoría">
              <select value={cur.category} onChange={e=>setCur({...cur,category:e.target.value})}>
                {(categories.length ? categories : [{name:"Hardware"},{name:"Software"},{name:"Servicios"}])
                  .map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Nombre del Producto" style={{ gridColumn:"1/-1" }}>
              <input value={cur.name} onChange={e=>setCur({...cur,name:e.target.value})} placeholder="Descripción del producto o servicio" />
            </Field>
            <Field label="Proveedor Principal">
              <select value={cur.supplierMain||""} onChange={e=>setCur({...cur,supplierMain:e.target.value})}>
                <option value="">— Sin proveedor —</option>
                {suppliers.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Proveedor Secundario">
              <select value={cur.supplierSecondary||""} onChange={e=>setCur({...cur,supplierSecondary:e.target.value})}>
                <option value="">— Sin proveedor —</option>
                {suppliers.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
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
            <Field label="Foto del Producto (opcional)" style={{ gridColumn:"1/-1" }}>
              <div style={{ display:"flex",gap:14,alignItems:"center" }}>
                <label style={{ cursor:"pointer",flexShrink:0 }}>
                  <div style={{ width:80,height:80,borderRadius:8,border:`2px dashed ${G.border}`,
                                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                                background:G.surface,overflow:"hidden" }}>
                    {cur.imageUrl
                      ? <img src={cur.imageUrl} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                      : <span style={{ fontSize:28 }}>{uploadingImg ? "⏳" : "📷"}</span>
                    }
                  </div>
                  <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                    style={{ display:"none" }}
                    onChange={e=>e.target.files[0] && uploadProductImage(e.target.files[0])} />
                </label>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12,color:G.muted,marginBottom:6 }}>
                    Clic en el recuadro para subir una foto. Formatos: JPG, PNG, GIF, WEBP, SVG. Máx 5MB.
                  </p>
                  {cur.imageUrl && (
                    <button onClick={()=>setCur({...cur,imageUrl:""})}
                      style={{ fontSize:11,color:G.danger,background:"none",border:"none",cursor:"pointer",padding:0 }}>
                      ✕ Quitar foto
                    </button>
                  )}
                </div>
              </div>
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

// ── LOGIN VIEW ───────────────────────────────────────────────────
const LoginView = ({ onLogin }) => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState("login"); // "login" | "register"

  const handle = async () => {
    setLoading(true); setError("");
    try {
      let res;
      if (mode === "login") {
        res = await sb.auth.signInWithPassword({ email, password });
      } else {
        res = await sb.auth.signUp({ email, password });
        if (!res.error) {
          setError("✅ Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.");
          setMode("login"); setLoading(false); return;
        }
      }
      if (res.error) { setError(res.error.message); }
      else { onLogin(res.data.user); }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:380,background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:36 }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ fontFamily:G.mono,fontSize:24,fontWeight:700,color:G.accent,marginBottom:6 }}>◈ QuoteApp</div>
          <p style={{ color:G.muted,fontSize:13 }}>{mode==="login"?"Inicia sesión para continuar":"Crea tu cuenta"}</p>
        </div>
        <Field label="Email">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="correo@empresa.com" onKeyDown={e=>e.key==="Enter"&&handle()} />
        </Field>
        <Field label="Contraseña">
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()} />
        </Field>
        {error && (
          <div style={{ background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",
                        borderRadius:6,padding:"8px 12px",fontSize:12,color:error.startsWith("✅")?G.success:G.danger,
                        marginBottom:14 }}>{error}</div>
        )}
        <Btn variant="primary" onClick={handle} style={{ width:"100%",padding:"10px",marginBottom:12 }}>
          {loading ? "..." : mode==="login" ? "Iniciar Sesión" : "Crear Cuenta"}
        </Btn>
        <p style={{ textAlign:"center",fontSize:12,color:G.muted }}>
          {mode==="login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <span onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}
            style={{ color:G.accent,cursor:"pointer",fontWeight:600 }}>
            {mode==="login"?"Regístrate":"Inicia sesión"}
          </span>
        </p>
      </div>
    </div>
  );
};

// ── PAYMENT REQUEST MODAL ────────────────────────────────────────
const PaymentRequestModal = ({ quote, config, paymentRequests, onSave, onClose, clients = [] }) => {
  // Count existing payment requests for this quote to generate number
  const existing = paymentRequests.filter(p => p.quote_id === quote.id || p.quote_id === quote.parent_id);
  const prNumber = `${quote.number}-${String(existing.length + 1).padStart(2,"0")}`;

  // Look up client RUT from clients list
  const clientObj = clients.find(c => String(c.id) === String(quote.clientId || quote.client_id));
  const clientRut = quote.clientRut || quote.client_rut || clientObj?.rfc || "";

  const [pr, setPr] = useState({
    isNew: true,
    quoteId: quote.id,
    number: prNumber,
    date: new Date().toISOString().split("T")[0],
    clientName: quote.clientName || quote.client_name || "",
    clientIdNumber: clientRut,
    concept: "",
    usePercentage: true,
    percentage: 80,
    amount: Math.round((quote.total||0) * 0.8),
    accountHolder: config.accountHolder || config.companyName || "",
    nit: config.nit || "",
    bankName: config.bankName || "",
    bankAccount: config.bankAccount || "",
    bankType: config.bankType || "Ahorros",
  });

  const set = (k,v) => setPr(p => ({...p, [k]:v}));

  const updateAmount = (pct) => {
    set("percentage", pct);
    set("amount", Math.round((quote.total||0) * pct / 100));
  };

  const handlePrint = () => {
    const w = window.open("","_blank","width=800,height=600");
    const pc = config.primaryColor || "#0d6e6e";
    const fmtCOP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
    w.document.write(`
      <html><head><title>Cuenta de Cobro ${pr.number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',Arial,sans-serif;color:#1e293b;padding:50px;font-size:13px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid ${pc}}
        .logo-circle{width:54px;height:54px;border-radius:50%;background:${pc};color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .company{font-size:18px;font-weight:700;color:${pc}}
        .title{font-size:28px;font-weight:700;color:${pc};text-align:right}
        .meta{text-align:right;color:#64748b;font-size:13px;margin-top:6px}
        .senor-box{background:${pc};color:#fff;padding:6px 16px;font-weight:700;font-size:12px;display:inline-block;border-radius:4px;margin-bottom:8px}
        .vendor-box{background:${pc};color:#fff;padding:6px 16px;font-weight:700;font-size:12px;display:inline-block;border-radius:4px;margin-bottom:8px}
        .body{text-align:center;margin:40px 0}
        .client-name{font-size:24px;font-weight:700;margin-bottom:6px}
        .client-id{color:#64748b;margin-bottom:24px}
        .debe{font-size:20px;font-weight:700;margin-bottom:4px}
        .company-name{font-size:24px;font-weight:700;color:${pc};margin-bottom:4px}
        .nit{color:#64748b;margin-bottom:20px}
        .concept{font-size:15px;margin-bottom:16px;color:#475569}
        .valor-label{font-size:16px;font-weight:600;margin-bottom:8px}
        .valor{font-size:32px;font-weight:700;color:${pc}}
        .bank-box{background:#f0fdf4;border:1px solid #bbf7d0;padding:16px 24px;border-radius:8px;margin-top:30px;font-size:13px;display:inline-block;text-align:left}
        .footer{margin-top:50px;text-align:center;color:#94a3b8;font-size:10px;border-top:1px solid #e2e8f0;padding-top:14px}
      </style></head><body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:14px">
            ${config.logoUrl ? `<img src="${config.logoUrl}" style="height:60px;object-fit:contain">` : `<div class="logo-circle">${(config.companyName||"C")[0]}</div>`}
            <div>
              <div class="company">${config.companyName||""}</div>
              <div style="color:#64748b;font-size:12px">${config.slogan||""}</div>
            </div>
          </div>
          <div>
            <div class="title">Cuenta de Cobro</div>
            <div class="meta"><strong>Número:</strong> ${pr.number}</div>
            <div class="meta"><strong>Fecha:</strong> ${pr.date}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
          <div>
            <div class="senor-box">Señor@</div>
            <div style="font-size:15px;font-weight:600">${pr.clientName}</div>
            ${pr.clientIdNumber ? `<div style="color:#64748b">CC / NIT: ${pr.clientIdNumber}</div>` : ""}
          </div>
          <div style="text-align:right">
            <div class="vendor-box">Vendedor</div>
            <div style="font-weight:600">${config.vendorName||""}</div>
            <div style="color:#64748b">${config.vendorPhone||""}</div>
            <div style="color:#64748b">${config.vendorEmail||""}</div>
            ${config.website?`<div style="color:${pc}">${config.website}</div>`:""}
          </div>
        </div>

        <div class="body">
          <div class="client-name">${pr.clientName}</div>
          ${pr.clientIdNumber ? `<div class="client-id">CC ${pr.clientIdNumber}</div>` : ""}
          <div class="debe">DEBE A:</div>
          <div class="company-name">${pr.accountHolder||config.companyName}</div>
          <div class="nit">NIT ${pr.nit}</div>
          <div class="concept">${pr.concept}</div>
          <div class="valor-label">EL VALOR DE:</div>
          <div class="valor">${fmtCOP(pr.amount)}</div>
        </div>

        <div style="text-align:center">
          <div class="bank-box">
            Consignar a nombre de: <strong>${pr.accountHolder}</strong><br>
            Nit: <strong>${pr.nit}</strong><br>
            Cuenta ${pr.bankType} ${pr.bankName}: <strong>${pr.bankAccount}</strong>
          </div>
        </div>

        <div class="footer">${config.companyName||""} · ${pr.number} · ${pr.date}</div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(), 400);
  };

  return (
    <Modal title={`Nueva Cuenta de Cobro — #${pr.number}`} onClose={onClose} width={680}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20 }}>
        <Field label="Número"><input value={pr.number} onChange={e=>set("number",e.target.value)} /></Field>
        <Field label="Fecha"><input type="date" value={pr.date} onChange={e=>set("date",e.target.value)} /></Field>
        <Field label="Nombre del Cliente" style={{ gridColumn:"1/-1" }}>
          <input value={pr.clientName} onChange={e=>set("clientName",e.target.value)} />
        </Field>
        <Field label="CC / NIT del Cliente">
          <input value={pr.clientIdNumber} onChange={e=>set("clientIdNumber",e.target.value)} placeholder="CC o NIT" />
        </Field>
        <Field label="Total Cotización">
          <div style={{ padding:"7px 10px",background:G.surface,border:`1px solid ${G.border}`,borderRadius:6,
                        fontFamily:G.mono,color:G.accent,fontWeight:700 }}>
            {fmt(quote.total||0)}
          </div>
        </Field>
        <Field label="Concepto" style={{ gridColumn:"1/-1" }}>
          <textarea rows={2} value={pr.concept} onChange={e=>set("concept",e.target.value)}
            placeholder="Ej: Anticipo trabajos casa 10 Saint Regis" />
        </Field>
      </div>

      {/* Valor */}
      <Card style={{ marginBottom:16,background:G.surface }}>
        <p style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>Valor a Cobrar</p>
        <div style={{ display:"flex",gap:10,marginBottom:10 }}>
          <button onClick={()=>set("usePercentage",true)}
            style={{ flex:1,padding:"7px",borderRadius:6,cursor:"pointer",fontFamily:G.font,
                     background: pr.usePercentage?"rgba(59,130,246,.15)":"transparent",
                     border:`1px solid ${pr.usePercentage?G.accent:G.border}`,
                     color: pr.usePercentage?G.accent:G.muted,fontWeight:600 }}>
            % de la cotización
          </button>
          <button onClick={()=>set("usePercentage",false)}
            style={{ flex:1,padding:"7px",borderRadius:6,cursor:"pointer",fontFamily:G.font,
                     background: !pr.usePercentage?"rgba(59,130,246,.15)":"transparent",
                     border:`1px solid ${!pr.usePercentage?G.accent:G.border}`,
                     color: !pr.usePercentage?G.accent:G.muted,fontWeight:600 }}>
            Valor fijo
          </button>
        </div>
        {pr.usePercentage ? (
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:8 }}>
                {[10,20,30,40,50,60,70,80,90,100].map(p=>(
                  <button key={p} onClick={()=>updateAmount(p)}
                    style={{ padding:"4px 10px",borderRadius:16,cursor:"pointer",fontFamily:G.font,fontSize:12,
                             background: pr.percentage===p?"rgba(59,130,246,.15)":"transparent",
                             border:`1px solid ${pr.percentage===p?G.accent:G.border}`,
                             color: pr.percentage===p?G.accent:G.muted }}>
                    {p}%
                  </button>
                ))}
              </div>
              <input type="number" min={0} max={100} value={pr.percentage}
                onChange={e=>updateAmount(Number(e.target.value))}
                placeholder="%" style={{ width:80 }} />
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11,color:G.muted,marginBottom:2 }}>Valor calculado</div>
              <div style={{ fontFamily:G.mono,fontSize:20,fontWeight:700,color:G.accent }}>{fmt(pr.amount)}</div>
            </div>
          </div>
        ) : (
          <input type="number" min={0} value={pr.amount}
            onChange={e=>set("amount",Number(e.target.value))}
            placeholder="Valor en COP" />
        )}
      </Card>

      {/* Datos bancarios */}
      <Card style={{ marginBottom:16,background:G.surface }}>
        <p style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>Datos para Consignación</p>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <Field label="Titular" style={{ gridColumn:"1/-1" }}>
            <input value={pr.accountHolder} onChange={e=>set("accountHolder",e.target.value)} />
          </Field>
          <Field label="NIT"><input value={pr.nit} onChange={e=>set("nit",e.target.value)} /></Field>
          <Field label="Banco"><input value={pr.bankName} onChange={e=>set("bankName",e.target.value)} /></Field>
          <Field label="Tipo de Cuenta">
            <select value={pr.bankType} onChange={e=>set("bankType",e.target.value)}>
              {["Ahorros","Corriente"].map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Número de Cuenta">
            <input value={pr.bankAccount} onChange={e=>set("bankAccount",e.target.value)} />
          </Field>
        </div>
      </Card>

      <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="outline" onClick={handlePrint}>🖨️ Vista Previa / PDF</Btn>
        <Btn variant="success" onClick={async()=>{ await onSave(pr); handlePrint(); }}>💾 Guardar y Generar</Btn>
      </div>
    </Modal>
  );
};

// ── PAYMENT REQUESTS VIEW ─────────────────────────────────────────
const PaymentRequestsView = ({ paymentRequests, quotes, savePaymentRequest, deletePaymentRequest, config }) => {
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");

  const filt = paymentRequests.filter(p =>
    (p.number||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.concept||"").toLowerCase().includes(search.toLowerCase())
  );

  const getQuote = (id) => quotes.find(q => q.id === id);

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>Cuentas de Cobro</h1>
          <p style={{ color:G.muted }}>{paymentRequests.length} cuenta(s) generada(s)</p>
        </div>
      </div>

      <Card style={{ marginBottom:16 }}>
        <input placeholder="Buscar por número, cliente o concepto…" value={search}
          onChange={e=>setSearch(e.target.value)} />
      </Card>

      <div style={{ overflowX:"auto" }}>
        <Card style={{ padding:0,overflow:"visible",minWidth:700 }}>
          <table style={{ minWidth:700 }}>
            <thead><tr>
              <th>Número</th><th>Fecha</th><th>Cliente</th><th>Concepto</th><th>Valor</th><th>Cotización</th><th></th>
            </tr></thead>
            <tbody>
              {filt.map(p => {
                const q = getQuote(p.quote_id);
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily:G.mono,color:G.accent,fontWeight:600 }}>{p.number}</td>
                    <td style={{ color:G.muted }}>{p.date}</td>
                    <td><strong>{p.client_name}</strong></td>
                    <td style={{ color:G.muted,fontSize:12,maxWidth:200 }}>{p.concept}</td>
                    <td style={{ fontFamily:G.mono,fontWeight:700,color:G.success }}>{fmt(p.amount||0)}</td>
                    <td>{q ? <span style={{ fontFamily:G.mono,fontSize:12,color:G.accent }}>#{q.number}</span> : "-"}</td>
                    <td>
                      <div style={{ display:"flex",gap:6 }}>
                        <Btn size="sm" variant="ghost" onClick={()=>setModal(p)}>🖨️</Btn>
                        <Btn size="sm" variant="danger" onClick={()=>{ if(window.confirm("¿Eliminar?")) deletePaymentRequest(p.id); }}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filt.length && <tr><td colSpan={7} style={{ textAlign:"center",color:G.muted,padding:24 }}>Sin cuentas de cobro.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      {modal && (
        <PrintPaymentRequest pr={modal} config={config} onClose={()=>setModal(null)} />
      )}
    </div>
  );
};

// ── PRINT EXISTING PAYMENT REQUEST ───────────────────────────────
const PrintPaymentRequest = ({ pr, config, onClose }) => {
  useEffect(() => {
    const pc = config.primaryColor || "#0d6e6e";
    const fmtCOP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
    const w = window.open("","_blank","width=800,height=600");
    w.document.write(`
      <html><head><title>Cuenta de Cobro ${pr.number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',Arial,sans-serif;color:#1e293b;padding:50px;font-size:13px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid ${pc}}
        .logo-circle{width:54px;height:54px;border-radius:50%;background:${pc};color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .company{font-size:18px;font-weight:700;color:${pc}}
        .title{font-size:28px;font-weight:700;color:${pc};text-align:right}
        .meta{text-align:right;color:#64748b;font-size:13px;margin-top:6px}
        .senor-box{background:${pc};color:#fff;padding:6px 16px;font-weight:700;font-size:12px;display:inline-block;border-radius:4px;margin-bottom:8px}
        .vendor-box{background:${pc};color:#fff;padding:6px 16px;font-weight:700;font-size:12px;display:inline-block;border-radius:4px;margin-bottom:8px}
        .body{text-align:center;margin:40px 0}
        .client-name{font-size:24px;font-weight:700;margin-bottom:6px}
        .debe{font-size:20px;font-weight:700;margin-bottom:4px}
        .company-name{font-size:24px;font-weight:700;color:${pc};margin-bottom:4px}
        .nit{color:#64748b;margin-bottom:20px}
        .concept{font-size:15px;margin-bottom:16px;color:#475569}
        .valor-label{font-size:16px;font-weight:600;margin-bottom:8px}
        .valor{font-size:32px;font-weight:700;color:${pc}}
        .bank-box{background:#f0fdf4;border:1px solid #bbf7d0;padding:16px 24px;border-radius:8px;margin-top:30px;font-size:13px;display:inline-block;text-align:left}
        .footer{margin-top:50px;text-align:center;color:#94a3b8;font-size:10px;border-top:1px solid #e2e8f0;padding-top:14px}
      </style></head><body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:14px">
            ${config.logoUrl ? `<img src="${config.logoUrl}" style="height:60px;object-fit:contain">` : `<div class="logo-circle">${(config.companyName||"C")[0]}</div>`}
            <div><div class="company">${config.companyName||""}</div><div style="color:#64748b;font-size:12px">${config.slogan||""}</div></div>
          </div>
          <div>
            <div class="title">Cuenta de Cobro</div>
            <div class="meta"><strong>Número:</strong> ${pr.number}</div>
            <div class="meta"><strong>Fecha:</strong> ${pr.date}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
          <div>
            <div class="senor-box">Señor@</div>
            <div style="font-size:15px;font-weight:600">${pr.client_name}</div>
            ${pr.client_id_number ? `<div style="color:#64748b">CC / NIT: ${pr.client_id_number}</div>` : ""}
          </div>
          <div style="text-align:right">
            <div class="vendor-box">Vendedor</div>
            <div style="font-weight:600">${config.vendorName||""}</div>
            <div style="color:#64748b">${config.vendorPhone||""}</div>
            <div style="color:#64748b">${config.vendorEmail||""}</div>
          </div>
        </div>
        <div class="body">
          <div class="client-name">${pr.client_name}</div>
          ${pr.client_id_number ? `<div style="color:#64748b;margin-bottom:24px">CC ${pr.client_id_number}</div>` : ""}
          <div class="debe">DEBE A:</div>
          <div class="company-name">${pr.account_holder||config.companyName}</div>
          <div class="nit">NIT ${pr.nit}</div>
          <div class="concept">${pr.concept}</div>
          <div class="valor-label">EL VALOR DE:</div>
          <div class="valor">${fmtCOP(pr.amount)}</div>
        </div>
        <div style="text-align:center">
          <div class="bank-box">
            Consignar a nombre de: <strong>${pr.account_holder}</strong><br>
            Nit: <strong>${pr.nit}</strong><br>
            Cuenta ${pr.bank_type} ${pr.bank_name}: <strong>${pr.bank_account}</strong>
          </div>
        </div>
        <div class="footer">${config.companyName||""} · ${pr.number} · ${pr.date}</div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(()=>{ w.print(); onClose(); }, 400);
  }, []);
  return null;
};

// ── PROVEEDORES ──────────────────────────────────────────────────
const SuppliersView = ({ suppliers, saveSupplier, deleteSupplier }) => {
  const [newName, setNewName] = useState("");
  const [editId, setEditId]   = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving]   = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await saveSupplier({ isNew: true, name: newName.trim() });
    setNewName("");
    setSaving(false);
  };
  const startEdit = (s) => { setEditId(s.id); setEditName(s.name); };
  const saveEdit = async () => {
    if (!editName.trim()) return;
    await saveSupplier({ id: editId, name: editName.trim() });
    setEditId(null);
  };
  const remove = async (id) => {
    if (window.confirm("¿Eliminar proveedor?")) await deleteSupplier(id);
  };

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))",maxWidth:600 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:700 }}>Proveedores</h1>
        <p style={{ color:G.muted }}>Administra tus proveedores</p>
      </div>
      <Card style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700,marginBottom:12,fontSize:13 }}>Nuevo Proveedor</p>
        <div style={{ display:"flex",gap:10 }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)}
            placeholder="Nombre del proveedor…"
            onKeyDown={e=>e.key==="Enter"&&add()} style={{ flex:1 }} />
          <Btn onClick={add} variant="primary" style={{ whiteSpace:"nowrap" }}>
            {saving ? "..." : "+ Agregar"}
          </Btn>
        </div>
      </Card>
      <Card style={{ padding:0,overflow:"hidden" }}>
        {suppliers.map((s,idx) => (
          <div key={s.id} style={{ display:"flex",alignItems:"center",gap:10,
                                    padding:"12px 16px",borderBottom:idx<suppliers.length-1?`1px solid ${G.border}`:"none" }}>
            {editId === s.id ? (
              <>
                <input value={editName} onChange={e=>setEditName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveEdit()}
                  style={{ flex:1,padding:"5px 10px" }} autoFocus />
                <Btn size="sm" variant="success" onClick={saveEdit}>✓</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>setEditId(null)}>✕</Btn>
              </>
            ) : (
              <>
                <span style={{ flex:1,fontSize:14,fontWeight:500 }}>🏭 {s.name}</span>
                <Btn size="sm" variant="outline" onClick={()=>startEdit(s)}>✏️</Btn>
                <Btn size="sm" variant="danger" onClick={()=>remove(s.id)}>✕</Btn>
              </>
            )}
          </div>
        ))}
        {!suppliers.length && (
          <div style={{ padding:24,textAlign:"center",color:G.muted }}>
            Sin proveedores. Agrega el primero arriba.
          </div>
        )}
      </Card>
    </div>
  );
};

// ── CATEGORÍAS ───────────────────────────────────────────────────
const CategoriesView = ({ categories, saveCategory, deleteCategory }) => {
  const [newName, setNewName] = useState("");
  const [editId, setEditId]   = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving]   = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await saveCategory({ isNew: true, name: newName.trim() });
    setNewName("");
    setSaving(false);
  };

  const startEdit = (cat) => { setEditId(cat.id); setEditName(cat.name); };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await saveCategory({ id: editId, name: editName.trim() });
    setEditId(null);
  };

  const remove = async (id) => {
    if (window.confirm("¿Eliminar categoría? Los productos con esta categoría no se verán afectados."))
      await deleteCategory(id);
  };

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))",maxWidth:600 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:700 }}>Categorías</h1>
        <p style={{ color:G.muted }}>Administra las categorías de tus productos</p>
      </div>

      {/* Agregar nueva */}
      <Card style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700,marginBottom:12,fontSize:13 }}>Nueva Categoría</p>
        <div style={{ display:"flex",gap:10 }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)}
            placeholder="Ej: Domótica, Redes, Cámaras…"
            onKeyDown={e=>e.key==="Enter"&&add()}
            style={{ flex:1 }} />
          <Btn onClick={add} variant="primary" style={{ whiteSpace:"nowrap" }}>
            {saving ? "..." : "+ Agregar"}
          </Btn>
        </div>
      </Card>

      {/* Lista de categorías */}
      <Card style={{ padding:0,overflow:"hidden" }}>
        {categories.map((cat,idx) => (
          <div key={cat.id} style={{ display:"flex",alignItems:"center",gap:10,
                                      padding:"12px 16px",borderBottom: idx<categories.length-1?`1px solid ${G.border}`:"none" }}>
            {editId === cat.id ? (
              <>
                <input value={editName} onChange={e=>setEditName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveEdit()}
                  style={{ flex:1,padding:"5px 10px" }} autoFocus />
                <Btn size="sm" variant="success" onClick={saveEdit}>✓</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>setEditId(null)}>✕</Btn>
              </>
            ) : (
              <>
                <span style={{ flex:1,fontSize:14,fontWeight:500 }}>
                  <span style={{ marginRight:8 }}>🏷️</span>{cat.name}
                </span>
                <Btn size="sm" variant="outline" onClick={()=>startEdit(cat)}>✏️</Btn>
                <Btn size="sm" variant="danger" onClick={()=>remove(cat.id)}>✕</Btn>
              </>
            )}
          </div>
        ))}
        {!categories.length && (
          <div style={{ padding:24,textAlign:"center",color:G.muted }}>
            Sin categorías. Agrega la primera arriba.
          </div>
        )}
      </Card>
    </div>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [view, setView]         = useState("dashboard");
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const [quotes, setQuotes]     = useState([]);
  const [clients, setClients]   = useState([]);
  const [products, setProducts] = useState([]);
  const [config, setConfig]     = useState(INIT_CONFIG);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);

  // ── Auth listener ────────────────────────────────────────────
  const dataLoaded = useRef(false);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        if (!dataLoaded.current) { dataLoaded.current = true; loadAll(data.session.user); }
        else setLoading(false);
      } else setLoading(false);
    });
    const { data: listener } = sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user);
        // Only load data on first login, not on tab refocus
        if (!dataLoaded.current) { dataLoaded.current = true; loadAll(session.user); }
      } else {
        setUser(null);
        dataLoaded.current = false;
        setLoading(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Load all data ────────────────────────────────────────────
  const loadAll = async (u) => {
    setLoading(true);
    try {
      // Profile
      let { data: prof } = await sb.from("profiles").select("*").eq("id", u.id).single();
      if (!prof) {
        await sb.from("profiles").insert({ id: u.id, name: u.email, role: "vendedor" });
        prof = { id: u.id, name: u.email, role: "vendedor" };
      }
      setProfile(prof);

      // Quotes
      const { data: qs } = await sb.from("quotes").select("*").order("number", { ascending: false });
      if (qs) { setQuotes(qs.map(normalizeQuote)); }

      // Clients
      const { data: cls } = await sb.from("clients").select("*").order("name");
      if (cls) setClients(cls);
      else setClients([]);

      // Products
      const { data: prods } = await sb.from("products").select("*").order("name");
      if (prods) setProducts(prods.map(p=>({...p, imageUrl: p.image_url||p.imageUrl||"", supplierMain: p.supplier_main||"", supplierSecondary: p.supplier_secondary||""})));

      // Payment requests
      const { data: prs } = await sb.from("payment_requests").select("*").order("id", { ascending: false });
      if (prs) setPaymentRequests(prs);

      // Suppliers
      const { data: sups } = await sb.from("suppliers").select("*").order("name");
      if (sups) setSuppliers(sups);

      // Categories
      const { data: cats } = await sb.from("categories").select("*").order("name");
      if (cats && cats.length) setCategories(cats);
      else setCategories([{id:1,name:"Hardware"},{id:2,name:"Software"},{id:3,name:"Servicios"},{id:4,name:"Consumibles"},{id:5,name:"Otros"}]);

      // Config
      const { data: cfg } = await sb.from("config").select("*").limit(1).single();
      if (cfg) setConfig(cfg.data);
      else { await sb.from("config").insert({ data: INIT_CONFIG }); }

      // Counter
      const maxQ = qs?.length ? Math.max(...qs.map(q=>q.number||1000)) : 1000;
      quoteCounter = maxQ + 1;

    } catch(e) { console.error(e); }
    setLoading(false);
  };

  // ── CRUD: Quotes ─────────────────────────────────────────────
  const saveQuote = async (q) => {
    const row = { number:q.number, date:q.date, valid_until:q.validUntil,
      client_id:q.clientId||null, client_name:q.clientName, client_contact:q.clientContact,
      client_email:q.clientEmail, client_rut:q.clientRut||"", status:q.status, notes:q.notes, discount:q.discount||0,
      trm:q.trm||4200, subtotal:q.subtotal||0, total_disc:q.totalDisc||0,
      tax_amt:q.taxAmt||0, total:q.total||0, total_cost:q.totalCost||0,
      profit:q.profit||0, profit_pct:q.profitPct||0, items:q.items||[], created_by:user.id,
      version: q.version||1, parent_id: q.parent_id||null, is_latest: q.is_latest!==false };
    if (q.id && typeof q.id === "number" && q.id > 1000000000) {
      const { data } = await sb.from("quotes").insert(row).select().single();
      if (data) setQuotes(qs => [normalizeQuote(data), ...qs.filter(x=>x.id!==q.id)]);
    } else {
      await sb.from("quotes").update(row).eq("id", q.id);
      setQuotes(qs => qs.map(x => x.id===q.id ? {...q,...row} : x));
    }
  };

  // Create a new revision of an existing quote
  const createRevision = async (q) => {
    if (q.status === "Aprobada") {
      // ── Aprobada: editar en el mismo registro, solo agregar sección Adicionales ──
      const newItems = [...(q.items||[])];
      const alreadyHasAdicionales = newItems.some(i => i.type==="header" && i.name==="Adicionales");
      if (!alreadyHasAdicionales) {
        newItems.push({ id: Date.now(), type:"header", name:"Adicionales" });
      }
      // Return the same quote with adicionales section added, same id
      return recalc({ ...q, items: newItems });
    } else {
      // ── No aprobada: crear nueva versión ──
      await sb.from("quotes").update({ is_latest: false }).eq("id", q.id);
      setQuotes(qs => qs.map(x => x.id===q.id ? {...x, is_latest: false} : x));
      const rootId = q.parent_id || q.id;
      const newVersion = (q.version||1) + 1;
      return recalc({
        id: Date.now(), number: q.number,
        date: today(), validUntil: q.validUntil,
        clientId: q.clientId||q.client_id,
        clientName: q.clientName||q.client_name||"",
        clientContact: q.clientContact||q.client_contact||"",
        clientEmail: q.clientEmail||q.client_email||"",
        status: "Pendiente",
        notes: q.notes||"", discount: q.discount||0,
        trm: q.trm||4200, currency: q.currency||"COP",
        items: [...(q.items||[])],
        version: newVersion, parent_id: rootId, is_latest: true,
      });
    }
  };

  const deleteQuote = async (id) => {
    await sb.from("quotes").delete().eq("id", id);
    setQuotes(qs => qs.filter(q=>q.id!==id));
  };

  // ── CRUD: Clients ────────────────────────────────────────────
  const saveClient = async (c) => {
    const row = { name:c.name, contact:c.contact, email:c.email, phone:c.phone, rfc:c.rfc, building:c.building||"", address:c.address||"", created_by:user.id };
    if (c.id && typeof c.id === "number" && c.id > 1000000000) {
      const { data } = await sb.from("clients").insert(row).select().single();
      if (data) setClients(cs => [...cs.filter(x=>x.id!==c.id), data].sort((a,b)=>a.name.localeCompare(b.name)));
    } else {
      await sb.from("clients").update(row).eq("id", c.id);
      setClients(cs => cs.map(x=>x.id===c.id?{...c,...row}:x));
    }
  };

  const deleteClient = async (id) => {
    await sb.from("clients").delete().eq("id", id);
    setClients(cs => cs.filter(c=>c.id!==id));
  };

  // ── CRUD: Products ───────────────────────────────────────────
  const saveProduct = async (p) => {
    const row = { sku:p.sku, name:p.name, category:p.category, currency:p.currency||"COP",
                  cost:p.cost||0, margin:p.margin||0, price:p.price||0, unit:p.unit, tax:p.tax||19,
                  image_url: p.imageUrl||"", supplier_main:p.supplierMain||"", supplier_secondary:p.supplierSecondary||"" };
    if (p.id && typeof p.id === "number" && p.id > 1000000000) {
      const { data } = await sb.from("products").insert(row).select().single();
      if (data) setProducts(ps => [...ps.filter(x=>x.id!==p.id), data].sort((a,b)=>a.name.localeCompare(b.name)));
    } else {
      await sb.from("products").update(row).eq("id", p.id);
      setProducts(ps => ps.map(x=>x.id===p.id?{...p,...row}:x));
    }
  };

  const deleteProduct = async (id) => {
    await sb.from("products").delete().eq("id", id);
    setProducts(ps => ps.filter(p=>p.id!==id));
  };

  // ── CRUD: Suppliers ─────────────────────────────────────────
  const saveSupplier = async (s) => {
    if (s.isNew) {
      const { data, error } = await sb.from("suppliers").insert({ name: s.name }).select().single();
      if (error) { alert("Error: " + error.message); return; }
      if (data) setSuppliers(ss => [...ss, data].sort((a,b)=>a.name.localeCompare(b.name)));
    } else {
      await sb.from("suppliers").update({ name: s.name }).eq("id", s.id);
      setSuppliers(ss => ss.map(x => x.id===s.id ? {...x, name: s.name} : x));
    }
  };
  const deleteSupplier = async (id) => {
    await sb.from("suppliers").delete().eq("id", id);
    setSuppliers(ss => ss.filter(s => s.id !== id));
  };

  // ── CRUD: Categories ────────────────────────────────────────
  const saveCategory = async (cat) => {
    // If isNew flag is set, insert; otherwise update
    if (cat.isNew) {
      const { data, error } = await sb.from("categories").insert({ name: cat.name }).select().single();
      if (error) { alert("Error: " + error.message); return; }
      if (data) setCategories(cs => [...cs, data].sort((a,b)=>a.name.localeCompare(b.name)));
    } else {
      const { error } = await sb.from("categories").update({ name: cat.name }).eq("id", cat.id);
      if (error) { alert("Error: " + error.message); return; }
      setCategories(cs => cs.map(c => c.id===cat.id ? {...c, name: cat.name} : c));
    }
  };
  const deleteCategory = async (id) => {
    await sb.from("categories").delete().eq("id", id);
    setCategories(cs => cs.filter(c => c.id !== id));
  };

  // ── CRUD: Payment Requests ─────────────────────────────────
  const savePaymentRequest = async (pr) => {
    const row = {
      quote_id: pr.quoteId||null, number: pr.number, date: pr.date,
      client_name: pr.clientName, client_id_number: pr.clientIdNumber||"",
      concept: pr.concept, amount: pr.amount||0, percentage: pr.percentage||null,
      account_holder: pr.accountHolder, nit: pr.nit, bank_name: pr.bankName,
      bank_account: pr.bankAccount, bank_type: pr.bankType, created_by: user.id
    };
    if (pr.isNew) {
      const { data } = await sb.from("payment_requests").insert(row).select().single();
      if (data) setPaymentRequests(ps => [data, ...ps]);
      return data;
    } else {
      await sb.from("payment_requests").update(row).eq("id", pr.id);
      setPaymentRequests(ps => ps.map(p => p.id===pr.id ? {...pr,...row} : p));
    }
  };
  const deletePaymentRequest = async (id) => {
    await sb.from("payment_requests").delete().eq("id", id);
    setPaymentRequests(ps => ps.filter(p => p.id!==id));
  };

  // ── Save Config ──────────────────────────────────────────────
  const saveConfigDB = async (cfg) => {
    const { data } = await sb.from("config").select("id").limit(1).single();
    if (data) await sb.from("config").update({ data: cfg }).eq("id", data.id);
    else await sb.from("config").insert({ data: cfg });
    setConfig(cfg);
  };

  const logout = async () => { await sb.auth.signOut(); setUser(null); setQuotes([]); setClients([]); setProducts([]); };

  // ── Render ───────────────────────────────────────────────────
  if (!user) return <><style>{css}</style><LoginView onLogin={u=>{setUser(u);loadAll(u);}} /></>;

  if (loading) return (
    <div style={{ minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:G.mono,fontSize:20,color:G.accent,marginBottom:12 }}>◈ QuoteApp</div>
        <p style={{ color:G.muted }}>Cargando datos...</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ display:"flex",minHeight:"100vh" }}>
        <Sidebar view={view} setView={setView} user={user} logout={logout} />
        <main style={{ flex:1,overflowY:"auto",
                       paddingTop:"env(safe-area-inset-top)" }}>
          {/* Mobile spacer for fixed top header */}
          {view==="dashboard" && <Dashboard quotes={quotes} clients={clients} products={products} />}
          {view==="quotes"    && <QuotesView quotes={quotes} setQuotes={setQuotes}
                                   saveQuote={saveQuote} deleteQuote={deleteQuote}
                                   createRevision={createRevision}
                                   paymentRequests={paymentRequests} savePaymentRequest={savePaymentRequest}
                                   clients={clients} products={products} config={config} />}
          {view==="clients"   && <ClientsView clients={clients} setClients={setClients}
                                   saveClient={saveClient} deleteClient={deleteClient}
                                   onNewQuoteForClient={(c)=>{
                                     setView("quotes");
                                     setTimeout(()=>document.dispatchEvent(new CustomEvent("newQuoteForClient",{detail:c})),100);
                                   }} />}
          {view==="products"  && <ProductsView products={products} setProducts={setProducts}
                                   saveProduct={saveProduct} deleteProduct={deleteProduct}
                                   categories={categories} saveCategory={saveCategory} deleteCategory={deleteCategory}
                                   suppliers={suppliers} />}
          {view==="categories" && <CategoriesView categories={categories} saveCategory={saveCategory} deleteCategory={deleteCategory} />}
          {view==="suppliers"  && <SuppliersView suppliers={suppliers} saveSupplier={saveSupplier} deleteSupplier={deleteSupplier} />}
          {view==="payments"   && <PaymentRequestsView paymentRequests={paymentRequests} quotes={quotes}
                                   savePaymentRequest={savePaymentRequest} deletePaymentRequest={deletePaymentRequest}
                                   config={config} />}
          {view==="config"    && <ConfigView config={config} setConfig={saveConfigDB} />}
          {/* Mobile spacer for fixed bottom nav */}
        </main>
      </div>
    </>
  );
}
/* cache bust Thu Apr  2 20:45:11 UTC 2026 */
