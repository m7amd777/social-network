import type { User, Group, Event, Notification, Chat, FollowRequest } from '../types';

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
