import { useState, useRef, useCallback, useEffect } from 'react';
import { Memory, MEMORIES, Category } from '@/data/memories';
import { getCustomMemories, addCustomMemory, deleteCustomMemory, saveCustomMemories } from '@/lib/store';
import {
  saveVideoBlob, deleteVideoBlob,
  extractVideoThumbnail, getVideoDurationSec, formatFileSize,
} from '@/lib/videoStore';

/* ─── Constants ─────────────────────────────────────── */
const CATEGORIES: Category[] = ['Monthsaries', 'Dates', 'Adventures', 'Messages', 'Funny Moments', 'Special Days'];
const CAT_COLORS: Record<string, string> = {
  Monthsaries: '#b7475a', Dates: '#7b68ee', Adventures: '#e08940',
  Messages: '#4a9b8e', 'Funny Moments': '#d4a84b', 'Special Days': '#c06ba0',
};
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STORAGE_LIMIT_KB = 4096;
const VIDEO_ACCEPT = '.mp4,.mov,.webm,.avi,.mkv,.m4v';
const IMAGE_ACCEPT = 'image/*';

/* ─── Helpers ────────────────────────────────────────── */
function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m} min`;
  return `${s}s`;
}
function fmtDateLabel(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return `${MONTH_FULL[m - 1]} ${d}, ${y}`;
}
function fmtTotalRuntime(mems: Memory[]) {
  const s = mems.reduce((a, m) => a + m.durationSec, 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function getStorageKB() {
  try { return Math.round((localStorage.getItem('angelflix_custom_memories') ?? '').length * 2 / 1024); }
  catch { return 0; }
}
function compressImage(file: File, maxW: number, q: number): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(maxW / img.width, 1), c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej; img.src = url;
  });
}
function downloadJSON(data: unknown, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = name; a.click();
}

/* ─── Types ──────────────────────────────────────────── */
type Tab = 'upload' | 'library' | 'stats';
type LibFilter = 'all' | 'uploaded' | 'builtin';
type SortKey = 'newest' | 'oldest' | 'az';
type UploadMode = 'video' | 'image';
type UploadStage = 'idle' | 'extracting' | 'saving' | 'done' | 'error';

interface UndoEntry { memory: Memory; index: number; timer: ReturnType<typeof setTimeout> }

/* ─── Styles ─────────────────────────────────────────── */
const S = {
  inp: (err?: boolean): React.CSSProperties => ({
    background: '#18181b', border: `1px solid ${err ? '#b7475a' : '#2e2e32'}`, color: '#f4f4f5',
    borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box',
  }),
  lbl: { display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#52525b', marginBottom: '5px' } as React.CSSProperties,
  card: { background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '12px', overflow: 'hidden' } as React.CSSProperties,
  btn: (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: variant === 'primary' ? '#b7475a' : variant === 'danger' ? 'rgba(183,71,90,0.12)' : '#18181b',
    color: variant === 'primary' ? 'white' : variant === 'danger' ? '#e07080' : '#71717a',
    ...(variant === 'ghost' ? { border: '1px solid #27272a' } : {}),
    ...(variant === 'danger' ? { border: '1px solid rgba(183,71,90,0.25)' } : {}),
  }),
};

/* ─── Video Drop Zone ────────────────────────────────── */
function VideoDropZone({ file, previewUrl, dragging, onFile, onClear, fileRef, stage, stageLabel, onDragOver, onDragLeave }: {
  file: File | null; previewUrl: string | null; dragging: boolean;
  onFile: (f: File) => void; onClear: () => void;
  fileRef: any;
  stage: UploadStage; stageLabel: string;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
}) {
  const isEmpty = !file && !previewUrl;
  return (
    <div>
      <div
        onClick={() => { if (isEmpty) fileRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
        onDragLeave={() => onDragLeave?.()}
        onDrop={(e) => { e.preventDefault(); onDragLeave?.(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        style={{
          border: `2px dashed ${dragging ? '#b7475a' : previewUrl ? '#4a9b8e' : '#2a2a2e'}`,
          borderRadius: '12px', overflow: 'hidden', cursor: isEmpty ? 'pointer' : 'default',
          background: dragging ? 'rgba(183,71,90,0.04)' : '#111113',
          transition: 'border-color 0.15s', position: 'relative', aspectRatio: '16/9',
        }}
      >
        {previewUrl ? (
          <>
            <video src={previewUrl} controls muted playsInline preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', backdropFilter: 'blur(4px)' }}>✕</button>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#18181b', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23,7 16,12 23,17" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#52525b', margin: '0 0 3px' }}>Drop video here</p>
              <p style={{ fontSize: '11px', color: '#3f3f46', margin: 0 }}>MP4, MOV, WebM, AVI, MKV</p>
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ ...S.btn('ghost'), fontSize: '12px', padding: '6px 16px' }}>Browse file</button>
          </div>
        )}

        {/* Processing overlay */}
        {(stage === 'extracting' || stage === 'saving') && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid #27272a', borderTopColor: '#b7475a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>{stageLabel}</p>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept={VIDEO_ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ display: 'none' }} />

      {file && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#1c1c1f', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {file.name.split('.').pop()?.toUpperCase()}
          </span>
          <span style={{ fontSize: '10px', color: '#52525b' }}>{formatFileSize(file.size)}</span>
          <span style={{ fontSize: '10px', color: '#52525b' }}>{file.name}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Image Drop Zone ────────────────────────────────── */
function ImgZone({ label, required, preview, dragging, urlValue, onFile, onUrl, onClear, onDrop, onDragOver, onDragLeave, fileRef, hint }: {
  label: string; required?: boolean; preview: string | null; dragging: boolean;
  urlValue: string; onFile: (f: File) => void; onUrl: (v: string) => void; onClear: () => void;
  onDrop: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void;
  fileRef: any; hint?: string;
}) {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <label style={S.lbl}>{label}{required && ' *'}</label>
        <div style={{ display: 'flex', gap: '3px' }}>
          {(['file', 'url'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
              background: mode === m ? '#27272a' : 'transparent',
              border: mode === m ? '1px solid #3f3f46' : '1px solid transparent',
              color: mode === m ? '#a1a1aa' : '#3f3f46',
            }}>{m === 'file' ? '↑ File' : '⌘ URL'}</button>
          ))}
        </div>
      </div>
      {mode === 'url' ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={urlValue} onChange={(e) => onUrl(e.target.value)} placeholder="https://images.unsplash.com/…" style={{ ...S.inp(), flex: 1 }} />
          {urlValue && <button type="button" onClick={onClear} style={{ ...S.btn('ghost'), padding: '7px 10px', flexShrink: 0 }}>✕</button>}
        </div>
      ) : (
        <div onClick={() => fileRef.current?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          style={{ border: `2px dashed ${dragging ? '#b7475a' : preview ? '#4a9b8e' : '#2a2a2e'}`, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: dragging ? 'rgba(183,71,90,0.05)' : '#111113', transition: 'border-color 0.15s', aspectRatio: '16/9', position: 'relative' }}>
          {preview ? (
            <>
              <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✕</button>
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></svg>
              <span style={{ fontSize: '11px', color: '#52525b' }}>Click or drag image</span>
            </div>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ display: 'none' }} />
      {hint && <p style={{ fontSize: '10px', color: '#3f3f46', marginTop: '4px' }}>{hint}</p>}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function Admin() {
  const [tab, setTab] = useState<Tab>('upload');
  const [customMemories, setCustomMemories] = useState<Memory[]>(getCustomMemories);

  // Upload mode
  const [uploadMode, setUploadMode] = useState<UploadMode>('video');

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [stageLabel, setStageLabel] = useState('');
  const [stageError, setStageError] = useState('');

  // Thumbnail state (shared between modes; auto-filled from video)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbData, setThumbData] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState('');
  const [thumbDrag, setThumbDrag] = useState(false);

  // Backdrop (image mode only)
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null);
  const [backdropData, setBackdropData] = useState<string | null>(null);
  const [backdropUrl, setBackdropUrl] = useState('');
  const [backdropDrag, setBackdropDrag] = useState(false);

  // Form
  const BLANK = { title: '', category: 'Dates' as Category, date: '', location: '', description: '' };
  const [form, setForm] = useState(BLANK);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof BLANK | 'thumb', string>>>({});
  const [success, setSuccess] = useState(false);

  // Library
  const [libFilter, setLibFilter] = useState<LibFilter>('all');
  const [libSearch, setLibSearch] = useState('');
  const [libSort, setLibSort] = useState<SortKey>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', location: '' });
  const [editThumbPreview, setEditThumbPreview] = useState<string | null>(null);
  const [editThumbData, setEditThumbData] = useState<string | null>(null);

  // Refs
  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLInputElement>(null);
  const editThumbRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const allMemories = [...MEMORIES, ...customMemories];
  const storageKB = getStorageKB();
  const storagePct = Math.min(100, (storageKB / STORAGE_LIMIT_KB) * 100);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setEditingId(null); setDeleteConfirm(null); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const refresh = () => setCustomMemories(getCustomMemories());

  /* ─── Video file handling ─── */
  const handleVideoFile = useCallback(async (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(file.name);
    if (!isVideo) { setStageError('That file is not a video. Switch to Image mode for images.'); return; }
    setStageError('');
    const previewUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreviewUrl(previewUrl);
    setStage('extracting');
    setStageLabel('Extracting thumbnail…');
    try {
      const [thumb, durSec] = await Promise.all([
        extractVideoThumbnail(file),
        getVideoDurationSec(file),
      ]);
      setThumbPreview(thumb);
      setThumbData(thumb);
      setVideoDurationSec(durSec);
      setStage('idle');
    } catch {
      setStage('error');
      setStageError('Could not read this video. Try a different format.');
    }
  }, []);

  const clearVideo = useCallback(() => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoDurationSec(null);
    setThumbPreview(null);
    setThumbData(null);
    setStage('idle');
    setStageError('');
    if (videoFileRef.current) videoFileRef.current.value = '';
  }, [videoPreviewUrl]);

  /* ─── Image handling ─── */
  const processThumbFile = useCallback(async (file: File) => {
    setThumbPreview(URL.createObjectURL(file));
    setThumbData(await compressImage(file, 640, 0.82));
  }, []);

  const processBackdropFile = useCallback(async (file: File) => {
    setBackdropPreview(URL.createObjectURL(file));
    setBackdropData(await compressImage(file, 1440, 0.82));
  }, []);

  const clearThumb = () => { setThumbPreview(null); setThumbData(null); setThumbUrl(''); if (thumbRef.current) thumbRef.current.value = ''; };
  const clearBackdrop = () => { setBackdropPreview(null); setBackdropData(null); setBackdropUrl(''); if (backdropRef.current) backdropRef.current.value = ''; };

  const resetForm = () => {
    setForm(BLANK);
    setFieldErrors({});
    clearThumb();
    clearBackdrop();
    if (uploadMode === 'video') clearVideo();
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!form.title.trim()) errs.title = 'Required';
    if (!form.date) errs.date = 'Required';
    const finalThumb = thumbData ?? (thumbUrl.trim() || null);
    if (!finalThumb) errs.thumb = 'Thumbnail required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setStage('saving');
    setStageLabel('Saving to library…');

    const id = `custom-${Date.now()}`;
    const durSec = uploadMode === 'video' ? (videoDurationSec ?? 60) : 60;
    const finalBackdrop = uploadMode === 'video'
      ? (finalThumb!)
      : (backdropData ?? (backdropUrl.trim() || null) ?? finalThumb!);

    try {
      if (uploadMode === 'video' && videoFile) {
        await saveVideoBlob(id, videoFile);
      }

      const mem: Memory = {
        id,
        title: form.title.trim(),
        category: form.category,
        date: fmtDateLabel(form.date),
        dateSort: form.date,
        duration: fmtDuration(durSec),
        durationSec: durSec,
        description: form.description.trim() || `A beautiful memory from ${fmtDateLabel(form.date)}.`,
        thumbnail: finalThumb!,
        backdropUrl: finalBackdrop!,
        ...(form.location.trim() ? { location: form.location.trim() } : {}),
        ...(uploadMode === 'video' ? { videoSrc: `idb:${id}` } : {}),
      };

      addCustomMemory(mem);
      refresh();
      resetForm();
      setStage('done');
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setStage('idle'); }, 5000);
    } catch {
      setStage('error');
      setStageError('Save failed. The video may be too large for your browser storage.');
    }
  };

  /* ─── Delete + undo ─── */
  const doDelete = (id: string) => {
    const idx = customMemories.findIndex((m) => m.id === id);
    const mem = customMemories[idx];
    deleteCustomMemory(id);
    if (mem.videoSrc?.startsWith('idb:')) deleteVideoBlob(id);
    refresh();
    setDeleteConfirm(null);
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    if (undoEntry) clearTimeout(undoEntry.timer);
    const timer = setTimeout(() => setUndoEntry(null), 5500);
    setUndoEntry({ memory: mem, index: idx, timer });
  };

  const undoDelete = async () => {
    if (!undoEntry) return;
    clearTimeout(undoEntry.timer);
    const cur = getCustomMemories();
    cur.splice(undoEntry.index, 0, undoEntry.memory);
    saveCustomMemories(cur);
    refresh();
    setUndoEntry(null);
  };

  const bulkDelete = () => {
    selected.forEach((id) => {
      const m = customMemories.find((x) => x.id === id);
      deleteCustomMemory(id);
      if (m?.videoSrc?.startsWith('idb:')) deleteVideoBlob(id);
    });
    refresh();
    setSelected(new Set());
  };

  const duplicate = (m: Memory) => {
    const copy: Memory = { ...m, id: `custom-${Date.now()}`, title: `${m.title} (copy)`, videoSrc: undefined };
    addCustomMemory(copy);
    refresh();
  };

  /* ─── Edit ─── */
  const startEdit = (m: Memory) => {
    setEditingId(m.id); setEditForm({ title: m.title, description: m.description, location: m.location ?? '' });
    setEditThumbPreview(m.thumbnail); setEditThumbData(null);
  };
  const saveEdit = () => {
    const updated = customMemories.map((m) => m.id !== editingId ? m : {
      ...m, title: editForm.title.trim() || m.title, description: editForm.description.trim() || m.description,
      location: editForm.location.trim() || undefined, thumbnail: editThumbData ?? m.thumbnail,
    });
    saveCustomMemories(updated); refresh(); setEditingId(null); setEditThumbData(null); setEditThumbPreview(null);
  };

  /* ─── Export/Import ─── */
  const handleExport = () => {
    downloadJSON(customMemories.map(({ thumbnail, backdropUrl, ...rest }) => ({
      ...rest,
      thumbnail: thumbnail.startsWith('data:') ? '(embedded image)' : thumbnail,
      backdropUrl: backdropUrl.startsWith('data:') ? '(embedded image)' : backdropUrl,
    })), 'angelflix-memories.json');
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result as string) as Memory[];
        if (!Array.isArray(arr)) throw new Error();
        arr.forEach((m) => { if (m.id && m.title && m.thumbnail) addCustomMemory({ ...m, id: `custom-${Date.now()}-${Math.random()}`, videoSrc: undefined }); });
        refresh();
        alert(`Imported ${arr.length} memories.`);
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = '';
  };

  /* ─── Library ─── */
  const base = libFilter === 'all' ? allMemories : libFilter === 'uploaded' ? customMemories : MEMORIES;
  const libMemories = base
    .filter((m) => !libSearch || m.title.toLowerCase().includes(libSearch.toLowerCase()) || m.category.toLowerCase().includes(libSearch.toLowerCase()))
    .sort((a, b) => libSort === 'newest' ? b.dateSort.localeCompare(a.dateSort) : libSort === 'oldest' ? a.dateSort.localeCompare(b.dateSort) : a.title.localeCompare(b.title));

  const fld = (key: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors((f) => ({ ...f, [key]: undefined }));
  };

  /* ─── Stats ─── */
  const statsMonths = (() => {
    const map: Record<string, number> = {};
    allMemories.forEach((m) => { const k = m.dateSort.slice(0, 7); map[k] = (map[k] ?? 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-8);
  })();
  const maxInMonth = Math.max(...statsMonths.map(([, c]) => c), 1);

  const isSubmitting = stage === 'extracting' || stage === 'saving';
  const previewThumb = thumbData ?? (thumbUrl.trim() ? thumbUrl : null);

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#f4f4f5', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ─── Header ─── */}
      <header style={{ borderBottom: '1px solid #18181b', background: '#09090b', padding: '0 28px', height: '52px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
          <span style={{ color: '#b7475a', fontSize: '14px' }}>◇</span>
          <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', color: '#e4e4e7' }}>ANGELFLIX</span>
          <span style={{ color: '#27272a', margin: '0 2px' }}>|</span>
          <span style={{ fontSize: '11px', color: '#3f3f46', fontWeight: 600, letterSpacing: '0.06em' }}>CMS</span>
        </div>
        <div style={{ display: 'flex', gap: '2px', background: '#111113', borderRadius: '8px', padding: '3px', border: '1px solid #1c1c1f' }}>
          {([['upload', '↑ Upload'], ['library', '▦ Library'], ['stats', '◎ Stats']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 12px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, background: tab === t ? '#1e1e22' : 'transparent', color: tab === t ? '#e4e4e7' : '#52525b', border: tab === t ? '1px solid #2a2a2e' : '1px solid transparent', cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.15s' }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '80px', height: '4px', background: '#1c1c1f', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${storagePct}%`, background: storagePct > 80 ? '#b7475a' : '#4a9b8e', borderRadius: '2px' }} />
          </div>
          <span style={{ fontSize: '10px', color: '#3f3f46' }}>{storageKB} KB text</span>
        </div>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#3f3f46', textDecoration: 'none', letterSpacing: '0.03em', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#a1a1aa'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3f3f46'; }}>
          View Site
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7,7 17,7 17,17" /></svg>
        </a>
      </header>

      {/* ─── Stats bar ─── */}
      <div style={{ borderBottom: '1px solid #111113', background: '#0a0a0c', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: '28px', overflowX: 'auto' }}>
        {[
          { v: allMemories.length, l: 'Total' },
          { v: customMemories.length, l: 'Uploaded' },
          { v: customMemories.filter((m) => !!m.videoSrc).length, l: 'With Video' },
          { v: MEMORIES.length, l: 'Built-in' },
          { v: fmtTotalRuntime(allMemories), l: 'Runtime' },
        ].map((s, i) => (
          <div key={i} style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#e4e4e7', lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: '#3f3f46', marginTop: '2px', letterSpacing: '0.04em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 28px 80px' }}>

        {/* ─── UPLOAD TAB ─── */}
        {tab === 'upload' && (
          <div>
            {success && (
              <div style={{ background: 'rgba(74,155,142,0.08)', border: '1px solid rgba(74,155,142,0.2)', borderRadius: '10px', padding: '11px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#5bc5b4' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                Memory saved — switch to Library to see it. AngelFlix picks it up automatically.
                <button onClick={() => setTab('library')} style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#5bc5b4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Go to Library →</button>
              </div>
            )}
            {stageError && (
              <div style={{ background: 'rgba(183,71,90,0.08)', border: '1px solid rgba(183,71,90,0.2)', borderRadius: '10px', padding: '11px 16px', marginBottom: '18px', fontSize: '13px', color: '#e07080', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {stageError}
                <button onClick={() => setStageError('')} style={{ marginLeft: 'auto', color: '#e07080', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            )}

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setUploadMode('video'); resetForm(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', background: uploadMode === 'video' ? '#1e1e22' : 'transparent', border: uploadMode === 'video' ? '1px solid #b7475a' : '1px solid #27272a', color: uploadMode === 'video' ? '#e4e4e7' : '#52525b' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23,7 16,12 23,17" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>Video + Images</div>
                  <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '1px' }}>Upload raw footage with auto thumbnail</div>
                </div>
              </button>
              <button type="button" onClick={() => { setUploadMode('image'); resetForm(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', background: uploadMode === 'image' ? '#1e1e22' : 'transparent', border: uploadMode === 'image' ? '1px solid #b7475a' : '1px solid #27272a', color: uploadMode === 'image' ? '#e4e4e7' : '#52525b' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>Images Only</div>
                  <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '1px' }}>Simulated player with your photos</div>
                </div>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '20px', alignItems: 'start' }}>
              <form onSubmit={handleSubmit} style={{ ...S.card, padding: '24px' }}>

                {/* Video drop zone (video mode only) */}
                {uploadMode === 'video' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ ...S.lbl, marginBottom: '8px' }}>Video File *</label>
                    <VideoDropZone
                      file={videoFile} previewUrl={videoPreviewUrl} dragging={videoDragOver}
                      stage={stage} stageLabel={stageLabel}
                      onFile={handleVideoFile}
                      onClear={clearVideo}
                      fileRef={videoFileRef}
                      onDragOver={() => setVideoDragOver(true)}
                      onDragLeave={() => setVideoDragOver(false)}
                    />
                    {videoDurationSec != null && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#18181b', border: '1px solid #27272a', fontSize: '11px', color: '#71717a', display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                          Duration: <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{fmtDuration(videoDurationSec)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Thumbnail */}
                <div style={{ marginBottom: uploadMode === 'video' ? '20px' : '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ ...S.lbl, margin: 0 }}>
                      Thumbnail {uploadMode === 'video' ? '(auto-extracted)' : '*'}
                      {fieldErrors.thumb && <span style={{ color: '#b7475a', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>— {fieldErrors.thumb}</span>}
                    </label>
                    {uploadMode === 'video' && videoFile && (
                      <button type="button" onClick={() => { if (videoFile) { setStage('extracting'); setStageLabel('Re-extracting…'); extractVideoThumbnail(videoFile, Math.random() * 10).then((t) => { setThumbPreview(t); setThumbData(t); setStage('idle'); }); } }}
                        style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Re-extract from different frame
                      </button>
                    )}
                  </div>
                  {uploadMode === 'video' ? (
                    <div style={{ aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', background: '#111113', border: `1px solid ${fieldErrors.thumb ? '#b7475a' : '#27272a'}`, position: 'relative' }}>
                      {thumbPreview
                        ? <img src={thumbPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3f3f46', fontSize: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></svg>
                          Thumbnail extracted automatically from video
                        </div>
                      }
                      {thumbPreview && (
                        <button type="button" onClick={() => { setThumbPreview(null); setThumbData(null); }} style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✕</button>
                      )}
                    </div>
                  ) : (
                    <ImgZone label="" preview={thumbPreview ?? (thumbUrl ? thumbUrl : null)} dragging={thumbDrag} urlValue={thumbUrl}
                      onFile={processThumbFile} onUrl={(v) => { setThumbUrl(v); setThumbData(null); setThumbPreview(null); }}
                      onClear={clearThumb}
                      onDrop={(e) => { e.preventDefault(); setThumbDrag(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) processThumbFile(f); }}
                      onDragOver={(e) => { e.preventDefault(); setThumbDrag(true); }} onDragLeave={() => setThumbDrag(false)}
                      fileRef={thumbRef} hint="JPG/PNG/WEBP · 16:9 recommended" />
                  )}
                </div>

                {/* Backdrop (image mode) */}
                {uploadMode === 'image' && (
                  <div style={{ marginBottom: '20px' }}>
                    <ImgZone label="Backdrop" preview={backdropPreview ?? (backdropUrl ? backdropUrl : null)} dragging={backdropDrag} urlValue={backdropUrl}
                      onFile={processBackdropFile} onUrl={(v) => { setBackdropUrl(v); setBackdropData(null); setBackdropPreview(null); }}
                      onClear={clearBackdrop}
                      onDrop={(e) => { e.preventDefault(); setBackdropDrag(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) processBackdropFile(f); }}
                      onDragOver={(e) => { e.preventDefault(); setBackdropDrag(true); }} onDragLeave={() => setBackdropDrag(false)}
                      fileRef={backdropRef} hint="Wide hero image — falls back to thumbnail" />
                  </div>
                )}

                {/* Fields */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={S.lbl}>Title{fieldErrors.title && <span style={{ color: '#b7475a', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>— {fieldErrors.title}</span>}</label>
                  <input value={form.title} onChange={fld('title')} placeholder="e.g. Our First Coffee Date" style={S.inp(!!fieldErrors.title)} onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3d3d47'; }} onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = fieldErrors.title ? '#b7475a' : '#2e2e32'; }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={S.lbl}>Category</label>
                    <select value={form.category} onChange={fld('category')} style={{ ...S.inp(), cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2352525b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>Date{fieldErrors.date && <span style={{ color: '#b7475a', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>— {fieldErrors.date}</span>}</label>
                    <input type="date" value={form.date} onChange={fld('date')} style={{ ...S.inp(!!fieldErrors.date), colorScheme: 'dark' }} onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3d3d47'; }} onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = fieldErrors.date ? '#b7475a' : '#2e2e32'; }} />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={S.lbl}>Location <span style={{ color: '#2e2e32', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span></label>
                  <input value={form.location} onChange={fld('location')} placeholder="e.g. Tagaytay, Cavite" style={S.inp()} onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3d3d47'; }} onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2e2e32'; }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={S.lbl}>Description <span style={{ color: '#2e2e32', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span></label>
                  <textarea value={form.description} onChange={fld('description')} placeholder="What made this moment special?" rows={3} style={{ ...S.inp(), resize: 'vertical', lineHeight: '1.55' }} onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3d3d47'; }} onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2e2e32'; }} />
                </div>

                {uploadMode === 'video' && videoDurationSec != null && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#111113', border: '1px solid #1c1c1f', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a9b8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                    <span style={{ fontSize: '12px', color: '#71717a' }}>Duration auto-set from video: <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{fmtDuration(videoDurationSec)}</span></span>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting}
                  style={{ width: '100%', padding: '11px', background: isSubmitting ? '#1c1c1f' : '#b7475a', color: isSubmitting ? '#3f3f46' : 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.04em', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = '#c75a6b'; }}
                  onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = '#b7475a'; }}>
                  {isSubmitting ? (
                    <><div style={{ width: '13px', height: '13px', border: '2px solid #3f3f46', borderTopColor: '#71717a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{stageLabel}</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Save Memory</>
                  )}
                </button>
              </form>

              {/* Preview sidebar */}
              <div style={{ position: 'sticky', top: '76px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ ...S.lbl, margin: 0 }}>Live Preview</p>
                <div style={S.card}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#18181b' }}>
                    {previewThumb
                      ? <img src={previewThumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#27272a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></svg>
                      </div>}
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: '5px', padding: '2px 7px', fontSize: '10px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{form.category}</div>
                    {uploadMode === 'video' && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(183,71,90,0.85)', fontSize: '9px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>VIDEO</div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: form.title ? '#e4e4e7' : '#2e2e32', marginBottom: '4px', lineHeight: '1.3' }}>{form.title || 'Memory title'}</div>
                    <div style={{ fontSize: '11px', color: '#52525b', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      <span>{form.date ? fmtDateLabel(form.date) : 'Date'}</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span>{uploadMode === 'video' && videoDurationSec != null ? fmtDuration(videoDurationSec) : '— min'}</span>
                      {form.location && <><span style={{ opacity: 0.4 }}>·</span><span>{form.location}</span></>}
                    </div>
                  </div>
                </div>

                <div style={{ ...S.card, padding: '14px' }}>
                  <p style={{ ...S.lbl, marginBottom: '10px' }}>Category Distribution</p>
                  {CATEGORIES.map((cat) => {
                    const count = allMemories.filter((m) => m.category === cat).length;
                    if (!count) return null;
                    return (
                      <div key={cat} style={{ marginBottom: '7px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '11px', color: '#71717a' }}>{cat}</span>
                          <span style={{ fontSize: '11px', color: '#3f3f46' }}>{count}</span>
                        </div>
                        <div style={{ height: '3px', background: '#1c1c1f', borderRadius: '2px' }}>
                          <div style={{ height: '100%', width: `${(count / allMemories.length) * 100}%`, background: CAT_COLORS[cat], borderRadius: '2px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Storage note for video mode */}
                {uploadMode === 'video' && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#111113', border: '1px solid #1c1c1f', fontSize: '11px', color: '#52525b', lineHeight: '1.55' }}>
                    <div style={{ fontWeight: 700, color: '#3f3f46', marginBottom: '4px', letterSpacing: '0.04em', fontSize: '10px', textTransform: 'uppercase' }}>Storage note</div>
                    Videos are saved in your browser's IndexedDB — they persist between sessions and support large files. Thumbnails are stored separately as JPEG.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── LIBRARY TAB ─── */}
        {tab === 'library' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['all', 'uploaded', 'builtin'] as LibFilter[]).map((f) => {
                  const count = f === 'all' ? allMemories.length : f === 'uploaded' ? customMemories.length : MEMORIES.length;
                  return (
                    <button key={f} onClick={() => setLibFilter(f)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: libFilter === f ? '#1e1e22' : 'transparent', color: libFilter === f ? '#e4e4e7' : '#52525b', border: libFilter === f ? '1px solid #2a2a2e' : '1px solid #1c1c1f' }}>
                      {f === 'all' ? 'All' : f === 'uploaded' ? 'Uploaded' : 'Built-in'} <span style={{ opacity: 0.55 }}>({count})</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input value={libSearch} onChange={(e) => setLibSearch(e.target.value)} placeholder="Search…" style={{ ...S.inp(), paddingLeft: '32px', width: '100%' }} />
              </div>
              <select value={libSort} onChange={(e) => setLibSort(e.target.value as SortKey)} style={{ ...S.inp(), width: 'auto', cursor: 'pointer', fontSize: '11px', paddingRight: '28px', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2352525b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A–Z</option>
              </select>
              <button onClick={handleExport} style={{ ...S.btn('ghost'), fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>Export
              </button>
              <button onClick={() => importRef.current?.click()} style={{ ...S.btn('ghost'), fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>Import
              </button>
              <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              <button onClick={() => setTab('upload')} style={{ ...S.btn('primary'), fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Upload
              </button>
            </div>

            {selected.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(183,71,90,0.08)', border: '1px solid rgba(183,71,90,0.2)', marginBottom: '14px', fontSize: '12px' }}>
                <span style={{ color: '#a1a1aa' }}>{selected.size} selected</span>
                <button onClick={bulkDelete} style={{ ...S.btn('danger'), fontSize: '11px', padding: '4px 12px' }}>Delete selected</button>
                <button onClick={() => setSelected(new Set())} style={{ fontSize: '11px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
            )}

            {libMemories.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 0', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#52525b', margin: '0 0 10px' }}>No memories match.</p>
                {libSearch && <button onClick={() => setLibSearch('')} style={{ fontSize: '12px', color: '#b7475a', background: 'none', border: 'none', cursor: 'pointer' }}>Clear search</button>}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {libMemories.map((m) => {
                  const isCustom = m.id.startsWith('custom-');
                  const hasVideo = !!m.videoSrc;
                  const catColor = CAT_COLORS[m.category] ?? '#b7475a';
                  const isSel = selected.has(m.id);
                  return (
                    <div key={m.id} style={{ ...S.card, outline: isSel ? '2px solid #b7475a' : 'none', outlineOffset: '2px', transition: 'outline 0.1s, border-color 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#1c1c1f'; }}>
                      <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                        <img src={m.thumbnail} alt={m.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)' }} />
                        {isCustom && (
                          <button type="button" onClick={() => setSelected((s) => { const n = new Set(s); isSel ? n.delete(m.id) : n.add(m.id); return n; })}
                            style={{ position: 'absolute', top: '8px', left: '8px', width: '18px', height: '18px', borderRadius: '4px', background: isSel ? '#b7475a' : 'rgba(0,0,0,0.6)', border: `1px solid ${isSel ? '#b7475a' : 'rgba(255,255,255,0.25)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            {isSel && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>}
                          </button>
                        )}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                          {hasVideo && (
                            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: 'rgba(183,71,90,0.85)', color: 'white', backdropFilter: 'blur(4px)', letterSpacing: '0.04em' }}>VIDEO</span>
                          )}
                          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: isCustom ? 'rgba(74,155,142,0.85)' : 'rgba(0,0,0,0.55)', color: 'white', backdropFilter: 'blur(4px)', letterSpacing: '0.04em' }}>
                            {isCustom ? 'uploaded' : 'built-in'}
                          </span>
                        </div>
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', padding: '2px 7px', borderRadius: '4px', background: `${catColor}cc`, color: 'white' }}>{m.category}</span>
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px 4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{m.title}</div>
                        <div style={{ fontSize: '10px', color: '#52525b', display: 'flex', gap: '5px' }}>
                          <span>{m.date}</span><span style={{ opacity: 0.4 }}>·</span><span>{m.duration}</span>
                        </div>
                      </div>
                      {isCustom && (
                        <div style={{ padding: '8px 12px 10px', display: 'flex', gap: '5px' }}>
                          <button onClick={() => startEdit(m)} style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 700, color: '#71717a', background: '#18181b', border: '1px solid #27272a', borderRadius: '5px', cursor: 'pointer', letterSpacing: '0.04em', transition: 'color 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#e4e4e7'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717a'; }}>Edit</button>
                          <button onClick={() => duplicate(m)} style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 700, color: '#71717a', background: '#18181b', border: '1px solid #27272a', borderRadius: '5px', cursor: 'pointer', letterSpacing: '0.04em', transition: 'color 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#e4e4e7'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717a'; }}>Copy</button>
                          {deleteConfirm === m.id
                            ? <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                              <button onClick={() => doDelete(m.id)} style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 700, color: '#e07080', background: 'rgba(183,71,90,0.12)', border: '1px solid rgba(183,71,90,0.25)', borderRadius: '5px', cursor: 'pointer' }}>Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '4px 7px', fontSize: '10px', color: '#52525b', background: 'transparent', border: '1px solid #27272a', borderRadius: '5px', cursor: 'pointer' }}>✕</button>
                            </div>
                            : <button onClick={() => setDeleteConfirm(m.id)} style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 700, color: '#52525b', background: '#18181b', border: '1px solid #27272a', borderRadius: '5px', cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#e07080'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#52525b'; }}>Delete</button>
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── STATS TAB ─── */}
        {tab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ ...S.card, padding: '24px', gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
              {[
                { v: allMemories.length, l: 'Total Memories', color: '#e4e4e7' },
                { v: fmtTotalRuntime(allMemories), l: 'Total Runtime', color: '#e4e4e7' },
                { v: customMemories.filter((m) => !!m.videoSrc).length, l: 'Real Videos', color: '#b7475a' },
                { v: customMemories.length, l: 'Uploaded by You', color: '#4a9b8e' },
              ].map((s, i, arr) => (
                <div key={i} style={{ padding: '0 24px', borderRight: i < arr.length - 1 ? '1px solid #1c1c1f' : 'none', ...(i === 0 ? { paddingLeft: 0 } : {}) }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '6px', letterSpacing: '-0.02em' }}>{s.v}</div>
                  <div style={{ fontSize: '11px', color: '#52525b', letterSpacing: '0.04em' }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, padding: '22px' }}>
              <p style={{ ...S.lbl, marginBottom: '16px' }}>By Category</p>
              {CATEGORIES.map((cat) => {
                const total = allMemories.filter((m) => m.category === cat).length;
                const withVideo = customMemories.filter((m) => m.category === cat && !!m.videoSrc).length;
                if (!total) return null;
                return (
                  <div key={cat} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_COLORS[cat] }} />
                        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{cat}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#52525b' }}>{total}</span>
                        {withVideo > 0 && <span style={{ fontSize: '12px', color: '#b7475a' }}>{withVideo} video{withVideo > 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <div style={{ height: '6px', background: '#1c1c1f', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(total / allMemories.length) * 100}%`, background: CAT_COLORS[cat], borderRadius: '3px', opacity: 0.85 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...S.card, padding: '22px' }}>
              <p style={{ ...S.lbl, marginBottom: '16px' }}>Activity by Month</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
                {statsMonths.map(([key, count]) => {
                  const [, m] = key.split('-').map(Number);
                  return (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '9px', color: '#52525b', fontWeight: 700 }}>{count}</span>
                      <div style={{ width: '100%', background: '#b7475a', borderRadius: '3px 3px 0 0', height: `${(count / maxInMonth) * 72}px`, opacity: 0.75, minHeight: '4px' }} />
                      <span style={{ fontSize: '9px', color: '#3f3f46' }}>{MONTHS[m - 1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...S.card, padding: '22px' }}>
              <p style={{ ...S.lbl, marginBottom: '14px' }}>Most Recent Memories</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...allMemories].sort((a, b) => b.dateSort.localeCompare(a.dateSort)).slice(0, 5).map((m) => (
                  <div key={m.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '28px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <img src={m.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {m.videoSrc && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg></div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                      <div style={{ fontSize: '10px', color: '#3f3f46' }}>{m.date}</div>
                    </div>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: CAT_COLORS[m.category] }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Undo toast ─── */}
      {undoEntry && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1e1e22', border: '1px solid #2a2a2e', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100, whiteSpace: 'nowrap', fontSize: '13px', color: '#a1a1aa' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6" /><path d="M19,6l-1,14a2,2 0 0,1-2,2H8a2,2 0 0,1-2-2L5,6" /></svg>
          <span><span style={{ color: '#e4e4e7', fontWeight: 600 }}>{undoEntry.memory.title}</span> deleted</span>
          <button onClick={undoDelete} style={{ fontSize: '12px', fontWeight: 700, color: '#b7475a', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>UNDO</button>
          <button onClick={() => { clearTimeout(undoEntry.timer); setUndoEntry(null); }} style={{ color: '#3f3f46', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>✕</button>
        </div>
      )}

      {/* ─── Edit modal ─── */}
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setEditingId(null)}>
          <div style={{ background: '#111113', border: '1px solid #27272a', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>Edit Memory</h3>
              <button onClick={() => setEditingId(null)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1e1e22', border: '1px solid #27272a', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={S.lbl}>Title</label>
              <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} style={S.inp()} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={S.lbl}>Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...S.inp(), resize: 'vertical', lineHeight: '1.55' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={S.lbl}>Location</label>
              <input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} style={S.inp()} />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={S.lbl}>Replace Thumbnail <span style={{ color: '#2e2e32', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span></label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '45px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #27272a' }}>
                  {editThumbPreview && <img src={editThumbPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <button type="button" onClick={() => editThumbRef.current?.click()} style={{ ...S.btn('ghost'), fontSize: '11px' }}>Choose image…</button>
                <input ref={editThumbRef} type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setEditThumbPreview(URL.createObjectURL(f)); setEditThumbData(await compressImage(f, 640, 0.82)); }} style={{ display: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveEdit} style={{ flex: 1, ...S.btn('primary'), fontSize: '13px', padding: '10px', letterSpacing: '0.03em' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#c75a6b'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#b7475a'; }}>
                Save Changes
              </button>
              <button onClick={() => setEditingId(null)} style={{ ...S.btn('ghost'), padding: '10px 16px', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
