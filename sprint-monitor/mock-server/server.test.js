/**
 * Mock BFF Server API Unit Tests
 * Tests all API endpoints using Jest and Supertest
 * Updated to match actual API response structure
 */

const request = require('supertest');
const app = require('./server');

describe('Mock BFF Server API Tests', () => {
  
  // ============================================
  // Health Check Endpoint Tests
  // ============================================
  describe('GET /api/health', () => {
    it('should return health status with 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // ============================================
  // Teams Endpoint Tests
  // ============================================
  describe('Teams API', () => {
    describe('GET /api/teams', () => {
      it('should return all teams with 200', async () => {
        const response = await request(app)
          .get('/api/teams')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should return teams with correct structure', async () => {
        const response = await request(app)
          .get('/api/teams')
          .expect(200);
        
        const team = response.body[0];
        expect(team).toHaveProperty('id');
        expect(team).toHaveProperty('name');
        expect(team).toHaveProperty('description');
        expect(team).toHaveProperty('defaultSprintLengthDays');
        expect(team).toHaveProperty('defaultTeamSize');
        expect(team).toHaveProperty('createdAt');
      });
    });

    describe('GET /api/teams/:id', () => {
      it('should return a specific team by ID', async () => {
        const response = await request(app)
          .get('/api/teams/1')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toHaveProperty('name');
      });

      it('should return 404 for non-existent team', async () => {
        const response = await request(app)
          .get('/api/teams/999')
          .expect('Content-Type', /json/)
          .expect(404);
        
        expect(response.body).toHaveProperty('error', 'Team not found');
      });

      it('should handle invalid team ID format', async () => {
        const response = await request(app)
          .get('/api/teams/invalid')
          .expect(404);
      });
    });
  });

  // ============================================
  // Sprints Endpoint Tests
  // ============================================
  describe('Sprints API', () => {
    describe('GET /api/sprints', () => {
      it('should return all sprints with 200', async () => {
        const response = await request(app)
          .get('/api/sprints')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should return sprints with correct structure', async () => {
        const response = await request(app)
          .get('/api/sprints')
          .expect(200);
        
        const sprint = response.body[0];
        expect(sprint).toHaveProperty('id');
        expect(sprint).toHaveProperty('teamId');
        expect(sprint).toHaveProperty('name');
        expect(sprint).toHaveProperty('startDate');
        expect(sprint).toHaveProperty('endDate');
        expect(sprint).toHaveProperty('committedPoints');
        expect(sprint).toHaveProperty('completedPoints');
        expect(sprint).toHaveProperty('teamSize');
      });
    });

    describe('GET /api/sprints/:id', () => {
      it('should return a specific sprint by ID', async () => {
        const response = await request(app)
          .get('/api/sprints/1')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toHaveProperty('name');
      });

      it('should return 404 for non-existent sprint', async () => {
        const response = await request(app)
          .get('/api/sprints/999')
          .expect('Content-Type', /json/)
          .expect(404);
        
        expect(response.body).toHaveProperty('error', 'Sprint not found');
      });
    });

    describe('GET /api/teams/:teamId/sprints', () => {
      it('should return sprints for a specific team', async () => {
        const response = await request(app)
          .get('/api/teams/1/sprints')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(Array.isArray(response.body)).toBe(true);
        
        // All sprints should belong to team 1
        response.body.forEach(sprint => {
          expect(sprint.teamId).toBe(1);
        });
      });

      it('should return empty array for team with no sprints', async () => {
        const response = await request(app)
          .get('/api/teams/999/sprints')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
      });
    });
  });

  // ============================================
  // Metrics Endpoint Tests
  // ============================================
  describe('Metrics API', () => {
    describe('GET /api/metrics/:teamId', () => {
      it('should return metrics for a specific team', async () => {
        const response = await request(app)
          .get('/api/metrics/1')
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(response.body).toHaveProperty('teamId', 1);
        expect(response.body).toHaveProperty('averageVelocity');
        expect(response.body).toHaveProperty('velocityStandardDeviation');
        expect(response.body).toHaveProperty('sprintCount');
        expect(response.body).toHaveProperty('lastUpdated');
      });

      it('should return numeric values for velocity metrics', async () => {
        const response = await request(app)
          .get('/api/metrics/1')
          .expect(200);
        
        expect(typeof response.body.averageVelocity).toBe('number');
        expect(typeof response.body.velocityStandardDeviation).toBe('number');
        expect(response.body.averageVelocity).toBeGreaterThanOrEqual(0);
      });

      it('should return 404 for team with no sprints', async () => {
        const response = await request(app)
          .get('/api/metrics/999')
          .expect(404);
      });
    });
  });

  // ============================================
  // Risk Assessment Endpoint Tests
  // ============================================
  describe('Risk Assessment API', () => {
    describe('POST /api/risk-assessment/evaluate', () => {
      const validPayload = {
        teamId: 1,
        plannedStoryPoints: 30,
        teamCapacity: 100,
        teamSize: 5,
        sprintLengthDays: 14,
        historicalVelocity: [28, 32, 26, 30, 29],
        externalDependencies: 2,
        teamExperience: 'EXPERIENCED',
        sprintGoals: ['Complete feature A', 'Fix critical bugs']
      };

      it('should return risk assessment with valid payload', async () => {
        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(validPayload)
          .expect('Content-Type', /json/)
          .expect(200);
        
        expect(response.body).toHaveProperty('overallRisk');
        expect(response.body).toHaveProperty('confidence');
        expect(response.body).toHaveProperty('factors');
        expect(response.body).toHaveProperty('recommendations');
        expect(response.body).toHaveProperty('metrics');
        expect(response.body).toHaveProperty('assessedAt');
      });

      it('should return valid risk level values', async () => {
        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(validPayload)
          .expect(200);
        
        const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        expect(validRiskLevels).toContain(response.body.overallRisk);
      });

      it('should return confidence as a string', async () => {
        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(validPayload)
          .expect(200);
        
        const validConfidenceLevels = ['LOW', 'MEDIUM', 'HIGH'];
        expect(validConfidenceLevels).toContain(response.body.confidence);
      });

      it('should return factors as an array', async () => {
        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(validPayload)
          .expect(200);
        
        expect(Array.isArray(response.body.factors)).toBe(true);
      });

      it('should return recommendations as an array', async () => {
        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(validPayload)
          .expect(200);
        
        expect(Array.isArray(response.body.recommendations)).toBe(true);
      });

      it('should identify overcommitment risk for high planned points', async () => {
        const overcommittedPayload = {
          ...validPayload,
          plannedStoryPoints: 50, // Much higher than average velocity
          historicalVelocity: [25, 28, 26, 24, 27]
        };

        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(overcommittedPayload)
          .expect(200);
        
        // Should have overcommitment risk factor
        const hasOvercommitmentRisk = response.body.factors.some(
          factor => factor.name.toLowerCase().includes('overcommit')
        );
        expect(hasOvercommitmentRisk).toBe(true);
      });

      it('should identify risk for low capacity', async () => {
        const lowCapacityPayload = {
          ...validPayload,
          teamCapacity: 50 // 50% capacity
        };

        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(lowCapacityPayload)
          .expect(200);
        
        // Should have availability risk factor
        const hasCapacityRisk = response.body.factors.some(
          factor => factor.name.toLowerCase().includes('availability')
        );
        expect(hasCapacityRisk).toBe(true);
      });

      it('should identify risk for high external dependencies', async () => {
        const highDependenciesPayload = {
          ...validPayload,
          externalDependencies: 5
        };

        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(highDependenciesPayload)
          .expect(200);
        
        // Should have dependency risk factor
        const hasDependencyRisk = response.body.factors.some(
          factor => factor.name.toLowerCase().includes('dependenc')
        );
        expect(hasDependencyRisk).toBe(true);
      });

      it('should handle new team with no velocity history', async () => {
        const newTeamPayload = {
          ...validPayload,
          historicalVelocity: [],
          teamExperience: 'NEW'
        };

        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(newTeamPayload)
          .expect(200);
        
        expect(response.body).toHaveProperty('overallRisk');
      });

      it('should return metrics with calculated values', async () => {
        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(validPayload)
          .expect(200);
        
        const metrics = response.body.metrics;
        expect(metrics).toHaveProperty('averageVelocity');
        expect(metrics).toHaveProperty('effectiveCapacity');
        expect(typeof metrics.averageVelocity).toBe('number');
      });

      it('should generate relevant recommendations', async () => {
        const riskyPayload = {
          ...validPayload,
          plannedStoryPoints: 45,
          teamCapacity: 60,
          externalDependencies: 4
        };

        const response = await request(app)
          .post('/api/risk-assessment/evaluate')
          .send(riskyPayload)
          .expect(200);
        
        expect(response.body.recommendations.length).toBeGreaterThan(0);
        
        const recommendation = response.body.recommendations[0];
        expect(recommendation).toHaveProperty('id');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('priority');
      });
    });
  });

  // ============================================
  // Edge Cases and Error Handling Tests
  // ============================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle non-existent endpoints with 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should handle POST to GET-only endpoints', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({ name: 'New Team' })
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/risk-assessment/evaluate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });

  // ============================================
  // Performance and Response Time Tests
  // ============================================
  describe('Performance Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();
      await request(app).get('/api/health');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should respond to risk assessment within 500ms', async () => {
      const start = Date.now();
      await request(app)
        .post('/api/risk-assessment/evaluate')
        .send({
          teamId: 1,
          plannedStoryPoints: 30,
          teamCapacity: 100,
          teamSize: 5,
          sprintLengthDays: 14,
          historicalVelocity: [28, 32, 26, 30, 29],
          externalDependencies: 2,
          teamExperience: 'EXPERIENCED',
          sprintGoals: ['Complete feature A']
        });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================
  // Data Integrity Tests
  // ============================================
  describe('Data Integrity Tests', () => {
    it('should return consistent team data across endpoints', async () => {
      const allTeamsResponse = await request(app)
        .get('/api/teams')
        .expect(200);
      
      const teamId = allTeamsResponse.body[0].id;
      
      const singleTeamResponse = await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(200);
      
      expect(singleTeamResponse.body.id).toBe(allTeamsResponse.body[0].id);
      expect(singleTeamResponse.body.name).toBe(allTeamsResponse.body[0].name);
    });

    it('should return sprints that reference valid teams', async () => {
      const sprintsResponse = await request(app)
        .get('/api/sprints')
        .expect(200);
      
      const teamsResponse = await request(app)
        .get('/api/teams')
        .expect(200);
      
      const teamIds = teamsResponse.body.map(t => t.id);
      
      sprintsResponse.body.forEach(sprint => {
        expect(teamIds).toContain(sprint.teamId);
      });
    });

    it('should return valid sprint point values', async () => {
      const sprintsResponse = await request(app)
        .get('/api/sprints')
        .expect(200);
      
      sprintsResponse.body.forEach(sprint => {
        expect(sprint.committedPoints).toBeGreaterThanOrEqual(0);
        expect(sprint.completedPoints).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
