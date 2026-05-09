import { useState } from 'react';
import type { TreeItem } from '../types/tree';
import TreeNode from './TreeNode';
import styles from './Navigation.module.css';

type DropPosition = 'before' | 'after' | 'into';
type DropIndicator = { id: string; position: DropPosition } | null;

export interface NavigationProps {
  data: TreeItem[];
  loading: boolean;
  error: string | null;
  removeNode: (id: string) => void;
  addNode: (parentId: string, newNode: TreeItem) => void;
  renameNode: (id: string, label: string) => void;
  moveNode: (id: string, targetId: string, position: DropPosition) => void;
}

export default function Navigation({
  data,
  loading,
  error,
  removeNode,
  addNode,
  renameNode,
  moveNode,
}: NavigationProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
  const [expandId, setExpandId] = useState<string | null>(null);

  if (loading) return <nav className={styles.nav}>Loading…</nav>;
  if (error) return <nav className={styles.nav}>Error: {error}</nav>;

  const handleAddChild = (parentId: string) => {
    const id = crypto.randomUUID();
    addNode(parentId, { id, label: '--value--', children: [] });
    setEditingId(id);
  };

  const handleCommitEdit = (id: string, label: string) => {
    const value = label || '--value--';
    if (value === '--value--') {
      setEditingId(null);
      setConfirmingId(id);
    } else {
      renameNode(id, value);
      setEditingId(null);
    }
  };

  const handleCancelEdit = (id: string) => {
    removeNode(id);
    setEditingId(null);
  };

  const handleKeep = (id: string) => {
    setConfirmingId(null);
    setEditingId(id);
  };

  const handleDiscard = (id: string) => {
    removeNode(id);
    setConfirmingId(null);
    setEditingId(null);
  };

  const handleRequestDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = (id: string) => {
    removeNode(id);
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const handleDropIndicatorChange = (indicator: DropIndicator) => {
    setDropIndicator(indicator);
  };

  const handleDrop = (draggedId: string, targetId: string, position: DropPosition) => {
    moveNode(draggedId, targetId, position);
    setDropIndicator(null);
    if (position === 'into') {
      setExpandId(targetId);
      setTimeout(() => setExpandId(null), 0);
    }
  };

  return (
    <nav className={styles.nav}>
      {data.map(item => (
        <TreeNode
          key={item.id}
          item={item}
          onAddChild={handleAddChild}
          editingId={editingId}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={handleCancelEdit}
          confirmingId={confirmingId}
          onKeep={handleKeep}
          onDiscard={handleDiscard}
          deletingId={deletingId}
          onRequestDelete={handleRequestDelete}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
          dropIndicator={dropIndicator}
          onDropIndicatorChange={handleDropIndicatorChange}
          onDrop={handleDrop}
          expandId={expandId}
          depth={0}
        />
      ))}
    </nav>
  );
}
