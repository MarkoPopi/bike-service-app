import React from "react";
import "./index.css";
import { supabase } from "./supabaseClient";

/* ===================== TYPES ===================== */
type WorkOrder = {
  id: string;
  date: string;
  services: string;
  status: "Odprti";
  createdAt: string;
};

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

type SeatpostEntry = {
  id: string;
  date: string;
  model: string;
  serial: string;
  service: string;
  notes: string;
  createdAt: string;
};

type BikeEntry = {
  id: string;
  date: string;
  bikeModel: string;
  service: string;
  notes: string;
  createdAt: string;
};

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

type PriceItem = {
  id: string;
  category: string;
  label: string;
  priceText: string;
  isPackage?: boolean; // <-- pomembno (da TS ne jamra)
};

/* ===================== CENIK (osnova) ===================== */
const PRICELIST: PriceItem[] = [
  // ===================== PAKETI =====================
  { id: "pkg_basic", category: "Paketi", label: "Osnovni servis", priceText: "58,00 €", isPackage: true },
  { id: "pkg_basic_ebike", category: "Paketi", label: "Osnovni servis – e-kolo", priceText: "68,00 €", isPackage: true },
  { id: "pkg_regular", category: "Paketi", label: "Redni servis", priceText: "80,00 €", isPackage: true },
  { id: "pkg_regular_ebike", category: "Paketi", label: "Redni servis – e-kolo", priceText: "90,00 €", isPackage: true },

  { id: "pkg_gen_mtb_ht", category: "Paketi", label: "Generalni servis gorskega kolesa s prednjim vzmetenjem", priceText: "135,00 €", isPackage: true },
  { id: "pkg_gen_emtb_ht", category: "Paketi", label: "Generalni servis gorskega e-kolesa s prednjim vzmetenjem", priceText: "145,00 €", isPackage: true },
  { id: "pkg_gen_mtb_fs", category: "Paketi", label: "Generalni servis polnovzmetenega gorskega kolesa", priceText: "170,00 €", isPackage: true },
  { id: "pkg_gen_emtb_fs", category: "Paketi", label: "Generalni servis polnovzmetenega gorskega e-kolesa", priceText: "180,00 €", isPackage: true },

  { id: "pkg_bmx", category: "Paketi", label: "Redni servis BMX kolesa", priceText: "58,00 €", isPackage: true },
  { id: "pkg_web_build", category: "Paketi", label: "Sestava in nastavitev kolesa iz spletnega nakupa", priceText: "Po delovnih urah", isPackage: true },

  // ===================== POSAMEZNI SERVISI =====================
  { id: "srv_hour", category: "Posamezni servisi", label: "Servisna ura", priceText: "58,00 €" },
  { id: "srv_priority", category: "Posamezni servisi", label: "Popravilo mimo vrste (doplačilo)", priceText: "50 %" },

  { id: "srv_wash_fast", category: "Posamezni servisi", label: "Hitro pranje kolesa", priceText: "16,00 €" },
  { id: "srv_wash_full", category: "Posamezni servisi", label: "Temeljito pranje kolesa z razmaščevanjem pogonskega sklopa", priceText: "50,00 €" },

  { id: "srv_fork_swap", category: "Posamezni servisi", label: "Zamenjava vilice", priceText: "25,00 €" },
  { id: "srv_handlebar_swap", category: "Posamezni servisi", label: "Zamenjava krmila", priceText: "20,00 €" },
  { id: "srv_handlebar_internal", category: "Posamezni servisi", label: "Zamenjava krmila z notranjo napeljavo", priceText: "Po delovnih urah" },
  { id: "srv_bar_tape", category: "Posamezni servisi", label: "Zamenjava krmilnega traku", priceText: "20,00 €" },

  { id: "srv_bb_swap", category: "Posamezni servisi", label: "Zamenjava gonilnega ležaja", priceText: "20,00 €" },
  { id: "srv_headset_swap", category: "Posamezni servisi", label: "Zamenjava krmilnega ležaja", priceText: "33,00 €" },
  { id: "srv_cranks_swap", category: "Posamezni servisi", label: "Zamenjava gonilk", priceText: "17,00 €" },

  { id: "srv_true_wheel", category: "Posamezni servisi", label: "Centriranje obročnika", priceText: "15,00 €" },
  { id: "srv_wheel_build", category: "Posamezni servisi", label: "Pletenje obročnika (tudi pri zamenjavi obroča ali pesta)", priceText: "58,00 €" },
  { id: "srv_front_hub_repair", category: "Posamezni servisi", label: "Popravilo prednjega pesta", priceText: "Po delovnih urah" },
  { id: "srv_rear_hub_repair", category: "Posamezni servisi", label: "Popravilo zadnjega pesta", priceText: "Po delovnih urah" },

  { id: "srv_chainring_front", category: "Posamezni servisi", label: "Zamenjava prednjega zobnika", priceText: "Od 15,00 € naprej" },
  { id: "srv_cassette_swap", category: "Posamezni servisi", label: "Zamenjava zadnjega verižnika", priceText: "15,00 €" },
  { id: "srv_chain_swap", category: "Posamezni servisi", label: "Zamenjava ali popravilo verige", priceText: "15,00 €" },

  { id: "srv_tire_tube_simple", category: "Posamezni servisi", label: "Zamenjava plašča z zračnico", priceText: "13,00 €" },
  { id: "srv_tire_tube_complex", category: "Posamezni servisi", label: "Zamenjava plašča z zračnico – kompleksna", priceText: "17,00 €" },
  { id: "srv_tire_tubeless_swap", category: "Posamezni servisi", label: "Zamenjava plašča tubeless (tesnilna tekočina vključena, brez menjave traku)", priceText: "18,00 €" },
  { id: "srv_rim_tubeless_prep", category: "Posamezni servisi", label: "Priprava obročnika za tubeless (trak+ventil; trak vključen)", priceText: "18,00 €" },
  { id: "srv_tubeless_system", category: "Posamezni servisi", label: "Izdelava tubeless sistema (trak+ventil+tesnilna tekočina vključeno)", priceText: "30,00 €" },

  { id: "srv_tube_swap", category: "Posamezni servisi", label: "Zamenjava zračnice", priceText: "12,00 €" },
  { id: "srv_tube_swap_complex", category: "Posamezni servisi", label: "Zamenjava zračnice – kompleksna", priceText: "15,00 €" },

  { id: "srv_spoke_swap", category: "Posamezni servisi", label: "Zamenjava napere", priceText: "Po delovnih urah" },
  { id: "srv_cable_housing", category: "Posamezni servisi", label: "Zamenjava pletenice/bovdna + nova nastavitev zavore/menjalnika", priceText: "17,00 €" },

  { id: "srv_derailleur_adjust", category: "Posamezni servisi", label: "Nastavitev menjalnika", priceText: "15,00 €" },
  { id: "srv_derailleur_swap_adjust", category: "Posamezni servisi", label: "Zamenjava in nastavitev menjalnika", priceText: "30,00 €" },
  { id: "srv_shifter_repair", category: "Posamezni servisi", label: "Popravilo ali zamenjava prestavne ročke", priceText: "Po delovnih urah" },

  { id: "srv_hydro_brake_install", category: "Zavore", label: "Montaža hidravlične zavore (prednja ali zadnja)", priceText: "Po delovnih urah" },
  { id: "srv_brake_adjust", category: "Zavore", label: "Nastavitev zavor", priceText: "Od 17,00 € naprej" },
  { id: "srv_brake_bleed", category: "Zavore", label: "Zračenje hidravlične zavore z menjavo olja (olje vključeno)", priceText: "22,00 €" },
  { id: "srv_pads_swap", category: "Zavore", label: "Zamenjava zavornih oblog + nastavitev zavore", priceText: "24,00 €" },
  { id: "srv_hydro_parts_swap", category: "Zavore", label: "Zamenjava ročke/čeljusti/cevi (zračenje vključeno)", priceText: "Po delovnih urah" },
  { id: "srv_rotor_swap", category: "Zavore", label: "Zamenjava rotorja", priceText: "12,00 €" },

  { id: "srv_dropper_install", category: "Posamezni servisi", label: "Montaža potopne sedežne opore", priceText: "Po delovnih urah" },
  { id: "srv_pedals_swap", category: "Posamezni servisi", label: "Zamenjava pedal", priceText: "10,00 €" },
  { id: "srv_crank_thread_repair", category: "Posamezni servisi", label: "Popravilo navoja gonilke za pedal (vložek vključen)", priceText: "29,00 €" },

  { id: "srv_ebike_diag", category: "E-kolo", label: "Diagnostika/iskanje napak na e-kolesu", priceText: "Po delovnih urah" },
  { id: "srv_ebike_update", category: "E-kolo", label: "Posodobitev programske opreme e-kolesa", priceText: "25,00 €" },
  { id: "srv_bosch_hibernate", category: "E-kolo", label: "Bosch baterija – priprava na hibernacijo", priceText: "25,00 €" },
  { id: "srv_bosch_capacity", category: "E-kolo", label: "Bosch baterija – test kapacitete", priceText: "35,00 €" },

  // ===================== DOPLAČILA =====================
  { id: "extra_internal", category: "Doplačila", label: "Doplačilo: notranja napeljava bovdnov", priceText: "15,00 €" },
  { id: "extra_rim_insert", category: "Doplačila", label: "Doplačilo: zaščitni vložki obročev", priceText: "15,00 €" },
  { id: "extra_storage", category: "Doplačila", label: "Ležarina (na dan)", priceText: "5,00 € / dan" },
  { id: "extra_special_bikes", category: "Doplačila", label: "Posebna športna kolesa (triatlon/aero) – dodatno delo", priceText: "58,00 € / uro" },

  // ===================== VILICE ROCKSHOX =====================
  { id: "rs_28_32_small", category: "Vilice RockShox", label: "28/30/32mm (brez SID/Reba/RS-1) – mali servis", priceText: "39,00 €" },
  { id: "rs_28_32_gen", category: "Vilice RockShox", label: "28/30/32mm (brez SID/Reba/RS-1) – generalni servis", priceText: "79,00 €" },

  { id: "rs_sid_small", category: "Vilice RockShox", label: "SID/Reba/RS-1/Totem (brez Charger) – mali servis", priceText: "39,00 €" },
  { id: "rs_sid_basic", category: "Vilice RockShox", label: "SID/Reba/RS-1/Totem (brez Charger) – osnovni servis", priceText: "63,00 €" },
  { id: "rs_sid_gen", category: "Vilice RockShox", label: "SID/Reba/RS-1/Totem (brez Charger) – generalni servis", priceText: "99,00 €" },

  { id: "rs_35_38_small", category: "Vilice RockShox", label: "35/38mm (brez Charger) – mali servis", priceText: "39,00 €" },
  { id: "rs_35_38_basic", category: "Vilice RockShox", label: "35/38mm (brez Charger) – osnovni servis", priceText: "85,00 €" },
  { id: "rs_35_38_gen", category: "Vilice RockShox", label: "35/38mm (brez Charger) – generalni servis", priceText: "105,00 €" },

  { id: "rs_charger_small", category: "Vilice RockShox", label: "Charger (BoXXer/Lyrik/Pike/ZEB/SID...) – mali servis", priceText: "39,00 €" },
  { id: "rs_charger_basic", category: "Vilice RockShox", label: "Charger (BoXXer/Lyrik/Pike/ZEB/SID...) – osnovni servis", priceText: "85,00 €" },
  { id: "rs_charger_gen", category: "Vilice RockShox", label: "Charger (BoXXer/Lyrik/Pike/ZEB/SID...) – generalni servis", priceText: "140,00 €" },

  // ===================== VILICE FOX & MARZOCCHI =====================
  { id: "fox32_small", category: "Vilice FOX & Marzocchi", label: "FOX 32 – mali servis", priceText: "39,00 €" },
  { id: "fox32_basic", category: "Vilice FOX & Marzocchi", label: "FOX 32 – osnovni servis", priceText: "89,00 €" },
  { id: "fox32_gen_na2", category: "Vilice FOX & Marzocchi", label: "FOX 32 (od 2016 naprej NA2) – generalni servis", priceText: "149,00 €" },
  { id: "fox32_gen_old", category: "Vilice FOX & Marzocchi", label: "FOX 32 (do 2016) – generalni servis", priceText: "119,00 €" },

  { id: "fox34_small", category: "Vilice FOX & Marzocchi", label: "FOX 34 / Marzocchi Z2 – mali servis", priceText: "39,00 €" },
  { id: "fox34_basic", category: "Vilice FOX & Marzocchi", label: "FOX 34 / Marzocchi Z2 – osnovni servis", priceText: "89,00 €" },
  { id: "fox34_gen_na2", category: "Vilice FOX & Marzocchi", label: "FOX 34 (od 2016 NA2) – generalni servis", priceText: "149,00 €" },
  { id: "fox34_gen_old", category: "Vilice FOX & Marzocchi", label: "FOX 34 (do 2016) – generalni servis", priceText: "125,00 €" },
  { id: "z2_gen", category: "Vilice FOX & Marzocchi", label: "Marzocchi Z2 – generalni servis", priceText: "149,00 €" },

  { id: "fox36_small", category: "Vilice FOX & Marzocchi", label: "FOX 36 / Marzocchi / DJ – mali servis", priceText: "39,00 €" },
  { id: "fox36_basic", category: "Vilice FOX & Marzocchi", label: "FOX 36 / Marzocchi / DJ – osnovni servis", priceText: "89,00 €" },
  { id: "fox36_gen_na3", category: "Vilice FOX & Marzocchi", label: "FOX 36 (od 2016 NA3) – generalni servis", priceText: "169,00 €" },
  { id: "fox36_gen_2015_2025", category: "Vilice FOX & Marzocchi", label: "FOX 36 (2015–2025 NA/NA2) – generalni servis", priceText: "159,00 €" },
  { id: "fox36_gen_to2025", category: "Vilice FOX & Marzocchi", label: "FOX 36 (do 2025) – generalni servis", priceText: "139,00 €" },
  { id: "z1_gen", category: "Vilice FOX & Marzocchi", label: "Marzocchi Z1 – generalni servis", priceText: "155,00 €" },
  { id: "z1_coil_gen", category: "Vilice FOX & Marzocchi", label: "Marzocchi Z1 COIL – generalni servis", priceText: "143,00 €" },

  { id: "fox38_small", category: "Vilice FOX & Marzocchi", label: "FOX 38 – mali servis", priceText: "39,00 €" },
  { id: "fox38_basic", category: "Vilice FOX & Marzocchi", label: "FOX 38 – osnovni servis", priceText: "92,00 €" },
  { id: "fox38_gen", category: "Vilice FOX & Marzocchi", label: "FOX 38 (vsi modeli) – generalni servis", priceText: "169,00 €" },

  { id: "fox40_small", category: "Vilice FOX & Marzocchi", label: "FOX 40 / Bomber 58 – mali servis", priceText: "39,00 €" },
  { id: "fox40_basic", category: "Vilice FOX & Marzocchi", label: "FOX 40 / Bomber 58 – osnovni servis", priceText: "95,00 €" },
  { id: "fox40_gen_na2", category: "Vilice FOX & Marzocchi", label: "FOX 40 (od 2016 NA2) – generalni servis", priceText: "175,00 €" },
  { id: "fox40_gen_old", category: "Vilice FOX & Marzocchi", label: "FOX 40 (do 2016) – generalni servis", priceText: "140,00 €" },
  { id: "bomber58_gen", category: "Vilice FOX & Marzocchi", label: "Marzocchi Bomber 58 – generalni servis", priceText: "174,00 €" },

  // ===================== AMORTIZERJI ROCKSHOX =====================
  { id: "rs_monarch_small", category: "Amortizerji RockShox", label: "Monarch – mali servis", priceText: "32,00 €" },
  { id: "rs_monarch_gen", category: "Amortizerji RockShox", label: "Monarch – generalni servis", priceText: "110,00 €" },

  { id: "rs_deluxe_small", category: "Amortizerji RockShox", label: "Deluxe/Super Deluxe Air/Monarch Plus – mali servis", priceText: "32,00 €" },
  { id: "rs_deluxe_gen", category: "Amortizerji RockShox", label: "Deluxe/Super Deluxe Air/Monarch Plus – generalni servis", priceText: "119,00 €" },

  { id: "rs_thrshaft_small", category: "Amortizerji RockShox", label: "Deluxe Thru-Shaft/Monarch XX – mali servis", priceText: "35,00 €" },
  { id: "rs_thrshaft_gen", category: "Amortizerji RockShox", label: "Deluxe Thru-Shaft/Monarch XX – generalni servis", priceText: "125,00 €" },

  { id: "rs_vivid_air_small", category: "Amortizerji RockShox", label: "Vivid Air – mali servis", priceText: "35,00 €" },
  { id: "rs_vivid_air_gen", category: "Amortizerji RockShox", label: "Vivid Air – generalni servis", priceText: "132,00 €" },

  { id: "rs_coil_gen", category: "Amortizerji RockShox", label: "Super Deluxe Coil/Vivid Coil/Kage – generalni servis", priceText: "115,00 €" },

  // ===================== AMORTIZERJI FOX =====================
  { id: "fox_float_r_small", category: "Amortizerji FOX", label: "Float R/RP/RP2/RP23/CTD/DPS/NUDE – mali servis", priceText: "32,00 €" },
  { id: "fox_float_r_gen", category: "Amortizerji FOX", label: "Float R/RP/RP2/RP23/CTD/DPS/NUDE – generalni servis", priceText: "109,00 €" },

  { id: "fox_floatx_small", category: "Amortizerji FOX", label: "Float X/DPX2/DHX Air – mali servis", priceText: "32,00 €" },
  { id: "fox_floatx_gen", category: "Amortizerji FOX", label: "Float X/DPX2/DHX Air – generalni servis", priceText: "119,00 €" },

  { id: "fox_floatx2_small", category: "Amortizerji FOX", label: "Float X2 – mali servis", priceText: "34,00 €" },
  { id: "fox_floatx2_gen", category: "Amortizerji FOX", label: "Float X2 – generalni servis", priceText: "125,00 €" },

  { id: "fox_drcv_small", category: "Amortizerji FOX", label: "Float DRCV – mali servis", priceText: "32,00 €" },
  { id: "fox_drcv_gen", category: "Amortizerji FOX", label: "Float DRCV – generalni servis", priceText: "119,00 €" },

  { id: "fox_nude_gen", category: "Amortizerji FOX", label: "Float NUDE 3-5/T/TR – generalni servis", priceText: "115,00 €" },
  { id: "fox_dhx2_gen", category: "Amortizerji FOX", label: "DHX2 / DHX RC2/RC4 – generalni servis", priceText: "115,00 €" },
  { id: "fox_van_gen", category: "Amortizerji FOX", label: "VAN R/RC, DHX 3.0/4.0/5.0 – generalni servis", priceText: "110,00 €" },

  // ===================== SEDEŽNE OPORE =====================
  { id: "reverb_small", category: "Potopne sedežne opore", label: "RockShox Reverb – mali servis", priceText: "29,00 €" },
  { id: "reverb_gen", category: "Potopne sedežne opore", label: "RockShox Reverb – generalni servis", priceText: "115,00 €" },
  { id: "reverb_gen_no_bleed", category: "Potopne sedežne opore", label: "RockShox Reverb – generalni servis (brez zračenja cevi/ročke)", priceText: "105,00 €" },
  { id: "reverb_bleed", category: "Potopne sedežne opore", label: "RockShox Reverb – zračenje cevi in ročke", priceText: "18,00 €" },

  { id: "transfer_small", category: "Potopne sedežne opore", label: "FOX Transfer – mali servis", priceText: "29,00 €" },
  { id: "transfer_gen", category: "Potopne sedežne opore", label: "FOX Transfer – generalni servis", priceText: "115,00 €" },
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

/* ===== Local backup (da nič ne izgubiš) ===== */
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

/* ===== Supabase DB helpers (customers tabela: id + payload jsonb) ===== */
async function fetchCustomersFromDb(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,payload,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as any[];
  return rows.map((r) => r.payload as Customer).filter(Boolean);
}

async function upsertCustomerToDb(customer: Customer): Promise<void> {
  const { data, error } = await supabase
    .from("customers")
    .upsert({ id: customer.id, payload: customer }, { onConflict: "id" });

  console.log("UPSERT RESULT:", { data, error });

  if (error) throw error;
}

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
const cellBase: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const cellWrap: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  whiteSpace: "normal",
  wordBreak: "break-word",
};

