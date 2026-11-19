// Joining the GM's table from the character sheet. A QR scan arrives with the
// code already filled in (`autoJoinCode`) and joins with no taps. Otherwise
// the player types the code once. The connection lasts for this page; a
// reload means entering the code again (docs/TABLE-SYNC-DECISIONS.md).
//
// The seat is also the player's half of the sheet sync: it pushes every local
// edit to the GM and adopts a GM correction back onto the sheet. The seat is
// handed to the dashboard (`onSeat`) so Combat Mode can send a brace without
// owning a second connection.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users } from "lucide-react";
import { Character } from "@/types/character";
import { FightMessage, SeatStatus, TableSeat, VisibleEnemy, normalizeCode } from "@/net/table";

const STATUS_LABEL: Record<SeatStatus, string> = {
  connecting: "Connecting…",
  connected: "At the table",
  "gm-away": "Waiting for GM",
};

interface TableSeatControlProps {
  character: Character;
  autoJoinCode?: string | null;
  /** A GM correction to this sheet; write it back to local storage. */
  onRemoteCharacter?: (character: Character) => void;
  /** The GM started or ended a fight. */
  onFight?: (message: FightMessage) => void;
  /** The enemies the GM has revealed to the table. */
  onRoster?: (enemies: VisibleEnemy[]) => void;
  /** The live seat, for actions that travel to the GM (a brace). */
  onSeat?: (seat: TableSeat | null) => void;
}

export function TableSeatControl({ character, autoJoinCode, onRemoteCharacter, onFight, onRoster, onSeat }: TableSeatControlProps) {
  const [code, setCode] = useState<string | null>(autoJoinCode ? normalizeCode(autoJoinCode) : null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<SeatStatus>("connecting");
  const [open, setOpen] = useState(false);
  const seatRef = useRef<TableSeat | null>(null);
  // Callbacks are re-created on every dashboard render; the seat must see the
  // current ones without being torn down and re-joined.
  const handlers = useRef({ onRemoteCharacter, onFight, onRoster, onSeat });
  handlers.current = { onRemoteCharacter, onFight, onRoster, onSeat };

  useEffect(() => {
    if (!code) return;
    const seat = new TableSeat(
      code,
      character,
      setStatus,
      (next) => handlers.current.onRemoteCharacter?.(next),
      (message) => handlers.current.onFight?.(message),
      (enemies) => handlers.current.onRoster?.(enemies),
    );
    seatRef.current = seat;
    handlers.current.onSeat?.(seat);
    return () => {
      seatRef.current = null;
      handlers.current.onSeat?.(null);
      seat.close();
    };
    // The seat follows the character's identity, not every sheet edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
