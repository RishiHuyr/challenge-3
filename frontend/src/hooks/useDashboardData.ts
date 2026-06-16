import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

export interface AssessmentData {
  id: string;
  date: string;
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

export interface GamificationData {
  userId: string;
  ecoPoints: number;
  streak: number;
  badges: Array<{ id: string; name: string; description: string; icon: string; unlockedAt: string }>;
  challenges: Array<{ id: string; title: string; description: string; pointsReward: number; targetValue: number; currentValue: number; completed: boolean }>;
  sustainabilityScore: number;
}

export interface PurchaseData {
  id: string;
  projectId: string;
  projectTitle: string;
  costPoints: number;
  co2Offset: number;
  purchaseDate: string;
}

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessRes, gameRes, purchaseRes] = await Promise.all([
        apiRequest('/calculator/history'),
        apiRequest('/gamification'),
        apiRequest('/marketplace/history')
      ]);

      if (assessRes.success) setAssessments(assessRes.data);
      if (gameRes.success) setGamification(gameRes.data);
      if (purchaseRes.success) setPurchases(purchaseRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Compute metrics
  const latestAssessment = assessments[0] || null;
  const previousAssessment = assessments[1] || null;

  // Total footprint based on latest assessment (or 0 if none completed)
  const currentFootprint = latestAssessment ? latestAssessment.emissions.total : 0;
  
  // Total offset credit from purchased offset projects
  const totalOffsets = purchases.reduce((sum, p) => sum + p.co2Offset, 0);

  // Net carbon = Current Footprint - Monthly offset contribution (e.g. offsets count towards direct carbon reductions)
  const netFootprint = Math.max(0, currentFootprint - totalOffsets);

  // Reduction percentage compared to previous assessment (or vs baseline of 1500kg if no previous exists)
  let reductionPercentage = 0;
  if (latestAssessment) {
    const baseline = previousAssessment ? previousAssessment.emissions.total : 1500;
    if (baseline > 0) {
      reductionPercentage = Math.round(((baseline - latestAssessment.emissions.total) / baseline) * 100);
    }
  }

  // Formatting historical assessments for area and line charts (reverse chronological to chronological)
  const chartHistory = [...assessments].reverse().map(a => {
    const dateObj = new Date(a.createdAt);
    const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      name: label,
      total: a.emissions.total,
      transportation: a.emissions.transportation,
      diet: a.emissions.diet,
      energy: a.emissions.energy,
      waste: a.emissions.waste,
      shopping: a.emissions.shopping,
      score: a.sustainabilityScore
    };
  });

  // Category shares for Pie Chart (latest assessment)
  const categoryEmissions = latestAssessment
    ? [
        { name: 'Transit', value: latestAssessment.emissions.transportation, color: '#3b82f6' },
        { name: 'Diet', value: latestAssessment.emissions.diet, color: '#10b981' },
        { name: 'Energy', value: latestAssessment.emissions.energy, color: '#f59e0b' },
        { name: 'Waste', value: latestAssessment.emissions.waste, color: '#8b5cf6' },
        { name: 'Shopping', value: latestAssessment.emissions.shopping, color: '#ec4899' }
      ]
    : [];

  // Comparison vs standard average
  const comparisonData = latestAssessment
    ? [
        { category: 'Transit', You: latestAssessment.emissions.transportation, Average: 250 },
        { category: 'Diet', You: latestAssessment.emissions.diet, Average: 200 },
        { category: 'Energy', You: latestAssessment.emissions.energy, Average: 300 },
        { category: 'Waste', You: latestAssessment.emissions.waste, Average: 80 },
        { category: 'Shopping', You: latestAssessment.emissions.shopping, Average: 180 }
      ]
    : [];

  return {
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
    comparisonData,
    refetch: fetchAllData
  };
};