function TableShell(props: { children: React.ReactNode }) {
  return (
    <div style={{ border: "2px solid var(--border)", borderRadius: 16, overflow: "hidden", width: "100%" }}>
      {props.children}
    </div>
  );
}

function TableHeader(props: { cols: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: props.cols,
        gap: 0,
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
        gap: 0,
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
  const [theme, setTheme] = React.useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });
    const saveTimerRef = React.useRef<number | null>(null);
  const latestToSaveRef = React.useRef<Customer | null>(null);

  function scheduleUpsert(customer: Customer) {
    latestToSaveRef.current = customer;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      const c = latestToSaveRef.current;
      if (!c) return;
      upsertCustomerToDb(c).catch(console.error);
    }, 500);
  }

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

      // Če je DB prazna, pa imaš kaj v localStorage -> prenesi v DB (da nič ne izgubiš)
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
    // ob odprtju (PC ali telefon) prebere iz DB
    refreshCustomers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCustomerAndPersist(c: Customer) {
    setCustomers((p) => [c, ...p]);
    try {
      await upsertCustomerToDb(c);
    } catch (e) {
      console.error(e);
    }
  }

  function updateCustomer(id: string, patch: Partial<Customer>) {
    setCustomers((prev) => {
      let updatedCustomer: Customer | null = null;

      const next = prev.map((c) => {
        if (c.id !== id) return c;
        updatedCustomer = { ...c, ...patch };
        return updatedCustomer;
      });

      if (updatedCustomer) scheduleUpsert(updatedCustomer);
      return next;
    });
  }

