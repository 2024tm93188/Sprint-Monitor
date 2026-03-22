/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique team identifier
 *           example: 1
 *         name:
 *           type: string
 *           description: Team name
 *           example: "Alpha Team"
 *         description:
 *           type: string
 *           description: Team description
 *           example: "Core product development team"
 *         defaultSprintLengthDays:
 *           type: integer
 *           description: Default sprint duration in days
 *           example: 14
 *         defaultTeamSize:
 *           type: integer
 *           description: Default team size
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Team creation timestamp
 *
 *     Sprint:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique sprint identifier
 *           example: 1
 *         teamId:
 *           type: integer
 *           description: Associated team ID
 *           example: 1
 *         name:
 *           type: string
 *           description: Sprint name
 *           example: "Sprint 2024-01"
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         committedPoints:
 *           type: integer
 *           description: Story points committed
 *           example: 28
 *         completedPoints:
 *           type: integer
 *           description: Story points completed
 *           example: 26
 *         teamSize:
 *           type: integer
 *           example: 5
 *         teamAvailability:
 *           type: integer
 *           description: Team availability percentage
 *           example: 100
 *         hadSpillover:
 *           type: boolean
 *           description: Whether sprint had spillover
 *           example: false
 *         spilloverPoints:
 *           type: integer
 *           description: Points that spilled over
 *           example: 0
 *         externalDependencies:
 *           type: integer
 *           description: Number of external dependencies
 *           example: 1
 *         notes:
 *           type: string
 *           description: Sprint notes
 *           example: "Good sprint, minor scope adjustment"
 *
 *     RiskEvaluationRequest:
 *       type: object
 *       required:
 *         - plannedStoryPoints
 *         - teamAvailability
 *         - teamSize
 *       properties:
 *         plannedStoryPoints:
 *           type: integer
 *           description: Story points planned for the sprint
 *           example: 35
 *         teamAvailability:
 *           type: integer
 *           description: Team availability percentage (0-100)
 *           example: 85
 *         teamSize:
 *           type: integer
 *           description: Number of team members
 *           example: 5
 *         externalDependencies:
 *           type: integer
 *           description: Number of external dependencies
 *           example: 3
 *         historicalSprints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Sprint'
 *
 *     RiskAssessment:
 *       type: object
 *       properties:
 *         overallRisk:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           description: Overall risk level
 *           example: "MEDIUM"
 *         riskScore:
 *           type: number
 *           description: Numeric risk score (0-100)
 *           example: 45
 *         spilloverProbability:
 *           type: number
 *           description: Probability of spillover (0-1)
 *           example: 0.35
 *         confidenceLevel:
 *           type: number
 *           description: Confidence in the prediction (0-1)
 *           example: 0.85
 *         riskFactors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RiskFactor'
 *         recommendations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Recommendation'
 *         evaluatedAt:
 *           type: string
 *           format: date-time
 *
 *     RiskFactor:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Overcommitment Risk"
 *         score:
 *           type: integer
 *           description: Risk factor score (0-3)
 *           example: 2
 *         impact:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           example: "MEDIUM"
 *         description:
 *           type: string
 *           example: "Planning 35 points exceeds average velocity of 28 by 25%"
 *
 *     Recommendation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Reduce Sprint Scope"
 *         description:
 *           type: string
 *           example: "Consider reducing scope by 7 points to align with historical velocity"
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           example: "HIGH"
 *         actionType:
 *           type: string
 *           example: "REDUCE_SCOPE"
 *         suggestedChange:
 *           type: string
 *           example: "Target 28 points"
 *
 *     Feasibility:
 *       type: object
 *       properties:
 *         feasibilityId:
 *           type: integer
 *           example: 1
 *         teamId:
 *           type: integer
 *           example: 1
 *         teamName:
 *           type: string
 *           example: "Alpha Team"
 *         evaluationDate:
 *           type: string
 *           format: date-time
 *         technicalFeasibility:
 *           type: boolean
 *           description: Technical implementation feasibility
 *           example: true
 *         technicalNotes:
 *           type: string
 *           example: "Angular 17+ and .NET 8 stack fully supports requirements"
 *         operationalFeasibility:
 *           type: boolean
 *           description: Operational workflow feasibility
 *           example: true
 *         operationalNotes:
 *           type: string
 *           example: "Can integrate with existing Scrum ceremonies"
 *         organizationalFeasibility:
 *           type: boolean
 *           description: Organizational alignment feasibility
 *           example: true
 *         organizationalNotes:
 *           type: string
 *           example: "Management supports adoption of predictive tools"
 *         integrationFeasibility:
 *           type: boolean
 *           description: Integration with existing tools feasibility
 *           example: true
 *         integrationNotes:
 *           type: string
 *           example: "API-first design allows Jira/Azure DevOps integration"
 *         mentorComments:
 *           type: string
 *           description: Industry mentor validation comments
 *           example: "System demonstrates practical applicability"
 *         approvedBy:
 *           type: string
 *           description: Name of approving mentor
 *           example: "Dr. Industry Mentor"
 *         status:
 *           type: string
 *           enum: [Proposed, Under Review, Approved, Deferred, Rejected]
 *           example: "Approved"
 *         overallScore:
 *           type: integer
 *           description: Overall feasibility score (0-100)
 *           example: 100
 *         expectedBenefits:
 *           type: string
 *           example: "Reduced sprint risk by 30%, improved predictability"
 *         adoptionChallenges:
 *           type: string
 *           example: "Initial training required for Scrum Masters"
 *         scalabilityConsiderations:
 *           type: string
 *           example: "Cloud-native architecture supports multi-team scaling"
 *
 *     CreateFeasibility:
 *       type: object
 *       required:
 *         - teamId
 *       properties:
 *         teamId:
 *           type: integer
 *           example: 1
 *         technicalFeasibility:
 *           type: boolean
 *           example: true
 *         technicalNotes:
 *           type: string
 *         operationalFeasibility:
 *           type: boolean
 *           example: true
 *         operationalNotes:
 *           type: string
 *         organizationalFeasibility:
 *           type: boolean
 *           example: true
 *         organizationalNotes:
 *           type: string
 *         integrationFeasibility:
 *           type: boolean
 *           example: true
 *         integrationNotes:
 *           type: string
 *         mentorComments:
 *           type: string
 *         approvedBy:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Proposed, Under Review, Approved, Deferred, Rejected]
 *           default: "Proposed"
 *         expectedBenefits:
 *           type: string
 *         adoptionChallenges:
 *           type: string
 *         scalabilityConsiderations:
 *           type: string
 *
 *     FeasibilitySummary:
 *       type: object
 *       properties:
 *         totalStudies:
 *           type: integer
 *           example: 5
 *         approvedCount:
 *           type: integer
 *           example: 3
 *         pendingCount:
 *           type: integer
 *           example: 1
 *         rejectedCount:
 *           type: integer
 *           example: 1
 *         averageScore:
 *           type: number
 *           example: 85.5
 *
 *     RiskFeedback:
 *       type: object
 *       properties:
 *         feedbackId:
 *           type: integer
 *           example: 1
 *         riskAssessmentId:
 *           type: integer
 *           example: 1
 *         teamId:
 *           type: integer
 *           example: 1
 *         sprintId:
 *           type: integer
 *           example: 101
 *         agreementLevel:
 *           type: string
 *           enum: [Accurate, PartiallyAccurate, Incorrect]
 *           example: "Accurate"
 *         userComments:
 *           type: string
 *           example: "The velocity prediction was spot on"
 *         recommendationRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         recommendationHelpful:
 *           type: boolean
 *           example: true
 *         actualOutcome:
 *           type: string
 *           example: "Sprint completed with 95% velocity as predicted"
 *         providedBy:
 *           type: string
 *           example: "Scrum Master"
 *         feedbackDate:
 *           type: string
 *           format: date-time
 *         usedForCalibration:
 *           type: boolean
 *           example: false
 *
 *     CreateRiskFeedback:
 *       type: object
 *       required:
 *         - riskAssessmentId
 *         - teamId
 *         - agreementLevel
 *       properties:
 *         riskAssessmentId:
 *           type: integer
 *           example: 1
 *         teamId:
 *           type: integer
 *           example: 1
 *         sprintId:
 *           type: integer
 *           example: 101
 *         agreementLevel:
 *           type: string
 *           enum: [Accurate, PartiallyAccurate, Incorrect]
 *         userComments:
 *           type: string
 *         recommendationRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         recommendationHelpful:
 *           type: boolean
 *         actualOutcome:
 *           type: string
 *         providedBy:
 *           type: string
 *
 *     PredictionAccuracy:
 *       type: object
 *       properties:
 *         teamId:
 *           type: integer
 *           example: 1
 *         totalFeedbacks:
 *           type: integer
 *           example: 10
 *         accurateCount:
 *           type: integer
 *           example: 7
 *         partiallyAccurateCount:
 *           type: integer
 *           example: 2
 *         inaccurateCount:
 *           type: integer
 *           example: 1
 *         accuracyPercentage:
 *           type: number
 *           example: 85.5
 *         averageRecommendationRating:
 *           type: number
 *           example: 4.2
 *         helpfulnessPercentage:
 *           type: number
 *           example: 90
 *
 *     SprintComparison:
 *       type: object
 *       properties:
 *         sprintId:
 *           type: integer
 *           example: 103
 *         sprintName:
 *           type: string
 *           example: "Sprint 23"
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         predictedRiskLevel:
 *           type: string
 *           example: "Medium"
 *         actualRiskLevel:
 *           type: string
 *           example: "Medium"
 *         predictedVelocity:
 *           type: integer
 *           example: 42
 *         actualVelocity:
 *           type: integer
 *           example: 40
 *         accuracyScore:
 *           type: integer
 *           example: 85
 *         feedbackCount:
 *           type: integer
 *           example: 3
 *
 *     SprintComparisonAnalysis:
 *       type: object
 *       properties:
 *         teamId:
 *           type: integer
 *           example: 1
 *         teamName:
 *           type: string
 *           example: "Alpha Team"
 *         sprints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SprintComparison'
 *         averageAccuracy:
 *           type: number
 *           example: 85
 *         accuracyTrend:
 *           type: string
 *           example: "Improving"
 *         mostAccurateArea:
 *           type: string
 *           example: "Risk Level Prediction"
 *         needsImprovementArea:
 *           type: string
 *           example: "Velocity Estimation"
 *         keyInsights:
 *           type: array
 *           items:
 *             type: string
 *
 *     CalibrationStatus:
 *       type: object
 *       properties:
 *         teamId:
 *           type: integer
 *           example: 1
 *         feedbacksUsedForCalibration:
 *           type: integer
 *           example: 8
 *         pendingFeedbacks:
 *           type: integer
 *           example: 2
 *         calibrationNeeded:
 *           type: boolean
 *           example: true
 *         lastCalibrationDate:
 *           type: string
 *           format: date-time
 *         accuracyTrend:
 *           type: string
 *           example: "Improving"
 *         trendPercentage:
 *           type: number
 *           example: 5.2
 *
 *     Metrics:
 *       type: object
 *       properties:
 *         teamId:
 *           type: integer
 *           example: 1
 *         averageVelocity:
 *           type: number
 *           example: 28.5
 *         velocityStdDev:
 *           type: number
 *           example: 3.2
 *         completionRate:
 *           type: number
 *           example: 92.5
 *         spilloverRate:
 *           type: number
 *           example: 15.0
 *         sprintCount:
 *           type: integer
 *           example: 6
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Resource not found"
 *         message:
 *           type: string
 *           example: "The requested resource could not be found"
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: List of all teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 */

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/sprints:
 *   get:
 *     summary: Get all sprints
 *     tags: [Sprints]
 *     responses:
 *       200:
 *         description: List of all sprints
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sprint'
 */

