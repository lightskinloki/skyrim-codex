// Reads .rtf and .docx project documents as plain text.
// The Frog systems keep rules and lore in these formats, which grep cannot search,
// so anything that needs a source quote must go through here.
//
//   node scripts/read-source-doc.cjs <file> [more files...]
//
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// ---------- RTF ----------

function rtfToText(file) {
  let raw = fs.readFileSync(file, 'latin1');

  // Drop destinations that hold no prose.
  const skipDests = ['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer', 'object'];
  for (const dest of skipDests) {
    let guard = 0;
    for (;;) {
      const start = raw.indexOf('{\\' + dest);
      if (start < 0 || guard++ > 50) break;
      let depth = 0;
      let i = start;
      for (; i < raw.length; i++) {
        if (raw[i] === '{') depth++;
        else if (raw[i] === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      raw = raw.slice(0, start) + raw.slice(i + 1);
    }
  }

  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];

    if (c === '\\') {
      let m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(raw.slice(i, i + 40));
      if (m) {
        const word = m[1];
        if (word === 'par' || word === 'line' || word === 'sect' || word === 'page') out.push('\n');
        else if (word === 'tab') out.push('\t');
        else if (word === 'emdash') out.push('---');
        else if (word === 'endash') out.push('--');
        else if (word === 'lquote' || word === 'rquote') out.push("'");
        else if (word === 'ldblquote' || word === 'rdblquote') out.push('"');
        else if (word === 'bullet') out.push('- ');
        i += m[0].length - 1;
        continue;
      }
      m = /^\\([\\{}])/.exec(raw.slice(i, i + 2));
      if (m) {
        out.push(m[1]);
        i += 1;
        continue;
      }
      m = /^\\'([0-9a-fA-F]{2})/.exec(raw.slice(i, i + 4));
      if (m) {
        out.push(Buffer.from([parseInt(m[1], 16)]).toString('latin1'));
        i += 3;
        continue;
      }
      const mStar = /^\\\*/.exec(raw.slice(i, i + 2));
      if (mStar) {
        i += 1;
        continue;
      }
      continue;
    }

    if (c === '{' || c === '}') continue;
    out.push(c);
  }

  return out
    .join('')
    .replace(/\r/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- DOCX (minimal zip reader, deflate entries only) ----------

function readZipEntry(file, wantedName) {
  const buf = fs.readFileSync(file);

  // Locate End Of Central Directory.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip archive');

  const entryCount = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  for (let n = 0; n < entryCount; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);

    if (name === wantedName) {
      const lNameLen = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error('unsupported compression method ' + method);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('entry not found: ' + wantedName);
}

function docxToText(file) {
  const xml = readZipEntry(file, 'word/document.xml').toString('utf8');
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- CLI ----------

function extract(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.rtf') return rtfToText(file);
  if (ext === '.docx') return docxToText(file);
  if (ext === '.doc') throw new Error('legacy binary .doc is not supported; convert to .docx');
  return fs.readFileSync(file, 'utf8');
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/read-source-doc.cjs <file> [more files...]');
  process.exit(2);
}

for (const file of files) {
  console.log('='.repeat(72));
  console.log('FILE:', file);
  console.log('='.repeat(72));
  try {
    console.log(extract(file));
  } catch (err) {
    console.log('ERROR: ' + err.message);
  }
  console.log('');
}
