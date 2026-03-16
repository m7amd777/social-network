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

  getRelationship: (userId: number) =>
    request<{ isFollowing: boolean }>(`/users/${userId}/relationship`),

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
  isOwner: boolean;
  createdAt: string;
};

export type CreateGroupData = {
  title: string;
  description: string;
  image?: string;
};



export const groupApi = {
  listGroups: () =>
    request<GroupResponse[]>('/groups'),

  joinGroup: (groupId: number) =>
    request<null>(`/groups/${groupId}/join-requests`, {
      method: 'POST',
    }),

  createGroup: (data: CreateGroupData) =>
    request<GroupResponse>('/groups', {
      method: 'POST',
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
};

export default authApi;

