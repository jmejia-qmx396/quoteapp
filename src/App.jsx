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
  // Perfil personal
  personal: {
    companyName: "Jorge Mejia Jaramillo",
    slogan: "",
    vendorName: "Jorge Mejia Jaramillo",
    vendorPhone: "3182854896",
    vendorEmail: "jmejia@casainteligente.com",
    website: "",
    nit: "",
    bankName: "Bancolombia",
    bankAccount: "",
    bankType: "Ahorros",
    accountHolder: "Jorge Mejia Jaramillo",
    logoUrl: "",
    primaryColor: "#0d6e6e",
  },
};

// ── Quote counter (en memoria, se sincroniza con Supabase) ──────
let quoteCounter = 1001;

// Normalize quote fields from Supabase snake_case to camelCase
const normalizeQuote = (q) => {
  const base = {
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
  profile:       q.profile        || 'empresa',
  archived:      q.archived       || false,
  };
  // Always recalc to ensure subtotalConIva/subtotalSinIva are correct
  if (base.items.length) return recalc(base);
  return base;
};

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
input[type=date]{color-scheme:dark}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);cursor:pointer}
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
  const fmtN = (n) => n ? new Intl.NumberFormat("es-CO",{maximumFractionDigits:2}).format(n) : "";
  const [display, setDisplay] = useState(() => value ? fmtN(value) : "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(value ? fmtN(value) : "");
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onFocus={() => {
        setFocused(true);
        // Clear if zero, otherwise show raw number
        setDisplay((!value || value === 0) ? "" : String(value).replace(".", ","));
      }}
      onBlur={() => {
        setFocused(false);
        // Remove thousands separators (.) and convert decimal comma to dot
        const raw = String(display).replace(/[.]/g,"").replace(/[,]/g,".").replace(/[^0-9.]/g,"");
        const num = parseFloat(raw)||0;
        setDisplay(num ? fmtN(num) : "");
        onChange(num);
      }}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9.,]/g,"");
        setDisplay(raw);
      }}
      placeholder={placeholder||"0"}
      style={{ padding:"4px 8px",width:"100%",fontFamily:"'JetBrains Mono',monospace",
               textAlign:"right",...style }}
    />
  );
};

// ── ConfirmDialog ────────────────────────────────────────────────
const ConfirmDialog = ({ message, detail, onConfirm, onCancel, danger=true }) => (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.7)",
                display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20 }}>
    <div style={{ background:G.card,border:`1px solid ${danger?G.danger:G.border}`,
                  borderRadius:12,padding:28,maxWidth:420,width:"100%",textAlign:"center" }}>
      <div style={{ fontSize:36,marginBottom:12 }}>{danger?"⚠️":"❓"}</div>
      <p style={{ fontWeight:700,fontSize:16,marginBottom:8 }}>{message}</p>
      {detail && <p style={{ color:G.muted,fontSize:13,marginBottom:20 }}>{detail}</p>}
      {!detail && <div style={{ marginBottom:20 }} />}
      <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn variant={danger?"danger":"primary"} onClick={onConfirm}>
          {danger?"Sí, eliminar":"Confirmar"}
        </Btn>
      </div>
    </div>
  </div>
);

// ── useConfirm hook ───────────────────────────────────────────────
function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = (message, detail) => new Promise(resolve => {
    setState({ message, detail, resolve });
  });
  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      detail={state.detail}
      onConfirm={() => { state.resolve(true);  setState(null); }}
      onCancel={() =>  { state.resolve(false); setState(null); }}
    />
  ) : null;
  return { confirm, dialog };
}

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
                                             fontSize:22,cursor:"pointer",lineHeight:1 }}>🗑️</button>
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
                                             fontSize:22,cursor:"pointer",lineHeight:1 }}>🗑️</button>
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
const NAV_GROUPS = [
  {
    label: "OPERACIONES",
    items: [
      { id:"dashboard",  label:"Dashboard",     icon:"📊" },
      { id:"quotes",     label:"Cotizaciones",  icon:"📋" },
      { id:"projects",   label:"Proyectos",     icon:"🏗️" },
      { id:"payments",   label:"Cuentas Cobro", icon:"🧾" },
      { id:"kits",       label:"Kits",          icon:"🧩" },
    ]
  },
  {
    label: "ADMINISTRACIÓN",
    items: [
      { id:"clients",    label:"Clientes",      icon:"👥" },
      { id:"products",   label:"Catálogo",      icon:"📦" },
      { id:"technicians",label:"Técnicos",      icon:"🔧" },
    ]
  },
  {
    label: "CONFIGURACIÓN",
    items: [
      { id:"categories", label:"Categorías",    icon:"🏷️" },
      { id:"suppliers",  label:"Proveedores",   icon:"🏭" },
      { id:"config",     label:"Mi Empresa",    icon:"⚙️" },
    ]
  },
];
// Flat list for mobile bottom nav
const NAV = NAV_GROUPS.flatMap(g => g.items);

