const API_BASE_URL = 'http://localhost:8081/api';

// Types for API requests
export type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  nickname?: string;
  aboutMe?: string;
  avatar?: string; // Base64 encoded image
};

export type LoginData = {
  email: string;
  password: string;
};

export type UserResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  aboutMe: string;
  avatar: string;
  isPrivate: boolean;
  dateOfBirth: string;
  createdAt: string;
};

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  aboutMe: string;
  avatar: string;
  isPrivate: boolean;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
};

// to be implemented
export type EditUser = {

}

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string | { message: string; fields: Record<string, string> };
};

// Generic fetch wrapper with credentials included
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // CRITICAL: Include cookies in requests
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

// Auth API functions
export const authApi = {
  register: (data: RegisterData) =>
    request<UserResponse>('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginData) =>
    request<UserResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<null>('/logout', {
      method: 'POST',
    }),

  getMe: () => request<UserResponse>('/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nickname?: string;
    aboutMe?: string;
    avatar?: string;
  }) =>
    request<UserResponse>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updatePrivacy: (isPrivate: boolean) =>
    request<{ isPrivate: boolean }>('/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify({ isPrivate }),
    }),
};

export type FollowerUser = {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  avatar: string;
};

export type PostAuthor = {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  avatar: string;
};

export type PostResponse = {
  postId: number;
  author: PostAuthor;
  content: string;
  image: string;
  privacy: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  isLikedByViewer: boolean;
};

export type CommentResponse = {
  commentId: number;
  postId: number;
  author: PostAuthor;
  content: string;
  image: string;
  createdAt: string;
};

export type CreatePostData = {
  content: string;
  image?: string;
  privacy: 'public' | 'followers' | 'custom';
  viewers?: number[];
};

export type CreateCommentData = {
  content: string;
  image?: string;
};

// export type GroupResponse = {
//   id: string;
//   title: string;
//   description: string;
//   createdBy: string;
//   createdAt: string;
//   memberCount: string;
// };


export type CreateGroupPostData = {
  content: string;
  image?: string;
};

export type CreateGroupEventData = {
  title: string;
  description: string;
  eventTime: string;
  eventDate: string;
};

export type RespondToGroupEventData = {
  response: EventResponseChoice;
};

export type EventResponseChoice = 'going' | 'not_going';

export type GroupEventUserResponse = {
  userId: number;
  user: PostAuthor;
  response: EventResponseChoice;
};

export type GroupEventResponse = {
  id: number;
  groupId: number;
  creatorId: number;
  creator: PostAuthor;
  title: string;
  description: string;
  eventTime: string;
  createdAt: string;
  responses: GroupEventUserResponse[];
};

export const userApi = {
  getProfile: (userId: number) =>
    request<UserProfile>(`/users/${userId}`),

  getUserPosts: (userId: number) =>
    request<PostResponse[]>(`/users/${userId}/posts`),

  getUserFollowers: (userId: number) =>
    request<FollowerUser[]>(`/users/${userId}/followers`),

  getUserFollowing: (userId: number) =>
    request<FollowerUser[]>(`/users/${userId}/following`),

  searchUsers: (query: string) =>
    request<FollowerUser[]>(`/users?q=${encodeURIComponent(query)}`),

  getSuggestedUsers: () =>
    request<FollowerUser[]>('/users/suggested'),

  getRelationship: (userId: number) =>
    request<{ isFollowing: boolean; isPending: boolean }>(`/users/${userId}/relationship`),

  follow: (userId: number) =>
    request<null>(`/users/${userId}/follow-requests`, { method: 'POST' }),

  unfollow: (userId: number) =>
    request<null>(`/users/${userId}/follow`, { method: 'DELETE' }),
};

export const postApi = {
  getFeed: () =>
    request<PostResponse[]>('/feed'),

  createPost: (data: CreatePostData) =>
    request<PostResponse>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getComments: (postId: number) =>
    request<CommentResponse[]>(`/posts/${postId}/comments`),

  createComment: (postId: number, data: CreateCommentData) =>
    request<CommentResponse>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPost: (postId: number) =>
    request<PostResponse>(`/posts/${postId}`),

  deletePost: (postId: number) =>
    request<null>(`/posts/${postId}`, { method: 'DELETE' }),

  likePost: (postId: number) =>
    request<{ likeCount: number; isLikedByViewer: boolean }>(`/posts/${postId}/like`, {
      method: 'POST',
    }),

  unlikePost: (postId: number) =>
    request<{ likeCount: number; isLikedByViewer: boolean }>(`/posts/${postId}/like`, {
      method: 'DELETE',
    }),
};

export type NotificationResponse = {
  id: number;
  userId: number;
  actorId: number;
  actorName: string;
  actorAvatar: string;
  type: string;
  referenceId: number;
  isRead: boolean;
  createdAt: string;
};

export const notificationApi = {
  getAll: () =>
    request<NotificationResponse[]>('/notifications'),

  getUnreadCount: () =>
    request<{ count: number }>('/notifications/unread-count'),

  markRead: (id: number) =>
    request<null>(`/notifications/${id}/read`, { method: 'POST' }),

  markAllRead: () =>
    request<null>('/notifications/read-all', { method: 'POST' }),
};

export type FollowRequestData = {
  id: number;
  requesterId: number;
  firstName: string;
  lastName: string;
  nickname: string;
  avatar: string;
  createdAt: string;
};

