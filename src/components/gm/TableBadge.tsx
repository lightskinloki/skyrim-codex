// The GM's table: the room code, a QR and a link to join, and who is
// connected. The room itself is owned by TableProvider, so it survives this
// badge remounting and lasts for the whole GM session. Each player shows
// whether their messages go direct or are relayed by the worker.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users } from "lucide-react";
import { joinLink } from "@/net/table";
import { useTable } from "./TableContext";

export function TableBadge() {
  const { code, members } = useTable();
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    if (!code) return;
    QRCode.toDataURL(joinLink(code), { margin: 1, width: 220 }).then(setQr).catch(() => setQr(""));
  }, [code]);

  if (!code) return null;
  const connected = members.filter((m) => m.connected).length;
  const link = joinLink(code);

  return (
    <Popover>
      {/* A real button: Badge doesn't forward a ref, which the popover needs to position itself. */}
      <PopoverTrigger asChild>
        <button type="button" className="rounded-full">
          <Badge variant="outline" className="cursor-pointer gap-1">
            <Users className="h-3.5 w-3.5" />
            Table {code} · {connected}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Room code</div>
          <div className="font-mono text-2xl font-bold tracking-[0.25em]">{code}</div>
        </div>
        {qr && <img src={qr} alt="Scan to join the table" className="mx-auto rounded bg-white p-1" width={180} height={180} />}
        <a href={link} className="block break-all text-center text-xs text-primary underline">{link}</a>
        <div className="border-t pt-2">
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nobody has joined yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {members.map((m) => (
                <li key={m.peerId} className="flex items-center justify-between">
                  <span>{m.character.name} <span className="text-xs text-muted-foreground">{m.character.race.name}</span></span>
                  <span className={m.connected ? "text-xs text-green-500" : "text-xs text-muted-foreground"}>
                    {m.connected ? m.via : "away"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
