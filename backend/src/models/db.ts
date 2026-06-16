import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Ensure data directory exists
if (!fs.existsSync(config.DATA_DIR)) {
  fs.mkdirSync(config.DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Assessment {
  id: string;
  userId: string;
  date: string;
  transportation: {
    carKm: number;
    bikeKm: number;
    transitKm: number;
    flightsHours: number;
    rideshareKm: number;
  };
  diet: {
    dietType: 'vegan' | 'vegetarian' | 'mixed' | 'heavy-meat';
  };
  energy: {
    electricityKwh: number;
    gasKwh: number;
    renewablePercent: number;
  };
  waste: {
    recyclingPercent: number;
    plasticUsageScore: number;
    wasteKg: number;
  };
  shopping: {
    fashionSpend: number;
    electronicsSpend: number;
    goodsSpend: number;
  };
  emissions: {
    transportation: number;
    diet: number;
    energy: number;
    waste: number;
    shopping: number;
    total: number;
  };
  sustainabilityScore: number;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'transportation' | 'diet' | 'energy' | 'waste' | 'shopping';
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  co2Savings: number;
  status: 'available' | 'active' | 'completed';
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  pointsReward: number;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

export interface GamificationState {
  userId: string;
  ecoPoints: number;
  streak: number;
  lastActiveDate?: string;
  badges: Badge[];
  challenges: Challenge[];
  sustainabilityScore: number;
}

export interface OffsetProject {
  id: string;
  title: string;
  description: string;
  category: 'forestry' | 'solar' | 'wind' | 'ocean';
  costPoints: number;
  co2Offset: number;
  imageUrl: string;
  location: string;
}

export interface OffsetPurchase {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  costPoints: number;
  co2Offset: number;
  purchaseDate: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  likes: string[]; // userIds
  comments: Comment[];
  badgeShared?: string;
  createdAt: string;
}

// Seed Data definition
const SEED_USERS: User[] = [
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    email: 'elena@ecotrack.org',
    passwordHash: '$2a$10$xyzFakeHashBcryptForMockElenaRostovaOnly',
    role: 'user',
    createdAt: '2026-01-10T12:00:00.000Z'
  },
  {
    id: 'user_marcus',
    name: 'Marcus Aurelius',
    email: 'marcus@green.com',
    passwordHash: '$2a$10$xyzFakeHashBcryptForMockMarcusAureliusOnly',
    role: 'user',
    createdAt: '2026-02-15T14:30:00.000Z'
  },
  {
    id: 'user_aisha',
    name: 'Aisha Diallo',
    email: 'aisha@ecotrack.org',
    passwordHash: '$2a$10$xyzFakeHashBcryptForMockAishaDialloOnly',
    role: 'user',
    createdAt: '2026-03-01T09:15:00.000Z'
  },
  {
    id: 'user_hiroshi',
    name: 'Hiroshi Tanaka',
    email: 'hiroshi@circular.jp',
    passwordHash: '$2a$10$xyzFakeHashBcryptForMockHiroshiTanakaOnly',
    role: 'user',
    createdAt: '2026-04-20T10:45:00.000Z'
  }
];

const SEED_GAMIFICATION = (userId: string, points: number, streak: number, score: number, badges: Badge[]): GamificationState => ({
  userId,
  ecoPoints: points,
  streak,
  lastActiveDate: new Date().toISOString().split('T')[0],
  sustainabilityScore: score,
  badges,
  challenges: [
    {
      id: 'first_assessment',
      title: 'First Assessment',
      description: 'Complete your first carbon assessment',
      category: 'calculator',
      pointsReward: 150,
      targetValue: 1,
      currentValue: 1,
      completed: true
    },
    {
      id: 'offset_purchase',
      title: 'Eco Investor',
      description: 'Purchase your first carbon offset from the marketplace',
      category: 'marketplace',
      pointsReward: 200,
      targetValue: 1,
      currentValue: 1,
      completed: true
    },
    {
      id: 'community_post',
      title: 'Eco Advocate',
      description: 'Create a post sharing your sustainability achievements',
      category: 'community',
      pointsReward: 100,
      targetValue: 1,
      currentValue: 1,
      completed: true
    },
    {
      id: 'save_carbon',
      title: 'Green Saver',
      description: 'Unlock total carbon reduction of 50kg CO₂',
      category: 'recommendations',
      pointsReward: 300,
      targetValue: 50,
      currentValue: 50,
      completed: true
    }
  ]
});

const SEED_POSTS: Post[] = [
  {
    id: 'post_1',
    userId: 'user_aisha',
    userName: 'Aisha Diallo',
    content: 'Just completed my weekly carbon footprint calculation. Cut my transit emissions by 30% by switching to cycling! 🚴‍♀️✨ Let\'s keep pushing for a cleaner planet!',
    likes: ['user_elena', 'user_marcus'],
    comments: [
      {
        id: 'comment_1_1',
        userId: 'user_elena',
        userName: 'Elena Rostova',
        content: 'That is incredible progress Aisha! Inspiring me to commute by bike tomorrow!',
        createdAt: '2026-06-15T10:15:00.000Z'
      }
    ],
    createdAt: '2026-06-15T09:00:00.000Z'
  },
  {
    id: 'post_2',
    userId: 'user_hiroshi',
    userName: 'Hiroshi Tanaka',
    content: 'Bought a virtual reforestation offset for 500 Eco Points. Every tree counts! 🌲 Let\'s fund more carbon sinks globally.',
    likes: ['user_aisha'],
    comments: [],
    badgeShared: 'Eco Champion',
    createdAt: '2026-06-14T15:20:00.000Z'
  }
];

export class Database {
  private static getFilePath(filename: string): string {
    return path.join(config.DATA_DIR, filename);
  }

  public static read<T>(filename: string, defaultVal: T): T {
    const filePath = this.getFilePath(filename);
    try {
      if (!fs.existsSync(filePath)) {
        this.write(filename, defaultVal);
        return defaultVal;
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`Error reading database file: ${filename}`, error);
      return defaultVal;
    }
  }

  public static write<T>(filename: string, data: T): void {
    const filePath = this.getFilePath(filename);
    try {
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      console.error(`Error writing database file: ${filename}`, error);
      throw new Error(`Database write error on file: ${filename}`);
    }
  }

  // Getters and Setters with seeding trigger
  public static getUsers(): User[] {
    const users = this.read<User[]>('users.json', []);
    if (users.length === 0) {
      this.write('users.json', SEED_USERS);
      return SEED_USERS;
    }
    return users;
  }

  public static setUsers(users: User[]): void {
    this.write<User[]>('users.json', users);
  }

  public static getAssessments(): Assessment[] {
    return this.read<Assessment[]>('assessments.json', []);
  }

  public static setAssessments(assessments: Assessment[]): void {
    this.write<Assessment[]>('assessments.json', assessments);
  }

  public static getRecommendations(): Recommendation[] {
    return this.read<Recommendation[]>('recommendations.json', []);
  }

  public static setRecommendations(recs: Recommendation[]): void {
    this.write<Recommendation[]>('recommendations.json', recs);
  }

  public static getGamification(): GamificationState[] {
    const gamification = this.read<GamificationState[]>('gamification.json', []);
    if (gamification.length === 0) {
      const seededGamification = [
        SEED_GAMIFICATION('user_elena', 1420, 5, 88, [
          { id: 'b1', name: 'First Step', description: 'Calculated first emissions footprint', icon: '🌱', unlockedAt: '2026-01-10T12:05:00Z' },
          { id: 'b2', name: 'Carbon Crusader', description: 'Completed 5 recommendations', icon: '⚡', unlockedAt: '2026-04-12T14:10:00Z' }
        ]),
        SEED_GAMIFICATION('user_marcus', 950, 2, 76, [
          { id: 'b1', name: 'First Step', description: 'Calculated first emissions footprint', icon: '🌱', unlockedAt: '2026-02-15T14:35:00Z' }
        ]),
        SEED_GAMIFICATION('user_aisha', 1850, 12, 92, [
          { id: 'b1', name: 'First Step', description: 'Calculated first emissions footprint', icon: '🌱', unlockedAt: '2026-03-01T09:20:00Z' },
          { id: 'b2', name: 'Eco Champion', description: 'Saved 100kg CO2', icon: '🏆', unlockedAt: '2026-05-18T10:00:00Z' },
          { id: 'b3', name: 'Carbon Crusader', description: 'Completed 5 recommendations', icon: '⚡', unlockedAt: '2026-06-02T11:45:00Z' }
        ]),
        SEED_GAMIFICATION('user_hiroshi', 1210, 4, 81, [
          { id: 'b1', name: 'First Step', description: 'Calculated first emissions footprint', icon: '🌱', unlockedAt: '2026-04-20T10:50:00Z' },
          { id: 'b2', name: 'Eco Champion', description: 'Saved 100kg CO2', icon: '🏆', unlockedAt: '2026-05-29T16:30:00Z' }
        ])
      ];
      this.write('gamification.json', seededGamification);
      return seededGamification;
    }
    return gamification;
  }

  public static setGamification(gamification: GamificationState[]): void {
    this.write<GamificationState[]>('gamification.json', gamification);
  }

  public static getPurchases(): OffsetPurchase[] {
    return this.read<OffsetPurchase[]>('purchases.json', []);
  }

  public static setPurchases(purchases: OffsetPurchase[]): void {
    this.write<OffsetPurchase[]>('purchases.json', purchases);
  }

  public static getPosts(): Post[] {
    const posts = this.read<Post[]>('posts.json', []);
    if (posts.length === 0) {
      this.write('posts.json', SEED_POSTS);
      return SEED_POSTS;
    }
    return posts;
  }

  public static setPosts(posts: Post[]): void {
    this.write<Post[]>('posts.json', posts);
  }
}
