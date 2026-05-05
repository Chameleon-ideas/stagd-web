'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Search, Send, Plus, MoreVertical, Paperclip, ChevronLeft } from 'lucide-react';
import styles from './page.module.css';

// Mock Data for Messages
const MOCK_CHATS = [
  { 
    id: 'mairaj_ulhaq', 
    user: { full_name: 'Mairaj Ulhaq', avatar_url: '/images/mairaj_ulhaq.png', status: 'online' }, 
    lastMessage: '// NEW COMMISSION ENQUIRY', 
    time: 'JUST NOW', 
    unread: 1,
    online: true,
    avatar: '/images/mairaj_ulhaq.png',
    name: 'Mairaj Ulhaq',
    messages: [
      { id: 'm1', text: 'Hey — saw your work on the Sufi cover series. Editorial?', time: '12:46 PM', sent: true },
      { id: 'm2', text: 'I need a high-end product shoot for a new luxury perfume. Looking for that cinematic style.', time: '12:45 PM', sent: false }
    ]
  },
  { 
    id: 'osman_malik', 
    user: { full_name: 'Osman Malik', avatar_url: '/images/osman_portrait.png', status: 'online' }, 
    lastMessage: 'The new track is ready for review.', 
    time: '5 MIN AGO', 
    unread: 0,
    online: true,
    avatar: '/images/osman_portrait.png',
    name: 'Osman Malik',
    messages: [
      { id: 'o1', text: 'Hey — saw your project brief for the Sonic Architecture series.', time: '12:46 PM', sent: true },
      { id: 'o2', text: 'I have some initial soundscapes that might fit the visual direction.', time: '12:45 PM', sent: false }
    ]
  },
  { 
    id: 'hamza_qureshi', 
    user: { full_name: 'Hamza Qureshi', avatar_url: '/images/hamza_portrait.png', status: 'online' }, 
    lastMessage: 'The brief looks great, let\'s talk.', 
    time: '12:45 PM', 
    unread: 2,
    online: true,
    avatar: '/images/hamza_portrait.png',
    name: 'Hamza Qureshi',
    messages: [
      { id: 'h1', text: 'The brief looks great, let\'s talk about the calligraphy mural.', time: '12:45 PM', sent: false }
    ]
  },
  { 
    id: 'bilal_ahmed', 
    user: { full_name: 'Bilal Ahmed', avatar_url: '/images/bilal_portrait.png', status: 'offline' }, 
    lastMessage: 'I can start the mural next week.', 
    time: 'YESTERDAY', 
    unread: 0,
    online: false,
    avatar: '/images/bilal_portrait.png',
    name: 'Bilal Ahmed',
    messages: [
      { id: 'b1', text: 'I can start the mural next week. Just need the wall measurements.', time: 'YESTERDAY', sent: false }
    ]
  },
];

function MessagesContent() {
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipient');
  const [activeChatId, setActiveChatId] = useState<string | null>(recipientId);
  const [isMobile, setIsMobile] = useState(false);

  // Default to first chat on desktop if none selected
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    if (window.innerWidth > 768 && !activeChatId && !recipientId) {
      setActiveChatId('mairaj_ulhaq');
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [recipientId]);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<Record<string, any[]>>(() => {
    const initial: Record<string, any[]> = {};
    MOCK_CHATS.forEach(chat => {
      initial[chat.id] = [...chat.messages];
    });
    return initial;
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChatData = MOCK_CHATS.find(c => c.id === activeChatId);
  const activeMessages = activeChatId ? conversations[activeChatId] : [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, activeChatId]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChatId) return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sent: true
    };

    setConversations(prev => ({
      ...prev,
      [activeChatId]: [...prev[activeChatId], newMessage]
    }));
    
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <main className={`${styles.main} ${activeChatId ? styles.hasActiveChat : ''}`}>
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
              className={`${styles.chatItem} ${activeChatId === chat.id ? styles.activeItem : ''}`}
              onClick={() => setActiveChatId(chat.id)}
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
                  <p className={styles.itemPreview}>
                    {conversations[chat.id]?.[conversations[chat.id].length - 1]?.text || chat.lastMessage}
                  </p>
                  {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RIGHT PANEL: CHAT THREAD ────────────────────── */}
      <section className={`${styles.chatThread} ${activeChatId ? styles.activeThread : ''}`}>
        {activeChatData ? (
          <>
            <header className={styles.threadHeader}>
              <div className={styles.headerInfo}>
                <button 
                  className={styles.mobileBackBtn} 
                  onClick={() => setActiveChatId(null)}
                  aria-label="Back to inbox"
                >
                  <ChevronLeft size={24} />
                </button>
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
              <div className={styles.dateSeparator}><span>// MAY 03, 2026</span></div>

              {activeMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={msg.sent ? styles.messageSent : styles.messageReceived}
                >
                  {msg.isBrief && (
                    <div className={styles.briefCard}>
                      <div className={styles.briefHeader}>
                        <span className={styles.briefLabel}>// PROPOSAL</span>
                        <span className={styles.briefTo}>TO MAIRAJ</span>
                      </div>
                      <h3 className={styles.briefTitle}>FRAGRANCE COMMERCIAL SHOOT</h3>
                      <p className={styles.briefText}>{msg.text}</p>
                      <div className={styles.briefFooter}>
                        <div className={styles.briefStat}>
                          <span>DISCIPLINE</span>
                          <span>MARKETING CONTENT</span>
                        </div>
                        <div className={styles.briefStat}>
                          <span>EST. BUDGET</span>
                          <span>PKR 75,000</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {!msg.isBrief && (
                    <div className={styles.messageBubble}>
                      {msg.text}
                    </div>
                  )}
                  <span className={styles.timestamp}>{msg.time}</span>
                </div>
              ))}
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
                  onKeyDown={handleKeyPress}
                />
                <button 
                  className={styles.sendBtn}
                  onClick={handleSendMessage}
                >
                  <Send size={20} />
                </button>
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

import { WorkstationLayout } from '@/components/layout/WorkstationLayout';

export default function MessagesPage() {
  return (
    <WorkstationLayout>
      <Suspense fallback={
        <main className={styles.main}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontStyle: 'italic', color: '#aaa' }}>
            Loading conversations...
          </div>
        </main>
      }>
        <MessagesContent />
      </Suspense>
    </WorkstationLayout>
  );
}
