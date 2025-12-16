import React from "react";
import "./index.css";
import { supabase } from "./supabaseClient";

/* ===================== TYPES ===================== */
type WorkOrder = { id: string; date: string; services: string; status: "Odprti"; createdAt: string };

type SuspensionEntry = {
  id: string;
  date: string;
  model: string;
  serial: string;
  psi: string;
  vsPreload: string;
  lsc: string;
  hsc: string;
  lsr: string;
  hsr: string;
  service: string;
  notes: string;
  createdAt: string;
};

type SeatpostEntry = { id: string; date: string; model: string; serial: string; service: string; notes: string; createdAt: string };

type BikeEntry = { id: string; date: string; bikeModel: string; service: string; notes: string; createdAt: string };

type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  workOrders?: WorkOrder[];
  susFork?: SuspensionEntry[];
  susShock?: SuspensionEntry[];
  seatpost?: SeatpostEntry[];
  bikes?: BikeEntry[];
};

type PriceItem = { id: string; category: string; label: string; priceText: string; isPackage?: boolean };

/* ===================== CENIK (skrajšan prikaz) ===================== */
const PRICELIST: PriceItem[] = [
  { id: "pkg_basic", category: "Paketi", label: "Osnovni servis", priceText: "58,00 €", isPackage: true },
  { id: "pkg_regular", category: "Paketi", label: "Redni servis", priceText: "80,00 €", isPackage: true },
  { id: "srv_hour", category: "Posamezni servisi", label: "Servisna ura", priceText: "58,00 €" },
  { id: "srv_true_wheel", category: "Posamezni servisi", label: "Centriranje obročnika", priceText: "15,00 €" },
  { id: "srv_brake_bleed", category: "Zavore", label: "Zračenje hidravlične zavore (olje vključeno)", priceText: "22,00 €" },
];

/* ===================== HELPERS ===================== */
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
function hasOpen(customer: Customer): boolean {
  return (customer.workOrders ?? []).some((w) => w.status === "Odprti");
}

/* ===== Local backup ===== */
const LS_CUSTOMERS = "bikeapp_customers_TABLE_v2";
function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOMERS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}
function saveCustomers(customers: Customer[]) {
  localStorage.setItem(LS_CUSTOMERS, JSON.stringify(customers));
}

/* ===== Supabase DB helpers (customers: id text PK, payload jsonb, created_at timestamptz) ===== */
async function fetchCustomersFromDb(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("payload,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.payload as Customer).filter(Boolean);
}

async function upsertCustomerToDb(customer: Customer): Promise<void> {
  const { error } = await supabase.from("customers").upsert({ id: customer.id, payload: customer }, { onConflict: "id" });
  if (error) throw error;
}

async function upsertManyCustomersToDb(customers: Customer[]): Promise<void> {
  if (customers.length === 0) return;
  const rows = customers.map((c) => ({ id: c.id, payload: c }));
  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function deleteCustomerFromDb(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

/* ===================== TABLE LAYOUT HELPERS ===================== */
const cellBase: React.CSSProperties = { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const cellWrap: React.CSSProperties = { minWidth: 0, overflow: "hidden", whiteSpace: "normal", wordBreak: "break-word" };

function TableShell(props: { children: React.ReactNode }) {
  return <div style={{ border: "2px solid var(--border)", borderRadius: 16, overflow: "hidden", width: "100%" }}>{props.children}</div>;
}
function TableHeader(props: { cols: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: props.cols,
        padding: "10px 12px",
        fontWeight: 900,
        fontSize: 12,
        borderBottom: "2px solid var(--border)",
        background: "var(--panel)",
        alignItems: "center",
      }}
    >
      {props.children}
    </div>
  );
}
function TableRow(props: { cols: string; isLast: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: props.cols,
        padding: "10px 12px",
        borderBottom: props.isLast ? "none" : "2px solid var(--border)",
        alignItems: "center",
        fontSize: 13,
      }}
    >
      {props.children}
    </div>
  );
}

