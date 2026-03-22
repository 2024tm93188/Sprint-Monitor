const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sprint Monitor Mock BFF API',
      version: '1.0.0',
      description: `
## Sprint Risk Detection System - Mock Backend for Frontend (BFF)

This is a mock API server that simulates the .NET backend for development and testing.

### Features:
- **Teams Management** - Scrum team CRUD operations
- **Sprint Data** - Historical sprint metrics and tracking
- **Risk Assessment** - Evaluate sprint risk using rule-based algorithms
- **Feasibility Study** - Industry validation workflow with mentor approval
- **Human Feedback** - Prediction accuracy feedback for calibration
- **Sprint Comparison** - Last 3 sprints analysis dashboard

### Use Cases:
1. Frontend development without backend dependency
2. Integration testing
3. Demo and presentations
4. Academic viva demonstrations

---
*Sprint Monitor v1.0 | M.Tech Dissertation Project*
      `,
      contact: {
        name: 'Sprint Monitor Team',
        email: 'support@sprintmonitor.dev'
      },
      license: {
        name: 'Academic Use Only',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Teams', description: 'Team management operations' },
      { name: 'Sprints', description: 'Sprint data operations' },
      { name: 'Metrics', description: 'Performance metrics calculations' },
      { name: 'Risk Assessment', description: 'Sprint risk evaluation' },
      { name: 'Feasibility', description: 'Implementation feasibility studies' },
      { name: 'Risk Feedback', description: 'Human relevance feedback for predictions' }
    ]
  },
  apis: ['./server.js', './swagger-docs.js']
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
