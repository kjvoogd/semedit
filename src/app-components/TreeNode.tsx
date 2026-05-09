import { useState, useRef, useEffect } from 'react';
import type { TreeItem } from '../types/tree';
import styles from './TreeNode.module.css';

type DropPosition = 'before' | 'after' | 'into';
type DropIndicator = { id: string; position: DropPosition } | null;

interface TreeNodeProps {
  item: TreeItem;
  onAddChild: (parentId: string) => void;
  editingId: string | null;
  onCommitEdit: (id: string, label: string) => void;
  onCancelEdit: (id: string) => void;
  confirmingId: string | null;
  onKeep: (id: string) => void;
  onDiscard: (id: string) => void;
  deletingId: string | null;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  dropIndicator: DropIndicator;
  onDropIndicatorChange: (indicator: DropIndicator) => void;
  onDrop: (draggedId: string, targetId: string, position: DropPosition) => void;
  expandId: string | null;
  depth?: number;
}

function useTruncatedLabel(label: string) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [displayLabel, setDisplayLabel] = useState(label);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.offsetWidth;
      if (!width) return;

      const clone = document.createElement('span');
      const cs = getComputedStyle(el);
      clone.style.cssText = `
        position: fixed;
        top: -9999px;
        left: 0;
        visibility: hidden;
        width: ${width}px;
        font: ${cs.font};
        line-height: ${cs.lineHeight};
        word-break: ${cs.wordBreak};
        white-space: ${cs.whiteSpace};
        overflow: visible;
        max-height: none;
      `;
      document.body.appendChild(clone);

      const lh = parseFloat(cs.lineHeight) || 18;
      const maxH = lh * 2 + 2;

      clone.textContent = label;

      if (clone.scrollHeight <= maxH) {
        setIsTruncated(false);
        setDisplayLabel(label);
        document.body.removeChild(clone);
        return;
      }

      let lo = 0;
      let hi = label.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        clone.textContent = label.slice(0, mid) + '..';
        if (clone.scrollHeight <= maxH) lo = mid;
        else hi = mid - 1;
      }

      document.body.removeChild(clone);
      setDisplayLabel(label.slice(0, lo) + '..');
      setIsTruncated(true);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [label]);

  return { labelRef, displayLabel, isTruncated, showTooltip, setShowTooltip };
}