/* ===================== APP ===================== */
export default function App() {
  const [theme, setTheme] = React.useState<"light" | "dark">(() => (localStorage.getItem("theme") === "dark" ? "dark" : "light"));
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const [route, setRoute] = React.useState<"home" | "profile">("home");
  const [activeCustomerId, setActiveCustomerId] = React.useState<string | null>(null);

  const [customers, setCustomers] = React.useState<Customer[]>(() => loadCustomers());
  React.useEffect(() => saveCustomers(customers), [customers]);

  const [dbStatus, setDbStatus] = React.useState<string>("");

  const activeCustomer = React.useMemo(() => {
    if (!activeCustomerId) return null;
    return customers.find((c) => c.id === activeCustomerId) ?? null;
  }, [customers, activeCustomerId]);

  function openProfile(id: string) {
    setActiveCustomerId(id);
    setRoute("profile");
  }
  function backHome() {
    setRoute("home");
  }

  async function refreshCustomers(tryUploadLocalIfEmpty = true) {
    try {
      setDbStatus("Nalagam…");
      const list = await fetchCustomersFromDb();

      if (list.length > 0) {
        setCustomers(list);
        setDbStatus("");
        return;
      }

      if (tryUploadLocalIfEmpty) {
        const local = loadCustomers();
        if (local.length > 0) {
          await upsertManyCustomersToDb(local);
          setCustomers(local);
        }
      }

      setDbStatus("");
    } catch (e: any) {
      console.error(e);
      setDbStatus("Napaka DB: " + (e?.message ?? String(e)));
    }
  }

  React.useEffect(() => {
    refreshCustomers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCustomerAndPersist(c: Customer) {
    setCustomers((p) => [c, ...p]);
    try {
      await upsertCustomerToDb(c);
      setDbStatus("");
    } catch (e: any) {
      console.error(e);
      setDbStatus("Napaka shranjevanja: " + (e?.message ?? String(e)));
    }
  }

  function updateCustomerLocalAndDb(next: Customer) {
    setCustomers((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    upsertCustomerToDb(next)
      .then(() => setDbStatus(""))
      .catch((e: any) => {
        console.error(e);
        setDbStatus("Napaka shranjevanja: " + (e?.message ?? String(e)));
      });
  }

  function deleteCustomer(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (activeCustomerId === id) {
      setActiveCustomerId(null);
      setRoute("home");
    }
    deleteCustomerFromDb(id).catch(console.error);
  }

  // ===== HOME: draft delovni nalog =====
  const [draftDate, setDraftDate] = React.useState<string>(todayISO());
  const [draftServices, setDraftServices] = React.useState<string>("");
  const [showPricelist, setShowPricelist] = React.useState<boolean>(false);

  function addLineFromPricelist(item: PriceItem) {
    const line = `- ${item.label} (${item.priceText})`;
    setDraftServices((prev) => (prev.trim() ? `${prev.trim()}\n${line}\n` : `${line}\n`));
  }

  function clearDraft() {
    setDraftServices("");
    setShowPricelist(false);
  }

  function saveDraftToCustomer(customerId: string) {
    const text = draftServices.trim();
    if (!text) {
      openProfile(customerId);
      return;
    }

    const wo: WorkOrder = { id: uid("wo"), date: draftDate, services: text, status: "Odprti", createdAt: new Date().toISOString() };

    const current = customers.find((c) => c.id === customerId);
    if (!current) return;

    const next: Customer = { ...current, workOrders: [wo, ...(current.workOrders ?? [])] };
    clearDraft();
    openProfile(customerId);
    updateCustomerLocalAndDb(next);
  }

  return (
    <div className="app">
      <header className="appHeader">
        <div className="appTitle">
          <div className="appH1">Bike Service App</div>
        </div>

        <button className="themeBtn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "☀️ Svetla" : "🌙 Temna"}
        </button>
      </header>

      {route === "home" && (
        <main className="appMain" style={{ maxWidth: 1200 }}>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 420px" }}>
            <section className="card" style={{ padding: 16 }}>
              <div className="row" style={{ marginBottom: 10 }}>
                <div className="cardTitle">Delovni nalog</div>
                <button className="btn btnDanger" type="button" onClick={clearDraft}>
                  Počisti
                </button>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ maxWidth: 260 }}>
                  <Label>Datum</Label>
                  <input className="input" type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} />
                </div>

                <div>
                  <Label>Delo / servisi</Label>
                  <textarea className="input" value={draftServices} onChange={(e) => setDraftServices(e.target.value)} rows={3} style={{ resize: "vertical" }} />
                </div>

                <div className="row" style={{ gap: 10 }}>
                  <button className="btn" type="button" onClick={() => setShowPricelist((v) => !v)}>
                    + Dodaj iz cenika
                  </button>
                </div>

                {showPricelist && (
                  <InlinePricelistSimple
                    onPick={(item) => {
                      addLineFromPricelist(item);
                      setShowPricelist(false);
                    }}
                    onClose={() => setShowPricelist(false)}
                  />
                )}
              </div>
            </section>

            <section className="card" style={{ padding: 16 }}>
              <div className="row" style={{ marginBottom: 10, alignItems: "baseline" }}>
                <div className="cardTitle">Stranke</div>
                <div style={{ flex: 1 }} />
                {dbStatus ? (
                  <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
                    {dbStatus}
                  </div>
                ) : null}
              </div>

              <CustomersPanel customers={customers} onAdd={addCustomerAndPersist} onCustomerClick={saveDraftToCustomer} onRefresh={() => refreshCustomers(false)} onOpenProfile={openProfile} />
            </section>
          </div>
        </main>
      )}

      {route === "profile" && activeCustomer && (
        <ProfilePage customer={activeCustomer} onBack={backHome} onDelete={() => deleteCustomer(activeCustomer.id)} onSave={(next) => updateCustomerLocalAndDb(next)} />
      )}

      {route === "profile" && !activeCustomer && (
        <main className="appMain">
          <section className="card" style={{ padding: 16 }}>
            <div className="cardTitle">Stranka ne obstaja več</div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={backHome} type="button">
                ← Nazaj
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

/* ===================== HOME: CENIK ===================== */
function InlinePricelistSimple(props: { onPick: (item: PriceItem) => void; onClose: () => void }) {
  const PLACEHOLDER = "Iskanje…";
  const [q, setQ] = React.useState<string>(PLACEHOLDER);
  const query = normalize(q === PLACEHOLDER ? "" : q);

  const results = React.useMemo(() => {
    if (!query) return PRICELIST.slice(0, 18);
    return PRICELIST.filter((x) => normalize(`${x.category} ${x.label} ${x.priceText}`).includes(query)).slice(0, 30);
  }, [query]);

  function pick(item: PriceItem) {
    props.onPick(item);
    setQ(PLACEHOLDER);
    props.onClose();
  }

  return (
    <div style={{ border: "2px solid var(--border)", borderRadius: 16, padding: 12 }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 900 }}>Cenik</div>
        <button className="btn btnDanger" type="button" onClick={props.onClose}>
          Zapri
        </button>
      </div>

      <input
        className="input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          if (q === PLACEHOLDER) setQ("");
        }}
        placeholder={PLACEHOLDER}
      />

      <div style={{ marginTop: 10, border: "2px solid var(--border)", borderRadius: 14, overflow: "hidden", maxHeight: 320, overflowY: "auto" }}>
        {results.map((r) => (
          <div key={r.id} onClick={() => pick(r)} style={{ padding: 10, borderBottom: "2px solid var(--border)", cursor: "pointer" }}>
            <div className="row">
              <div>
                <div style={{ fontWeight: 800 }}>{r.label}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {r.category}
                </div>
              </div>
              <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{r.priceText}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== HOME: STRANKE ===================== */
function CustomersPanel(props: {
  customers: Customer[];
  onAdd: (c: Customer) => void | Promise<void>;
  onCustomerClick: (id: string) => void; // save draft + open profile
  onRefresh: () => void;
  onOpenProfile: (id: string) => void;
}) {
  const PLACEHOLDER = "Iskanje…";
  const [q, setQ] = React.useState<string>(PLACEHOLDER);
  const qn = normalize((q === PLACEHOLDER ? "" : q).trim());
  const [openOnly, setOpenOnly] = React.useState(false);

  const baseList = React.useMemo(() => (openOnly ? props.customers.filter(hasOpen) : props.customers), [openOnly, props.customers]);

  const matches = React.useMemo(() => {
    if (!qn) return openOnly ? baseList.slice(0, 30) : []; // ključ: brez iskanja se ne pokaže seznam
    return baseList.filter((c) => normalize(`${c.name} ${c.phone ?? ""} ${c.email ?? ""}`).includes(qn)).slice(0, 30);
  }, [qn, baseList, openOnly]);

  const [newName, setNewName] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");

  async function addCustomer() {
    const name = newName.trim();
    if (!name) return;

    const c: Customer = {
      id: uid("cust"),
      name,
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      createdAt: new Date().toISOString(),
      workOrders: [],
      susFork: [],
      susShock: [],
      seatpost: [],
      bikes: [],
    };

    await props.onAdd(c);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setQ(PLACEHOLDER);
  }

  return (
    <div>
      <div className="row" style={{ gap: 10 }}>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (q === PLACEHOLDER) setQ("");
          }}
          placeholder={PLACEHOLDER}
        />

        <button className="btn" type="button" onClick={props.onRefresh}>
          Osveži
        </button>

        <button
          className="btn"
          type="button"
          onClick={() => setOpenOnly((v) => !v)}
          style={openOnly ? { background: "#16a34a", borderColor: "#16a34a", color: "white" } : undefined}
        >
          Odprti
        </button>
      </div>

      {(matches.length > 0 || openOnly) && (
        <div style={{ marginTop: 12, border: "2px solid var(--border)", borderRadius: 16, overflow: "hidden", maxHeight: 420, overflowY: "auto" }}>
          {matches.length === 0 ? (
            <div style={{ padding: 12 }} className="muted">
              Ni zadetkov.
            </div>
          ) : (
            matches.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  props.onCustomerClick(c.id);
                  setQ(PLACEHOLDER);
                }}
                style={{ padding: 12, borderBottom: "2px solid var(--border)", cursor: "pointer" }}
              >
                <div className="row">
                  <div style={{ fontWeight: 900 }}>{c.name}</div>
                  {hasOpen(c) && <span className="pill">Odprti</span>}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {c.phone ? c.phone : "—"} {c.email ? `• ${c.email}` : ""}
                </div>

                {/* če hočeš samo odpret profil brez delovnega naloga: dvojni klik */}
                <div style={{ fontSize: 11 }} className="muted" onClick={(e) => e.stopPropagation()}>
                  <button className="btn" type="button" onClick={() => props.onOpenProfile(c.id)} style={{ marginTop: 8, padding: "6px 10px" }}>
                    Odpri profil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>+ Nova stranka</div>
        <div style={{ display: "grid", gap: 10 }}>
          <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ime in priimek" />
          <input className="input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Telefon (neobvezno)" />
          <input className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Mail (neobvezno)" />
          <button className="btn" onClick={addCustomer} type="button">
            Dodaj stranko
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== PROFIL ===================== */
type PanelKey = "none" | "work" | "sus" | "bike";
type SusTab = "fork" | "shock" | "seatpost";

function ProfilePage(props: { customer: Customer; onBack: () => void; onDelete: () => void; onSave: (next: Customer) => void }) {
  const c = props.customer;

  const [open, setOpen] = React.useState<PanelKey>("none");
  const [susTab, setSusTab] = React.useState<SusTab>("fork");
  const [showCustomerDetails, setShowCustomerDetails] = React.useState(false);

  function toggle(k: PanelKey) {
    setOpen((cur) => (cur === k ? "none" : k));
  }

  const workOrders = c.workOrders ?? [];
  const susFork = c.susFork ?? [];
  const susShock = c.susShock ?? [];
  const seatpost = c.seatpost ?? [];
  const bikes = c.bikes ?? [];

  function patch(patch: Partial<Customer>) {
    props.onSave({ ...c, ...patch });
  }

  return (
    <main className="appMain" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={props.onBack} type="button">
          ← Nazaj
        </button>
        <button className="btn btnDanger" onClick={props.onDelete} type="button">
          Odstrani
        </button>
      </div>

      <section className="card" style={{ padding: 12 }}>
        <div className="row" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setShowCustomerDetails((v) => !v)}>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{c.name}</div>
          <div style={{ flex: 1 }} />
          <div className="muted" style={{ fontSize: 16, fontWeight: 900 }}>
            {showCustomerDetails ? "▾" : "▸"}
          </div>
        </div>

        {showCustomerDetails && (
          <div style={{ display: "grid", gap: 8, maxWidth: 520, marginTop: 12 }}>
            <EditableField label="Ime" value={c.name} onCommit={(v) => patch({ name: v })} />
            <EditableField label="Telefon" value={c.phone ?? ""} onCommit={(v) => patch({ phone: v.trim() ? v : undefined })} />
            <EditableField label="Mail" value={c.email ?? ""} onCommit={(v) => patch({ email: v.trim() ? v : undefined })} />
          </div>
        )}
      </section>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <AccordionCard title="Delovni nalogi" isOpen={open === "work"} onToggle={() => toggle("work")}>
          <WorkOrdersList items={workOrders} onDone={(id) => patch({ workOrders: workOrders.filter((x) => x.id !== id) })} />
        </AccordionCard>

        <AccordionCard title="Vzmetenje" isOpen={open === "sus"} onToggle={() => toggle("sus")}>
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <TabBtn active={susTab === "fork"} onClick={() => setSusTab("fork")}>
              Fork
            </TabBtn>
            <TabBtn active={susTab === "shock"} onClick={() => setSusTab("shock")}>
              Shock
            </TabBtn>
            <TabBtn active={susTab === "seatpost"} onClick={() => setSusTab("seatpost")}>
              Seatpost
            </TabBtn>
          </div>

          {susTab === "fork" && <SimpleListTable label="Fork" items={susFork} onSave={(next) => patch({ susFork: next })} />}
          {susTab === "shock" && <SimpleListTable label="Shock" items={susShock} onSave={(next) => patch({ susShock: next })} />}
          {susTab === "seatpost" && <SeatpostTable items={seatpost} onSave={(next) => patch({ seatpost: next })} />}
        </AccordionCard>

        <AccordionCard title="Kolo" isOpen={open === "bike"} onToggle={() => toggle("bike")}>
          <BikeTable items={bikes} onSave={(next) => patch({ bikes: next })} />
        </AccordionCard>
      </div>
    </main>
  );
}

function AccordionCard(props: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: 12 }}>
      <div className="row" style={{ alignItems: "center", cursor: "pointer", userSelect: "none" }} onClick={props.onToggle}>
        <div style={{ fontWeight: 900 }}>{props.title}</div>
        <div style={{ flex: 1 }} />
        <div className="muted" style={{ fontSize: 16, fontWeight: 900 }}>
          {props.isOpen ? "▾" : "▸"}
        </div>
      </div>
      {props.isOpen && <div style={{ marginTop: 12 }}>{props.children}</div>}
    </section>
  );
}

function TabBtn(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className="btn" type="button" onClick={props.onClick} style={props.active ? { background: "#16a34a", borderColor: "#16a34a", color: "white" } : { background: "transparent" }}>
      {props.children}
    </button>
  );
}

/* ===== KLJUČ: onCommit (shrani ob blur) — ne bo “samo prva črka” ===== */
function EditableField(props: { label: string; value: string; onCommit: (v: string) => void }) {
  const [v, setV] = React.useState(props.value);
  React.useEffect(() => setV(props.value), [props.value]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center", textAlign: "left" }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
        {props.label}
      </div>
      <input
        className="input"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => props.onCommit(v)}
      />
    </div>
  );
}

function WorkOrdersList(props: { items: WorkOrder[]; onDone: (id: string) => void }) {
  if (props.items.length === 0) return <div className="muted">Ni delovnih nalogov.</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.items.map((x) => (
        <div key={x.id} style={{ border: "2px solid var(--border)", borderRadius: 16, padding: 12 }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, whiteSpace: "pre-wrap" }}>{x.services}</div>
            </div>
            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
              <span className="pill">{x.date}</span>
              <span className="pill">Odprti</span>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div style={{ flex: 1 }} />
            <button className="btn btnDanger" onClick={() => props.onDone(x.id)} type="button">
              Zaključi
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===================== SIMPLE TABLES (minimal, stabilno) ===================== */
function SimpleListTable(props: { label: string; items: SuspensionEntry[]; onSave: (next: SuspensionEntry[]) => void }) {
  const [date, setDate] = React.useState<string>(todayISO());
  const [model, setModel] = React.useState("");
  const [serial, setSerial] = React.useState("");
  const [service, setService] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function add() {
    if (!model.trim() && !serial.trim() && !service.trim() && !notes.trim()) return;
    const e: SuspensionEntry = {
      id: uid("sus"),
      date,
      model: model.trim(),
      serial: serial.trim(),
      psi: "",
      vsPreload: "",
      lsc: "",
      hsc: "",
      lsr: "",
      hsr: "",
      service: service.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    props.onSave([e, ...props.items]);
    setModel("");
    setSerial("");
    setService("");
    setNotes("");
  }

  const cols = "0.9fr 1.2fr 1.2fr 1.2fr 1.6fr 56px";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 900 }}>
        {props.label.toUpperCase()}
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "160px 1fr 1fr" }}>
        <Field label="Datum">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Model">
          <input className="input" value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
        <Field label="Serijska">
          <input className="input" value={serial} onChange={(e) => setSerial(e.target.value)} />
        </Field>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Servis">
          <input className="input" value={service} onChange={(e) => setService(e.target.value)} />
        </Field>
        <Field label="Opombe">
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      <button className="btn" onClick={add} type="button">
        + Shrani vnos
      </button>

      {props.items.length === 0 ? (
        <div className="muted">Ni vnosov.</div>
      ) : (
        <TableShell>
          <TableHeader cols={cols}>
            <div style={cellBase}>Datum</div>
            <div style={cellBase}>Model</div>
            <div style={cellBase}>Serijska</div>
            <div style={cellBase}>Servis</div>
            <div style={cellBase}>Opombe</div>
            <div style={{ textAlign: "right" }}>✕</div>
          </TableHeader>

          {props.items.map((x, idx) => (
            <TableRow key={x.id} cols={cols} isLast={idx === props.items.length - 1}>
              <div style={cellBase}>{x.date || "—"}</div>
              <div style={{ ...cellBase, fontWeight: 800 }}>{x.model || "—"}</div>
              <div style={cellBase} className="muted">
                {x.serial || "—"}
              </div>
              <div style={cellBase}>{x.service || "—"}</div>
              <div style={cellWrap} className="muted">
                {x.notes || "—"}
              </div>
              <div style={{ textAlign: "right" }}>
                <button className="btn btnDanger" type="button" onClick={() => props.onSave(props.items.filter((i) => i.id !== x.id))}>
                  ✕
                </button>
              </div>
            </TableRow>
          ))}
        </TableShell>
      )}
    </div>
  );
}

function SeatpostTable(props: { items: SeatpostEntry[]; onSave: (next: SeatpostEntry[]) => void }) {
  const [date, setDate] = React.useState<string>(todayISO());
  const [model, setModel] = React.useState("");
  const [serial, setSerial] = React.useState("");
  const [service, setService] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function add() {
    if (!model.trim() && !serial.trim() && !service.trim() && !notes.trim()) return;
    const e: SeatpostEntry = { id: uid("sp"), date, model: model.trim(), serial: serial.trim(), service: service.trim(), notes: notes.trim(), createdAt: new Date().toISOString() };
    props.onSave([e, ...props.items]);
    setModel("");
    setSerial("");
    setService("");
    setNotes("");
  }

  const cols = "0.9fr 1.2fr 1.2fr 1.1fr 1.4fr 56px";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Field label="Datum">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Model">
          <input className="input" value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
        <Field label="Serijska">
          <input className="input" value={serial} onChange={(e) => setSerial(e.target.value)} />
        </Field>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Servis">
          <input className="input" value={service} onChange={(e) => setService(e.target.value)} />
        </Field>
        <Field label="Opombe">
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      <button className="btn" onClick={add} type="button">
        + Shrani vnos
      </button>

      {props.items.length === 0 ? (
        <div className="muted">Ni vnosov.</div>
      ) : (
        <TableShell>
          <TableHeader cols={cols}>
            <div style={cellBase}>Datum</div>
            <div style={cellBase}>Model</div>
            <div style={cellBase}>Serijska</div>
            <div style={cellBase}>Servis</div>
            <div style={cellBase}>Opombe</div>
            <div style={{ textAlign: "right" }}>✕</div>
          </TableHeader>

          {props.items.map((x, idx) => (
            <TableRow key={x.id} cols={cols} isLast={idx === props.items.length - 1}>
              <div style={cellBase}>{x.date || "—"}</div>
              <div style={{ ...cellBase, fontWeight: 800 }}>{x.model || "—"}</div>
              <div style={cellBase} className="muted">
                {x.serial || "—"}
              </div>
              <div style={cellBase}>{x.service || "—"}</div>
              <div style={cellWrap} className="muted">
                {x.notes || "—"}
              </div>
              <div style={{ textAlign: "right" }}>
                <button className="btn btnDanger" type="button" onClick={() => props.onSave(props.items.filter((i) => i.id !== x.id))}>
                  ✕
                </button>
              </div>
            </TableRow>
          ))}
        </TableShell>
      )}
    </div>
  );
}

