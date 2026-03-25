import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, Image, Plus, Users, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import PostCard from './PostCard';
import { groupApi, userApi, type FollowerUser, type GroupEventResponse, type GroupResponse, type PostResponse } from '../services/api';
import { getImageUrl, validateImageFile } from '../utils/image';
import '../styles/components/GroupPage.css';

type EventVote = 'going' | 'not_going';

type GroupEventCard = {
  id: number;
  username: string;
  question: string;
  dateTime: string;
  going: number;
  notGoing: number;
  selectedVote: EventVote | null;
};

const EVENTS_PER_PAGE = 1;

export default function GroupPage() {
  const { user } = useAuth();
  const { groupId: routeGroupId } = useParams<{ groupId: string }>();
  const [groupData, setGroupData] = useState<GroupResponse | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [events, setEvents] = useState<GroupEventResponse[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [createPostError, setCreatePostError] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [createEventLoading, setCreateEventLoading] = useState(false);
  const [createEventError, setCreateEventError] = useState('');
  const [currentEventPage, setCurrentEventPage] = useState(1);
  const [voteLoadingByEvent, setVoteLoadingByEvent] = useState<Record<number, boolean>>({});
  const [voteError, setVoteError] = useState('');
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  // const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAdminActionsOpen, setIsAdminActionsOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  // const [inviteResults, setInviteResults] = useState<FollowerUser[]>([]);
  const [showInviteDropdown, setShowInviteDropdown] = useState(false);
  const [selectedInvitee, setSelectedInvitee] = useState<FollowerUser | null>(null);
  const [inviteSearchLoading, setInviteSearchLoading] = useState(false);
  // const [inviteLoading, setInviteLoading] = useState(false);
  // const [inviteError, setInviteError] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [members, setMembers] = useState<FollowerUser[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<FollowerUser | null>(null);
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState('');
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editGroupTitle, setEditGroupTitle] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupImage, setEditGroupImage] = useState('');
  const [editGroupImagePreview, setEditGroupImagePreview] = useState('');
  const [editGroupLoading, setEditGroupLoading] = useState(false);
  const [editGroupError, setEditGroupError] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteResults, setInviteResults] = useState<FollowerUser[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
  const [inviteError, setInviteError] = useState('');
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const postImageInputRef = useRef<HTMLInputElement | null>(null);
  const editGroupImageInputRef = useRef<HTMLInputElement | null>(null);

  const eventCards = useMemo<GroupEventCard[]>(() => {
    return events.map((event) => ({
      id: event.id,
      username:
        event.creator.nickname ||
        `${event.creator.firstName}${event.creator.lastName}`.toLowerCase(),
      question: event.title || event.description,
      dateTime: event.eventTime,
      going: event.responses.filter((response) => response.response === 'going').length,
      notGoing: event.responses.filter((response) => response.response === 'not_going').length,
      selectedVote: event.responses.find((response) => response.userId === user?.id)?.response ?? null,
    }));
  }, [events, user?.id]);

  const loadGroupPosts = useCallback(async (groupID: number | string) => {
    setPostsLoading(true);
    setPostsError('');

    const response = await groupApi.getGroupPosts(groupID);
    if (response.success && response.data) {
      setPosts(response.data);
    } else {
      setPosts([]);
      if (typeof response.error === 'string') {
        setPostsError(response.error);
      } else {
        setPostsError(response.error?.message || 'Failed to load group posts.');
      }
    }

    setPostsLoading(false);
  }, []);

  const fetchGroup = useCallback(async (groupId: string) => {
    const response = await groupApi.getGroup(groupId);
    if (!response.success || !response.data) {
      setGroupData(null);
      return;
    }

    setGroupData(response.data);
    // console.log(groupData)
  }, []);

  const loadGroupEvents = useCallback(async (groupID: number | string) => {
    setEventsLoading(true);
    setEventsError('');

    const response = await groupApi.getGroupEvents(groupID);
    if (response.success && response.data) {
      setEvents(response.data);
    } else {
      setEvents([]);
      if (typeof response.error === 'string') {
        setEventsError(response.error);
      } else {
        setEventsError(response.error?.message || 'Failed to load group events.');
      }
    }

    setEventsLoading(false);
  }, []);

  useEffect(() => {
    if (!routeGroupId) {
      return;
    }

    fetchGroup(routeGroupId);
  }, [routeGroupId, fetchGroup]);

  useEffect(() => {
    console.log(groupData);
  }, [groupData]);

  useEffect(() => {
    if (!isEditGroupModalOpen || !groupData) {
      return;
    }

    setEditGroupTitle(groupData.title || '');
    setEditGroupDescription(groupData.description || '');
    setEditGroupImage('');
    setEditGroupImagePreview(groupData.image || '');
    setEditGroupError('');
  }, [isEditGroupModalOpen, groupData]);

  useEffect(() => {
    if (!isInviteModalOpen) {
      return;
    }

    if (!inviteQuery.trim()) {
      setInviteResults([]);
      setShowInviteDropdown(false);
      setInviteSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setInviteSearchLoading(true);
      const response = await userApi.searchUsers(inviteQuery.trim());
      if (response.success) {
        const users = response.data ?? [];
        setInviteResults(users.filter((candidate) => candidate.id !== user?.id));
      } else {
        setInviteResults([]);
      }
      setShowInviteDropdown(true);
      setInviteSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [inviteQuery, isInviteModalOpen, user?.id]);


  useEffect(() => {
    if (!groupData?.id) {
      setPosts([]);
      setPostsError('');
      setPostsLoading(false);
      setEvents([]);
      setEventsError('');
      setEventsLoading(false);
      return;
    }

    loadGroupPosts(groupData.id);
    loadGroupEvents(groupData.id);
  }, [groupData?.id, loadGroupPosts, loadGroupEvents]);

  useEffect(() => {
    setCurrentEventPage(1);
    setVoteLoadingByEvent({});
    setVoteError('');
  }, [events]);

  useEffect(() => {
    if (!isAddMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAddMenuOpen]);


  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setCreatePostError(validationError);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNewPostImage(dataUrl);
      setNewPostImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const resetCreatePostModal = () => {
    setNewPostContent('');
    setNewPostImage('');
    setNewPostImagePreview('');
    setCreatePostError('');
    if (postImageInputRef.current) {
      postImageInputRef.current.value = '';
    }
  };

  const handleCreateGroupPost = async () => {
    if (!groupData?.id) {
      return;
    }
    if (!newPostContent.trim() && !newPostImage.trim()) {
      setCreatePostError('Please add content or upload an image.');
      return;
    }

    setCreatePostLoading(true);
    setCreatePostError('');

    const response = await groupApi.createGroupPost(groupData.id, {
      content: newPostContent,
      image: newPostImage || undefined,
    });

    if (response.success) {
      await loadGroupPosts(groupData.id);
      setCreatePostLoading(false);
      setIsCreatePostModalOpen(false);
      resetCreatePostModal();
      return;
    }

    if (typeof response.error === 'string') {
      setCreatePostError(response.error);
    } else {
      setCreatePostError(response.error?.message || 'Failed to create group post.');
    }
    setCreatePostLoading(false);
  };

  const resetCreateEventModal = () => {
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventTime('');
    setCreateEventError('');
  };

  const handleCreateGroupEvent = async () => {
    if (!groupData?.id) {
      return;
    }

    if (!newEventTitle.trim() || !newEventTime.trim()) {
      setCreateEventError('Event title and time are required.');
      return;
    }

    setCreateEventLoading(true);
    setCreateEventError('');

    const parsedEventDate = new Date(newEventTime);
    const eventTimePayload = Number.isNaN(parsedEventDate.getTime())
      ? newEventTime
      : parsedEventDate.toISOString();

    const response = await groupApi.createGroupEvent(groupData.id, {
      title: newEventTitle.trim(),
      description: newEventDescription.trim(),
      eventTime: eventTimePayload,
    });

    if (response.success) {
      await loadGroupEvents(groupData.id);
      setCreateEventLoading(false);
      setIsCreateEventModalOpen(false);
      resetCreateEventModal();
      return;
    }

    if (typeof response.error === 'string') {
      setCreateEventError(response.error);
    } else {
      setCreateEventError(response.error?.message || 'Failed to create event.');
    }
    setCreateEventLoading(false);
  };

  const totalEventPages = Math.max(1, Math.ceil(eventCards.length / EVENTS_PER_PAGE));
  const eventStartIndex = (currentEventPage - 1) * EVENTS_PER_PAGE;
  const currentEvents = eventCards.slice(eventStartIndex, eventStartIndex + EVENTS_PER_PAGE);

  const changeEventPage = (nextPage: number) => {
    const safePage = Math.min(totalEventPages, Math.max(1, nextPage));
    setCurrentEventPage(safePage);
  };

  const handleVote = async (event: GroupEventCard, vote: EventVote) => {
    if (!groupData?.id) {
      return;
    }

    setVoteError('');
    setVoteLoadingByEvent((prev) => ({ ...prev, [event.id]: true }));

    const response = await groupApi.respondToGroupEvent(groupData.id, event.id, { response: vote });
    if (response.success) {
      await loadGroupEvents(groupData.id);
      setVoteLoadingByEvent((prev) => ({ ...prev, [event.id]: false }));
      return;
    }

    if (typeof response.error === 'string') {
      setVoteError(response.error);
    } else {
      setVoteError(response.error?.message || 'Failed to submit vote.');
    }
    setVoteLoadingByEvent((prev) => ({ ...prev, [event.id]: false }));
  };

  const handleLeaveGroup = async () => {
    if (!groupData?.id) {
      return;
    }

    setLeaveLoading(true);
    setLeaveError('');

    const response = await groupApi.leaveGroup(groupData.id);
    if (response.success) {
      setIsLeaveConfirmOpen(false);
      setLeaveLoading(false);
      // Redirect or refresh
      setGroupData(null);
      return;
    }

    if (typeof response.error === 'string') {
      setLeaveError(response.error);
    } else {
      setLeaveError(response.error?.message || 'Failed to leave group.');
    }
    setLeaveLoading(false);
  };


  const handleDeleteGroup = async () => {
    if (!groupData?.id) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    const response = await groupApi.deleteGroup(groupData.id);
    if (response.success) {
      setIsDeleteConfirmOpen(false);
      setDeleteLoading(false);
      // Redirect or refresh
      setGroupData(null);
      return;
    }

    if (typeof response.error === 'string') {
      setDeleteError(response.error);
    } else {
      setDeleteError(response.error?.message || 'Failed to delete group.');
    }
    setDeleteLoading(false);
  };

  const handleEditGroupImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setEditGroupError(validationError);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditGroupImage(dataUrl);
      setEditGroupImagePreview(dataUrl);
      setEditGroupError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGroupEdits = async () => {
    if (!groupData?.id) {
      return;
    }

    if (!editGroupTitle.trim() || !editGroupDescription.trim()) {
      setEditGroupError('Title and description are required.');
      return;
    }

    setEditGroupLoading(true);
    setEditGroupError('');

    const response = await groupApi.updateGroup(groupData.id, {
      title: editGroupTitle.trim(),
      description: editGroupDescription.trim(),
      image: editGroupImage || undefined,
    });

    if (response.success && response.data) {
      setGroupData(response.data);
      setIsEditGroupModalOpen(false);
      setEditGroupLoading(false);
      return;
    }

    if (typeof response.error === 'string') {
      setEditGroupError(response.error);
    } else {
      setEditGroupError(response.error?.message || 'Failed to update group.');
    }
    setEditGroupLoading(false);
  };

  const handleInviteSearch = async (query: string) => {
    setInviteSearch(query);
    if (!query.trim()) {
      setInviteResults([]);
      return;
    }
    setInviteLoading(true);
    const res = await userApi.searchUsers(query);
    setInviteResults(res.success && res.data ? res.data : []);
    setInviteLoading(false);
  };

  const handleInvite = async (userId: number) => {
    if (!groupData?.id) return;
    setInviteError('');
    const res = await groupApi.inviteUser(groupData.id, userId);
    if (res.success) {
      setInvitedIds(prev => new Set(prev).add(userId));
    } else {
      setInviteError(typeof res.error === 'string' ? res.error : res.error?.message || 'Failed to send invite');
    }
  };

  const getVoteCounts = (event: GroupEventCard) => {
    return {
      going: event.going,
      notGoing: event.notGoing,
      total: event.going + event.notGoing,
      selectedVote: event.selectedVote,
    };
  };

  const handleOpenMembersModal = async () => {
    if (!groupData?.id) {
      return;
    }

    setMembersLoading(true);
    setMembersError('');
    setMembers([]);
    setIsMembersModalOpen(true);

    const response = await groupApi.getGroupMembers(groupData.id);
    if (response.success && response.data) {
      setMembers(response.data);
    } else {
      if (typeof response.error === 'string') {
        setMembersError(response.error);
      } else {
        setMembersError(response.error?.message || 'Failed to load group members.');
      }
    }
    setMembersLoading(false);
  };

  const handleRemoveMember = async () => {
    if (!groupData?.id || !memberToRemove) {
      return;
    }

    setRemoveMemberLoading(true);
    setRemoveMemberError('');

    const response = await groupApi.removeGroupMember(groupData.id, memberToRemove.id);
    if (response.success) {
      setMembers((prev) => prev.filter((member) => member.id !== memberToRemove.id));
      setGroupData((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          memberCount: Math.max(0, prev.memberCount - 1),
        };
      });
      setMemberToRemove(null);
      setRemoveMemberLoading(false);
      return;
    }

    if (typeof response.error === 'string') {
      setRemoveMemberError(response.error);
    } else {
      setRemoveMemberError(response.error?.message || 'Failed to remove group member.');
    }
    setRemoveMemberLoading(false);
  };

  return (
    <div className="group-page-container">
      {groupData ? (
        <>
          <div className="card group-details-card">
            <div className="group-details-banner" />
            <div className="group-details-content">
              <div className="group-details-avatar">
                {groupData.image ? (
                  <img src={groupData.image} alt={groupData.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                ) : (
                  groupData.title.charAt(0).toUpperCase()
                )}
              </div>

              <div className="group-details-main">
                <div className="group-details-heading-row">
                  <div>
                    <h3>{groupData.title}</h3>
                    <p className="group-owner">Created by {groupData.creator.nickname}</p>
                  </div>
                  <span className="badge badge-primary">Active Group</span>
                </div>

                <p className="group-details-description">{groupData.description || 'No group description yet.'}</p>

                <div className="group-details-meta">
                  <button
                    type="button"
                    className="group-details-meta-button"
                    onClick={handleOpenMembersModal}
                  >
                    <Users size={16} />
                    <span>{groupData.memberCount} members</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Created {new Date(groupData.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="group-details-actions">
                  {groupData.isMember && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsLeaveConfirmOpen(true)}
                    >
                      Leave Group
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setInviteQuery('');
                      setInviteResults([]);
                      setSelectedInvitee(null);
                      setShowInviteDropdown(false);
                      setInviteError('');
                      setIsInviteModalOpen(true);
                    }}
                  >
                    Invite
                  </button>

                  {groupData.isOwner && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsAdminActionsOpen(true)}
                    >
                      Admin Actions
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="group-page-sections">
            <div className="card group-page-toolbar">
              <div className="group-page-toolbar-content">
                <div>
                  <h4>Quick Actions</h4>
                  <p>Add new content to keep this group active.</p>
                </div>

                <div className="group-add-menu" ref={addMenuRef}>
                  <button
                    className="btn-primary"
                    onClick={() => setIsAddMenuOpen((prev) => !prev)}
                    type="button"
                  >
                    <Plus size={16} />
                    Add
                    <ChevronDown size={16} className={isAddMenuOpen ? 'menu-chevron-open' : ''} />
                  </button>

                  {isAddMenuOpen && (
                    <div className="group-add-dropdown">
                      <button
                        type="button"
                        className="group-add-option"
                        onClick={() => {
                          setIsAddMenuOpen(false);
                          setCreatePostError('');
                          setIsCreatePostModalOpen(true);
                        }}
                      >
                        Add Post
                      </button>
                      <button
                        type="button"
                        className="group-add-option"
                        onClick={() => {
                          setIsAddMenuOpen(false);
                          setCreateEventError('');
                          setIsCreateEventModalOpen(true);
                        }}
                      >
                        Add Event
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <section className="group-posts-column">
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="group-section-header">
                  <div className="group-posts-title-wrap">
                    <h4>Group Posts</h4>
                    <span className="badge">{posts.length}</span>
                  </div>
                </div>
              </div>

              {postsLoading && (
                <div className="card group-empty-state">Loading posts...</div>
              )}

              {!postsLoading && postsError && (
                <div className="card group-empty-state">{postsError}</div>
              )}

              {!postsLoading && !postsError && posts.length === 0 && (
                <div className="card group-empty-state">No posts available yet for this group.</div>
              )}

              {!postsLoading && !postsError && posts.map((post) => (
                <PostCard key={post.postId} post={post} />
              ))}
            </section>

            <aside className="group-events-column">
              <div className="card events-side-card">
                <div className="group-section-header" style={{ marginBottom: '14px' }}>
                  <h4>Event Votes</h4>
                  <span className="badge">{eventCards.length}</span>
                </div>

                {!eventsLoading && !eventsError && currentEvents.length === 0 && (
                  <div className="group-empty-state">No events yet for this group.</div>
                )}

                {eventsLoading && (
                  <div className="group-empty-state">Loading events...</div>
                )}

                {!eventsLoading && eventsError && (
                  <div className="group-empty-state">{eventsError}</div>
                )}

                {!eventsLoading && !eventsError && currentEvents.map((event) => {
                  const voteData = getVoteCounts(event);
                  return (
                    <div key={event.id} className="event-poll-card">
                      <div className="event-poll-user">@{event.username}</div>
                      <p className="event-poll-question">{event.question}</p>

                      <div className="event-poll-date">
                        <Calendar size={14} />
                        <span>{new Date(event.dateTime).toLocaleString()}</span>
                      </div>

                      <div className="event-poll-votes">
                        <div className="event-vote-row">
                          <button
                            className={voteData.selectedVote === 'going' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => void handleVote(event, 'going')}
                            disabled={voteLoadingByEvent[event.id]}
                          >
                            Going
                          </button>
                          <span className="event-vote-count">{voteData.going}</span>
                        </div>

                        <div className="event-vote-row">
                          <button
                            className={voteData.selectedVote === 'not_going' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => void handleVote(event, 'not_going')}
                            disabled={voteLoadingByEvent[event.id]}
                          >
                            Not Going
                          </button>
                          <span className="event-vote-count">{voteData.notGoing}</span>
                        </div>
                      </div>

                      <div className="event-poll-stats">
                        <div>{voteData.total} total votes</div>
                      </div>

                      <p className="event-vote-hint">
                        {voteData.selectedVote
                          ? `You voted ${voteData.selectedVote === 'going' ? 'Going' : 'Not Going'}.`
                          : 'Vote to let the group know your availability.'}
                      </p>
                    </div>
                  );
                })}

                {!eventsLoading && !eventsError && voteError && (
                  <p className="group-post-modal-error">{voteError}</p>
                )}

                <div className="event-pagination">
                  <div className="event-page-numbers">
                    {Array.from({ length: totalEventPages }, (_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          className={`event-page-dot ${page === currentEventPage ? 'active' : ''}`}
                          onClick={() => changeEventPage(page)}
                          aria-label={`Go to events page ${page}`}
                          title={`Page ${page}`}
                        >
                          <span className="sr-only">{page}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="card group-empty-state">
          Enter a valid group ID above to load the group card and the split layout.
        </div>
      )}

      <Modal
        isOpen={isCreatePostModalOpen}
        onClose={() => {
          setIsCreatePostModalOpen(false);
          resetCreatePostModal();
        }}
        title="Create Group Post"
        size="medium"
      >
        <div className="group-post-modal-form">
          <textarea
            className="group-post-modal-textarea"
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={5}
          />

          {newPostImagePreview && (
            <div className="group-post-image-preview-wrap">
              <img src={newPostImagePreview} alt="Preview" className="group-post-image-preview" />
              <button
                type="button"
                className="group-post-image-remove"
                onClick={() => {
                  setNewPostImage('');
                  setNewPostImagePreview('');
                  if (postImageInputRef.current) {
                    postImageInputRef.current.value = '';
                  }
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="group-post-modal-actions">
            <button
              type="button"
              className="btn-secondary group-post-photo-btn"
              onClick={() => postImageInputRef.current?.click()}
            >
              <Image size={16} />
              Photo/GIF
            </button>
            <input
              ref={postImageInputRef}
              type="file"
              accept="image/*,.gif"
              onChange={handlePostImageChange}
              style={{ display: 'none' }}
            />

            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsCreatePostModalOpen(false);
                  resetCreatePostModal();
                }}
                disabled={createPostLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateGroupPost}
                disabled={createPostLoading}
              >
                {createPostLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {createPostError && <p className="group-post-modal-error">{createPostError}</p>}
        </div>
      </Modal>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Member"
        size="medium"
      >
        <div className="group-post-modal-form">
          <input
            type="text"
            className="group-event-modal-input"
            placeholder="Search users by name..."
            value={inviteSearch}
            onChange={(e) => void handleInviteSearch(e.target.value)}
            autoFocus
          />

          {inviteLoading && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Searching...</p>
          )}

          {!inviteLoading && inviteSearch.trim() && inviteResults.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>No users found.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {inviteResults.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '14px' }}>
                  {u.firstName} {u.lastName}
                  {u.nickname && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>@{u.nickname}</span>}
                </span>
                <button
                  type="button"
                  className={invitedIds.has(u.id) ? 'btn-secondary' : 'btn-primary'}
                  disabled={invitedIds.has(u.id)}
                  onClick={() => void handleInvite(u.id)}
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                >
                  {invitedIds.has(u.id) ? 'Invited' : 'Invite'}
                </button>
              </div>
            ))}
          </div>

          {inviteError && <p className="group-post-modal-error">{inviteError}</p>}
        </div>
      </Modal>

      <Modal
        isOpen={isCreateEventModalOpen}
        onClose={() => {
          setIsCreateEventModalOpen(false);
          resetCreateEventModal();
        }}
        title="Create Group Event"
        size="medium"
      >
        <div className="group-post-modal-form">
          <input
            type="text"
            className="group-event-modal-input"
            placeholder="Event title"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
          />

          <textarea
            className="group-post-modal-textarea"
            placeholder="Describe the event"
            value={newEventDescription}
            onChange={(e) => setNewEventDescription(e.target.value)}
            rows={4}
          />

          <div className="group-event-modal-time-wrap">
            <label htmlFor="group-event-time" className="group-event-modal-label">Event Time</label>
            <input
              id="group-event-time"
              type="datetime-local"
              className="group-event-modal-input"
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
            />
          </div>

          <div className="group-post-modal-actions">
            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsCreateEventModalOpen(false);
                  resetCreateEventModal();
                }}
                disabled={createEventLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateGroupEvent}
                disabled={createEventLoading}
              >
                {createEventLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>

          {createEventError && <p className="group-post-modal-error">{createEventError}</p>}
        </div>
      </Modal>

      <Modal
        isOpen={isLeaveConfirmOpen}
        onClose={() => {
          setIsLeaveConfirmOpen(false);
          setLeaveError('');
        }}
        title="Leave Group"
        size="small"
      >
        <div className="group-post-modal-form">
          <p style={{ marginBottom: '16px' }}>
            Are you sure you want to leave <strong>{groupData?.title}</strong>? This action cannot be undone.
          </p>

          <div className="group-post-modal-actions">
            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsLeaveConfirmOpen(false);
                  setLeaveError('');
                }}
                disabled={leaveLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleLeaveGroup}
                disabled={leaveLoading}
                style={{ backgroundColor: '#dc2626' }}
              >
                {leaveLoading ? 'Leaving...' : 'Leave Group'}
              </button>
            </div>
          </div>

          {leaveError && <p className="group-post-modal-error">{leaveError}</p>}
        </div>
      </Modal>

      {/* <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteQuery('');
          setInviteResults([]);
          setSelectedInvitee(null);
          setShowInviteDropdown(false);
          setInviteError('');
        }}
        title="Invite User to Group"
        size="medium"
      >
        <div className="group-post-modal-form">
          <label htmlFor="invite-email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Find User
          </label>

          <div className="group-invite-search-wrap">
            <input
              id="invite-email"
              type="search"
              className="group-event-modal-input"
              placeholder="Search by name or email"
              value={inviteQuery}
              onChange={(e) => {
                setInviteQuery(e.target.value);
                setSelectedInvitee(null);
              }}
              onFocus={() => inviteResults.length > 0 && setShowInviteDropdown(true)}
              onBlur={() => setTimeout(() => setShowInviteDropdown(false), 150)}
              disabled={inviteLoading}
            />

            {showInviteDropdown && inviteQuery.trim() && (
              <div className="group-invite-dropdown">
                {inviteSearchLoading ? (
                  <div className="group-invite-empty">Searching...</div>
                ) : inviteResults.length > 0 ? (
                  inviteResults.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="group-invite-item"
                      onMouseDown={() => handleInviteCandidateSelect(candidate)}
                    >
                      <img
                        src={getImageUrl(candidate.avatar)}
                        alt={candidate.firstName}
                        className="group-invite-avatar"
                      />
                      <div>
                        <div className="group-invite-name">{candidate.firstName} {candidate.lastName}</div>
                        {candidate.nickname && <div className="group-invite-nickname">@{candidate.nickname}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="group-invite-empty">No users found</div>
                )}
              </div>
            )}
          </div>

          {selectedInvitee && (
            <p className="group-invite-selected">
              Selected: {selectedInvitee.firstName} {selectedInvitee.lastName}
            </p>
          )}

          <div className="group-post-modal-actions" style={{ marginTop: '16px' }}>
            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteQuery('');
                  setInviteResults([]);
                  setSelectedInvitee(null);
                  setShowInviteDropdown(false);
                  setInviteError('');
                }}
                disabled={inviteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleInviteUser}
                disabled={inviteLoading}
              >
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>

          {inviteError && <p className="group-post-modal-error">{inviteError}</p>}
        </div>
      </Modal> */}

      <Modal
        isOpen={isAdminActionsOpen}
        onClose={() => setIsAdminActionsOpen(false)}
        title="Admin Actions"
        size="small"
      >
        <div className="group-post-modal-form">
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Manage group settings and actions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsAdminActionsOpen(false);
                setEditGroupError('');
                setIsEditGroupModalOpen(true);
              }}
            >
              Edit Group
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsAdminActionsOpen(false);
                setDeleteError('');
                setIsDeleteConfirmOpen(true);
              }}
            >
              Delete Group
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAdminActionsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditGroupModalOpen}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setEditGroupError('');
        }}
        title="Edit Group"
        size="medium"
      >
        <div className="group-post-modal-form">
          <input
            type="text"
            className="group-event-modal-input"
            placeholder="Group name"
            value={editGroupTitle}
            onChange={(e) => setEditGroupTitle(e.target.value)}
          />

          <textarea
            className="group-post-modal-textarea"
            placeholder="Group description"
            value={editGroupDescription}
            onChange={(e) => setEditGroupDescription(e.target.value)}
            rows={4}
          />

          {editGroupImagePreview && (
            <div className="group-post-image-preview-wrap">
              <img src={getImageUrl(editGroupImagePreview)} alt="Group preview" className="group-post-image-preview" />
              <button
                type="button"
                className="group-post-image-remove"
                onClick={() => {
                  setEditGroupImage('');
                  setEditGroupImagePreview(groupData?.image || '');
                  if (editGroupImageInputRef.current) {
                    editGroupImageInputRef.current.value = '';
                  }
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="group-post-modal-actions">
            <button
              type="button"
              className="btn-secondary group-post-photo-btn"
              onClick={() => editGroupImageInputRef.current?.click()}
            >
              <Image size={16} />
              Change Image
            </button>

            <input
              ref={editGroupImageInputRef}
              type="file"
              accept="image/*,.gif"
              onChange={handleEditGroupImageChange}
              style={{ display: 'none' }}
            />

            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsEditGroupModalOpen(false);
                  setEditGroupError('');
                }}
                disabled={editGroupLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveGroupEdits}
                disabled={editGroupLoading}
              >
                {editGroupLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {editGroupError && <p className="group-post-modal-error">{editGroupError}</p>}
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteError('');
        }}
        title="Delete Group"
        size="small"
      >
        <div className="group-post-modal-form">
          <p style={{ marginBottom: '16px' }}>
            Are you sure you want to permanently delete <strong>{groupData?.title}</strong>? This action cannot be undone and will remove all group data, posts, and events.
          </p>

          <div className="group-post-modal-actions">
            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeleteError('');
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleDeleteGroup}
                disabled={deleteLoading}
                style={{ backgroundColor: '#dc2626' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>

          {deleteError && <p className="group-post-modal-error">{deleteError}</p>}
        </div>
      </Modal>

      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => {
          setIsMembersModalOpen(false);
          setMembers([]);
          setMembersError('');
        }}
        title="Group Members"
        size="medium"
      >
        <div className="group-post-modal-form">
          {membersLoading && (
            <div className="group-members-list-empty">Loading members...</div>
          )}

          {!membersLoading && membersError && (
            <div className="group-members-list-empty">{membersError}</div>
          )}

          {!membersLoading && !membersError && members.length === 0 && (
            <div className="group-members-list-empty">No members in this group.</div>
          )}

          {!membersLoading && !membersError && members.length > 0 && (
            <div className="group-members-list">
              {members.map((member) => (
                <div key={member.id} className="group-member-item">
                  <img
                    src={getImageUrl(member.avatar)}
                    alt={member.firstName}
                    className="group-member-avatar"
                  />
                  <div className="group-member-info">
                    <div className="group-member-name">
                      {member.firstName} {member.lastName}
                    </div>
                    {member.nickname && (
                      <div className="group-member-nickname">@{member.nickname}</div>
                    )}
                  </div>
                  {groupData?.isOwner && member.id !== groupData.creatorId && (
                    <button
                      type="button"
                      className="group-member-remove-btn"
                      onClick={() => {
                        setRemoveMemberError('');
                        setMemberToRemove(member);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="group-post-modal-actions" style={{ marginTop: '16px' }}>
            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsMembersModalOpen(false);
                  setMembers([]);
                  setMembersError('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!memberToRemove}
        onClose={() => {
          setMemberToRemove(null);
          setRemoveMemberError('');
        }}
        title="Remove Member"
        size="small"
      >
        <div className="group-post-modal-form">
          <p style={{ marginBottom: '16px' }}>
            Are you sure you want to remove <strong>{memberToRemove?.firstName} {memberToRemove?.lastName}</strong> from this group?
          </p>

          <div className="group-post-modal-actions">
            <div className="group-post-modal-submit-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMemberToRemove(null);
                  setRemoveMemberError('');
                }}
                disabled={removeMemberLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRemoveMember}
                disabled={removeMemberLoading}
                style={{ backgroundColor: '#dc2626' }}
              >
                {removeMemberLoading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>

          {removeMemberError && <p className="group-post-modal-error">{removeMemberError}</p>}
        </div>
      </Modal>
    </div>
  );
}
