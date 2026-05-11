'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Search, Send, Plus, MoreVertical, Paperclip, ChevronLeft,
  X, PanelRight, Music, Film, User, Flag, Trash2, Star,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  getConversations, getMessages, sendMessage, uploadMessageAttachment,
  hideConversation, getCommissionDetails, getProposalsForCommission,
  sendProposal, acceptProposal, declineProposal,
  updatePaymentStatus, updateCommissionStatus,
  requestCompletion, confirmCompletion, rejectCompletion,
  sendInvoice, submitCommissionReview, submitReport,
  type Conversation, type Message,
} from '@/lib/api';
import type { CommissionDetails, Proposal, PaymentStatus } from '@/lib/types';
import { setViewingConv } from '@/lib/viewState';
import { BriefCard } from '@/components/commissions/BriefCard';
import { ProposalCard } from '@/components/commissions/ProposalCard';
import { ProposalForm, type ProposalFormData } from '@/components/commissions/ProposalForm';
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

  // ── Conversation list ────────────────────────────────────
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

  // ── Commission flow state ────────────────────────────────
  const [commissionDetails, setCommissionDetails] = useState<CommissionDetails | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineProposalId, setDeclineProposalId] = useState<string | null>(null);
  const [declineMessage, setDeclineMessage] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showInvoiceSent, setShowInvoiceSent] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const notifyChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadMenuRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const activeConvIdRef = useRef<string | null>(null);

  // ── Derived state ────────────────────────────────────────
  const activeConv = conversations.find(c => c.commissionId === activeConvId);
  const isCreative = !!(user && activeConv && activeConv.artistId === user.id);
  const isClient = !!(user && activeConv && activeConv.clientId === user.id);

  const activeProposal = proposals.filter(p => p.status !== 'superseded').slice(-1)[0] ?? null;
  const pinnedCard = activeProposal?.status === 'accepted' ? 'proposal' : 'brief';

  const isReviewUnlocked =
    commissionDetails?.status === 'completed' &&
    commissionDetails?.payment_status === 'fully_paid';

  const completionRequestedByOther =
    commissionDetails?.completion_requested_by !== null &&
    commissionDetails?.completion_requested_by !== undefined &&
    commissionDetails?.completion_requested_by !== user?.id;

  // ── Load conversations ───────────────────────────────────
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

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
    setViewingConv(activeConvId);
  }, [activeConvId]);

  // ── Load messages + commission details on thread open ────
  useEffect(() => {
    if (!activeConvId) {
      setCommissionDetails(null);
      setProposals([]);
      return;
    }
    getMessages(activeConvId).then(setMessages);
    getCommissionDetails(activeConvId).then(d => {
      if (d) setCommissionDetails(d);
    });
    getProposalsForCommission(activeConvId).then(setProposals);
    setPreviewAsset(null);
  }, [activeConvId]);

  // ── Realtime: new messages ───────────────────────────────
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

  // ── Realtime: commission status changes ──────────────────
  useEffect(() => {
    if (!activeConvId) return;
    const ch = supabase
      .channel(`commission:${activeConvId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'commissions', filter: `id=eq.${activeConvId}` }, (payload) => {
        setCommissionDetails(prev => prev ? { ...prev, ...payload.new as Partial<CommissionDetails> } : null);
        setConversations(prev => prev.map(c => c.commissionId === activeConvId
          ? { ...c, status: (payload.new as any).status, paymentStatus: (payload.new as any).payment_status ?? c.paymentStatus }
          : c
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeConvId]);

  // ── Mobile, autoscroll, close menus ─────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeConvId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (threadMenuRef.current && !threadMenuRef.current.contains(e.target as Node)) {
        setShowThreadMenu(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── File handling ────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { alert('Unsupported type.'); return; }
    if (file.size > MAX_SIZE) { alert('File exceeds 20MB limit.'); return; }
    setPendingFile(file);
    e.target.value = '';
  };

  // ── Send regular message ─────────────────────────────────
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
      const outgoing: Message = {
        id: `opt-${Date.now()}`,
        body: text, type: 'text', sender_id: user.id,
        created_at: new Date().toISOString(),
        attachment_url: attachment?.url ?? null,
        attachment_type: attachment?.type ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_size: attachment?.size ?? null,
      };
      const chans = notifyChannelRef.current as unknown as { headerCh: any; inboxCh: any } | null;
      const payload = { commission_id: activeConvId, message: outgoing };
      chans?.headerCh?.send({ type: 'broadcast', event: 'new_message', payload });
      chans?.inboxCh?.send({ type: 'broadcast', event: 'new_message', payload });
      setMessages(prev => [...prev, outgoing]);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
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

  // ── Proposal flow ────────────────────────────────────────
  const handleSendProposal = useCallback(async (data: ProposalFormData) => {
    if (!activeConvId || !user) throw new Error('Not authenticated');
    const { proposalId, error } = await sendProposal(activeConvId, user.id, data);
    if (error) throw new Error(error);
    // Refresh proposals and messages
    const [newProposals, newMessages] = await Promise.all([
      getProposalsForCommission(activeConvId),
      getMessages(activeConvId),
    ]);
    setProposals(newProposals);
    setMessages(newMessages);
    // Update conversation status in list
    if (commissionDetails?.status === 'enquiry') {
      setConversations(prev => prev.map(c =>
        c.commissionId === activeConvId ? { ...c, status: 'in_discussion' } : c
      ));
      setCommissionDetails(prev => prev ? { ...prev, status: 'in_discussion' } : null);
    }
  }, [activeConvId, user, commissionDetails]);

  const handleAcceptProposal = useCallback(async (proposalId: string) => {
    if (!activeConvId) return;
    const { error } = await acceptProposal(activeConvId, proposalId);
    if (error) { alert(error); return; }
    const [newProposals, newMessages, newDetails] = await Promise.all([
      getProposalsForCommission(activeConvId),
      getMessages(activeConvId),
      getCommissionDetails(activeConvId),
    ]);
    setProposals(newProposals);
    setMessages(newMessages);
    if (newDetails) setCommissionDetails(newDetails);
    setConversations(prev => prev.map(c =>
      c.commissionId === activeConvId ? { ...c, status: 'in_progress' } : c
    ));
  }, [activeConvId]);

  const openDeclineModal = (proposalId: string) => {
    setDeclineProposalId(proposalId);
    setDeclineMessage('');
    setShowDeclineModal(true);
  };

  const handleDeclineProposal = async () => {
    if (!activeConvId || !declineProposalId || !user) return;
    await declineProposal(activeConvId, declineProposalId);
    // Send the explanation as a regular message if provided
    if (declineMessage.trim()) {
      await sendMessage(activeConvId, user.id, declineMessage.trim());
    }
    const [newProposals, newMessages] = await Promise.all([
      getProposalsForCommission(activeConvId),
      getMessages(activeConvId),
    ]);
    setProposals(newProposals);
    setMessages(newMessages);
    setShowDeclineModal(false);
    setDeclineProposalId(null);
    setDeclineMessage('');
  };

  const handleUpdatePayment = useCallback(async (status: 'partially_paid' | 'fully_paid') => {
    if (!activeConvId) return;
    const { error } = await updatePaymentStatus(activeConvId, status);
    if (error) { alert(error); return; }
    const [newMessages, newDetails] = await Promise.all([
      getMessages(activeConvId),
      getCommissionDetails(activeConvId),
    ]);
    setMessages(newMessages);
    if (newDetails) setCommissionDetails(newDetails);
    setConversations(prev => prev.map(c =>
      c.commissionId === activeConvId ? { ...c, paymentStatus: status } : c
    ));
  }, [activeConvId]);

  const handleUpdateStatus = async (newStatus: 'delivered') => {
    if (!activeConvId) return;
    setShowStatusMenu(false);
    const { error } = await updateCommissionStatus(activeConvId, newStatus);
    if (error) { alert(error); return; }
    const [newMessages, newDetails] = await Promise.all([
      getMessages(activeConvId),
      getCommissionDetails(activeConvId),
    ]);
    setMessages(newMessages);
    if (newDetails) setCommissionDetails(newDetails);
    setConversations(prev => prev.map(c =>
      c.commissionId === activeConvId ? { ...c, status: newStatus } : c
    ));
  };

  const handleRequestCompletion = async () => {
    if (!activeConvId) return;
    setShowStatusMenu(false);
    const { error } = await requestCompletion(activeConvId);
    if (error) { alert(error); return; }
    const [newMessages, newDetails] = await Promise.all([
      getMessages(activeConvId),
      getCommissionDetails(activeConvId),
    ]);
    setMessages(newMessages);
    if (newDetails) setCommissionDetails(newDetails);
  };

  const handleConfirmCompletion = async () => {
    if (!activeConvId) return;
    const { error } = await confirmCompletion(activeConvId);
    if (error) { alert(error); return; }
    const [newMessages, newDetails] = await Promise.all([
      getMessages(activeConvId),
      getCommissionDetails(activeConvId),
    ]);
    setMessages(newMessages);
    if (newDetails) setCommissionDetails(newDetails);
    setConversations(prev => prev.map(c =>
      c.commissionId === activeConvId ? { ...c, status: 'completed' } : c
    ));
  };

  const handleRejectCompletion = async () => {
    if (!activeConvId) return;
    const { error } = await rejectCompletion(activeConvId);
    if (error) { alert(error); return; }
    const [newMessages, newDetails] = await Promise.all([
      getMessages(activeConvId),
      getCommissionDetails(activeConvId),
    ]);
    setMessages(newMessages);
    if (newDetails) setCommissionDetails(newDetails);
  };

  const handleSendInvoice = async () => {
    if (!activeConvId) return;
    setShowPlusMenu(false);
    const { invoiceNumber, error } = await sendInvoice(activeConvId);
    if (error) { alert(error); return; }
    const newMessages = await getMessages(activeConvId);
    setMessages(newMessages);
    setShowInvoiceSent(true);
    setTimeout(() => setShowInvoiceSent(false), 3000);
  };

  const handleSubmitReview = async () => {
    if (!activeConvId || !user || !activeConv || reviewRating === 0) return;
    const revieweeId = isCreative ? activeConv.clientId : activeConv.artistId;
    setReviewSubmitting(true);
    const { error } = await submitCommissionReview(activeConvId, revieweeId, reviewRating, reviewBody || undefined);
    setReviewSubmitting(false);
    if (error) { alert(error); return; }
    setReviewDone(true);
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
    try {
      const { error } = await submitReport(
        activeConv.otherParty.id,
        activeConvId,
        reportReason.trim(),
      );
      if (error) throw new Error(error);
      setShowReportModal(false);
      setReportReason('');
      alert('Report submitted.');
    } catch {
      alert('Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const openPreview = (msg: Message) => { setPreviewAsset(msg); setShowPreviewPane(true); };

  // ── Render message ───────────────────────────────────────
  const renderMessage = (msg: Message) => {
    if (msg.type === 'proposal') {
      const proposal = proposals.find(p => p.id === msg.body);
      if (!proposal) return null;
      const isActive = proposal.status !== 'superseded';
      return (
        <ProposalCard
          key={msg.id}
          proposal={proposal}
          commission={commissionDetails!}
          isCreative={isCreative}
          isActive={isActive && pinnedCard === 'proposal'}
          paymentStatus={commissionDetails?.payment_status as PaymentStatus}
          onAccept={isClient && proposal.status === 'pending' ? () => handleAcceptProposal(proposal.id) : undefined}
          onDecline={isClient && proposal.status === 'pending' ? () => openDeclineModal(proposal.id) : undefined}
          onEdit={isCreative && proposal.status === 'pending' ? () => { setEditingProposal(proposal); setShowProposalForm(true); } : undefined}
          onUpdatePayment={isCreative && proposal.status === 'accepted' ? handleUpdatePayment : undefined}
        />
      );
    }

    if (msg.type === 'status_update' || msg.type === 'payment_confirmation') {
      return (
        <div key={msg.id} className={styles.systemMessage}>
          <span className={styles.systemText}>{msg.body}</span>
          <span className={styles.systemTime}>{formatTime(msg.created_at)}</span>
        </div>
      );
    }

    const isMine = msg.sender_id === user?.id;
    return (
      <div key={msg.id} className={isMine ? styles.messageSent : styles.messageReceived}>
        {msg.attachment_url ? (
          <AttachmentBubble msg={msg} onClick={() => openPreview(msg)} />
        ) : (
          <div className={styles.messageBubble}>{msg.body}</div>
        )}
        <span className={styles.timestamp}>{formatTime(msg.created_at)}</span>
      </div>
    );
  };

  // ── Plus menu options ────────────────────────────────────
  const canMarkDelivered = isCreative && commissionDetails?.status === 'in_progress';
  const canRequestComplete = commissionDetails?.status === 'delivered' &&
    !commissionDetails?.completion_requested_by;
  const canSendInvoice = isCreative && (
    commissionDetails?.status === 'in_progress' ||
    commissionDetails?.status === 'delivered' ||
    commissionDetails?.status === 'completed'
  ) && activeProposal?.status === 'accepted';

  return (
    <>
      <main className={`${styles.main} ${activeConvId ? styles.hasActiveChat : ''}`}>

        {/* ── LEFT: CHAT LIST ─────────────────────── */}
        <section className={styles.chatList}>
          <div className={styles.listHeader}>
            <h1 className={styles.title}>MESSAGES</h1>
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
                    <span className={styles.statusTag}>{conv.status.replace('_', ' ').toUpperCase()}</span>
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
              {/* Thread header */}
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
                    <div className={styles.headerMeta}>
                      <span className={styles.headerStatus}>{activeConv.status.replace('_', ' ').toUpperCase()}</span>
                      {activeConv.paymentStatus && activeConv.paymentStatus !== 'unpaid' && (
                        <span className={`${styles.payTag} ${styles[`pay_${activeConv.paymentStatus}`]}`}>
                          {activeConv.paymentStatus === 'fully_paid' ? 'PAID' : 'PARTIAL'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.headerActions}>
                  <div className={styles.threadMenuWrap} ref={threadMenuRef}>
                    <button className={styles.iconBtn} onClick={() => setShowThreadMenu(v => !v)} aria-label="More options">
                      <MoreVertical size={20} />
                    </button>
                    {showThreadMenu && (
                      <div className={styles.threadMenu}>
                        <button className={`${styles.threadMenuItem} ${styles.threadMenuDanger}`} onClick={() => { setShowThreadMenu(false); setShowDeleteConfirm(true); }}>
                          <Trash2 size={14} /><span>Delete Thread</span>
                        </button>
                        <button className={styles.threadMenuItem} onClick={() => { setShowThreadMenu(false); setShowReportModal(true); }}>
                          <Flag size={14} /><span>Report User</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className={`${styles.iconBtn} ${showPreviewPane ? styles.iconBtnActive : ''}`}
                    onClick={() => setShowPreviewPane(v => !v)}
                    aria-label="Toggle preview pane"
                  >
                    <PanelRight size={18} />
                  </button>
                </div>
              </header>

              {/* ── PINNED CARD ── */}
              <div className={styles.pinnedArea}>
                {commissionDetails ? (
                  pinnedCard === 'proposal' && activeProposal ? (
                    <ProposalCard
                      proposal={activeProposal}
                      commission={commissionDetails}
                      isCreative={isCreative}
                      isActive={true}
                      paymentStatus={commissionDetails.payment_status as PaymentStatus}
                      onUpdatePayment={isCreative ? handleUpdatePayment : undefined}
                    />
                  ) : (
                    <BriefCard commission={commissionDetails} />
                  )
                ) : (
                  <div className={styles.pinnedLoading}>Loading brief...</div>
                )}

                {/* Completion confirmation banner */}
                {completionRequestedByOther && (
                  <div className={styles.completionBanner}>
                    <p className={styles.completionBannerText}>
                      {activeConv.otherParty.full_name} has marked this project as complete.
                    </p>
                    <div className={styles.completionBannerActions}>
                      <button className={styles.btnConfirmCompletion} onClick={handleConfirmCompletion}>
                        Confirm Completion
                      </button>
                      <button className={styles.btnNotYet} onClick={handleRejectCompletion}>
                        Not yet
                      </button>
                    </div>
                  </div>
                )}

                {/* Review prompt */}
                {isReviewUnlocked && !reviewDone && (
                  <div className={styles.reviewPrompt}>
                    <p className={styles.reviewPromptLabel}>// PROJECT COMPLETE</p>
                    {!showReviewForm ? (
                      <button className={styles.btnLeaveReview} onClick={() => setShowReviewForm(true)}>
                        Leave a Review for {activeConv.otherParty.full_name}
                      </button>
                    ) : (
                      <div className={styles.reviewForm}>
                        <div className={styles.starRow}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} className={styles.starBtn} onClick={() => setReviewRating(s)}>
                              <Star size={20} fill={s <= reviewRating ? 'var(--color-yellow)' : 'none'} color={s <= reviewRating ? 'var(--color-yellow)' : 'var(--text-faint)'} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          className={styles.reviewTextarea}
                          placeholder="A short review (150 chars max)"
                          maxLength={150}
                          value={reviewBody}
                          onChange={e => setReviewBody(e.target.value)}
                          rows={2}
                        />
                        <div className={styles.reviewActions}>
                          <button className={styles.btnDismissReview} onClick={() => setShowReviewForm(false)}>
                            Later
                          </button>
                          <button
                            className={styles.btnSubmitReview}
                            onClick={handleSubmitReview}
                            disabled={reviewRating === 0 || reviewSubmitting}
                          >
                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isReviewUnlocked && reviewDone && (
                  <div className={styles.reviewDone}>
                    Review submitted.
                  </div>
                )}
              </div>

              {/* ── MESSAGES ── */}
              <div className={styles.messagesContainer} ref={scrollRef}>
                {messages.length === 0 && (
                  <div className={styles.emptyThread}>No messages yet. Say something.</div>
                )}
                {messages.map(msg => renderMessage(msg))}
              </div>

              {/* Pending file strip */}
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

              {showInvoiceSent && (
                <div className={styles.invoiceToast}>Invoice sent.</div>
              )}

              {/* ── INPUT BAR ── */}
              <footer className={styles.chatInput}>
                <div className={styles.inputWrapper}>
                  {/* Paperclip for attachments */}
                  <button className={styles.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Paperclip size={18} />
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

                  {/* + menu for creative */}
                  {isCreative && (
                    <div className={styles.plusMenuWrap} ref={plusMenuRef}>
                      <button
                        className={styles.plusBtn}
                        onClick={() => setShowPlusMenu(v => !v)}
                        aria-label="Actions"
                      >
                        <Plus size={18} />
                      </button>
                      {showPlusMenu && (
                        <div className={styles.plusMenu}>
                          <button
                            className={styles.plusMenuItem}
                            onClick={() => { setShowPlusMenu(false); setEditingProposal(null); setShowProposalForm(true); }}
                          >
                            Send Proposal
                          </button>
                          {canMarkDelivered && (
                            <button
                              className={styles.plusMenuItem}
                              onClick={() => handleUpdateStatus('delivered')}
                            >
                              Mark as Delivered
                            </button>
                          )}
                          {canRequestComplete && (
                            <button
                              className={styles.plusMenuItem}
                              onClick={handleRequestCompletion}
                            >
                              Request Completion
                            </button>
                          )}
                          {canSendInvoice && (
                            <button
                              className={styles.plusMenuItem}
                              onClick={handleSendInvoice}
                            >
                              Send Invoice
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client can also request completion if delivered */}
                  {isClient && canRequestComplete && (
                    <button
                      className={styles.completionBtn}
                      onClick={handleRequestCompletion}
                      title="Mark as Complete"
                    >
                      Mark Complete
                    </button>
                  )}

                  <button
                    className={styles.sendBtn}
                    onClick={handleSendMessage}
                    disabled={uploading || (!messageText.trim() && !pendingFile)}
                  >
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
              <div className={styles.previewEmpty}>Click an attachment to preview it here.</div>
            )}
          </aside>
        )}
      </main>

      {/* ── PROPOSAL FORM ────────────────────────── */}
      {showProposalForm && (
        <ProposalForm
          existingProposal={editingProposal}
          nextVersion={(proposals.filter(p => p.status !== 'superseded').length) + 1}
          onSubmit={handleSendProposal}
          onClose={() => { setShowProposalForm(false); setEditingProposal(null); }}
        />
      )}

      {/* ── DECLINE MODAL ────────────────────────── */}
      {showDeclineModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowDeclineModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>// DECLINE PROPOSAL</span>
              <button className={styles.iconBtn} onClick={() => setShowDeclineModal(false)}><X size={18} /></button>
            </div>
            <p className={styles.modalSub}>Would you like to explain what you'd like changed?</p>
            <textarea
              className={styles.reportInput}
              placeholder="Tell them what needs adjusting (optional)..."
              value={declineMessage}
              onChange={e => setDeclineMessage(e.target.value)}
              rows={3}
            />
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowDeclineModal(false)}>Back</button>
              <button className={styles.confirmDelete} onClick={handleDeclineProposal}>
                Decline{declineMessage.trim() ? ' & Send Message' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ───────────────────────── */}
      {showDeleteConfirm && (
        <div className={styles.modalBackdrop} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>// DELETE THREAD</span>
              <button className={styles.iconBtn} onClick={() => setShowDeleteConfirm(false)}><X size={18} /></button>
            </div>
            <p className={styles.modalSub}>This will permanently remove this conversation from your inbox. <strong>{activeConv?.otherParty.full_name}</strong> will not be notified.</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className={styles.confirmDelete} onClick={handleDeleteThread}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ─────────────────────────── */}
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
