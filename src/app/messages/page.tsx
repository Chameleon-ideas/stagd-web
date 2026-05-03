'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import Image from 'next/image';
import { Search, Send, Plus, MoreVertical, Paperclip } from 'lucide-react';
import styles from './page.module.css';

// Mock Data for Messages
const MOCK_CHATS = [
  { id: '1', user: { full_name: 'Lyari Underground', avatar_url: '/images/lyari.png', status: 'online' }, lastMessage: 'The brief looks great, let\'s talk details.', time: '12:45 PM', unread: 2 },
  { id: '2', user: { full_name: 'Risograph Karachi', avatar_url: '/images/riso.png', status: 'offline' }, lastMessage: 'Sure, I can have the prints ready by Friday.', time: 'Yesterday', unread: 0 },
  { id: 'mairaj_ulhaq', user: { full_name: 'Mairaj Ulhaq', avatar_url: '/images/mairaj/profile.jpg', status: 'online' }, lastMessage: 'New Commission Enquiry', time: 'Just now', unread: 1 },
];

function MessagesContent() {
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipient');
  const [activeChat, setActiveChat] = useState<string | null>(recipientId || '1');
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat]);

  const activeChatData = MOCK_CHATS.find(c => c.id === activeChat);

  return (
    <main className={styles.main}>
      {/* ── LEFT PANEL: CHAT LIST ───────────────────────── */}
      <section className={styles.chatList}>
        <div className={styles.listHeader}>
          <h1 className={styles.title}>INBOX</h1>
          <button className={styles.iconBtn}><Plus size={20} /></button>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input type="text" placeholder="Search conversations..." className={styles.searchInput} />
        </div>

        <div className={styles.listContent}>
          {MOCK_CHATS.map(chat => (
            <div 
              key={chat.id} 
              className={`${styles.chatItem} ${activeChat === chat.id ? styles.activeItem : ''}`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className={styles.avatarWrapper}>
                <Image src={chat.user.avatar_url} alt={chat.user.full_name} width={48} height={48} className={styles.avatar} />
                {chat.user.status === 'online' && <span className={styles.onlineDot} />}
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemTop}>
                  <span className={styles.itemName}>{chat.user.full_name}</span>
                  <span className={styles.itemTime}>{chat.time}</span>
                </div>
                <div className={styles.itemBottom}>
                  <p className={styles.itemPreview}>{chat.lastMessage}</p>
                  {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RIGHT PANEL: CHAT THREAD ────────────────────── */}
      <section className={styles.chatThread}>
        {activeChatData ? (
          <>
            <header className={styles.threadHeader}>
              <div className={styles.headerInfo}>
                <Image src={activeChatData.user.avatar_url} alt={activeChatData.user.full_name} width={40} height={40} className={styles.avatar} />
                <div className={styles.headerText}>
                  <span className={styles.headerName}>{activeChatData.user.full_name}</span>
                  <span className={styles.headerStatus}>{activeChatData.user.status.toUpperCase()}</span>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.iconBtn}><MoreVertical size={20} /></button>
              </div>
            </header>

            <div className={styles.messagesContainer} ref={scrollRef}>
              <div className={styles.dateSeparator}><span>MAY 03, 2026</span></div>

              {/* Example Commission Brief Message */}
              <div className={styles.messageReceived}>
                <div className={styles.briefCard}>
                  <span className={styles.briefLabel}>COMMISSION BRIEF</span>
                  <h3 className={styles.briefTitle}>Fragrance Commercial Shoot</h3>
                  <p className={styles.briefText}>I need a high-end product shoot for a new luxury perfume. Looking for that cinematic, liquid-texture style you specialize in.</p>
                  <div className={styles.briefMeta}>
                    <span>BUDGET: PKR 75,000</span>
                    <span>DEADLINE: JUN 15</span>
                  </div>
                </div>
                <span className={styles.timestamp}>12:45 PM</span>
              </div>

              <div className={styles.messageSent}>
                <div className={styles.messageBubble}>
                  The brief looks great, let's talk details. Do you have a moodboard yet?
                </div>
                <span className={styles.timestamp}>12:46 PM</span>
              </div>
            </div>

            <footer className={styles.chatInput}>
              <div className={styles.inputWrapper}>
                <button className={styles.attachBtn}><Paperclip size={20} /></button>
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className={styles.textInput}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <button className={styles.sendBtn}><Send size={20} /></button>
              </div>
            </footer>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <div className={styles.page}>
      <Header />
      <Suspense fallback={
        <main className={styles.main}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100vh', fontStyle: 'italic', color: '#aaa' }}>
            Loading conversations...
          </div>
        </main>
      }>
        <MessagesContent />
      </Suspense>
    </div>
  );
}
