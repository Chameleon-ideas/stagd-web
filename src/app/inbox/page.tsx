'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search, MoreVertical, Paperclip, Send } from 'lucide-react';
import styles from './inbox.module.css';

const MOCK_CHATS = [
  { id: 'mairaj_ulhaq', name: 'Mairaj Ulhaq', lastMessage: 'New Commission Enquiry', time: 'Just now', avatar: '/images/mairaj_ulhaq.png', unread: 1, status: 'Online' },
  { id: 'lyari_underground', name: 'Lyari Underground', lastMessage: 'The brief looks great, let\'s tal...', time: '12:45 PM', avatar: '/images/lyari.png', unread: 2, status: 'Online' },
  { id: 'risograph_khi', name: 'Risograph Karachi', lastMessage: 'Sure, I can have the prints ready ...', time: 'Yesterday', avatar: '/images/riso.png', unread: 0, status: 'Offline' },
];

const MOCK_MESSAGES: Record<string, any[]> = {
  mairaj_ulhaq: [
    { id: 'm1', sender: 'other', text: 'Hey — saw your work on the Sufi cover series. Editorial?', time: 'Tue 4:12 PM' },
    { id: 'm2', sender: 'me', text: 'Yes! Print + digital. 3 spot illos for a long read.', time: 'Tue 4:18 PM' },
    { id: 'm3', sender: 'other', text: 'Sounds great. Send me the brief and I\'ll lock the dates.', time: 'Tue 4:31 PM' },
    { 
      id: 'm4', 
      sender: 'me', 
      type: 'proposal',
      title: 'FRAGRANCE COMMERCIAL SHOOT',
      brief: 'I need a high-end product shoot for a new luxury perfume. Looking for that cinematic, liquid-texture style you specialize in.',
      details: {
        discipline: 'Marketing Content',
        deliverable: '6 product shots',
        deadline: 'Jun 15, 2026',
        duration: '1 week'
      },
      budget: 95000,
      status: 'pending',
      time: 'Just now'
    },
  ],
  lyari_underground: [
    { id: 'l1', sender: 'other', text: 'The brief looks great, let\'s talk about the timeline.', time: '12:45 PM' }
  ]
};

function ProposalCard({ proposal, onAccept, onRevise }: { proposal: any, onAccept?: () => void, onRevise?: () => void }) {
  return (
    <div className={styles.proposalCard}>
      <div className={styles.proposalHeader}>
        <span className={styles.proposalTag}>// PROPOSAL</span>
        <span className={styles.proposalTo}>TO MAIRAJ</span>
      </div>
      
      <h3 className={styles.proposalTitle}>{proposal.title}</h3>
      <p className={styles.proposalBrief}>{proposal.brief}</p>
      
      <div className={styles.proposalDetails}>
        <div className={styles.detailRow}>
          <span className={styles.detailKey}>Discipline</span>
          <span className={styles.detailVal}>{proposal.details.discipline}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailKey}>Deliverable</span>
          <span className={styles.detailVal}>{proposal.details.deliverable}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailKey}>Deadline</span>
          <span className={styles.detailVal}>{proposal.details.deadline}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailKey}>Duration</span>
          <span className={styles.detailVal}>{proposal.details.duration}</span>
        </div>
      </div>
      
      <div className={styles.proposalBudget}>
        <span className={styles.budgetCurrency}>PKR</span>
        <span className={styles.budgetAmount}>{proposal.budget.toLocaleString()}</span>
      </div>
      
      <div className={styles.proposalActions}>
        <button className={styles.actionBtn} onClick={onRevise}>Revise</button>
        <button className={`${styles.actionBtn} ${styles.btnAccept}`} onClick={onAccept}>Accept</button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const searchParams = useSearchParams();
  const withUser = searchParams.get('with');
  
  const [selectedChat, setSelectedChat] = useState(
    MOCK_CHATS.find(c => c.id === withUser) || MOCK_CHATS[0]
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (withUser) {
      const chat = MOCK_CHATS.find(c => c.id === withUser);
      if (chat) setSelectedChat(chat);
    }
  }, [withUser]);

  const messages = MOCK_MESSAGES[selectedChat.id] || [];

  return (
    <>
      <Header />
      <main className={styles.inboxPage}>
        <div className={styles.inboxContainer}>
          
          {/* ─── SIDEBAR ─────────────────────── */}
          <div className={styles.chatList}>
            <div className={styles.panelHeader}>
              <h1>Inbox</h1>
              <div className={styles.searchWrapper}>
                <input type="text" placeholder="Search conversations..." className={styles.searchInput} />
              </div>
            </div>
            
            <div className={styles.chatItems}>
              {MOCK_CHATS.map(chat => (
                <button
                  key={chat.id}
                  className={`${styles.chatItem} ${selectedChat.id === chat.id ? styles.chatItemActive : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <img src={chat.avatar} alt={chat.name} className={styles.avatar} />
                  <div className={styles.chatMeta}>
                    <div className={styles.chatTop}>
                      <span className={styles.chatName}>{chat.name}</span>
                      <span className={styles.chatTime}>{chat.time}</span>
                    </div>
                    <p className={styles.lastMessage}>{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ─── THREAD ──────────────────── */}
          <div className={styles.chatThread}>
            <div className={styles.threadHeader}>
              <div className={styles.threadInfo}>
                <img src={selectedChat.avatar} alt={selectedChat.name} className={styles.avatarSm} />
                <div>
                  <h2>{selectedChat.name}</h2>
                  <span className={styles.status}>{selectedChat.status}</span>
                </div>
              </div>
              <div className={styles.threadActions}>
                <button className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>View Profile</button>
              </div>
            </div>

            <div className={styles.messages}>
              <div className={styles.dateDivider}>
                <span>May 03, 2026</span>
              </div>

              {messages.map(msg => (
                <div key={msg.id} className={`${styles.message} ${msg.sender === 'me' ? styles.messageMe : styles.messageOther}`}>
                  {msg.type === 'proposal' ? (
                    <ProposalCard proposal={msg} />
                  ) : (
                    <>
                      <div className={styles.messageContent}>
                        <p>{msg.text}</p>
                      </div>
                      <span className={styles.messageTime}>{msg.time}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.inputArea}>
              <form className={styles.messageForm} onSubmit={(e) => { e.preventDefault(); setMessage(''); }}>
                <button type="button" className="btn btn-icon" style={{ padding: '0 12px' }}>
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={styles.messageInput}
                />
                <button type="submit" className="btn btn-accent btn-md" style={{ width: '100px' }}>Send</button>
              </form>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
