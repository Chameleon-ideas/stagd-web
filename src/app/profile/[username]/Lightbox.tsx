'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Pencil, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { syncItemMetadataByUrl } from '@/lib/api';

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

  // Per-photo values only — no project name fallback for title
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
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'stretch',
      }}
      onClick={onClose}
    >
      {/* Background Overlay (slight tint) */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(var(--bg-rgb), 0.9)', zIndex: -1 }} />

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 24, right: 28, zIndex: 10,
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: 8, transition: 'color 0.2s',
        }}
      >
        <X size={24} />
      </button>

      {/* Navigation - Prev */}
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); go(-1); }}
          style={{
            position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'var(--bg-surface)', border: '1.5px solid var(--border-color)',
            padding: '16px 12px', color: 'var(--text)', cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Navigation - Next */}
      {index < items.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); go(1); }}
          style={{
            position: 'absolute', right: 400, top: '50%', transform: 'translateY(-50%)',
            background: 'var(--bg-surface)', border: '1.5px solid var(--border-color)',
            padding: '16px 12px', color: 'var(--text)', cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Media Viewport */}
      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
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
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain', 
              display: 'block', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
              border: '1px solid var(--border-color)'
            }}
          />
        </AnimatePresence>
      </div>

      {/* Info Sidebar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 360, flexShrink: 0,
          borderLeft: '1.5px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column',
          padding: '80px 32px 40px',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Category */}
        {displayCategory && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24, fontWeight: 700 }}>
            // {displayCategory}
          </p>
        )}

        {/* Title Block — only shown when a title exists or owner is editing */}
        {(displayTitle || editingTitle || isOwner) && (
          <div style={{ marginBottom: 24 }}>
            {editingTitle ? (
              <input
                ref={titleRef}
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                style={{
                  fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900,
                  textTransform: 'uppercase', color: 'var(--text)',
                  background: 'var(--bg)', border: '1.5px solid var(--color-yellow)',
                  padding: '12px', width: '100%', outline: 'none', lineHeight: 1,
                }}
                placeholder="ENTRY_TITLE"
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditingTitle(false); }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {displayTitle ? (
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900,
                      textTransform: 'uppercase', color: 'var(--text)',
                      margin: 0, lineHeight: 0.9, letterSpacing: '-0.02em',
                      cursor: isOwner ? 'pointer' : 'default',
                    }}
                    onClick={isOwner ? startEditTitle : undefined}
                  >
                    {displayTitle}
                  </h2>
                ) : isOwner ? (
                  <span
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', cursor: 'pointer', letterSpacing: '0.08em' }}
                    onClick={startEditTitle}
                  >
                    + ADD TITLE
                  </span>
                ) : null}
                {isOwner && displayTitle && (
                  <button onClick={startEditTitle} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '4px 0' }}>
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Artist Creds */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 24, height: 24, background: 'var(--color-yellow)', color: 'var(--color-ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
            {artistName[0].toUpperCase()}
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {artistName}
          </p>
        </div>

        {/* Description Block */}
        <div style={{ marginBottom: 40, flex: 1 }}>
          {editingDesc ? (
            <textarea
              ref={descRef}
              value={draftDesc}
              onChange={e => setDraftDesc(e.target.value)}
              rows={8}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)',
                background: 'var(--bg)', border: '1.5px solid var(--color-yellow)',
                padding: '12px', width: '100%', outline: 'none',
                resize: 'none', lineHeight: 1.6,
              }}
              placeholder="Entry description and technical notes..."
              onKeyDown={e => { if (e.key === 'Escape') setEditingDesc(false); }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <p
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: displayDesc ? 'var(--text-muted)' : 'var(--text-faint)',
                  margin: 0, lineHeight: 1.7, flex: 1,
                  cursor: isOwner ? 'pointer' : 'default',
                }}
                onClick={isOwner ? startEditDesc : undefined}
              >
                {displayDesc || (isOwner ? 'Click to add description...' : '')}
              </p>
              {isOwner && (
                <button onClick={startEditDesc} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 2 }}>
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
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '16px',
                background: isDirty ? 'var(--color-yellow)' : 'var(--bg-raised)',
                border: 'none',
                color: isDirty ? 'var(--color-ink)' : 'var(--text-faint)',
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.1em', 
                cursor: isDirty ? 'pointer' : 'default',
                marginBottom: 24, transition: 'all 0.2s',
              }}
            >
              {saving ? <Loader size={16} className="spin" /> : <Check size={16} />} 
              <span style={{ marginLeft: 8 }}>{saving ? 'Saving…' : 'Commit Changes'}</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Project Footer Meta */}
        {pc && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 32, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pc.format && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>// FORMAT</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{pc.format.toUpperCase()}</span>
              </div>
            )}
            {pc.location && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>// LOC</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{pc.location.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Index */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--text)', opacity: 0.05, position: 'absolute', bottom: 20, right: 32, pointerEvents: 'none' }}>
          {index + 1}/{items.length}
        </div>
      </div>
    </motion.div>
  );
}