export const followApi = {
  getIncoming: () =>
    request<FollowRequestData[]>('/follow-requests'),

  getSent: () =>
    request<FollowRequestData[]>('/follow-requests/sent'),

  accept: (requestId: number) =>
    request<null>(`/follow-requests/${requestId}/accept`, { method: 'POST' }),

  decline: (requestId: number) =>
    request<null>(`/follow-requests/${requestId}/decline`, { method: 'POST' }),

  cancel: (requestId: number) =>
    request<null>(`/follow-requests/${requestId}`, { method: 'DELETE' }),
};

// Group types
export type GroupCreator = {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  avatar: string;
};

export type GroupResponse = {
  id: number;
  title: string;
  description: string;
  image: string;
  creatorId: number;
  creator: GroupCreator;
  memberCount: number;
  isMember: boolean;
  isJoinRequestPending: boolean;
  isOwner: boolean;
  hasPendingRequest: boolean;
  createdAt: string;
};

export type CreateGroupData = {
  title: string;
  description: string;
  image?: string;
};

export type UpdateGroupData = {
  title: string;
  description: string;
  image?: string;
};



export const groupInvitationApi = {
  getMyInvitations: () =>
    request<GroupInvitation[]>('/group-invitations'),

  accept: (invId: number) =>
    request<null>(`/group-invitations/${invId}/accept`, { method: 'POST' }),

  decline: (invId: number) =>
    request<null>(`/group-invitations/${invId}/decline`, { method: 'POST' }),
};

export type GroupInvitation = {
  id: number;
  groupId: number;
  groupTitle: string;
  inviterId: number;
  inviterName: string;
  status: string;
  createdAt: string;
};

export type JoinRequest = {
  id: number;
  groupId: number;
  requesterId: number;
  requesterName: string;
  status: string;
  createdAt: string;
};

export const joinRequestApi = {
  accept: (reqId: number) =>
    request<null>(`/join-requests/${reqId}/accept`, { method: 'POST' }),

  decline: (reqId: number) =>
    request<null>(`/join-requests/${reqId}/decline`, { method: 'POST' }),
};

export const groupApi = {
  listGroups: () =>
    request<GroupResponse[]>('/groups'),

  inviteUser: (groupId: number | string, inviteeId: number) =>
    request<null>(`/groups/${groupId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ inviteeId }),
    }),

  joinGroup: (groupId: number) =>
    request<null>(`/groups/${groupId}/join-requests`, {
      method: 'POST',
    }),

  leaveGroup: (groupId: number | string) =>
    request<null>(`/groups/${groupId}/leave`, {
      method: 'POST',
    }),

  // inviteUser: (groupId: number | string, data: { email?: string; userId?: number }) =>
  //   request<null>(`/groups/${groupId}/invitations`, {
  //     method: 'POST',
  //     body: JSON.stringify(data),
  //   }),

  createGroup: (data: CreateGroupData) =>
    request<GroupResponse>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGroup: (groupId: number | string, data: UpdateGroupData) =>
    request<GroupResponse>(`/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getGroup: (groupId: number | string) =>
    request<GroupResponse>(`/groups/${groupId}`),

  getGroupPosts: (groupId: number | string) =>
    request<PostResponse[]>(`/groups/${groupId}/posts`),

  createGroupPost: (groupId: number | string, data: CreateGroupPostData) =>
    request<PostResponse>(`/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createGroupEvent: (groupId: number | string, data: CreateGroupEventData) =>
    request<GroupEventResponse>(`/groups/${groupId}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  respondToGroupEvent: (
    groupId: number | string,
    eventId: number | string,
    data: RespondToGroupEventData,
  ) =>
    request<GroupEventResponse>(`/groups/${groupId}/events/${eventId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGroupEvents: (groupId: number | string) =>
    request<GroupEventResponse[]>(`/groups/${groupId}/events`),

  getGroupEvent: (groupId: number | string, eventId: number | string) =>
    request<GroupEventResponse>(`/groups/${groupId}/events/${eventId}`),

  getGroupEventResponses: (groupId: number | string, eventId: number | string) =>
    request<GroupEventUserResponse[]>(`/groups/${groupId}/events/${eventId}/responses`),

  deleteGroup: (groupId: number | string) =>
    request<null>(`/groups/${groupId}`, {
      method: 'DELETE',
    }),

  getGroupMembers: (groupId: number | string) =>
    request<FollowerUser[]>(`/groups/${groupId}/members`),

  removeGroupMember: (groupId: number | string, userId: number | string) =>
    request<null>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),
};

export type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
};

export type ConversationPreview = {
  userId: number;
  firstName: string;
  lastName: string;
  nickname: string;
  avatar: string;
  lastMessage: string;
  lastSenderId: number;
  lastMessageAt: string;
  unreadCount: number;
};

export const chatApi = {
  listConversations: () =>
    request<ConversationPreview[]>('/conversations'),

  getMessages: (otherUserId: number) =>
    request<Message[]>(`/conversations/${otherUserId}/messages`),

  sendMessage: (otherUserId: number, content: string) =>
    request<Message>(`/conversations/${otherUserId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  markAsRead: (otherUserId: number) =>
    request<null>(`/conversations/${otherUserId}/read`, { method: 'POST' }),
};



export default authApi;



