import React from "react";
import { supabase } from "./supabaseClient";

type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export default function App() {
  const [loading, setLoading] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [q, setQ] = React.useState("");

  function uid(prefix = "c") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  async function fetchCustomers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("id, payload, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchCustomers error:", error);
      alert("Napaka pri branju strank: " + error.message);
      setLoading(false);
      return;
    }

    const list: Customer[] = (data ?? [])
      .map((row: any) => row?.payload as Customer)
      .filter(Boolean);

    setCustomers(list);
    setLoading(false);
  }

  async function addCustomer() {
    const cleanName = name.trim();
    if (!cleanName) {
      alert("Vpiši ime in priimek.");
      return;
    }

    const customer: Customer = {
      id: uid("cust"),
      name: cleanName,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };

    const { data, error } = await supabase
      .from("customers")
      .insert({ id: customer.id, payload: customer })
      .select();

    if (error) {
      console.error("addCustomer error:", error);
      alert("Napaka pri shranjevanju: " + error.message);
      return;
    }

    // hitro osveži UI
    setCustomers((prev) => [customer, ...prev]);

    setName("");
    setPhone("");
    setEmail("");

    console.log("Inserted:", data);
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Zbrišem stranko?")) return;

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      console.error("deleteCustomer error:", error);
      alert("Napaka pri brisanju: " + error.message);
      return;
    }

    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  React.useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = customers.filter((c) => {
    const hay = `${c.name ?? ""} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 6 }}>Bike Service App</h2>

      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>
        DB: {import.meta.env.VITE_SUPABASE_URL || "MISSING VITE_SUPABASE_URL"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* LEVO: seznam */}
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Iskanje (ime / tel / mail)..."
              style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            />
            <button
              onClick={fetchCustomers}
              style={{ padding: "10px 12px", border: "1px solid #999", borderRadius: 8 }}
              disabled={loading}
            >
              {loading ? "Nalagam..." : "Osveži"}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
            Skupaj: {customers.length} | Prikaz: {filtered.length}
          </div>

          <div style={{ marginTop: 12 }}>
            {filtered.length === 0 ? (
              <div style={{ opacity: 0.7 }}>Ni strank.</div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      {c.phone ? `📞 ${c.phone}` : ""}
                      {c.phone && c.email ? "  •  " : ""}
                      {c.email ? `✉️ ${c.email}` : ""}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{c.id}</div>
                  </div>

                  <button
                    onClick={() => deleteCustomer(c.id)}
                    style={{ padding: "8px 10px", border: "1px solid #c33", borderRadius: 8 }}
                  >
                    Zbriši
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DESNO: dodaj */}
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>+ Nova stranka</h3>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ime in priimek"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, marginBottom: 10 }}
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon (neobvezno)"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, marginBottom: 10 }}
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Mail (neobvezno)"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}
          />

          <button
            onClick={addCustomer}
            style={{ width: "100%", padding: 12, border: "1px solid #999", borderRadius: 8, fontWeight: 700 }}
          >
            Dodaj stranko
          </button>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Nasvet: po dodajanju lahko na drugi napravi klikneš “Osveži”.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.65 }}>
        Če hočeš “live sync” brez ročnega osveževanja, ti dodam Realtime.
      </div>
    </div>
  );
}
