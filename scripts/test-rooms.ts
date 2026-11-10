import assert from 'assert';
import tavernJson from '@/battlemap/rooms/tavern.json';
import cavernJson from '@/battlemap/rooms/cavern.json';
import ivarsteadJson from '@/battlemap/rooms/ivarstead.json';
import innJson from '@/battlemap/rooms/vilemyr-inn.json';
import traderJson from '@/battlemap/rooms/trader-hall.json';
import kvCausewayJson from '@/battlemap/rooms/korvanjund-causeway.json';
import kvShaftJson from '@/battlemap/rooms/korvanjund-shaft.json';
import kvArmoryJson from '@/battlemap/rooms/korvanjund-armory.json';
import kvEmbalmingJson from '@/battlemap/rooms/korvanjund-embalming.json';
import kvDescentJson from '@/battlemap/rooms/korvanjund-descent.json';
import kvLandingJson from '@/battlemap/rooms/korvanjund-landing.json';
import kvCryptJson from '@/battlemap/rooms/korvanjund-crypt.json';
import kvThroneJson from '@/battlemap/rooms/korvanjund-throne.json';
import { KORVANJUND } from '@/battlemap/korvanjund';
import { makeDemoRoom } from '@/battlemap/room';
import { makeCaveRoom } from '@/battlemap/cave';
import { makeIvarstead, makeInn, makeTrader } from '@/battlemap/village';
import {
  ROOM_FORMAT,
  ROOM_VERSION,
  docToJson,
  parseRoomDoc,
  roomFromDoc,
  toDoc,
  type RoomDoc,
} from '@/battlemap/document';

/**
 * The room document is the contract between the board, the saves and (later) the
 * SVC importer, so it gets the same treatment as the combat rules: the shipped
 * rooms must survive a round trip unchanged, the builders must still agree with
 * them, and hostile input must come out repaired or rejected — never drawn.
 */

let checks = 0;
let failures = 0;

const check = (name: string, fn: () => void) => {
  checks++;
  try {
    fn();
  } catch (e) {
    failures++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${(e as Error).message.split('\n')[0]}`);
  }
};

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const shipped: { file: string; json: unknown; build: () => ReturnType<typeof makeDemoRoom> }[] = [
  { file: 'tavern.json', json: tavernJson, build: makeDemoRoom },
  { file: 'cavern.json', json: cavernJson, build: makeCaveRoom },
  { file: 'ivarstead.json', json: ivarsteadJson, build: makeIvarstead },
  { file: 'vilemyr-inn.json', json: innJson, build: makeInn },
  { file: 'trader-hall.json', json: traderJson, build: makeTrader },
  { file: 'korvanjund-causeway.json', json: kvCausewayJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-causeway')!.build },
  { file: 'korvanjund-shaft.json', json: kvShaftJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-shaft')!.build },
  { file: 'korvanjund-armory.json', json: kvArmoryJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-armory')!.build },
  { file: 'korvanjund-embalming.json', json: kvEmbalmingJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-embalming')!.build },
  { file: 'korvanjund-descent.json', json: kvDescentJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-descent')!.build },
  { file: 'korvanjund-landing.json', json: kvLandingJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-landing')!.build },
  { file: 'korvanjund-crypt.json', json: kvCryptJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-crypt')!.build },
  { file: 'korvanjund-throne.json', json: kvThroneJson, build: KORVANJUND.find((k) => k.id === 'korvanjund-throne')!.build },
];

console.log('room documents');

for (const { file, json, build } of shipped) {
  const parsed = parseRoomDoc(json);
  if (parsed.status === 'bad') {
    failures++;
    console.error(`  FAIL  ${file} does not parse: ${parsed.errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
    continue;
  }
  const { doc, room } = parsed;

  check(`${file} parses without warnings`, () => assert.deepStrictEqual(parsed.warnings, []));

  check(`${file} decodes to the authored size`, () => {
    assert.ok(room.grid.cols > 0 && room.grid.rows > 0);
    assert.strictEqual(room.grid.cells.length, room.grid.cols * room.grid.rows);
  });

  check(`${file} round-trips byte for byte`, () => {
    assert.strictEqual(docToJson(doc), docToJson(json as RoomDoc));
  });

  check(`${file} agrees with its builder`, () => {
    const fresh = toDoc(build(), { id: doc.id, name: doc.name });
    assert.deepStrictEqual(fresh, doc);
  });

  check(`${file} has addressable, unique prop ids`, () => {
    const ids = doc.props.map((p) => p.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => typeof id === 'string' && id.length > 0));
  });

  check(`${file} keeps every authored prop`, () => {
    assert.strictEqual(doc.props.length, build().props.length);
  });

  check(`${file} rebuilds the same document from the rebuilt room`, () => {
    assert.strictEqual(docToJson(toDoc(roomFromDoc(doc), { id: doc.id, name: doc.name })), docToJson(doc));
  });
}

