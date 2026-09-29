// Conversation director: the NPC flowchart. One-to-one port of
// GAELEN_CONVERSATION_DIRECTOR.html's map+panel layout and localStorage model,
// rendered as a React component instead of a standalone page.
import { useEffect, useMemo, useState } from "react";
import { Inline } from "./Inline";
import { ConversationDirector, DirectorNode } from "@/types/campaign";

interface DirState {
  visited: Record<string, 1>;
  points: Record<string, boolean>;
  notes: Record<string, string>;
  beats: number[];
  cur: string;
}

function loadState(key: string, startId: string): DirState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const s = JSON.parse(raw);
      return { visited: s.visited ?? {}, points: s.points ?? {}, notes: s.notes ?? {}, beats: s.beats ?? [], cur: s.cur ?? startId };
    }
  } catch { /* private mode / cleared storage — start fresh */ }
  return { visited: {}, points: {}, notes: {}, beats: [], cur: startId };
}

export function DirectorView({ director: d, sceneId }: { director: ConversationDirector; sceneId: string }) {
  const storageKey = `rs-director-${sceneId}`;
  const [state, setState] = useState<DirState>(() => loadState(storageKey, d.startNodeId));

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* not persisted this session */ }
  }, [state, storageKey]);

  const nodesById = useMemo(() => new Map(d.nodes.map((n) => [n.id, n])), [d.nodes]);
  const cur = nodesById.get(state.cur) ?? nodesById.get(d.startNodeId) ?? d.nodes[0];

  function go(id: string) {
    setState((s) => ({ ...s, cur: id, visited: { ...s.visited, [id]: 1 } }));
    document.getElementById(`rs-dir-top-${sceneId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function tick(nodeId: string, i: number) {
    const key = `${nodeId}:${i}`;
    setState((s) => ({ ...s, points: { ...s.points, [key]: !s.points[key] } }));
  }
  function toggleBeat(i: number) {
    setState((s) => ({ ...s, beats: s.beats.includes(i) ? s.beats.filter((x) => x !== i) : [...s.beats, i] }));
  }
  function reset() {
    if (!confirm("Reset coverage for a new run?")) return;
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setState({ visited: {}, points: {}, notes: {}, beats: [], cur: d.startNodeId });
  }

  const visitedCount = Object.keys(state.visited).length;

  return (
    <div className="rs-director">
      <div id={`rs-dir-top-${sceneId}`} className="rs-dir-header">
        <h3>{d.title ?? `${d.npc} — Conversation Director`}</h3>
        <span className="rs-pill">{visitedCount} / {d.nodes.length} nodes visited</span>
        {d.beats.length > 0 && <span className="rs-pill">{d.beatsLabel ?? "Beats"} used: {state.beats.length}</span>}
        <button className="home" onClick={() => go(d.hubNodeId)}>⌂ What did they do?</button>
        <button onClick={reset}>Reset</button>
      </div>

      {d.mustSay.length > 0 && (
        <div className="rs-must">
          <b>MUST-SAY (only {d.mustSay.length}):</b>{" "}
          {d.mustSay.map((m, i) => (
            <span key={i}>
              ({i + 1}) <Inline text={m} />
              {i < d.mustSay.length - 1 ? " · " : ""}
            </span>
          ))}
          {d.mustSayNote && <> <b><Inline text={d.mustSayNote} /></b></>}
        </div>
      )}

      <div className="rs-dir-wrap">
        <nav className="rs-map">
          <div className="rs-flow">
            <b>{nodesById.get(d.startNodeId)?.title ?? "Start"}</b>&rarr;<b>Hub</b>&rarr;<b>open node</b>&rarr;<b>answer + beat</b>&rarr;<b>back</b>
          </div>
          {d.groups.map((g) => {
            const inGroup = d.nodes.filter((n) => n.group === g.id);
            if (inGroup.length === 0) return null;
            return (
              <div key={g.id}>
                <h5>{g.label}</h5>
                <div className={`rs-node-grid${g.exit ? " exit" : ""}`}>
                  {inGroup.map((n) => {
                    const pts = n.points?.length ?? 0;
                    const done = (n.points ?? []).filter((_, i) => state.points[`${n.id}:${i}`]).length;
                    const ct = pts ? `${done}/${pts} covered` : state.visited[n.id] ? "visited" : " ";
                    return (
                      <button
                        key={n.id}
                        className={`rs-node${n.id === d.hubNodeId ? " hub" : ""}${state.visited[n.id] ? " visited" : ""}${cur?.id === n.id ? " current" : ""}`}
                        onClick={() => go(n.id)}
                      >
                        {n.title}
                        <span className="ct">{ct}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {cur && (
          <main className="rs-dpanel">
            <NodePanel
              node={cur}
              nodesById={nodesById}
              beats={d.beats}
              beatsLabel={d.beatsLabel}
              usedBeats={state.beats}
              onBeat={toggleBeat}
              hubId={d.hubNodeId}
              checked={state.points}
              onTick={tick}
              note={state.notes[cur.id] ?? ""}
              onNote={(v) => setState((s) => ({ ...s, notes: { ...s.notes, [cur.id]: v } }))}
              onGo={go}
            />
            {d.always.length > 0 && (
              <div className="rs-const"><b>Always:</b> {d.always.join(" · ")}</div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

function NodePanel({ node: n, nodesById, beats, beatsLabel, usedBeats, onBeat, hubId, checked, onTick, note, onNote, onGo }: {
  node: DirectorNode; nodesById: Map<string, DirectorNode>;
  beats: string[]; beatsLabel?: string; usedBeats: number[]; onBeat: (i: number) => void;
  hubId: string; checked: Record<string, boolean>; onTick: (nodeId: string, i: number) => void;
  note: string; onNote: (v: string) => void; onGo: (id: string) => void;
}) {
  const isHub = n.id === hubId;
  return (
    <>
      <h2>{n.title}</h2>
      {n.intent && <div className="rs-intent"><Inline text={n.intent} /></div>}
      {n.aim && <div className="rs-sec"><h6>Aim</h6><div><Inline text={n.aim} /></div></div>}
      {n.must && n.must.length > 0 && (
        <div className="rs-sec"><h6>Must-say / must-do</h6>
          {n.must.map((m, i) => <div key={i} className="rs-mustbox"><Inline text={m} /></div>)}
        </div>
      )}
      {n.anchors && n.anchors.length > 0 && (
        <div className="rs-sec"><h6>How they sound (voice anchors)</h6>
          {n.anchors.map((a, i) => (
            <div key={i} className={`rs-anchor${a.source === "DRAFT" ? " draft" : ""}`}>
              <span className={`rs-tag ${a.source === "DRAFT" ? "d" : "s"}`}>{a.source}</span>
              <Inline text={a.text} />
              {a.ref && <span className="ref">{a.ref}</span>}
            </div>
          ))}
        </div>
      )}
      {n.info && n.info.length > 0 && (
        <div className="rs-sec"><h6>What's true / what they know</h6>
          <ul>{n.info.map((x, i) => <li key={i}><Inline text={x} /></li>)}</ul>
        </div>
      )}
      {n.perf && n.perf.length > 0 && (
        <div className="rs-sec"><h6>Performance</h6>
          <ul>{n.perf.map((x, i) => <li key={i}><Inline text={x} /></li>)}</ul>
        </div>
      )}
      {n.replies && n.replies.length > 0 && (
        <div className="rs-sec"><h6>If they say... &rarr; what they have</h6>
          {n.replies.map((r, i) => (
            <div key={i} className="rs-reply"><b>"{r.say}"</b><br /><Inline text={r.ans} /></div>
          ))}
        </div>
      )}
      {n.room && <div className="rs-sec"><h6>Room reacts</h6><div><Inline text={n.room} /></div></div>}
      {!isHub && beats.length > 0 && (
        <div className="rs-sec"><h6>{beatsLabel ?? "Beat"} (pick one per exchange)</h6>
          {beats.map((b, i) => (
            <button key={i} className={`rs-beat${usedBeats.includes(i) ? " used" : ""}`} onClick={() => onBeat(i)}>{b}</button>
          ))}
        </div>
      )}
      {n.points && n.points.length > 0 && (
        <div className="rs-sec"><h6>Covered this run</h6>
          {n.points.map((p, i) => (
            <label key={i} className={`rs-checkrow${checked[`${n.id}:${i}`] ? " done" : ""}`}>
              <input type="checkbox" checked={!!checked[`${n.id}:${i}`]} onChange={() => onTick(n.id, i)} />
              <span>{p}</span>
            </label>
          ))}
        </div>
      )}
      {!isHub && (
        <div className="rs-sec"><h6>Notes: what they actually said</h6>
          <textarea className="rs-textarea" value={note} onChange={(e) => onNote(e.target.value)} />
        </div>
      )}
      <div className="rs-sec"><h6>Next</h6>
        <div className="rs-next">
          {!isHub && <button className="home" onClick={() => onGo(hubId)}>⌂ What did they do?</button>}
          {n.next.map((id) => {
            const target = nodesById.get(id);
            return target ? <button key={id} onClick={() => onGo(id)}>{target.title}</button> : null;
          })}
        </div>
      </div>
    </>
  );
}
