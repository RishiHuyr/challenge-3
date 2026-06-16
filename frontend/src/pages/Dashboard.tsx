import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const {
    loading,
    error,
    assessments,
    gamification,
    purchases,
    currentFootprint,
    totalOffsets,
    netFootprint,
    reductionPercentage,
    chartHistory,
    categoryEmissions,
    comparisonData
  } = useDashboardData();

  if (loading) {
    return (
      <main className="container" id="main-content">
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="text" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '2rem 0' }}>
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <SkeletonLoader type="chart" />
            <SkeletonLoader type="chart" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container" id="main-content" role="alert">
        <div className="glass-card" style={{ border: '1px solid var(--danger-color)', padding: '2rem', textAlign: 'center' }}>
          <h2>Failed to load Dashboard data</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </main>
    );
  }

  // If no carbon assessments exist, prompt user to complete their first assessment
  if (assessments.length === 0) {
    return (
      <main className="container" id="main-content">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <EmptyState
          icon="🌱"
          title="No Footprint Data Yet"
          description="To view your carbon metrics, emissions breakdown, and historical trends, you must first complete a carbon footprint assessment."
          actionLabel="Calculate Footprint"
          actionTo="/calculator"
        />
      </main>
    );
  }

  // Render recent activities
  const recentActivities = [];
  if (assessments[0]) {
    recentActivities.push({
      type: 'assessment',
      text: `Completed Carbon Assessment: logged ${assessments[0].emissions.total}kg CO₂.`,
      date: new Date(assessments[0].createdAt).toLocaleDateString(),
      icon: '📊'
    });
  }
  if (purchases[0]) {
    recentActivities.push({
      type: 'offset',
      text: `Purchased carbon offset: ${purchases[0].projectTitle} (-${purchases[0].co2Offset}kg CO₂).`,
      date: new Date(purchases[0].purchaseDate).toLocaleDateString(),
      icon: '🌲'
    });
  }
  if (gamification && gamification.badges.length > 0) {
    const latestBadge = gamification.badges[gamification.badges.length - 1];
    recentActivities.push({
      type: 'badge',
      text: `Unlocked Badge: "${latestBadge.name}" (${latestBadge.description})!`,
      date: new Date(latestBadge.unlockedAt).toLocaleDateString(),
      icon: latestBadge.icon
    });
  }

  // Custom Tooltip formatter for accessibility compliance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="tooltip-value" style={{ color: item.color || item.fill }}>
              {item.name}: {item.value} {item.name.toLowerCase().includes('score') ? '' : 'kg CO₂'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="container" id="main-content">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Hello, Eco Champion!</h1>
          <p className="dashboard-subtitle">Track your carbon reduction progress and earn Eco Points.</p>
        </div>
        <Link to="/calculator" className="btn btn-primary">
          Log New Assessment
        </Link>
      </div>

      {/* Grid of 4 Key Stats */}
      <section className="stats-grid" aria-label="Key Sustainability Metrics">
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper trans-bg">🚗</div>
          <div className="stat-content">
            <h2 className="stat-label">Total Footprint</h2>
            <p className="stat-value">{currentFootprint} <span className="stat-unit">kg/mo</span></p>
            <span className={`stat-trend ${reductionPercentage >= 0 ? 'good' : 'bad'}`}>
              {reductionPercentage >= 0 ? '↓' : '↑'} {Math.abs(reductionPercentage)}% vs baseline
            </span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper forest-bg">🌲</div>
          <div className="stat-content">
            <h2 className="stat-label">Carbon Offsets</h2>
            <p className="stat-value">{totalOffsets} <span className="stat-unit">kg</span></p>
            <span className="stat-desc">{purchases.length} project(s) funded</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper net-bg">🌍</div>
          <div className="stat-content">
            <h2 className="stat-label">Net Carbon</h2>
            <p className="stat-value">{netFootprint} <span className="stat-unit">kg/mo</span></p>
            <span className="stat-desc">Footprint minus offsets</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper points-bg">⚡</div>
          <div className="stat-content">
            <h2 className="stat-label">Eco Points Balance</h2>
            <p className="stat-value">{gamification ? gamification.ecoPoints : 0} <span className="stat-unit">pts</span></p>
            <span className="stat-desc">🔥 {gamification ? gamification.streak : 0} day login streak</span>
          </div>
        </div>
      </section>

      {/* Grid of Charts */}
      <section className="charts-grid" aria-label="Footprint Analysis Charts">
        {/* Pie Chart: Emissions Breakdown */}
        <div className="glass-card chart-card">
          <h2 className="chart-title">Emission Breakdown</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryEmissions}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryEmissions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart: Historical Trends */}
        <div className="glass-card chart-card">
          <h2 className="chart-title">Monthly Carbon Trends</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartHistory}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                <YAxis stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total Emissions" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Comparison vs Average */}
        <div className="glass-card chart-card">
          <h2 className="chart-title">Emissions vs Global Average</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="category" stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                <YAxis stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="You" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Average" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Sustainability Score */}
        <div className="glass-card chart-card">
          <h2 className="chart-title">Sustainability Score Progress</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                <YAxis domain={[0, 100]} stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="Sustainability Score" stroke="var(--secondary-color)" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Bottom widgets row */}
      <section className="widgets-row" aria-label="Activity and Challenge Progress">
        {/* Recent Activities Widget */}
        <div className="glass-card widget-panel">
          <h2 className="widget-title">Recent Activity</h2>
          {recentActivities.length === 0 ? (
            <p className="widget-empty">No recent activity logged yet.</p>
          ) : (
            <ul className="activity-list">
              {recentActivities.map((act, index) => (
                <li key={index} className="activity-item">
                  <span className="activity-icon" role="img" aria-hidden="true">{act.icon}</span>
                  <div className="activity-info">
                    <p className="activity-text">{act.text}</p>
                    <span className="activity-date">{act.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Challenge Progress Widget */}
        <div className="glass-card widget-panel">
          <h2 className="widget-title">Active Challenges</h2>
          {gamification ? (
            <ul className="challenge-list">
              {gamification.challenges.map((chal) => (
                <li key={chal.id} className="challenge-item">
                  <div className="challenge-meta">
                    <div>
                      <h3 className="challenge-name">{chal.title}</h3>
                      <p className="challenge-desc">{chal.description}</p>
                    </div>
                    <span className={`challenge-badge ${chal.completed ? 'completed' : ''}`}>
                      {chal.completed ? 'Completed' : `+${chal.pointsReward} pts`}
                    </span>
                  </div>
                  
                  <div className="challenge-progress-container">
                    <label htmlFor={`progress-${chal.id}`} className="screen-reader-only">
                      Progress for {chal.title}: {chal.currentValue} of {chal.targetValue}
                    </label>
                    <progress
                      id={`progress-${chal.id}`}
                      max={chal.targetValue}
                      value={chal.currentValue}
                      className="challenge-progress-bar"
                    ></progress>
                    <span className="progress-fraction">
                      {chal.currentValue} / {chal.targetValue}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="widget-empty">Loading challenges...</p>
          )}
        </div>
      </section>
    </main>
  );
};
