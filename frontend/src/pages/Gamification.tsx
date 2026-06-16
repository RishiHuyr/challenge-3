import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SkeletonLoader } from '../components/SkeletonLoader';
import './Gamification.css';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  pointsReward: number;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

interface GamificationState {
  userId: string;
  ecoPoints: number;
  streak: number;
  badges: Badge[];
  challenges: Challenge[];
  sustainabilityScore: number;
}

interface LeaderboardUser {
  userId: string;
  name: string;
  ecoPoints: number;
  streak: number;
  sustainabilityScore: number;
  badgesCount: number;
}

export const Gamification: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<GamificationState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGamificationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stateRes, leaderRes] = await Promise.all([
        apiRequest('/gamification'),
        apiRequest('/gamification/leaderboard')
      ]);

      if (stateRes.success) setState(stateRes.data);
      if (leaderRes.success) setLeaderboard(leaderRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch gamification details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamificationData();
  }, []);

  if (loading) {
    return (
      <main className="container" id="main-content">
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="text" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2rem' }}>
            <SkeletonLoader type="card" />
            <SkeletonLoader type="chart" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container" id="main-content" role="alert">
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--danger-color)' }}>
          <h2>Failed to load Leaderboard & Point achievements</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchGamificationData}>Try Again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container" id="main-content">
      <div className="gamification-header">
        <h1 className="gamification-title">Eco Points & Achievements</h1>
        <p className="gamification-subtitle">
          Earn points by completing assessments, finishing reduction actions, and climbing the community leaderboard!
        </p>
      </div>

      {/* Overview Cards */}
      <section className="game-stats-row" aria-label="Point Statistics Overview">
        <div className="glass-card game-stat-card points">
          <span className="game-stat-icon" role="img" aria-hidden="true">⚡</span>
          <div>
            <span className="game-stat-label">Eco Points Balance</span>
            <p className="game-stat-value">{state ? state.ecoPoints : 0}</p>
            <p className="game-stat-subtext">Spend points in the Offset Marketplace</p>
          </div>
        </div>

        <div className="glass-card game-stat-card streak">
          <span className="game-stat-icon" role="img" aria-hidden="true">🔥</span>
          <div>
            <span className="game-stat-label">Active Log Streak</span>
            <p className="game-stat-value">{state ? state.streak : 0} <span className="game-stat-unit">days</span></p>
            <p className="game-stat-subtext">Assess regularly to maintain your streak!</p>
          </div>
        </div>

        <div className="glass-card game-stat-card score">
          <span className="game-stat-icon" role="img" aria-hidden="true">🌱</span>
          <div>
            <span className="game-stat-label">Sustainability Score</span>
            <p className="game-stat-value">{state ? state.sustainabilityScore : 0}<span className="game-stat-unit">/100</span></p>
            <p className="game-stat-subtext">Higher score represents lower emissions</p>
          </div>
        </div>
      </section>

      {/* Main Grid: Leaderboard (Left) vs Challenges & Badges (Right) */}
      <div className="game-main-grid">
        {/* Leaderboard panel */}
        <section className="glass-card leaderboard-section" aria-label="Community Leaderboard Rankings">
          <h2 className="section-title">Community Leaderboard</h2>
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">User</th>
                  <th scope="col">Eco Points</th>
                  <th scope="col">Score</th>
                  <th scope="col">Badges</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => {
                  const isCurrentUser = user && item.userId === user.id;
                  const rank = index + 1;
                  let medal = '';
                  if (rank === 1) medal = '🥇';
                  else if (rank === 2) medal = '🥈';
                  else if (rank === 3) medal = '🥉';

                  return (
                    <tr key={item.userId} className={isCurrentUser ? 'current-user-row' : ''}>
                      <td className="rank-cell">
                        {medal ? <span className="medal-icon">{medal}</span> : rank}
                      </td>
                      <td className="user-cell">
                        <span className="user-name">{item.name}</span>
                        {isCurrentUser && <span className="current-user-badge">You</span>}
                      </td>
                      <td className="points-cell">{item.ecoPoints}</td>
                      <td className="score-cell">{item.sustainabilityScore}</td>
                      <td className="badges-cell">{item.badgesCount} 🏆</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Challenges and Badges section */}
        <div className="challenges-badges-column">
          {/* Challenges Panel */}
          <section className="glass-card achievements-section" aria-label="Completed and Available Challenges">
            <h2 className="section-title">Achievements & Goals</h2>
            {state ? (
              <ul className="challenges-list-detail">
                {state.challenges.map((chal) => (
                  <li key={chal.id} className={`challenge-detail-item ${chal.completed ? 'completed' : ''}`}>
                    <div className="challenge-item-header">
                      <div className="challenge-item-meta">
                        <span className="challenge-bullet" role="img" aria-hidden="true">
                          {chal.completed ? '✅' : '🎯'}
                        </span>
                        <div>
                          <h3 className="challenge-item-title">{chal.title}</h3>
                          <p className="challenge-item-desc">{chal.description}</p>
                        </div>
                      </div>
                      <span className={`challenge-reward-badge ${chal.completed ? 'done' : ''}`}>
                        {chal.completed ? 'Earned' : `+${chal.pointsReward} pts`}
                      </span>
                    </div>

                    <div className="challenge-progress-details">
                      <label htmlFor={`progress-detail-${chal.id}`} className="screen-reader-only">
                        Progress for {chal.title}: {chal.currentValue} of {chal.targetValue}
                      </label>
                      <progress
                        id={`progress-detail-${chal.id}`}
                        max={chal.targetValue}
                        value={chal.currentValue}
                        className="challenge-detail-progress-bar"
                      ></progress>
                      <span className="progress-fraction-detail">
                        {chal.currentValue} / {chal.targetValue}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Loading achievements...</p>
            )}
          </section>

          {/* Badges Inventory Panel */}
          <section className="glass-card badges-section" aria-label="Earned Badge Collection">
            <h2 className="section-title">Unlocked Badges</h2>
            {state && state.badges.length === 0 ? (
              <div className="empty-badges-view">
                <span className="empty-badge-icon" role="img" aria-hidden="true">🎖️</span>
                <h3>No Badges Unlocked Yet</h3>
                <p>Complete challenges and reduce carbon emissions to collect achievement badges!</p>
              </div>
            ) : (
              <div className="badges-grid-layout">
                {state && state.badges.map((badge) => (
                  <div key={badge.id} className="badge-inventory-card glass-card">
                    <span className="badge-inventory-icon" role="img" aria-label={`Badge symbol: ${badge.name}`}>
                      {badge.icon}
                    </span>
                    <h3 className="badge-inventory-name">{badge.name}</h3>
                    <p className="badge-inventory-desc">{badge.description}</p>
                    <span className="badge-unlocked-date">
                      Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};
export default Gamification;
