import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, X, Send } from 'lucide-react';
import { postApi, type PostResponse, type CommentResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { validateImageFile, getImageUrl } from '../utils/image';

interface PostCardProps {
  post: PostResponse;
  onUserClick?: (userId: number) => void;
}

const PRIVACY_LABEL: Record<string, string> = {
  public: 'Public',
  followers: 'Followers',
  custom: 'Private',
};

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post, onUserClick }: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [isLiked, setIsLiked] = useState(post.isLikedByViewer ?? false);
  const [liking, setLiking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [commentImagePreview, setCommentImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [commentError, setCommentError] = useState('');
  const commentFileRef = useRef<HTMLInputElement>(null);

  const toggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      const res = await postApi.getComments(post.postId);
      if (res.success && res.data) {
        setComments(res.data);
        setCommentsLoaded(true);
      }
    }
    setShowComments(v => !v);
  };

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    // Optimistic update
    setIsLiked(v => !v);
    setLikeCount(c => isLiked ? c - 1 : c + 1);

    const res = isLiked
      ? await postApi.unlikePost(post.postId)
      : await postApi.likePost(post.postId);

    if (res.success && res.data) {
      setLikeCount(res.data.likeCount);
      setIsLiked(res.data.isLikedByViewer);
    } else {
      // Revert on failure
      setIsLiked(v => !v);
      setLikeCount(c => isLiked ? c + 1 : c - 1);
    }
    setLiking(false);
  };

  const handleShare = async () => {
    const shareText = `Check out this post by ${post.author.firstName} ${post.author.lastName}: "${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"`;
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // User cancelled or not supported
    }
  };

  const handleCommentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setCommentError(validationError);
      e.target.value = '';
      return;
    }

    setCommentError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCommentImage(dataUrl);
      setCommentImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeCommentImage = () => {
    setCommentImage('');
    setCommentImagePreview('');
    if (commentFileRef.current) commentFileRef.current.value = '';
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await postApi.createComment(post.postId, {
      content: commentText,
      image: commentImage || undefined,
    });
    setSubmitting(false);
    if (res.success && res.data) {
      setComments(prev => [...prev, res.data!]);
      setCommentCount(c => c + 1);
      setCommentText('');
      setCommentImage('');
      setCommentImagePreview('');
      if (commentFileRef.current) commentFileRef.current.value = '';
    }
  };

  const avatarSrc = getImageUrl(post.author.avatar);
  const myAvatarSrc = getImageUrl(user?.avatar);

  const authorClickable = !!onUserClick;

  return (
    <div className="card animate-fadeIn" style={{
      marginBottom: '20px',
      borderRadius: 'var(--radius-lg)',
      border: '2px solid var(--border-color)',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px 20px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              alt={post.author.firstName}
              className="avatar-lg"
              onClick={authorClickable ? () => onUserClick(post.author.id) : undefined}
              style={{
                border: '3px solid white',
                boxShadow: 'var(--shadow-md)',
                cursor: authorClickable ? 'pointer' : 'default',
              }}
            />
            <div>
              <div
                onClick={authorClickable ? () => onUserClick(post.author.id) : undefined}
                style={{
                  fontWeight: '700',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  cursor: authorClickable ? 'pointer' : 'default',
                  display: 'inline',
                }}
              >
                {post.author.firstName} {post.author.lastName}
                {post.author.nickname && (
                  <span
                    onClick={authorClickable ? (e) => { e.stopPropagation(); onUserClick(post.author.id); } : undefined}
                    style={{
                      color: 'var(--accent-primary)',
                      marginLeft: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: authorClickable ? 'pointer' : 'default',
                    }}
                  >
                    @{post.author.nickname}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{timeAgo(post.createdAt)}</span>
                <span>•</span>
                <span style={{ padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: '600' }}>
                  {PRIVACY_LABEL[post.privacy] ?? post.privacy}
                </span>
              </div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: '8px', borderRadius: 'var(--radius-md)', opacity: 0.6 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px 16px 20px' }}>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
          {post.content}
        </p>
        {post.image && (
          <div style={{ marginTop: '16px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
            <img src={getImageUrl(post.image, '')} alt="Post" style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 20px', borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2">
          {/* Like button */}
          <button
            onClick={toggleLike}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: isLiked ? 'rgba(239,68,68,0.1)' : 'transparent',
              fontSize: '14px', fontWeight: '600',
              color: isLiked ? '#ef4444' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all var(--transition-base)', border: 'none'
            }}
          >
            <Heart size={18} strokeWidth={2.5} fill={isLiked ? '#ef4444' : 'none'} />
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>

          {/* Comment button */}
          <button
            onClick={toggleComments}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: showComments ? 'rgba(46,90,167,0.1)' : 'transparent',
              fontSize: '14px', fontWeight: '600',
              color: showComments ? 'var(--accent-primary)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all var(--transition-base)', border: 'none'
            }}
          >
            <MessageCircle size={18} strokeWidth={2.5} />
            <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: shareCopied ? 'rgba(34,197,94,0.1)' : 'transparent',
              fontSize: '14px', fontWeight: '600',
              color: shareCopied ? '#22c55e' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all var(--transition-base)', border: 'none'
            }}
          >
            <Share2 size={18} strokeWidth={2.5} />
            <span>{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ padding: '16px 20px', borderTop: '2px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          {/* Existing comments */}
          {comments.map(comment => (
            <div key={comment.commentId} style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
              <img
                src={getImageUrl(comment.author.avatar)}
                alt={comment.author.firstName}
                onClick={authorClickable ? () => onUserClick(comment.author.id) : undefined}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover',
                  cursor: authorClickable ? 'pointer' : 'default',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span
                    onClick={authorClickable ? () => onUserClick(comment.author.id) : undefined}
                    style={{
                      fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)',
                      cursor: authorClickable ? 'pointer' : 'default',
                    }}
                  >
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {comment.content}
                  </p>
                  {comment.image && (
                    <img
                      src={getImageUrl(comment.image, '')}
                      alt="Comment attachment"
                      style={{ marginTop: '8px', maxHeight: '200px', maxWidth: '100%', borderRadius: 'var(--radius-sm)' }}
                    />
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {/* Add comment form */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <img
              src={myAvatarSrc}
              alt="You"
              style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              {commentImagePreview && (
                <div style={{ position: 'relative', marginBottom: '8px', display: 'inline-block' }}>
                  <img
                    src={commentImagePreview}
                    alt="Preview"
                    style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                  />
                  <button
                    onClick={removeCommentImage}
                    style={{
                      position: 'absolute', top: '4px', right: '4px',
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                      width: '20px', height: '20px', cursor: 'pointer', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="Write a comment..."
                  style={{
                    flex: 1, padding: '8px 14px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '14px', outline: 'none',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <button
                  onClick={() => commentFileRef.current?.click()}
                  style={{
                    padding: '8px', border: '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)',
                    cursor: 'pointer', color: 'var(--text-muted)', display: 'flex'
                  }}
                >
                  <Image size={16} />
                </button>
                <input ref={commentFileRef} type="file" accept="image/*,.gif" onChange={handleCommentImage} style={{ display: 'none' }} />
                <button
                  onClick={submitComment}
                  disabled={submitting || !commentText.trim()}
                  style={{
                    padding: '8px', border: 'none',
                    borderRadius: 'var(--radius-full)',
                    background: commentText.trim() ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    cursor: commentText.trim() ? 'pointer' : 'default',
                    color: commentText.trim() ? 'white' : 'var(--text-muted)',
                    display: 'flex', transition: 'all var(--transition-base)'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
              {commentError && (
                <div style={{ color: 'var(--accent-danger)', fontSize: '12px', marginTop: '4px', marginLeft: '8px' }}>
                  {commentError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
