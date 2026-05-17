'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Pencil, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { syncItemMetadataByUrl } from '@/lib/api';
import styles from './Lightbox.module.css';

export interface LightboxItem {
  image_url: string;
  title?: string;
  description?: string;
  itemId: string;
  isProjectItem: boolean;
  projectContext?: {
    title: string;
    discipline?: string;
    format?: string;
    year?: number;
    location?: string;
    description?: string;
  };
}

interface Props {
  items: LightboxItem[];
  startIndex: number;
  isOwner: boolean;
  artistName: string;
  onClose: () => void;
  onItemUpdate: (itemId: string, updates: { title?: string; description?: string }) => void;
}

export default function Lightbox({ items, startIndex, isOwner, artistName, onClose, onItemUpdate }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const item = items[index];
  const pc = item?.projectContext;

  const displayTitle = item?.title || '';
  const displayDesc = item?.description || pc?.description || '';
  const displayCategory = pc?.discipline || '';

  useEffect(() => {
    setEditingTitle(false);
    setEditingDesc(false);
    setDraftTitle('');
    setDraftDesc('');
  }, [index]);

  const go = useCallback((dir: 1 | -1) => {
    setIndex(i => Math.max(0, Math.min(items.length - 1, i + dir)));
  }, [items.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go, onClose]);

  const startEditTitle = () => {
    setDraftTitle(item?.title || '');
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const startEditDesc = () => {
    setDraftDesc(item?.description || '');
    setEditingDesc(true);
    setTimeout(() => descRef.current?.focus(), 50);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const updates: { title?: string; description?: string } = {};
    if (editingTitle) updates.title = draftTitle.trim();
    if (editingDesc) updates.description = draftDesc.trim();
    await syncItemMetadataByUrl(item.image_url, updates);
    setSaving(false);
    onItemUpdate(item.itemId, updates);
    setEditingTitle(false);
    setEditingDesc(false);
  };

  if (!item) return null;

  const isDirty = (editingTitle && draftTitle !== (item.title || '')) || (editingDesc && draftDesc !== (item.description || ''));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.lightboxContainer}
      onClick={onClose}
    >
      {/* Background Overlay */}
      <div className={styles.overlay} />

      {/* Close button */}
      <button onClick={onClose} className={styles.closeBtn} aria-label="Close preview">
        <X size={24} />
      </button>

      {/* Navigation - Prev */}
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); go(-1); }}
          className={`${styles.navBtn} ${styles.prevBtn}`}
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Navigation - Next */}
      {index < items.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); go(1); }}
          className={`${styles.navBtn} ${styles.nextBtn}`}
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Media Viewport */}
      <div
        className={styles.mediaViewport}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={item.image_url}
            src={item.image_url}
            alt={displayTitle || 'Work'}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={styles.mediaImage}
          />
        </AnimatePresence>
      </div>

      {/* Info Sidebar */}
      <div className={styles.sidebar} onClick={e => e.stopPropagation()}>
        {/* Category */}
        {displayCategory && (
          <p className={styles.category}>
            // {displayCategory}
          </p>
        )}

        {/* Title Block */}
        {(displayTitle || editingTitle || isOwner) && (
          <div style={{ marginBottom: 24 }}>
            {editingTitle ? (
              <input
                ref={titleRef}
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                className={styles.titleInput}
                placeholder="ENTRY_TITLE"
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditingTitle(false); }}
              />
            ) : (
              <div className={styles.titleWrapper}>
                {displayTitle ? (
                  <h2
                    className={styles.titleText}
                    onClick={isOwner ? startEditTitle : undefined}
                    style={{ cursor: isOwner ? 'pointer' : 'default' }}
                  >
                    {displayTitle}
                  </h2>
                ) : isOwner ? (
                  <span className={styles.addTitleLink} onClick={startEditTitle}>
                    + ADD TITLE
                  </span>
                ) : null}
                {isOwner && displayTitle && (
                  <button onClick={startEditTitle} className={styles.editIconBtn} aria-label="Edit title">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Artist Creds */}
        <div className={styles.artistCreds}>
          <div className={styles.artistAvatar}>
            {artistName[0].toUpperCase()}
          </div>
          <p className={styles.artistName}>
            {artistName}
          </p>
        </div>

        {/* Description Block */}
        <div className={styles.descBlock}>
          {editingDesc ? (
            <textarea
              ref={descRef}
              value={draftDesc}
              onChange={e => setDraftDesc(e.target.value)}
              rows={8}
              className={styles.descTextarea}
              placeholder="Entry description and technical notes..."
              onKeyDown={e => { if (e.key === 'Escape') setEditingDesc(false); }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <p
                className={styles.descText}
                style={{
                  color: displayDesc ? 'var(--text-muted)' : 'var(--text-faint)',
                  cursor: isOwner ? 'pointer' : 'default',
                }}
                onClick={isOwner ? startEditDesc : undefined}
              >
                {displayDesc || (isOwner ? 'Click to add description...' : '')}
              </p>
              {isOwner && (
                <button onClick={startEditDesc} className={styles.editIconBtn} aria-label="Edit description">
                  <Pencil size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Save/Commit Action */}
        <AnimatePresence>
          {isOwner && (editingTitle || editingDesc) && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={save}
              disabled={saving || !isDirty}
              className={styles.saveBtn}
              style={{
                background: isDirty ? 'var(--color-yellow)' : 'var(--bg-raised)',
                color: isDirty ? 'var(--color-ink)' : 'var(--text-faint)',
                cursor: isDirty ? 'pointer' : 'default',
              }}
            >
              {saving ? <Loader size={16} className="spin" /> : <Check size={16} />}
              <span style={{ marginLeft: 8 }}>{saving ? 'Saving…' : 'Commit Changes'}</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Project Footer Meta */}
        {pc && (
          <div className={styles.projectFooterMeta}>
            {pc.format && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>// FORMAT</span>
                <span className={styles.metaValue}>{pc.format.toUpperCase()}</span>
              </div>
            )}
            {pc.location && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>// LOC</span>
                <span className={styles.metaValue}>{pc.location.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Index */}
        <div className={styles.progressIndex}>
          {index + 1}/{items.length}
        </div>
      </div>
    </motion.div>
  );
}
