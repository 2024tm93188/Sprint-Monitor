import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SimpleChange } from '@angular/core';

import { RiskDashboardComponent } from './risk-dashboard.component';
import {
  RiskAssessment,
  RiskLevel,
  RiskFactor,
  AssessmentConfidence
} from '../../core/models/risk.model';
import { SprintMetrics } from '../../core/models/sprint.model';

describe('RiskDashboardComponent', () => {
  let component: RiskDashboardComponent;
  let fixture: ComponentFixture<RiskDashboardComponent>;

  const mockAssessment: RiskAssessment = {
    overallRisk: RiskLevel.MEDIUM,
    totalScore: 7,
    maxPossibleScore: 15,
    confidence: AssessmentConfidence.HIGH,
    factors: [
      {
        name: 'Overcommitment Risk',
        score: 2,
        description: 'Planned points exceed 110% of average velocity',
        metricValue: 1.15
      },
      {
        name: 'Velocity Instability',
        score: 1,
        description: 'Moderate variation in sprint velocity',
        metricValue: 0.18
      },
      {
        name: 'Team Availability',
        score: 2,
        description: 'Team availability is reduced this sprint',
        metricValue: 75
      },
      {
        name: 'External Dependencies',
        score: 2,
        description: 'Multiple external dependencies present',
        metricValue: 3
      },
      {
        name: 'Spillover History',
        score: 0,
        description: 'Low spillover rate in recent sprints',
        metricValue: 10
      }
    ],
    recommendations: [],
    assessedAt: new Date()
  };

  const mockDtoStyleAssessment = {
    ...mockAssessment,
    mlRiskLevel: RiskLevel.HIGH,
    finalRiskLevel: RiskLevel.HIGH,
    mlConfidence: 0.82
  } as unknown as RiskAssessment;

  const mockMetrics: SprintMetrics = {
    averageVelocity: 28,
    velocityStandardDeviation: 4.2,
    velocityCoefficient: 0.15,
    spilloverRate: 25,
    effectiveCapacity: 22.4,
    cvr: 1.07,
    sprintCount: 5
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RiskDashboardComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RiskDashboardComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null assessment', () => {
      expect(component.assessment).toBeNull();
    });

    it('should initialize with null metrics', () => {
      expect(component.metrics).toBeNull();
    });

    it('should display no assessment state when assessment is null', () => {
      fixture.detectChanges();
      const noAssessment = fixture.debugElement.query(By.css('.no-assessment'));
      expect(noAssessment).toBeTruthy();
    });
  });

  describe('Risk Level Display', () => {
    beforeEach(() => {
      component.assessment = mockAssessment;
      component.metrics = mockMetrics;
      fixture.detectChanges();
    });

    it('should display risk badge when assessment is provided', () => {
      const riskBadge = fixture.debugElement.query(By.css('.status-chip.risk-medium'));
      expect(riskBadge).toBeTruthy();
    });

    it('should display correct risk level text', () => {
      const riskLevel = fixture.debugElement.query(By.css('.status-chip.risk-medium'));
      expect(riskLevel.nativeElement.textContent).toContain('MEDIUM');
    });

    it('should display total score', () => {
      const scoreValue = fixture.debugElement.query(By.css('.risk-score-card .risk-score-value'));
      const scoreMax = fixture.debugElement.query(By.css('.risk-score-card .kpi-subvalue'));
      expect(scoreValue.nativeElement.textContent).toContain('7');
      expect(scoreMax.nativeElement.textContent).toContain('15');
    });

    it('should display ML risk when DTO field names are present', () => {
      component.assessment = mockDtoStyleAssessment;
      component.metrics = mockMetrics;
      fixture.detectChanges();

      const hybridPanel = fixture.debugElement.query(By.css('.hybrid-risk-panel'));
      expect(hybridPanel).toBeTruthy();

      const mlPrediction = fixture.debugElement.query(By.css('.hybrid-item .hybrid-label'));
      expect(mlPrediction.nativeElement.textContent).toContain('ML Prediction');

      const riskBadges = fixture.debugElement.queryAll(By.css('.hybrid-value.risk-badge'));
      expect(riskBadges.some(node => node.nativeElement.textContent?.includes('HIGH'))).toBeTrue();
    });
  });

  describe('getRiskClass Method', () => {
    it('should return empty string when assessment is null', () => {
      component.assessment = null;
      expect(component.getRiskClass()).toBe('');
    });

    it('should return "low" for LOW risk', () => {
      component.assessment = { ...mockAssessment, overallRisk: RiskLevel.LOW };
      expect(component.getRiskClass()).toBe('low');
    });

    it('should return "medium" for MEDIUM risk', () => {
      component.assessment = { ...mockAssessment, overallRisk: RiskLevel.MEDIUM };
      expect(component.getRiskClass()).toBe('medium');
    });

    it('should return "high" for HIGH risk', () => {
      component.assessment = { ...mockAssessment, overallRisk: RiskLevel.HIGH };
      expect(component.getRiskClass()).toBe('high');
    });
  });

  describe('getRiskIcon Method', () => {
    it('should return "help" when assessment is null', () => {
      component.assessment = null;
      expect(component.getRiskIcon()).toBe('help');
    });

    it('should return "check_circle" for LOW risk', () => {
      component.assessment = { ...mockAssessment, overallRisk: RiskLevel.LOW };
      expect(component.getRiskIcon()).toBe('check_circle');
    });

    it('should return "warning" for MEDIUM risk', () => {
      component.assessment = { ...mockAssessment, overallRisk: RiskLevel.MEDIUM };
      expect(component.getRiskIcon()).toBe('warning');
    });

    it('should return "error" for HIGH risk', () => {
      component.assessment = { ...mockAssessment, overallRisk: RiskLevel.HIGH };
      expect(component.getRiskIcon()).toBe('error');
    });
  });

  describe('getConfidenceClass Method', () => {
    it('should return empty string when assessment is null', () => {
      component.assessment = null;
      expect(component.getConfidenceClass()).toBe('');
    });

    it('should return "high-confidence" for HIGH confidence', () => {
      component.assessment = { ...mockAssessment, confidence: AssessmentConfidence.HIGH };
      expect(component.getConfidenceClass()).toBe('high-confidence');
    });

    it('should return "medium-confidence" for MEDIUM confidence', () => {
      component.assessment = { ...mockAssessment, confidence: AssessmentConfidence.MEDIUM };
      expect(component.getConfidenceClass()).toBe('medium-confidence');
    });

    it('should return "low-confidence" for LOW confidence', () => {
      component.assessment = { ...mockAssessment, confidence: AssessmentConfidence.LOW };
      expect(component.getConfidenceClass()).toBe('low-confidence');
    });
  });

  describe('getConfidenceIcon Method', () => {
    it('should return "help" when assessment is null', () => {
      component.assessment = null;
      expect(component.getConfidenceIcon()).toBe('help');
    });

    it('should return "verified" for HIGH confidence', () => {
      component.assessment = { ...mockAssessment, confidence: AssessmentConfidence.HIGH };
      expect(component.getConfidenceIcon()).toBe('verified');
    });

    it('should return "thumb_up" for MEDIUM confidence', () => {
      component.assessment = { ...mockAssessment, confidence: AssessmentConfidence.MEDIUM };
      expect(component.getConfidenceIcon()).toBe('thumb_up');
    });

    it('should return "priority_high" for LOW confidence', () => {
      component.assessment = { ...mockAssessment, confidence: AssessmentConfidence.LOW };
      expect(component.getConfidenceIcon()).toBe('priority_high');
    });
  });

  describe('CVR Metric Methods', () => {
    it('getCVRClass should return empty string when metrics is null', () => {
      component.metrics = null;
      expect(component.getCVRClass()).toBe('');
    });

    it('getCVRClass should return "good" for CVR <= 1.0', () => {
      component.metrics = { ...mockMetrics, cvr: 0.95 };
      expect(component.getCVRClass()).toBe('good');
    });

    it('getCVRClass should return "warning" for CVR <= 1.1', () => {
      component.metrics = { ...mockMetrics, cvr: 1.05 };
      expect(component.getCVRClass()).toBe('warning');
    });

    it('getCVRClass should return "danger" for CVR > 1.1', () => {
      component.metrics = { ...mockMetrics, cvr: 1.25 };
      expect(component.getCVRClass()).toBe('danger');
    });

    it('getCVRProgress should return 0 when metrics is null', () => {
      component.metrics = null;
      expect(component.getCVRProgress()).toBe(0);
    });

    it('getCVRProgress should calculate correctly', () => {
      component.metrics = { ...mockMetrics, cvr: 1.0 };
      expect(component.getCVRProgress()).toBeCloseTo(66.67, 1);
    });

    it('getCVRProgressColor should return primary for good CVR', () => {
      component.metrics = { ...mockMetrics, cvr: 0.9 };
      expect(component.getCVRProgressColor()).toBe('primary');
    });

    it('getCVRProgressColor should return accent for warning CVR', () => {
      component.metrics = { ...mockMetrics, cvr: 1.05 };
      expect(component.getCVRProgressColor()).toBe('accent');
    });

    it('getCVRProgressColor should return warn for danger CVR', () => {
      component.metrics = { ...mockMetrics, cvr: 1.2 };
      expect(component.getCVRProgressColor()).toBe('warn');
    });
  });

  describe('Stability Metric Methods', () => {
    it('getStabilityClass should return empty string when metrics is null', () => {
      component.metrics = null;
      expect(component.getStabilityClass()).toBe('');
    });

    it('getStabilityClass should return "good" for CV <= 0.15', () => {
      component.metrics = { ...mockMetrics, velocityCoefficient: 0.12 };
      expect(component.getStabilityClass()).toBe('good');
    });

    it('getStabilityClass should return "warning" for CV <= 0.25', () => {
      component.metrics = { ...mockMetrics, velocityCoefficient: 0.20 };
      expect(component.getStabilityClass()).toBe('warning');
    });

    it('getStabilityClass should return "danger" for CV > 0.25', () => {
      component.metrics = { ...mockMetrics, velocityCoefficient: 0.35 };
      expect(component.getStabilityClass()).toBe('danger');
    });
  });

  describe('Spillover Metric Methods', () => {
    it('getSpilloverClass should return empty string when metrics is null', () => {
      component.metrics = null;
      expect(component.getSpilloverClass()).toBe('');
    });

    it('getSpilloverClass should return "good" for rate < 20', () => {
      component.metrics = { ...mockMetrics, spilloverRate: 15 };
      expect(component.getSpilloverClass()).toBe('good');
    });

    it('getSpilloverClass should return "warning" for rate <= 40', () => {
      component.metrics = { ...mockMetrics, spilloverRate: 30 };
      expect(component.getSpilloverClass()).toBe('warning');
    });

    it('getSpilloverClass should return "danger" for rate > 40', () => {
      component.metrics = { ...mockMetrics, spilloverRate: 50 };
      expect(component.getSpilloverClass()).toBe('danger');
    });

    it('getSpilloverProgressColor should return correct colors', () => {
      component.metrics = { ...mockMetrics, spilloverRate: 10 };
      expect(component.getSpilloverProgressColor()).toBe('primary');

      component.metrics = { ...mockMetrics, spilloverRate: 30 };
      expect(component.getSpilloverProgressColor()).toBe('accent');

      component.metrics = { ...mockMetrics, spilloverRate: 50 };
      expect(component.getSpilloverProgressColor()).toBe('warn');
    });
  });

  describe('Factor Styling Methods', () => {
    it('getFactorScoreClass should return correct class', () => {
      expect(component.getFactorScoreClass(0)).toBe('score-0');
      expect(component.getFactorScoreClass(1)).toBe('score-1');
      expect(component.getFactorScoreClass(2)).toBe('score-2');
      expect(component.getFactorScoreClass(3)).toBe('score-3');
    });

    it('getFactorColor should return primary for low scores', () => {
      expect(component.getFactorColor(0)).toBe('primary');
      expect(component.getFactorColor(1)).toBe('primary');
    });

    it('getFactorColor should return accent for medium score', () => {
      expect(component.getFactorColor(2)).toBe('accent');
    });

    it('getFactorColor should return warn for high score', () => {
      expect(component.getFactorColor(3)).toBe('warn');
    });
  });

  describe('Metrics Display', () => {
    beforeEach(() => {
      component.assessment = mockAssessment;
      component.metrics = mockMetrics;
      fixture.detectChanges();
    });

    it('should display metrics card when metrics is provided', () => {
      const metricsCard = fixture.debugElement.query(By.css('.detail-card.metrics-focus'));
      expect(metricsCard).toBeTruthy();
    });

    it('should display sprint count in subtitle', () => {
      const summaryValues = fixture.debugElement.queryAll(By.css('.metric-summary-grid .mini-metric strong'));
      expect(summaryValues[1].nativeElement.textContent).toContain('5');
    });

    it('should display all metric items', () => {
      const metricItems = fixture.debugElement.queryAll(By.css('.metrics-focus .metric-row'));
      expect(metricItems.length).toBe(4);
    });
  });

  describe('Risk Factors Display', () => {
    beforeEach(() => {
      component.assessment = mockAssessment;
      fixture.detectChanges();
    });

    it('should display factors card', () => {
      const factorsCardTitle = fixture.debugElement.queryAll(By.css('.detail-card h3'))
        .find(el => el.nativeElement.textContent.includes('Risk Factor Breakdown'));
      const factorsCard = factorsCardTitle?.parent;
      expect(factorsCard).toBeTruthy();
    });

    it('should display all risk factors', () => {
      const factorItems = fixture.debugElement.queryAll(By.css('.factor-row'));
      expect(factorItems.length).toBe(5);
    });

    it('should display factor names', () => {
      const factorNames = fixture.debugElement.queryAll(By.css('.factor-name'));
      expect(factorNames[0].nativeElement.textContent).toContain('Overcommitment Risk');
    });

    it('should display factor scores', () => {
      const factorScores = fixture.debugElement.queryAll(By.css('.factor-score'));
      expect(factorScores[0].nativeElement.textContent).toContain('2/3');
    });
  });

  describe('OnChanges Lifecycle', () => {
    it('should handle changes without errors', () => {
      expect(() => {
        component.ngOnChanges({
          assessment: new SimpleChange(null, mockAssessment, true)
        });
      }).not.toThrow();
    });
  });
});