if (updated) {
  upsertCustomerToDb(updated)
    .then(() => setDbStatus(""))
    .catch((e) => setDbStatus("Napaka shranjevanja: " + (e?.message ?? String(e))));
}
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

    const wo: WorkOrder = {
      id: uid("wo"),
      date: draftDate,
      services: text,
      status: "Odprti",
      createdAt: new Date().toISOString(),
    };

    let updated: Customer | null = null;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const list = c.workOrders ?? [];
        updated = { ...c, workOrders: [wo, ...list] };
        return updated;
      })
    );

    clearDraft();
    openProfile(customerId);

    if (updated) {
      upsertCustomerToDb(updated).catch(console.error);
    }
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
            {/* DELovni nalog */}
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

            {/* STRANKE */}
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

              <CustomersPanel
                customers={customers}
                onAdd={addCustomerAndPersist}
                onCustomerClick={(id) => saveDraftToCustomer(id)}
                onRefresh={() => refreshCustomers(false)}
              />
            </section>
          </div>
        </main>
      )}

      {route === "profile" && activeCustomer && (
        <ProfilePage
          customer={activeCustomer}
          onBack={backHome}
          onUpdate={(patch) => updateCustomer(activeCustomer.id, patch)}
          onDelete={() => deleteCustomer(activeCustomer.id)}
        />
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

      <div
        style={{
          marginTop: 10,
          border: "2px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
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
  onCustomerClick: (id: string) => void;
  onRefresh: () => void;
}) {
  const PLACEHOLDER = "Iskanje…";
  const [q, setQ] = React.useState<string>(PLACEHOLDER);
  const qn = normalize((q === PLACEHOLDER ? "" : q).trim());
  const [openOnly, setOpenOnly] = React.useState(false);

  const baseList = React.useMemo(() => (openOnly ? props.customers.filter(hasOpen) : props.customers), [openOnly, props.customers]);

  const matches = React.useMemo(() => {
    if (!qn) return openOnly ? baseList.slice(0, 30) : []; // <-- ključno: brez iskanja se ne pokaže seznam
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

function ProfilePage(props: { customer: Customer; onBack: () => void; onUpdate: (patch: Partial<Customer>) => void; onDelete: () => void }) {
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
<EditableField label="Ime" value={c.name} onCommit={(v) => props.onUpdate({ name: v })} />
<EditableField label="Telefon" value={c.phone ?? ""} onCommit={(v) => props.onUpdate({ phone: v.trim() ? v : undefined })} />
<EditableField label="Mail" value={c.email ?? ""} onCommit={(v) => props.onUpdate({ email: v.trim() ? v : undefined })} />
          </div>
        )}
      </section>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <AccordionCard title="Delovni nalogi" isOpen={open === "work"} onToggle={() => toggle("work")}>
          <WorkOrdersList items={workOrders} onDone={(id) => props.onUpdate({ workOrders: workOrders.filter((x) => x.id !== id) })} />
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

          {susTab === "fork" && (
            <SuspensionPanelTable
              kind="Fork"
              items={susFork}
              onAdd={(e) => props.onUpdate({ susFork: [e, ...susFork] })}
              onDelete={(id) => props.onUpdate({ susFork: susFork.filter((x) => x.id !== id) })}
            />
          )}

          {susTab === "shock" && (
            <SuspensionPanelTable
              kind="Shock"
              items={susShock}
              onAdd={(e) => props.onUpdate({ susShock: [e, ...susShock] })}
              onDelete={(id) => props.onUpdate({ susShock: susShock.filter((x) => x.id !== id) })}
            />
          )}

          {susTab === "seatpost" && (
            <SeatpostPanelTable
              items={seatpost}
              onAdd={(e) => props.onUpdate({ seatpost: [e, ...seatpost] })}
              onDelete={(id) => props.onUpdate({ seatpost: seatpost.filter((x) => x.id !== id) })}
            />
          )}
        </AccordionCard>

        <AccordionCard title="Kolo" isOpen={open === "bike"} onToggle={() => toggle("bike")}>
          <BikePanelTable items={bikes} onAdd={(e) => props.onUpdate({ bikes: [e, ...bikes] })} onDelete={(id) => props.onUpdate({ bikes: bikes.filter((x) => x.id !== id) })} />
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
    <button
      className="btn"
      type="button"
      onClick={props.onClick}
      style={props.active ? { background: "#16a34a", borderColor: "#16a34a", color: "white" } : { background: "transparent" }}
    >
      {props.children}
    </button>
  );
}

function EditableField(props: { label: string; value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = React.useState(props.value);

  React.useEffect(() => {
    setLocal(props.value);
  }, [props.value]);

  function commit() {
    if (local !== props.value) props.onChange(local);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center", textAlign: "left" }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
        {props.label}
      </div>
      <input
        className="input"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur(); // commit
          }
        }}
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

/* ===================== VZMETENJE: VNOS + TABELA (NO H-SCROLL) ===================== */
function SuspensionPanelTable(props: {
  kind: "Fork" | "Shock";
  items: SuspensionEntry[];
  onAdd: (e: SuspensionEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [date, setDate] = React.useState<string>(todayISO());
  const [model, setModel] = React.useState("");
  const [serial, setSerial] = React.useState("");
  const [psi, setPsi] = React.useState("");
  const [vsPreload, setVsPreload] = React.useState("");
  const [lsc, setLsc] = React.useState("");
  const [hsc, setHsc] = React.useState("");
  const [lsr, setLsr] = React.useState("");
  const [hsr, setHsr] = React.useState("");
  const [service, setService] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function add() {
    if (!model.trim() && !serial.trim() && !service.trim() && !notes.trim()) return;

    props.onAdd({
      id: uid("sus"),
      date,
      model: model.trim(),
      serial: serial.trim(),
      psi: psi.trim(),
      vsPreload: vsPreload.trim(),
      lsc: lsc.trim(),
      hsc: hsc.trim(),
      lsr: lsr.trim(),
      hsr: hsr.trim(),
      service: service.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });

    setModel("");
    setSerial("");
    setPsi("");
    setVsPreload("");
    setLsc("");
    setHsc("");
    setLsr("");
    setHsr("");
    setService("");
    setNotes("");
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 900 }}>
        {props.kind.toUpperCase()}
      </div>

      {/* VNOS */}
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

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr" }}>
        <Field label="PSI">
          <input className="input" value={psi} onChange={(e) => setPsi(e.target.value)} />
        </Field>
        <Field label="VS/Preload">
          <input className="input" value={vsPreload} onChange={(e) => setVsPreload(e.target.value)} />
        </Field>
        <Field label="LSC" tint="blue">
          <input className="input" value={lsc} onChange={(e) => setLsc(e.target.value)} />
        </Field>
        <Field label="HSC" tint="blue">
          <input className="input" value={hsc} onChange={(e) => setHsc(e.target.value)} />
        </Field>
        <Field label="LSR" tint="red">
          <input className="input" value={lsr} onChange={(e) => setLsr(e.target.value)} />
        </Field>
        <Field label="HSR" tint="red">
          <input className="input" value={hsr} onChange={(e) => setHsr(e.target.value)} />
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

      <SuspensionTableNoScroll items={props.items} onDelete={props.onDelete} />
    </div>
  );
}

function SuspensionTableNoScroll(props: { items: SuspensionEntry[]; onDelete: (id: string) => void }) {
  const { items, onDelete } = props;
  if (items.length === 0) return <div className="muted">Ni vnosov.</div>;

  const cols = "0.9fr 1.2fr 1.2fr 0.6fr 0.7fr 0.5fr 0.5fr 0.5fr 0.5fr 1.0fr 1.2fr 56px";

  return (
    <TableShell>
      <TableHeader cols={cols}>
        <div style={cellBase}>Datum</div>
        <div style={cellBase}>Model</div>
        <div style={cellBase}>Serijska</div>
        <div style={cellBase}>PSI</div>
        <div style={cellBase}>VS/Preload</div>
        <div style={{ ...cellBase, color: "#2563eb" }}>LSC</div>
        <div style={{ ...cellBase, color: "#2563eb" }}>HSC</div>
        <div style={{ ...cellBase, color: "#dc2626" }}>LSR</div>
        <div style={{ ...cellBase, color: "#dc2626" }}>HSR</div>
        <div style={cellBase}>Servis</div>
        <div style={cellBase}>Opombe</div>
        <div style={{ textAlign: "right" }}>✕</div>
      </TableHeader>

      {items.map((x, idx) => (
        <TableRow key={x.id} cols={cols} isLast={idx === items.length - 1}>
          <div style={cellBase}>{x.date || "—"}</div>
          <div style={{ ...cellBase, fontWeight: 800 }}>{x.model || "—"}</div>
          <div style={{ ...cellBase }} className="muted">
            {x.serial || "—"}
          </div>
          <div style={cellBase}>{x.psi || "—"}</div>
          <div style={cellBase}>{x.vsPreload || "—"}</div>
          <div style={{ ...cellBase, color: "#2563eb", fontWeight: 800 }}>{x.lsc || "—"}</div>
          <div style={{ ...cellBase, color: "#2563eb", fontWeight: 800 }}>{x.hsc || "—"}</div>
          <div style={{ ...cellBase, color: "#dc2626", fontWeight: 800 }}>{x.lsr || "—"}</div>
          <div style={{ ...cellBase, color: "#dc2626", fontWeight: 800 }}>{x.hsr || "—"}</div>
          <div style={cellBase}>{x.service || "—"}</div>
          <div style={cellWrap} className="muted">
            {x.notes || "—"}
          </div>
          <div style={{ textAlign: "right" }}>
            <button className="btn btnDanger" type="button" onClick={() => onDelete(x.id)}>
              ✕
            </button>
          </div>
        </TableRow>
      ))}
    </TableShell>
  );
}

/* ===================== SEATPOST: VNOS + TABELA ===================== */
function SeatpostPanelTable(props: { items: SeatpostEntry[]; onAdd: (e: SeatpostEntry) => void; onDelete: (id: string) => void }) {
  const [date, setDate] = React.useState<string>(todayISO());
  const [model, setModel] = React.useState("");
  const [serial, setSerial] = React.useState("");
  const [service, setService] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function add() {
    if (!model.trim() && !serial.trim() && !service.trim() && !notes.trim()) return;

    props.onAdd({
      id: uid("sp"),
      date,
      model: model.trim(),
      serial: serial.trim(),
      service: service.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });

    setModel("");
    setSerial("");
    setService("");
    setNotes("");
  }

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

      <SeatpostTableNoScroll items={props.items} onDelete={props.onDelete} />
    </div>
  );
}

function SeatpostTableNoScroll(props: { items: SeatpostEntry[]; onDelete: (id: string) => void }) {
  const { items, onDelete } = props;
  if (items.length === 0) return <div className="muted">Ni vnosov.</div>;

  const cols = "0.9fr 1.2fr 1.2fr 1.1fr 1.4fr 56px";

  return (
    <TableShell>
      <TableHeader cols={cols}>
        <div style={cellBase}>Datum</div>
        <div style={cellBase}>Model</div>
        <div style={cellBase}>Serijska</div>
        <div style={cellBase}>Servis</div>
        <div style={cellBase}>Opombe</div>
        <div style={{ textAlign: "right" }}>✕</div>
      </TableHeader>

      {items.map((x, idx) => (
        <TableRow key={x.id} cols={cols} isLast={idx === items.length - 1}>
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
            <button className="btn btnDanger" type="button" onClick={() => onDelete(x.id)}>
              ✕
            </button>
          </div>
        </TableRow>
      ))}
    </TableShell>
  );
}

/* ===================== KOLO: VNOS + TABELA ===================== */
function BikePanelTable(props: { items: BikeEntry[]; onAdd: (e: BikeEntry) => void; onDelete: (id: string) => void }) {
  const [date, setDate] = React.useState<string>(todayISO());
  const [bikeModel, setBikeModel] = React.useState("");
  const [service, setService] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function add() {
    if (!bikeModel.trim() && !service.trim() && !notes.trim()) return;

    props.onAdd({
      id: uid("bike"),
      date,
      bikeModel: bikeModel.trim(),
      service: service.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });

    setBikeModel("");
    setService("");
    setNotes("");
  }

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

      <BikeTableNoScroll items={props.items} onDelete={props.onDelete} />
    </div>
  );
}

