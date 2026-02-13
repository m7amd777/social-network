import { useState } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, ArrowLeft } from 'lucide-react';
import { dummyChats } from '../data/dummyData';
import '../styles/components/Messages.css';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(dummyChats[0]);
  const [messageInput, setMessageInput] = useState('');
  const [showChatList, setShowChatList] = useState(true);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <div className="messages-wrapper">
        {/* Conversations List */}
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
                placeholder="Search conversations..."
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
            {dummyChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat);
                  setShowChatList(false);
                }}
                className="conversation-item"
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: selectedChat.id === chat.id ? 'var(--bg-gradient-yellow-soft)' : 'transparent',
                  transition: 'all var(--transition-base)',
                  borderLeft: selectedChat.id === chat.id ? '4px solid var(--accent-primary)' : '4px solid transparent'
                }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={chat.participants[1].avatar || 'https://picsum.photos/seed/default/48/48.jpg'} 
                      alt={chat.participants[1].firstName}
                      className="avatar"
                      style={{ border: '2px solid var(--border-color)' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'var(--accent-success)',
                      borderRadius: '50%',
                      border: '2px solid var(--bg-primary)'
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                        {chat.participants[1].firstName} {chat.participants[1].lastName}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {chat.messages[chat.messages.length - 1].content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`chat-window ${showChatList ? 'mobile-hidden' : ''}`}>
          {selectedChat ? (
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
                      src={selectedChat.participants[1].avatar || 'https://picsum.photos/seed/default/48/48.jpg'} 
                      alt={selectedChat.participants[1].firstName}
                      className="avatar"
                      style={{ border: '2px solid var(--border-color)' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
                        {selectedChat.participants[1].firstName} {selectedChat.participants[1].lastName}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--accent-success)', fontWeight: '600' }}>
                        Active now
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
                {selectedChat.messages.map(message => (
                  <div key={message.id} style={{ marginBottom: '20px' }}>
                    <div className={`flex items-end gap-3 ${
                      message.senderId === '1' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.senderId !== '1' && (
                        <img 
                          src={message.sender.avatar || 'https://picsum.photos/seed/default/36/36.jpg'} 
                          alt={message.sender.firstName}
                          className="avatar-sm"
                          style={{ border: '2px solid var(--border-color)' }}
                        />
                      )}
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: message.senderId === '1' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: message.senderId === '1' ? 'var(--bg-gradient)' : 'var(--bg-primary)',
                        color: message.senderId === '1' ? 'white' : 'var(--text-primary)',
                        fontSize: '15px',
                        lineHeight: '1.5',
                        boxShadow: message.senderId === '1' ? 'var(--shadow-colored)' : 'var(--shadow-sm)',
                        border: message.senderId !== '1' ? '1px solid var(--border-color)' : 'none'
                      }}>
                        {message.content}
                      </div>
                      {message.senderId === '1' && (
                        <img 
                          src={message.sender.avatar || 'https://picsum.photos/seed/default/36/36.jpg'} 
                          alt={message.sender.firstName}
                          className="avatar-sm"
                          style={{ border: '2px solid var(--border-color)' }}
                        />
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-muted)',
                      marginTop: '6px',
                      marginLeft: message.senderId !== '1' ? '48px' : '0',
                      marginRight: message.senderId === '1' ? '48px' : '0',
                      textAlign: message.senderId === '1' ? 'right' : 'left',
                      fontWeight: '500'
                    }}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                ))}
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
                      onKeyPress={(e) => e.key === 'Enter' && setMessageInput('')}
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
                    onClick={() => setMessageInput('')}
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
                  Choose a chat from the list to start messaging your friends and stay connected
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}