import { useEffect, useState } from "react";
import { listAdmins, promoteByEmail, revokeAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";

export function RolesAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try { const data = await listAdmins(); setRows(data as any[]); } catch (e: any) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function promote(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try { await promoteByEmail({ data: { email } }); toast.success("Promu admin"); setEmail(""); load(); }
    catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function revoke(userId: string) {
    if (!confirm("Révoquer ?")) return;
    try { await revokeAdmin({ data: { userId } }); toast.success("Révoqué"); load(); } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={promote} className="glass p-4 flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Promouvoir par e-mail</label>
          <input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button disabled={busy} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Promouvoir</button>
      </form>
      <div className="glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr><th className="p-2 text-start">E-mail</th><th className="p-2 text-start">Depuis</th><th className="p-2"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t border-white/5">
                <td className="p-2">{r.profiles?.email ?? r.user_id}</td>
                <td className="p-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-2 text-end">
                  <button onClick={() => revoke(r.user_id)} className="text-xs text-rose hover:underline">Révoquer</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Aucun admin</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