function BikeTable(props: { items: BikeEntry[]; onSave: (next: BikeEntry[]) => void }) {
  const [date, setDate] = React.useState<string>(todayISO());
  const [bikeModel, setBikeModel] = React.useState("");
  const [service, setService] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function add() {
    if (!bikeModel.trim() && !service.trim() && !notes.trim()) return;
    const e: BikeEntry = { id: uid("bike"), date, bikeModel: bikeModel.trim(), service: service.trim(), notes: notes.trim(), createdAt: new Date().toISOString() };
    props.onSave([e, ...props.items]);
    setBikeModel("");
    setService("");
    setNotes("");
  }

  const cols = "0.9fr 1.3fr 1.1fr 1.5fr 56px";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "160px 1fr" }}>
        <Field label="Datum">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Model kolesa">
          <input className="input" value={bikeModel} onChange={(e) => setBikeModel(e.target.value)} />
        </Field>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Servis">
          <input className="input" value={service} onChange={(e) => setService(e.target.value)} />
        </Field>
        <Field label="Opombe">
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      <button className="btn" onClick={add} type="button">
        + Shrani vnos
      </button>

      {props.items.length === 0 ? (
        <div className="muted">Ni vnosov.</div>
      ) : (
        <TableShell>
          <TableHeader cols={cols}>
            <div style={cellBase}>Datum</div>
            <div style={cellBase}>Model</div>
            <div style={cellBase}>Servis</div>
            <div style={cellBase}>Opombe</div>
            <div style={{ textAlign: "right" }}>✕</div>
          </TableHeader>

          {props.items.map((x, idx) => (
            <TableRow key={x.id} cols={cols} isLast={idx === props.items.length - 1}>
              <div style={cellBase}>{x.date || "—"}</div>
              <div style={{ ...cellBase, fontWeight: 800 }}>{x.bikeModel || "—"}</div>
              <div style={cellBase}>{x.service || "—"}</div>
              <div style={cellWrap} className="muted">
                {x.notes || "—"}
              </div>
              <div style={{ textAlign: "right" }}>
                <button className="btn btnDanger" type="button" onClick={() => props.onSave(props.items.filter((i) => i.id !== x.id))}>
                  ✕
                </button>
              </div>
            </TableRow>
          ))}
        </TableShell>
      )}
    </div>
  );
}

/* ===================== UI HELPERS ===================== */
function Label(props: { children: React.ReactNode }) {
  return (
    <div className="muted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
      {props.children}
    </div>
  );
}
function Field(props: { label: string; tint?: "blue" | "red"; children: React.ReactNode }) {
  const color = props.tint === "blue" ? "#2563eb" : props.tint === "red" ? "#dc2626" : "var(--muted)";
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, color }}>{props.label}</div>
      {props.children}
    </div>
  );
}
