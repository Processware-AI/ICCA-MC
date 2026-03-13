export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  membershipLevel: 'general' | 'senior' | 'admin';
  joinDate: string;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface HikingEvent {
  id: string;
  title: string;
  description: string;
  mountain: string;
  date: string;
  meetingPoint: string;
  meetingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  maxParticipants: number;
  currentParticipants: number;
  participants: string[];
  fee: number;
  leader: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  images: string[];
  distance?: number;
  elevationGain?: number;
  estimatedDuration?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: 'general' | 'important' | 'event' | 'safety';
  isPinned: boolean;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  type: 'membership' | 'event' | 'equipment';
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  eventId?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  uploadedBy: string;
  uploadedById: string;
  eventId?: string;
  eventTitle?: string;
  likes: string[];
  createdAt: string;
}
