// The GM's table lives as long as GM mode does: one room code per visit, and
// every pillar can see who has joined. It is created here rather than inside
// the header badge so that a badge remount can never rotate the code out from
// under the players who are already at the table
// (docs/TABLE-SYNC-DECISIONS.md: the code ends when GM mode does).
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { RollCard, TableHost, TableMember, VisibleEnemy } from "@/net/table";
import { Character } from "@/types/character";

interface TableContextValue {
  /** The room code, or null until the host socket exists. */
  code: string | null;
  members: TableMember[];
  /**
   * Change a player's sheet from the GM screen. The host moves the revision
   * forward and the player's device takes the new sheet; there is no second
   * copy to reconcile (docs/TABLE-SYNC-DECISIONS.md).
   */
  editCharacter: (peerId: string, edit: (character: Character) => Character) => void;
  /** Spend or drop a pending brace after the hit it was held for. */
  clearBrace: (peerId: string) => void;
  /** Tell every joined seat a fight started or ended. */
  announceFight: (state: "start" | "end", detail?: { round?: number; title?: string }) => void;
  /** The enemies players may see; concealed ones are not in this list. */
  publishRoster: (enemies: VisibleEnemy[]) => void;
  /** Roll outcomes players have sent, newest last. */
  rolls: RollCard[];
}

const TableContext = createContext<TableContextValue>({
  code: null,
  members: [],
  editCharacter: () => {},
  clearBrace: () => {},
  announceFight: () => {},
  publishRoster: () => {},
  rolls: [],
});

export function TableProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<TableHost | null>(null);
  const [members, setMembers] = useState<TableMember[]>([]);
  const [rolls, setRolls] = useState<RollCard[]>([]);

  useEffect(() => {
    const h = new TableHost(setMembers, (card) =>
      setRolls((prev) => [...prev.slice(-19), card]),
    );
    setHost(h);
    // Leaving GM mode ends this code; a page reload never runs this cleanup, so
    // reloading the same page resumes the room.
    return () => h.endTable();
  }, []);

  return (
    <TableContext.Provider
      value={{
        code: host?.code ?? null,
        members,
        editCharacter: (peerId, edit) => host?.editCharacter(peerId, edit),
        clearBrace: (peerId) => host?.setBrace(peerId, null),
        announceFight: (state, detail) => host?.announceFight(state, detail),
        publishRoster: (enemies) => host?.publishRoster(enemies),
        rolls,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}

/** The table for this GM session. Outside GM mode there is none. */
export function useTable(): TableContextValue {
  return useContext(TableContext);
}