const Sidebar = ({ view, setView, user, logout }) => (
  <div style={{ width:230,background:G.surface,borderRight:`1px solid ${G.border}`,
                display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,flexShrink:0 }}>
    {/* Logo */}
    <div style={{ padding:"20px 18px 16px",borderBottom:`1px solid ${G.border}` }}>
      <div style={{ fontFamily:G.mono,fontWeight:700,fontSize:17,color:G.accent,letterSpacing:"-.02em" }}>
        ◈ QuoteApp
      </div>
      <div style={{ color:G.muted,fontSize:11,marginTop:2 }}>Sistema de Cotizaciones</div>
    </div>

    {/* Grouped navigation */}
    <nav style={{ flex:1,padding:"12px 8px",overflowY:"auto" }}>
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length-1 ? 8 : 0 }}>
          {/* Group header */}
          <div style={{ fontSize:10,fontWeight:700,color:G.muted,letterSpacing:".1em",
                        padding:"6px 12px 4px",textTransform:"uppercase",opacity:.6 }}>
            {group.label}
          </div>
          {/* Group items */}
          {group.items.map(n => (
            <div key={n.id} onClick={() => setView(n.id)}
              style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                       borderRadius:7,marginBottom:2,cursor:"pointer",
                       background: view === n.id ? `rgba(59,130,246,.14)` : "transparent",
                       color: view === n.id ? G.accentH : G.muted,
                       fontWeight: view === n.id ? 600 : 400,
                       borderLeft: view === n.id ? `3px solid ${G.accent}` : "3px solid transparent",
                       transition:".15s" }}>
              <span style={{ fontSize:15 }}>{n.icon}</span>
              <span style={{ fontSize:13 }}>{n.label}</span>
            </div>
          ))}
          {/* Divider between groups */}
          {gi < NAV_GROUPS.length-1 && (
            <div style={{ height:1,background:G.border,margin:"8px 12px 4px" }} />
          )}
        </div>
      ))}
    </nav>

    {/* User footer */}
    <div style={{ padding:"10px 14px",borderTop:`1px solid ${G.border}`,background:G.surface }}>
      <div style={{ fontSize:11,color:G.muted,marginBottom:4,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.email}</div>
      <button onClick={logout} style={{ fontSize:11,color:G.danger,background:"none",
                                        border:"none",cursor:"pointer",padding:0 }}>
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
const Dashboard = ({ quotes, clients, products, projects, projectPayments, projectQuotes, paymentRequests, setView }) => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastOfMonth  = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo,   setDateTo]   = useState(lastOfMonth);

  // ── Cotizaciones ────────────────────────────────────────────────
  const latestQuotes = quotes.filter(q => q.isLatest !== false);
  const inRange = latestQuotes.filter(q => { const d = q.date||""; return d >= dateFrom && d <= dateTo; });
  const approvedInRange  = inRange.filter(q => q.status === "Aprobada");
  const approvedTotal    = approvedInRange.reduce((s,q) => s+(q.total||0), 0);
  const pendingInRange   = inRange.filter(q => q.status === "Pendiente" || q.status === "Enviada");
  const pendingTotal     = pendingInRange.reduce((s,q) => s+(q.total||0), 0);
  const utilidad  = approvedInRange.reduce((s,q) => s+(q.profit||0), 0);
  const ventaNeta = approvedInRange.reduce((s,q) => s+(q.ventaNeta||(q.total||0)-(q.taxAmt||0)), 0);
  const gmPct     = ventaNeta > 0 ? Math.round(utilidad/ventaNeta*100) : 0;

  // ── Proyectos ───────────────────────────────────────────────────
  const activeProjects = (projects||[]).filter(p => p.status === "En ejecución" || p.status === "Activo" || !p.status || p.status === "activo");
  const totalProjects  = (projects||[]).length;

  // Calcular saldo pendiente global: suma de totales de cotizaciones por proyecto menos pagos
  const projectsBalance = (projects||[]).reduce((acc, proj) => {
    const pqIds = (projectQuotes||[]).filter(pq => pq.project_id === proj.id).map(pq => pq.quote_id);
    const projTotal = quotes.filter(q => pqIds.includes(q.id)).reduce((s,q) => s+(q.total||0), 0);
    const paid = (projectPayments||[]).filter(pp => pp.project_id === proj.id).reduce((s,pp) => s+(pp.amount||0), 0);
    return acc + Math.max(0, projTotal - paid);
  }, 0);

  // ── Ingresos (pagos de proyectos en el período seleccionado) ────
  const paymentsInRange   = (projectPayments||[]).filter(pp => { const d = pp.date||""; return d >= dateFrom && d <= dateTo; });
  const ingresosTotal     = paymentsInRange.reduce((s,pp) => s+(pp.amount||0), 0);
  const ingresosEmpresa   = paymentsInRange.filter(pp => (pp.payment_type||"empresa")==="empresa").reduce((s,pp) => s+(pp.amount||0), 0);
  const ingresosPersonal  = paymentsInRange.filter(pp => pp.payment_type==="personal").reduce((s,pp) => s+(pp.amount||0), 0);
  const ingresosCantidad  = paymentsInRange.length;

  // ── Cuentas de cobro pendientes (últimas emitidas sin pago registrado en proyectos) ──
  const recentPaymentReqs = (paymentRequests||[]).slice(0,5);

  // ── Actividad reciente (mix de cotizaciones + pagos) ───────────
  const recentActivity = [
    ...latestQuotes.slice(0,4).map(q => ({
      type: "quote", date: q.date||"", label: `Cotización #${q.number}`,
      sub: q.clientName||q.client_name||"", value: q.total||0, status: q.status,
    })),
    ...(projectPayments||[]).slice(0,3).map(pp => ({
      type: "payment", date: pp.date||"", label: `Pago recibido`,
      sub: pp.description||pp.concept||"", value: pp.amount||0, status: "Pagado",
    })),
  ].sort((a,b) => b.date.localeCompare(a.date)).slice(0,7);

  // ── Acciones rápidas ────────────────────────────────────────────
  const quickActions = [
    { label:"Nueva Cotización", icon:"📋", color:G.accent,  view:"quotes"    },
    { label:"Ver Proyectos",    icon:"🏗️", color:"#8b5cf6", view:"projects"  },
    { label:"Cuenta de Cobro",  icon:"🧾", color:G.success,  view:"payments"  },
    { label:"Nuevo Cliente",    icon:"👥", color:G.warn,     view:"clients"   },
  ];

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Dashboard</h1>
          <p style={{ color:G.muted,fontSize:13 }}>
            Resumen del período seleccionado
            <span style={{ marginLeft:10,fontSize:10,color:G.border,fontFamily:G.mono }}>v1.4.2</span>
          </p>
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
            style={{ fontSize:11,color:G.accent,background:"rgba(59,130,246,.1)",border:"none",
                     cursor:"pointer",fontFamily:G.font,padding:"4px 8px",borderRadius:4 }}>
            Este mes
          </button>
        </Card>
      </div>

      {/* ── Acciones rápidas ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:24 }}>
        {quickActions.map(a => (
          <button key={a.view} onClick={() => setView(a.view)}
            style={{ background:G.card,border:`1px solid ${G.border}`,borderRadius:10,
                     padding:"14px 16px",cursor:"pointer",textAlign:"left",fontFamily:G.font,
                     transition:".15s",display:"flex",alignItems:"center",gap:10,color:G.text }}
            onMouseOver={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = `${a.color}18`; }}
            onMouseOut={e =>  { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.card; }}>
            <span style={{ fontSize:20 }}>{a.icon}</span>
            <span style={{ fontSize:13,fontWeight:600,color: a.color }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── KPIs Cotizaciones ── */}
      <p style={{ fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",
                  letterSpacing:".08em",marginBottom:10 }}>Cotizaciones — Período</p>
      <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
        <StatCard label="Aprobadas — Valor"  value={fmt(approvedTotal)}       icon="✅" color={G.success} />
        <Card style={{ flex:1,minWidth:160 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>Utilidad Presupuestada</p>
              <p style={{ fontSize:22,fontWeight:700,color:G.success }}>{fmt(utilidad)}</p>
              <p style={{ color:G.muted,fontSize:12,marginTop:4 }}>GM {gmPct}%</p>
            </div>
            <span style={{ fontSize:22,opacity:.5 }}>💰</span>
          </div>
        </Card>
        <StatCard label="Aprobadas — Cant."  value={approvedInRange.length}   icon="🏆" color={G.success} />
        <StatCard label="En Proceso — Valor" value={fmt(pendingTotal)}        icon="⏳" color={G.warn} />
        <StatCard label="Clientes Totales"   value={clients.length}           icon="👥" color={G.accent} />
      </div>

      {/* ── KPIs Proyectos ── */}
      <p style={{ fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",
                  letterSpacing:".08em",marginBottom:10 }}>Proyectos — Estado Global</p>
      <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
        <StatCard label="Proyectos Activos"   value={activeProjects.length}  icon="🏗️" color="#8b5cf6" />
        <StatCard label="Total Proyectos"     value={totalProjects}           icon="📁" color={G.accent} />
        <StatCard label="Cuentas de Cobro"    value={(paymentRequests||[]).length} icon="🧾" color={G.success} />
      </div>

      {/* ── KPIs Ingresos ── */}
      <p style={{ fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",
                  letterSpacing:".08em",marginBottom:10 }}>Ingresos — Período</p>
      <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
        <Card style={{ flex:1,minWidth:180,borderLeft:`4px solid ${G.success}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>💰 Total Ingresado</p>
              <p style={{ fontSize:22,fontWeight:700,color:G.success }}>{fmt(ingresosTotal)}</p>
              <p style={{ color:G.muted,fontSize:12,marginTop:4 }}>{ingresosCantidad} pago{ingresosCantidad!==1?"s":""} registrado{ingresosCantidad!==1?"s":""}</p>
            </div>
          </div>
        </Card>
        <Card style={{ flex:1,minWidth:180,borderLeft:`4px solid #10b981` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>🏢 Empresa (con IVA)</p>
              <p style={{ fontSize:22,fontWeight:700,color:"#10b981" }}>{fmt(ingresosEmpresa)}</p>
              <p style={{ color:G.muted,fontSize:12,marginTop:4 }}>
                {ingresosTotal>0 ? Math.round(ingresosEmpresa/ingresosTotal*100) : 0}% del total
              </p>
            </div>
          </div>
        </Card>
        <Card style={{ flex:1,minWidth:180,borderLeft:`4px solid ${G.accent}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>👤 Personal (sin IVA)</p>
              <p style={{ fontSize:22,fontWeight:700,color:G.accent }}>{fmt(ingresosPersonal)}</p>
              <p style={{ color:G.muted,fontSize:12,marginTop:4 }}>
                {ingresosTotal>0 ? Math.round(ingresosPersonal/ingresosTotal*100) : 0}% del total
              </p>
            </div>
          </div>
        </Card>
        <StatCard label="Saldo por Cobrar" value={fmt(projectsBalance)} icon="💵" color={G.warn} />
      </div>

      {/* ── Grilla inferior ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20 }}>

        {/* Actividad reciente */}
        <Card>
          <p style={{ fontWeight:700,marginBottom:14,fontSize:14 }}>🕐 Actividad Reciente</p>
          {recentActivity.length === 0 && (
            <div style={{ textAlign:"center",padding:"20px 0",color:G.muted,fontSize:13 }}>
              Aún no hay actividad registrada.<br/>
              <span style={{ fontSize:12 }}>Crea tu primera cotización para empezar.</span>
            </div>
          )}
          {recentActivity.map((a,i) => (
            <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                                   padding:"8px 0",borderBottom:`1px solid ${G.border}` }}>
              <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                <span style={{ fontSize:16 }}>{a.type==="quote"?"📋":"💳"}</span>
                <div>
                  <div style={{ fontSize:13,fontWeight:500 }}>{a.label}</div>
                  <div style={{ fontSize:11,color:G.muted }}>{a.sub || a.date}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12,color: a.type==="payment"?G.success:G.text }}>{fmt(a.value)}</div>
                {a.status && <StatusBadge s={a.status} />}
              </div>
            </div>
          ))}
        </Card>

        {/* Estado cotizaciones por período */}
        <Card>
          <p style={{ fontWeight:700,marginBottom:14,fontSize:14 }}>📊 Estado — Período Seleccionado</p>
          {[["Pendiente","warn"],["Enviada","blue"],["Aprobada","green"],["Rechazada","red"]].map(([s,c])=>{
            const cnt = inRange.filter(q=>q.status===s).length;
            const pct = inRange.length ? Math.round(cnt/inRange.length*100) : 0;
            const val = inRange.filter(q=>q.status===s).reduce((sum,q)=>sum+(q.total||0),0);
            return (
              <div key={s} style={{ marginBottom:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span className={`badge badge-${c}`}>{s}</span>
                    <span style={{ fontSize:12,color:G.muted }}>({cnt})</span>
                  </div>
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
          {!inRange.length && (
            <div style={{ textAlign:"center",padding:"20px 0",color:G.muted,fontSize:13 }}>
              Sin cotizaciones en este período.
            </div>
          )}
        </Card>

        {/* Proyectos activos */}
        {(projects||[]).length > 0 && (
          <Card>
            <p style={{ fontWeight:700,marginBottom:14,fontSize:14 }}>🏗️ Proyectos Recientes</p>
            {(projects||[]).slice(0,5).map(proj => {
              const pqIds = (projectQuotes||[]).filter(pq=>pq.project_id===proj.id).map(pq=>pq.quote_id);
              const projTotal = quotes.filter(q=>pqIds.includes(q.id)).reduce((s,q)=>s+(q.total||0),0);
              const paid = (projectPayments||[]).filter(pp=>pp.project_id===proj.id).reduce((s,pp)=>s+(pp.amount||0),0);
              const saldo = Math.max(0, projTotal - paid);
              const pct = projTotal > 0 ? Math.min(100, Math.round(paid/projTotal*100)) : 0;
              return (
                <div key={proj.id} style={{ marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${G.border}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                    <span style={{ fontSize:13,fontWeight:600 }}>{proj.name}</span>
                    <span style={{ fontSize:11,color:G.muted }}>{pct}% pagado</span>
                  </div>
                  <div style={{ background:G.border,borderRadius:4,height:5,marginBottom:4 }}>
                    <div style={{ width:`${pct}%`,height:5,borderRadius:4,background:G.success,transition:".4s" }} />
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between" }}>
                    <span style={{ fontSize:11,color:G.muted }}>Saldo: {fmt(saldo)}</span>
                    <span style={{ fontSize:10,color:proj.status==="Finalizado"?G.success:G.warn,fontWeight:600 }}>
                      {proj.status||"Activo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

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
    const costCOP  = i.currency === "USD" ? Number(i.cost||0) * trm : Number(i.cost||0);
    // If manualPrice is set, use it directly as COP price; otherwise calculate from price field
    const priceCOP = i.manualPrice
      ? Number(i.manualPrice)
      : (i.currency === "USD" ? Number(i.price) * trm : Number(i.price));
    const discAmt  = priceCOP * ((Number(i.discount)||0) / 100);
    const netCOP   = priceCOP - discAmt;
    const itemTax  = i.tax !== undefined ? Number(i.tax) : 19;
    const taxAmt   = netCOP * (itemTax / 100);
    const lineNet  = Number(i.qty) * netCOP;
    const lineTax  = Number(i.qty) * taxAmt;
    // Recalculate GM% based on actual COP prices
    const gmPct = priceCOP > 0 ? Math.round((1 - costCOP/priceCOP)*100) : (i.gmPct||0);
    return { ...i, priceCOP, costCOP, discAmt, netCOP, itemTax, taxAmt, lineNet, lineTax, gmPct };
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
const QuotesView = ({ quotes, setQuotes, saveQuote, deleteQuote, archiveQuote, createRevision, clients, products, setProducts, config, paymentRequests, savePaymentRequest, projectQuotes=[], projects=[], addQuoteToProject, createProject, templates=[] }) => {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [paymentQuote, setPaymentQuote] = useState(null);
  const [addToProjectQuote, setAddToProjectQuote] = useState(null);
  const [newProjNameInline, setNewProjNameInline] = useState("");
  const [approvedQuoteForProject, setApprovedQuoteForProject] = useState(null);
  const [newProjName, setNewProjName] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showArchived, setShowArchived] = useState(false);

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
    // Always start fresh — clear any existing draft
    clearQuoteDraft();
    const num = quoteCounter++;
    setCurrent(recalc({
      id: Date.now(), number: num,
      date: today(), validUntil: addDays(today(), 30),
      clientId: null, clientName: "", clientContact: "", clientEmail: "",
      status: "Pendiente", notes: config?.defaultNotes||"",
      discount: 0, tax: 19, trm: 4200, items: [], currency: "COP",
    }));
    setModal("new");
  };

  const openEdit = (q) => { clearQuoteDraft(); setCurrent({ ...q }); setModal("edit"); };
  const openView = (q) => { setCurrent({ ...q }); setModal("view"); };

  const openRevision = async (q) => {
    const newQ = await createRevision(q);
    setCurrent(newQ);
    setModal("new");
  };

  const duplicateQuote = (q) => {
    const num = quoteCounter++;
    const copy = recalc({
      id: Date.now(), number: num,
      date: today(), validUntil: addDays(today(), 30),
      clientId: q.clientId||q.client_id||null,
      clientName: q.clientName||q.client_name||"",
      clientContact: q.clientContact||q.client_contact||"",
      clientEmail: q.clientEmail||q.client_email||"",
      clientRut: q.clientRut||q.client_rut||"",
      status: "Pendiente",
      notes: q.notes||"", discount: q.discount||0,
      trm: q.trm||4200, currency: q.currency||"COP",
      items: JSON.parse(JSON.stringify(q.items||[])), // deep copy
      version: 1, parent_id: null, is_latest: true,
    });
    setCurrent(copy);
    setModal("new");
  };

  const [saving, setSaving] = useState(false);
  const save = async (keepOpen=false) => {
    if (saving) return;
    setSaving(true);
    try {
      const wasApproved = quotes.find(q=>q.id===current.id)?.status === "Aprobada";
      const savedQuote = await saveQuote(current);
      // After first save, update current with real DB id so next save is an UPDATE not INSERT
      if (savedQuote && current.id !== savedQuote.id) {
        setCurrent(c => ({...c, id: savedQuote.id}));
      }
      if (!keepOpen) {
        clearQuoteDraft();
        setModal(null);
        if (current.status === "Aprobada" && !wasApproved) {
          const alreadyInProject = projectQuotes?.find(pq=>pq.quote_id===current.id);
          if (!alreadyInProject) {
            setNewProjName(current.clientName + " — " + (current.date||"").substring(0,7));
            setApprovedQuoteForProject(current);
          }
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const ok = await confirm("¿Eliminar cotización?", "Esta acción no se puede deshacer.");
    if (ok) await deleteQuote(id);
  };

  const filtered = quotes.filter(q => {
    const srch = search.toLowerCase();
    const name = (q.clientName || q.client_name || "").toLowerCase();
    const status = (q.status || "").toLowerCase();
    const matchesSearch = name.includes(srch) || String(q.number||"").includes(srch) || status.includes(srch);
    const matchesStatus = filterStatus === "Todos" || (q.status||"") === filterStatus;
    const isSearchingByNumber = srch && /^\d+$/.test(srch.trim());
    const showVersion = isSearchingByNumber ? true : (q.isLatest !== false);
    const matchesArchived = showArchived ? q.archived : !q.archived;
    return matchesSearch && matchesStatus && showVersion && matchesArchived;
  });

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>
            {showArchived ? "📦 Cotizaciones Archivadas" : "Cotizaciones"}
          </h1>
          <p style={{ color:G.muted }}>
            {showArchived
              ? `${quotes.filter(q=>q.archived&&q.isLatest!==false).length} archivada(s)`
              : `${quotes.filter(q=>!q.archived&&q.isLatest!==false).length} cotización(es) activa(s)`}
          </p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>{ setShowArchived(s=>!s); setFilterStatus("Todos"); setSearch(""); }}
            style={{ padding:"7px 14px",borderRadius:7,border:`1px solid ${showArchived?G.accent:G.border}`,
                     background:showArchived?`rgba(59,130,246,.12)`:"transparent",
                     color:showArchived?G.accent:G.muted,cursor:"pointer",fontSize:12,fontFamily:G.font,
                     display:"flex",alignItems:"center",gap:6 }}>
            📦 {showArchived ? "Ver activas" : `Archivadas (${quotes.filter(q=>q.archived&&q.isLatest!==false).length})`}
          </button>
          {!showArchived && <Btn onClick={openNew}>+ Nueva Cotización</Btn>}
        </div>
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
                      <Btn size="sm" variant="ghost" onClick={()=>openView(q)}
                        title="Ver cotización en detalle">Ver</Btn>
                      {q.isLatest!==false && <Btn size="sm" variant="outline" onClick={()=>openEdit(q)}
                        title="Editar esta cotización">Editar</Btn>}
                      {q.isLatest!==false && (
                        <Btn size="sm" variant="outline" onClick={()=>openRevision(q)}
                          title={q.status==="Aprobada" ? "Agregar ítems adicionales a esta cotización aprobada" : "Crear una nueva versión de esta cotización"}
                          style={{ color:G.warn,borderColor:G.warn }}>
                          {q.status==="Aprobada" ? "＋ Adicionales" : "Nueva v."}
                        </Btn>
                      )}
                      {q.isLatest!==false && (
                        <Btn size="sm" variant="ghost" onClick={()=>duplicateQuote(q)}
                          title="Duplicar como nueva cotización independiente" style={{ color:G.muted }}>
                          📋
                        </Btn>
                      )}
                      {q.isLatest!==false && addQuoteToProject && (() => {
                        const inProject = projectQuotes.find(pq=>pq.quote_id===q.id);
                        if (inProject) return <span title="Esta cotización ya está asociada a un proyecto" style={{fontSize:10,color:G.success,padding:"2px 6px",background:"rgba(16,185,129,.1)",borderRadius:10}}>🏗️ En proyecto</span>;
                        return (
                          <Btn size="sm" variant="ghost" onClick={()=>setAddToProjectQuote(q)}
                            title="Asociar o crear proyecto para esta cotización"
                            style={{color:G.success,borderColor:G.success,border:"1px solid"}}>
                            🏗️
                          </Btn>
                        );
                      })()}
                      {q.isLatest!==false && (
                        <Btn size="sm" variant="ghost"
                          title={q.archived ? "Mover de vuelta a cotizaciones activas" : "Archivar — ocultar de la lista principal"}
                          onClick={async()=>{
                            if (!q.archived) {
                              const ok = await confirm(
                                `¿Archivar cotización #${q.number}?`,
                                "Se ocultará de la lista principal. Puedes verla o recuperarla desde el botón 'Archivadas'."
                              );
                              if (!ok) return;
                            }
                            archiveQuote(q.id, !q.archived);
                          }}
                          style={{ color:q.archived?G.success:G.muted }}>
                          {q.archived ? "📤" : "📦"}
                        </Btn>
                      )}
                      <Btn size="sm" variant="danger" onClick={()=>remove(q.id)}
                        title="Eliminar cotización permanentemente">🗑️</Btn>
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
          onSave={save} onClose={()=>{ clearQuoteDraft(); setModal(null); }} isNew={modal==="new"} config={config}
          templates={templates}
          onSaveProduct={async (p) => {
            // Check for duplicate name before inserting
            const exists = products.find(x=>x.name.toLowerCase()===p.name.toLowerCase());
            if (exists) { alert(`El producto "${p.name}" ya existe en el catálogo.`); return exists; }
            const row = { sku:p.sku, name:p.name, category:p.category, currency:p.currency||"COP",
                          cost:p.cost||0, margin:p.margin||30, price:p.price||0, unit:p.unit||"pza",
                          tax:p.tax||19, image_url:"" };
            const { data } = await sb.from("products").insert(row).select().single();
            if (data) {
              const prod = {...data, imageUrl:""};
              setProducts(ps => [...ps, prod].sort((a,b)=>a.name.localeCompare(b.name)));
              return prod;
            }
            return null;
          }} />
      )}
      {modal === "view" && current && (
        <QuotePreview quote={current} onClose={()=>setModal(null)} onEdit={()=>setModal("edit")} config={config}
          onCreatePayment={()=>{ setModal(null); setPaymentQuote(current); }} />
      )}
      {/* Modal: asignar proyecto al aprobar */}
      {approvedQuoteForProject && (
        <Modal title="¿Asociar a un Proyecto?" onClose={()=>setApprovedQuoteForProject(null)}>
          <p style={{ color:G.muted,fontSize:13,marginBottom:20 }}>
            La cotización <strong>#{approvedQuoteForProject.number}</strong> fue aprobada.
            ¿La asocias a un proyecto?
          </p>
          {/* Existing active projects for this client */}
          {projects.filter(p=>p.status==="Activo"&&String(p.client_id)===String(approvedQuoteForProject.clientId||approvedQuoteForProject.client_id)).length > 0 && (
            <>
              <p style={{ fontWeight:700,fontSize:13,marginBottom:10 }}>Agregar a proyecto existente:</p>
              {projects
                .filter(p=>p.status==="Activo"&&String(p.client_id)===String(approvedQuoteForProject.clientId||approvedQuoteForProject.client_id))
                .map(p=>(
                  <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                                            padding:"10px 0",borderBottom:`1px solid ${G.border}` }}>
                    <div style={{ fontWeight:500 }}>{p.name}</div>
                    <Btn size="sm" variant="outline" onClick={async()=>{
                      await addQuoteToProject(p.id, approvedQuoteForProject.id);
                      setApprovedQuoteForProject(null);
                    }}>+ Agregar</Btn>
                  </div>
                ))
              }
              <div style={{ margin:"16px 0",borderTop:`1px solid ${G.border}`,paddingTop:16 }}>
                <p style={{ fontWeight:700,fontSize:13,marginBottom:10 }}>O crear nuevo proyecto:</p>
              </div>
            </>
          )}
          {projects.filter(p=>p.status==="Activo"&&String(p.client_id)===String(approvedQuoteForProject.clientId||approvedQuoteForProject.client_id)).length === 0 && (
            <p style={{ fontWeight:700,fontSize:13,marginBottom:10 }}>Crear nuevo proyecto:</p>
          )}
          <Field label="Nombre del Proyecto">
            <input value={newProjName} onChange={e=>setNewProjName(e.target.value)} />
          </Field>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>setApprovedQuoteForProject(null)}>Omitir</Btn>
            <Btn variant="success" onClick={async()=>{
              const proj = await createProject({
                clientId: approvedQuoteForProject.clientId||approvedQuoteForProject.client_id,
                clientName: approvedQuoteForProject.clientName||approvedQuoteForProject.client_name||"",
                name: newProjName
              });
              if (proj) await addQuoteToProject(proj.id, approvedQuoteForProject.id);
              setApprovedQuoteForProject(null);
            }}>🏗️ Crear Proyecto</Btn>
          </div>
        </Modal>
      )}

      {confirmDialog}
      {addToProjectQuote && (
        <Modal title={`🏗️ Cotización #${addToProjectQuote.number} — Proyecto`} onClose={()=>{ setAddToProjectQuote(null); setNewProjNameInline(""); }}>
          <p style={{ color:G.muted,fontSize:13,marginBottom:16 }}>
            Asocia esta cotización a un proyecto existente o crea uno nuevo.
            {addToProjectQuote.status !== "Aprobada" && (
              <span style={{ display:"block",marginTop:6,color:G.warn,fontWeight:600 }}>
                ⚠️ La cotización se marcará como <strong>Aprobada</strong> automáticamente.
              </span>
            )}
          </p>

          {/* Proyectos existentes del cliente */}
          {projects.filter(p=>p.status==="Activo"&&String(p.client_id)===String(addToProjectQuote.clientId||addToProjectQuote.client_id)).length > 0 && (
            <>
              <p style={{ fontWeight:700,fontSize:13,marginBottom:8 }}>Proyectos activos del cliente:</p>
              {projects
                .filter(p=>p.status==="Activo"&&String(p.client_id)===String(addToProjectQuote.clientId||addToProjectQuote.client_id))
                .map(p=>(
                  <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                                            padding:"10px 0",borderBottom:`1px solid ${G.border}` }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{p.name}</div>
                      <div style={{ color:G.muted,fontSize:12 }}>{p.client_name}</div>
                    </div>
                    <Btn size="sm" variant="success" onClick={async()=>{
                      let quoteId = addToProjectQuote.id;
                      if (addToProjectQuote.status !== "Aprobada") {
                        const saved = await saveQuote({ ...addToProjectQuote, status:"Aprobada" });
                        if (saved?.id) quoteId = saved.id;
                      }
                      await addQuoteToProject(p.id, quoteId);
                      setAddToProjectQuote(null); setNewProjNameInline("");
                    }}>+ Agregar</Btn>
                  </div>
                ))
              }
              <div style={{ height:1,background:G.border,margin:"16px 0" }} />
            </>
          )}

          {/* Crear nuevo proyecto */}
          <p style={{ fontWeight:700,fontSize:13,marginBottom:8 }}>Crear nuevo proyecto:</p>
          <Field label="Nombre del Proyecto">
            <input value={newProjNameInline}
              onChange={e=>setNewProjNameInline(e.target.value)}
              placeholder={`${addToProjectQuote.clientName||addToProjectQuote.client_name||""} — ${new Date().toISOString().substring(0,7)}`}
              autoFocus />
          </Field>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>{ setAddToProjectQuote(null); setNewProjNameInline(""); }}>Cancelar</Btn>
            <Btn variant="success" onClick={async()=>{
              const name = newProjNameInline.trim() ||
                `${addToProjectQuote.clientName||addToProjectQuote.client_name||""} — ${new Date().toISOString().substring(0,7)}`;
              let quoteId = addToProjectQuote.id;
              if (addToProjectQuote.status !== "Aprobada") {
                const saved = await saveQuote({ ...addToProjectQuote, status:"Aprobada" });
                if (saved?.id) quoteId = saved.id;
              }
              const proj = await createProject({
                clientId: addToProjectQuote.clientId||addToProjectQuote.client_id,
                clientName: addToProjectQuote.clientName||addToProjectQuote.client_name||"",
                name
              });
              if (proj) {
                await addQuoteToProject(proj.id, quoteId);
              }
              setAddToProjectQuote(null); setNewProjNameInline("");
            }}>🏗️ Crear Proyecto</Btn>
          </div>
        </Modal>
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
const QuoteForm = ({ quote, setQuote, clients, products, onSave, onClose, isNew, config, onSaveProduct, templates=[], saveTemplate }) => {
  const [prodSearch, setProdSearch] = useState("");
  const [prodCat, setProdCat] = useState("Todos");
  const [uploading, setUploading]   = useState(null);
  const [dragOver, setDragOver]     = useState(null); // id of item being dragged over
  const [clientSearch, setClientSearch] = useState(undefined);
  const [editDescModal, setEditDescModal] = useState(null); // {id, name}
  const dragItem = useRef(null); // id of item being dragged
  const [newProdModal, setNewProdModal] = useState(false);
  const [newProd, setNewProd] = useState({ sku:"",name:"",category:"Servicios",currency:"COP",cost:0,margin:30,price:0,unit:"pza",imageUrl:"",tax:19 });
  const [savingProd, setSavingProd] = useState(false);
  const [prodTab, setProdTab] = useState("productos");
  const calcPrice = (cost, margin) => margin >= 100 ? 0 : Math.round(cost / (1 - margin/100));

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

  const filtProd = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                        (p.sku||"").toLowerCase().includes(prodSearch.toLowerCase());
    const matchCat = prodCat === "Todos" || p.category === prodCat;
    return matchSearch && matchCat;
  });

  return (
    <Modal title={isNew ? (quote.version>1 ? `Nueva Revisión v${quote.version} — #${quote.number}` : "Nueva Cotización") : `Editar Cotización #${quote.number}${(quote.version||1)>1?' v'+quote.version:''}`}
           onClose={onClose} width={1400}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20 }}>
        <Field label="Cliente">
          <div style={{ position:"relative" }}>
            <input
              value={clientSearch !== undefined ? clientSearch : (quote.clientName||"")}
              onChange={e => {
                setClientSearch(e.target.value);
                if (!e.target.value) setQuote(q=>({...q,clientId:null,clientName:"",clientContact:"",clientEmail:""}));
              }}
              onFocus={e => { setClientSearch(quote.clientName||""); e.target.select(); }}
              onBlur={() => {
                setTimeout(()=>{
                  // Keep whatever was typed as clientName even if not from list
                  if (clientSearch !== undefined) {
                    setQuote(q => ({...q, clientName: clientSearch||q.clientName}));
                  }
                  setClientSearch(undefined);
                }, 200);
              }}
              placeholder="Buscar o escribir nombre…"
              autoComplete="off"
            />
            {clientSearch !== undefined && clientSearch.length > 0 && (
              <div style={{ position:"absolute",top:"100%",left:0,right:0,zIndex:100,
                            background:G.card,border:`1px solid ${G.accent}`,borderRadius:6,
                            maxHeight:200,overflowY:"auto",boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
                {clients
                  .filter(c=>(c.name||"").toLowerCase().includes((clientSearch||"").toLowerCase()))
                  .map(c=>(
                    <div key={c.id} onMouseDown={()=>{ selectClient(String(c.id)); setClientSearch(undefined); }}
                      style={{ padding:"8px 12px",cursor:"pointer",fontSize:13,
                               borderBottom:`1px solid ${G.border}` }}
                      onMouseOver={e=>e.currentTarget.style.background="rgba(59,130,246,.1)"}
                      onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontWeight:600 }}>{c.name}</span>
                      {c.contact && <span style={{ color:G.muted,fontSize:11,marginLeft:8 }}>{c.contact}</span>}
                    </div>
                  ))
                }
                {!clients.filter(c=>(c.name||"").toLowerCase().includes((clientSearch||"").toLowerCase())).length && (
                  <div style={{ padding:"8px 12px",color:G.muted,fontSize:12 }}>
                    Sin resultados —{" "}
                    <span style={{ color:G.accent,cursor:"pointer" }}
                      onMouseDown={()=>{ setQuote(q=>({...q,clientName:clientSearch,clientId:null,clientContact:"",clientEmail:""})); setClientSearch(undefined); }}>
                      usar "{clientSearch}" como cliente ocasional
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
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
            <input type="number" min={1}
              value={quote.trm===0||quote.trm?""+quote.trm:"4200"}
              onChange={e=>{
                const val = e.target.value;
                setQuote(q=>recalc({...q,trm:val===""?0:Number(val)}));
              }}
              style={{ maxWidth:180 }} />
            <div style={{ background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",
                          borderRadius:6,padding:"7px 14px",fontSize:12,color:G.muted,flex:1 }}>
              💡 Solo aplica a productos marcados en USD. Los productos en COP no se afectan.
            </div>
          </div>
        </Field>
      </div>

      <p style={{ fontWeight:700,marginBottom:10,fontSize:13 }}>Agregar productos o kits</p>
      <div style={{ background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,padding:14,marginBottom:18 }}>
        {/* ── Tab selector ── */}
        <div style={{ display:"flex",gap:0,marginBottom:12,borderBottom:`1px solid ${G.border}` }}>
          {[["productos","📦 Productos"],["kits","🧩 Kits"]].map(([id,label])=>(
            <button key={id} onClick={()=>setProdTab(id)}
              style={{ padding:"6px 18px",background:"transparent",fontFamily:G.font,fontSize:13,
                       fontWeight:prodTab===id?700:400,cursor:"pointer",
                       color:prodTab===id?G.accent:G.muted,
                       borderBottom:prodTab===id?`2px solid ${G.accent}`:"2px solid transparent",
                       border:"none",marginBottom:-1 }}>
              {label}
            </button>
          ))}
        </div>

        {prodTab==="productos" && <>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
            {["Todos",...[...new Set(products.map(p=>p.category).filter(Boolean))].sort()].map(cat=>(
              <button key={cat} onClick={()=>setProdCat(cat)}
                style={{ padding:"3px 10px",borderRadius:12,cursor:"pointer",fontSize:11,fontWeight:600,
                         fontFamily:G.font,transition:".15s",
                         background: prodCat===cat ? G.accent : "transparent",
                         border: `1px solid ${prodCat===cat ? G.accent : G.border}`,
                         color: prodCat===cat ? "#fff" : G.muted }}>
                {cat}
              </button>
            ))}
          </div>
          <input placeholder="Buscar producto o SKU…" value={prodSearch}
            onChange={e=>setProdSearch(e.target.value)} style={{ marginBottom:10 }} />
          <div style={{ display:"flex",flexWrap:"wrap",gap:8,maxHeight:120,overflowY:"auto" }}>
            {filtProd.map(p=>(
              <button key={p.id} onClick={()=>addItem(p)}
                style={{ background:G.card,border:`1px solid ${G.border}`,borderRadius:6,
                         padding:"6px 12px",color:G.text,cursor:"pointer",fontSize:12,fontFamily:G.font,
                         textAlign:"left",display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ color:G.accent,fontFamily:G.mono,fontSize:11,
                               background:"rgba(59,130,246,.1)",padding:"1px 6px",borderRadius:4,flexShrink:0 }}>
                  {p.sku||"—"}
                </span>
                <span style={{ flex:1 }}>{p.name}</span>
                <span style={{ fontSize:10,padding:"1px 6px",borderRadius:10,flexShrink:0,
                               background: p.currency==="USD"?"rgba(245,158,11,.15)":"rgba(16,185,129,.15)",
                               color: p.currency==="USD"?G.warn:G.success,fontWeight:700 }}>
                  {p.currency||"COP"}
                </span>
                <span style={{ color:G.muted,flexShrink:0 }}>{fmtCur(p.price, p.currency||"COP")}</span>
              </button>
            ))}
            {!filtProd.length && (
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ color:G.muted,fontSize:12 }}>Sin coincidencias.</span>
                {onSaveProduct && (
                  <button onClick={()=>{
                    setNewProd({ sku:"",name:prodSearch,category:"Servicios",currency:"COP",
                                 cost:0,margin:30,price:0,unit:"pza",imageUrl:"",tax:19 });
                    setNewProdModal(true);
                  }}
                    style={{ background:"rgba(59,130,246,.1)",border:`1px solid ${G.accent}`,
                             color:G.accent,borderRadius:6,padding:"4px 12px",cursor:"pointer",
                             fontSize:12,fontFamily:G.font,fontWeight:600 }}>
                    + Crear "{prodSearch}"
                  </button>
                )}
              </div>
            )}
          </div>
        </>}

        {prodTab==="kits" && <>
          {!templates.length ? (
            <div style={{ textAlign:"center",padding:"20px 0",color:G.muted,fontSize:13 }}>
              No hay kits creados aún. Ve a <strong>🧩 Kits</strong> en el menú para crear uno.
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:200,overflowY:"auto" }}>
              {templates.map(t => {
                const prodItems = (t.items||[]).filter(i=>i.type!=="header");
                return (
                  <div key={t.id}
                    style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                             border:`1px solid ${G.border}`,borderRadius:8,
                             padding:"10px 14px",background:G.card }}>
                    <div>
                      <div style={{ fontWeight:700,fontSize:13 }}>{t.name}</div>
                      {t.description && (
                        <div style={{ color:G.muted,fontSize:11,marginTop:2 }}>{t.description}</div>
                      )}
                      <div style={{ fontSize:11,color:G.accent,marginTop:4 }}>
                        {prodItems.length} producto{prodItems.length!==1?"s":""}
                        {prodItems.slice(0,3).map((i,idx)=>(
                          <span key={idx} style={{ color:G.muted,marginLeft:6 }}>· {i.name}</span>
                        ))}
                        {prodItems.length>3 && <span style={{ color:G.muted }}> …+{prodItems.length-3} más</span>}
                      </div>
                    </div>
                    <Btn size="sm" variant="success"
                      onClick={()=>{
                        const newItems = (t.items||[]).map(i=>({...i,id:Date.now()+Math.random()}));
                        setQuote(q=>recalc({...q,items:[...q.items,...newItems]}));
                      }}>
                      + Insertar
                    </Btn>
                  </div>
                );
              })}
            </div>
          )}
        </>}
      </div>

      {/* Botones de fila */}
      <div style={{ display:"flex",gap:8,marginBottom:8,flexWrap:"wrap" }}>
        <button onClick={()=>{
          const newId = Date.now();
          setQuote(q=>({...q,items:[...q.items,{id:newId,type:"header",name:""}]}));
          setTimeout(()=>{ const el=document.getElementById("header-"+newId); if(el) el.focus(); },50);
        }}
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
          <thead style={{ position:"sticky",top:0,zIndex:10 }}><tr>
            <th style={{width:24}}></th>
            <th style={{width:44}}>Img</th>
            <th style={{width:90}}>SKU</th><th>Descripción</th><th style={{width:55}}>Mon.</th>
            <th style={{width:140}}>Costo</th>
            <th style={{width:65}}>Qty</th>
            <th style={{width:75}}>GM%</th>
            <th style={{width:155}}>P. Unitario</th>
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
                  rows.push(
                    <tr key={item.id}
                      draggable
                      onDragStart={()=>{ dragItem.current=item.id; }}
                      onDragOver={e=>{ e.preventDefault(); setDragOver(item.id); }}
                      onDragEnd={()=>{ dragItem.current=null; setDragOver(null); }}
                      onDrop={()=>{
                        if (!dragItem.current || dragItem.current===item.id) return;
                        setQuote(q=>{
                          const items=[...q.items];
                          const from=items.findIndex(i=>i.id===dragItem.current);
                          const to=items.findIndex(i=>i.id===item.id);
                          const [moved]=items.splice(from,1);
                          items.splice(to,0,moved);
                          return recalc({...q,items});
                        });
                        setDragOver(null);
                      }}
                      style={{ opacity: dragOver===item.id?0.5:1, cursor:"grab" }}>
                      <td style={{ padding:"4px 6px",color:G.muted,fontSize:16,cursor:"grab",userSelect:"none" }}>⠿</td>
                      <td colSpan={13} style={{ padding:"6px 8px",background:"rgba(59,130,246,.08)",
                                                borderTop:`2px solid ${G.accent}` }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <span style={{ color:G.accent,fontWeight:700,fontSize:13 }}>▸</span>
                          <input id={"header-"+item.id} value={item.name}
                            onChange={e=>setQuote(q=>({...q,items:q.items.map(i=>i.id===item.id?{...i,name:e.target.value}:i)}))}
                            placeholder="Nombre de la sección…"
                            style={{ fontWeight:700,fontSize:13,color:G.accent,background:"transparent",
                                     border:"none",outline:"none",flex:1,padding:"2px 4px" }} />
                          <button onClick={()=>setQuote(q=>({...q,items:q.items.filter(i=>i.id!==item.id)}))}
                            style={{ background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:16 }}>🗑️</button>
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
                    <tr key={item.id}
                      draggable
                      onDragStart={()=>{ dragItem.current=item.id; }}
                      onDragOver={e=>{ e.preventDefault(); setDragOver(item.id); }}
                      onDragEnd={()=>{ dragItem.current=null; setDragOver(null); }}
                      onDrop={()=>{
                        if (!dragItem.current || dragItem.current===item.id) return;
                        setQuote(q=>{
                          const items=[...q.items];
                          const from=items.findIndex(i=>i.id===dragItem.current);
                          const to=items.findIndex(i=>i.id===item.id);
                          const [moved]=items.splice(from,1);
                          items.splice(to,0,moved);
                          return recalc({...q,items});
                        });
                        setDragOver(null);
                      }}
                      style={{ opacity:dragOver===item.id?0.4:1,
                               borderTop:dragOver===item.id?`2px solid ${G.accent}`:"" }}>
                      <td style={{ padding:"4px 6px",color:G.muted,fontSize:16,cursor:"grab",
                                   userSelect:"none",textAlign:"center" }}>⠿</td>
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
                          onDoubleClick={()=>setEditDescModal({id:item.id,name:item.name})}
                          title="Doble clic para editar en ventana grande"
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
                      {/* Qty — after costo */}
                      <td style={{ textAlign:"center" }}>
                        <input type="number" min={1} value={item.qty}
                          onChange={e=>updateItem(item.id,"qty",e.target.value)}
                          style={{ padding:"4px 6px",width:"60px",textAlign:"center",
                                   fontWeight:700,fontSize:14,color:G.text }} />
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
                      <td>
                        <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                          {item.currency==="USD" && (
                            <button
                              title={item.manualPrice ? "Precio manual (clic para volver a automático)" : "Precio automático (clic para fijar manualmente)"}
                              onClick={()=>{
                                if (item.manualPrice) {
                                  // Remove manual price — back to auto
                                  setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,manualPrice:null}:i)}));
                                } else {
                                  // Lock current priceCOP as manual
                                  setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,manualPrice:i.priceCOP||Math.round(Number(i.price)*(q.trm||4200))}:i)}));
                                }
                              }}
                              style={{ background:"none",border:"none",cursor:"pointer",
                                       fontSize:14,padding:"2px 4px",flexShrink:0,
                                       color: item.manualPrice ? G.warn : G.muted,
                                       title:"test" }}>
                              {item.manualPrice ? "🔓" : "🔒"}
                            </button>
                          )}
                          {item.manualPrice ? (
                            <NumInput value={item.manualPrice}
                              onChange={v=>{
                                setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,manualPrice:v}:i)}));
                              }}
                              style={{ background:"rgba(245,158,11,.08)",borderColor:G.warn }} />
                          ) : (
                            <NumInput value={item.price||0}
                              onChange={price=>{
                                const cost = Number(item.cost||0);
                                const gm = price>0?Math.round((1-cost/price)*100):0;
                                setQuote(q=>recalc({...q,items:q.items.map(i=>i.id===item.id?{...i,price,gmPct:gm}:i)}));
                              }} />
                          )}
                        </div>
                        {item.currency==="USD" && !item.manualPrice && item.priceCOP>0 && (
                          <div style={{ fontSize:9,color:G.muted,textAlign:"right",
                                        fontFamily:G.mono,paddingRight:4,marginTop:2 }}>
                            ={fmt(item.priceCOP)} COP
                          </div>
                        )}
                        {item.manualPrice && (
                          <div style={{ fontSize:9,color:G.warn,textAlign:"right",
                                        fontFamily:G.mono,paddingRight:4,marginTop:2 }}>
                            Precio manual COP
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
                          style={{ background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:18,lineHeight:1 }}>🗑️</button>
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
            const subConIva = hasConIva ? quote.subtotalConIva : ((quote.subtotal||0)-(quote.totalDisc||0)-(quote.subtotalSinIva||0));
            const rows = [
              ...(!hasSinIva ? [["Subtotal", fmt(quote.subtotal||0), G.text]] : [["Subtotal con IVA", fmt(subConIva), G.text]]),
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
        <button onClick={async()=>{ await onSave(true); }}
          style={{ padding:"7px 18px",borderRadius:6,cursor:"pointer",fontFamily:G.font,fontSize:13,
                   fontWeight:600,border:`2px solid ${G.success}`,background:"transparent",
                   color:G.success,transition:"all .15s" }}
          onMouseOver={e=>{ e.currentTarget.style.background=G.success; e.currentTarget.style.color="#fff"; e.currentTarget.style.transform="scale(1.03)"; }}
          onMouseOut={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=G.success; e.currentTarget.style.transform="scale(1)"; }}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.96)"}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1.03)"}>
          💾 Guardar
        </button>
        <button onClick={()=>onSave(false)}
          style={{ padding:"7px 18px",borderRadius:6,cursor:"pointer",fontFamily:G.font,fontSize:13,
                   fontWeight:600,border:"none",background:G.success,color:"#fff",transition:"all .15s" }}
          onMouseOver={e=>{ e.currentTarget.style.background="#34d399"; e.currentTarget.style.transform="scale(1.03)"; }}
          onMouseOut={e=>{ e.currentTarget.style.background=G.success; e.currentTarget.style.transform="scale(1)"; }}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.96)"}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1.03)"}>
          ✅ Guardar y Cerrar
        </button>
      </div>

      {/* Modal editar descripción */}
      {editDescModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.8)",
                      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20 }}>
          <div style={{ background:G.card,border:`1px solid ${G.accent}`,borderRadius:12,
                        width:"100%",maxWidth:600,padding:24 }}>
            <p style={{ fontWeight:700,fontSize:15,marginBottom:12 }}>✏️ Editar Descripción</p>
            <textarea rows={5} autoFocus
              value={editDescModal.name}
              onChange={e=>setEditDescModal({...editDescModal,name:e.target.value})}
              style={{ width:"100%",resize:"vertical",fontSize:14,padding:"8px 12px" }} />
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:14 }}>
              <Btn variant="ghost" onClick={()=>setEditDescModal(null)}>Cancelar</Btn>
              <Btn variant="success" onClick={()=>{
                updateItem(editDescModal.id,"name",editDescModal.name);
                setEditDescModal(null);
              }}>✓ Aplicar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Mini modal: crear producto desde cotización */}
      {newProdModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.8)",
                      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20 }}>
          <div style={{ background:G.card,border:`1px solid ${G.accent}`,borderRadius:12,
                        width:"100%",maxWidth:560,padding:24 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
              <span style={{ fontWeight:700,fontSize:15 }}>➕ Nuevo Producto</span>
              <button onClick={()=>setNewProdModal(false)}
                style={{ background:"none",border:"none",color:G.muted,fontSize:20,cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Field label="SKU">
                <input value={newProd.sku} onChange={e=>setNewProd({...newProd,sku:e.target.value})} placeholder="HW-001" />
              </Field>
              <Field label="Categoría">
                <select value={newProd.category} onChange={e=>setNewProd({...newProd,category:e.target.value})}>
                  {["Hardware","Software","Servicios","Consumibles","Otros"].map(c=><option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Nombre" style={{ gridColumn:"1/-1" }}>
                <input value={newProd.name} onChange={e=>setNewProd({...newProd,name:e.target.value})} />
              </Field>
              <Field label="Moneda">
                <select value={newProd.currency} onChange={e=>setNewProd({...newProd,currency:e.target.value})}>
                  <option>COP</option><option>USD</option>
                </select>
              </Field>
              <Field label="Unidad">
                <input value={newProd.unit} onChange={e=>setNewProd({...newProd,unit:e.target.value})} placeholder="pza, m, hr…" />
              </Field>
              <Field label="Costo">
                <NumInput value={newProd.cost||0} onChange={v=>{
                  const gm = newProd.margin||30;
                  const price = gm<100 ? calcPrice(v,gm) : 0;
                  setNewProd({...newProd,cost:v,price});
                }} placeholder="" />
              </Field>
              <Field label="GM%">
                <input type="number" value={newProd.margin||30}
                  onChange={e=>{
                    const gm = Number(e.target.value);
                    const price = gm<100 ? calcPrice(newProd.cost||0,gm) : 0;
                    setNewProd({...newProd,margin:gm,price});
                  }} />
              </Field>
              <Field label="Precio">
                <NumInput value={newProd.price||0} onChange={v=>setNewProd({...newProd,price:v})} />
              </Field>
              <Field label="IVA%">
                <select value={newProd.tax} onChange={e=>setNewProd({...newProd,tax:Number(e.target.value)})}>
                  {[0,5,8,19].map(t=><option key={t} value={t}>{t}%</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
              <Btn variant="ghost" onClick={()=>setNewProdModal(false)}>Cancelar</Btn>
              <Btn variant="success" onClick={async()=>{
                if (savingProd) return; // prevent double click
                if (!newProd.name) { alert("Ingresa el nombre del producto"); return; }
                setSavingProd(true);
                try {
                  const saved = await onSaveProduct(newProd);
                  setNewProdModal(false);
                  setProdSearch("");
                  if (saved) addItem(saved);
                } finally {
                  setSavingProd(false);
                }
              }}>
                {savingProd ? "Guardando…" : "💾 Guardar y Agregar"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
const QuotePreview = ({ quote, onClose, onEdit, config = {}, onCreatePayment = null }) => {
  const handlePrint = () => {
    const w = window.open("","_blank","width=900,height=700");
    // Use personal profile if quote has profile="personal"
    const prof = (quote.profile === "personal" && config.personal)
      ? { ...config, ...config.personal }
      : config;
    const pc = prof.primaryColor || "#0d6e6e";
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
            ${prof.logoUrl
              ? `<img src="${prof.logoUrl}" alt="logo" style="height:50px;object-fit:contain">`
              : `<div style="display:flex;align-items:center;gap:10px">
                  <div class="logo-circle">${(config.companyName||"C")[0]}</div>
                  <div>
                    <div class="company-name">${prof.companyName||"Mi Empresa"}</div>
                    <div style="color:#64748b;font-size:10px">${prof.slogan||""}</div>
                    ${prof.website?`<div style="color:${pc};font-size:9px">${prof.website}</div>`:""}
                  </div>
                 </div>`}
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
            <strong>${prof.vendorName||""}</strong>
            <div style="color:#64748b">${prof.vendorPhone||""}</div>
            <div style="color:#64748b">${prof.vendorEmail||""}</div>
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
          <tbody>
            ${(quote.subtotalConIva>0)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:8px 12px">Subtotal con IVA</td><td style="text-align:right;padding:8px 12px">${fmtCOP(quote.subtotalConIva||0)}</td></tr>`:""}
            ${(!quote.subtotalConIva&&!quote.subtotalSinIva)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:8px 12px">SubTotal</td><td style="text-align:right;padding:8px 12px">${fmtCOP(quote.subtotal||0)}</td></tr>`:""}
            ${(quote.totalDisc>0)?`<tr><td colspan="6" style="text-align:right;color:#ef4444;padding:6px 12px">- Descuentos</td><td style="text-align:right;color:#ef4444;padding:6px 12px">-${fmtCOP(quote.totalDisc||0)}</td></tr>`:""}
            ${(quote.taxAmt>0)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:6px 12px">IVA</td><td style="text-align:right;padding:6px 12px">${fmtCOP(quote.taxAmt||0)}</td></tr>`:""}
            ${(quote.subtotalSinIva>0)?`<tr><td colspan="6" style="text-align:right;color:#64748b;padding:6px 12px">Subtotal sin IVA</td><td style="text-align:right;padding:6px 12px">${fmtCOP(quote.subtotalSinIva||0)}</td></tr>`:""}
            <tr class="total-row"><td colspan="6" style="text-align:right;padding:10px 12px">TOTAL</td><td style="text-align:right;padding:10px 12px;font-size:15px">${fmtCOP(quote.total||0)}</td></tr>
          </tbody>
        </table>

        ${quote.notes?`<div class="notes-box">${quote.notes}</div>`:""}

        ${(config.bankName||config.bankAccount)?`
        <div class="bank-box">
          <div class="lbl" style="color:#16a34a">Datos para Consignación</div>
          <div>Consignar a nombre de: <strong>${prof.accountHolder||config.companyName}</strong></div>
          <div>NIT: <strong>${prof.nit||""}</strong></div>
          <div>Cuenta ${prof.bankType} ${prof.bankName}: <strong>${prof.bankAccount}</strong></div>
        </div>`:""}

        <div class="footer">
          <span>${prof.companyName||"QuoteApp"} · ${prof.nit||""}</span>
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
            const subConIva2 = hasConIva ? quote.subtotalConIva : ((quote.subtotal||0)-(quote.totalDisc||0)-(quote.subtotalSinIva||0));
            const rows = [
              ...(!hasSinIva ? [["Subtotal", fmt(quote.subtotal||0), G.text]] : [["Subtotal con IVA", fmt(subConIva2), G.text]]),
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
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [modal, setModal] = useState(false);
  const [cur, setCur] = useState(null);
  const [search, setSearch] = useState("");

  const blank = () => ({ id:Date.now(),name:"",contact:"",email:"",phone:"",rfc:"",building:"",address:"" });
  const openNew = () => { setCur(blank()); setModal(true); };
  const openEdit = (c) => { setCur({...c}); setModal(true); };
  const isExisting = cur && clients.some(c=>c.id===cur.id);
  const save = async () => { await saveClient(cur); setModal(false); };
  const remove = async (id) => {
    const ok = await confirm("¿Eliminar cliente?", "Esta acción no se puede deshacer.");
    if (ok) await deleteClient(id);
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
                    <Btn size="sm" variant="danger" onClick={()=>remove(c.id)}>🗑️</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {!filt.length && <tr><td colSpan={7} style={{ textAlign:"center",color:G.muted,padding:24 }}>Sin clientes registrados.</td></tr>}
          </tbody>
        </table>
      </Card></div>

      {confirmDialog}
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
  const { confirm, dialog: confirmDialog } = useConfirm();
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
  const [saving, setSaving] = useState(false);
  const [editNameModal, setEditNameModal] = useState(null); // stores current name text
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveProduct(cur);
      clearDraft();
      setModal(false);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    const ok = await confirm("¿Eliminar producto?", "Esta acción no se puede deshacer.");
    if (ok) await deleteProduct(id);
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
                    <Btn size="sm" variant="danger" onClick={()=>remove(p.id)}>🗑️</Btn>
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
              <Btn size="sm" variant="danger" onClick={()=>remove(p.id)}>🗑️</Btn>
            </div>
          </div>
        ))}
        {!filt.length && <div style={{ textAlign:"center",color:G.muted,padding:30 }}>Sin productos.</div>}
      </div>

      {confirmDialog}
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
              <div style={{ position:"relative" }}>
                <input value={cur.name} onChange={e=>setCur({...cur,name:e.target.value})}
                  placeholder="Descripción del producto o servicio"
                  onDoubleClick={()=>setEditNameModal(cur.name)}
                  title="Doble clic para editar en ventana grande"
                  style={{ paddingRight:28 }} />
                <span style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
                               fontSize:11,color:G.muted,pointerEvents:"none" }}
                  title="Doble clic para editar en ventana grande">✏️</span>
              </div>
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

          {/* Modal doble clic nombre producto */}
          {editNameModal !== null && (
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.8)",
                          display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20 }}>
              <div style={{ background:G.card,border:`1px solid ${G.accent}`,borderRadius:12,
                            width:"100%",maxWidth:600,padding:24 }}>
                <p style={{ fontWeight:700,fontSize:15,marginBottom:12 }}>✏️ Editar Nombre del Producto</p>
                <textarea rows={5} autoFocus
                  value={editNameModal}
                  onChange={e=>setEditNameModal(e.target.value)}
                  style={{ width:"100%",resize:"vertical",fontSize:14,padding:"8px 12px" }} />
                <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:14 }}>
                  <Btn variant="ghost" onClick={()=>setEditNameModal(null)}>Cancelar</Btn>
                  <Btn variant="success" onClick={()=>{
                    setCur(c=>({...c, name: editNameModal}));
                    setEditNameModal(null);
                  }}>✓ Aplicar</Btn>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// ── CONFIGURACIÓN ────────────────────────────────────────────────
const ConfigSection = ({ title, children }) => (
  <Card style={{ marginBottom:20 }}>
    <p style={{ fontWeight:700,fontSize:14,marginBottom:16,color:G.accentH,
                borderBottom:`1px solid ${G.border}`,paddingBottom:10 }}>{title}</p>
    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>{children}</div>
  </Card>
);

const ConfigView = ({ config, setConfig }) => {
  const [saved, setSaved] = useState(false);
  const [savedPersonal, setSavedPersonal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // Local state — only saves to DB when user clicks Save
  const [local, setLocal] = useState(() => ({ ...config }));
  const [personal, setPersonal] = useState(() => config.personal || {
    companyName:"", vendorName:"", vendorEmail:"", vendorPhone:"", nit:"",
    primaryColor:"#0d6e6e", logoUrl:"", bankName:"", bankType:"Ahorros", bankAccount:"", accountHolder:""
  });

  const set = (k, v) => setLocal(c => ({ ...c, [k]: v }));
  const setP = (k, v) => setPersonal(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    setConfig({ ...local, personal });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  const savePersonal = () => {
    setConfig({ ...local, personal });
    setSavedPersonal(true);
    setTimeout(() => setSavedPersonal(false), 2500);
  };
  const Section = ConfigSection;

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
          <input value={local.companyName||""} onChange={e=>set("companyName",e.target.value)} placeholder="Casa Inteligente" />
        </Field>
        <Field label="Slogan / Descripción">
          <input value={local.slogan||""} onChange={e=>set("slogan",e.target.value)} placeholder="Todo bajo control" />
        </Field>
        <Field label="NIT / RUT">
          <input value={local.nit||""} onChange={e=>set("nit",e.target.value)} placeholder="900.000.000-1" />
        </Field>
        <Field label="Sitio Web" style={{ gridColumn:"1/-1" }}>
          <input value={local.website||""} onChange={e=>set("website",e.target.value)} placeholder="www.miempresa.com" />
        </Field>
        <Field label="Color Principal">
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <input type="color" value={local.primaryColor||"#0d6e6e"} onChange={e=>set("primaryColor",e.target.value)}
              style={{ width:48,height:36,padding:2,cursor:"pointer" }} />
            <input value={local.primaryColor||"#0d6e6e"} onChange={e=>set("primaryColor",e.target.value)}
              style={{ flex:1 }} placeholder="#0d6e6e" />
          </div>
        </Field>
        <Field label="Logo de la Empresa">
          <div style={{ display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
            {local.logoUrl && (
              <img src={local.logoUrl} alt="logo" style={{ height:48,objectFit:"contain",
                border:`1px solid ${G.border}`,borderRadius:6,padding:4,background:"#fff" }} />
            )}
            <div style={{ flex:1 }}>
              <label style={{ display:"inline-block",padding:"7px 16px",background:G.accent,
                              color:"#fff",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:500 }}>
                {uploadingLogo ? "Subiendo..." : local.logoUrl ? "🔄 Cambiar logo" : "📁 Subir logo"}
                <input type="file" accept="image/*" style={{ display:"none" }}
                  onChange={async e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 2*1024*1024) { alert("El logo no puede pesar más de 2MB"); return; }
                    setUploadingLogo(true);
                    try {
                      const ext = file.name.split(".").pop();
                      const path = "logos/company-logo." + ext;
                      const { error } = await sb.storage.from("product-images").upload(path, file, { upsert:true });
                      if (error) throw error;
                      const { data } = sb.storage.from("product-images").getPublicUrl(path);
                      const newUrl = data.publicUrl + "?t=" + Date.now();
                      set("logoUrl", newUrl);
                    } catch(e) { alert("Error: " + e.message); }
                    setUploadingLogo(false);
                  }} />
              </label>
              {local.logoUrl && (
                <button onClick={()=>set("logoUrl","")}
                  style={{ marginLeft:8,background:"none",border:"none",color:G.danger,
                           cursor:"pointer",fontSize:12,fontFamily:G.font }}>
                  ✕ Quitar logo
                </button>
              )}
              <p style={{ color:G.muted,fontSize:11,marginTop:4 }}>PNG, JPG, SVG — máx 2MB</p>
            </div>
          </div>
        </Field>
      </Section>

      <Section title="👤 Datos del Vendedor">
        <Field label="Nombre del Vendedor" style={{ gridColumn:"1/-1" }}>
          <input value={local.vendorName||""} onChange={e=>set("vendorName",e.target.value)} placeholder="Jorge Mejia Jaramillo" />
        </Field>
        <Field label="Teléfono">
          <input value={local.vendorPhone||""} onChange={e=>set("vendorPhone",e.target.value)} placeholder="3182854896" />
        </Field>
        <Field label="Email">
          <input value={local.vendorEmail||""} onChange={e=>set("vendorEmail",e.target.value)} placeholder="correo@empresa.com" />
        </Field>
      </Section>

      <Section title="🏦 Datos Bancarios">
        <Field label="Nombre del Titular" style={{ gridColumn:"1/-1" }}>
          <input value={local.accountHolder||""} onChange={e=>set("accountHolder",e.target.value)} placeholder="Nombre o Razón Social" />
        </Field>
        <Field label="Banco">
          <input value={local.bankName||""} onChange={e=>set("bankName",e.target.value)} placeholder="Bancolombia" />
        </Field>
        <Field label="Tipo de Cuenta">
          <select value={local.bankType||"Ahorros"} onChange={e=>set("bankType",e.target.value)}>
            {["Ahorros","Corriente"].map(t=><option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Número de Cuenta" style={{ gridColumn:"1/-1" }}>
          <input value={local.bankAccount||""} onChange={e=>set("bankAccount",e.target.value)} placeholder="000.000.000.00" />
        </Field>
      </Section>

      <Section title="👤 Perfil Personal">
        <p style={{ color:G.muted,fontSize:12,marginBottom:6,gridColumn:"1/-1" }}>
          Usado cuando creas cotizaciones a título personal. Escribe y luego guarda con el botón de abajo.
        </p>
        <Field label="Tu Nombre" style={{ gridColumn:"1/-1" }}>
          <input value={personal.companyName||""} onChange={e=>setP("companyName",e.target.value)} placeholder="Jorge Mejia Jaramillo" />
        </Field>
        <Field label="Email Personal">
          <input value={personal.vendorEmail||""} onChange={e=>setP("vendorEmail",e.target.value)} />
        </Field>
        <Field label="Teléfono">
          <input value={personal.vendorPhone||""} onChange={e=>setP("vendorPhone",e.target.value)} />
        </Field>
        <Field label="CC / Cédula">
          <input value={personal.nit||""} onChange={e=>setP("nit",e.target.value)} placeholder="Número de cédula" />
        </Field>
        <Field label="Color Principal">
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <input type="color" value={personal.primaryColor||"#0d6e6e"} onChange={e=>setP("primaryColor",e.target.value)}
              style={{ width:48,height:36,padding:2,cursor:"pointer" }} />
            <input value={personal.primaryColor||"#0d6e6e"} onChange={e=>setP("primaryColor",e.target.value)} style={{ flex:1 }} />
          </div>
        </Field>
        <Field label="Logo Personal">
          <div style={{ display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
            {personal.logoUrl && (
              <img src={personal.logoUrl} alt="logo personal" style={{ height:40,objectFit:"contain",
                border:`1px solid ${G.border}`,borderRadius:6,padding:4,background:"#fff" }} />
            )}
            <label style={{ display:"inline-block",padding:"7px 16px",background:G.accent,
                            color:"#fff",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:500 }}>
              {personal.logoUrl ? "🔄 Cambiar" : "📁 Subir logo"}
              <input type="file" accept="image/*" style={{ display:"none" }}
                onChange={async e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const ext = file.name.split(".").pop();
                    const path = "logos/personal-logo." + ext;
                    const { error } = await sb.storage.from("product-images").upload(path, file, { upsert:true });
                    if (error) throw error;
                    const { data } = sb.storage.from("product-images").getPublicUrl(path);
                    const newUrl = data.publicUrl + "?t=" + Date.now();
                    setP("logoUrl", newUrl);
                    // Auto-save immediately so logo persists
                    setConfig(c => ({ ...c, personal: { ...c.personal, logoUrl: newUrl } }));
                  } catch(e) { alert("Error: " + e.message); }
                }} />
            </label>
            {personal.logoUrl && (
              <button onClick={()=>{ setP("logoUrl",""); setConfig(c=>({...c,personal:{...c.personal,logoUrl:""}})); }}
                style={{ background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:12,fontFamily:G.font }}>✕ Quitar</button>
            )}
          </div>
        </Field>
        <Field label="Titular Cuenta">
          <input value={personal.accountHolder||""} onChange={e=>setP("accountHolder",e.target.value)} />
        </Field>
        <Field label="Banco">
          <input value={personal.bankName||""} onChange={e=>setP("bankName",e.target.value)} />
        </Field>
        <Field label="Tipo de Cuenta">
          <select value={personal.bankType||"Ahorros"} onChange={e=>setP("bankType",e.target.value)}>
            {["Ahorros","Corriente"].map(t=><option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Número de Cuenta" style={{ gridColumn:"1/-1" }}>
          <input value={personal.bankAccount||""} onChange={e=>setP("bankAccount",e.target.value)} />
        </Field>
        <div style={{ gridColumn:"1/-1" }}>
          <Btn variant="success" onClick={savePersonal}>{savedPersonal ? "✅ Perfil personal guardado!" : "💾 Guardar Perfil Personal"}</Btn>
        </div>
      </Section>

      <Card style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700,fontSize:14,marginBottom:16,color:G.accentH,
                    borderBottom:`1px solid ${G.border}`,paddingBottom:10 }}>📝 Notas por Defecto</p>
        <p style={{ color:G.muted,fontSize:12,marginBottom:10 }}>
          Estas notas aparecerán automáticamente al crear una nueva cotización. Puedes editarlas por cotización.
        </p>
        <textarea rows={6} value={local.defaultNotes||""} onChange={e=>set("defaultNotes",e.target.value)}
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
                <img src={local.logoUrl} alt="logo" style={{ height:60,objectFit:"contain" }} />
              ) : (
                <>
                  <div style={{ width:60,height:60,borderRadius:"50%",background:local.primaryColor||"#0d6e6e",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                color:"#fff",fontSize:24,fontWeight:700 }}>
                    {(local.companyName||"C")[0]||"C"}
                  </div>
                  <div>
                    <p style={{ fontWeight:700,fontSize:18,color:local.primaryColor||"#0d6e6e" }}>{local.companyName||"Mi Empresa"}</p>
                    <p style={{ color:"#64748b",fontSize:12 }}>{local.slogan||""}</p>
                  </div>
                </>
              )}
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontWeight:700,fontSize:20,color:local.primaryColor||"#0d6e6e" }}>COTIZACIÓN</p>
              <p style={{ color:"#64748b",fontSize:12 }}>{local.vendorName||""}</p>
              <p style={{ color:"#64748b",fontSize:12 }}>{local.vendorPhone||""}</p>
              <p style={{ color:"#64748b",fontSize:12 }}>{local.vendorEmail||""}</p>
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

  const [profile, setProfile] = useState(quote.profile || "empresa");

  const getProfileData = (prof) => {
    if (prof === "personal" && config.personal) {
      return {
        accountHolder: config.personal.accountHolder || config.personal.companyName || "",
        nit: config.personal.nit || "",
        bankName: config.personal.bankName || "",
        bankAccount: config.personal.bankAccount || "",
        bankType: config.personal.bankType || "Ahorros",
      };
    }
    return {
      accountHolder: config.accountHolder || config.companyName || "",
      nit: config.nit || "",
      bankName: config.bankName || "",
      bankAccount: config.bankAccount || "",
      bankType: config.bankType || "Ahorros",
    };
  };

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
    ...getProfileData(quote.profile || "empresa"),
  });

  const set = (k,v) => setPr(p => ({...p, [k]:v}));

  const switchProfile = (prof) => {
    const data = getProfileData(prof);
    console.log("Switching to profile:", prof, "data:", data, "config.personal:", config.personal);
    setProfile(prof);
    setPr(p => ({ ...p, ...data }));
  };

  const updateAmount = (pct) => {
    set("percentage", pct);
    set("amount", Math.round((quote.total||0) * pct / 100));
  };

  const handlePrint = () => {
    const w = window.open("","_blank","width=800,height=600");
    const prof = profile === "personal" && config.personal ? {...config, ...config.personal} : config;
    const pc = prof.primaryColor || "#0d6e6e";
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
            ${prof.logoUrl ? `<img src="${prof.logoUrl}" style="height:60px;object-fit:contain">` : `<div class="logo-circle">${(prof.companyName||"C")[0]}</div>`}
            <div>
              <div class="company">${config.companyName||""}</div>
              <div style="color:#64748b;font-size:12px">${prof.slogan||""}</div>
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
            <div style="font-weight:600">${prof.vendorName||""}</div>
            <div style="color:#64748b">${prof.vendorPhone||""}</div>
            <div style="color:#64748b">${prof.vendorEmail||""}</div>
            ${prof.website?`<div style="color:${pc}">${prof.website}</div>`:""}
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
      {/* Selector de perfil */}
      <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:16 }}>
        <span style={{ fontSize:12,color:G.muted,fontWeight:600 }}>Cobrar como:</span>
        {["empresa","personal"].map(p=>(
          <button key={p} onClick={()=>switchProfile(p)}
            style={{ padding:"5px 16px",borderRadius:20,cursor:"pointer",fontFamily:G.font,fontSize:12,fontWeight:600,
                     background: profile===p ? `rgba(59,130,246,.2)` : "transparent",
                     border:`1px solid ${profile===p ? G.accent : G.border}`,
                     color: profile===p ? G.accent : G.muted }}>
            {p==="empresa" ? "🏢 Casa Inteligente" : "👤 Personal"}
          </button>
        ))}
      </div>
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
  const { confirm, dialog: confirmDialog } = useConfirm();
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
                        <Btn size="sm" variant="danger" onClick={async()=>{ const ok=await confirm("¿Eliminar cuenta de cobro?","Esta acción no se puede deshacer."); if(ok) deletePaymentRequest(p.id); }}>🗑️</Btn>
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

      {confirmDialog}
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
            <div><div class="company">${config.companyName||""}</div><div style="color:#64748b;font-size:12px">${prof.slogan||""}</div></div>
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
            <div style="font-weight:600">${prof.vendorName||""}</div>
            <div style="color:#64748b">${prof.vendorPhone||""}</div>
            <div style="color:#64748b">${prof.vendorEmail||""}</div>
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
  const { confirm, dialog: confirmDialog } = useConfirm();
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
    const ok = await confirm("¿Eliminar proveedor?", "Esta acción no se puede deshacer.");
    if (ok) await deleteSupplier(id);
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
        {confirmDialog}
        {suppliers.map((s,idx) => (
          <div key={s.id} style={{ display:"flex",alignItems:"center",gap:10,
                                    padding:"12px 16px",borderBottom:idx<suppliers.length-1?`1px solid ${G.border}`:"none" }}>
            {editId === s.id ? (
              <>
                <input value={editName} onChange={e=>setEditName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveEdit()}
                  style={{ flex:1,padding:"5px 10px" }} autoFocus />
                <Btn size="sm" variant="success" onClick={saveEdit}>✓</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>setEditId(null)}>🗑️</Btn>
              </>
            ) : (
              <>
                <span style={{ flex:1,fontSize:14,fontWeight:500 }}>🏭 {s.name}</span>
                <Btn size="sm" variant="outline" onClick={()=>startEdit(s)}>✏️</Btn>
                <Btn size="sm" variant="danger" onClick={()=>remove(s.id)}>🗑️</Btn>
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
  const { confirm, dialog: confirmDialog } = useConfirm();
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
    const ok = await confirm("¿Eliminar categoría?", "Los productos con esta categoría no se verán afectados.");
    if (ok) await deleteCategory(id);
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
        {confirmDialog}
        {categories.map((cat,idx) => (
          <div key={cat.id} style={{ display:"flex",alignItems:"center",gap:10,
                                      padding:"12px 16px",borderBottom: idx<categories.length-1?`1px solid ${G.border}`:"none" }}>
            {editId === cat.id ? (
              <>
                <input value={editName} onChange={e=>setEditName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveEdit()}
                  style={{ flex:1,padding:"5px 10px" }} autoFocus />
                <Btn size="sm" variant="success" onClick={saveEdit}>✓</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>setEditId(null)}>🗑️</Btn>
              </>
            ) : (
              <>
                <span style={{ flex:1,fontSize:14,fontWeight:500 }}>
                  <span style={{ marginRight:8 }}>🏷️</span>{cat.name}
                </span>
                <Btn size="sm" variant="outline" onClick={()=>startEdit(cat)}>✏️</Btn>
                <Btn size="sm" variant="danger" onClick={()=>remove(cat.id)}>🗑️</Btn>
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

// ── PROYECTOS ────────────────────────────────────────────────────
const ProjectsView = ({ projects, projectQuotes, projectPayments, quotes, clients,
                        paymentRequests, createProject, addQuoteToProject, saveQuoteDetalle,
                        saveProjectPayment, deleteProjectPayment, deleteProject,
                        updateProjectStatus, projectPurchases=[], togglePurchase,
                        projectTasks=[], saveProjectTask, deleteProjectTask, toggleProjectTask,
                        config }) => {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [selected, setSelected] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [addQuoteModal, setAddQuoteModal] = useState(false);
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newPay, setNewPay] = useState(null);
  const [newProject, setNewProject] = useState({ name:"", clientId:"", clientName:"", quoteId:"" });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("resumen"); // resumen | compras
  const [purchaseEdit, setPurchaseEdit] = useState({}); // {itemId: {date, supplier}}
  const [showArchived, setShowArchived] = useState(false);
  const [taskModal, setTaskModal]   = useState(false);
  const [editTask, setEditTask]     = useState(null);

  const TASK_TYPES = [
    { id:"reunion",     label:"Reunión",      icon:"🤝" },
    { id:"visita",      label:"Visita",        icon:"🏠" },
    { id:"entrega",     label:"Entrega",       icon:"📦" },
    { id:"seguimiento", label:"Seguimiento",   icon:"📞" },
    { id:"tarea",       label:"Tarea",         icon:"✅" },
    { id:"otro",        label:"Otro",          icon:"📌" },
  ];

  const taskTypeIcon = (type) => TASK_TYPES.find(t=>t.id===type)?.icon || "📌";

  const gcalLink = (task, projName) => {
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent(`[${projName}] ${task.title}`);
    const details = encodeURIComponent(task.notes || "");
    const pad = n => String(n).padStart(2,"0");
    let dates = "";
    if (task.date) {
      const [y,m,d] = task.date.split("-");
      if (task.time) {
        const [hh,mm] = task.time.split(":");
        const start = `${y}${m}${d}T${hh}${mm}00`;
        const dur = parseInt(task.duration||60);
        const endMin = parseInt(mm) + dur;
        const endHH = parseInt(hh) + Math.floor(endMin/60);
        const endMM = endMin % 60;
        const end = `${y}${m}${d}T${pad(endHH)}${pad(endMM)}00`;
        dates = `${start}/${end}`;
      } else {
        dates = `${y}${m}${d}/${y}${m}${d}`;
      }
    }
    return `${base}&text=${title}&details=${details}${dates?`&dates=${dates}`:""}`;
  };

  const blankTask = (projId) => ({
    id: Date.now(), project_id: projId, title:"", type:"tarea",
    date: today(), time:"09:00", duration:60, notes:"", done:false,
  });

  const filt = projects.filter(p => {
    const matchesSearch = (p.name||"").toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name||"").toLowerCase().includes(search.toLowerCase());
    const isArchived = p.status === "Archivado";
    return matchesSearch && (showArchived ? isArchived : !isArchived);
  });

  const proj = projects.find(p => p.id === selected);

  // Get quotes for selected project
  const getProjQuotes = (pid) => {
    const qids = projectQuotes.filter(pq=>pq.project_id===pid).map(pq=>pq.quote_id);
    return quotes.filter(q => qids.includes(q.id));
  };

  // Get payments for selected project
  const getProjPayments = (pid) => projectPayments.filter(p=>p.project_id===pid);

  // Totals
  const calcTotals = (pid) => {
    const qs = getProjQuotes(pid);
    const pps = getProjPayments(pid);
    const totalProject = qs.reduce((s,q)=>s+(q.total||0),0);
    const totalPaid    = pps.reduce((s,p)=>s+(p.amount||0),0);
    return { totalProject, totalPaid, balance: totalProject - totalPaid };
  };

  const openAddPayment = () => {
    setNewPay({ isNew:true, projectId:selected, concept:"", amount:0,
                date: new Date().toISOString().split("T")[0], paymentRequestId:null, paymentType:"empresa" });
    setPayModal(true);
  };

  const handlePrintStatement = () => setPrintModal(true);

  const printStatement = () => {
    if (!proj) return;
    const qs = getProjQuotes(proj.id);
    const pps = getProjPayments(proj.id);
    const { totalProject, totalPaid, balance } = calcTotals(proj.id);
    const pc = config.primaryColor || "#0d6e6e";
    const fmtCOP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
    const w = window.open("","_blank","width=700,height=600");
    w.document.write(`
      <html><head><title>Estado de Cuenta — ${proj.client_name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;color:#1e293b;padding:30px;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-bottom:16px}
        th{background:${pc};color:#fff;padding:8px 12px;text-align:left;font-size:11px}
        td{padding:7px 12px;border-bottom:1px solid #e2e8f0}
        .title{text-align:center;font-size:20px;font-weight:700;color:${pc};margin-bottom:20px;
               padding-bottom:10px;border-bottom:3px solid ${pc}}
        .total-row{background:${pc}22;font-weight:700}
        .saldo-row{background:${pc};color:#fff;font-weight:700;font-size:14px}
        .bank-box{background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:6px;margin-top:16px}
      </style></head><body>
        <div class="title">${proj.client_name}</div>
        <table>
          <thead><tr><th>Cotización</th><th>Detalle</th><th style="text-align:right">Con IVA</th><th style="text-align:right">Sin IVA</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>
            ${qs.map(q=>{
              const pq = projectQuotes.find(x=>x.project_id===proj.id&&x.quote_id===q.id);
              const det = pq?.detalle || "";
              // Robust calculation: recalc from items if needed
              const sinIva = q.subtotalSinIva||0;
              const taxAmt = q.taxAmt||0;
              const subtotal = q.subtotal||0;
              const totalDisc = q.totalDisc||0;
              // conIva = total - sinIva (works regardless of whether subtotalConIva is stored)
              const conIva = (q.total||0) - sinIva;
              return `<tr>
                <td><strong>#${q.number}${(q.version||1)>1?' v'+q.version:''}</strong></td>
                <td>${det}</td>
                <td style="text-align:right">${conIva>0?fmtCOP(conIva):"-"}</td>
                <td style="text-align:right">${sinIva>0?fmtCOP(sinIva):"-"}</td>
                <td style="text-align:right">${fmtCOP(q.total||0)}</td>
              </tr>`;
            }).join("")}
            <tr class="total-row">
              <td colspan="2" style="text-align:right">Total Proyecto</td>
              <td style="text-align:right">${fmtCOP(qs.reduce((s,q)=>s+((q.total||0)-(q.subtotalSinIva||0)),0))}</td>
              <td style="text-align:right">${fmtCOP(qs.reduce((s,q)=>s+(q.subtotalSinIva||0),0))}</td>
              <td style="text-align:right">${fmtCOP(totalProject)}</td>
            </tr>
          </tbody>
        </table>
        ${pps.length ? `
        <table>
          <thead><tr><th>Fecha</th><th>Concepto</th><th>Cuenta</th><th style="text-align:right">Valor</th></tr></thead>
          <tbody>
            ${pps.map(p=>`<tr>
              <td>${p.date||""}</td>
              <td>${p.concept||""}</td>
              <td style="font-size:10px;color:#64748b">${(p.payment_type||"empresa")==="personal"?"Personal":"Empresa"}</td>
              <td style="text-align:right">${fmtCOP(p.amount||0)}</td>
            </tr>`).join("")}
            <tr class="total-row">
              <td colspan="3" style="text-align:right">Total Pagos Recibidos</td>
              <td style="text-align:right">${fmtCOP(totalPaid)}</td>
            </tr>
          </tbody>
        </table>` : ""}
        <table>
          <tbody>
            <tr class="saldo-row">
              <td colspan="3" style="text-align:right;padding:10px 12px">Saldo Pendiente</td>
              <td style="text-align:right;padding:10px 12px">${fmtCOP(balance)}</td>
            </tr>
          </tbody>
        </table>
        ${(()=>{
          const totalSinIva = qs.reduce((s,q)=>s+(q.subtotalSinIva||0),0);
          const totalConIva = qs.reduce((s,q)=>s+(q.total||0),0) - totalSinIva;
          const personal = config.personal || {};
          const hasPersonal = !!(personal.accountHolder || personal.bankAccount);
          // Payments split by type
          const paidEmpresa  = pps.filter(p=>(p.payment_type||"empresa")==="empresa").reduce((s,p)=>s+(p.amount||0),0);
          const paidPersonal = pps.filter(p=>p.payment_type==="personal").reduce((s,p)=>s+(p.amount||0),0);
          // Pending per account
          const pendienteEmpresa  = Math.max(0, totalConIva - paidEmpresa);
          const pendientePersonal = Math.max(0, totalSinIva - paidPersonal);
          return `
          <div style="margin-top:16px">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:6px;margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <strong>Cuenta Empresa</strong> — Consignar a nombre de: ${config.accountHolder||config.companyName||""}<br>
                  NIT: ${config.nit||""} &nbsp;|&nbsp; Cuenta ${config.bankType||"Ahorros"} ${config.bankName||""}: <strong>${config.bankAccount||""}</strong>
                </div>
                <div style="text-align:right;margin-left:20px;white-space:nowrap">
                  <div style="font-size:14px;font-weight:700;color:#0d6e6e">${fmtCOP(pendienteEmpresa)}</div>
                  <div style="font-size:10px;color:#64748b">saldo pendiente</div>
                </div>
              </div>
            </div>
            ${hasPersonal ? `
            <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px;border-radius:6px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <strong>Cuenta Personal</strong> — Consignar a nombre de: ${personal.accountHolder||personal.companyName||""}<br>
                  CC/NIT: ${personal.nit||""} &nbsp;|&nbsp; Cuenta ${personal.bankType||"Ahorros"} ${personal.bankName||""}: <strong>${personal.bankAccount||""}</strong>
                </div>
                <div style="text-align:right;margin-left:20px;white-space:nowrap">
                  <div style="font-size:14px;font-weight:700;color:#1d4ed8">${fmtCOP(pendientePersonal)}</div>
                  <div style="font-size:10px;color:#64748b">saldo pendiente</div>
                </div>
              </div>
            </div>` : "<!-- no personal account configured -->"}
          </div>`;
        })()}
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(), 400);
  };

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700 }}>
            {showArchived ? "📦 Proyectos Archivados" : "Proyectos"}
          </h1>
          <p style={{ color:G.muted }}>
            {showArchived
              ? `${projects.filter(p=>p.status==="Archivado").length} archivado(s)`
              : `${projects.filter(p=>p.status!=="Archivado").length} proyecto(s) activo(s)`}
          </p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>{ setShowArchived(s=>!s); setSearch(""); setSelected(null); }}
            style={{ padding:"7px 14px",borderRadius:7,border:`1px solid ${showArchived?G.accent:G.border}`,
                     background:showArchived?`rgba(59,130,246,.12)`:"transparent",
                     color:showArchived?G.accent:G.muted,cursor:"pointer",fontSize:12,fontFamily:G.font,
                     display:"flex",alignItems:"center",gap:6 }}>
            📦 {showArchived ? "Ver activos" : `Archivados (${projects.filter(p=>p.status==="Archivado").length})`}
          </button>
          {!showArchived && <Btn onClick={()=>{ setNewProject({name:"",clientId:"",clientName:"",quoteId:""}); setNewProjectModal(true); }}>
            + Nuevo Proyecto
          </Btn>}
        </div>
      </div>

      {/* ── Dashboard de saldos ── */}
      {(() => {
        const activos = projects.filter(p=>p.status==="Activo");
        let totalProyecto=0, totalPagadoEmpresa=0, totalPagadoPersonal=0,
            totalConIvaTotal=0, totalSinIvaTotal=0,
            totalUtilidad=0, totalVentaNeta=0, totalPorComprar=0;
        activos.forEach(p => {
          const qs = getProjQuotes(p.id);
          const pps = getProjPayments(p.id);
          qs.forEach(q => {
            const total = q.total || 0;
            const items = (q.items||[]).filter(i=>i.type!=="header");
            const trm = q.trm || 4200;
            let sinIva = 0;
            items.forEach(i => {
              const tax = (i.itemTax !== undefined && i.itemTax !== null)
                ? Number(i.itemTax)
                : (i.tax !== undefined && i.tax !== null ? Number(i.tax) : 19);
              if (tax === 0) {
                const priceCOP = i.manualPrice ? Number(i.manualPrice)
                  : (i.currency==="USD" ? Number(i.price||0)*trm : Number(i.price||0));
                const disc = priceCOP * ((Number(i.discount)||0)/100);
                const qty = Number(i.qty||1);
                sinIva += qty * (priceCOP - disc);
              }
              // Por comprar: items no chuleados
              const purch = (projectPurchases||[]).find(pp=>pp.project_id===p.id&&pp.quote_id===q.id&&pp.item_id===String(i.id));
              if (!purch?.purchased) {
                totalPorComprar += Number(i.costCOP||i.cost||0) * Number(i.qty||1);
              }
            });
            const conIva = total - sinIva;
            totalConIvaTotal  += conIva;
            totalSinIvaTotal  += sinIva;
            totalProyecto     += total;
            totalUtilidad  += q.profit || 0;
            totalVentaNeta += q.ventaNeta || ((q.subtotalConIva||0)+(q.subtotalSinIva||0)) || (total - (q.taxAmt||0));
          });
          totalPagadoEmpresa  += pps.filter(pp=>(pp.payment_type||"empresa")==="empresa").reduce((s,pp)=>s+(pp.amount||0),0);
          totalPagadoPersonal += pps.filter(pp=>pp.payment_type==="personal").reduce((s,pp)=>s+(pp.amount||0),0);
        });
        const saldoEmpresa  = totalConIvaTotal  - totalPagadoEmpresa;
        const saldoPersonal = totalSinIvaTotal  - totalPagadoPersonal;
        const saldoTotal    = saldoEmpresa + saldoPersonal;
        const superavitGlobal = saldoTotal - totalPorComprar;
        return (
          <div style={{ display:"flex",gap:12,marginBottom:20,flexWrap:"wrap" }}>
            <Card style={{ flex:1,minWidth:160,borderLeft:`4px solid ${G.accent}` }}>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>Proyectos Activos</p>
              <p style={{ fontSize:22,fontWeight:700,color:G.accent }}>{activos.length}</p>
              <p style={{ color:G.muted,fontSize:11,marginTop:4 }}>Total: {fmt(totalProyecto)}</p>
            </Card>
            <Card style={{ flex:1,minWidth:160,borderLeft:`4px solid ${G.warn}` }}>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>Saldo Total Pendiente</p>
              <p style={{ fontSize:22,fontWeight:700,color:saldoTotal>0?G.warn:G.success }}>{fmt(saldoTotal)}</p>
              <p style={{ color:G.muted,fontSize:11,marginTop:4 }}>Pagado: {fmt(totalPagadoEmpresa+totalPagadoPersonal)}</p>
            </Card>
            <Card style={{ flex:1,minWidth:160,borderLeft:`4px solid ${G.success}` }}>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>🏢 Saldo Empresa (con IVA)</p>
              <p style={{ fontSize:22,fontWeight:700,color:saldoEmpresa>0?G.warn:G.success }}>{fmt(saldoEmpresa)}</p>
              <p style={{ color:G.muted,fontSize:11,marginTop:4 }}>Total c/IVA: {fmt(totalConIvaTotal)}</p>
            </Card>
            <Card style={{ flex:1,minWidth:160,borderLeft:`4px solid ${G.accentH}` }}>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>👤 Saldo Personal (sin IVA)</p>
              <p style={{ fontSize:22,fontWeight:700,color:saldoPersonal>0?G.warn:G.success }}>{fmt(saldoPersonal)}</p>
              <p style={{ color:G.muted,fontSize:11,marginTop:4 }}>Total s/IVA: {fmt(totalSinIvaTotal)}</p>
            </Card>
            {/* ── Tarjeta Por Cobrar vs Por Comprar ── */}
            <Card style={{ flex:1,minWidth:200,borderLeft:`4px solid ${superavitGlobal>=0?G.success:G.danger}`,
                           background:superavitGlobal>=0?"rgba(16,185,129,.05)":"rgba(239,68,68,.05)" }}>
              <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:8 }}>
                Compras vs Cobros
              </p>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:12,color:G.muted }}>Por cobrar</span>
                <span style={{ fontSize:13,fontWeight:700,color:G.warn,fontFamily:G.mono }}>{fmt(saldoTotal)}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ fontSize:12,color:G.muted }}>Por comprar</span>
                <span style={{ fontSize:13,fontWeight:700,color:"#8b5cf6",fontFamily:G.mono }}>{fmt(totalPorComprar)}</span>
              </div>
              <div style={{ borderTop:`1px solid ${G.border}`,paddingTop:6,display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontSize:12,fontWeight:700,color:superavitGlobal>=0?G.success:G.danger }}>
                  {superavitGlobal>=0?"✅ Superávit":"⚠️ Déficit"}
                </span>
                <span style={{ fontSize:15,fontWeight:700,fontFamily:G.mono,color:superavitGlobal>=0?G.success:G.danger }}>
                  {fmt(Math.abs(superavitGlobal))}
                </span>
              </div>
            </Card>
            {/* ── Tarjeta tiempo promedio ── */}
            {(() => {
              const cerrados = projects.filter(p=>p.status==="Cerrado"||p.status==="Archivado");
              const tiempos  = cerrados.filter(p=>p.created_at).map(p=>
                Math.floor((Date.now()-new Date(p.created_at).getTime())/86400000)
              );
              const promDias = tiempos.length ? Math.round(tiempos.reduce((s,d)=>s+d,0)/tiempos.length) : null;
              const activosDias = activos.filter(p=>p.created_at).map(p=>
                Math.floor((Date.now()-new Date(p.created_at).getTime())/86400000)
              );
              const promActivos = activosDias.length ? Math.round(activosDias.reduce((s,d)=>s+d,0)/activosDias.length) : null;
              return (
                <Card style={{ flex:1,minWidth:160,borderLeft:`4px solid ${G.accent}` }}>
                  <p style={{ color:G.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:8 }}>
                    🕐 Tiempo Proyectos
                  </p>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                    <span style={{ fontSize:12,color:G.muted }}>Prom. activos</span>
                    <span style={{ fontSize:13,fontWeight:700,color:G.accent }}>
                      {promActivos !== null ? `${promActivos}d` : "—"}
                    </span>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                    <span style={{ fontSize:12,color:G.muted }}>Prom. cerrados</span>
                    <span style={{ fontSize:13,fontWeight:700,color:G.success }}>
                      {promDias !== null ? `${promDias}d` : "—"}
                    </span>
                  </div>
                  <div style={{ borderTop:`1px solid ${G.border}`,paddingTop:6 }}>
                    <span style={{ fontSize:11,color:G.muted }}>
                      Basado en {cerrados.length} proyecto{cerrados.length!==1?"s":""} cerrado{cerrados.length!==1?"s":""}
                    </span>
                  </div>
                </Card>
              );
            })()}
          </div>
        );
      })()}

      <div style={{ display:"flex",gap:20,minHeight:600 }}>
        {/* ── Lista de proyectos ── */}
        <div style={{ width:320,flexShrink:0 }}>
          <input placeholder="Buscar proyecto o cliente…" value={search}
            onChange={e=>setSearch(e.target.value)} style={{ marginBottom:12 }} />
          {filt.map(p => {
            const { totalProject, totalPaid, balance } = calcTotals(p.id);
            const isSelected = p.id === selected;
            const pendingTasks = (projectTasks||[]).filter(t => t.project_id === p.id && !t.done).length;
            return (
              <div key={p.id} onClick={()=>setSelected(p.id)}
                style={{ background: isSelected?`rgba(59,130,246,.12)`:G.card,
                         border:`1px solid ${isSelected?G.accent:G.border}`,
                         borderRadius:10,padding:14,marginBottom:8,cursor:"pointer",transition:".15s" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center" }}>
                  <span style={{ fontWeight:700,fontSize:14 }}>{p.client_name}</span>
                  <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                    {pendingTasks > 0 && (
                      <span title={`${pendingTasks} tarea(s) pendiente(s)`}
                        style={{ fontSize:10,padding:"2px 7px",borderRadius:10,fontWeight:700,
                                 background:"rgba(245,158,11,.2)",color:G.warn,
                                 display:"flex",alignItems:"center",gap:3 }}>
                        📅 {pendingTasks}
                      </span>
                    )}
                    <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:700,
                                   background: p.status==="Activo"?"rgba(16,185,129,.15)":"rgba(100,116,139,.15)",
                                   color: p.status==="Activo"?G.success:G.muted }}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <div style={{ color:G.muted,fontSize:12,marginBottom:8 }}>{p.name}</div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12 }}>
                  <span style={{ color:G.muted }}>Total: <strong style={{color:G.text}}>{fmt(totalProject)}</strong></span>
                  <span style={{ color: balance>0?G.warn:G.success }}>
                    Saldo: <strong>{fmt(balance)}</strong>
                  </span>
                </div>
                {p.created_at && (() => {
                  const days = Math.floor((Date.now()-new Date(p.created_at).getTime())/86400000);
                  return (
                    <div style={{ marginTop:6,fontSize:11,color:G.muted }}>
                      🕐 {days === 0 ? "Creado hoy" : `${days} día${days!==1?"s":""} activo`}
                    </div>
                  );
                })()}
              </div>
            );
          })}
          {!filt.length && <p style={{ color:G.muted,textAlign:"center",padding:20 }}>Sin proyectos aún.</p>}
        </div>

        {/* ── Detalle del proyecto ── */}
        {proj ? (
          <div style={{ flex:1 }}>
            <Card style={{ marginBottom:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10 }}>
                <div>
                  <h2 style={{ fontSize:18,fontWeight:700 }}>{proj.client_name}</h2>
                  <p style={{ color:G.muted,fontSize:13 }}>{proj.name}</p>
                  {proj.created_at && (() => {
                    const days = Math.floor((Date.now() - new Date(proj.created_at).getTime()) / 86400000);
                    return (
                      <p style={{ color:G.muted,fontSize:11,marginTop:4 }}>
                        🕐 {days === 0 ? "Creado hoy" : `${days} día${days!==1?"s":""} activo`}
                        <span style={{ marginLeft:8,color:G.border }}>·</span>
                        <span style={{ marginLeft:8,color:G.muted }}>
                          Creado {new Date(proj.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"})}
                        </span>
                      </p>
                    );
                  })()}
                </div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  {proj.status==="Activo" && <>
                    <Btn size="sm" variant="outline" onClick={()=>setAddQuoteModal(true)}>+ Cotización</Btn>
                    <Btn size="sm" variant="success" onClick={openAddPayment}>+ Pago</Btn>
                  </>}
                  <Btn size="sm" variant="primary" onClick={printStatement}>🖨️ Estado de Cuenta</Btn>
                  {proj.status==="Activo"
                    ? <Btn size="sm" variant="ghost" onClick={async()=>{
                        const { balance } = calcTotals(proj.id);
                        if (balance > 0) {
                          const force = await confirm(
                            `Saldo pendiente: ${fmt(balance)}`,
                            "Hay un saldo pendiente. ¿Deseas cerrar el proyecto de todas formas?"
                          );
                          if (!force) return;
                        }
                        const ok = await confirm("¿Cerrar este proyecto?", "Una vez cerrado puedes reabrirlo o archivarlo.");
                        if (ok) updateProjectStatus(proj.id,"Cerrado");
                      }}>🔒 Cerrar</Btn>
                    : proj.status==="Cerrado"
                      ? <>
                          <Btn size="sm" variant="outline" onClick={()=>updateProjectStatus(proj.id,"Activo")}>🔓 Reabrir</Btn>
                          <Btn size="sm" variant="ghost" onClick={async()=>{
                            const ok = await confirm("¿Archivar este proyecto?","Se moverá al archivo y dejará de aparecer en la lista principal.",false);
                            if (ok) { updateProjectStatus(proj.id,"Archivado"); setSelected(null); setShowArchived(false); }
                          }} style={{ color:G.muted,border:`1px solid ${G.border}` }}>📦 Archivar</Btn>
                        </>
                      : proj.status==="Archivado"
                        ? <Btn size="sm" variant="outline" onClick={()=>{ updateProjectStatus(proj.id,"Activo"); setShowArchived(false); }}>📤 Desarchivar</Btn>
                        : <Btn size="sm" variant="outline" onClick={()=>updateProjectStatus(proj.id,"Activo")}>🔓 Reabrir</Btn>
                  }
                  <Btn size="sm" variant="danger" onClick={async()=>{
                    const ok = await confirm("¿Eliminar proyecto?", "Se eliminarán también todas las asociaciones de cotizaciones y pagos.");
                    if (ok) { await deleteProject(proj.id); setSelected(null); }
                  }}>🗑️</Btn>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <div style={{ display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${G.border}` }}>
              {[["resumen","📋 Resumen"],["compras","🛒 Compras"],["tareas","📅 Tareas"]].map(([id,label])=>(
                <button key={id} onClick={()=>setActiveTab(id)}
                  style={{ padding:"8px 20px",background:"none",border:"none",cursor:"pointer",
                           fontFamily:G.font,fontSize:13,fontWeight:activeTab===id?700:400,
                           color:activeTab===id?G.accent:G.muted,
                           borderBottom:activeTab===id?`2px solid ${G.accent}`:"2px solid transparent" }}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab==="compras" && (() => {
              // Get all product items from all quotes in project
              const allItems = [];
              getProjQuotes(proj.id).forEach(q => {
                (q.items||[]).filter(i=>i.type!=="header"&&i.name).forEach(item => {
                  const purch = projectPurchases.find(p=>p.project_id===proj.id&&p.quote_id===q.id&&p.item_id===String(item.id));
                  allItems.push({ ...item, quoteId:q.id, quoteNum:q.number, purchased:purch?.purchased||false,
                                  purchaseDate:purch?.purchase_date||"", purchaseSupplier:purch?.supplier||"", purchaseDbId:purch?.id });
                });
              });
              const totalCosto = allItems.reduce((s,i)=>s+(Number(i.costCOP||i.cost||0)*Number(i.qty||1)),0);
              const comprado   = allItems.filter(i=>i.purchased).reduce((s,i)=>s+(Number(i.costCOP||i.cost||0)*Number(i.qty||1)),0);
              const pendiente  = totalCosto - comprado;
              const anticipos  = getProjPayments(proj.id).reduce((s,p)=>s+(p.amount||0),0);
              const disponible = anticipos - comprado;

              return (
                <div>
                  {/* Resumen financiero compras */}
                  <div style={{ display:"flex",gap:12,marginBottom:16,flexWrap:"wrap" }}>
                    {[
                      ["Total a Comprar", totalCosto, G.muted],
                      ["Ya Comprado", comprado, G.success],
                      ["Por Comprar", pendiente, G.warn],
                      ["Anticipos Recibidos", anticipos, G.accent],
                      ["Disponible para Compras", disponible, disponible>=0?G.success:G.danger],
                    ].map(([label,val,color])=>(
                      <div key={label} style={{ flex:1,minWidth:140,background:G.card,border:`1px solid ${G.border}`,
                                                borderRadius:8,padding:"10px 14px" }}>
                        <p style={{ color:G.muted,fontSize:10,fontWeight:600,textTransform:"uppercase",marginBottom:4 }}>{label}</p>
                        <p style={{ fontFamily:G.mono,fontWeight:700,fontSize:14,color }}>{fmt(val)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Lista de ítems */}
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
                      <thead>
                        <tr style={{ background:G.surface }}>
                          <th style={{ padding:"8px 12px",textAlign:"left",color:G.muted,fontWeight:600,fontSize:11 }}>✓</th>
                          <th style={{ padding:"8px 12px",textAlign:"left",color:G.muted,fontWeight:600,fontSize:11 }}>Ref.</th>
                          <th style={{ padding:"8px 12px",textAlign:"left",color:G.muted,fontWeight:600,fontSize:11 }}>Producto</th>
                          <th style={{ padding:"8px 12px",textAlign:"center",color:G.muted,fontWeight:600,fontSize:11 }}>Qty</th>
                          <th style={{ padding:"8px 12px",textAlign:"right",color:G.muted,fontWeight:600,fontSize:11 }}>Costo Unit.</th>
                          <th style={{ padding:"8px 12px",textAlign:"right",color:G.muted,fontWeight:600,fontSize:11 }}>Total Costo</th>
                          <th style={{ padding:"8px 12px",textAlign:"left",color:G.muted,fontWeight:600,fontSize:11 }}>Proveedor</th>
                          <th style={{ padding:"8px 12px",textAlign:"left",color:G.muted,fontWeight:600,fontSize:11 }}>Fecha Compra</th>
                          <th style={{ padding:"8px 12px",textAlign:"left",color:G.muted,fontWeight:600,fontSize:11 }}>Cotiz.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allItems.map((item,idx)=>{
                          const costUnit = Number(item.costCOP||item.cost||0);
                          const costTotal = costUnit * Number(item.qty||1);
                          const editKey = `${item.quoteId}-${item.id}`;
                          const edit = purchaseEdit[editKey] || {};
                          return (
                            <tr key={editKey} style={{
                              background: item.purchased?"rgba(16,185,129,.05)":"transparent",
                              borderBottom:`1px solid ${G.border}`,
                              opacity: item.purchased ? 0.75 : 1
                            }}>
                              <td style={{ padding:"8px 12px" }}>
                                <input type="checkbox" checked={item.purchased}
                                  onChange={async()=>{
                                    const d = edit.date || item.purchaseDate || new Date().toISOString().split("T")[0];
                                    const s = edit.supplier || item.purchaseSupplier || "";
                                    await togglePurchase(proj.id, item.quoteId, item.id, item.purchased, d, s);
                                  }}
                                  style={{ width:16,height:16,cursor:"pointer",accentColor:G.success }} />
                              </td>
                              <td style={{ padding:"8px 12px",fontFamily:G.mono,color:G.accent,fontSize:11 }}>{item.sku||"—"}</td>
                              <td style={{ padding:"8px 12px",fontWeight:item.purchased?400:500,
                                           textDecoration:item.purchased?"line-through":"none",
                                           color:item.purchased?G.muted:G.text }}>
                                {item.name}
                              </td>
                              <td style={{ padding:"8px 12px",textAlign:"center",fontFamily:G.mono }}>{item.qty} {item.unit}</td>
                              <td style={{ padding:"8px 12px",textAlign:"right",fontFamily:G.mono,color:G.muted }}>{fmt(costUnit)}</td>
                              <td style={{ padding:"8px 12px",textAlign:"right",fontFamily:G.mono,fontWeight:600 }}>{fmt(costTotal)}</td>
                              <td style={{ padding:"6px 8px" }}>
                                <input value={edit.supplier!==undefined?edit.supplier:(item.purchaseSupplier||"")}
                                  onChange={e=>setPurchaseEdit(pe=>({...pe,[editKey]:{...pe[editKey],supplier:e.target.value}}))}
                                  onBlur={async e=>{ if(item.purchased) await togglePurchase(proj.id,item.quoteId,item.id,item.purchased,edit.date||item.purchaseDate,e.target.value); }}
                                  placeholder="Proveedor…"
                                  style={{ fontSize:11,padding:"3px 6px",width:"100%",minWidth:100 }} />
                              </td>
                              <td style={{ padding:"6px 8px" }}>
                                <input type="date" value={edit.date!==undefined?edit.date:(item.purchaseDate||"")}
                                  onChange={e=>setPurchaseEdit(pe=>({...pe,[editKey]:{...pe[editKey],date:e.target.value}}))}
                                  onBlur={async e=>{ if(item.purchased) await togglePurchase(proj.id,item.quoteId,item.id,item.purchased,e.target.value,edit.supplier||item.purchaseSupplier); }}
                                  style={{ fontSize:11,padding:"3px 6px" }} />
                              </td>
                              <td style={{ padding:"8px 12px",color:G.muted,fontSize:11 }}>#{item.quoteNum}</td>
                            </tr>
                          );
                        })}
                        {!allItems.length && (
                          <tr><td colSpan={9} style={{ textAlign:"center",color:G.muted,padding:24 }}>
                            Sin productos en las cotizaciones de este proyecto.
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {activeTab==="resumen" && <>
            {/* Cotizaciones del proyecto */}
            <Card style={{ marginBottom:16,padding:0,overflow:"hidden" }}>
              <div style={{ padding:"12px 16px",borderBottom:`1px solid ${G.border}`,fontWeight:700,fontSize:13 }}>
                📋 Cotizaciones
              </div>
              <table>
                <thead><tr><th>#</th><th>Detalle</th><th>Fecha</th><th>Estado</th><th style={{textAlign:"right"}}>Total</th></tr></thead>
                <tbody>
                  {getProjQuotes(proj.id).map(q=>(
                    <tr key={q.id}>
                      <td style={{ fontFamily:G.mono,color:G.accent,whiteSpace:"nowrap" }}>
                        #{q.number}{(q.version||1)>1?` v${q.version}`:""}
                      </td>
                      <td>
                        <input
                          defaultValue={projectQuotes.find(pq=>pq.project_id===proj.id&&pq.quote_id===q.id)?.detalle||""}
                          onBlur={e=>saveQuoteDetalle(proj.id, q.id, e.target.value)}
                          placeholder="Describe el alcance…"
                          style={{ fontSize:12,padding:"3px 8px" }} />
                      </td>
                      <td style={{ color:G.muted,whiteSpace:"nowrap" }}>{q.date}</td>
                      <td><StatusBadge s={q.status} /></td>
                      <td style={{ textAlign:"right",fontFamily:G.mono,fontWeight:700,whiteSpace:"nowrap" }}>{fmt(q.total||0)}</td>
                    </tr>
                  ))}
                  <tr style={{ background:`rgba(59,130,246,.06)` }}>
                    <td colSpan={4} style={{ textAlign:"right",fontWeight:700,color:G.accent }}>Total Proyecto</td>
                    <td style={{ textAlign:"right",fontFamily:G.mono,fontWeight:700,color:G.accent,fontSize:15 }}>
                      {fmt(calcTotals(proj.id).totalProject)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>

            {/* Pagos */}
            <Card style={{ padding:0,overflow:"hidden",marginBottom:16 }}>
              <div style={{ padding:"12px 16px",borderBottom:`1px solid ${G.border}`,fontWeight:700,fontSize:13 }}>
                💰 Pagos Recibidos
              </div>
              <table>
                <thead><tr><th>Fecha</th><th>Concepto</th><th style={{textAlign:"right"}}>Valor</th><th></th></tr></thead>
                <tbody>
                  {getProjPayments(proj.id).map(pp=>(
                    <tr key={pp.id}>
                      <td style={{ color:G.muted }}>{pp.date}</td>
                      <td>
                        {pp.concept}
                        <span style={{ marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700,
                          background:(pp.payment_type||"empresa")==="personal"?"rgba(59,130,246,.1)":"rgba(16,185,129,.1)",
                          color:(pp.payment_type||"empresa")==="personal"?G.accent:G.success }}>
                          {(pp.payment_type||"empresa")==="personal"?"👤 Personal":"🏢 Empresa"}
                        </span>
                      </td>
                      <td style={{ textAlign:"right",fontFamily:G.mono,fontWeight:600,color:G.success }}>{fmt(pp.amount||0)}</td>
                      <td>
                        <button onClick={async()=>{ const ok=await confirm("¿Eliminar pago?","Esta acción no se puede deshacer."); if(ok) deleteProjectPayment(pp.id); }}
                          style={{ background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:16 }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!getProjPayments(proj.id).length && (
                    <tr><td colSpan={4} style={{ textAlign:"center",color:G.muted,padding:16 }}>Sin pagos registrados.</td></tr>
                  )}
                  {getProjPayments(proj.id).length > 0 && (
                    <tr style={{ background:"rgba(16,185,129,.06)" }}>
                      <td colSpan={2} style={{ textAlign:"right",fontWeight:700,color:G.success }}>Total Pagos</td>
                      <td style={{ textAlign:"right",fontFamily:G.mono,fontWeight:700,color:G.success,fontSize:15 }}>
                        {fmt(calcTotals(proj.id).totalPaid)}
                      </td>
                      <td/>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            {/* Saldo */}
            {(() => {
              const { totalProject, totalPaid, balance } = calcTotals(proj.id);
              // Calcular "por comprar": costo de items NO chuleados en pestaña compras
              const allProjQuotes = getProjQuotes(proj.id);
              const porComprar = allProjQuotes.reduce((total, q) => {
                return total + (q.items||[]).filter(i=>i.type!=="header"&&i.name).reduce((s,i) => {
                  const purch = (projectPurchases||[]).find(pp=>pp.project_id===proj.id&&pp.quote_id===q.id&&pp.item_id===String(i.id));
                  if (purch?.purchased) return s;
                  const cost = Number(i.costCOP||i.cost||0);
                  return s + cost * Number(i.qty||1);
                }, 0);
              }, 0);
              const superavit  = balance - porComprar;
              return (
                <>
                  <Card style={{ background: balance>0?"rgba(245,158,11,.08)":"rgba(16,185,129,.08)",
                                 border:`1px solid ${balance>0?"rgba(245,158,11,.3)":"rgba(16,185,129,.3)"}`,
                                 marginBottom:12 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <span style={{ fontWeight:700,fontSize:16 }}>Saldo Pendiente</span>
                      <span style={{ fontFamily:G.mono,fontWeight:700,fontSize:22,
                                     color: balance>0?G.warn:G.success }}>
                        {fmt(balance)}
                      </span>
                    </div>
                    {balance<=0 && <p style={{ color:G.success,fontSize:12,marginTop:4 }}>✅ Proyecto pagado completamente</p>}
                  </Card>

                  {/* Tarjeta superávit para compras */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                    <Card style={{ borderLeft:`3px solid ${G.warn}` }}>
                      <p style={{ fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",marginBottom:6 }}>Por Cobrar</p>
                      <p style={{ fontSize:18,fontWeight:700,color:G.warn,fontFamily:G.mono }}>{fmt(balance)}</p>
                      <p style={{ fontSize:11,color:G.muted,marginTop:4 }}>Saldo pendiente del cliente</p>
                    </Card>
                    <Card style={{ borderLeft:`3px solid #8b5cf6` }}>
                      <p style={{ fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",marginBottom:6 }}>Por Comprar</p>
                      <p style={{ fontSize:18,fontWeight:700,color:"#8b5cf6",fontFamily:G.mono }}>{fmt(porComprar)}</p>
                      <p style={{ fontSize:11,color:G.muted,marginTop:4 }}>Costo estimado pendiente</p>
                    </Card>
                    <Card style={{ borderLeft:`3px solid ${superavit>=0?G.success:G.danger}`,
                                   background: superavit>=0?"rgba(16,185,129,.06)":"rgba(239,68,68,.06)" }}>
                      <p style={{ fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",marginBottom:6 }}>
                        {superavit>=0?"✅ Superávit":"⚠️ Déficit"}
                      </p>
                      <p style={{ fontSize:18,fontWeight:700,color:superavit>=0?G.success:G.danger,fontFamily:G.mono }}>
                        {fmt(Math.abs(superavit))}
                      </p>
                      <p style={{ fontSize:11,color:G.muted,marginTop:4 }}>
                        {superavit>=0?"Disponible para compras":"Falta para cubrir costos"}
                      </p>
                    </Card>
                  </div>
                </>
              );
            })()}
            </>}

            {/* ── Tab: Tareas ── */}
            {activeTab==="tareas" && (() => {
              const tasks = projectTasks.filter(t => t.project_id === proj.id);
              const pending = tasks.filter(t => !t.done);
              const done    = tasks.filter(t =>  t.done);
              return (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                    <div>
                      <span style={{ fontWeight:700,fontSize:14 }}>Tareas y Citas</span>
                      <span style={{ marginLeft:10,fontSize:12,color:G.muted }}>
                        {pending.length} pendiente{pending.length!==1?"s":""}
                      </span>
                    </div>
                    <Btn size="sm" onClick={()=>{ setEditTask(blankTask(proj.id)); setTaskModal(true); }}>
                      + Nueva Tarea
                    </Btn>
                  </div>

                  {/* Empty state */}
                  {!tasks.length && (
                    <Card style={{ textAlign:"center",padding:"30px 16px" }}>
                      <div style={{ fontSize:32,marginBottom:8 }}>📅</div>
                      <p style={{ fontWeight:600,fontSize:13,marginBottom:6 }}>Sin tareas aún</p>
                      <p style={{ color:G.muted,fontSize:12 }}>
                        Crea reuniones, visitas, entregas o recordatorios<br/>
                        y sincronízalos con Google Calendar en un clic.
                      </p>
                    </Card>
                  )}

                  {/* Pending tasks */}
                  {pending.map(task => (
                    <Card key={task.id} style={{ marginBottom:10,padding:"12px 14px" }}>
                      <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                        {/* Done checkbox */}
                        <input type="checkbox" checked={!!task.done}
                          onChange={e => toggleProjectTask(task.id, e.target.checked)}
                          style={{ marginTop:3,flexShrink:0,width:16,height:16,cursor:"pointer" }} />
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                            <span style={{ fontSize:16 }}>{taskTypeIcon(task.type)}</span>
                            <span style={{ fontWeight:700,fontSize:14 }}>{task.title}</span>
                            <span style={{ fontSize:11,background:"rgba(59,130,246,.1)",color:G.accent,
                                           padding:"2px 8px",borderRadius:10,fontWeight:600 }}>
                              {TASK_TYPES.find(t=>t.id===task.type)?.label||task.type}
                            </span>
                          </div>
                          <div style={{ display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:G.muted }}>
                            {task.date && (
                              <span>📅 {new Date(task.date+"T12:00:00").toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})}</span>
                            )}
                            {task.time && <span>🕐 {task.time}</span>}
                            {task.duration && <span>⏱️ {task.duration} min</span>}
                          </div>
                          {task.notes && (
                            <p style={{ fontSize:12,color:G.muted,marginTop:6,
                                        fontStyle:"italic",borderLeft:`2px solid ${G.border}`,paddingLeft:8 }}>
                              {task.notes}
                            </p>
                          )}
                        </div>
                        {/* Actions */}
                        <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                          <a href={gcalLink(task, proj.name)} target="_blank" rel="noopener noreferrer"
                            title="Abrir en Google Calendar"
                            style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 10px",
                                     borderRadius:6,border:`1px solid ${G.border}`,
                                     background:"#fff",color:"#1a73e8",fontSize:12,fontWeight:600,
                                     textDecoration:"none",cursor:"pointer" }}>
                            <img src="https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_20_2x.png"
                              style={{ width:14,height:14,objectFit:"contain" }} alt="" />
                            GCal
                          </a>
                          <button onClick={()=>{ setEditTask({...task}); setTaskModal(true); }}
                            title="Editar tarea"
                            style={{ background:"transparent",border:`1px solid ${G.border}`,borderRadius:6,
                                     padding:"4px 8px",cursor:"pointer",fontSize:13,color:G.muted }}>
                            ✏️
                          </button>
                          <button onClick={async()=>{
                              const ok = await confirm(`¿Eliminar "${task.title}"?`,"Esta acción no se puede deshacer.");
                              if (ok) deleteProjectTask(task.id);
                            }}
                            title="Eliminar tarea"
                            style={{ background:"transparent",border:`1px solid rgba(239,68,68,.3)`,
                                     borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:13,color:G.danger }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Completed tasks (collapsed) */}
                  {done.length > 0 && (
                    <details style={{ marginTop:16 }}>
                      <summary style={{ cursor:"pointer",fontSize:13,color:G.muted,
                                        padding:"8px 0",userSelect:"none" }}>
                        ✅ {done.length} completada{done.length!==1?"s":""} — clic para ver
                      </summary>
                      <div style={{ marginTop:8 }}>
                        {done.map(task => (
                          <Card key={task.id} style={{ marginBottom:8,padding:"10px 14px",opacity:.6 }}>
                            <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                              <input type="checkbox" checked={true}
                                onChange={e => toggleProjectTask(task.id, e.target.checked)}
                                style={{ flexShrink:0,cursor:"pointer" }} />
                              <span style={{ fontSize:14,textDecoration:"line-through",color:G.muted }}>
                                {taskTypeIcon(task.type)} {task.title}
                              </span>
                              {task.date && <span style={{ fontSize:12,color:G.muted }}>{task.date}</span>}
                              <button onClick={async()=>{
                                  const ok = await confirm(`¿Eliminar "${task.title}"?`,"");
                                  if (ok) deleteProjectTask(task.id);
                                }}
                                style={{ marginLeft:"auto",background:"transparent",border:"none",
                                         cursor:"pointer",color:G.danger,fontSize:13 }}>🗑️</button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:G.muted }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:48,marginBottom:12 }}>🏗️</div>
              <p>Selecciona un proyecto para ver el detalle</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal: nuevo proyecto */}
      {newProjectModal && (
        <Modal title="Nuevo Proyecto" onClose={()=>setNewProjectModal(false)}>
          <div style={{ display:"grid",gap:14 }}>
            <Field label="Cliente">
              <select value={newProject.clientId}
                onChange={e=>{
                  const c = clients.find(x=>String(x.id)===e.target.value);
                  setNewProject({...newProject, clientId:e.target.value, clientName:c?.name||"", quoteId:""});
                }}>
                <option value="">— Seleccionar cliente —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Nombre del Proyecto">
              <input value={newProject.name}
                onChange={e=>setNewProject({...newProject,name:e.target.value})}
                placeholder="Ej: Casa 10 Saint Regis — Automatización" />
            </Field>
            {newProject.clientId && (
              <Field label="Cotización inicial (opcional)">
                <select value={newProject.quoteId||""}
                  onChange={e=>setNewProject({...newProject,quoteId:e.target.value})}>
                  <option value="">— Sin cotización inicial —</option>
                  {quotes
                    .filter(q=>String(q.clientId||q.client_id)===String(newProject.clientId) && q.isLatest!==false)
                    .map(q=>(
                      <option key={q.id} value={q.id}>
                        #{q.number} — {fmt(q.total||0)} ({q.status})
                      </option>
                    ))
                  }
                </select>
              </Field>
            )}
          </div>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>setNewProjectModal(false)}>Cancelar</Btn>
            <Btn variant="success" onClick={async()=>{
              if (!newProject.clientId || !newProject.name) { alert("Selecciona cliente y nombre"); return; }
              const proj = await createProject({ clientId:newProject.clientId, clientName:newProject.clientName, name:newProject.name });
              if (proj && newProject.quoteId) {
                await addQuoteToProject(proj.id, Number(newProject.quoteId));
                setSelected(proj.id);
              }
              setNewProjectModal(false);
            }}>💾 Crear Proyecto</Btn>
          </div>
        </Modal>
      )}

      {confirmDialog}

      {/* Modal: nueva / editar tarea */}
      {taskModal && editTask && (
        <Modal title={editTask.id && typeof editTask.id==="number" && editTask.id < 1e12 ? "Editar Tarea" : "Nueva Tarea"} onClose={()=>{ setTaskModal(false); setEditTask(null); }} width={520}>
          <div style={{ display:"grid",gap:14 }}>
            <Field label="Título *">
              <input value={editTask.title} onChange={e=>setEditTask(t=>({...t,title:e.target.value}))}
                placeholder="Ej: Reunión de avance, Visita de instalación…" autoFocus />
            </Field>
            <Field label="Tipo">
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {TASK_TYPES.map(tt => (
                  <button key={tt.id} onClick={()=>setEditTask(t=>({...t,type:tt.id}))}
                    style={{ padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:G.font,
                             fontWeight:editTask.type===tt.id?700:400,
                             background:editTask.type===tt.id?`rgba(59,130,246,.15)`:"transparent",
                             border:`1px solid ${editTask.type===tt.id?G.accent:G.border}`,
                             color:editTask.type===tt.id?G.accent:G.muted }}>
                    {tt.icon} {tt.label}
                  </button>
                ))}
              </div>
            </Field>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
              <Field label="Fecha">
                <input type="date" value={editTask.date||""} onChange={e=>setEditTask(t=>({...t,date:e.target.value}))} />
              </Field>
              <Field label="Hora">
                <input type="time" value={editTask.time||""} onChange={e=>setEditTask(t=>({...t,time:e.target.value}))} />
              </Field>
              <Field label="Duración (min)">
                <select value={editTask.duration||60} onChange={e=>setEditTask(t=>({...t,duration:Number(e.target.value)}))}>
                  {[15,30,45,60,90,120,180,240].map(d=>(
                    <option key={d} value={d}>{d < 60 ? `${d} min` : `${d/60}h` + (d%60 ? ` ${d%60}min` : "")}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <textarea value={editTask.notes||""} onChange={e=>setEditTask(t=>({...t,notes:e.target.value}))}
                rows={3} placeholder="Agenda, instrucciones, dirección…"
                style={{ width:"100%",resize:"vertical" }} />
            </Field>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4 }}>
              {editTask.date ? (
                <a href={gcalLink(editTask, projects.find(p=>p.id===editTask.project_id)?.name||"")}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
                           borderRadius:7,border:`1px solid #dadce0`,background:"#fff",
                           color:"#1a73e8",fontSize:12,fontWeight:600,textDecoration:"none" }}>
                  <img src="https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_20_2x.png"
                    style={{ width:16,height:16 }} alt="" />
                  Abrir en Google Calendar
                </a>
              ) : <div />}
              <div style={{ display:"flex",gap:8 }}>
                <Btn variant="ghost" onClick={()=>{ setTaskModal(false); setEditTask(null); }}>Cancelar</Btn>
                <Btn onClick={async()=>{
                  if (!editTask.title.trim()) { alert("La tarea necesita un título."); return; }
                  await saveProjectTask(editTask);
                  setTaskModal(false); setEditTask(null);
                }}>💾 Guardar</Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: registrar pago */}
      {payModal && newPay && (
        <Modal title="Registrar Pago" onClose={()=>setPayModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <Field label="Fecha">
              <input type="date" value={newPay.date} onChange={e=>setNewPay({...newPay,date:e.target.value})} />
            </Field>
            <Field label="Valor">
              <NumInput value={newPay.amount||0} onChange={v=>setNewPay({...newPay,amount:v})} />
            </Field>
            <Field label="Concepto" style={{ gridColumn:"1/-1" }}>
              <input value={newPay.concept} onChange={e=>setNewPay({...newPay,concept:e.target.value})}
                placeholder="Ej: Anticipo 1, Pago parcial…" />
            </Field>
            <Field label="Tipo de Cuenta" style={{ gridColumn:"1/-1" }}>
              <div style={{ display:"flex",gap:10 }}>
                {["empresa","personal"].map(t=>(
                  <button key={t} onClick={()=>setNewPay({...newPay,paymentType:t})}
                    style={{ flex:1,padding:"7px",borderRadius:6,cursor:"pointer",fontFamily:G.font,fontWeight:600,fontSize:12,
                             background:(newPay.paymentType||"empresa")===t?`rgba(59,130,246,.2)`:"transparent",
                             border:`1px solid ${(newPay.paymentType||"empresa")===t?G.accent:G.border}`,
                             color:(newPay.paymentType||"empresa")===t?G.accent:G.muted }}>
                    {t==="empresa"?"🏢 Empresa (con IVA)":"👤 Personal (sin IVA)"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Vincular Cuenta de Cobro (opcional)" style={{ gridColumn:"1/-1" }}>
              <select value={newPay.paymentRequestId||""} onChange={e=>setNewPay({...newPay,paymentRequestId:e.target.value||null})}>
                <option value="">— Sin vincular —</option>
                {paymentRequests
                  .filter(pr => getProjQuotes(selected).some(q=>q.id===pr.quote_id))
                  .map(pr=>(
                    <option key={pr.id} value={pr.id}>{pr.number} — {fmt(pr.amount||0)}</option>
                  ))
                }
              </select>
            </Field>
          </div>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>setPayModal(false)}>Cancelar</Btn>
            <Btn variant="success" onClick={async()=>{
              await saveProjectPayment(newPay);
              setPayModal(false);
            }}>💾 Guardar Pago</Btn>
          </div>
        </Modal>
      )}

      {/* Modal: agregar cotización al proyecto */}
      {addQuoteModal && proj && (
        <Modal title="Agregar Cotización al Proyecto" onClose={()=>setAddQuoteModal(false)}>
          <p style={{ color:G.muted,fontSize:13,marginBottom:14 }}>
            Selecciona una cotización del mismo cliente para agregarla al proyecto.
          </p>
          <div style={{ maxHeight:400,overflowY:"auto" }}>
            {quotes
              .filter(q => {
                const clientMatch = String(q.clientId||q.client_id) === String(proj.client_id);
                const notInProject = !projectQuotes.find(pq=>pq.project_id===proj.id&&pq.quote_id===q.id);
                const projActive = proj.status === "Activo";
                return clientMatch && notInProject && q.isLatest!==false && projActive;
              })
              .map(q=>(
                <div key={q.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                                          padding:"10px 0",borderBottom:`1px solid ${G.border}` }}>
                  <div>
                    <span style={{ fontFamily:G.mono,color:G.accent }}>#{q.number}</span>
                    <span style={{ marginLeft:8,color:G.muted,fontSize:12 }}>{q.date}</span>
                    <span style={{ marginLeft:8,fontFamily:G.mono }}>{fmt(q.total||0)}</span>
                  </div>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <StatusBadge s={q.status} />
                    <Btn size="sm" variant="outline" onClick={async()=>{
                      await addQuoteToProject(proj.id, q.id);
                      setAddQuoteModal(false);
                    }}>+ Agregar</Btn>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:14 }}>
            <Btn variant="ghost" onClick={()=>setAddQuoteModal(false)}>Cerrar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── KITS VIEW ────────────────────────────────────────────────────
const KitsView = ({ templates, saveTemplate, deleteTemplate, updateTemplate, products }) => {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [selected, setSelected]   = useState(null); // id of kit being edited, "new" for new
  const [kitName, setKitName]     = useState("");
  const [kitDesc, setKitDesc]     = useState("");
  const [kitItems, setKitItems]   = useState([]);
  const [prodSearch, setProdSearch] = useState("");
  const [prodCat, setProdCat]     = useState("Todos");
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");

  const cats = ["Todos", ...[...new Set(products.map(p=>p.category).filter(Boolean))].sort()];
  const filtProd = products.filter(p => {
    const ms = p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
               (p.sku||"").toLowerCase().includes(prodSearch.toLowerCase());
    const mc = prodCat==="Todos" || p.category===prodCat;
    return ms && mc;
  });

  const openNew = () => {
    setSelected("new"); setKitName(""); setKitDesc(""); setKitItems([]); setProdSearch("");
  };

  const openEdit = (t) => {
    setSelected(t.id); setKitName(t.name); setKitDesc(t.description||"");
    setKitItems((t.items||[]).map(i => ({...i, id: i.id||Date.now()+Math.random()})));
    setProdSearch("");
  };

  const addProd = (p) => {
    const item = { id: Date.now()+Math.random(), productId: p.id, sku: p.sku||"",
                   name: p.name, qty: 1, price: p.price||0, cost: p.cost||0,
                   currency: p.currency||"COP", unit: p.unit||"pza",
                   discount: 0, tax: p.tax!==undefined?p.tax:19,
                   imageUrl: p.imageUrl||p.image_url||"" };
    setKitItems(its => [...its, item]);
  };

  const addHeader = () => {
    setKitItems(its => [...its, { id: Date.now()+Math.random(), type:"header", name:"" }]);
  };

  const updateItem = (id, k, v) =>
    setKitItems(its => its.map(i => i.id===id ? {...i, [k]: v} : i));

  const removeItem = (id) => setKitItems(its => its.filter(i => i.id!==id));

  const handleSave = async () => {
    if (!kitName.trim()) { alert("El kit necesita un nombre."); return; }
    if (saving) return;
    setSaving(true);
    try {
      if (selected === "new") {
        await saveTemplate(kitName.trim(), kitDesc.trim(), kitItems);
      } else {
        await updateTemplate(selected, kitName.trim(), kitDesc.trim(), kitItems);
      }
      setSelected(null);
    } finally { setSaving(false); }
  };

  const filtKits = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:"16px max(16px, min(30px, 3vw))", display:"flex", gap:20, alignItems:"flex-start" }}>

      {/* ── Panel izquierdo: lista de kits ── */}
      <div style={{ width:300, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700 }}>🧩 Kits</h1>
            <p style={{ color:G.muted, fontSize:12 }}>{templates.length} kit(s)</p>
          </div>
          <Btn onClick={openNew}>+ Nuevo Kit</Btn>
        </div>

        <input placeholder="Buscar kit…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ marginBottom:12, width:"100%" }} />

        {!templates.length && (
          <Card style={{ textAlign:"center", padding:"30px 16px" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🧩</div>
            <p style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>Sin kits aún</p>
            <p style={{ color:G.muted, fontSize:12 }}>
              Crea tu primer kit con<br/>"+ Nuevo Kit"
            </p>
          </Card>
        )}

        {filtKits.map(t => {
          const prodCount = (t.items||[]).filter(i=>i.type!=="header").length;
          const isSelected = selected === t.id;
          return (
            <div key={t.id} onClick={()=>openEdit(t)}
              style={{ background: isSelected?`rgba(59,130,246,.12)`:G.card,
                       border:`1px solid ${isSelected?G.accent:G.border}`,
                       borderRadius:10, padding:"12px 14px", marginBottom:8,
                       cursor:"pointer", transition:".15s",
                       borderLeft: isSelected?`3px solid ${G.accent}`:`3px solid transparent` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{t.name}</div>
                  {t.description && (
                    <div style={{ color:G.muted, fontSize:11, marginBottom:4,
                                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {t.description}
                    </div>
                  )}
                  <span style={{ fontSize:11, background:"rgba(59,130,246,.1)", color:G.accent,
                                 padding:"2px 7px", borderRadius:10, fontWeight:600 }}>
                    {prodCount} producto{prodCount!==1?"s":""}
                  </span>
                </div>
                <button onClick={async e => {
                    e.stopPropagation();
                    const ok = await confirm(`¿Eliminar kit "${t.name}"?`, "Esta acción no se puede deshacer.");
                    if (ok) { deleteTemplate(t.id); if (selected===t.id) setSelected(null); }
                  }}
                  title="Eliminar kit"
                  style={{ background:"transparent", border:"none", cursor:"pointer",
                           color:G.danger, fontSize:14, marginLeft:8, flexShrink:0 }}>
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Panel derecho: editor de kit ── */}
      {selected ? (
        <div style={{ flex:1, minWidth:0 }}>
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontSize:16, fontWeight:700 }}>
                {selected==="new" ? "🆕 Nuevo Kit" : `✏️ Editando: ${kitName}`}
              </h2>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="ghost" onClick={()=>setSelected(null)}>Cancelar</Btn>
                <Btn onClick={handleSave}>{saving?"Guardando…":"💾 Guardar Kit"}</Btn>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Nombre del Kit *">
                <input value={kitName} onChange={e=>setKitName(e.target.value)}
                  placeholder="Ej: Sala Automatizada, Kit Seguridad Básico…" />
              </Field>
              <Field label="Descripción (opcional)">
                <input value={kitDesc} onChange={e=>setKitDesc(e.target.value)}
                  placeholder="Breve descripción del kit" />
              </Field>
            </div>
          </Card>

          {/* Selector de productos */}
          <Card style={{ marginBottom:16 }}>
            <p style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Agregar del Catálogo</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              {cats.map(cat=>(
                <button key={cat} onClick={()=>setProdCat(cat)}
                  style={{ padding:"3px 10px", borderRadius:12, cursor:"pointer", fontSize:11, fontWeight:600,
                           fontFamily:G.font, transition:".15s",
                           background: prodCat===cat?G.accent:"transparent",
                           border:`1px solid ${prodCat===cat?G.accent:G.border}`,
                           color: prodCat===cat?"#fff":G.muted }}>
                  {cat}
                </button>
              ))}
            </div>
            <input placeholder="Buscar producto o SKU…" value={prodSearch}
              onChange={e=>setProdSearch(e.target.value)} style={{ marginBottom:10 }} />
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, maxHeight:120, overflowY:"auto" }}>
              {filtProd.map(p=>(
                <button key={p.id} onClick={()=>addProd(p)}
                  style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:6,
                           padding:"6px 12px", color:G.text, cursor:"pointer", fontSize:12,
                           fontFamily:G.font, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:G.accent, fontFamily:G.mono, fontSize:11,
                                 background:"rgba(59,130,246,.1)", padding:"1px 6px", borderRadius:4 }}>
                    {p.sku||"—"}
                  </span>
                  <span>{p.name}</span>
                  <span style={{ fontSize:10, padding:"1px 6px", borderRadius:10,
                                 background:p.currency==="USD"?"rgba(245,158,11,.15)":"rgba(16,185,129,.15)",
                                 color:p.currency==="USD"?G.warn:G.success, fontWeight:700 }}>
                    {p.currency||"COP"}
                  </span>
                </button>
              ))}
              {!filtProd.length && (
                <span style={{ color:G.muted, fontSize:12 }}>Sin coincidencias.</span>
              )}
            </div>
            <div style={{ marginTop:10 }}>
              <button onClick={addHeader}
                style={{ background:"rgba(59,130,246,.1)", border:`1px solid ${G.accent}`, color:G.accent,
                         borderRadius:6, padding:"5px 14px", cursor:"pointer", fontSize:12,
                         fontFamily:G.font, fontWeight:600 }}>
                + Encabezado de Sección
              </button>
            </div>
          </Card>

          {/* Tabla de ítems del kit */}
          {kitItems.length > 0 && (
            <Card style={{ padding:0, overflow:"visible" }}>
              <table style={{ minWidth:600 }}>
                <thead><tr>
                  <th>Producto</th>
                  <th style={{ width:70 }}>Qty</th>
                  <th style={{ width:140 }}>Precio Unit.</th>
                  <th style={{ width:80 }}>IVA%</th>
                  <th style={{ width:80 }}>Mon.</th>
                  <th style={{ width:36 }}></th>
                </tr></thead>
                <tbody>
                  {kitItems.map(item => item.type==="header" ? (
                    <tr key={item.id} style={{ background:"rgba(59,130,246,.06)" }}>
                      <td colSpan={5}>
                        <input value={item.name||""} onChange={e=>updateItem(item.id,"name",e.target.value)}
                          placeholder="Nombre de la sección…"
                          style={{ fontWeight:700, background:"transparent", border:"none",
                                   width:"100%", color:G.accent, fontSize:12 }} />
                      </td>
                      <td>
                        <button onClick={()=>removeItem(item.id)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:G.danger }}>✕</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="" style={{ width:24, height:24,
                                  objectFit:"contain", borderRadius:4, flexShrink:0 }} />
                          )}
                          <div>
                            <div style={{ fontSize:13, fontWeight:500 }}>{item.name}</div>
                            {item.sku && <div style={{ fontSize:11, color:G.muted }}>{item.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <input type="number" min={1} value={item.qty||1}
                          onChange={e=>updateItem(item.id,"qty",Number(e.target.value)||1)}
                          style={{ width:60 }} />
                      </td>
                      <td>
                        <input type="number" min={0} value={item.price||0}
                          onChange={e=>updateItem(item.id,"price",Number(e.target.value)||0)}
                          style={{ width:120 }} />
                      </td>
                      <td>
                        <input type="number" min={0} max={100} value={item.tax!==undefined?item.tax:19}
                          onChange={e=>updateItem(item.id,"tax",Number(e.target.value))}
                          style={{ width:60 }} />
                      </td>
                      <td>
                        <select value={item.currency||"COP"}
                          onChange={e=>updateItem(item.id,"currency",e.target.value)}
                          style={{ width:70 }}>
                          <option>COP</option><option>USD</option>
                        </select>
                      </td>
                      <td>
                        <button onClick={()=>removeItem(item.id)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:G.danger }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {!kitItems.length && (
            <Card style={{ textAlign:"center", padding:"30px 16px", color:G.muted }}>
              <p style={{ fontSize:13 }}>Agrega productos del catálogo para armar el kit.</p>
            </Card>
          )}
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                      color:G.muted, fontSize:14, padding:40 }}>
          {templates.length
            ? "← Selecciona un kit para editarlo"
            : "Crea tu primer kit con el botón + Nuevo Kit"}
        </div>
      )}

      {confirmDialog}
    </div>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────

// ── Vista Técnico ────────────────────────────────────────────────
const TechnicianView = ({ user, profile, logout }) => {
  const [jobs, setJobs]         = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "", proyecto: "", valor_acordado: "", notas: ""
  });

  const fmtCOP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n||0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: js } = await sb.from("technician_jobs").select("*")
      .eq("technician_id", user.id).order("fecha", { ascending: false });
    const { data: ps } = await sb.from("technician_payments").select("*")
      .eq("technician_id", user.id).order("fecha", { ascending: false });
    setJobs(js || []);
    setPayments(ps || []);
    setLoading(false);
  };

  const totalAcordado  = jobs.reduce((s,j) => s + Number(j.valor_acordado||0), 0);
  const totalPagado    = payments.reduce((s,p) => s + Number(p.monto||0), 0);
  const totalPendiente = totalAcordado - totalPagado;

  const handleSave = async () => {
    if (!form.descripcion || !form.valor_acordado) return;
    setSaving(true);
    await sb.from("technician_jobs").insert({
      technician_id: user.id,
      fecha: form.fecha,
      descripcion: form.descripcion,
      proyecto: form.proyecto || null,
      valor_acordado: Number(form.valor_acordado),
      notas: form.notas || null
    });
    setForm({ fecha: new Date().toISOString().split("T")[0], descripcion:"", proyecto:"", valor_acordado:"", notas:"" });
    setShowForm(false);
    setSaving(false);
    loadData();
  };

  const inp = { width:"100%", background:G.surface, border:`1px solid ${G.border}`,
                borderRadius:6, padding:"7px 10px", color:G.text, fontSize:13 };

  return (
    <div style={{ minHeight:"100vh", background:G.bg, padding:"20px 16px", maxWidth:700, margin:"0 auto" }}>
      <style>{css}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:G.mono, fontWeight:700, fontSize:18, color:G.accent }}>◈ QuoteApp</div>
          <div style={{ color:G.muted, fontSize:12, marginTop:2 }}>Hola, {profile?.name || user.email}</div>
        </div>
        <button onClick={logout}
          style={{ background:"none", border:`1px solid ${G.border}`, color:G.muted,
                   padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:12 }}>
          Salir
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        {[
          { label:"Total acordado",  value:fmtCOP(totalAcordado),  color:G.text },
          { label:"Total pagado",    value:fmtCOP(totalPagado),    color:"#22c55e" },
          { label:"Pendiente",       value:fmtCOP(totalPendiente), color:totalPendiente>0?"#f59e0b":G.muted },
        ].map(c => (
          <div key={c.label} style={{ background:G.card, border:`1px solid ${G.border}`,
                                      borderRadius:8, padding:"12px 10px", textAlign:"center" }}>
            <div style={{ color:G.muted, fontSize:10, marginBottom:4 }}>{c.label}</div>
            <div style={{ color:c.color, fontWeight:700, fontSize:13 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:16 }}>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: showForm ? G.surface : G.accent, color: showForm ? G.muted : "#fff",
                   border:`1px solid ${G.border}`, padding:"8px 18px",
                   borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13 }}>
          {showForm ? "✕ Cancelar" : "+ Agregar trabajo"}
        </button>
      </div>

      {showForm && (
        <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:10,
                      padding:16, marginBottom:24 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Fecha</div>
              <input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} style={inp} />
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Valor acordado (COP) *</div>
              <input type="number" value={form.valor_acordado} onChange={e=>setForm({...form,valor_acordado:e.target.value})}
                placeholder="0" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Descripción *</div>
            <input value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}
              placeholder="¿Qué trabajo realizaste?" style={inp} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Proyecto (opcional)</div>
              <input value={form.proyecto} onChange={e=>setForm({...form,proyecto:e.target.value})}
                placeholder="Nombre del proyecto" style={inp} />
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Notas (opcional)</div>
              <input value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})}
                placeholder="Observaciones" style={inp} />
            </div>
          </div>
          <button onClick={handleSave}
            disabled={saving || !form.descripcion || !form.valor_acordado}
            style={{ background:G.accent, color:"#fff", border:"none", padding:"8px 22px",
                     borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13,
                     opacity:(saving||!form.descripcion||!form.valor_acordado)?0.5:1 }}>
            {saving ? "Guardando..." : "💾 Guardar trabajo"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", color:G.muted, padding:40 }}>Cargando...</div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign:"center", color:G.muted, padding:40 }}>
          No hay trabajos registrados aún.<br/>
          <span style={{ fontSize:12 }}>Usa el botón de arriba para agregar tu primer trabajo.</span>
        </div>
      ) : (
        <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${G.border}`,
                        fontWeight:700, fontSize:13 }}>Mis trabajos</div>
          {jobs.map(j => {
            const pagadoJob    = payments.filter(p => p.job_id === j.id).reduce((s,p) => s+Number(p.monto||0), 0);
            const pendienteJob = Number(j.valor_acordado||0) - pagadoJob;
            return (
              <div key={j.id} style={{ padding:"12px 16px", borderBottom:`1px solid ${G.border}`,
                                       display:"flex", justifyContent:"space-between",
                                       alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{j.descripcion}</div>
                  <div style={{ color:G.muted, fontSize:11, marginTop:3 }}>
                    📅 {j.fecha}{j.proyecto ? ` · 📁 ${j.proyecto}` : ""}
                  </div>
                  {j.notas && <div style={{ color:G.muted, fontSize:11, fontStyle:"italic", marginTop:2 }}>{j.notas}</div>}
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{fmtCOP(j.valor_acordado)}</div>
                  {pagadoJob > 0 && <div style={{ fontSize:11, color:"#22c55e" }}>✓ Pagado: {fmtCOP(pagadoJob)}</div>}
                  {pendienteJob > 0
                    ? <div style={{ fontSize:11, color:"#f59e0b" }}>⏳ Pendiente: {fmtCOP(pendienteJob)}</div>
                    : pagadoJob > 0 && <div style={{ fontSize:11, color:"#22c55e" }}>Completado</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ── Vista Admin: Técnicos ────────────────────────────────────────
const TechniciansAdminView = ({ config, projects = [] }) => {
  const [technicians, setTechnicians]   = useState([]);
  const [jobs, setJobs]                 = useState([]);
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedTech, setSelectedTech] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showNewTech, setShowNewTech]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [editJob, setEditJob]             = useState(null);
  const [filter, setFilter]             = useState("abierto");
  const now = new Date();
  const fom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  const lom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${new Date(now.getFullYear(),now.getMonth()+1,0).getDate()}`;
  const [payFrom, setPayFrom] = useState(fom);
  const [payTo,   setPayTo]   = useState(lom);
  const [payForm, setPayForm]   = useState({ monto:"", fecha:new Date().toISOString().split("T")[0], notas:"", job_id:"" });
  const [jobForm, setJobForm]   = useState({ technician_id:"", tipo:"servicio", descripcion:"", fecha:new Date().toISOString().split("T")[0], valor_acordado:"", project_id:"", notas:"" });
  const [techForm, setTechForm] = useState({ name:"", email:"", password:"" });

  const fmtCOP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n||0);
  const inp = { width:"100%", background:G.surface, border:`1px solid ${G.border}`, borderRadius:6, padding:"7px 10px", color:G.text, fontSize:13 };
  const TIPOS = ["proyecto","servicio","garantia","otro"];
  const FILTERS = [{k:"abierto",l:"Abiertos"},{k:"cerrado",l:"Cerrados"},{k:"archivado",l:"Archivados"}];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: techs } = await sb.from("profiles").select("*").eq("role","technician").order("name");
    const { data: js }    = await sb.from("technician_jobs").select("*").order("fecha",{ascending:false});
    const { data: ps }    = await sb.from("technician_payments").select("*").order("fecha",{ascending:false});
    setTechnicians(techs||[]); setJobs(js||[]); setPayments(ps||[]);
    setLoading(false);
  };

  const techJobs      = (t, f) => jobs.filter(j => j.technician_id === t.id && (f ? j.status===f : true));
  const techPayments  = t => payments.filter(p => p.technician_id === t.id);
  const techAcordado  = (t,f) => techJobs(t,f).reduce((s,j)=>s+Number(j.valor_acordado||0),0);
  const techPagado    = t => techPayments(t).reduce((s,p)=>s+Number(p.monto||0),0);
  const techPendiente = t => techJobs(t,"abierto").reduce((s,j)=>s+Number(j.valor_acordado||0),0) - techPayments(t).reduce((s,p)=>s+Number(p.monto||0),0);

  const handlePay = async () => {
    if (!payForm.monto || !selectedTech) return;
    setSaving(true);
    await sb.from("technician_payments").insert({
      technician_id: selectedTech.id, job_id: payForm.job_id||null,
      fecha: payForm.fecha, monto: Number(payForm.monto), notas: payForm.notas||null
    });
    // Si hay job vinculado, cerrarlo
    if (payForm.job_id) {
      const job = jobs.find(j=>j.id===payForm.job_id);
      const pagadoJob = payments.filter(p=>p.job_id===payForm.job_id).reduce((s,p)=>s+Number(p.monto||0),0) + Number(payForm.monto);
      if (pagadoJob >= Number(job?.valor_acordado||0)) {
        await sb.from("technician_jobs").update({status:"cerrado"}).eq("id",payForm.job_id);
      }
    }
    setShowPayModal(false);
    setPayForm({ monto:"", fecha:new Date().toISOString().split("T")[0], notas:"", job_id:"" });
    setSaving(false); loadData();
  };

  const handleSaveJob = async () => {
    if (!jobForm.technician_id || !jobForm.descripcion || !jobForm.valor_acordado) return;
    setSaving(true);
    const proj = projects.find(p => String(p.id) === String(jobForm.project_id));
    await sb.from("technician_jobs").insert({
      technician_id: jobForm.technician_id, tipo: jobForm.tipo,
      descripcion: jobForm.descripcion, fecha: jobForm.fecha,
      valor_acordado: Number(jobForm.valor_acordado),
      project_id: jobForm.project_id||null,
      proyecto: proj ? proj.name : null,
      notas: jobForm.notas||null, status: "abierto"
    });
    setShowJobModal(false);
    setJobForm({ technician_id:"", tipo:"servicio", descripcion:"", fecha:new Date().toISOString().split("T")[0], valor_acordado:"", project_id:"", notas:"" });
    setSaving(false); loadData();
  };

  const handleNewTech = async () => {
    if (!techForm.name || !techForm.email || !techForm.password) return;
    setSaving(true);
    const { data, error } = await sb.auth.signUp({ email: techForm.email, password: techForm.password });
    if (error) { alert("Error: " + error.message); setSaving(false); return; }
    const uid = data.user?.id;
    if (uid) await sb.from("profiles").upsert({ id: uid, name: techForm.name, role: "technician" });
    setShowNewTech(false);
    setTechForm({ name:"", email:"", password:"" });
    setSaving(false); loadData();
  };

  const handleEditJob = async () => {
    if (!editJob) return;
    setSaving(true);
    const proj = projects.find(p => String(p.id) === String(editJob.project_id));
    await sb.from("technician_jobs").update({
      technician_id: editJob.technician_id,
      tipo: editJob.tipo,
      descripcion: editJob.descripcion,
      fecha: editJob.fecha,
      valor_acordado: Number(editJob.valor_acordado),
      project_id: editJob.project_id||null,
      proyecto: proj ? proj.name : editJob.proyecto||null,
      notas: editJob.notas||null
    }).eq("id", editJob.id);
    setEditJob(null);
    setSaving(false);
    loadData();
  };

  const updateJobStatus = async (jobId, status) => {
    await sb.from("technician_jobs").update({status}).eq("id", jobId);
    loadData();
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("¿Eliminar este trabajo?")) return;
    await sb.from("technician_payments").delete().eq("job_id", jobId);
    await sb.from("technician_jobs").delete().eq("id", jobId);
    loadData();
  };

  const deleteTech = async (tech) => {
    if (!window.confirm(`¿Eliminar a ${tech.name}? Se eliminarán todos sus trabajos y pagos.`)) return;
    await sb.from("technician_payments").delete().eq("technician_id", tech.id);
    await sb.from("technician_jobs").delete().eq("technician_id", tech.id);
    await sb.from("profiles").delete().eq("id", tech.id);
    loadData();
  };

  const STATUS_COLOR = { abierto:"#f59e0b", cerrado:"#22c55e", archivado:G.muted };
  const STATUS_LABEL = { abierto:"Abierto", cerrado:"Cerrado", archivado:"Archivado" };

  if (loading) return <div style={{padding:40,textAlign:"center",color:G.muted}}>Cargando...</div>;

  return (
    <div style={{ padding:"24px 28px", maxWidth:980 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>🔧 Técnicos</h2>
          <p style={{ color:G.muted, fontSize:13 }}>Control de trabajos y pagos</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>{ setShowJobModal(!showJobModal); setShowNewTech(false); }}
            style={{ background:showJobModal?G.surface:G.accent, color:showJobModal?G.muted:"#fff",
                     border:`1px solid ${G.border}`, padding:"8px 16px",
                     borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13 }}>
            {showJobModal?"✕ Cancelar":"+ Agregar trabajo"}
          </button>
          <button onClick={()=>{ setShowNewTech(!showNewTech); setShowJobModal(false); }}
            style={{ background:"none", color:G.accent, border:`1px solid ${G.accent}`, padding:"8px 16px",
                     borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13 }}>
            {showNewTech?"✕ Cancelar":"+ Nuevo técnico"}
          </button>
        </div>
      </div>

      {/* Form nuevo técnico */}
      {showNewTech && (
        <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:10, padding:20, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>👷 Nuevo técnico</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Nombre *</div>
              <input value={techForm.name} onChange={e=>setTechForm({...techForm,name:e.target.value})}
                placeholder="Nombre completo" style={inp} />
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Email *</div>
              <input type="email" value={techForm.email} onChange={e=>setTechForm({...techForm,email:e.target.value})}
                placeholder="correo@ejemplo.com" style={inp} />
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Contraseña temporal *</div>
              <input type="password" value={techForm.password} onChange={e=>setTechForm({...techForm,password:e.target.value})}
                placeholder="Mínimo 6 caracteres" style={inp} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleNewTech} disabled={saving||!techForm.name||!techForm.email||!techForm.password}
              style={{ background:G.accent, color:"#fff", border:"none", padding:"8px 20px",
                       borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13,
                       opacity:(saving||!techForm.name||!techForm.email||!techForm.password)?0.5:1 }}>
              {saving?"Creando...":"💾 Crear técnico"}
            </button>
          </div>
        </div>
      )}

      {/* Form agregar trabajo */}
      {showJobModal && (
        <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:10, padding:20, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>🛠️ Agregar trabajo</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Técnico *</div>
              <select value={jobForm.technician_id} onChange={e=>setJobForm({...jobForm,technician_id:e.target.value})} style={inp}>
                <option value="">— Seleccionar —</option>
                {technicians.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Tipo</div>
              <select value={jobForm.tipo} onChange={e=>setJobForm({...jobForm,tipo:e.target.value})} style={inp}>
                {TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Descripción *</div>
              <input value={jobForm.descripcion} onChange={e=>setJobForm({...jobForm,descripcion:e.target.value})}
                placeholder="¿Qué trabajo?" style={inp} />
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Valor acordado (COP) *</div>
              <input type="number" value={jobForm.valor_acordado} onChange={e=>setJobForm({...jobForm,valor_acordado:e.target.value})}
                placeholder="0" style={inp} />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Fecha</div>
              <input type="date" value={jobForm.fecha} onChange={e=>setJobForm({...jobForm,fecha:e.target.value})} style={inp} />
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Proyecto (opcional)</div>
              <select value={jobForm.project_id} onChange={e=>setJobForm({...jobForm,project_id:e.target.value})} style={inp}>
                <option value="">— Sin proyecto —</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}{p.client_name?` · ${p.client_name}`:""}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Notas</div>
              <input value={jobForm.notas} onChange={e=>setJobForm({...jobForm,notas:e.target.value})}
                placeholder="Observaciones" style={inp} />
            </div>
          </div>
          <button onClick={handleSaveJob}
            disabled={saving||!jobForm.technician_id||!jobForm.descripcion||!jobForm.valor_acordado}
            style={{ background:G.accent, color:"#fff", border:"none", padding:"8px 20px",
                     borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13,
                     opacity:(saving||!jobForm.technician_id||!jobForm.descripcion||!jobForm.valor_acordado)?0.5:1 }}>
            {saving?"Guardando...":"💾 Guardar trabajo"}
          </button>
        </div>
      )}

      {/* Mini dashboard pagos */}
      {(() => {
        const paymentsInRange = payments.filter(p => p.fecha >= payFrom && p.fecha <= payTo);
        const totalPagadoRango = paymentsInRange.reduce((s,p)=>s+Number(p.monto||0),0);
        const pagosPorTech = technicians.map(t => ({
          name: t.name,
          monto: paymentsInRange.filter(p=>p.technician_id===t.id).reduce((s,p)=>s+Number(p.monto||0),0)
        })).filter(x=>x.monto>0);
        const jobsAbiertos = jobs.filter(j=>j.status==="abierto");
        const totalPendienteGlobal = jobsAbiertos.reduce((s,j)=>s+Number(j.valor_acordado||0),0)
          - payments.filter(p=>jobsAbiertos.map(j=>j.id).includes(p.job_id)).reduce((s,p)=>s+Number(p.monto||0),0);
        return (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ color:G.muted, fontSize:12 }}>Pagos del período:</span>
              <input type="date" value={payFrom} onChange={e=>setPayFrom(e.target.value)}
                style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:6,
                         padding:"5px 8px", color:G.text, fontSize:12 }} />
              <span style={{ color:G.muted }}>—</span>
              <input type="date" value={payTo} onChange={e=>setPayTo(e.target.value)}
                style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:6,
                         padding:"5px 8px", color:G.text, fontSize:12 }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10 }}>
              <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:8, padding:"12px 14px" }}>
                <div style={{ color:G.muted, fontSize:10, marginBottom:4 }}>PAGADO EN PERÍODO</div>
                <div style={{ fontWeight:700, fontSize:16, color:"#22c55e" }}>{fmtCOP(totalPagadoRango)}</div>
                <div style={{ color:G.muted, fontSize:10, marginTop:2 }}>{paymentsInRange.length} pago{paymentsInRange.length!==1?"s":""}</div>
              </div>
              <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:8, padding:"12px 14px" }}>
                <div style={{ color:G.muted, fontSize:10, marginBottom:4 }}>PENDIENTE TOTAL</div>
                <div style={{ fontWeight:700, fontSize:16, color:totalPendienteGlobal>0?"#f59e0b":G.muted }}>{fmtCOP(totalPendienteGlobal)}</div>
                <div style={{ color:G.muted, fontSize:10, marginTop:2 }}>{jobsAbiertos.length} trabajo{jobsAbiertos.length!==1?"s":""} abierto{jobsAbiertos.length!==1?"s":""}</div>
              </div>
              {pagosPorTech.map(x=>(
                <div key={x.name} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ color:G.muted, fontSize:10, marginBottom:4 }}>{x.name.toUpperCase()}</div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#22c55e" }}>{fmtCOP(x.monto)}</div>
                  <div style={{ color:G.muted, fontSize:10, marginTop:2 }}>en el período</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Filtros */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {FILTERS.map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k)}
            style={{ padding:"5px 14px", borderRadius:20, fontSize:12, cursor:"pointer", fontWeight:600,
                     background: filter===f.k ? G.accent : G.surface,
                     color: filter===f.k ? "#fff" : G.muted,
                     border: `1px solid ${filter===f.k ? G.accent : G.border}` }}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Lista técnicos */}
      {technicians.length === 0 ? (
        <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:10,
                      padding:40, textAlign:"center", color:G.muted }}>
          No hay técnicos aún. Usa "+ Nuevo técnico" para agregar uno.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {technicians.map(t => {
            const tjobs     = techJobs(t, filter);
            const allOpen   = techJobs(t,"abierto");
            const acordado  = techAcordado(t, filter);
            const pagado    = techPagado(t);
            const pendiente = techPendiente(t);
            const isOpen    = selectedTech?.id === t.id && !showPayModal;
            if (tjobs.length === 0 && filter !== "abierto") return null;
            return (
              <div key={t.id} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:10, overflow:"hidden" }}>
                {/* Header técnico */}
                <div style={{ padding:"12px 18px", display:"flex", justifyContent:"space-between",
                              alignItems:"center", borderBottom: isOpen?`1px solid ${G.border}`:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", flex:1 }}
                       onClick={()=>setSelectedTech(isOpen?null:t)}>
                    <div style={{ width:34, height:34, borderRadius:"50%", background:G.accent, color:"#fff",
                                  display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>
                      {(t.name||"T")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{t.name}</div>
                      <div style={{ color:G.muted, fontSize:11 }}>{allOpen.length} abierto{allOpen.length!==1?"s":""} · {techJobs(t,"cerrado").length} cerrado{techJobs(t,"cerrado").length!==1?"s":""}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    {[{l:"Acordado",v:fmtCOP(techAcordado(t,"abierto")),c:G.text},
                      {l:"Pagado",v:fmtCOP(pagado),c:"#22c55e"},
                      {l:"Pendiente",v:fmtCOP(pendiente),c:pendiente>0?"#f59e0b":G.muted}].map(x=>(
                      <div key={x.l} style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:G.muted }}>{x.l}</div>
                        <div style={{ fontWeight:700, fontSize:13, color:x.c }}>{x.v}</div>
                      </div>
                    ))}
                    {pendiente > 0 && (
                      <button onClick={e=>{ e.stopPropagation(); setSelectedTech(t); setShowPayModal(true); }}
                        style={{ background:G.accent, color:"#fff", border:"none", padding:"6px 12px",
                                 borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:12 }}>
                        💸 Pagar
                      </button>
                    )}
                    <button onClick={e=>{ e.stopPropagation(); deleteTech(t); }}
                      style={{ background:"none", border:`1px solid ${G.danger}`, color:G.danger,
                               padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:11 }}>
                      🗑️
                    </button>
                    <span onClick={()=>setSelectedTech(isOpen?null:t)}
                      style={{ color:G.muted, cursor:"pointer" }}>{isOpen?"▲":"▼"}</span>
                  </div>
                </div>

                {/* Tabla trabajos */}
                {isOpen && (
                  <div>
                    {tjobs.length === 0 ? (
                      <div style={{ padding:20, textAlign:"center", color:G.muted, fontSize:13 }}>
                        No hay trabajos {filter !== "abierto" ? filter+"s" : "abiertos"} para este técnico.
                      </div>
                    ) : (
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead>
                          <tr style={{ background:G.surface }}>
                            {["Fecha","Tipo","Descripción","Proyecto","Acordado","Pagado","Pendiente","Estado",""].map(h=>(
                              <th key={h} style={{ padding:"7px 10px", textAlign:"left", color:G.muted,
                                                   fontWeight:600, fontSize:10, borderBottom:`1px solid ${G.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tjobs.map(j => {
                            const pj   = payments.filter(p=>p.job_id===j.id).reduce((s,p)=>s+Number(p.monto||0),0);
                            const pend = Number(j.valor_acordado||0) - pj;
                            return (
                              <tr key={j.id} style={{ borderBottom:`1px solid ${G.border}` }}>
                                <td style={{ padding:"7px 10px", color:G.muted, whiteSpace:"nowrap" }}>{j.fecha}</td>
                                <td style={{ padding:"7px 10px" }}>
                                  <span style={{ background:G.surface, borderRadius:4, padding:"2px 6px", fontSize:10, color:G.muted }}>
                                    {j.tipo||"servicio"}
                                  </span>
                                </td>
                                <td style={{ padding:"7px 10px" }}>
                                  {j.descripcion}
                                  {j.notas && <div style={{color:G.muted,fontSize:10,fontStyle:"italic"}}>{j.notas}</div>}
                                </td>
                                <td style={{ padding:"7px 10px", color:G.muted }}>{j.proyecto||"—"}</td>
                                <td style={{ padding:"7px 10px", fontWeight:600 }}>{fmtCOP(j.valor_acordado)}</td>
                                <td style={{ padding:"7px 10px", color:"#22c55e" }}>{fmtCOP(pj)}</td>
                                <td style={{ padding:"7px 10px", color:pend>0?"#f59e0b":G.muted }}>{fmtCOP(pend)}</td>
                                <td style={{ padding:"7px 10px" }}>
                                  <span style={{ color:STATUS_COLOR[j.status||"abierto"], fontSize:11, fontWeight:600 }}>
                                    {STATUS_LABEL[j.status||"abierto"]}
                                  </span>
                                </td>
                                <td style={{ padding:"7px 10px" }}>
                                  <div style={{ display:"flex", gap:6 }}>
                                    <button onClick={()=>setEditJob({...j})}
                                        style={{ background:"none", border:`1px solid ${G.accent}`, color:G.accent,
                                                 padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10 }}>
                                        ✏️
                                      </button>
                                    {j.status==="abierto" && (
                                      <button onClick={()=>updateJobStatus(j.id,"cerrado")}
                                        style={{ background:"none", border:`1px solid #22c55e`, color:"#22c55e",
                                                 padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10 }}>
                                        ✓ Cerrar
                                      </button>
                                    )}
                                    {j.status==="cerrado" && (
                                      <button onClick={()=>updateJobStatus(j.id,"abierto")}
                                        style={{ background:"none", border:`1px solid ${G.muted}`, color:G.muted,
                                                 padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10 }}>
                                        ↩ Reabrir
                                      </button>
                                    )}
                                    {j.status!=="archivado" && (
                                      <button onClick={()=>updateJobStatus(j.id,"archivado")}
                                        style={{ background:"none", border:`1px solid ${G.muted}`, color:G.muted,
                                                 padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10 }}>
                                        📦
                                      </button>
                                    )}
                                    <button onClick={()=>deleteJob(j.id)}
                                      style={{ background:"none", border:`1px solid ${G.danger}`, color:G.danger,
                                               padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10 }}>
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal editar trabajo */}
      {editJob && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)",
                      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
             onClick={e=>e.target===e.currentTarget&&setEditJob(null)}>
          <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:24, width:520 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>✏️ Editar trabajo</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Técnico *</div>
                <select value={editJob.technician_id} onChange={e=>setEditJob({...editJob,technician_id:e.target.value})} style={inp}>
                  {technicians.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Tipo</div>
                <select value={editJob.tipo||"servicio"} onChange={e=>setEditJob({...editJob,tipo:e.target.value})} style={inp}>
                  {TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Descripción *</div>
                <input value={editJob.descripcion} onChange={e=>setEditJob({...editJob,descripcion:e.target.value})}
                  placeholder="¿Qué trabajo?" style={inp} />
              </div>
              <div>
                <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Valor acordado (COP) *</div>
                <input type="number" value={editJob.valor_acordado} onChange={e=>setEditJob({...editJob,valor_acordado:e.target.value})}
                  placeholder="0" style={inp} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
              <div>
                <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Fecha</div>
                <input type="date" value={editJob.fecha} onChange={e=>setEditJob({...editJob,fecha:e.target.value})} style={inp} />
              </div>
              <div>
                <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Proyecto</div>
                <select value={editJob.project_id||""} onChange={e=>setEditJob({...editJob,project_id:e.target.value})} style={inp}>
                  <option value="">— Sin proyecto —</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name}{p.client_name?` · ${p.client_name}`:""}</option>)}
                </select>
              </div>
              <div>
                <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Notas</div>
                <input value={editJob.notas||""} onChange={e=>setEditJob({...editJob,notas:e.target.value})}
                  placeholder="Observaciones" style={inp} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setEditJob(null)}
                style={{ background:"none", border:`1px solid ${G.border}`, color:G.muted,
                         padding:"8px 18px", borderRadius:7, cursor:"pointer" }}>Cancelar</button>
              <button onClick={handleEditJob} disabled={saving||!editJob.descripcion||!editJob.valor_acordado}
                style={{ background:G.accent, color:"#fff", border:"none", padding:"8px 22px",
                         borderRadius:7, cursor:"pointer", fontWeight:600,
                         opacity:(saving||!editJob.descripcion||!editJob.valor_acordado)?0.5:1 }}>
                {saving?"Guardando...":"💾 Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pago */}
      {showPayModal && selectedTech && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)",
                      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
             onClick={e=>e.target===e.currentTarget&&setShowPayModal(false)}>
          <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:24, width:440 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>💸 Registrar pago — {selectedTech.name}</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Monto *</div>
              <input type="number" value={payForm.monto} onChange={e=>setPayForm({...payForm,monto:e.target.value})}
                placeholder="0" style={inp} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Fecha</div>
              <input type="date" value={payForm.fecha} onChange={e=>setPayForm({...payForm,fecha:e.target.value})} style={inp} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Vincular a trabajo (opcional — se cierra automáticamente si queda saldado)</div>
              <select value={payForm.job_id} onChange={e=>setPayForm({...payForm,job_id:e.target.value})} style={inp}>
                <option value="">— Pago general —</option>
                {techJobs(selectedTech,"abierto").map(j=>(
                  <option key={j.id} value={j.id}>{j.fecha} · {j.descripcion} · {fmtCOP(j.valor_acordado)}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ color:G.muted, fontSize:11, marginBottom:4 }}>Notas</div>
              <input value={payForm.notas} onChange={e=>setPayForm({...payForm,notas:e.target.value})}
                placeholder="Observaciones" style={inp} />
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setShowPayModal(false)}
                style={{ background:"none", border:`1px solid ${G.border}`, color:G.muted,
                         padding:"8px 18px", borderRadius:7, cursor:"pointer" }}>Cancelar</button>
              <button onClick={handlePay} disabled={saving||!payForm.monto}
                style={{ background:G.accent, color:"#fff", border:"none", padding:"8px 22px",
                         borderRadius:7, cursor:"pointer", fontWeight:600,
                         opacity:(saving||!payForm.monto)?0.5:1 }}>
                {saving?"Guardando...":"💾 Guardar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default function App() {
  // Set favicon and page title
  useEffect(() => {
    document.title = "QuoteApp ◈";
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement("link");
    favicon.type = "image/svg+xml";
    favicon.rel = "icon";
    favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230d6e6e'/><text y='.85em' font-size='75' x='8'>◈</text></svg>";
    document.head.appendChild(favicon);
  }, []);
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
  const [projects, setProjects] = useState([]);
  const [projectQuotes, setProjectQuotes] = useState([]);
  const [projectPayments, setProjectPayments] = useState([]);
  const [projectPurchases, setProjectPurchases] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [templates, setTemplates] = useState([]);

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

      // Si es técnico, no cargar datos de la app principal
      if (prof.role === 'technician') { setLoading(false); return; }

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

      // Projects
      const { data: projs } = await sb.from("projects").select("*").order("created_at", { ascending: false });
      if (projs) setProjects(projs);
      const { data: pqs } = await sb.from("project_quotes").select("*");
      if (pqs) setProjectQuotes(pqs);
      // Init quoteDetails from DB
      if (pqs) {
        const details = {};
        pqs.forEach(pq => { if (pq.detalle) details[pq.quote_id] = pq.detalle; });
      }
      const { data: pps } = await sb.from("project_payments").select("*").order("date", { ascending: false });
      if (pps) setProjectPayments(pps);
      const { data: ppurch } = await sb.from("project_purchases").select("*");
      if (ppurch) setProjectPurchases(ppurch);

      // Project tasks (tabla puede no existir aún)
      try {
        const { data: ptasks } = await sb.from("project_tasks").select("*").order("date", { ascending: true });
        if (ptasks) setProjectTasks(ptasks);
      } catch(e) { console.warn("project_tasks table not found:", e.message); }

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

      // Templates (Kits)
      const { data: tmpl } = await sb.from("quote_templates").select("*").order("name");
      if (tmpl) setTemplates(tmpl);

      // Counter
      const maxQ = qs?.length ? Math.max(...qs.map(q=>q.number||1000)) : 1000;
      quoteCounter = maxQ + 1;

    } catch(e) { console.error(e); }
    setLoading(false);
  };

  // ── CRUD: Quotes ─────────────────────────────────────────────
  const saveQuote = async (q) => {
    let savedData = null;
    const row = { number:q.number, date:q.date, valid_until:q.validUntil, profile:q.profile||'empresa',
      client_id:q.clientId||null, client_name:q.clientName, client_contact:q.clientContact,
      client_email:q.clientEmail, client_rut:q.clientRut||"", status:q.status, notes:q.notes, discount:q.discount||0,
      trm:q.trm||4200, subtotal:q.subtotal||0, total_disc:q.totalDisc||0,
      tax_amt:q.taxAmt||0, total:q.total||0, total_cost:q.totalCost||0,
      profit:q.profit||0, profit_pct:q.profitPct||0, items:q.items||[], created_by:user.id,
      version: q.version||1, parent_id: q.parent_id||null, is_latest: q.is_latest!==false,
      archived: q.archived||false };
    if (q.id && typeof q.id === "number" && q.id > 1000000000) {
      const { data } = await sb.from("quotes").insert(row).select().single();
      if (data) { savedData = normalizeQuote(data); setQuotes(qs => [savedData, ...qs.filter(x=>x.id!==q.id)]); }
    } else {
      await sb.from("quotes").update(row).eq("id", q.id);
      setQuotes(qs => qs.map(x => x.id===q.id ? {...q,...row} : x));
      savedData = {...q, ...row};
    }
    return savedData;
  };

  const archiveQuote = async (id, archived) => {
    await sb.from("quotes").update({ archived }).eq("id", id);
    setQuotes(qs => qs.map(q => q.id===id ? {...q, archived} : q));
  };

  // ── CRUD: Kits (quote_templates) ─────────────────────────────
  const saveTemplate = async (name, description, items) => {
    // Strip ids so items get fresh ids when inserted into quotes
    const cleanItems = items
      .filter(i => i.name || i.type === "header")
      .map(({ id, productId, ...rest }) => ({ ...rest, productId: productId||null }));
    const row = { name, description: description||"", items: cleanItems, created_by: user.id };
    const { data } = await sb.from("quote_templates").insert(row).select().single();
    if (data) setTemplates(ts => [...ts, data].sort((a,b)=>a.name.localeCompare(b.name)));
    return data;
  };

  const updateTemplate = async (id, name, description, items) => {
    const update = { name, description };
    if (items !== undefined) {
      update.items = items.filter(i => i.name || i.type==="header")
        .map(({ id:_id, ...rest }) => rest);
    }
    await sb.from("quote_templates").update(update).eq("id", id);
    setTemplates(ts => ts.map(t => t.id===id ? {...t, ...update} : t));
  };

  const deleteTemplate = async (id) => {
    await sb.from("quote_templates").delete().eq("id", id);
    setTemplates(ts => ts.filter(t => t.id !== id));
  };
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

  // ── CRUD: Projects ──────────────────────────────────────────
  const createProject = async (data) => {
    const row = { name: data.name || (data.clientName + " — " + (data.date||"").substring(0,7)),
                  client_id: data.clientId||null, client_name: data.clientName||"",
                  status: "Activo", created_by: user.id };
    const { data: proj } = await sb.from("projects").insert(row).select().single();
    if (proj) {
      setProjects(ps => [proj, ...ps]);
      return proj;
    }
  };

  const addQuoteToProject = async (projectId, quoteId) => {
    const exists = projectQuotes.find(pq => pq.project_id===projectId && pq.quote_id===quoteId);
    if (exists) return;
    const { data } = await sb.from("project_quotes").insert({ project_id: projectId, quote_id: quoteId, detalle:"" }).select().single();
    if (data) setProjectQuotes(pqs => [...pqs, data]);
  };

  const saveQuoteDetalle = async (projectId, quoteId, detalle) => {
    await sb.from("project_quotes").update({ detalle }).eq("project_id", projectId).eq("quote_id", quoteId);
    setProjectQuotes(pqs => pqs.map(pq =>
      pq.project_id===projectId && pq.quote_id===quoteId ? {...pq, detalle} : pq
    ));
  };

  const saveProjectPayment = async (pp) => {
    const row = { project_id: pp.projectId, payment_request_id: pp.paymentRequestId||null,
                  concept: pp.concept, amount: pp.amount||0, date: pp.date,
                  payment_type: pp.paymentType||'empresa', created_by: user.id };
    if (pp.isNew) {
      const { data } = await sb.from("project_payments").insert(row).select().single();
      if (data) setProjectPayments(pps => [data, ...pps]);
    } else {
      await sb.from("project_payments").update(row).eq("id", pp.id);
      setProjectPayments(pps => pps.map(p => p.id===pp.id ? {...p,...row} : p));
    }
  };

  const deleteProjectPayment = async (id) => {
    await sb.from("project_payments").delete().eq("id", id);
    setProjectPayments(pps => pps.filter(p => p.id!==id));
  };

  const updateProjectStatus = async (id, status) => {
    await sb.from("projects").update({ status }).eq("id", id);
    setProjects(ps => ps.map(p => p.id===id ? {...p,status} : p));
  };

  const togglePurchase = async (projectId, quoteId, itemId, current, date, supplier) => {
    const existing = projectPurchases.find(p=>p.project_id===projectId&&p.quote_id===quoteId&&p.item_id===String(itemId));
    if (existing) {
      await sb.from("project_purchases").update({
        purchased:!current, purchase_date:date||null, supplier:supplier||null
      }).eq("id", existing.id);
      setProjectPurchases(ps=>ps.map(p=>p.id===existing.id?{...p,purchased:!current,purchase_date:date,supplier}:p));
    } else {
      const row = { project_id:projectId, quote_id:quoteId, item_id:String(itemId),
                    purchased:true, purchase_date:date||null, supplier:supplier||null, created_by:user.id };
      const { data } = await sb.from("project_purchases").insert(row).select().single();
      if (data) setProjectPurchases(ps=>[...ps,data]);
    }
  };

  const deleteProject = async (id) => {
    await sb.from("project_payments").delete().eq("project_id", id);
    await sb.from("project_quotes").delete().eq("project_id", id);
    await sb.from("project_tasks").delete().eq("project_id", id);
    await sb.from("projects").delete().eq("id", id);
    setProjectPayments(pps => pps.filter(p => p.project_id !== id));
    setProjectQuotes(pqs => pqs.filter(pq => pq.project_id !== id));
    setProjectTasks(ts => ts.filter(t => t.project_id !== id));
    setProjects(ps => ps.filter(p => p.id !== id));
  };

  // ── CRUD: Project Tasks ──────────────────────────────────────
  const saveProjectTask = async (task) => {
    const row = {
      project_id: task.project_id,
      title:       task.title || "",
      type:        task.type  || "tarea",
      date:        task.date  || null,
      time:        task.time  || null,
      duration:    task.duration || 60,
      notes:       task.notes || "",
      done:        task.done  || false,
      created_by:  user.id,
    };
    if (task.id && typeof task.id === "number" && task.id < 1e12) {
      // existing DB record
      await sb.from("project_tasks").update(row).eq("id", task.id);
      setProjectTasks(ts => ts.map(t => t.id === task.id ? { ...t, ...row } : t));
    } else {
      const { data } = await sb.from("project_tasks").insert(row).select().single();
      if (data) setProjectTasks(ts => [...ts, data].sort((a,b)=>(a.date||"").localeCompare(b.date||"")));
      return data;
    }
  };

  const deleteProjectTask = async (id) => {
    await sb.from("project_tasks").delete().eq("id", id);
    setProjectTasks(ts => ts.filter(t => t.id !== id));
  };

  const toggleProjectTask = async (id, done) => {
    await sb.from("project_tasks").update({ done }).eq("id", id);
    setProjectTasks(ts => ts.map(t => t.id === id ? { ...t, done } : t));
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
  if (user && profile?.role === 'technician') return <TechnicianView user={user} profile={profile} logout={logout} />;

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
          {view==="dashboard" && <Dashboard quotes={quotes} clients={clients} products={products}
                                   projects={projects} projectPayments={projectPayments}
                                   projectQuotes={projectQuotes} paymentRequests={paymentRequests}
                                   setView={setView} />}
          {view==="quotes"    && <QuotesView quotes={quotes} setQuotes={setQuotes}
                                   saveQuote={saveQuote} deleteQuote={deleteQuote}
                                   archiveQuote={archiveQuote}
                                   createRevision={createRevision}
                                   paymentRequests={paymentRequests} savePaymentRequest={savePaymentRequest}
                                   projectQuotes={projectQuotes} projects={projects}
                                   addQuoteToProject={addQuoteToProject}
                                   createProject={createProject}
                                   templates={templates}
                                   clients={clients} products={products} setProducts={setProducts} config={config} />}
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
          {view==="projects"   && <ProjectsView
                                   projects={projects} projectQuotes={projectQuotes}
                                   projectPayments={projectPayments}
                                   quotes={quotes} clients={clients}
                                   paymentRequests={paymentRequests}
                                   createProject={createProject}
                                   addQuoteToProject={addQuoteToProject}
                                   saveQuoteDetalle={saveQuoteDetalle}
                                   saveProjectPayment={saveProjectPayment}
                                   deleteProjectPayment={deleteProjectPayment}
                                   deleteProject={deleteProject}
                                   updateProjectStatus={updateProjectStatus}
                                   projectPurchases={projectPurchases}
                                   togglePurchase={togglePurchase}
                                   projectTasks={projectTasks}
                                   saveProjectTask={saveProjectTask}
                                   deleteProjectTask={deleteProjectTask}
                                   toggleProjectTask={toggleProjectTask}
                                   config={config} />}
          {view==="categories" && <CategoriesView categories={categories} saveCategory={saveCategory} deleteCategory={deleteCategory} />}
          {view==="suppliers"  && <SuppliersView suppliers={suppliers} saveSupplier={saveSupplier} deleteSupplier={deleteSupplier} />}
          {view==="payments"   && <PaymentRequestsView paymentRequests={paymentRequests} quotes={quotes}
                                   savePaymentRequest={savePaymentRequest} deletePaymentRequest={deletePaymentRequest}
                                   config={config} />}
          {view==="config"    && <ConfigView config={config} setConfig={saveConfigDB} />}
          {view==="technicians" && <TechniciansAdminView config={config} projects={projects} />}
          {view==="kits"     && <KitsView templates={templates} saveTemplate={saveTemplate} deleteTemplate={deleteTemplate} updateTemplate={updateTemplate} products={products} />}
          {/* Mobile spacer for fixed bottom nav */}
        </main>
      </div>
    </>
  );
}
/* cache bust Thu Apr  2 20:45:11 UTC 2026 */
