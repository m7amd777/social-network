import type { User, Post, Comment, Group, Event, Notification, Chat, Message, FollowRequest } from '../types';

export const dummyUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    nickname: 'johndoe',
    aboutMe: 'Software developer passionate about building amazing applications.',
    avatar: 'https://picsum.photos/seed/user1/200/200.jpg',
    dateOfBirth: '1990-01-15',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    nickname: 'janesmith',
    aboutMe: 'Designer and creative thinker.',
    avatar: 'https://picsum.photos/seed/user2/200/200.jpg',
    dateOfBirth: '1992-05-20',
    isPublic: false,
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    email: 'mike.johnson@example.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    nickname: 'mikej',
    aboutMe: 'Tech enthusiast and startup founder.',
    avatar: 'https://picsum.photos/seed/user3/200/200.jpg',
    dateOfBirth: '1988-11-10',
    isPublic: true,
    createdAt: '2024-01-03T00:00:00Z'
  },
  {
    id: '4',
    email: 'sarah.williams@example.com',
    firstName: 'Sarah',
    lastName: 'Williams',
    nickname: 'sarahw',
    aboutMe: 'Marketing expert and content creator.',
    avatar: 'https://picsum.photos/seed/user4/200/200.jpg',
    dateOfBirth: '1995-08-25',
    isPublic: true,
    createdAt: '2024-01-04T00:00:00Z'
  }
];

export const dummyPosts: Post[] = [
  {
    id: '1',
    authorId: '1',
    author: dummyUsers[0],
    content: 'Just launched my new project! 🚀 Excited to share it with the community. Building this has been an amazing journey of learning and growth.',
    image: 'https://picsum.photos/seed/post1/600/400.jpg',
    privacy: 'public',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    likes: 42,
    comments: [],
    isLiked: false
  },
  {
    id: '2',
    authorId: '2',
    author: dummyUsers[1],
    content: 'Beautiful sunset from my morning walk. Sometimes you need to pause and appreciate the little things in life. 🌅',
    image: 'https://picsum.photos/seed/post2/600/400.jpg',
    privacy: 'followers',
    createdAt: '2024-01-15T09:15:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    likes: 28,
    comments: [],
    isLiked: true
  },
  {
    id: '3',
    authorId: '3',
    author: dummyUsers[2],
    content: 'Hot take: Coffee is better than tea. Change my mind. ☕',
    privacy: 'public',
    createdAt: '2024-01-15T08:45:00Z',
    updatedAt: '2024-01-15T08:45:00Z',
    likes: 15,
    comments: [],
    isLiked: false
  }
];

export const dummyComments: Comment[] = [
  {
    id: '1',
    postId: '1',
    authorId: '2',
    author: dummyUsers[1],
    content: 'Congratulations! This looks amazing. Can\'t wait to try it out!',
    createdAt: '2024-01-15T11:00:00Z',
    likes: 5,
    isLiked: false
  },
  {
    id: '2',
    postId: '1',
    authorId: '3',
    author: dummyUsers[2],
    content: 'Great work! The UI looks really clean and intuitive.',
    createdAt: '2024-01-15T11:30:00Z',
    likes: 3,
    isLiked: true
  }
];

export const dummyGroups: Group[] = [
  {
    id: '1',
    title: 'Web Developers Community',
    description: 'A place for web developers to share knowledge, ask questions, and collaborate on projects.',
    creatorId: '1',
    creator: dummyUsers[0],
    members: [dummyUsers[0], dummyUsers[2], dummyUsers[3]],
    posts: [],
    createdAt: '2024-01-10T00:00:00Z',
    isMember: true
  },
  {
    id: '2',
    title: 'Design & UX Enthusiasts',
    description: 'Share your design work, get feedback, and discuss the latest trends in UX/UI design.',
    creatorId: '2',
    creator: dummyUsers[1],
    members: [dummyUsers[1], dummyUsers[3]],
    posts: [],
    createdAt: '2024-01-12T00:00:00Z',
    isMember: false
  }
];

export const dummyEvents: Event[] = [
  {
    id: '1',
    groupId: '1',
    title: 'Monthly Hackathon',
    description: 'Join us for a 24-hour hackathon to build amazing projects and learn from each other.',
    dateTime: '2024-02-01T09:00:00Z',
    creatorId: '1',
    creator: dummyUsers[0],
    responses: [
      { userId: '2', user: dummyUsers[1], response: 'going' },
      { userId: '3', user: dummyUsers[2], response: 'going' }
    ],
    createdAt: '2024-01-15T12:00:00Z'
  }
];

export const dummyNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'follow_request',
    title: 'New Follow Request',
    message: 'Jane Smith wants to follow you',
    isRead: false,
    createdAt: '2024-01-15T13:00:00Z',
    relatedUserId: '2',
    relatedUser: dummyUsers[1]
  },
  {
    id: '2',
    userId: '1',
    type: 'group_invitation',
    title: 'Group Invitation',
    message: 'You\'ve been invited to join Design & UX Enthusiasts',
    isRead: false,
    createdAt: '2024-01-15T12:30:00Z',
    relatedGroupId: '2',
    relatedGroup: dummyGroups[1]
  }
];

export const dummyChats: Chat[] = [
  {
    id: '1',
    participants: [dummyUsers[0], dummyUsers[1]],
    messages: [
      {
        id: '1',
        chatId: '1',
        senderId: '2',
        sender: dummyUsers[1],
        content: 'Hey! How\'s your project going?',
        createdAt: '2024-01-15T14:00:00Z'
      },
      {
        id: '2',
        chatId: '1',
        senderId: '1',
        sender: dummyUsers[0],
        content: 'Going great! Just launched the beta version. Want to try it out?',
        createdAt: '2024-01-15T14:05:00Z'
      }
    ],
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-15T14:05:00Z'
  }
];

export const dummyFollowRequests: FollowRequest[] = [
  {
    id: '1',
    requesterId: '2',
    requester: dummyUsers[1],
    targetId: '1',
    target: dummyUsers[0],
    status: 'pending',
    createdAt: '2024-01-15T13:00:00Z'
  }
];