function BikeTableNoScroll(props: { items: BikeEntry[]; onDelete: (id: string) => void }) {
  const { items, onDelete } = props;
  if (items.length === 0) return <div className="muted">Ni vnosov.</div>;

  const cols = "0.9fr 1.3fr 1.1fr 1.5fr 56px";

  return (
    <TableShell>
      <TableHeader cols={cols}>
        <div style={cellBase}>Datum</div>
        <div style={cellBase}>Model</div>
        <div style={cellBase}>Servis</div>
        <div style={cellBase}>Opombe</div>
        <div style={{ textAlign: "right" }}>✕</div>
      </TableHeader>

      {items.map((x, idx) => (
        <TableRow key={x.id} cols={cols} isLast={idx === items.length - 1}>
          <div style={cellBase}>{x.date || "—"}</div>
          <div style={{ ...cellBase, fontWeight: 800 }}>{x.bikeModel || "—"}</div>
          <div style={cellBase}>{x.service || "—"}</div>
          <div style={cellWrap} className="muted">
            {x.notes || "—"}
          </div>
          <div style={{ textAlign: "right" }}>
            <button className="btn btnDanger" type="button" onClick={() => onDelete(x.id)}>
              ✕
            </button>
          </div>
        </TableRow>
      ))}
    </TableShell>
  );
}

/* ===================== UI HELPERS ===================== */
function Label(props: { children: React.ReactNode }) {
  return (
    <div className="muted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
      {props.children}
    </div>
  );
}if (updated) {
  upsertCustomerToDb(updated)
    .then(() => setDbStatus(""))
    .catch((e) => setDbStatus("Napaka shranjevanja: " + (e?.message ?? String(e))));
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
