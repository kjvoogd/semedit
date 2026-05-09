import { useState, useEffect } from 'react';
import type { TreeItem } from '../types/tree';

const SESSION_KEY = 'semedit-tree';

function removeById(items: TreeItem[], id: string): TreeItem[] {
  return items
    .filter(item => item.id !== id)
    .map(item => ({
      ...item,
      children: item.children ? removeById(item.children, id) : undefined,
    }));
}

function addById(items: TreeItem[], parentId: string, newNode: TreeItem): TreeItem[] {
  return items.map(item => {
    if (item.id === parentId) {
      return { ...item, children: [...(item.children ?? []), newNode] };
    }
    return {
      ...item,
      children: item.children ? addById(item.children, parentId, newNode) : undefined,
    };
  });
}

function renameById(items: TreeItem[], id: string, label: string): TreeItem[] {
  return items.map(item => {
    if (item.id === id) return { ...item, label };
    return {
      ...item,
      children: item.children ? renameById(item.children, id, label) : undefined,
    };
  });
}

type DropPosition = 'before' | 'after' | 'into';

function isDescendant(items: TreeItem[], ancestorId: string, targetId: string): boolean {
  for (const item of items) {
    if (item.id === ancestorId) {
      return (item.children ?? []).some(c => c.id === targetId || isDescendant(item.children ?? [], c.id, targetId));
    }
    if (isDescendant(item.children ?? [], ancestorId, targetId)) return true;
  }
  return false;
}

function findAndRemove(items: TreeItem[], id: string): [TreeItem[], TreeItem | null] {
  let removed: TreeItem | null = null;
  const next = items
    .filter(item => {
      if (item.id === id) { removed = item; return false; }
      return true;
    })
    .map(item => {
      if (removed || !item.children) return item;
      const [children, found] = findAndRemove(item.children, id);
      if (found) { removed = found; return { ...item, children }; }
      return item;
    });
  return [next, removed];
}

function insertNode(items: TreeItem[], targetId: string, node: TreeItem, position: DropPosition): TreeItem[] {
  const result: TreeItem[] = [];
  for (const item of items) {
    if (item.id === targetId) {
      if (position === 'before') { result.push(node, item); }
      else if (position === 'after') { result.push(item, node); }
      else { result.push({ ...item, children: [...(item.children ?? []), node] }); }
    } else {
      result.push(
        item.children
          ? { ...item, children: insertNode(item.children, targetId, node, position) }
          : item
      );
    }
  }
  return result;
}

function persist(tree: TreeItem[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(tree));
  } catch {
    // sessionStorage unavailable (e.g. storage quota exceeded)
  }
}

function loadFromSession(): TreeItem[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as TreeItem[]) : null;
  } catch {
    return null;
  }
}

export function useTreeData(url: string) {
  const [data, setData] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadFromSession();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<TreeItem[]>;
      })
      .then(json => {
        persist(json);
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  const removeNode = (id: string) =>
    setData(prev => {
      const next = removeById(prev, id);
      persist(next);
      return next;
    });

  const addNode = (parentId: string, newNode: TreeItem) =>
    setData(prev => {
      const next = addById(prev, parentId, newNode);
      persist(next);
      return next;
    });

  const renameNode = (id: string, label: string) =>
    setData(prev => {
      const next = renameById(prev, id, label);
      persist(next);
      return next;
    });

  const moveNode = (id: string, targetId: string, position: DropPosition) => {
    if (id === targetId) return;
    setData(prev => {
      if (isDescendant(prev, id, targetId)) return prev;
      const [without, node] = findAndRemove(prev, id);
      if (!node) return prev;
      const next = insertNode(without, targetId, node, position);
      persist(next);
      return next;
    });
  };

  const loadTree = (items: TreeItem[]) =>
    setData(() => {
      persist(items);
      return items;
    });

  return { data, loading, error, removeNode, addNode, renameNode, moveNode, loadTree };
}
