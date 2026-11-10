"""Cut the board's sprite props out of the Pixel Art Atlas into src/battlemap/atlas/props.json.

The atlas (Angais/pixel-art-atlas-1.4m, CC0; AI-generated with Krea, whose community
licence still governs commercial use) is too big to vendor, so this keeps only the
sprites a room can place. Each one is copied pixel for pixel; colour mapping into the
board's ramps happens at load, in src/battlemap/gl/spriteProps.ts.

usage: python -I scripts/atlas-props.py ATLAS_DIR
       ATLAS_DIR holds tokens.npy, palette.npy and objects.json from the dataset's ZIP.
"""
import json
import sys

import numpy as np

# id: (atlas subject, which sprite of that subject, build kind, height in cells, extra)
PICKS = {
    'pine': ('pine tree', 9, 'cross', 1.7, {}),
    'oak': ('oak tree', 10, 'cross', 1.9, {}),
    'bush': ('leafy bush', 6, 'cross', 0.6, {}),
    'grass': ('tall grass clump', 5, 'cross', 0.4, {}),
    'crystals': ('crystal cluster', 3, 'cross', 0.75, {}),
    'stump': ('tree stump', 0, 'lathe', 0.45, {}),
    'boulder': ('boulder', 1, 'lathe', 0.6, {}),
    'rocks': ('rock pile', 3, 'lathe', 0.45, {}),
    'urn': ('urn', 7, 'lathe', 0.55, {}),
    'well': ('stone well', 4, 'lathe', 0.95, {}),
    'moss': ('moss patch', 9, 'lathe', 0.3, {}),
    'runestone': ('runestone', 1, 'lathe', 0.7, {}),
    'anvil': ('anvil', 5, 'extrude', 0.5, {'thick': 0.32}),
    'obelisk': ('rune obelisk', 2, 'extrude', 1.1, {'thick': 0.3}),
    'banner': ('banner', 15, 'extrude', 1.5, {'thick': 0.05}),
    'haycart': ('hay cart', 3, 'extrude', 0.9, {'thick': 0.85}),
    'log': ('wooden log', 12, 'extrude', 0.45, {'thick': 0.7}),
    'grate': ('floor grate', 2, 'decal', 0.9, {}),
}

CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


def main():
    atlas = sys.argv[1]
    tokens = np.load(f'{atlas}/tokens.npy', mmap_mode='r', allow_pickle=False)
    palette = np.load(f'{atlas}/palette.npy', allow_pickle=False)
    with open(f'{atlas}/objects.json', encoding='utf-8') as f:
        subjects = json.load(f)
    rows_of = {}
    for i, s in enumerate(subjects):
        rows_of.setdefault(s, []).append(i)

    out = {}
    for pid, (subject, pick, kind, size, extra) in PICKS.items():
        row = rows_of[subject][pick]
        px = np.asarray(tokens[row]).reshape(16, 16)
        used = [int(v) for v in sorted(set(px.flatten().tolist())) if v != 0]
        if len(used) > len(CHARS):
            raise SystemExit(f'{pid}: {len(used)} colours, more than the encoding holds')
        local = {v: CHARS[k] for k, v in enumerate(used)}
        grid = [''.join('.' if v == 0 else local[int(v)] for v in r) for r in px]
        out[pid] = {
            'source': {'subject': subject, 'row': row},
            'kind': kind,
            'size': size,
            **extra,
            'palette': ['#%02x%02x%02x' % tuple(int(c) for c in palette[v]) for v in used],
            'rows': grid,
        }
    path = 'src/battlemap/atlas/props.json'
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(f'wrote {len(out)} props to {path}')


main()
