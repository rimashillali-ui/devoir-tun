import { useEffect, useState } from "react";
import { listMessages, markMessageRead } from "@/lib/admin.functions";
import { toast } from "sonner";
import { MailOpen, Mail } from "lucide-react";

export function MessagesAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  async function load() {
    try { setRows(await listMessages()); } catch (e: any) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function toggle(id: string, read: boolean) {
    try { await markMessageRead({ data: { id, read } }); load(); } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-muted-foreground p-4">Aucun message</p>}
      {rows.map((m) => (
        <div key={m.id} className={`glass p-4 ${m.read ? "opacity-60" : ""}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-sm">
              <strong>{m.name}</strong> · <a className="text-cyan" href={`mailto:${m.email}`}>{m.email}</a>
            </div>
            <button onClick={() => toggle(m.id, !m.read)} className="p-1 hover:bg-white/10 rounded" title={m.read ? "Marquer non lu" : "Marquer lu"}>
              {m.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4 text-cyan" />}
            </button>
          </div>
          {m.subject && <div className="text-sm font-medium mb-1">{m.subject}</div>}
          <p className="text-sm whitespace-pre-wrap">{m.message}</p>
          <div className="text-xs text-muted-foreground mt-2">{new Date(m.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
