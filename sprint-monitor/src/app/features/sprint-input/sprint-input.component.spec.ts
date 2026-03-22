import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { SprintInputComponent } from './sprint-input.component';
import { SprintService } from '../../core/services/sprint.service';
import { MetricsService } from '../../core/services/metrics.service';
import { Sprint, SprintMetrics } from '../../core/models/sprint.model';

describe('SprintInputComponent', () => {
  let component: SprintInputComponent;
  let fixture: ComponentFixture<SprintInputComponent>;
  let sprintServiceSpy: jasmine.SpyObj<SprintService>;
  let metricsServiceSpy: jasmine.SpyObj<MetricsService>;

  const mockSprints: Sprint[] = [
    {
      id: 'sprint-1',
      name: 'Sprint 1',
      committedPoints: 30,
      completedPoints: 28,
      teamAvailability: 100,
      teamSize: 5,
      hadSpillover: false,
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-01-17'),
      stories: []
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2',
      committedPoints: 32,
      completedPoints: 25,
      teamAvailability: 90,
      teamSize: 5,
      hadSpillover: true,
      startDate: new Date('2025-01-20'),
      endDate: new Date('2025-01-31'),
      stories: []
    }
  ];

  const mockMetrics: SprintMetrics = {
    averageVelocity: 26.5,
    velocityStandardDeviation: 2.12,
    velocityCoefficient: 0.08,
    spilloverRate: 50,
    effectiveCapacity: 21.2,
    cvr: 1.13,
    sprintCount: 2
  };

  beforeEach(async () => {
    sprintServiceSpy = jasmine.createSpyObj('SprintService', ['getHistoricalSprintsSnapshot']);
    metricsServiceSpy = jasmine.createSpyObj('MetricsService', [
      'calculateMetrics',
      'calculateRecommendedCommitment'
    ]);

    sprintServiceSpy.getHistoricalSprintsSnapshot.and.returnValue(mockSprints);
    metricsServiceSpy.calculateMetrics.and.returnValue(mockMetrics);
    metricsServiceSpy.calculateRecommendedCommitment.and.returnValue(21);

    await TestBed.configureTestingModule({
      imports: [
        SprintInputComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SprintService, useValue: sprintServiceSpy },
        { provide: MetricsService, useValue: metricsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SprintInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
      expect(component.planningForm.get('plannedPoints')?.value).toBe(30);
      expect(component.planningForm.get('teamAvailability')?.value).toBe(100);
      expect(component.planningForm.get('teamSize')?.value).toBe(5);
      expect(component.planningForm.get('externalDependencies')?.value).toBe(0);
    });

    it('should load historical data on init', () => {
      expect(sprintServiceSpy.getHistoricalSprintsSnapshot).toHaveBeenCalled();
      expect(metricsServiceSpy.calculateMetrics).toHaveBeenCalled();
      expect(component.historicalMetrics).toEqual(mockMetrics);
    });

    it('should calculate recommended commitment', () => {
      expect(metricsServiceSpy.calculateRecommendedCommitment).toHaveBeenCalled();
      expect(component.recommendedCommitment).toBe(21);
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when planned points is empty', () => {
      component.planningForm.patchValue({ plannedPoints: null });
      expect(component.planningForm.valid).toBeFalse();
      expect(component.hasError('plannedPoints', 'required')).toBeTrue();
    });

    it('should be invalid when planned points is negative', () => {
      component.planningForm.patchValue({ plannedPoints: -5 });
      expect(component.hasError('plannedPoints', 'min')).toBeTrue();
    });

    it('should be invalid when team size is less than 1', () => {
      component.planningForm.patchValue({ teamSize: 0 });
      expect(component.planningForm.valid).toBeFalse();
    });

    it('should be valid with correct values', () => {
      component.planningForm.patchValue({
        plannedPoints: 30,
        teamAvailability: 80,
        teamSize: 5,
        externalDependencies: 2
      });
      expect(component.planningForm.valid).toBeTrue();
    });

    it('should validate team availability between 0 and 100', () => {
      component.planningForm.patchValue({ teamAvailability: 150 });
      expect(component.planningForm.valid).toBeFalse();
    });
  });

  describe('Form Submission', () => {
    it('should emit evaluate event on valid form submission', () => {
      spyOn(component.evaluate, 'emit');
      
      component.planningForm.patchValue({
        plannedPoints: 35,
        teamAvailability: 90,
        teamSize: 5,
        externalDependencies: 2
      });
      
      component.onSubmit();
      
      expect(component.evaluate.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          plannedStoryPoints: 35,
          teamAvailability: 90,
          teamSize: 5,
          externalDependencies: 2
        })
      );
    });

    it('should not emit evaluate event on invalid form submission', () => {
      spyOn(component.evaluate, 'emit');
      
      component.planningForm.patchValue({ plannedPoints: null });
      component.onSubmit();
      
      expect(component.evaluate.emit).not.toHaveBeenCalled();
    });

    it('should include historical sprints in emitted input', () => {
      spyOn(component.evaluate, 'emit');
      
      component.onSubmit();
      
      expect(component.evaluate.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          historicalSprints: mockSprints
        })
      );
    });
  });

  describe('Load Sample Data', () => {
    it('should load sample data when button is clicked', () => {
      component.loadSampleData();
      
      expect(component.planningForm.get('plannedPoints')?.value).toBe(35);
      expect(component.planningForm.get('teamAvailability')?.value).toBe(90);
      expect(component.planningForm.get('teamSize')?.value).toBe(5);
      expect(component.planningForm.get('externalDependencies')?.value).toBe(2);
    });

    it('should recalculate metrics after loading sample data', () => {
      const initialCallCount = metricsServiceSpy.calculateMetrics.calls.count();
      
      component.loadSampleData();
      
      expect(metricsServiceSpy.calculateMetrics.calls.count()).toBeGreaterThan(initialCallCount);
    });
  });

  describe('UI Display', () => {
    it('should display historical metrics when available', () => {
      fixture.detectChanges();
      const summaryElement = fixture.debugElement.query(By.css('.data-summary'));
      expect(summaryElement).toBeTruthy();
    });

    it('should display average velocity in summary', () => {
      fixture.detectChanges();
      const velocityElement = fixture.debugElement.query(By.css('.metric .value'));
      expect(velocityElement.nativeElement.textContent).toContain('26.5');
    });

    it('should display recommended commitment hint', () => {
      fixture.detectChanges();
      const hintElement = fixture.debugElement.query(By.css('mat-hint'));
      expect(hintElement.nativeElement.textContent).toContain('21');
    });

    it('should disable submit button when form is invalid', () => {
      component.planningForm.patchValue({ plannedPoints: null });
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBeTrue();
    });

    it('should enable submit button when form is valid', () => {
      component.planningForm.patchValue({
        plannedPoints: 30,
        teamAvailability: 100,
        teamSize: 5,
        externalDependencies: 0
      });
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBeFalse();
    });
  });

  describe('Helper Methods', () => {
    it('should return correct control value', () => {
      component.planningForm.patchValue({ plannedPoints: 42 });
      expect(component.getControlValue('plannedPoints')).toBe(42);
    });

    it('should correctly check for errors', () => {
      component.planningForm.patchValue({ plannedPoints: null });
      component.planningForm.get('plannedPoints')?.markAsTouched();
      
      expect(component.hasError('plannedPoints', 'required')).toBeTrue();
      expect(component.hasError('plannedPoints', 'min')).toBeFalse();
    });
  });
});
