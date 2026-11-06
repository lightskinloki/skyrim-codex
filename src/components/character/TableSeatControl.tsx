// Joining the GM's table from the character sheet. A QR scan arrives with the
// code already filled in (`autoJoinCode`) and joins with no taps. Otherwise
// the player types the code once. The connection lasts for this page; a
// reload means entering the code again (docs/TABLE-SYNC-DECISIONS.md).
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users } from "lucide-react";
import { Character } from "@/types/character";
import { SeatStatus, TableSeat, normalizeCode } from "@/net/table";

const STATUS_LABEL: Record<SeatStatus, string> = {
  connecting: "Connecting…",
  connected: "At the table",
  "gm-away": "Waiting for GM",
};

export function TableSeatControl({ character, autoJoinCode }: { character: Character; autoJoinCode?: string | null }) {
  const [code, setCode] = useState<string | null>(autoJoinCode ? normalizeCode(autoJoinCode) : null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<SeatStatus>("connecting");
  const [open, setOpen] = useState(false);
  // The seat follows the character's identity, not every sheet edit.
  const characterRef = useRef(character);
  characterRef.current = character;
  const seatRef = useRef<TableSeat | null>(null);

  useEffect(() => {
    if (!code) return;
    const seat = new TableSeat(code, characterRef.current, setStatus);
    seatRef.current = seat;
    return () => {
      seatRef.current = null;
      seat.close();
    };
  }, [code, character.id]);

  // Sheet edits (HP, FP, equipment, stats) keep the GM's copy current, so the
  // GM's fight list always adds the character as it is now.
  useEffect(() => {
    seatRef.current?.setCharacter(character);
  }, [character]);

  if (code) {
    return (
      <Badge
        variant="outline"
        className={status === "connected" ? "text-green-400 border-green-400/50 flex-shrink-0" : "text-amber-400 border-amber-400/50 flex-shrink-0"}
        title={`Table ${code}`}
      >
        <Users className="w-3 h-3 mr-1" /> {STATUS_LABEL[status]}
      </Badge>
    );
  }

  const valid = normalizeCode(draft).length >= 4;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="flex-shrink-0">
          <Users className="w-3.5 h-3.5 mr-1.5" /> Join Table
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(normalizeCode(e.target.value).slice(0, 8))}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) { setCode(normalizeCode(draft)); setOpen(false); } }}
          placeholder="Room code"
          className="text-center font-mono tracking-[0.2em]"
          autoFocus
        />
        <Button className="w-full" size="sm" disabled={!valid} onClick={() => { setCode(normalizeCode(draft)); setOpen(false); }}>
          Join
        </Button>
      </PopoverContent>
    </Popover>
  );
}
