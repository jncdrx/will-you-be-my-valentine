import { Memory } from '@/data/memories';

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
  localStorage.setItem(KEY, JSON.stringify(memories));
}

export function addCustomMemory(memory: Memory): void {
  saveCustomMemories([...getCustomMemories(), memory]);
}

export function deleteCustomMemory(id: string): void {
  saveCustomMemories(getCustomMemories().filter((m) => m.id !== id));
}
