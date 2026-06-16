import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { SkeletonLoader } from '../components/SkeletonLoader';
import './Marketplace.css';

interface OffsetProject {
  id: string;
  title: string;
  description: string;
  category: 'forestry' | 'solar' | 'wind' | 'ocean';
  costPoints: number;
  co2Offset: number;
  imageUrl: string;
  location: string;
}

interface PurchaseRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  costPoints: number;
  co2Offset: number;
  purchaseDate: string;
}

export const Marketplace: React.FC = () => {
  const [projects, setProjects] = useState<OffsetProject[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const fetchMarketplaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, purchasesRes, gamificationRes] = await Promise.all([
        apiRequest('/marketplace/projects'),
        apiRequest('/marketplace/history'),
        apiRequest('/gamification')
      ]);

      if (projectsRes.success) setProjects(projectsRes.data);
      if (purchasesRes.success) setPurchases(purchasesRes.data);
      if (gamificationRes.success) setUserPoints(gamificationRes.data.ecoPoints);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch marketplace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const handleBuyOffset = async (projectId: string) => {
    setPurchaseSuccess(null);
    try {
      const res = await apiRequest('/marketplace/purchase', {
        method: 'POST',
        body: JSON.stringify({ projectId })
      });

      if (res.success) {
        setPurchaseSuccess(res.message);
        setUserPoints(res.data.currentPoints);
        
        // Refresh purchase logs
        const historyRes = await apiRequest('/marketplace/history');
        if (historyRes.success) {
          setPurchases(historyRes.data);
        }
        
        // Clear toast after 4s
        setTimeout(() => setPurchaseSuccess(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete offset purchase.');
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'forestry': return '🌲';
      case 'solar': return '☀️';
      case 'wind': return '💨';
      case 'ocean': return '🌊';
      default: return '🌱';
    }
  };

  if (loading) {
    return (
      <main className="container" id="main-content">
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="text" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
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
          <h2>Failed to load Offset Marketplace</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchMarketplaceData}>Try Again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container" id="main-content">
      {/* Toast Alert on successful buy */}
      {purchaseSuccess && (
        <div className="purchase-toast animate-glow" role="status" aria-live="polite">
          <span role="img" aria-label="Tree symbol">🌲</span> {purchaseSuccess}
        </div>
      )}

      <div className="market-header">
        <div>
          <h1 className="market-title">Carbon Offset Marketplace</h1>
          <p className="market-subtitle">
            Redeem accumulated Eco Points for certified virtual offset credits to neutralize remaining footprint emissions.
          </p>
        </div>
        <div className="points-status-card glass-card">
          <span className="points-label">Your Points Balance</span>
          <span className="points-amt">⚡ {userPoints} <span className="points-unit">pts</span></span>
        </div>
      </div>

      {/* Offset projects deck */}
      <section className="projects-layout-grid" aria-label="Available carbon offset projects">
        {projects.map((proj) => {
          const isAffordable = userPoints >= proj.costPoints;
          return (
            <div key={proj.id} className="project-card glass-card animate-fade-in">
              <div className="project-image-wrapper">
                <img src={proj.imageUrl} alt={proj.title} className="project-card-image" />
                <span className="project-location-badge">📍 {proj.location}</span>
              </div>

              <div className="project-card-body">
                <div className="project-type-tag">
                  <span>{getCategoryEmoji(proj.category)}</span>
                  <span>{proj.category} offset</span>
                </div>

                <h2 className="project-card-title">{proj.title}</h2>
                <p className="project-card-desc">{proj.description}</p>

                <div className="project-metrics-row">
                  <div className="proj-metric">
                    <span className="metric-label">Points Cost</span>
                    <span className="metric-val points-cost">⚡ {proj.costPoints}</span>
                  </div>
                  <div className="proj-metric">
                    <span className="metric-label">CO₂ Offset equivalent</span>
                    <span className="metric-val co2-reduction">-{proj.co2Offset} kg</span>
                  </div>
                </div>

                <button
                  className={`btn btn-primary buy-offset-btn ${!isAffordable ? 'disabled' : ''}`}
                  disabled={!isAffordable}
                  onClick={() => handleBuyOffset(proj.id)}
                  aria-label={`Buy ${proj.title} offset for ${proj.costPoints} points`}
                >
                  {isAffordable ? 'Redeem Offset' : 'Insufficient Points'}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Purchase History Ledgers */}
      <section className="glass-card offset-history-section" aria-label="Offset transaction history">
        <h2 className="section-title">Purchase History & Impact</h2>
        {purchases.length === 0 ? (
          <div className="empty-history-view">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }} role="img" aria-hidden="true">
              🍃
            </span>
            <h3>No Offsets Purchased Yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Complete calculator assessments and adopt green habits to earn Eco Points to exchange here!
            </p>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th scope="col">Date Purchased</th>
                  <th scope="col">Project Funded</th>
                  <th scope="col">Eco Points Spent</th>
                  <th scope="col">Net Carbon Offsetted</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                    <td style={{ fontWeight: '600' }}>{log.projectTitle}</td>
                    <td className="cost-cell">⚡ {log.costPoints}</td>
                    <td className="offset-cell">-{log.co2Offset} kg CO₂</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};
export default Marketplace;