/**
 * @swagger
 * /api/sprints/{id}:
 *   get:
 *     summary: Get sprint by ID
 *     tags: [Sprints]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sprint ID
 *     responses:
 *       200:
 *         description: Sprint details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sprint'
 *       404:
 *         description: Sprint not found
 */

/**
 * @swagger
 * /api/teams/{teamId}/sprints:
 *   get:
 *     summary: Get all sprints for a team
 *     tags: [Sprints]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: List of sprints for the team
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sprint'
 */

/**
 * @swagger
 * /api/metrics/{teamId}:
 *   get:
 *     summary: Get metrics for a team
 *     tags: [Metrics]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Metrics'
 */

/**
 * @swagger
 * /api/risk-assessment/evaluate:
 *   post:
 *     summary: Evaluate sprint risk
 *     description: Performs deterministic rule-based risk evaluation for a planned sprint
 *     tags: [Risk Assessment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RiskEvaluationRequest'
 *     responses:
 *       200:
 *         description: Risk assessment result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RiskAssessment'
 *       400:
 *         description: Invalid request
 */

/**
 * @swagger
 * /api/feasibility:
 *   get:
 *     summary: Get all feasibility studies
 *     tags: [Feasibility]
 *     responses:
 *       200:
 *         description: List of all feasibility studies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feasibility'
 *   post:
 *     summary: Create a new feasibility study
 *     tags: [Feasibility]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFeasibility'
 *     responses:
 *       201:
 *         description: Created feasibility study
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feasibility'
 *       400:
 *         description: Invalid request
 */

