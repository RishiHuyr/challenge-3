import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../src/app';
import { Database } from '../src/models/db';
import { config } from '../src/config';

describe('EcoTrack Pro API Integration Tests', () => {
  let csrfToken = '';
  let csrfCookie = '';
  let authCookie = '';
  let testUserId = '';
  let testPostId = '';
  let testRecId = '';

  // Backup existing data files
  const filesToBackup = ['users.json', 'assessments.json', 'recommendations.json', 'gamification.json', 'purchases.json', 'posts.json'];
  const backups: Record<string, string> = {};

  beforeAll(() => {
    // Read and save current data to restore later
    filesToBackup.forEach(file => {
      const filePath = path.join(config.DATA_DIR, file);
      if (fs.existsSync(filePath)) {
        backups[file] = fs.readFileSync(filePath, 'utf8');
      }
    });
  });

  afterAll(() => {
    // Restore backed up data files
    filesToBackup.forEach(file => {
      const filePath = path.join(config.DATA_DIR, file);
      if (backups[file]) {
        fs.writeFileSync(filePath, backups[file], 'utf8');
      } else if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // delete if it didn't exist before tests
      }
    });
  });

  // 1. Health and CSRF Token Initialization
  it('GET /api/health - should return operational status and set XSRF cookie', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Parse Set-Cookie for CSRF token
    const cookies = (res.headers['set-cookie'] as unknown as string[]) || [];
    const xsrfCookiePair = cookies.find((c: string) => c.startsWith('XSRF-TOKEN='));
    if (xsrfCookiePair) {
      csrfCookie = xsrfCookiePair.split(';')[0];
      csrfToken = csrfCookie.split('=')[1];
    }
    expect(csrfToken).not.toBe('');
  });

  // 2. Authentication - Signup
  it('POST /api/auth/signup - should register a new user, initialize gamification, and return jwt cookie', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('Cookie', csrfCookie)
      .set('x-xsrf-token', csrfToken)
      .send({
        name: 'Test Environmentalist',
        email: 'testuser@green.com',
        password: 'securePassword123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('testuser@green.com');
    testUserId = res.body.data.id;

    // Parse JWT token cookie
    const cookies = (res.headers['set-cookie'] as unknown as string[]) || [];
    const authCookiePair = cookies.find((c: string) => c.startsWith('token='));
    if (authCookiePair) {
      authCookie = authCookiePair.split(';')[0];
    }
    expect(authCookie).not.toBe('');
  });

  // 3. Authentication - Login
  it('POST /api/auth/login - should authenticate user and return jwt token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrfCookie)
      .set('x-xsrf-token', csrfToken)
      .send({
        email: 'testuser@green.com',
        password: 'securePassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Environmentalist');
  });

  // 4. Authentication - Get Profile (GET /api/auth/me)
  it('GET /api/auth/me - should fetch the logged-in user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testUserId);
  });

  // 5. Authentication - Update Profile
  it('PUT /api/auth/profile - should update user details', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Cookie', `${csrfCookie}; ${authCookie}`)
      .set('x-xsrf-token', csrfToken)
      .send({
        name: 'Updated Eco Tracker Name'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Eco Tracker Name');
  });

  // 6. Carbon Calculator - Calculate emissions
  it('POST /api/calculator/assess - should calculate carbon footprint and update points', async () => {
    const res = await request(app)
      .post('/api/calculator/assess')
      .set('Cookie', `${csrfCookie}; ${authCookie}`)
      .set('x-xsrf-token', csrfToken)
      .send({
        transportation: { carKm: 500, bikeKm: 100, transitKm: 200, flightsHours: 2, rideshareKm: 50 },
        diet: { dietType: 'vegetarian' },
        energy: { electricityKwh: 150, gasKwh: 50, renewablePercent: 20 },
        waste: { recyclingPercent: 50, plasticUsageScore: 2, wasteKg: 15 },
        shopping: { fashionSpend: 50, electronicsSpend: 100, goodsSpend: 40 }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assessment.emissions.total).toBeGreaterThan(0);
    expect(res.body.data.pointsEarned).toBeGreaterThan(0);
  });

  // 7. Carbon Calculator - History
  it('GET /api/calculator/history - should retrieve assessment history list', async () => {
    const res = await request(app)
      .get('/api/calculator/history')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  // 8. AI Recommendations - List available recommendations
  it('GET /api/recommendations - should list generated suggestions', async () => {
    const res = await request(app)
      .get('/api/recommendations')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    testRecId = res.body.data[0].id;
  });

  // 9. AI Recommendations - Complete a recommendation
  it('PUT /api/recommendations/:id - should mark recommendation active/completed and award points', async () => {
    const res = await request(app)
      .put(`/api/recommendations/${testRecId}`)
      .set('Cookie', `${csrfCookie}; ${authCookie}`)
      .set('x-xsrf-token', csrfToken)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pointsAwarded).toBeGreaterThan(0);
  });

  // 10. Gamification - Get state
  it('GET /api/gamification - should get points and streak info', async () => {
    const res = await request(app)
      .get('/api/gamification')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ecoPoints).toBeGreaterThan(100); // 100 signup + assessment + completion points
  });

  // 11. Gamification - Leaderboard
  it('GET /api/gamification/leaderboard - should list users ordered by points', async () => {
    const res = await request(app)
      .get('/api/gamification/leaderboard')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(1); // Seeds + our user
    expect(res.body.data[0].ecoPoints).toBeGreaterThanOrEqual(res.body.data[1].ecoPoints);
  });

  // 12. Offset Marketplace - Projects list
  it('GET /api/marketplace/projects - should get projects to buy', async () => {
    const res = await request(app)
      .get('/api/marketplace/projects')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(4);
  });

  // 13. Offset Marketplace - Purchase project
  it('POST /api/marketplace/purchase - should exchange points for offset credit', async () => {
    // Buy Reforestation (400 points) - our user should have around 400 points now (100 signup + 150 first assess challenge + 50 assess log + 50 rec completion = 350, let's verify if we need to mock more points or if they have enough)
    // Wait, let's inject extra points to ensure the test does not fail due to insufficient points!
    const gamifications = Database.getGamification();
    const gIndex = gamifications.findIndex(g => g.userId === testUserId);
    if (gIndex !== -1) {
      gamifications[gIndex].ecoPoints += 1000; // Inject points for test
      Database.setGamification(gamifications);
    }

    const res = await request(app)
      .post('/api/marketplace/purchase')
      .set('Cookie', `${csrfCookie}; ${authCookie}`)
      .set('x-xsrf-token', csrfToken)
      .send({ projectId: 'project_reforest' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.purchase.projectTitle).toBe('Amazon Reforestation');
  });

  // 14. Offset Marketplace - Purchase history
  it('GET /api/marketplace/history - should list offset purchase receipts', async () => {
    const res = await request(app)
      .get('/api/marketplace/history')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  // 15. Community - Get feed
  it('GET /api/community/feed - should fetch the community posts feed', async () => {
    const res = await request(app)
      .get('/api/community/feed')
      .set('Cookie', `${csrfCookie}; ${authCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // 16. Community - Create post
  it('POST /api/community/feed - should create a new community post', async () => {
    const res = await request(app)
      .post('/api/community/feed')
      .set('Cookie', `${csrfCookie}; ${authCookie}`)
      .set('x-xsrf-token', csrfToken)
      .send({ content: 'Hello this is an integration test community post!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Hello this is an integration test community post!');
    testPostId = res.body.data.id;
  });

  // 17. Community - Like post
  it('POST /api/community/feed/:id/like - should like/unlike post', async () => {
    const res = await request(app)
      .post(`/api/community/feed/${testPostId}/like`)
      .set('Cookie', `${csrfCookie}; ${authCookie}`)
      .set('x-xsrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.liked).toBe(true);
    expect(res.body.data.likes).toContain(testUserId);
  });

  // 18. Community - Comment post
  it('POST /api/community/feed/:id/comment - should post comment to community thread', async () => {
    const res = await request(app)
      .post(`/api/community/feed/${testPostId}/comment`)
      .set('Cookie', `${csrfCookie}; ${authCookie}`)
      .set('x-xsrf-token', csrfToken)
      .send({ content: 'Test comment on my post!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Test comment on my post!');
  });
});
