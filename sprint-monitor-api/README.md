# Sprint Monitor API

ASP.NET Core 8.0 Web API backend for the Sprint Monitor application.

## 🏗️ Architecture

```
sprint-monitor-api/
├── SprintMonitor.sln              # Solution file
└── SprintMonitor.API/
    ├── Controllers/               # API endpoints
    │   ├── TeamsController.cs
    │   ├── SprintsController.cs
    │   ├── RiskAssessmentController.cs
    │   └── MetricsController.cs
    ├── Data/                      # Database context & seeding
    │   ├── SprintMonitorDbContext.cs
    │   └── DbSeeder.cs
    ├── DTOs/                      # Data Transfer Objects
    │   ├── TeamDtos.cs
    │   ├── SprintDtos.cs
    │   └── RiskAssessmentDtos.cs
    ├── Models/                    # Entity models
    │   ├── Team.cs
    │   ├── Sprint.cs
    │   ├── RiskAssessment.cs
    │   ├── RiskFactor.cs
    │   ├── Recommendation.cs
    │   └── TeamSetting.cs
    ├── Services/                  # Business logic
    │   ├── TeamService.cs
    │   ├── SprintService.cs
    │   ├── MetricsService.cs
    │   ├── RiskAssessmentService.cs
    │   └── CsvImportService.cs
    ├── Program.cs                 # Application entry point
    └── appsettings.json          # Configuration
```

## 🚀 Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server](https://www.microsoft.com/sql-server) (LocalDB included with Visual Studio)

### Running the API

```powershell
# Navigate to API folder
cd sprint-monitor-api

# Restore packages
dotnet restore

# Run the application
dotnet run --project SprintMonitor.API

# API will be available at:
# - https://localhost:5001
# - http://localhost:5000
# - Swagger UI: https://localhost:5001/swagger
```

### Database Setup

The API uses **SQL Server LocalDB** by default. The database is automatically created on first run.

**Connection String** (in `appsettings.json`):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SprintMonitorDb;Trusted_Connection=True;"
  }
}
```

**To use a different SQL Server:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=SprintMonitorDb;User Id=YOUR_USER;Password=YOUR_PASSWORD;"
  }
}
```

## 📡 API Endpoints

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | Get all teams |
| GET | `/api/teams/{id}` | Get team by ID |
| POST | `/api/teams` | Create new team |
| PUT | `/api/teams/{id}` | Update team |
| DELETE | `/api/teams/{id}` | Delete team |

### Sprints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sprints/team/{teamId}` | Get all sprints for team |
| GET | `/api/sprints/team/{teamId}/recent?count=10` | Get recent sprints |
| GET | `/api/sprints/{id}` | Get sprint by ID |
| POST | `/api/sprints` | Create new sprint |
| PUT | `/api/sprints/{id}` | Update sprint |
| DELETE | `/api/sprints/{id}` | Delete sprint |
| POST | `/api/sprints/import/{teamId}` | Import CSV file |

### Risk Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/riskassessment/evaluate` | **Evaluate sprint risk** |
| GET | `/api/riskassessment/history/{teamId}` | Get assessment history |
| GET | `/api/riskassessment/{id}` | Get assessment by ID |
| PATCH | `/api/riskassessment/{id}/outcome` | Update with actual outcome |

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics/team/{teamId}` | Get team metrics |
| GET | `/api/metrics/team/{teamId}/velocity-chart` | Get velocity chart data |
| GET | `/api/metrics/team/{teamId}/spillover-analysis` | Get spillover analysis |

## 🔧 Example API Calls

### Evaluate Risk (Main Feature)

```bash
POST /api/riskassessment/evaluate
Content-Type: application/json

{
  "teamId": 1,
  "plannedCommitment": 35,
  "teamAvailability": 90,
  "externalDependencies": 2
}
```

**Response:**
```json
{
  "assessmentId": 1,
  "riskLevel": "MEDIUM",
  "totalScore": 5,
  "maxPossibleScore": 14,
  "confidence": "HIGH",
  "metrics": {
    "averageVelocity": 28.1,
    "cvr": 1.25,
    "spilloverRate": 30,
    "effectiveCapacity": 22.5
  },
  "factors": [
    {
      "factorName": "Commitment-to-Velocity Ratio (CVR)",
      "score": 2,
      "description": "CVR of 1.25 indicates moderate overcommitment..."
    }
  ],
  "recommendations": [
    {
      "title": "Reduce Commitment to Match Velocity",
      "priority": "HIGH",
      "suggestedChange": "Reduce by 7 points"
    }
  ]
}
```

### Import CSV

```bash
POST /api/sprints/import/1/string
Content-Type: application/json

{
  "csvContent": "Sprint,Committed,Completed,Spillover\nSprint 1,30,28,false\nSprint 2,32,25,true"
}
```

## 🗄️ Database Schema

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────────┐
│    Teams    │       │     Sprints     │       │  RiskAssessments │
├─────────────┤       ├─────────────────┤       ├──────────────────┤
│ TeamId (PK) │◄──┬───│ TeamId (FK)     │   ┌───│ TeamId (FK)      │
│ TeamName    │   │   │ SprintId (PK)   │   │   │ AssessmentId(PK) │
│ Description │   │   │ SprintName      │   │   │ RiskLevel        │
│ IsActive    │   │   │ CommittedPoints │   │   │ TotalScore       │
└─────────────┘   │   │ CompletedPoints │   │   │ ActualOutcome    │
                  │   │ HadSpillover    │   │   └──────────────────┘
                  │   └─────────────────┘   │            │
                  │                         │            │ 1:N
                  │   ┌─────────────────┐   │            ▼
                  │   │  TeamSettings   │   │   ┌──────────────────┐
                  └───│ TeamId (FK)     │   │   │   RiskFactors    │
                      │ SettingKey      │   │   │   Recommendations│
                      │ SettingValue    │   │   └──────────────────┘
                      └─────────────────┘   │
```

## 🔌 Connecting Angular Frontend

Update the Angular app to call the API:

```typescript
// In Angular environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001/api'
};

// In Angular sprint.service.ts
@Injectable()
export class SprintService {
  constructor(private http: HttpClient) {}

  evaluateRisk(request: RiskAssessmentRequest): Observable<RiskAssessment> {
    return this.http.post<RiskAssessment>(
      `${environment.apiUrl}/riskassessment/evaluate`, 
      request
    );
  }
}
```

## 📋 Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | ASP.NET Core 8.0 |
| Language | C# 12 |
| ORM | Entity Framework Core 8.0 |
| Database | SQL Server / LocalDB |
| API Docs | Swagger / OpenAPI |
| CSV Parsing | CsvHelper |

## 🧪 Testing the API

Open Swagger UI at `https://localhost:5001/swagger` to:
- View all endpoints
- Test API calls interactively
- See request/response schemas

## 📜 License

This project is for educational purposes.