check('terrain is a run-length document, not a byte array', () => {
  const doc = (parseRoomDoc(tavernJson) as { status: 'ok'; doc: RoomDoc }).doc;
  assert.ok(doc.terrain.every((row) => typeof row === 'string'));
  assert.ok(doc.terrain.some((row) => row.includes('*')));
});

check('a saved camera survives the round trip', () => {
  const base = (parseRoomDoc(tavernJson) as { status: 'ok'; doc: RoomDoc }).doc;
  const withView = toDoc(roomFromDoc(base), { id: base.id, name: base.name }, {
    view: { yaw: 32.1234, pitch: 55, zoom: 1.25 },
  });
  const again = parseRoomDoc(clone(withView));
  assert.strictEqual(again.status, 'ok');
  assert.deepStrictEqual(again.doc.view, { yaw: 32.123, pitch: 55, zoom: 1.25 });
});

check('serialisation is deterministic', () => {
  const { room } = parseRoomDoc(cavernJson) as { status: 'ok'; room: ReturnType<typeof makeCaveRoom> };
  const a = docToJson(toDoc(room, { id: 'x', name: 'x' }));
  const b = docToJson(toDoc(room, { id: 'x', name: 'x' }));
  assert.strictEqual(a, b);
});

/* ------------------------------------------------------------ hostile input */
const base = (parseRoomDoc(tavernJson) as { status: 'ok'; doc: RoomDoc }).doc;
const bad = (patch: (d: RoomDoc) => void) => {
  const d = clone(base);
  patch(d);
  return parseRoomDoc(d);
};

check('rejects a non-document', () => {
  assert.strictEqual(parseRoomDoc(null).status, 'bad');
  assert.strictEqual(parseRoomDoc('hello').status, 'bad');
});

check('rejects a foreign format', () => {
  const res = bad((d) => ((d as unknown as Record<string, unknown>).format = 'some.other.room'));
  assert.strictEqual(res.status, 'bad');
  if (res.status === 'bad') assert.match(res.errors[0].message, /not "skyrim-codex\.room"/);
});

check('rejects a document from a newer build', () => {
  const res = bad((d) => (d.version = ROOM_VERSION + 1));
  assert.strictEqual(res.status, 'bad');
  if (res.status === 'bad') assert.match(res.errors[0].message, /this build reads up to/);
});

check('rejects a ragged grid', () => {
  const res = bad((d) => (d.terrain[3] = '1*27'));
  assert.strictEqual(res.status, 'bad');
  if (res.status === 'bad') assert.match(res.errors[0].message, /cells wide/);
});

check('rejects an unreadable run', () => {
  assert.strictEqual(bad((d) => (d.terrain[2] = '2,1*x,2')).status, 'bad');
  assert.strictEqual(bad((d) => (d.terrain[2] = '1*0')).status, 'bad');
  assert.strictEqual(bad((d) => (d.terrain[2] = '7*4')).status, 'bad');
});

check('rejects an oversized board', () => {
  const res = bad((d) => (d.terrain = Array.from({ length: 200 }, () => '2*28')));
  assert.strictEqual(res.status, 'bad');
  if (res.status === 'bad') assert.match(res.errors[0].message, /limit is 160/);
});

check('drops an unknown prop rule and says so', () => {
  const res = bad((d) => {
    (d.props as unknown as Record<string, unknown>[]).push({ id: 'weird', rule: 'throne', at: [4, 4] });
  });
  assert.strictEqual(res.status, 'ok');
  if (res.status === 'bad') return;
  assert.strictEqual(res.doc.props.length, base.props.length);
  assert.ok(res.warnings.some((w) => /unknown rule "throne"/.test(w.message)));
});