/**
 * @swagger
 * /api/feasibility/{id}:
 *   get:
 *     summary: Get feasibility study by ID
 *     tags: [Feasibility]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feasibility study ID
 *     responses:
 *       200:
 *         description: Feasibility study details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feasibility'
 *       404:
 *         description: Study not found
 *   put:
 *     summary: Update feasibility study
 *     tags: [Feasibility]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFeasibility'
 *     responses:
 *       200:
 *         description: Updated feasibility study
 *       404:
 *         description: Study not found
 *   delete:
 *     summary: Delete feasibility study
 *     tags: [Feasibility]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Study deleted
 *       404:
 *         description: Study not found
 */

/**
 * @swagger
 * /api/feasibility/{id}/status:
 *   patch:
 *     summary: Update feasibility study status
 *     description: Update the approval status of a feasibility study (mentor workflow)
 *     tags: [Feasibility]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Proposed, Under Review, Approved, Deferred, Rejected]
 *               approvedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Study not found
 */

/**
 * @swagger
 * /api/feasibility/summary:
 *   get:
 *     summary: Get feasibility summary statistics
 *     tags: [Feasibility]
 *     responses:
 *       200:
 *         description: Feasibility summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeasibilitySummary'
 */

/**
 * @swagger
 * /api/riskfeedback:
 *   post:
 *     summary: Submit risk feedback
 *     description: Submit human relevance feedback for a risk prediction
 *     tags: [Risk Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRiskFeedback'
 *     responses:
 *       201:
 *         description: Feedback submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RiskFeedback'
 *       400:
 *         description: Invalid request
 */

