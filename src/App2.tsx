import React from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [status, setStatus] = React.useState("Ready");

  async function testDb() {
    const id = "dbg_" + Date.now();

    const { data, error } = await supabase
      .from("customers")
      .insert({ id, payload: { id, name: "DBG TEST" } })
      .select();

    if (error) {
      console.error(error);
      setStatus("ERROR: " + JSON.stringify(error));
      alert("ERROR: " + JSON.stringify(error));
      return;
    }

    setStatus("OK: zapisano ✅ " + JSON.stringify(data));
    alert("OK ✅");
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Bike Service App</h2>

      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
        DB: {import.meta.env.VITE_SUPABASE_URL || "MISSING VITE_SUPABASE_URL"}
      </div>

      <button onClick={testDb} style={{ padding: 12, border: "1px solid #999" }}>
        TEST DB
      </button>

      <div style={{ marginTop: 12 }}>{status}</div>
    </div>
  );
}
