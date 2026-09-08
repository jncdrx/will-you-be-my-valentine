import { Memory, Category } from '@/data/memories';
import { fetchAngelFlixMedia, deleteAngelFlixMedia } from '../../lib/angelflixApi';

const KEY = 'angelflix_custom_memories';

export function getCustomMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomMemories(memories: Memory[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(memories));
  } catch {
    /* ignore storage errors */
  }
}

export function addCustomMemory(memory: Memory): void {
  const current = getCustomMemories().filter((m) => m.id !== memory.id);
  saveCustomMemories([...current, memory]);
}

export function deleteCustomMemory(id: string): void {
  saveCustomMemories(getCustomMemories().filter((m) => m.id !== id));
}

/**
 * Fetch all memories dynamically from the backend API & database
 */
export async function fetchBackendMemories(): Promise<Memory[]> {
  try {
    const records = await fetchAngelFlixMedia();
    const local = getCustomMemories();

    const backendMemories: Memory[] = (records || []).map((r) => {
      const durSec = r.duration ? Math.round(r.duration) : 60;
      const min = Math.floor(durSec / 60);
      const sec = durSec % 60;
      const durStr = min > 0 ? (sec > 0 ? `${min}m ${sec}s` : `${min} min`) : `${sec}s`;

      return {
        id: r.id,
        title: r.title,
        date: r.date || new Date(r.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dateSort: r.date && r.date.includes('-') ? r.date : (r.date || new Date().toISOString().slice(0, 10)),
        duration: durStr,
        durationSec: durSec,
        category: (r.category || 'Our Videos') as Category,
        description: r.description || '',
        thumbnail: r.imageUrl || '',
        backdropUrl: r.imageUrl || '',
        videoSrc: r.videoUrl || undefined,
        location: (r as any).location || undefined,
      };
    });

    // Merge backend memories with any local custom memories
    const map = new Map<string, Memory>();
    for (const mem of local) map.set(mem.id, mem);
    for (const mem of backendMemories) map.set(mem.id, mem);

    const merged = Array.from(map.values());
    saveCustomMemories(merged);
    return merged;
  } catch (err) {
    console.warn('Backend memories fetch error, using local cache:', err);
    return getCustomMemories();
  }
}

/**
 * Create a new memory in backend database and local cache
 */
export async function createBackendMemory(memory: Memory): Promise<void> {
  addCustomMemory(memory);
  try {
    const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('monthsary_token')) || '';
    await fetch('/api/angelflix/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: memory.id,
        title: memory.title,
        category: memory.category,
        description: memory.description,
        imageUrl: memory.thumbnail,
        videoUrl: memory.videoSrc && !memory.videoSrc.startsWith('idb:') ? memory.videoSrc : null,
        duration: memory.durationSec,
        date: memory.dateSort || memory.date,
        location: memory.location || '',
      }),
    });
  } catch (err) {
    console.warn('Backend createMemory sync notice:', err);
  }
}

/**
 * Delete a memory from backend database, Cloudinary, and local cache
 */
export async function deleteBackendMemory(id: string): Promise<void> {
  deleteCustomMemory(id);
  try {
    await deleteAngelFlixMedia(id);
  } catch (err) {
    console.warn('Backend deleteMemory sync notice:', err);
  }
}
