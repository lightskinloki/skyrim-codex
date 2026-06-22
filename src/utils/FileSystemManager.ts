// Bridges the app to the campaign folder on disk.
//
// Web/dev phase: the Web File System Access API (showDirectoryPicker), available
// in Chrome / Edge / Opera. The GM mounts the Frogs-5-skyrim folder once per
// session; the app gets read/write access to .md files and web/*.json.
//
// Electron phase (Phase 6): swap the internals of these methods for Node's `fs`
// — the public interface stays identical, so nothing else changes.
//
// See docs/GM-CAMPAIGN-SUITE.md §7.

export interface CorpusFile { relPath: string; text: string; }

export interface GatherOptions {
  scanDirs: string[];
  scanFiles: string[];
  skipExt: Set<string>;
  skipDirs: Set<string>;
}

// The File System Access API isn't fully typed in lib.dom across versions, so we
// treat handles structurally as `any` and keep the typed surface at this class's
// boundary (string paths in, strings out).
type DirHandle = any;

export class FileSystemManager {
  private root: DirHandle | null = null;
  private rootName = '';

  static isSupported(): boolean {
    return typeof (window as any).showDirectoryPicker === 'function';
  }

  get mounted(): boolean { return this.root !== null; }
  get folderName(): string { return this.rootName; }

  async mountDirectory(): Promise<boolean> {
    if (!FileSystemManager.isSupported()) {
      throw new Error(
        'This browser does not support the File System Access API. ' +
        'Use Chrome, Edge, or Opera (or the desktop build).'
      );
    }
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    this.root = handle;
    this.rootName = handle?.name ?? '';
    return true;
  }

  unmount(): void {
    this.root = null;
    this.rootName = '';
  }

  private async resolveDir(parts: string[], create = false): Promise<DirHandle> {
    let dir = this.root;
    for (const p of parts) {
      dir = await dir.getDirectoryHandle(p, { create });
    }
    return dir;
  }

  async readCampaignFile(relativePath: string): Promise<string> {
    if (!this.root) throw new Error('No campaign folder mounted.');
    const parts = relativePath.split('/').filter(Boolean);
    const fileName = parts.pop()!;
    const dir = await this.resolveDir(parts);
    const fileHandle = await dir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async writeCampaignFile(relativePath: string, content: string): Promise<void> {
    if (!this.root) throw new Error('No campaign folder mounted.');
    const parts = relativePath.split('/').filter(Boolean);
    const fileName = parts.pop()!;
    const dir = await this.resolveDir(parts, true);
    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async readJSON<T = unknown>(relativePath: string): Promise<T> {
    return JSON.parse(await this.readCampaignFile(relativePath)) as T;
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try { await this.readCampaignFile(relativePath); return true; }
    catch { return false; }
  }

  /** Immediate child directory names of the mounted root (for root auto-detection). */
  async listChildDirs(): Promise<string[]> {
    if (!this.root) throw new Error('No campaign folder mounted.');
    const out: string[] = [];
    for await (const [name, handle] of this.root.entries()) {
      if (handle.kind === 'directory') out.push(name);
    }
    return out;
  }

  /**
   * Walk the mounted folder collecting text files per the lore-web scan rules.
   * Mirrors `corpus_files()` in _build_web.py: recurse SCAN_DIRS (pruning
   * SKIP_DIRS, skipping SKIP_EXT), then append the explicit SCAN_FILES.
   */
  async gatherFiles(opts: GatherOptions): Promise<CorpusFile[]> {
    if (!this.root) throw new Error('No campaign folder mounted.');
    const out: CorpusFile[] = [];
    for (const d of opts.scanDirs) {
      let dirHandle: DirHandle;
      try {
        dirHandle = await this.resolveDir(d.split('/').filter(Boolean));
      } catch {
        continue; // directory absent — matches the os.path.isdir guard
      }
      await this.walk(dirHandle, d, opts.skipExt, opts.skipDirs, out);
    }
    for (const f of opts.scanFiles) {
      try {
        out.push({ relPath: f, text: await this.readCampaignFile(f) });
      } catch {
        /* file absent — skip */
      }
    }
    return out;
  }

  /** Gather every text file under the whole mounted folder (generic corpus). */
  async gatherAllFiles(skipExt: Set<string>, skipDirs: Set<string>): Promise<CorpusFile[]> {
    if (!this.root) throw new Error('No campaign folder mounted.');
    const out: CorpusFile[] = [];
    await this.walk(this.root, '', skipExt, skipDirs, out);
    return out;
  }

  /** Recursively find every file named `targetName` under the mount. */
  async findFiles(targetName: string, skipDirs: Set<string>): Promise<string[]> {
    if (!this.root) throw new Error('No campaign folder mounted.');
    const out: string[] = [];
    const rec = async (dir: DirHandle, prefix: string): Promise<void> => {
      for await (const [name, handle] of dir.entries()) {
        const rel = prefix ? `${prefix}/${name}` : name;
        if (handle.kind === 'directory') {
          if (skipDirs.has(name)) continue;
          await rec(handle, rel);
        } else if (name === targetName) {
          out.push(rel);
        }
      }
    };
    await rec(this.root, '');
    return out;
  }

  private async walk(
    dirHandle: DirHandle,
    prefix: string,
    skipExt: Set<string>,
    skipDirs: Set<string>,
    out: CorpusFile[],
  ): Promise<void> {
    for await (const [name, handle] of dirHandle.entries()) {
      const rel = prefix ? `${prefix}/${name}` : name;
      if (handle.kind === 'directory') {
        if (skipDirs.has(name)) continue;
        await this.walk(handle, rel, skipExt, skipDirs, out);
      } else {
        const dot = name.lastIndexOf('.');
        const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
        if (skipExt.has(ext)) continue;
        try {
          const file = await handle.getFile();
          out.push({ relPath: rel, text: await file.text() });
        } catch {
          /* unreadable — skip */
        }
      }
    }
  }
}

// App-wide singleton (mirrors the characterStorage singleton pattern).
export const fileSystemManager = new FileSystemManager();