check('de-duplicates prop ids', () => {
  const res = bad((d) => {
    d.props[1].id = d.props[0].id;
  });
  assert.strictEqual(res.status, 'ok');
  if (res.status === 'bad') return;
  const ids = res.doc.props.map((p) => p.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

check('repairs a token with an unknown race instead of crashing the renderer', () => {
  const res = bad((d) => {
    (d.tokens[0].spec as unknown as Record<string, unknown>).race = 'dragon';
  });
  assert.strictEqual(res.status, 'ok');
  if (res.status === 'bad') return;
  assert.ok(res.warnings.some((w) => /unknown race/.test(w.message)));
  assert.notStrictEqual(res.doc.tokens[0].spec.race, 'dragon');
  // The point of the repair: this is the exact lookup that would have thrown.
  assert.doesNotThrow(() => JSON.stringify(res.room));
});

check('clamps a token that starts outside the room', () => {
  const res = bad((d) => {
    d.tokens[0].at = [-9, 999];
  });
  assert.strictEqual(res.status, 'ok');
  if (res.status === 'bad') return;
  const [x, z] = res.doc.tokens[0].at;
  assert.ok(x >= 0 && x <= res.room.grid.cols);
  assert.ok(z >= 0 && z <= res.room.grid.rows);
});

check('clips a storey that pokes outside the grid', () => {
  const res = bad((d) => {
    d.tiers = [{ y: 2, deck: 'stone', rects: [[-4, -4, 10, 10]] }];
  });
  assert.strictEqual(res.status, 'ok');
  if (res.status === 'bad') return;
  const r = res.doc.tiers?.[0].rects[0];
  assert.deepStrictEqual(r, [0, 0, 6, 6]);
});

check('survives a rig full of nonsense', () => {
  const res = bad((d) => {
    (d as unknown as Record<string, unknown>).rig = {
      sun: { azimuth: 'noon', elevation: 999, intensity: -4 },
      ambient: NaN,
      points: [{ x: 1, y: 2, radius: -1 }, { x: 0, y: 0, radius: 64, intensity: 99 }],
    };
  });
  // NaN does not survive JSON, so this arrives as null rather than a number.
  assert.strictEqual(res.status, 'ok');
  if (res.status === 'bad') return;
  assert.ok(res.doc.rig.sun.azimuth >= 0 && res.doc.rig.sun.azimuth <= 360);
  assert.ok(res.doc.rig.sun.elevation >= -90 && res.doc.rig.sun.elevation <= 90);
  assert.ok(res.doc.rig.ambient >= 0);
  assert.strictEqual(res.doc.rig.points.length, 1);
  assert.ok(res.doc.rig.points[0].intensity <= 8);
});

check('roomFromDoc refuses terrain it cannot build', () => {
  const broken = clone(base);
  broken.terrain[5] = '1*4';
  assert.throws(() => roomFromDoc(broken), /terrain row 5/);
});

check('every rule in the union is represented in the shipped rooms', () => {
  const rules = new Set<string>();
  for (const { json } of shipped) {
    const p = parseRoomDoc(json);
    if (p.status === 'ok') p.doc.props.forEach((prop) => rules.add(prop.rule));
  }
  // Not all eleven: the tavern and cavern between them exercise the solids the
  // document has to carry, and a rule with no example is a rule nobody tested.
  for (const required of ['rug', 'bench', 'table', 'chest', 'crate', 'barrel', 'shelf', 'brazier', 'column', 'rubble', 'stairs', 'house', 'tree']) {
    assert.ok(rules.has(required), `no shipped prop uses "${required}"`);
  }
});

check('ground survives a round trip on the room that has it', () => {
  const p = parseRoomDoc(ivarsteadJson);
  assert.strictEqual(p.status, 'ok');
  if (p.status === 'bad') return;
  assert.ok(p.doc.ground && p.doc.ground.length === p.doc.terrain.length);
  assert.ok(p.doc.ground.some((row) => /[1-4]/.test(row)));
  const again = parseRoomDoc(clone(p.doc));
  assert.strictEqual(again.status, 'ok');
  if (again.status === 'bad') return;
  assert.strictEqual(docToJson(again.doc), docToJson(p.doc));
});

check('every door link resolves to a door in a shipped room', () => {
  const byId = new Map<string, RoomDoc>();
  for (const { json } of shipped) {
    const p = parseRoomDoc(json);
    if (p.status === 'ok') byId.set(p.doc.id, p.doc);
  }
  let links = 0;
  for (const [id, doc] of byId) {
    for (const d of doc.doors ?? []) {
      if (!d.to) continue;
      links++;
      const target = byId.get(d.to.room);
      assert.ok(target, `${id}/${d.id} leads to missing room "${d.to.room}"`);
      assert.ok(
        (target.doors ?? []).some((other) => other.id === d.to!.door),
        `${id}/${d.id} leads to missing door "${d.to.door}"`,
      );
    }
  }
  assert.ok(links >= 4, 'the village and its two interiors should be linked both ways');
});

check('every door link in Korvanjund is answered by a door that leads back', () => {
  const byId = new Map<string, RoomDoc>();
  for (const { json } of shipped) {
    const p = parseRoomDoc(json);
    if (p.status === 'ok') byId.set(p.doc.id, p.doc);
  }
  for (const k of KORVANJUND) {
    const doc = byId.get(k.id);
    assert.ok(doc, `${k.id} is not shipped`);
    for (const d of doc.doors ?? []) {
      assert.ok(d.to, `${k.id}/${d.id} leads nowhere`);
      const back = byId.get(d.to.room)?.doors?.find((o) => o.id === d.to!.door);
      assert.ok(back?.to?.room === k.id && back.to.door === d.id, `${k.id}/${d.id} is a one-way door`);
    }
  }
});

check('the new rules are carried by the shipped rooms', () => {
  const rules = new Set<string>();
  for (const { json } of shipped) {
    const p = parseRoomDoc(json);
    if (p.status === 'ok') p.doc.props.forEach((prop) => rules.add(prop.rule));
  }
  for (const required of ['gear', 'drill', 'sarcophagus', 'lever', 'chain', 'blade', 'sprite']) {
    assert.ok(rules.has(required), `no shipped prop uses "${required}"`);
  }
});

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} failed`);
  process.exit(1);
}
