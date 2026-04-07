import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, Smile, ArrowLeft, Users } from 'lucide-react';
import { chatApi, userApi, postApi, groupApi } from '../services/api';
import type {
    ConversationPreview,
    FollowerUser,
    Message,
    GroupMessage,
    GroupResponse,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/image';
import '../styles/components/Messages.css';
import type { WSMessage } from '../hooks/useWebSocket';
import { useNotifications } from '../context/NotificationContext';
import EmojiPicker from './EmojiPicker';

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
type ChatMode = 'users' | 'groups';

type SelectedUser = {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string;
    nickname: string;
};

type SelectedGroup = {
    id: number;
    title: string;
    image: string;
};

type ChatMessageView = {
    id: number;
    senderId: number;
    receiverId?: number;
    groupId?: number;
    senderName?: string;
    senderAvatar?: string;
    content: string;
    createdAt: string;
};

function mapDirectMessage(msg: Message): ChatMessageView {
    return {
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        createdAt: msg.createdAt,
    };
}

function mapGroupMessage(msg: GroupMessage): ChatMessageView {
    return {
        id: msg.id,
        senderId: msg.senderId,
        groupId: msg.groupId,
        senderName: `${msg.senderFirstName} ${msg.senderLastName}`.trim(),
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        createdAt: msg.createdAt,
    };
}

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
        status === 'deleted' ? { icon: 'del', text: 'This post is no longer available' } :
            status === 'no_access' ? { icon: 'lock', text: noAccessText } :
                null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '280px' }}>
            <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-sm)',
            }}>
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
                                {data.content.length > 100 ? data.content.slice(0, 100) + '...' : data.content}
                            </div>
                        )}
                    </>
                )}
            </div>
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

