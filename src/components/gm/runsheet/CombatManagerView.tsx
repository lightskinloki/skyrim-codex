// Combat manager: objective trackers (five anchors, three-down disrupts),
// round/tier roller, combatant priority cards, and condition-trigger cards
// (Saijah hits 0 HP, Jasper's second 0 HP). One-to-one port of the Fire B
// runsheet's #jasper-combat-manager section.
import { useMemo } from "react";
import { Swords } from "lucide-react";
import { Inline } from "./Inline";
import { SceneBlocks, RenderCtx } from "./SceneBlockRenderer";
import { CombatManager, ObjectiveTracker } from "@/types/campaign";
import { rollD20, tierFor } from "@/utils/sceneBlocks";
import { useCampaign } from "../CampaignContext";
import { useEncounter } from "@/hooks/useEncounter";

interface TrackerState { hp: Record<string, number>; down: Record<string, boolean>; }

function initTracker(t: ObjectiveTracker): TrackerState {
  const hp: Record<string, number> = {}; const down: Record<string, boolean> = {};
  t.targets.forEach((x) => { hp[x.id] = x.maxHp; down[x.id] = false; });
  return { hp, down };
}

export function CombatManagerView({ combat: c, blockId, ctx }: { combat: CombatManager; blockId: string; ctx: RenderCtx }) {
  const { campaign } = useCampaign();

  // The encounter is the fight, not this component. It is restored from storage
  // on mount, so a refresh (or a tab switch) no longer resets every bar.
  const seedTrackers = useMemo(() =>
    Object.fromEntries(c.trackers.map((t) => [t.id, initTracker(t)])),
    // Trackers are authored data for this block; they do not change mid-fight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blockId]);
  const seedFields = useMemo(() =>
    Object.fromEntries(c.statusFields.map((f) => [f.id, f.initial])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blockId]);

  const { state: encounter, dispatch, reset } = useEncounter({
    blockId, moduleId: campaign.id, trackers: seedTrackers, fields: seedFields,
  });

  // Merge in any tracker or field the module has gained since this fight began.
  const trackers = useMemo(() => {
    const merged: Record<string, TrackerState> = { ...encounter.trackers };
    for (const t of c.trackers) if (!merged[t.id]) merged[t.id] = initTracker(t);
    return merged;
  }, [encounter.trackers, c.trackers]);
  const fields = useMemo(() => {
    const merged: Record<string, string> = {};
    for (const f of c.statusFields) merged[f.id] = f.initial;
    return { ...merged, ...encounter.fields };
  }, [encounter.fields, c.statusFields]);
  const round = encounter.round;
  const firedTriggers = useMemo(() => new Set(encounter.firedTriggers), [encounter.firedTriggers]);
  const tierRoll = encounter.tierRoll;
  const log = encounter.log;

  const tierTable = c.tierTableId ? campaign.modules.flatMap((m) => m.tierTables ?? []).find((t) => t.id === c.tierTableId) : undefined;

  function downCount(t: ObjectiveTracker) {
    const s = trackers[t.id]; if (!s) return 0;
    return t.targets.filter((x) => s.down[x.id]).length;
  }
  function thresholdHit(t: ObjectiveTracker) {
    return !!t.threshold && downCount(t) >= t.threshold;
  }
  function damage(t: ObjectiveTracker, targetId: string, amt: number) {
    dispatch({ type: "tracker.damage", trackerId: t.id, targetId, amount: amt });
  }
  function setDown(t: ObjectiveTracker, targetId: string, val: boolean) {
    dispatch({
      type: "tracker.setDown", trackerId: t.id, targetId, down: val,
      maxHp: t.targets.find((x) => x.id === targetId)?.maxHp ?? 0,
    });
  }

  function rollTier() {
    if (!tierTable) return;
    const roll = rollD20();
    const tier = tierFor(tierTable, roll);
    dispatch({ type: "tier.roll", roll, label: tier?.label ?? "?", effect: tier?.effect });
  }
  function advanceRound() {
    dispatch({ type: "round.advance" });
    if (tierTable) rollTier();
  }

  function deploy() {
    if (c.enemies.length === 0) return;
    ctx.deployEnemies?.(c.enemies);
  }

  return (
    <section className="rs-shell combat" id={`rs-combat-${blockId}`}>
      <div className="rs-shell-title">{c.title}</div>

      {c.handout && (
        <details className="rs-card" style={{ marginBottom: "0.75rem" }}>
          <summary style={{ color: "var(--gold-bright)" }}>{c.handout.title}</summary>
          <div className="rs-card-body">
            {c.handout.note && <p><Inline text={c.handout.note} /></p>}
            <ul>{c.handout.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ul>
          </div>
        </details>
      )}

      {c.objective && (
        <div className="rs-gm-alert"><span className="rs-gm-tag">OBJECTIVE:</span> <Inline text={c.objective} /></div>
      )}

      <div className="rs-status">
        <div><label>Round</label><input className="rs-input" value={round} readOnly /></div>
        {c.statusFields.map((f) => (
          <div key={f.id}>
            <label>{f.label}</label>
            <input className="rs-input" value={fields[f.id] ?? ""} onChange={(e) => dispatch({ type: "field.set", fieldId: f.id, value: e.target.value })} />
          </div>
        ))}
      </div>

      {c.enemies.length > 0 && (
        <button className="rs-deploy" onClick={deploy}><Swords className="h-4 w-4" style={{ display: "inline", marginRight: 4 }} /> Deploy Encounter</button>
      )}

      <div className="rs-grid2">
        {c.trackers.map((t) => {
          const s = trackers[t.id]; if (!s) return null;
          const down = downCount(t);
          const hit = thresholdHit(t);
          return (
            <div key={t.id} className="rs-box">
              <h3>{t.title}</h3>
              {t.description && <p><Inline text={t.description} /></p>}
              {t.targets.map((x) => {
                const hp = s.hp[x.id] ?? 0; const isDown = s.down[x.id];
                const pct = Math.max(0, Math.min(100, (hp / x.maxHp) * 100));
                return (
                  <div key={x.id} className={`rs-target${isDown ? " down" : ""}`}>
                    <label>{x.label} — <input value={hp} onChange={(e) => {
                      dispatch({ type: "tracker.setHp", trackerId: t.id, targetId: x.id, hp: Number(e.target.value) || 0 });
                    }} /></label>
                    {t.quickDamage.map((amt) => (
                      <button key={amt} className="rs-tool-btn" onClick={() => damage(t, x.id, amt)}>−{amt}</button>
                    ))}
                    <button className="rs-tool-btn danger" onClick={() => setDown(t, x.id, !isDown)}>{isDown ? "Restore" : "Down"}</button>
                    <div className="rs-hpbar"><div style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
              <p className={`rs-small${hit ? " rs-threshold-hit" : ""}`}>
                <strong>{down} / {t.targets.length} down.</strong>{" "}
                {t.threshold ? (hit ? (t.thresholdText || "Threshold reached.") : `${t.threshold} down triggers it.`) : ""}
              </p>
              {hit && t.triggerBlocks.length > 0 && (
                <div className="rs-panel"><SceneBlocks blocks={t.triggerBlocks} ctx={ctx} /></div>
              )}
            </div>
          );
        })}

        {tierTable && (
          <div className="rs-box">
            <h3>{tierTable.name}</h3>
            {c.tierNote && <p><Inline text={c.tierNote} /></p>}
            <button className="rs-dir-btn" onClick={rollTier}>Roll current turn's {tierTable.name}</button>
            <div className="rs-anchor-line">
              {tierRoll ? <>Roll {tierRoll.roll}: <strong>{tierRoll.label}</strong>{tierRoll.effect ? ` — ${tierRoll.effect}` : ""}</> : "Not rolled yet."}
            </div>
          </div>
        )}
      </div>

      <div className="rs-grid2">
        {c.cards.map((card) => (
          <div key={card.id} className="rs-box">
            <h3>{card.title}{card.controller === "player" && <span className="player">PLAYER-RUN</span>}</h3>
            {card.ordered ? (
              <ol>{card.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ol>
            ) : (
              <ul>{card.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ul>
            )}
            {card.statLine && <p><Inline text={card.statLine} /></p>}
            {card.quote && <div className="rs-anchor-line">"{card.quote}"</div>}
            {card.fields?.map((f) => (
              <div key={f.id} className="rs-target"><label>{f.label} <input defaultValue={f.initial} /></label></div>
            ))}
          </div>
        ))}
        <div className="rs-box">
          <h3>Round log</h3>
          <textarea className="rs-textarea" value={log} onChange={(e) => dispatch({ type: "log.set", text: e.target.value })} placeholder="Round 1: who moved, who is threatened, what changed..." />
          <button className="rs-dir-btn" onClick={advanceRound} style={{ marginTop: "0.5rem" }}>Advance round</button>
          <button
            className="rs-tool-btn danger"
            style={{ marginTop: "0.5rem", marginLeft: "0.5rem" }}
            onClick={() => reset()}
            title="Start this encounter over: full bars, round 1, empty log."
          >Reset encounter</button>
        </div>
      </div>

      {c.triggers.map((t) => {
        const fired = firedTriggers.has(t.id);
        return (
          <div key={t.id} className="rs-gm-alert amber">
            <span className="rs-gm-tag">{t.condition}</span>
            <label style={{ float: "right", fontSize: "0.8rem" }}>
              <input type="checkbox" checked={fired} onChange={() => dispatch({ type: "trigger.toggle", triggerId: t.id })} /> hit
            </label>
            {fired && <div className="rs-panel"><SceneBlocks blocks={t.blocks} ctx={ctx} /></div>}
          </div>
        );
      })}
    </section>
  );
}
