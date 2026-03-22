const express = require('express');
const cors = require('cors');
const { swaggerUi, specs } = require('./swagger');
require('./swagger-docs'); // Load swagger documentation

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sprint Monitor API Documentation',
  customfavIcon: '/favicon.ico'
}));

// Serve Swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// ============================================
// MOCK DATA - Simulating .NET API responses
// ============================================

// Teams Data
const teams = [
  {
    id: 1,
    name: 'Alpha Team',
    description: 'Core product development team',
    defaultSprintLengthDays: 14,
    defaultTeamSize: 5,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    name: 'Beta Team',
    description: 'Platform infrastructure team',
    defaultSprintLengthDays: 14,
    defaultTeamSize: 4,
    createdAt: '2024-02-01T00:00:00Z'
  }
];

// Historical Sprints Data
const sprints = [
  {
    id: 1,
    teamId: 1,
    name: 'Sprint 2024-01',
    startDate: '2024-01-08T00:00:00Z',
    endDate: '2024-01-19T00:00:00Z',
    committedPoints: 28,
    completedPoints: 26,
    teamSize: 5,
    teamAvailability: 100,
    hadSpillover: false,
    spilloverPoints: 0,
    externalDependencies: 1,
    notes: 'Good sprint, minor scope adjustment'
  },
  {
    id: 2,
    teamId: 1,
    name: 'Sprint 2024-02',
    startDate: '2024-01-22T00:00:00Z',
    endDate: '2024-02-02T00:00:00Z',
    committedPoints: 32,
    completedPoints: 28,
    teamSize: 5,
    teamAvailability: 90,
    hadSpillover: true,
    spilloverPoints: 4,
    externalDependencies: 2,
    notes: 'One team member on PTO'
  },
  {
    id: 3,
    teamId: 1,
    name: 'Sprint 2024-03',
    startDate: '2024-02-05T00:00:00Z',
    endDate: '2024-02-16T00:00:00Z',
    committedPoints: 30,
    completedPoints: 30,
    teamSize: 5,
    teamAvailability: 100,
    hadSpillover: false,
    spilloverPoints: 0,
    externalDependencies: 1,
    notes: 'Perfect delivery!'
  },
  {
    id: 4,
    teamId: 1,
    name: 'Sprint 2024-04',
    startDate: '2024-02-19T00:00:00Z',
    endDate: '2024-03-01T00:00:00Z',
    committedPoints: 35,
    completedPoints: 29,
    teamSize: 5,
    teamAvailability: 95,
    hadSpillover: true,
    spilloverPoints: 6,
    externalDependencies: 3,
    notes: 'External dependency delays'
  },
  {
    id: 5,
    teamId: 1,
    name: 'Sprint 2024-05',
    startDate: '2024-03-04T00:00:00Z',
    endDate: '2024-03-15T00:00:00Z',
    committedPoints: 28,
    completedPoints: 27,
    teamSize: 5,
    teamAvailability: 100,
    hadSpillover: false,
    spilloverPoints: 0,
    externalDependencies: 1,
    notes: 'Stable sprint'
  },
  {
    id: 6,
    teamId: 1,
    name: 'Sprint 2024-06',
    startDate: '2024-03-18T00:00:00Z',
    endDate: '2024-03-29T00:00:00Z',
    committedPoints: 30,
    completedPoints: 25,
    teamSize: 4,
    teamAvailability: 80,
    hadSpillover: true,
    spilloverPoints: 5,
    externalDependencies: 2,
    notes: 'Reduced capacity due to training'
  },
  {
    id: 7,
    teamId: 1,
    name: 'Sprint 2024-07',
    startDate: '2024-04-01T00:00:00Z',
    endDate: '2024-04-12T00:00:00Z',
    committedPoints: 26,
    completedPoints: 26,
    teamSize: 5,
    teamAvailability: 100,
    hadSpillover: false,
    spilloverPoints: 0,
    externalDependencies: 0,
    notes: 'Conservative commitment paid off'
  },
  {
    id: 8,
    teamId: 1,
    name: 'Sprint 2024-08',
    startDate: '2024-04-15T00:00:00Z',
    endDate: '2024-04-26T00:00:00Z',
    committedPoints: 33,
    completedPoints: 31,
    teamSize: 5,
    teamAvailability: 100,
    hadSpillover: false,
    spilloverPoints: 0,
    externalDependencies: 2,
    notes: 'Strong finish'
  },
  {
    id: 9,
    teamId: 1,
    name: 'Sprint 2024-09',
    startDate: '2024-04-29T00:00:00Z',
    endDate: '2024-05-10T00:00:00Z',
    committedPoints: 34,
    completedPoints: 28,
    teamSize: 5,
    teamAvailability: 85,
    hadSpillover: true,
    spilloverPoints: 6,
    externalDependencies: 4,
    notes: 'Holiday week impact'
  },
  {
    id: 10,
    teamId: 1,
    name: 'Sprint 2024-10',
    startDate: '2024-05-13T00:00:00Z',
    endDate: '2024-05-24T00:00:00Z',
    committedPoints: 29,
    completedPoints: 29,
    teamSize: 5,
    teamAvailability: 100,
    hadSpillover: false,
    spilloverPoints: 0,
    externalDependencies: 1,
    notes: 'Back to normal velocity'
  }
];