export default function Messages() {
    const { user } = useAuth();
    const { sendWS: wsSend, onWSMessage, refreshMessages } = useNotifications();
    const navigate = useNavigate();

    const [chatMode, setChatMode] = useState<ChatMode>('users');
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [memberGroups, setMemberGroups] = useState<GroupResponse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FollowerUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
    const [messages, setMessages] = useState<ChatMessageView[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [showChatList, setShowChatList] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        if (chatMode === 'users') {
            chatApi.listConversations().then(res => {
                if (res.success && res.data) setConversations(res.data);
            });
            return;
        }

        groupApi.listGroups().then(res => {
            if (res.success && res.data) {
                setMemberGroups(res.data.filter(group => group.isMember));
            }
        });
    }, [chatMode]);

    useEffect(() => {
        if (chatMode !== 'users' || !searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            userApi.searchUsers(searchQuery).then(res => {
                if (res.success && res.data) setSearchResults(res.data);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [chatMode, searchQuery]);

    useEffect(() => {
        setMessages([]);
        setMessageInput('');
        setShowEmojiPicker(false);
        setShowChatList(true);
        if (chatMode === 'users') {
            setSelectedGroup(null);
        } else {
            setSelectedUser(null);
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [chatMode]);

    useEffect(() => {
        if (chatMode !== 'users') {
            return;
        }
        if (!selectedUser) {
            setMessages([]);
            return;
        }

        chatApi.getMessages(selectedUser.id).then(res => {
            if (res.success && res.data) {
                setMessages(res.data.map(mapDirectMessage));
            } else {
                setMessages([]);
            }
        });
    }, [chatMode, selectedUser]);

    useEffect(() => {
        if (chatMode !== 'groups') {
            return;
        }
        if (!selectedGroup) {
            setMessages([]);
            return;
        }

        chatApi.getGroupMessages(selectedGroup.id).then(res => {
            if (res.success && res.data) {
                setMessages(res.data.map(mapGroupMessage));
            } else {
                setMessages([]);
            }
        });
    }, [chatMode, selectedGroup]);

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

        chatApi.markAsRead(conv.userId).then(() => refreshMessages());
        setConversations(prev => prev.map(c => c.userId === conv.userId ? { ...c, unreadCount: 0 } : c));
        setShowChatList(false);
    };

    const handleSelectGroupConversation = (group: GroupResponse) => {
        setSelectedGroup({
            id: group.id,
            title: group.title,
            image: group.image,
        });
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

    useEffect(() => {
        return onWSMessage((msg: WSMessage) => {
            if (msg.type === 'group_message') {
                if (!selectedGroup || msg.group_id !== selectedGroup.id) {
                    return;
                }
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    senderId: msg.sender_id,
                    groupId: msg.group_id,
                    senderName: `${msg.sender_first_name ?? ''} ${msg.sender_last_name ?? ''}`.trim(),
                    senderAvatar: msg.sender_avatar,
                    content: msg.content,
                    createdAt: msg.created_at,
                }]);
                return;
            }

            if (msg.type === 'message' && selectedUser &&
                (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)
            ) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    senderId: msg.sender_id,
                    receiverId: msg.receiver_id,
                    content: msg.content,
                    createdAt: msg.created_at,
                }]);
            }
        });
    }, [onWSMessage, selectedUser, selectedGroup]);

    const handleSend = () => {
        const content = messageInput.trim();
        if (!content) return;

        if (chatMode === 'users') {
            if (!selectedUser) return;
            wsSend({
                type: 'message',
                receiver_id: selectedUser.id,
                content,
            });
            setMessageInput('');
            return;
        }

        if (!selectedGroup) return;
        wsSend({
            type: 'group_message',
            group_id: selectedGroup.id,
            content,
        });
        setMessageInput('');
    };

    const isSearching = searchQuery.trim().length > 0;
    const filteredMemberGroups = memberGroups.filter(group =>
        group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const selectedTitle = chatMode === 'users'
        ? (selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '')
        : (selectedGroup ? selectedGroup.title : '');

    return (
        <>
            <div className="messages-wrapper">
                <div className={`conversations-list ${!showChatList ? 'mobile-hidden' : ''}`}>
                    <div className="conversations-header">
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                            Messages
                        </h3>

                        <div className="chat-mode-switch">
                            <button
                                className={chatMode === 'users' ? 'active' : ''}
                                onClick={() => setChatMode('users')}
                            >
                                Users
                            </button>
                            <button
                                className={chatMode === 'groups' ? 'active' : ''}
                                onClick={() => setChatMode('groups')}
                            >
                                <Users size={14} />
                                Groups
                            </button>
                        </div>

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
                                placeholder={chatMode === 'users' ? 'Search people...' : 'Search groups...'}
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
                        {chatMode === 'users' && isSearching ? (
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
                        ) : chatMode === 'users' ? (
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
                                                    {conv.lastSenderId === user?.id ? 'You: ' : ''}{conv.lastMessage.startsWith('__SHARED_POST__:') ? 'Sent a post' : conv.lastMessage}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            filteredMemberGroups.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                    No groups found.
                                </div>
                            ) : (
                                filteredMemberGroups.map(group => (
                                    <div
                                        key={group.id}
                                        onClick={() => handleSelectGroupConversation(group)}
                                        className="conversation-item"
                                        style={{
                                            padding: '16px',
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            backgroundColor: selectedGroup?.id === group.id ? 'var(--bg-gradient-yellow-soft)' : 'transparent',
                                            transition: 'all var(--transition-base)',
                                            borderLeft: selectedGroup?.id === group.id ? '4px solid var(--accent-primary)' : '4px solid transparent'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="group-avatar-wrap">
                                                <img
                                                    src={getImageUrl(group.image)}
                                                    alt={group.title}
                                                    className="avatar group-avatar"
                                                    style={{ border: '2px solid var(--border-color)' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                                                        {group.title}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                        {formatTime(group.createdAt)}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: 'var(--text-secondary)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {group.description || 'Group chat'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                <div className={`chat-window ${showChatList ? 'mobile-hidden' : ''}`}>
                    {(chatMode === 'users' ? selectedUser : selectedGroup) ? (
                        <>
                            <div className="chat-header">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="back-button"
                                            onClick={() => setShowChatList(true)}
                                        >
                                            <ArrowLeft size={20} />
                                        </button>

                                        {chatMode === 'users' && selectedUser ? (
                                            <img
                                                src={getImageUrl(selectedUser.avatar)}
                                                alt={selectedUser.firstName}
                                                className="avatar"
                                                style={{ border: '2px solid var(--border-color)' }}
                                            />
                                        ) : (
                                            <img
                                                src={getImageUrl(selectedGroup?.image ?? '')}
                                                alt={selectedGroup?.title ?? 'Group'}
                                                className="avatar group-avatar"
                                                style={{ border: '2px solid var(--border-color)' }}
                                            />
                                        )}

                                        <div>
                                            {chatMode === 'users' && selectedUser ? (
                                                <div
                                                    onClick={() => navigate(`/profile/${selectedUser.id}`)}
                                                    style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', cursor: 'pointer' }}
                                                >
                                                    {selectedTitle}
                                                </div>
                                            ) : (
                                                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
                                                    {selectedTitle}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                                                            src={getImageUrl(chatMode === 'groups' ? (msg.senderAvatar ?? '') : (selectedUser?.avatar ?? ''))}
                                                            alt={chatMode === 'groups' ? (msg.senderName ?? 'member') : (selectedUser?.firstName ?? 'user')}
                                                            className="avatar-sm"
                                                            style={{
                                                                border: '2px solid var(--border-color)',
                                                                borderRadius: chatMode === 'groups' ? '10px' : undefined,
                                                            }}
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
                                                            {chatMode === 'groups' && !isMine && msg.senderName && (
                                                                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                                                                    {msg.senderName}
                                                                </div>
                                                            )}
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

                            <div className="message-input-container">
                                <div className="flex items-center gap-3">
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder={chatMode === 'groups' ? 'Type a group message...' : 'Type a message...'}
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
                                                display: 'flex',
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                color: showEmojiPicker ? 'var(--accent-primary)' : undefined,
                                            }}
                                            onClick={() => setShowEmojiPicker(v => !v)}
                                        >
                                            <Smile size={20} />
                                        </button>
                                        {showEmojiPicker && (
                                            <EmojiPicker
                                                onSelect={emoji => setMessageInput(prev => prev + emoji)}
                                                onClose={() => setShowEmojiPicker(false)}
                                            />
                                        )}
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
                                    {chatMode === 'users'
                                        ? 'Choose a chat from the list or search for someone to start a new conversation'
                                        : 'Choose a group from the list to start group chat'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}