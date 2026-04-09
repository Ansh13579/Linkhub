'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Link {
  id: string;
  title: string;
  url: string;
  icon: string;
  description: string;
  position: number;
  is_active: boolean;
  click_count: number;
}

function authHeaders() {
  const token = localStorage.getItem('lh_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editLink, setEditLink] = useState<Link | null>(null);
  const [toast, setToast] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchLinks = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/links`, { 
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex(l => l.id === active.id);
    const newIndex = links.findIndex(l => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered); // Optimistic update

    // Persist to backend
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/links/reorder`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ orderedIds: reordered.map(l => l.id) }),
      });
      showToast('Order saved ✓');
    } catch {
      fetchLinks(); // Revert on error
      showToast('Failed to save order');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(link: Link) {
    const updated = { ...link, is_active: !link.is_active };
    setLinks(prev => prev.map(l => l.id === link.id ? updated : l));
    await fetch(`${API_URL}/api/links/${link.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ is_active: updated.is_active }),
    });
    showToast(updated.is_active ? 'Link published' : 'Link hidden');
  }

  async function deleteLink(id: string) {
    if (!confirm('Delete this link?')) return;
    setLinks(prev => prev.filter(l => l.id !== id));
    await fetch(`${API_URL}/api/links/${id}`, { method: 'DELETE', headers: authHeaders() });
    showToast('Link deleted');
  }

  async function handleSaveLink(data: Partial<Link>) {
    if (editLink) {
      // Update existing link
      try {
        const res = await fetch(`${API_URL}/api/links/${editLink.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setLinks(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
          showToast('Link updated ✓');
          setEditLink(null);
          // Refetch to ensure UI is fully in sync with the database
          await fetchLinks();
        } else {
          let errMsg = 'Failed to update link';
          try { const err = await res.json(); errMsg = err.error || errMsg; } catch {}
          showToast(errMsg);
        }
      } catch {
        showToast('Network error – could not save link');
      }
    } else {
      // Create new link
      try {
        const res = await fetch(`${API_URL}/api/links`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const newLink = await res.json();
          setLinks(prev => [...prev, newLink]);
          showToast('Link added ✓');
          setAddOpen(false);
        } else {
          let errMsg = 'Failed to create link';
          try { const err = await res.json(); errMsg = err.error || errMsg; } catch {}
          showToast(errMsg);
        }
      } catch {
        showToast('Network error – could not add link');
      }
    }
  }

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Links</h1>
          <p className={styles.subtitle}>Drag to reorder. Click the eye to show/hide.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          + Add Link
        </button>
      </div>

      {/* Drag instructions */}
      {links.length > 1 && (
        <div className={styles.dragHint}>
          <span>⣿</span> Drag the handle to reorder your links
          {saving && <span className={styles.saving}> · Saving...</span>}
        </div>
      )}

      {/* Links list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 76 }} />)}
        </div>
      ) : links.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.linksList}>
              {links.map(link => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  onEdit={setEditLink}
                  onToggle={toggleActive}
                  onDelete={deleteLink}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit modal */}
      {(addOpen || editLink) && (
        <LinkModal
          link={editLink}
          onSave={handleSaveLink}
          onClose={() => { setAddOpen(false); setEditLink(null); }}
        />
      )}
    </div>
  );
}

// ── Sortable link item ────────────────────────────────────────────────────────
function SortableLinkItem({ link, onEdit, onToggle, onDelete }: {
  link: Link;
  onEdit: (l: Link) => void;
  onToggle: (l: Link) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.linkItem} ${isDragging ? styles.linkItemDragging : ''}`}
    >
      {/* Drag handle */}
      <button className={styles.dragHandle} {...attributes} {...listeners} aria-label="Drag to reorder">
        ⣿
      </button>

      {/* Link icon */}
      <div className={styles.linkIcon}>{link.icon || '🔗'}</div>

      {/* Link info */}
      <div className={styles.linkInfo}>
        <div className={styles.linkTitle}>{link.title}</div>
        <div className={styles.linkUrl}>{link.url}</div>
      </div>

      {/* Clicks badge */}
      <div className={styles.clickCount}>
        <span>👆</span>{link.click_count?.toLocaleString() ?? 0}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {/* Toggle active */}
        <button
          className={`${styles.actionBtn} ${link.is_active ? styles.activeBtn : styles.hiddenBtn}`}
          onClick={() => onToggle(link)}
          title={link.is_active ? 'Hide link' : 'Show link'}
          aria-label={link.is_active ? 'Hide link' : 'Show link'}
        >
          {link.is_active ? '👁' : '🙈'}
        </button>

        {/* Edit */}
        <button
          className={styles.actionBtn}
          onClick={() => onEdit(link)}
          title="Edit link"
          aria-label="Edit link"
        >
          ✏️
        </button>

        {/* Delete */}
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={() => onDelete(link.id)}
          title="Delete link"
          aria-label="Delete link"
        >
          <span style={{ filter: 'brightness(1.5)', opacity: 1, fontSize: '1.2rem', color: '#ff6b6b' }}>🗑</span>
        </button>
      </div>
    </div>
  );
}

// ── Link form modal ───────────────────────────────────────────────────────────
const ICON_OPTIONS = ['🔗', '📸', '🐦', '💼', '▶️', '📚', '🎨', '💻', '🎙️', '📩', '🏋️', '🎮', '🔍', '🚀', '❤️', '🌐', '📅', '🎤', '💬', '✍️'];

function LinkModal({ link, onSave, onClose }: {
  link: Link | null;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: link?.title ?? '',
    url: link?.url ?? '',
    icon: link?.icon ?? '🔗',
    description: link?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState('');

  function validateUrl(u: string) {
    try { new URL(u); setUrlError(''); return true; }
    catch { setUrlError('Please enter a valid URL (include https://)'); return false; }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateUrl(form.url)) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{link ? 'Edit Link' : 'Add New Link'}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 10px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Icon picker */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className={styles.iconGrid}>
              {ICON_OPTIONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  className={`${styles.iconBtn} ${form.icon === ic ? styles.iconBtnActive : ''}`}
                  onClick={() => setForm(f => ({ ...f, icon: ic }))}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="link-title">Title</label>
            <input
              id="link-title"
              type="text"
              className="form-input"
              placeholder="My Website"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              maxLength={60}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="link-url">URL</label>
            <input
              id="link-url"
              type="text"
              className={`form-input ${urlError ? styles.inputError : ''}`}
              placeholder="https://example.com"
              value={form.url}
              onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setUrlError(''); }}
              onBlur={() => form.url && validateUrl(form.url)}
              required
            />
            {urlError && <span className={styles.inputErrorMsg}>{urlError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="link-desc">
              Description <span style={{ fontWeight: 400, textTransform: 'none', color: 'rgba(232,232,240,0.3)' }}>(optional)</span>
            </label>
            <input
              id="link-desc"
              type="text"
              className="form-input"
              placeholder="Short description..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={100}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.title || !form.url}>
              {saving ? '...' : link ? 'Save Changes' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 24px', textAlign: 'center', color: 'var(--dash-text-muted)' }}>
      <div style={{ fontSize: '3rem' }}>🔗</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dash-text)' }}>No links yet</h2>
      <p style={{ fontSize: '0.9rem', maxWidth: 360 }}>
        Add your first link to get started. You can reorder them with drag and drop!
      </p>
      <button className="btn btn-primary" onClick={onAdd}>+ Add Your First Link</button>
    </div>
  );
}
