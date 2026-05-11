'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Search, Send, Plus, MoreVertical, Paperclip, ChevronLeft,
  X, PanelRight, Music, Film, User, Flag, Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getConversations, getMessages, sendMessage, uploadMessageAttachment, hideConversation, type Conversation, type Message } from '@/lib/api';
import { setViewingConv } from '@/lib/viewState';
import styles from './page.module.css';

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/aac', 'audio/x-m4a',
  'video/mp4', 'video/quicktime', 'video/webm',
];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');
const MAX_SIZE = 20 * 1024 * 1024;

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 1) return 'JUST NOW';
  if (diffMins < 60) return `${diffMins} MIN AGO`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).toUpperCase();
  if (diffHours < 48) return 'YESTERDAY';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentBubble({ msg, onClick }: { msg: Message; onClick: () => void }) {
  const t = msg.attachment_type;
  return (
    <div className={styles.attachmentBubble} onClick={onClick}>
      {t === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={msg.attachment_url!} alt={msg.attachment_name ?? 'image'} className={styles.attachmentImg} />
      )}
      {t === 'audio' && (
        <div className={styles.attachmentAudioWrap}>
          <Music size={16} />
          <span className={styles.attachmentFileName}>{msg.attachment_name}</span>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={msg.attachment_url!} className={styles.attachmentAudio} onClick={e => e.stopPropagation()} />
        </div>
      )}
      {t === 'video' && (
        <div className={styles.attachmentVideoWrap}>
          <Film size={16} />
          <span className={styles.attachmentFileName}>{msg.attachment_name}</span>
          <span className={styles.attachmentMeta}>{formatBytes(msg.attachment_size ?? 0)}</span>
        </div>
      )}
      {msg.body && <p className={styles.attachmentCaption}>{msg.body}</p>}
    </div>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const recipientParam = searchParams.get('recipient') || searchParams.get('with');
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Message | null>(null);
  const [showPreviewPane, setShowPreviewPane] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const notifyChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadMenuRef = useRef<HTMLDivElement>(null);
  const activeConvIdRef = useRef<string | null>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    getConversations(user.id).then(convs => {
      setConversations(convs);
      setLoading(false);
      if (recipientParam) {
        const match = convs.find(c => c.otherParty.username === recipientParam);
        if (match) setActiveConvId(match.commissionId);
      } else if (window.innerWidth > 768 && convs.length > 0) {
        setActiveConvId(convs[0].commissionId);
      }
    });
  }, [user, recipientParam]);

  // Keep ref + global view state in sync
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
    setViewingConv(activeConvId);
  }, [activeConvId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    getMessages(activeConvId).then(setMessages);
    setPreviewAsset(null);
  }, [activeConvId]);

  // Subscribe to incoming broadcast messages (real-time from other user's send)
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notify-user-${user.id}-inbox`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const { commission_id, message } = (payload ?? {}) as { commission_id?: string; message?: Message };
        if (commission_id && commission_id === activeConvIdRef.current && message) {
          setMessages(prev => prev.find(m => m.id === message.id) ? prev : [...prev, message]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const activeConv = conversations.find(c => c.commissionId === activeConvId);

  // Maintain TWO outgoing broadcast channels for the recipient:
  // 1. notify-user-${id}        → recipient's header badge
  // 2. notify-user-${id}-inbox  → recipient's open thread (real-time message delivery)
  useEffect(() => {
    if (!activeConv || !user) return;
    const rid = activeConv.otherParty.id;
    const headerCh = supabase.channel(`notify-user-${rid}`).subscribe();
    const inboxCh = supabase.channel(`notify-user-${rid}-inbox`).subscribe();
    notifyChannelRef.current = { headerCh, inboxCh } as unknown as ReturnType<typeof supabase.channel>;
    return () => {
      supabase.removeChannel(headerCh);
      supabase.removeChannel(inboxCh);
      notifyChannelRef.current = null;
    };
  }, [activeConv?.commissionId, user]);

  // Realtime incoming messages
  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `commission_id=eq.${activeConvId}` }, (payload) => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeConvId]);

  // Close thread menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (threadMenuRef.current && !threadMenuRef.current.contains(e.target as Node)) {
        setShowThreadMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Unsupported type. Use images, audio, or video files.');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('File exceeds 20MB limit.');
      return;
    }
    setPendingFile(file);
    e.target.value = '';
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !pendingFile) return;
    if (!activeConvId || !user) return;

    const text = messageText;
    const file = pendingFile;
    setMessageText('');
    setPendingFile(null);

    try {
      let attachment: { url: string; type: string; name: string; size: number } | null = null;
      if (file) {
        setUploading(true);
        const url = await uploadMessageAttachment(file, user.id);
        const mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'video';
        attachment = { url, type: mediaType, name: file.name, size: file.size };
        setUploading(false);
      }

      await sendMessage(activeConvId, user.id, text, attachment);

      const outgoingMsg: Message = {
        id: `opt-${Date.now()}`,
        body: text,
        type: 'text',
        sender_id: user.id,
        created_at: new Date().toISOString(),
        attachment_url: attachment?.url ?? null,
        attachment_type: attachment?.type ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_size: attachment?.size ?? null,
      };

      // Broadcast: header badge (notify channel) + inline message (inbox channel)
      const chans = notifyChannelRef.current as unknown as { headerCh: ReturnType<typeof supabase.channel>; inboxCh: ReturnType<typeof supabase.channel> } | null;
      const broadcastPayload = { commission_id: activeConvId, message: outgoingMsg };
      chans?.headerCh?.send({ type: 'broadcast', event: 'new_message', payload: broadcastPayload });
      chans?.inboxCh?.send({ type: 'broadcast', event: 'new_message', payload: broadcastPayload });

      setMessages(prev => [...prev, outgoingMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err !== null && 'message' in err)
          ? String((err as { message: unknown }).message)
          : 'Upload failed. Please try again.';
      console.error('[send error]', err);
      alert(msg);
      setMessageText(text);
      setPendingFile(file);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleDeleteThread = async () => {
    if (!activeConvId || !user) return;
    await hideConversation(activeConvId, user.id);
    setConversations(prev => prev.filter(c => c.commissionId !== activeConvId));
    setActiveConvId(null);
    setMessages([]);
    setShowDeleteConfirm(false);
  };

  const handleReportSubmit = async () => {
    if (!activeConv || !user) return;
    setReportSubmitting(true);
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: activeConv.otherParty.id,
      commission_id: activeConvId,
      reason: reportReason.trim() || null,
    });
    setReportSubmitting(false);
    setShowReportModal(false);
    setReportReason('');
    alert('Report submitted. We\'ll review it shortly.');
  };

  const openPreview = (msg: Message) => {
    setPreviewAsset(msg);
    setShowPreviewPane(true);
  };

  return (
    <>
      <main className={`${styles.main} ${activeConvId ? styles.hasActiveChat : ''}`}>
        {/* ── LEFT: CHAT LIST ─────────────────────── */}
        <section className={styles.chatList}>
          <div className={styles.listHeader}>
            <h1 className={styles.title}>MESSAGES</h1>
            <button className={styles.iconBtn}><Plus size={20} /></button>
          </div>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="Search conversations..." className={styles.searchInput} />
          </div>
          <div className={styles.listContent}>
            {loading && <p className={styles.emptyLabel}>Loading...</p>}
            {!loading && conversations.length === 0 && <p className={styles.emptyLabel}>No conversations yet.</p>}
            {conversations.map(conv => (
              <div
                key={conv.commissionId}
                className={`${styles.chatItem} ${activeConvId === conv.commissionId ? styles.activeItem : ''}`}
                onClick={() => setActiveConvId(conv.commissionId)}
              >
                <div className={styles.avatarWrapper}>
                  {conv.otherParty.avatar_url ? (
                    <Image src={conv.otherParty.avatar_url} alt={conv.otherParty.full_name} width={48} height={48} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatar} style={{ background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={24} color="var(--text-faint)" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemName}>{conv.otherParty.full_name}</span>
                    <span className={styles.itemTime}>{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className={styles.itemBottom}>
                    <p className={styles.itemPreview}>{conv.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CENTER: CHAT THREAD ─────────────────── */}
        <section className={`${styles.chatThread} ${activeConvId ? styles.activeThread : ''}`}>
          {activeConv ? (
            <>
              <header className={styles.threadHeader}>
                <div className={styles.headerInfo}>
                  <button className={styles.mobileBackBtn} onClick={() => setActiveConvId(null)} aria-label="Back">
                    <ChevronLeft size={24} />
                  </button>
                  {activeConv.otherParty.avatar_url ? (
                    <Image src={activeConv.otherParty.avatar_url} alt={activeConv.otherParty.full_name} width={40} height={40} className={styles.headerAvatar} />
                  ) : (
                    <div className={styles.headerAvatar} style={{ background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="var(--text-faint)" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className={styles.headerText}>
                    <span className={styles.headerName}>{activeConv.otherParty.full_name}</span>
                    <span className={styles.headerStatus}>{activeConv.status.toUpperCase()}</span>
                  </div>
                </div>
                <div className={styles.headerActions}>
                  {/* 3-dot menu */}
                  <div className={styles.threadMenuWrap} ref={threadMenuRef}>
                    <button className={styles.iconBtn} onClick={() => setShowThreadMenu(v => !v)} aria-label="More options">
                      <MoreVertical size={20} />
                    </button>
                    {showThreadMenu && (
                      <div className={styles.threadMenu}>
                        <button className={`${styles.threadMenuItem} ${styles.threadMenuDanger}`} onClick={() => { setShowThreadMenu(false); setShowDeleteConfirm(true); }}>
                          <Trash2 size={14} />
                          <span>Delete Thread</span>
                        </button>
                        <button className={styles.threadMenuItem} onClick={() => { setShowThreadMenu(false); setShowReportModal(true); }}>
                          <Flag size={14} />
                          <span>Report User</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Preview pane toggle */}
                  <button
                    className={`${styles.iconBtn} ${showPreviewPane ? styles.iconBtnActive : ''}`}
                    onClick={() => setShowPreviewPane(v => !v)}
                    aria-label="Toggle preview pane"
                    title="Asset preview"
                  >
                    <PanelRight size={18} />
                  </button>
                </div>
              </header>

              <div className={styles.messagesContainer} ref={scrollRef}>
                {activeConv.briefWhat && (
                  <div className={styles.messageReceived}>
                    <div className={styles.briefCard}>
                      <div className={styles.briefHeader}>
                        <span className={styles.briefLabel}>// COMMISSION BRIEF</span>
                        <span className={styles.briefTo}>{activeConv.status.toUpperCase()}</span>
                      </div>
                      <p className={styles.briefText}>{activeConv.briefWhat}</p>
                    </div>
                  </div>
                )}
                {messages.length === 0 && !activeConv.briefWhat && (
                  <div className={styles.emptyThread}>No messages yet. Say something.</div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={msg.sender_id === user?.id ? styles.messageSent : styles.messageReceived}>
                    {msg.attachment_url ? (
                      <AttachmentBubble msg={msg} onClick={() => openPreview(msg)} />
                    ) : (
                      <div className={styles.messageBubble}>{msg.body}</div>
                    )}
                    <span className={styles.timestamp}>{formatTime(msg.created_at)}</span>
                  </div>
                ))}
              </div>

              {/* Pending file preview strip */}
              {pendingFile && (
                <div className={styles.pendingStrip}>
                  <div className={styles.pendingFile}>
                    {pendingFile.type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={URL.createObjectURL(pendingFile)} alt="preview" className={styles.pendingImg} />
                    ) : pendingFile.type.startsWith('audio/') ? (
                      <Music size={20} />
                    ) : (
                      <Film size={20} />
                    )}
                    <span className={styles.pendingName}>{pendingFile.name}</span>
                    <span className={styles.pendingSize}>{formatBytes(pendingFile.size)}</span>
                  </div>
                  <button className={styles.pendingRemove} onClick={() => setPendingFile(null)}>
                    <X size={16} />
                  </button>
                </div>
              )}

              <footer className={styles.chatInput}>
                <div className={styles.inputWrapper}>
                  <button className={styles.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Paperclip size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_ATTR}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <input
                    type="text"
                    placeholder={uploading ? 'Uploading…' : 'Type a message...'}
                    className={styles.textInput}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={uploading}
                  />
                  <button className={styles.sendBtn} onClick={handleSendMessage} disabled={uploading || (!messageText.trim() && !pendingFile)}>
                    <Send size={20} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>{user ? 'Select a conversation to start messaging' : 'Log in to view your messages'}</p>
            </div>
          )}
        </section>

        {/* ── RIGHT: PREVIEW PANE ─────────────────── */}
        {showPreviewPane && (
          <aside className={styles.previewPane}>
            <div className={styles.previewPaneHeader}>
              <span className={styles.previewPaneTitle}>// ASSET PREVIEW</span>
              <button className={styles.iconBtn} onClick={() => setShowPreviewPane(false)}>
                <X size={18} />
              </button>
            </div>
            {previewAsset ? (
              <div className={styles.previewContent}>
                {previewAsset.attachment_type === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewAsset.attachment_url!} alt={previewAsset.attachment_name ?? ''} className={styles.previewImg} />
                )}
                {previewAsset.attachment_type === 'audio' && (
                  <div className={styles.previewAudioWrap}>
                    <Music size={48} opacity={0.3} />
                    <p className={styles.previewFileName}>{previewAsset.attachment_name}</p>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio controls src={previewAsset.attachment_url!} className={styles.previewAudio} />
                  </div>
                )}
                {previewAsset.attachment_type === 'video' && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video controls src={previewAsset.attachment_url!} className={styles.previewVideo} />
                )}
                <div className={styles.previewMeta}>
                  <span>{previewAsset.attachment_name}</span>
                  {previewAsset.attachment_size && <span>{formatBytes(previewAsset.attachment_size)}</span>}
                  <span>{formatTime(previewAsset.created_at)}</span>
                </div>
                <a href={previewAsset.attachment_url!} download={previewAsset.attachment_name} target="_blank" rel="noreferrer" className={styles.previewDownload}>
                  Download
                </a>
              </div>
            ) : (
              <div className={styles.previewEmpty}>Click an attachment in the chat to preview it here.</div>
            )}
          </aside>
        )}
      </main>

      {/* ── DELETE CONFIRM ─────────────────────────── */}
      {showDeleteConfirm && (
        <div className={styles.modalBackdrop} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>// DELETE THREAD</span>
              <button className={styles.iconBtn} onClick={() => setShowDeleteConfirm(false)}><X size={18} /></button>
            </div>
            <p className={styles.modalSub}>This will permanently delete all messages with <strong>{activeConv?.otherParty.full_name}</strong>. This cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className={styles.confirmDelete} onClick={handleDeleteThread}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ───────────────────────────── */}
      {showReportModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowReportModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>// REPORT USER</span>
              <button className={styles.iconBtn} onClick={() => setShowReportModal(false)}><X size={18} /></button>
            </div>
            <p className={styles.modalSub}>Reporting <strong>{activeConv?.otherParty.full_name}</strong></p>
            <textarea
              className={styles.reportInput}
              placeholder="Describe the issue (optional)..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              rows={4}
            />
            <button className={styles.reportSubmit} onClick={handleReportSubmit} disabled={reportSubmitting}>
              {reportSubmitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

import { WorkstationLayout } from '@/components/layout/WorkstationLayout';

export default function MessagesPage() {
  return (
    <WorkstationLayout>
      <Suspense fallback={
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 'calc(100vh - 60px)', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', opacity: 0.4 }}>
          Loading conversations...
        </main>
      }>
        <MessagesContent />
      </Suspense>
    </WorkstationLayout>
  );
}
