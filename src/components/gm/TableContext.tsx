// The GM's table lives as long as GM mode does: one room code per visit, and
// every pillar can see who has joined. It is created here rather than inside
// the header badge so that a badge remount can never rotate the code out from
// under the players who are already at the table
// (docs/TABLE-SYNC-DECISIONS.md: the code ends when GM mode does).
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { TableHost, TableMember } from "@/net/table";

interface TableContextValue {
  /** The room code, or null until the host socket exists. */
  code: string | null;
  members: TableMember[];
}

const TableContext = createContext<TableContextValue>({ code: null, members: [] });

export function TableProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<TableHost | null>(null);
  const [members, setMembers] = useState<TableMember[]>([]);

  useEffect(() => {
    const h = new TableHost(setMembers);
    setHost(h);
    // Leaving GM mode ends this code; a page reload never runs this cleanup, so
    // reloading the same page resumes the room.
    return () => h.endTable();
  }, []);

  return (
    <TableContext.Provider value={{ code: host?.code ?? null, members }}>
      {children}
    </TableContext.Provider>
  );
}

/** The table for this GM session. Outside GM mode there is none. */
export function useTable(): TableContextValue {
  return useContext(TableContext);
}
