export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  aboutMe?: string;
  avatar?: string;
  dateOfBirth: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  image?: string;
  privacy: 'public' | 'followers' | 'private';
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  image?: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

export interface Group {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator: User;
  members: User[];
  posts: Post[];
  createdAt: string;
  isMember: boolean;
}

export interface Event {
  id: string;
  groupId: string;
  title: string;
  description: string;
  dateTime: string;
  creatorId: string;
  creator: User;
  responses: EventResponse[];
  createdAt: string;
}

export interface EventResponse {
  userId: string;
  user: User;
  response: 'going' | 'not_going';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow_request' | 'group_invitation' | 'group_request' | 'event_created' | 'custom';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUserId?: string;
  relatedUser?: User;
  relatedGroupId?: string;
  relatedGroup?: Group;
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender: User;
  content: string;
  isEmoji?: boolean;
  createdAt: string;
}

export interface FollowRequest {
  id: string;
  requesterId: string;
  requester: User;
  targetId: string;
  target: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
