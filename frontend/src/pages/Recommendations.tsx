import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import './Recommendations.css';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'transportation' | 'diet' | 'energy' | 'waste' | 'shopping';
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  co2Savings: number;
  status: 'available' | 'active' | 'completed';
}

export const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [pointsToast, setPointsToast] = useState<number | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/recommendations');
      if (res.success) {
        setRecommendations(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'completed') => {
    try {
      const res = await apiRequest(`/recommendations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.success) {
        // Update local list state
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );

        // Show points earned toast
        if (res.data.pointsAwarded > 0) {
          setPointsToast(res.data.pointsAwarded);
          setTimeout(() => setPointsToast(null), 3000);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update action tip status');
    }
  };

  if (loading) {
    return (
      <main className="container" id="main-content">
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="text" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container" id="main-content" role="alert">
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--danger-color)' }}>
          <h2>Failed to load Carbon Savings Recommendations</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchRecommendations}>Try Again</button>
        </div>
      </main>
    );
  }

  // If no recommendations are seeded, it means the user has not logged an assessment
  if (recommendations.length === 0) {
    return (
      <main className="container" id="main-content">
        <h1 className="recommendations-title">Carbon Savings Tips</h1>
        <EmptyState
          icon="💡"
          title="No Recommendations Yet"
          description="Recommendations are algorithmically generated based on your carbon assessment profile. Complete an assessment first to see tips."
          actionLabel="Go to Calculator"
          actionTo="/calculator"
        />
      </main>
    );
  }

  const filteredRecs = recommendations.filter((r) => r.status === activeTab);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transportation': return '🚗';
      case 'diet': return '🥗';
      case 'energy': return '💡';
      case 'waste': return '🗑️';
      case 'shopping': return '🛍️';
      default: return '🌱';
    }
  };

  return (
    <main className="container" id="main-content">
      {pointsToast && (
        <div className="points-toast animate-glow" role="status" aria-live="polite">
          <span>⚡</span> +{pointsToast} Eco Points Earned!
        </div>
      )}

      <div className="recommendations-header">
        <h1 className="recommendations-title">AI Carbon Reduction Deck</h1>
        <p className="recommendations-subtitle">
          Personalized green choices generated based on your highest carbon emission categories.
        </p>
      </div>

      {/* Tabs selectors */}
      <div className="recs-tabs" role="tablist" aria-label="Recommendation tabs">
        {[
          { tab: 'available', label: 'Available Tips', count: recommendations.filter(r => r.status === 'available').length },
          { tab: 'active', label: 'In Progress', count: recommendations.filter(r => r.status === 'active').length },
          { tab: 'completed', label: 'Completed Actions', count: recommendations.filter(r => r.status === 'completed').length }
        ].map((item) => (
          <button
            key={item.tab}
            className={`rec-tab-btn ${activeTab === item.tab ? 'active' : ''}`}
            onClick={() => setActiveTab(item.tab as any)}
            role="tab"
            aria-selected={activeTab === item.tab}
            aria-controls="tab-content-panel"
            id={`tab-${item.tab}`}
          >
            {item.label} <span className="tab-badge-count">{item.count}</span>
          </button>
        ))}
      </div>

      {/* Tab panel content */}
      <section
        id="tab-content-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="recs-deck-grid"
      >
        {filteredRecs.length === 0 ? (
          <div className="empty-tab-view">
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} role="img" aria-hidden="true">
              {activeTab === 'available' ? '🎉' : activeTab === 'active' ? '🏃‍♂️' : '🌱'}
            </span>
            <h3>No recommendations in this list</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {activeTab === 'available' && 'You have activated or completed all current recommendations! Outstanding!'}
              {activeTab === 'active' && 'Browse available tips and activate them to start tracking in-progress goals.'}
              {activeTab === 'completed' && 'Log your active tips as complete when done to save carbon and earn points!'}
            </p>
          </div>
        ) : (
          filteredRecs.map((rec) => (
            <div key={rec.id} className="rec-card glass-card animate-fade-in">
              <div className="rec-card-header">
                <div className="rec-category-badge">
                  <span className="rec-cat-icon" role="img" aria-hidden="true">
                    {getCategoryIcon(rec.category)}
                  </span>
                  <span className="rec-cat-name">{rec.category}</span>
                </div>

                <div className="rec-metadata-badges">
                  <span className={`meta-badge impact ${rec.impact}`}>
                    {rec.impact} impact
                  </span>
                  <span className={`meta-badge difficulty ${rec.difficulty}`}>
                    {rec.difficulty}
                  </span>
                </div>
              </div>

              <h2 className="rec-card-title">{rec.title}</h2>
              <p className="rec-card-desc">{rec.description}</p>

              <div className="rec-savings-box">
                <span className="savings-label">Estimated Savings</span>
                <span className="savings-value">
                  -{rec.co2Savings} <span className="savings-unit">kg CO₂ / month</span>
                </span>
              </div>

              <div className="rec-card-actions">
                {rec.status === 'available' && (
                  <button
                    className="btn btn-primary rec-action-btn"
                    onClick={() => handleUpdateStatus(rec.id, 'active')}
                    aria-label={`Activate tip: ${rec.title}`}
                  >
                    Activate Tip
                  </button>
                )}

                {rec.status === 'active' && (
                  <button
                    className="btn btn-primary rec-action-btn complete-btn"
                    onClick={() => handleUpdateStatus(rec.id, 'completed')}
                    aria-label={`Complete tip: ${rec.title}`}
                  >
                    Mark Completed
                  </button>
                )}

                {rec.status === 'completed' && (
                  <span className="completed-label" role="status">
                    <span role="img" aria-label="Green check tick mark">✅</span> Action Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
};
export default Recommendations;