// ============================================
// API ENDPOINTS - Matching .NET API structure
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ---- Teams Endpoints ----
app.get('/api/teams', (req, res) => {
  res.json(teams);
});

app.get('/api/teams/:id', (req, res) => {
  const team = teams.find(t => t.id === parseInt(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
});

// ---- Sprints Endpoints ----
app.get('/api/sprints', (req, res) => {
  const { teamId, limit } = req.query;
  let result = sprints;
  
  if (teamId) {
    result = result.filter(s => s.teamId === parseInt(teamId));
  }
  
  if (limit) {
    result = result.slice(0, parseInt(limit));
  }
  
  res.json(result);
});

app.get('/api/sprints/:id', (req, res) => {
  const sprint = sprints.find(s => s.id === parseInt(req.params.id));
  if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
  res.json(sprint);
});

app.get('/api/teams/:teamId/sprints', (req, res) => {
  const teamSprints = sprints.filter(s => s.teamId === parseInt(req.params.teamId));
  res.json(teamSprints);
});

// ---- Metrics Endpoint ----
app.get('/api/metrics/:teamId', (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const teamSprints = sprints.filter(s => s.teamId === teamId);
  
  if (teamSprints.length === 0) {
    return res.status(404).json({ error: 'No sprints found for team' });
  }

  const completedPoints = teamSprints.map(s => s.completedPoints);
  const averageVelocity = completedPoints.reduce((a, b) => a + b, 0) / completedPoints.length;
  
  // Calculate standard deviation
  const squaredDiffs = completedPoints.map(v => Math.pow(v - averageVelocity, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const standardDeviation = Math.sqrt(avgSquaredDiff);
  
  const spilloverCount = teamSprints.filter(s => s.hadSpillover).length;
  const spilloverRate = (spilloverCount / teamSprints.length) * 100;
  
  const metrics = {
    teamId: teamId,
    sprintCount: teamSprints.length,
    averageVelocity: Math.round(averageVelocity * 10) / 10,
    velocityStandardDeviation: Math.round(standardDeviation * 10) / 10,
    velocityCoefficient: Math.round((standardDeviation / averageVelocity) * 100) / 100,
    spilloverRate: Math.round(spilloverRate * 10) / 10,
    effectiveCapacity: Math.round(averageVelocity * 0.8 * 10) / 10,
    recentTrend: calculateTrend(teamSprints.slice(-5)),
    lastUpdated: new Date().toISOString()
  };
  
  res.json(metrics);
});

function calculateTrend(recentSprints) {
  if (recentSprints.length < 2) return 'STABLE';
  const velocities = recentSprints.map(s => s.completedPoints);
  const first = velocities.slice(0, Math.floor(velocities.length / 2));
  const second = velocities.slice(Math.floor(velocities.length / 2));
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
  
  if (avgSecond > avgFirst * 1.1) return 'IMPROVING';
  if (avgSecond < avgFirst * 0.9) return 'DECLINING';
  return 'STABLE';
}

// ---- Risk Assessment Endpoint ----
app.post('/api/risk-assessment/evaluate', (req, res) => {
  const { teamId, plannedStoryPoints, teamAvailability, teamSize, externalDependencies } = req.body;
  
  // Get team sprints for historical analysis
  const teamSprints = sprints.filter(s => s.teamId === (teamId || 1));
  
  if (teamSprints.length === 0) {
    return res.status(400).json({ error: 'No historical data available' });
  }

  // Calculate metrics
  const completedPoints = teamSprints.map(s => s.completedPoints);
  const averageVelocity = completedPoints.reduce((a, b) => a + b, 0) / completedPoints.length;
  const cvr = plannedStoryPoints / averageVelocity;
  
  // Calculate standard deviation
  const squaredDiffs = completedPoints.map(v => Math.pow(v - averageVelocity, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const standardDeviation = Math.sqrt(avgSquaredDiff);
  const velocityCoefficient = standardDeviation / averageVelocity;
  
  const spilloverCount = teamSprints.filter(s => s.hadSpillover).length;
  const spilloverRate = (spilloverCount / teamSprints.length) * 100;

  // Calculate risk factors
  const factors = [];
  let totalScore = 0;

  // Factor 1: Overcommitment Risk (CVR)
  let cvrScore = 0;
  let cvrDescription = '';
  if (cvr <= 0.8) {
    cvrScore = 0;
    cvrDescription = 'Conservative commitment within safe capacity';
  } else if (cvr <= 1.0) {
    cvrScore = 1;
    cvrDescription = 'Commitment at or near historical velocity';
  } else if (cvr <= 1.1) {
    cvrScore = 2;
    cvrDescription = 'Commitment exceeds velocity by up to 10%';
  } else {
    cvrScore = 3;
    cvrDescription = 'Significant overcommitment risk (>110% of velocity)';
  }
  factors.push({
    name: 'Overcommitment Risk',
    score: cvrScore,
    maxScore: 3,
    description: cvrDescription
  });
  totalScore += cvrScore;

  // Factor 2: Velocity Instability
  let stabilityScore = 0;
  let stabilityDescription = '';
  if (velocityCoefficient <= 0.1) {
    stabilityScore = 0;
    stabilityDescription = 'Very stable velocity (CV ≤ 10%)';
  } else if (velocityCoefficient <= 0.2) {
    stabilityScore = 1;
    stabilityDescription = 'Moderate velocity variation (CV 10-20%)';
  } else if (velocityCoefficient <= 0.3) {
    stabilityScore = 2;
    stabilityDescription = 'Notable velocity instability (CV 20-30%)';
  } else {
    stabilityScore = 3;
    stabilityDescription = 'High velocity volatility (CV > 30%)';
  }
  factors.push({
    name: 'Velocity Instability',
    score: stabilityScore,
    maxScore: 3,
    description: stabilityDescription
  });
  totalScore += stabilityScore;

  // Factor 3: Team Availability
  let availabilityScore = 0;
  let availabilityDescription = '';
  if (teamAvailability >= 95) {
    availabilityScore = 0;
    availabilityDescription = 'Full team availability';
  } else if (teamAvailability >= 85) {
    availabilityScore = 1;
    availabilityDescription = 'Minor availability reduction';
  } else if (teamAvailability >= 70) {
    availabilityScore = 2;
    availabilityDescription = 'Significant capacity reduction';
  } else {
    availabilityScore = 3;
    availabilityDescription = 'Critical capacity shortage';
  }
  factors.push({
    name: 'Team Availability',
    score: availabilityScore,
    maxScore: 3,
    description: availabilityDescription
  });
  totalScore += availabilityScore;

  // Factor 4: External Dependencies
  let dependencyScore = 0;
  let dependencyDescription = '';
  if (externalDependencies === 0) {
    dependencyScore = 0;
    dependencyDescription = 'No external dependencies';
  } else if (externalDependencies <= 2) {
    dependencyScore = 1;
    dependencyDescription = 'Few external dependencies';
  } else if (externalDependencies <= 4) {
    dependencyScore = 2;
    dependencyDescription = 'Multiple external dependencies';
  } else {
    dependencyScore = 3;
    dependencyDescription = 'High dependency risk';
  }
  factors.push({
    name: 'External Dependencies',
    score: dependencyScore,
    maxScore: 3,
    description: dependencyDescription
  });
  totalScore += dependencyScore;

  // Factor 5: Spillover History
  let spilloverScore = 0;
  let spilloverDescription = '';
  if (spilloverRate < 20) {
    spilloverScore = 0;
    spilloverDescription = 'Excellent delivery track record';
  } else if (spilloverRate < 40) {
    spilloverScore = 1;
    spilloverDescription = 'Occasional spillover history';
  } else if (spilloverRate < 60) {
    spilloverScore = 2;
    spilloverDescription = 'Frequent spillover pattern';
  } else {
    spilloverScore = 3;
    spilloverDescription = 'Chronic delivery issues';
  }
  factors.push({
    name: 'Spillover History',
    score: spilloverScore,
    maxScore: 3,
    description: spilloverDescription
  });
  totalScore += spilloverScore;

  // Determine overall risk level
  const maxPossibleScore = 15;
  let overallRisk = 'LOW';
  if (totalScore >= 10) {
    overallRisk = 'HIGH';
  } else if (totalScore >= 5) {
    overallRisk = 'MEDIUM';
  }

  // Determine confidence based on sprint count
  let confidence = 'HIGH';
  if (teamSprints.length < 3) {
    confidence = 'LOW';
  } else if (teamSprints.length < 6) {
    confidence = 'MEDIUM';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(
    factors,
    plannedStoryPoints,
    averageVelocity,
    teamAvailability,
    externalDependencies
  );

  const assessment = {
    overallRisk,
    totalScore,
    maxPossibleScore,
    confidence,
    factors,
    recommendations,
    metrics: {
      averageVelocity: Math.round(averageVelocity * 10) / 10,
      velocityStandardDeviation: Math.round(standardDeviation * 10) / 10,
      velocityCoefficient: Math.round(velocityCoefficient * 100) / 100,
      spilloverRate: Math.round(spilloverRate * 10) / 10,
      effectiveCapacity: Math.round(averageVelocity * 0.8 * 10) / 10,
      cvr: Math.round(cvr * 100) / 100,
      sprintCount: teamSprints.length
    },
    assessedAt: new Date().toISOString()
  };

  res.json(assessment);
});

function generateRecommendations(factors, plannedPoints, avgVelocity, availability, dependencies) {
  const recommendations = [];
  let id = 1;

  const overcommitmentFactor = factors.find(f => f.name === 'Overcommitment Risk');
  if (overcommitmentFactor && overcommitmentFactor.score >= 2) {
    const safeCapacity = Math.round(avgVelocity * 0.8);
    recommendations.push({
      id: id++,
      title: 'Reduce Sprint Scope',
      description: `Your planned commitment of ${plannedPoints} points exceeds your safe capacity. Consider reducing to ${safeCapacity} points (80% of velocity) to build in buffer for unplanned work.`,
      priority: overcommitmentFactor.score === 3 ? 'CRITICAL' : 'HIGH',
      actionType: 'REDUCE_SCOPE',
      suggestedChange: `Reduce to ${safeCapacity} points`,
      addressesRiskFactor: 'Overcommitment Risk'
    });
  }

  const stabilityFactor = factors.find(f => f.name === 'Velocity Instability');
  if (stabilityFactor && stabilityFactor.score >= 2) {
    recommendations.push({
      id: id++,
      title: 'Improve Estimation Practices',
      description: 'High velocity variation suggests estimation inconsistency. Consider using planning poker, breaking down large stories, or reviewing estimation accuracy retrospectively.',
      priority: 'MEDIUM',
      actionType: 'IMPROVE_ESTIMATION',
      suggestedChange: 'Review and refine estimation process',
      addressesRiskFactor: 'Velocity Instability'
    });
  }

  const availabilityFactor = factors.find(f => f.name === 'Team Availability');
  if (availabilityFactor && availabilityFactor.score >= 1) {
    const adjustedCapacity = Math.round(avgVelocity * (availability / 100) * 0.8);
    recommendations.push({
      id: id++,
      title: 'Adjust for Reduced Capacity',
      description: `With ${availability}% team availability, your effective capacity is reduced. Plan for ${adjustedCapacity} points to account for this.`,
      priority: availabilityFactor.score >= 2 ? 'HIGH' : 'MEDIUM',
      actionType: 'REDUCE_SCOPE',
      suggestedChange: `Target ${adjustedCapacity} points`,
      addressesRiskFactor: 'Team Availability'
    });
  }

  const dependencyFactor = factors.find(f => f.name === 'External Dependencies');
  if (dependencyFactor && dependencyFactor.score >= 2) {
    recommendations.push({
      id: id++,
      title: 'Mitigate Dependency Risks',
      description: `You have ${dependencies} external dependencies. Consider front-loading dependent work, establishing clear communication channels, or having contingency stories ready.`,
      priority: dependencyFactor.score === 3 ? 'HIGH' : 'MEDIUM',
      actionType: 'RESOLVE_DEPENDENCIES',
      suggestedChange: 'Create dependency mitigation plan',
      addressesRiskFactor: 'External Dependencies'
    });
  }

  const spilloverFactor = factors.find(f => f.name === 'Spillover History');
  if (spilloverFactor && spilloverFactor.score >= 2) {
    recommendations.push({
      id: id++,
      title: 'Add Safety Buffer',
      description: 'Your team has a history of spillover. Reserve 20% capacity as buffer and focus on completing committed work before pulling additional stories.',
      priority: 'MEDIUM',
      actionType: 'ADD_BUFFER',
      suggestedChange: 'Reserve 20% buffer capacity',
      addressesRiskFactor: 'Spillover History'
    });
  }

  // Always suggest splitting large stories if overcommitting
  if (plannedPoints > avgVelocity) {
    recommendations.push({
      id: id++,
      title: 'Consider Story Splitting',
      description: 'Large stories increase risk. Consider breaking down any stories larger than 5 points into smaller, independently deliverable pieces.',
      priority: 'LOW',
      actionType: 'SPLIT_STORIES',
      suggestedChange: 'Break down stories > 5 points',
      addressesRiskFactor: 'Overcommitment Risk'
    });
  }

  return recommendations;
}

// ---- Export app for testing ----
module.exports = app;

// ============================================
// FEASIBILITY STUDY DATA & ENDPOINTS
// ============================================

const feasibilityStudies = [
  {
    feasibilityId: 1,
    teamId: 1,
    teamName: 'Alpha Team',
    evaluationDate: new Date().toISOString(),
    technicalFeasibility: true,
    technicalNotes: 'Angular 17+ and .NET 8 stack fully supports all requirements. Deterministic rule-based risk engine is implementable.',
    operationalFeasibility: true,
    operationalNotes: 'System integrates with existing Scrum ceremonies. No workflow disruption expected.',
    organizationalFeasibility: true,
    organizationalNotes: 'Management fully supports adoption of predictive analytics tools.',
    integrationFeasibility: true,
    integrationNotes: 'API-first design enables Jira/Azure DevOps integration via REST endpoints.',
    mentorComments: 'The system demonstrates strong practical applicability. Rule-based approach ensures explainability. Approved for pilot deployment.',
    approvedBy: 'Dr. Industry Mentor',
    status: 'Approved',
    expectedBenefits: 'Expected 25-30% reduction in sprint risk, improved predictability, data-driven decision making.',
    adoptionChallenges: 'Initial training required for Scrum Masters. Historical data migration needed.',
    scalabilityConsiderations: 'Cloud-native architecture supports horizontal scaling for multi-team deployments.',
    overallScore: 100,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// GET all feasibility studies
app.get('/api/feasibility', (req, res) => {
  res.json(feasibilityStudies);
});

// GET feasibility study by ID
app.get('/api/feasibility/:id', (req, res) => {
  const study = feasibilityStudies.find(s => s.feasibilityId === parseInt(req.params.id));
  if (!study) return res.status(404).json({ error: 'Feasibility study not found' });
  res.json(study);
});

// GET feasibility summary
app.get('/api/feasibility/summary', (req, res) => {
  const approved = feasibilityStudies.filter(s => s.status === 'Approved').length;
  const pending = feasibilityStudies.filter(s => ['Proposed', 'Under Review'].includes(s.status)).length;
  const rejected = feasibilityStudies.filter(s => s.status === 'Rejected').length;
  const avgScore = feasibilityStudies.reduce((sum, s) => sum + s.overallScore, 0) / feasibilityStudies.length;
  
  res.json({
    totalStudies: feasibilityStudies.length,
    approvedCount: approved,
    pendingCount: pending,
    rejectedCount: rejected,
    averageScore: avgScore,
    latestStudy: feasibilityStudies[0]
  });
});

// POST create feasibility study
app.post('/api/feasibility', (req, res) => {
  const newId = Math.max(...feasibilityStudies.map(s => s.feasibilityId)) + 1;
  const newStudy = {
    feasibilityId: newId,
    ...req.body,
    evaluationDate: new Date().toISOString(),
    overallScore: calculateFeasibilityScore(req.body),
    createdAt: new Date().toISOString()
  };
  feasibilityStudies.unshift(newStudy);
  res.status(201).json(newStudy);
});

// PUT update feasibility study
app.put('/api/feasibility/:id', (req, res) => {
  const index = feasibilityStudies.findIndex(s => s.feasibilityId === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  feasibilityStudies[index] = {
    ...feasibilityStudies[index],
    ...req.body,
    overallScore: calculateFeasibilityScore(req.body)
  };
  res.json(feasibilityStudies[index]);
});

// PATCH update feasibility status
app.patch('/api/feasibility/:id/status', (req, res) => {
  const study = feasibilityStudies.find(s => s.feasibilityId === parseInt(req.params.id));
  if (!study) return res.status(404).json({ error: 'Not found' });
  
  study.status = req.body.status;
  if (req.body.approvedBy) study.approvedBy = req.body.approvedBy;
  res.json(study);
});

// DELETE feasibility study
app.delete('/api/feasibility/:id', (req, res) => {
  const index = feasibilityStudies.findIndex(s => s.feasibilityId === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  feasibilityStudies.splice(index, 1);
  res.status(204).send();
});

function calculateFeasibilityScore(data) {
  let score = 0;
  if (data.technicalFeasibility) score += 25;
  if (data.operationalFeasibility) score += 25;
  if (data.organizationalFeasibility) score += 25;
  if (data.integrationFeasibility) score += 25;
  return score;
}

// ============================================
// RISK FEEDBACK DATA & ENDPOINTS
// ============================================

const riskFeedbacks = [
  {
    feedbackId: 1,
    riskAssessmentId: 1,
    teamId: 1,
    sprintId: 103,
    agreementLevel: 'Accurate',
    userComments: 'The velocity prediction was spot on. Story delays were correctly identified early.',
    recommendationRating: 5,
    recommendationHelpful: true,
    actualOutcome: 'Sprint completed with 95% velocity as predicted. Risk mitigation helped.',
    providedBy: 'Scrum Master',
    feedbackDate: new Date().toISOString(),
    usedForCalibration: true
  },
  {
    feedbackId: 2,
    riskAssessmentId: 2,
    teamId: 1,
    sprintId: 102,
    agreementLevel: 'Partially Accurate',
    userComments: 'Risk was predicted but severity was slightly underestimated.',
    recommendationRating: 4,
    recommendationHelpful: true,
    actualOutcome: 'Sprint had more blockers than anticipated but stayed within tolerance.',
    providedBy: 'Product Owner',
    feedbackDate: new Date(Date.now() - 86400000).toISOString(),
    usedForCalibration: false
  },
  {
    feedbackId: 3,
    riskAssessmentId: 3,
    teamId: 1,
    sprintId: 101,
    agreementLevel: 'Accurate',
    userComments: 'Excellent prediction. Team capacity concerns were valid and actionable.',
    recommendationRating: 5,
    recommendationHelpful: true,
    actualOutcome: 'Sprint delivered as expected with recommended adjustments.',
    providedBy: 'Engineering Lead',
    feedbackDate: new Date(Date.now() - 172800000).toISOString(),
    usedForCalibration: true
  }
];

// POST submit feedback
app.post('/api/riskfeedback', (req, res) => {
  const newId = Math.max(...riskFeedbacks.map(f => f.feedbackId)) + 1;
  const newFeedback = {
    feedbackId: newId,
    ...req.body,
    feedbackDate: new Date().toISOString(),
    usedForCalibration: false
  };
  riskFeedbacks.unshift(newFeedback);
  res.status(201).json(newFeedback);
});

// GET feedback by ID
app.get('/api/riskfeedback/:id', (req, res) => {
  const feedback = riskFeedbacks.find(f => f.feedbackId === parseInt(req.params.id));
  if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
  res.json(feedback);
});

// GET feedbacks for team
app.get('/api/riskfeedback/team/:teamId', (req, res) => {
  const teamFeedbacks = riskFeedbacks.filter(f => f.teamId === parseInt(req.params.teamId));
  res.json(teamFeedbacks);
});

// GET prediction accuracy for team
app.get('/api/riskfeedback/accuracy/:teamId', (req, res) => {
  const teamFeedbacks = riskFeedbacks.filter(f => f.teamId === parseInt(req.params.teamId));
  const total = teamFeedbacks.length;
  const accurate = teamFeedbacks.filter(f => f.agreementLevel === 'Accurate').length;
  const partial = teamFeedbacks.filter(f => f.agreementLevel === 'Partially Accurate').length;
  const incorrect = teamFeedbacks.filter(f => f.agreementLevel === 'Incorrect').length;
  
  const avgRating = teamFeedbacks.reduce((sum, f) => sum + f.recommendationRating, 0) / total;
  const helpfulPct = (teamFeedbacks.filter(f => f.recommendationHelpful).length / total) * 100;
  
  // Calculate weighted accuracy: Accurate=100%, Partial=50%, Incorrect=0%
  const accuracyPct = total > 0 ? ((accurate * 100 + partial * 50) / total) : 0;
  
  res.json({
    teamId: parseInt(req.params.teamId),
    totalFeedbacks: total,
    accurateCount: accurate,
    partiallyAccurateCount: partial,
    inaccurateCount: incorrect,
    accuracyPercentage: Math.round(accuracyPct * 10) / 10,
    averageRecommendationRating: Math.round(avgRating * 10) / 10,
    helpfulnessPercentage: Math.round(helpfulPct * 10) / 10
  });
});

// GET sprint comparison (last 3 sprints)
app.get('/api/riskfeedback/comparison/:teamId', (req, res) => {
  res.json({
    teamId: parseInt(req.params.teamId),
    teamName: 'Alpha Team',
    sprints: [
      {
        sprintId: 103,
        sprintName: 'Sprint 23',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        predictedRiskLevel: 'Medium',
        actualRiskLevel: 'Medium',
        predictedVelocity: 42,
        actualVelocity: 40,
        topRisks: [
          { risk: 'Developer availability', predicted: true, occurred: true },
          { risk: 'Complex integration', predicted: true, occurred: false },
          { risk: 'Unclear requirements', predicted: false, occurred: true }
        ],
        recommendations: [
          { text: 'Front-load complex stories', followed: true, effective: true },
          { text: 'Schedule daily sync with stakeholders', followed: true, effective: true },
          { text: 'Reduce sprint scope by 10%', followed: false, effective: null }
        ],
        accuracyScore: 85,
        feedbackCount: 3
      },
      {
        sprintId: 102,
        sprintName: 'Sprint 22',
        startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        predictedRiskLevel: 'High',
        actualRiskLevel: 'High',
        predictedVelocity: 38,
        actualVelocity: 35,
        topRisks: [
          { risk: 'Technical debt', predicted: true, occurred: true },
          { risk: 'Team capacity', predicted: true, occurred: true },
          { risk: 'External dependencies', predicted: false, occurred: false }
        ],
        recommendations: [
          { text: 'Allocate 20% for refactoring', followed: true, effective: true },
          { text: 'Bring in contractor support', followed: false, effective: null },
          { text: 'Prioritize critical path items', followed: true, effective: true }
        ],
        accuracyScore: 78,
        feedbackCount: 2
      },
      {
        sprintId: 101,
        sprintName: 'Sprint 21',
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        predictedRiskLevel: 'Low',
        actualRiskLevel: 'Low',
        predictedVelocity: 45,
        actualVelocity: 47,
        topRisks: [
          { risk: 'Minor blockers', predicted: true, occurred: false },
          { risk: 'Testing bottleneck', predicted: false, occurred: false }
        ],
        recommendations: [
          { text: 'Maintain current pace', followed: true, effective: true },
          { text: 'Document technical decisions', followed: true, effective: true }
        ],
        accuracyScore: 92,
        feedbackCount: 4
      }
    ],
    averageAccuracy: 85,
    accuracyTrend: 'Improving',
    mostAccurateArea: 'Risk Level Prediction',
    needsImprovementArea: 'Velocity Estimation',
    keyInsights: [
      '🎯 Risk predictions are 85% accurate on average',
      '📈 Prediction accuracy has improved by 7% over the last 3 sprints',
      '⚠️ Velocity tends to be overestimated by ~2 points',
      '✅ Teams following recommendations see 15% better outcomes',
      '🔄 Technical debt predictions are most accurate',
      '💡 Consider adding buffer for external dependencies'
    ]
  });
});

// GET calibration status
app.get('/api/riskfeedback/calibration/:teamId', (req, res) => {
  const teamFeedbacks = riskFeedbacks.filter(f => f.teamId === parseInt(req.params.teamId));
  const usedForCal = teamFeedbacks.filter(f => f.usedForCalibration).length;
  const pending = teamFeedbacks.filter(f => !f.usedForCalibration).length;
  
  res.json({
    teamId: parseInt(req.params.teamId),
    lastCalibrationDate: new Date(Date.now() - 604800000).toISOString(),
    feedbacksUsedForCalibration: usedForCal,
    pendingFeedbacks: pending,
    calibrationNeeded: pending >= 3,
    accuracyTrend: 'Improving',
    trendPercentage: 5.2
  });
});

// PATCH mark feedback for calibration
app.patch('/api/riskfeedback/:id/calibrate', (req, res) => {
  const feedback = riskFeedbacks.find(f => f.feedbackId === parseInt(req.params.id));
  if (!feedback) return res.status(404).json({ error: 'Not found' });
  
  feedback.usedForCalibration = true;
  res.json(feedback);
});

// ---- Start Server (only if run directly) ----
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Mock BFF Server running at http://localhost:${PORT}`);
    console.log(`� Swagger API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`📄 Swagger JSON: http://localhost:${PORT}/swagger.json`);
    console.log(`�📊 API Endpoints:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/teams`);
    console.log(`   GET  /api/teams/:id`);
    console.log(`   GET  /api/sprints`);
    console.log(`   GET  /api/sprints/:id`);
    console.log(`   GET  /api/teams/:teamId/sprints`);
    console.log(`   GET  /api/metrics/:teamId`);
    console.log(`   POST /api/risk-assessment/evaluate`);
    console.log(`   --- Feasibility Study ---`);
    console.log(`   GET  /api/feasibility`);
    console.log(`   GET  /api/feasibility/:id`);
    console.log(`   GET  /api/feasibility/summary`);
    console.log(`   POST /api/feasibility`);
    console.log(`   PUT  /api/feasibility/:id`);
    console.log(`   PATCH /api/feasibility/:id/status`);
    console.log(`   DELETE /api/feasibility/:id`);
    console.log(`   --- Risk Feedback ---`);
    console.log(`   POST /api/riskfeedback`);
    console.log(`   GET  /api/riskfeedback/:id`);
    console.log(`   GET  /api/riskfeedback/team/:teamId`);
    console.log(`   GET  /api/riskfeedback/accuracy/:teamId`);
    console.log(`   GET  /api/riskfeedback/comparison/:teamId`);
    console.log(`   GET  /api/riskfeedback/calibration/:teamId`);
    console.log(`   PATCH /api/riskfeedback/:id/calibrate`);
  });
}

