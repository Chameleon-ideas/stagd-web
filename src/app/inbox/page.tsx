'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './inbox.module.css';

const MOCK_CHATS = [
  { id: '1', name: 'Lyari Underground', lastMessage: 'The proposal looks great, Zia.', time: '2h ago', avatar: '/images/lyari.png', unread: true },
  { id: '2', name: 'Risograph Karachi', lastMessage: 'When can you pick up the prints?', time: 'Yesterday', avatar: '/images/riso.png', unread: false },
  { id: '3', name: 'The Last Exit', lastMessage: 'Sent you the mural sketches!', time: '2 days ago', avatar: '/images/lahore_street_art.png', unread: false },
];

const MOCK_MESSAGES = [
  { id: 'm1', sender: 'other', text: 'Hey Zia! I saw your inquiry about the mural.', time: '10:00 AM' },
  { id: 'm2', sender: 'me', text: 'Hey! Yes, would love to get a quote for a small project.', time: '10:05 AM' },
  { id: 'm3', sender: 'other', text: 'The proposal looks great, Zia. Let me know if you want to proceed.', time: '12:30 PM' },
];

export default function InboxPage() {
  const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
  const [message, setMessage] = useState('');

  return (
    <>
      <Header />
      <main className={styles.inboxPage}>
        <div className={`container-fluid ${styles.inboxContainer}`}>
          
          {/* ─── LEFT PANEL: Chat List ─────────────────────── */}
          <div className={styles.chatList}>
            <div className={styles.panelHeader}>
              <h1>Messages</h1>
              <span className="chip chip-accent">3</span>
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
                  {chat.unread && <div className={styles.unreadDot} />}
                </button>
              ))}
            </div>
          </div>

          {/* ─── RIGHT PANEL: Chat Thread ──────────────────── */}
          <div className={styles.chatThread}>
            <div className={styles.threadHeader}>
              <div className={styles.threadInfo}>
                <img src={selectedChat.avatar} alt={selectedChat.name} className={styles.avatarSm} />
                <div>
                  <h2>{selectedChat.name}</h2>
                  <span className={styles.status}>Online</span>
                </div>
              </div>
              <div className={styles.threadActions}>
                <button className="btn btn-secondary btn-sm">View Profile</button>
              </div>
            </div>

            <div className={styles.messages}>
              {MOCK_MESSAGES.map(msg => (
                <div key={msg.id} className={`${styles.message} ${msg.sender === 'me' ? styles.messageMe : styles.messageOther}`}>
                  <div className={styles.messageContent}>
                    <p>{msg.text}</p>
                    <span className={styles.messageTime}>{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.inputArea}>
              <form className={styles.messageForm} onSubmit={(e) => { e.preventDefault(); setMessage(''); }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={styles.messageInput}
                />
                <button type="submit" className="btn btn-accent btn-md">Send</button>
              </form>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