export default function TreeNode({
  item,
  onAddChild,
  editingId,
  onCommitEdit,
  onCancelEdit,
  confirmingId,
  onKeep,
  onDiscard,
  deletingId,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  dropIndicator,
  onDropIndicatorChange,
  onDrop,
  expandId,
  depth = 0,
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);
  const isEditing = item.id === editingId;
  const isConfirming = item.id === confirmingId;
  const isDeleting = item.id === deletingId;
  const hasChildren = Boolean(item.children?.length);

  const activeIndicator =
    dropIndicator?.id === item.id ? dropIndicator.position : null;

  const { labelRef, displayLabel, isTruncated, showTooltip, setShowTooltip } =
    useTruncatedLabel(item.label);

  // Reset committedRef, auto-focus and select-all when editing starts
  useEffect(() => {
    if (isEditing) {
      committedRef.current = false;
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isEditing]);

  // Auto-expand when a direct child enters edit or confirm mode
  useEffect(() => {
    const childActive =
      (editingId && item.children?.some(c => c.id === editingId)) ||
      (confirmingId && item.children?.some(c => c.id === confirmingId));
    if (childActive) setIsOpen(true);
  }, [editingId, confirmingId, item.children]);

  // Force-expand when targeted by a reparent drop
  useEffect(() => {
    if (expandId === item.id) setIsOpen(true);
  }, [expandId, item.id]);

  const handleRowClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onAddChild(item.id);
      setIsOpen(true);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      committedRef.current = true;
      onCommitEdit(item.id, inputRef.current?.value ?? '');
    } else if (e.key === 'Escape') {
      committedRef.current = true;
      onCancelEdit(item.id);
    }
  };

  const handleInputBlur = () => {
    if (!committedRef.current) {
      committedRef.current = true;
      onCommitEdit(item.id, inputRef.current?.value ?? '');
    }
  };

  // ── Drag handlers ──────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDropIndicatorChange(null);
  };

  const resolvePosition = (e: React.DragEvent): DropPosition => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    if (relY < 0.3) return 'before';
    if (relY > 0.7) return 'after';
    return 'into';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const position = resolvePosition(e);
    onDropIndicatorChange({ id: item.id, position });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    onDropIndicatorChange(null);
  };

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === item.id) return;
    const position = resolvePosition(e);
    onDrop(draggedId, item.id, position);
  };

  // ── Row CSS class ──────────────────────────────────────────────

  const rowClass = [
    styles.row,
    isDragging ? styles.dragging : '',
    activeIndicator === 'before' ? styles.dropBefore : '',
    activeIndicator === 'after' ? styles.dropAfter : '',
    activeIndicator === 'into' ? styles.dropInto : '',
  ].filter(Boolean).join(' ');

  const isOverridingPadding = isConfirming || isDeleting;

  // ── Shared props for child TreeNodes ──────────────────────────

  const childProps = {
    onAddChild,
    editingId,
    onCommitEdit,
    onCancelEdit,
    confirmingId,
    onKeep,
    onDiscard,
    deletingId,
    onRequestDelete,
    onConfirmDelete,
    onCancelDelete,
    dropIndicator,
    onDropIndicatorChange,
    onDrop,
    expandId,
    depth: depth + 1,
  };

  return (
    <div className={styles.node}>
      <div
        className={rowClass}
        style={{ paddingLeft: isOverridingPadding ? 0 : depth * 20 }}
        draggable={!isEditing && !isConfirming && !isDeleting}
        onClick={handleRowClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropEvent}
      >
        {isConfirming ? (
          <>
            <div className={styles.confirmRow}>
              <span className={styles.confirmQuestion}>Keep node?</span>
              <button
                className={styles.keepBtn}
                onMouseDown={e => { e.preventDefault(); onKeep(item.id); }}
              >
                Yes
              </button>
              <button
                className={styles.discardBtn}
                onMouseDown={e => { e.preventDefault(); onDiscard(item.id); }}
              >
                No
              </button>
            </div>
            <button
              className={styles.remove}
              onClick={e => { e.stopPropagation(); onRequestDelete(item.id); }}
            >
              ×
            </button>
          </>
        ) : isDeleting ? (
          <>
            <div className={styles.confirmRow}>
              <span className={styles.confirmQuestion}>Delete?</span>
              <button
                className={styles.keepBtn}
                onMouseDown={e => { e.preventDefault(); onConfirmDelete(item.id); }}
              >
                Yes
              </button>
              <button
                className={styles.discardBtn}
                onMouseDown={e => { e.preventDefault(); onCancelDelete(); }}
              >
                No
              </button>
            </div>
          </>
        ) : (
          <>
            {hasChildren ? (
              <button
                className={styles.toggle}
                onClick={e => { e.stopPropagation(); setIsOpen(o => !o); }}
              >
                {isOpen ? '−' : '+'}
              </button>
            ) : (
              <span className={styles.spacer} />
            )}

            {isEditing ? (
              <input
                ref={inputRef}
                className={styles.editInput}
                defaultValue="--value--"
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
              />
            ) : (
              <span
                ref={labelRef}
                className={styles.label}
                onMouseEnter={() => isTruncated && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {displayLabel}
                {isTruncated && showTooltip && (
                  <div className={styles.tooltip}>{item.label}</div>
                )}
              </span>
            )}

            <button
              className={styles.remove}
              onClick={e => { e.stopPropagation(); onRequestDelete(item.id); }}
            >
              ×
            </button>
          </>
        )}
      </div>

      {hasChildren && (
        <div className={`${styles.children} ${isOpen ? styles.open : ''}`}>
          {item.children!.map(child => (
            <TreeNode
              key={child.id}
              item={child}
              {...childProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