/**
 * @swagger
 * /api/riskfeedback/{id}:
 *   get:
 *     summary: Get feedback by ID
 *     tags: [Risk Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feedback details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RiskFeedback'
 *       404:
 *         description: Feedback not found
 */

/**
 * @swagger
 * /api/riskfeedback/team/{teamId}:
 *   get:
 *     summary: Get all feedbacks for a team
 *     tags: [Risk Feedback]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RiskFeedback'
 */

/**
 * @swagger
 * /api/riskfeedback/accuracy/{teamId}:
 *   get:
 *     summary: Get prediction accuracy for a team
 *     description: Calculate prediction accuracy statistics based on human feedback
 *     tags: [Risk Feedback]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prediction accuracy statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PredictionAccuracy'
 */

/**
 * @swagger
 * /api/riskfeedback/comparison/{teamId}:
 *   get:
 *     summary: Get sprint comparison analysis
 *     description: Compare predictions vs outcomes for the last 3 sprints
 *     tags: [Risk Feedback]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sprint comparison analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SprintComparisonAnalysis'
 */

/**
 * @swagger
 * /api/riskfeedback/calibration/{teamId}:
 *   get:
 *     summary: Get calibration status
 *     description: Get the calibration status and recommendations for a team
 *     tags: [Risk Feedback]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calibration status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalibrationStatus'
 */

/**
 * @swagger
 * /api/riskfeedback/{id}/calibrate:
 *   patch:
 *     summary: Mark feedback as used for calibration
 *     tags: [Risk Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feedback marked for calibration
 *       404:
 *         description: Feedback not found
 */

module.exports = {};
