import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import './Calculator.css';

interface FormState {
  transportation: { carKm: string; bikeKm: string; transitKm: string; flightsHours: string; rideshareKm: string };
  diet: { dietType: 'vegan' | 'vegetarian' | 'mixed' | 'heavy-meat' };
  energy: { electricityKwh: string; gasKwh: string; renewablePercent: string };
  waste: { recyclingPercent: string; plasticUsageScore: string; wasteKg: string };
  shopping: { fashionSpend: string; electronicsSpend: string; goodsSpend: string };
}

const initialFormState: FormState = {
  transportation: { carKm: '0', bikeKm: '0', transitKm: '0', flightsHours: '0', rideshareKm: '0' },
  diet: { dietType: 'mixed' },
  energy: { electricityKwh: '0', gasKwh: '0', renewablePercent: '0' },
  waste: { recyclingPercent: '0', plasticUsageScore: '3', wasteKg: '0' },
  shopping: { fashionSpend: '0', electronicsSpend: '0', goodsSpend: '0' }
};

export const Calculator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveEmissions, setLiveEmissions] = useState({ transportation: 0, diet: 230, energy: 0, waste: 36, shopping: 0, total: 266 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ pointsEarned: number; streakIncremented: boolean; total: number } | null>(null);
  const navigate = useNavigate();

  // Run live calculations on form state updates
  useEffect(() => {
    const car = parseFloat(form.transportation.carKm) || 0;
    const transit = parseFloat(form.transportation.transitKm) || 0;
    const flights = parseFloat(form.transportation.flightsHours) || 0;
    const rideshare = parseFloat(form.transportation.rideshareKm) || 0;
    const transCo2 = car * 0.171 + transit * 0.046 + flights * 90 + rideshare * 0.08;

    let dietCo2 = 230;
    if (form.diet.dietType === 'vegan') dietCo2 = 90;
    else if (form.diet.dietType === 'vegetarian') dietCo2 = 140;
    else if (form.diet.dietType === 'heavy-meat') dietCo2 = 380;

    const electricity = parseFloat(form.energy.electricityKwh) || 0;
    const gas = parseFloat(form.energy.gasKwh) || 0;
    const renewable = parseFloat(form.energy.renewablePercent) || 0;
    const energyCo2 = (electricity * 0.38 + gas * 0.18) * (1 - renewable / 100);

    const wasteVal = parseFloat(form.waste.wasteKg) || 0;
    const recycle = parseFloat(form.waste.recyclingPercent) || 0;
    const plasticScore = parseFloat(form.waste.plasticUsageScore) || 3;
    const wasteCo2 = (wasteVal * 0.45) * (1 - (recycle / 100) * 0.8) + plasticScore * 12;

    const fashion = parseFloat(form.shopping.fashionSpend) || 0;
    const electronics = parseFloat(form.shopping.electronicsSpend) || 0;
    const goods = parseFloat(form.shopping.goodsSpend) || 0;
    const shoppingCo2 = fashion * 0.45 + electronics * 0.85 + goods * 0.32;

    const total = Math.round(transCo2 + dietCo2 + energyCo2 + wasteCo2 + shoppingCo2);

    setLiveEmissions({
      transportation: Math.round(transCo2),
      diet: Math.round(dietCo2),
      energy: Math.round(energyCo2),
      waste: Math.round(wasteCo2),
      shopping: Math.round(shoppingCo2),
      total
    });
  }, [form]);

  // Validation function
  const validateStep = (currentStep: number): boolean => {
    const stepErrors: Record<string, string> = {};
    const positiveNumberRegex = /^\d+(\.\d+)?$/;

    if (currentStep === 1) {
      const { carKm, bikeKm, transitKm, flightsHours, rideshareKm } = form.transportation;
      if (!positiveNumberRegex.test(carKm)) stepErrors.carKm = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(bikeKm)) stepErrors.bikeKm = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(transitKm)) stepErrors.transitKm = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(flightsHours)) stepErrors.flightsHours = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(rideshareKm)) stepErrors.rideshareKm = 'Must be a valid positive number.';
    }

    if (currentStep === 3) {
      const { electricityKwh, gasKwh, renewablePercent } = form.energy;
      if (!positiveNumberRegex.test(electricityKwh)) stepErrors.electricityKwh = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(gasKwh)) stepErrors.gasKwh = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(renewablePercent)) {
        stepErrors.renewablePercent = 'Must be a valid positive number.';
      } else {
        const val = parseFloat(renewablePercent);
        if (val < 0 || val > 100) stepErrors.renewablePercent = 'Renewable energy percentage must be between 0 and 100.';
      }
    }

    if (currentStep === 4) {
      const { recyclingPercent, plasticUsageScore, wasteKg } = form.waste;
      if (!positiveNumberRegex.test(wasteKg)) stepErrors.wasteKg = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(recyclingPercent)) {
        stepErrors.recyclingPercent = 'Must be a valid positive number.';
      } else {
        const val = parseFloat(recyclingPercent);
        if (val < 0 || val > 100) stepErrors.recyclingPercent = 'Recycling percentage must be between 0 and 100.';
      }
      const pVal = parseInt(plasticUsageScore, 10);
      if (isNaN(pVal) || pVal < 1 || pVal > 5) stepErrors.plasticUsageScore = 'Plastic score must be between 1 and 5.';
    }

    if (currentStep === 5) {
      const { fashionSpend, electronicsSpend, goodsSpend } = form.shopping;
      if (!positiveNumberRegex.test(fashionSpend)) stepErrors.fashionSpend = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(electronicsSpend)) stepErrors.electronicsSpend = 'Must be a valid positive number.';
      if (!positiveNumberRegex.test(goodsSpend)) stepErrors.goodsSpend = 'Must be a valid positive number.';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleInputChange = (section: keyof FormState, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        transportation: {
          carKm: parseFloat(form.transportation.carKm),
          bikeKm: parseFloat(form.transportation.bikeKm),
          transitKm: parseFloat(form.transportation.transitKm),
          flightsHours: parseFloat(form.transportation.flightsHours),
          rideshareKm: parseFloat(form.transportation.rideshareKm)
        },
        diet: {
          dietType: form.diet.dietType
        },
        energy: {
          electricityKwh: parseFloat(form.energy.electricityKwh),
          gasKwh: parseFloat(form.energy.gasKwh),
          renewablePercent: parseFloat(form.energy.renewablePercent)
        },
        waste: {
          recyclingPercent: parseFloat(form.waste.recyclingPercent),
          plasticUsageScore: parseFloat(form.waste.plasticUsageScore),
          wasteKg: parseFloat(form.waste.wasteKg)
        },
        shopping: {
          fashionSpend: parseFloat(form.shopping.fashionSpend),
          electronicsSpend: parseFloat(form.shopping.electronicsSpend),
          goodsSpend: parseFloat(form.shopping.goodsSpend)
        }
      };

      const res = await apiRequest('/calculator/assess', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setSuccessData({
          pointsEarned: res.data.pointsEarned,
          streakIncremented: res.data.streakIncremented,
          total: res.data.assessment.emissions.total
        });
      }
    } catch (err: any) {
      setErrors({ api: err.message || 'Failed to submit carbon assessment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If calculation was completed successfully
  if (successData) {
    return (
      <main className="container" id="main-content">
        <div className="success-panel glass-card animate-fade-in" role="status" aria-live="polite">
          <span className="success-icon" role="img" aria-hidden="true">🎉</span>
          <h1>Assessment Completed!</h1>
          <p className="success-subtitle">Your monthly carbon footprint has been calculated.</p>

          <div className="result-metric-box">
            <p className="result-label">Your Emissions Output</p>
            <p className="result-value">{successData.total} <span className="result-unit">kg CO₂ / month</span></p>
          </div>

          <div className="awards-box">
            <div className="award-item">
              <span className="award-icon" role="img" aria-hidden="true">⚡</span>
              <div>
                <h3>+{successData.pointsEarned} Eco Points</h3>
                <p>Added to your achievements balance</p>
              </div>
            </div>
            {successData.streakIncremented && (
              <div className="award-item">
                <span className="award-icon" role="img" aria-hidden="true">🔥</span>
                <div>
                  <h3>Streak Extended!</h3>
                  <p>Congratulations on logging assessments consecutively!</p>
                </div>
              </div>
            )}
          </div>

          <div className="success-actions">
            <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
            <Link to="/recommendations" className="btn btn-secondary">View Personalized Recommendations</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container" id="main-content">
      <h1 className="screen-reader-only">Carbon Footprint Calculator</h1>

      <div className="calc-layout">
        {/* Wizard Panel */}
        <div className="glass-card calc-wizard-panel">
          {/* Progress Header */}
          <div className="wizard-progress-header">
            <span className="step-indicator">Step {step} of 5</span>
            <div className="step-progress-bar-container">
              <div className="step-progress-bar-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
            </div>
            <h2 className="step-title">
              {step === 1 && 'Transportation Patterns'}
              {step === 2 && 'Dietary Choices'}
              {step === 3 && 'Home Energy Usage'}
              {step === 4 && 'Household Waste & Recycling'}
              {step === 5 && 'Shopping & Consumer Spend'}
            </h2>
          </div>

          {errors.api && (
            <div className="auth-error-alert" role="alert">
              <span>⚠️</span>
              <span className="error-text">{errors.api}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="calc-form" noValidate>
            {/* Step 1: Transportation */}
            {step === 1 && (
              <div className="wizard-step-content">
                <p className="step-description">Enter your approximate monthly travel distances below.</p>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="carKm">Solo Car Travel (km / month)</label>
                  <input
                    id="carKm"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.transportation.carKm}
                    onChange={(e) => handleInputChange('transportation', 'carKm', e.target.value)}
                  />
                  {errors.carKm && <span className="input-error-msg">{errors.carKm}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="transitKm">Public Transportation (bus/train in km / month)</label>
                  <input
                    id="transitKm"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.transportation.transitKm}
                    onChange={(e) => handleInputChange('transportation', 'transitKm', e.target.value)}
                  />
                  {errors.transitKm && <span className="input-error-msg">{errors.transitKm}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="rideshareKm">Ride-sharing (UberPool/carpool in km / month)</label>
                  <input
                    id="rideshareKm"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.transportation.rideshareKm}
                    onChange={(e) => handleInputChange('transportation', 'rideshareKm', e.target.value)}
                  />
                  {errors.rideshareKm && <span className="input-error-msg">{errors.rideshareKm}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="flightsHours">Air Travel (flight hours / month)</label>
                  <input
                    id="flightsHours"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.transportation.flightsHours}
                    onChange={(e) => handleInputChange('transportation', 'flightsHours', e.target.value)}
                  />
                  {errors.flightsHours && <span className="input-error-msg">{errors.flightsHours}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bikeKm">Bicycle/Walk Commutes (km / month)</label>
                  <input
                    id="bikeKm"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.transportation.bikeKm}
                    onChange={(e) => handleInputChange('transportation', 'bikeKm', e.target.value)}
                  />
                  {errors.bikeKm && <span className="input-error-msg">{errors.bikeKm}</span>}
                </div>
              </div>
            )}

            {/* Step 2: Diet */}
            {step === 2 && (
              <div className="wizard-step-content">
                <p className="step-description">Select the option that matches your general diet habits.</p>
                
                <div className="diet-options-grid" role="radiogroup" aria-label="Dietary option selection">
                  {[
                    { type: 'vegan', label: 'Vegan', desc: 'No animal products whatsoever. Lowest carbon footprint.', icon: '🥗' },
                    { type: 'vegetarian', label: 'Vegetarian', desc: 'No meat, but eats dairy/eggs. Moderately low footprint.', icon: '🍳' },
                    { type: 'mixed', label: 'Mixed Diet', desc: 'Average amount of meats, poultry, and vegetables.', icon: '🍗' },
                    { type: 'heavy-meat', label: 'Heavy Meat', desc: 'Eats red meat or poultry daily. Highest agricultural footprint.', icon: '🥩' }
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      className={`diet-option-btn glass-card ${form.diet.dietType === opt.type ? 'active' : ''}`}
                      onClick={() => handleInputChange('diet', 'dietType', opt.type)}
                      role="radio"
                      aria-checked={form.diet.dietType === opt.type}
                    >
                      <span className="diet-opt-icon">{opt.icon}</span>
                      <div className="diet-opt-info">
                        <span className="diet-opt-name">{opt.label}</span>
                        <span className="diet-opt-desc">{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Energy */}
            {step === 3 && (
              <div className="wizard-step-content">
                <p className="step-description">Detail your household utility usage profiles.</p>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="electricityKwh">Electricity Consumed (kWh / month)</label>
                  <input
                    id="electricityKwh"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.energy.electricityKwh}
                    onChange={(e) => handleInputChange('energy', 'electricityKwh', e.target.value)}
                  />
                  {errors.electricityKwh && <span className="input-error-msg">{errors.electricityKwh}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gasKwh">Natural Gas Consumed (kWh / month)</label>
                  <input
                    id="gasKwh"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.energy.gasKwh}
                    onChange={(e) => handleInputChange('energy', 'gasKwh', e.target.value)}
                  />
                  {errors.gasKwh && <span className="input-error-msg">{errors.gasKwh}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="renewablePercent">Renewable Energy Coverage (%)</label>
                  <input
                    id="renewablePercent"
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={form.energy.renewablePercent}
                    onChange={(e) => handleInputChange('energy', 'renewablePercent', e.target.value)}
                    placeholder="e.g. 50"
                  />
                  {errors.renewablePercent && <span className="input-error-msg">{errors.renewablePercent}</span>}
                </div>
              </div>
            )}

            {/* Step 4: Waste */}
            {step === 4 && (
              <div className="wizard-step-content">
                <p className="step-description">Describe your garbage disposal and recycling rates.</p>

                <div className="form-group">
                  <label className="form-label" htmlFor="wasteKg">Household General Waste Output (kg / month)</label>
                  <input
                    id="wasteKg"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.waste.wasteKg}
                    onChange={(e) => handleInputChange('waste', 'wasteKg', e.target.value)}
                  />
                  {errors.wasteKg && <span className="input-error-msg">{errors.wasteKg}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="recyclingPercent">Recycled Waste Ratio (%)</label>
                  <input
                    id="recyclingPercent"
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={form.waste.recyclingPercent}
                    onChange={(e) => handleInputChange('waste', 'recyclingPercent', e.target.value)}
                  />
                  {errors.recyclingPercent && <span className="input-error-msg">{errors.recyclingPercent}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="plasticUsageScore">Plastic Product Purchasing Level (1 - low, 5 - high)</label>
                  <input
                    id="plasticUsageScore"
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    className="form-input-range"
                    value={form.waste.plasticUsageScore}
                    onChange={(e) => handleInputChange('waste', 'plasticUsageScore', e.target.value)}
                  />
                  <div className="range-indicator-labels">
                    <span>Minimal Plastic</span>
                    <span style={{ fontWeight: '700' }}>{form.waste.plasticUsageScore}</span>
                    <span>Heavy Plastic</span>
                  </div>
                  {errors.plasticUsageScore && <span className="input-error-msg">{errors.plasticUsageScore}</span>}
                </div>
              </div>
            )}

            {/* Step 5: Shopping */}
            {step === 5 && (
              <div className="wizard-step-content">
                <p className="step-description">Enter average monthly expenditures on retail goods.</p>

                <div className="form-group">
                  <label className="form-label" htmlFor="fashionSpend">Fashion & Apparel Spending ($ / month)</label>
                  <input
                    id="fashionSpend"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.shopping.fashionSpend}
                    onChange={(e) => handleInputChange('shopping', 'fashionSpend', e.target.value)}
                  />
                  {errors.fashionSpend && <span className="input-error-msg">{errors.fashionSpend}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="electronicsSpend">Electronics & Gadget Spending ($ / month)</label>
                  <input
                    id="electronicsSpend"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.shopping.electronicsSpend}
                    onChange={(e) => handleInputChange('shopping', 'electronicsSpend', e.target.value)}
                  />
                  {errors.electronicsSpend && <span className="input-error-msg">{errors.electronicsSpend}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="goodsSpend">Other Consumer Goods & Retail ($ / month)</label>
                  <input
                    id="goodsSpend"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.shopping.goodsSpend}
                    onChange={(e) => handleInputChange('shopping', 'goodsSpend', e.target.value)}
                  />
                  {errors.goodsSpend && <span className="input-error-msg">{errors.goodsSpend}</span>}
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="wizard-nav-buttons">
              {step > 1 ? (
                <button type="button" className="btn btn-secondary" onClick={prevStep}>
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {step < 5 ? (
                <button type="button" className="btn btn-primary" onClick={nextStep}>
                  Next Step
                </button>
              ) : (
                <button type="submit" className="btn btn-primary animate-glow" disabled={isSubmitting}>
                  {isSubmitting ? 'Calculating...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Calculation Sidebar Panel */}
        <div className="glass-card calc-live-sidebar">
          <h2 className="sidebar-title">Live Projection</h2>
          <p className="sidebar-subtitle">Calculated real-time footprint as you adjust input values.</p>

          <div className="sidebar-metric-box">
            <span className="sidebar-metric-label">Estimated Carbon Footprint</span>
            <p className="sidebar-metric-value">{liveEmissions.total} <span className="sidebar-metric-unit">kg CO₂ / mo</span></p>
          </div>

          <div className="sidebar-breakdown-list">
            <h3 className="breakdown-list-title">Category Breakdown</h3>
            
            <div className="breakdown-item">
              <span className="breakdown-item-name">🚗 Transportation</span>
              <span className="breakdown-item-value">{liveEmissions.transportation} kg</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-item-name">🥗 Diet Choice</span>
              <span className="breakdown-item-value">{liveEmissions.diet} kg</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-item-name">💡 Home Energy</span>
              <span className="breakdown-item-value">{liveEmissions.energy} kg</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-item-name">🗑️ Waste & Trash</span>
              <span className="breakdown-item-value">{liveEmissions.waste} kg</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-item-name">🛍️ Shopping Spend</span>
              <span className="breakdown-item-value">{liveEmissions.shopping} kg</span>
            </div>
          </div>

          <div className="comparison-prompt">
            <p>Global Average Target: <strong>1,200 kg CO₂</strong></p>
            <div className="target-progress-track">
              <div
                className="target-progress-fill"
                style={{
                  width: `${Math.min(100, (liveEmissions.total / 1200) * 100)}%`,
                  backgroundColor: liveEmissions.total <= 1200 ? 'var(--primary-color)' : 'var(--danger-color)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
export default Calculator;
