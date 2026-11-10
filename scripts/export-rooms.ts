import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { makeDemoRoom } from '@/battlemap/room';
import { makeCaveRoom } from '@/battlemap/cave';
import { makeIvarstead, makeInn, makeTrader } from '@/battlemap/village';
import { KORVANJUND } from '@/battlemap/korvanjund';
import { docToJson, toDoc } from '@/battlemap/document';

/**
 * The rooms the app ships are documents, not functions. The procedural builders
 * in `room.ts` and `cave.ts` are the *authoring* source — run this after editing
 * them and the JSON beside them is regenerated. `test:rooms` fails if the two
 * ever disagree, so a stale export cannot survive a test run.
 */
const out = join(process.cwd(), 'src', 'battlemap', 'rooms');
mkdirSync(out, { recursive: true });

const rooms = [
  { file: 'tavern.json', doc: toDoc(makeDemoRoom(), { id: 'tavern', name: 'The Broken Crown' }) },
  { file: 'cavern.json', doc: toDoc(makeCaveRoom(), { id: 'cavern', name: 'The Sunken Gallery' }) },
  { file: 'ivarstead.json', doc: toDoc(makeIvarstead(), { id: 'ivarstead', name: 'Ivarstead' }) },
  { file: 'vilemyr-inn.json', doc: toDoc(makeInn(), { id: 'vilemyr-inn', name: 'Vilemyr Inn' }) },
  { file: 'trader-hall.json', doc: toDoc(makeTrader(), { id: 'trader-hall', name: 'Ivarstead Traders' }) },
  ...KORVANJUND.map((k) => ({ file: k.file, doc: toDoc(k.build(), { id: k.id, name: k.name }) })),
];

for (const { file, doc } of rooms) {
  const path = join(out, file);
  writeFileSync(path, docToJson(doc));
  const kb = (Buffer.byteLength(docToJson(doc)) / 1024).toFixed(1);
  console.log(
    `${file.padEnd(26)} ${kb} kb · ${doc.terrain.length} rows · ${doc.props.length} props · ` +
      `${doc.tokens.length} tokens · ${doc.tiers?.length ?? 0} storeys · ${doc.doors?.length ?? 0} doors`,
  );
}
