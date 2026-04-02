import { useState, useEffect } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, ArrowLeft } from 'lucide-react';
import { chatApi, userApi, postApi } from '../services/api';
import type { ConversationPreview, FollowerUser, Message } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/image';
import '../styles/components/Messages.css';

interface SharedPostPayload {
  postId: number;
  privacy: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image: string;
  customMessage: string;
}

function parseSharedPost(content: string): SharedPostPayload | null {
  if (!content.startsWith('__SHARED_POST__:')) return null;
  try {
    return JSON.parse(content.slice('__SHARED_POST__:'.length)) as SharedPostPayload;
  } catch {
    return null;
  }
}

type PostStatus = 'loading' | 'visible' | 'deleted' | 'no_access';

function SharedPostCard({ data, isMine }: { data: SharedPostPayload; isMine: boolean }) {
  const [status, setStatus] = useState<PostStatus>('loading');

  useEffect(() => {
    postApi.getPost(data.postId).then(res => {
      if (res.success) {
        setStatus('visible');
      } else if (typeof res.error === 'string' && res.error === 'post not found') {
        setStatus('deleted');
      } else {
        setStatus('no_access');
      }
    });
  }, [data.postId]);

  const noAccessText = data.privacy === 'custom'
    ? 'You do not have access to this post'
    : 'Follow the account to see the post';

  const cardOverlay =
    status === 'deleted'   ? { icon: '🗑️', text: 'This post is no longer available' } :
    status === 'no_access' ? { icon: data.privacy === 'custom' ? '🔒' : '👤', text: noAccessText } :
    null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '280px' }}>
      {/* Post card */}
      <div style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-primary)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px 8px' }}>
          <img
            src={getImageUrl(data.authorAvatar)}
            alt={data.authorName}
            style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)', flexShrink: 0 }}
          />
          <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
            {data.authorName}
          </span>
        </div>
        {status === 'loading' ? (
          <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', borderTop: '1px solid var(--border-color)' }}>
            Loading...
          </div>
        ) : cardOverlay ? (
          <div style={{
            padding: '14px 12px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {cardOverlay.text}
            </span>
          </div>
        ) : (
          <>
            {data.image && (
              <img
                src={getImageUrl(data.image, '')}
                alt="Post"
                style={{ width: '100%', display: 'block', maxHeight: '220px', objectFit: 'cover' }}
              />
            )}
            {data.content && (
              <div style={{ padding: '8px 12px 10px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {data.content.length > 100 ? data.content.slice(0, 100) + '…' : data.content}
              </div>
            )}
          </>
        )}
      </div>
      {/* Custom message below the card */}
      {data.customMessage && (
        <div style={{
          padding: '10px 14px',
          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isMine ? 'var(--bg-gradient)' : 'var(--bg-primary)',
          color: isMine ? 'white' : 'var(--text-primary)',
          fontSize: '15px',
          lineHeight: '1.5',
          boxShadow: isMine ? 'var(--shadow-colored)' : 'var(--shadow-sm)',
          border: !isMine ? '1px solid var(--border-color)' : 'none',
        }}>
          {data.customMessage}
        </div>
      )}
    </div>
  );
}

type SelectedUser = {
  id: number;
  firstName: string;
  lastName: string;
  avatar: string;
  nickname: string;
};

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FollowerUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChatList, setShowChatList] = useState(true);

  useEffect(() => {
    chatApi.listConversations().then(res => {
      if (res.success && res.data) setConversations(res.data);
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      userApi.searchUsers(searchQuery).then(res => {
        if (res.success && res.data) setSearchResults(res.data);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectConversation = (conv: ConversationPreview) => {
    setSelectedUser({
      id: conv.userId,
      firstName: conv.firstName,
      lastName: conv.lastName,
      avatar: conv.avatar,  
      nickname: conv.nickname,
    });

    chatApi.markAsRead(conv.userId);

    setConversations(prev =>
        prev.map(c => c.userId === conv.userId ? { ...c, unreadCount: 0 } : c)
    );
    setShowChatList(false);
  };

  const handleSelectSearchResult = (u: FollowerUser) => {
    setSelectedUser({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      nickname: u.nickname,
    });
    setSearchQuery('');
    setShowChatList(false);
  };

  const handleSend = async () => {
    const content = messageInput.trim();
    if (!content || !selectedUser) return;

    setMessageInput('');

    const optimistic: Message = {
        id: Date.now(),           // temporary id
        senderId: user!.id,
        receiverId: selectedUser.id,
        content,
        createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    // save to backend
    await chatApi.sendMessage(selectedUser.id, content);
};

  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    chatApi.getMessages(selectedUser.id).then(res => {
      if (res.success && res.data) setMessages(res.data);
      else setMessages([]);
    });
  }, [selectedUser]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <div className="messages-wrapper">
        {/* Conversations / Search List */}
        <div className={`conversations-list ${!showChatList ? 'mobile-hidden' : ''}`}>
          <div className="conversations-header">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Messages
            </h3>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-primary)',
                  transition: 'all var(--transition-base)'
                }}
              />
            </div>
          </div>

          <div className="conversations-scroll">
            {isSearching ? (
              searchResults.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No users found
                </div>
              ) : (
                searchResults.map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectSearchResult(u)}
                    className="conversation-item"
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      backgroundColor: selectedUser?.id === u.id ? 'var(--bg-gradient-yellow-soft)' : 'transparent',
                      transition: 'all var(--transition-base)',
                      borderLeft: selectedUser?.id === u.id ? '4px solid var(--accent-primary)' : '4px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(u.avatar)}
                        alt={u.firstName}
                        className="avatar"
                        style={{ border: '2px solid var(--border-color)' }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                          {u.firstName} {u.lastName}
                        </div>
                        {u.nickname && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{u.nickname}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              conversations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No conversations yet. Search for someone to start chatting.
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.userId}
                    onClick={() => handleSelectConversation(conv)}
                    className="conversation-item"
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      backgroundColor: selectedUser?.id === conv.userId ? 'var(--bg-gradient-yellow-soft)' : 'transparent',
                      transition: 'all var(--transition-base)',
                      borderLeft: selectedUser?.id === conv.userId ? '4px solid var(--accent-primary)' : '4px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{ position: 'relative' }}>
                        <img
                          src={getImageUrl(conv.avatar)}
                          alt={conv.firstName}
                          className="avatar"
                          style={{ border: '2px solid var(--border-color)' }}
                        />
                        {conv.unreadCount > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            minWidth: '18px',
                            height: '18px',
                            backgroundColor: 'var(--accent-primary)',
                            borderRadius: '9px',
                            border: '2px solid var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: 'white',
                            padding: '0 3px'
                          }}>
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                            {conv.firstName} {conv.lastName}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: conv.unreadCount > 0 ? '600' : 'normal',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conv.lastSenderId === user?.id ? 'You: ' : ''}{conv.lastMessage.startsWith('__SHARED_POST__:') ? '📌 Sent a post' : conv.lastMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`chat-window ${showChatList ? 'mobile-hidden' : ''}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className="back-button"
                      onClick={() => setShowChatList(true)}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <img
                      src={getImageUrl(selectedUser.avatar)}
                      alt={selectedUser.firstName}
                      className="avatar"
                      style={{ border: '2px solid var(--border-color)' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </div>
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ padding: '8px' }}>
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-area">
                {messages.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    fontSize: '14px'
                  }}>
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.senderId === user?.id;
                    const sharedPost = parseSharedPost(msg.content);
                    return (
                      <div key={msg.id} style={{ marginBottom: '20px' }}>
                        <div className={`flex items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {!isMine && (
                            <img
                              src={getImageUrl(selectedUser!.avatar)}
                              alt={selectedUser!.firstName}
                              className="avatar-sm"
                              style={{ border: '2px solid var(--border-color)' }}
                            />
                          )}
                          {sharedPost ? (
                            <SharedPostCard data={sharedPost} isMine={isMine} />
                          ) : (
                            <div style={{
                              padding: '12px 16px',
                              borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                              background: isMine ? 'var(--bg-gradient)' : 'var(--bg-primary)',
                              color: isMine ? 'white' : 'var(--text-primary)',
                              fontSize: '15px',
                              lineHeight: '1.5',
                              boxShadow: isMine ? 'var(--shadow-colored)' : 'var(--shadow-sm)',
                              border: !isMine ? '1px solid var(--border-color)' : 'none',
                              maxWidth: '70%'
                            }}>
                              {msg.content}
                            </div>
                          )}
                          {isMine && (
                            <img
                              src={getImageUrl(user?.avatar ?? '')}
                              alt="me"
                              className="avatar-sm"
                              style={{ border: '2px solid var(--border-color)' }}
                            />
                          )}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '6px',
                          marginLeft: !isMine ? '48px' : '0',
                          marginRight: isMine ? '48px' : '0',
                          textAlign: isMine ? 'right' : 'left',
                          fontWeight: '500'
                        }}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="message-input-container">
                <div className="flex items-center gap-3">
                  <button className="btn-ghost hide-small-mobile" style={{ padding: '10px' }}>
                    <Paperclip size={20} />
                  </button>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                      style={{
                        width: '100%',
                        padding: '14px 50px 14px 18px',
                        border: '2px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '15px',
                        outline: 'none',
                        backgroundColor: 'var(--bg-primary)',
                        transition: 'all var(--transition-base)'
                      }}
                    />
                    <button
                      className="btn-ghost hide-small-mobile"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '8px',
                        display: 'flex'
                      }}
                    >
                      <Smile size={20} />
                    </button>
                  </div>
                  <button
                    className="btn-primary"
                    style={{
                      padding: '12px',
                      borderRadius: '50%',
                      minWidth: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={handleSend}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-secondary)',
              padding: '40px 20px'
            }}>
              <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Select a conversation
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                  Choose a chat from the list or search for someone to start a new conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
