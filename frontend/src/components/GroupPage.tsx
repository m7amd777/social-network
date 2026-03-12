import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Calendar, ChevronDown, Image, Plus, Users, X } from 'lucide-react';
import { dummyEvents, dummyUsers } from '../data/dummyData';
import Modal from './Modal';
import PostCard from './PostCard';
import { groupApi, type GroupResponse, type PostResponse } from '../services/api';
import '../styles/components/GroupPage.css';

type EventVote = 'going' | 'not_going';

type GroupEventCard = {
  id: string;
  username: string;
  question: string;
  dateTime: string;
  going: number;
  notGoing: number;
};

const EVENTS_PER_PAGE = 1;

export default function GroupPage() {
  const [groupIdInput, setGroupIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupData, setGroupData] = useState<GroupResponse | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [createPostError, setCreatePostError] = useState('');
  const [currentEventPage, setCurrentEventPage] = useState(1);
  const [eventVotes, setEventVotes] = useState<Record<string, EventVote | null>>({});
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const postImageInputRef = useRef<HTMLInputElement | null>(null);

  const eventCards = useMemo<GroupEventCard[]>(() => {
    const mappedEvents = dummyEvents.map((event) => ({
      id: event.id,
      username: event.creator.nickname || `${event.creator.firstName}${event.creator.lastName}`.toLowerCase(),
      question: event.description,
      dateTime: event.dateTime,
      going: event.responses.filter((response) => response.response === 'going').length,
      notGoing: event.responses.filter((response) => response.response === 'not_going').length,
    }));

    if (mappedEvents.length >= 3) {
      return mappedEvents;
    }

    const fallbackCards: GroupEventCard[] = [
      {
        id: 'community-qna',
        username: dummyUsers[0]?.nickname || 'communitylead',
        question: 'Should we host a live Q&A this Thursday at 7 PM?',
        dateTime: '2026-03-14T19:00:00Z',
        going: 11,
        notGoing: 2,
      },
      {
        id: 'coding-sprint',
        username: dummyUsers[2]?.nickname || 'sprintmentor',
        question: 'Would you join a weekend group coding sprint?',
        dateTime: '2026-03-16T11:00:00Z',
        going: 8,
        notGoing: 4,
      },
      {
        id: 'design-review',
        username: dummyUsers[1]?.nickname || 'uxcrew',
        question: 'Can you attend the UI review circle tomorrow?',
        dateTime: '2026-03-11T18:00:00Z',
        going: 15,
        notGoing: 3,
      },
    ];

    return [...mappedEvents, ...fallbackCards].slice(0, 5);
  }, []);

  const loadGroupPosts = useCallback(async (groupID: string) => {
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

  useEffect(() => {
    if (!groupData?.id) {
      setPosts([]);
      setPostsError('');
      setPostsLoading(false);
      return;
    }

    loadGroupPosts(groupData.id);
  }, [groupData?.id, loadGroupPosts]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = groupIdInput.trim();
    if (!trimmed || Number.isNaN(Number(trimmed))) {
      setError('Please enter a valid numeric group ID.');
      setGroupData(null);
      return;
    }

    setLoading(true);
    setError('');

    const response = await groupApi.getGroup(trimmed);
    if (!response.success || !response.data) {
      if (typeof response.error === 'string') {
        setError(response.error);
      } else {
        setError(response.error?.message || 'Failed to fetch group.');
      }
      setGroupData(null);
      setLoading(false);
      return;
    }

    setGroupData(response.data);
    setLoading(false);
  };

  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
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

  const totalEventPages = Math.max(1, Math.ceil(eventCards.length / EVENTS_PER_PAGE));
  const eventStartIndex = (currentEventPage - 1) * EVENTS_PER_PAGE;
  const currentEvents = eventCards.slice(eventStartIndex, eventStartIndex + EVENTS_PER_PAGE);

  const changeEventPage = (nextPage: number) => {
    const safePage = Math.min(totalEventPages, Math.max(1, nextPage));
    setCurrentEventPage(safePage);
  };

  const handleVote = (event: GroupEventCard, vote: EventVote) => {
    setEventVotes((prev) => ({
      ...prev,
      [event.id]: prev[event.id] === vote ? null : vote,
    }));
  };

  const getVoteCounts = (event: GroupEventCard) => {
    const selectedVote = eventVotes[event.id];
    let going = event.going;
    let notGoing = event.notGoing;

    if (selectedVote === 'going') {
      going += 1;
    }

    if (selectedVote === 'not_going') {
      notGoing += 1;
    }

    return {
      going,
      notGoing,
      total: going + notGoing,
      selectedVote,
    };
  };

  return (
    <div className="group-page-container">
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="group-page-search">
          <h2 className="group-page-title">Group Page</h2>
          <p className="group-page-subtitle">
            Fetch a group with <code>/api/groups/{'{id}'}</code> and browse group-only posts and event polls.
          </p>

          <form onSubmit={handleSubmit} className="group-page-search-form">
            <input
              type="number"
              min={1}
              step={1}
              value={groupIdInput}
              onChange={(e) => setGroupIdInput(e.target.value)}
              placeholder="Group ID (e.g. 1)"
              className="group-page-search-input"
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch Group'}
            </button>
          </form>

          {error && <p className="group-page-error">{error}</p>}
        </div>
      </div>

      {groupData ? (
        <>
          <div className="card group-details-card">
            <div className="group-details-banner" />
            <div className="group-details-content">
              <div className="group-details-avatar">{groupData.title.charAt(0).toUpperCase()}</div>

              <div className="group-details-main">
                <div className="group-details-heading-row">
                  <div>
                    <h3>{groupData.title}</h3>
                    <p className="group-owner">Created by {groupData.createdBy}</p>
                  </div>
                  <span className="badge badge-primary">Active Group</span>
                </div>

                <p className="group-details-description">{groupData.description || 'No group description yet.'}</p>

                <div className="group-details-meta">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{groupData.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Created {new Date(groupData.createdAt).toLocaleDateString()}</span>
                  </div>
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
                      <button type="button" className="group-add-option" onClick={() => setIsAddMenuOpen(false)}>
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

                {currentEvents.map((event) => {
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
                            onClick={() => handleVote(event, 'going')}
                          >
                            Going
                          </button>
                          <span className="event-vote-count">{voteData.going}</span>
                        </div>

                        <div className="event-vote-row">
                          <button
                            className={voteData.selectedVote === 'not_going' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => handleVote(event, 'not_going')}
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
    </div>
  );
}
