import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { RecommendationsComponent } from './recommendations.component';
import {
  Recommendation,
  RecommendationPriority,
  ActionType
} from '../../core/models/risk.model';

describe('RecommendationsComponent', () => {
  let component: RecommendationsComponent;
  let fixture: ComponentFixture<RecommendationsComponent>;

  const mockRecommendations: Recommendation[] = [
    {
      id: 'rec-1',
      title: 'Reduce Sprint Scope',
      description: 'Consider removing 5 story points to align with team velocity',
      priority: RecommendationPriority.HIGH,
      actionType: ActionType.REDUCE_SCOPE,
      addressesRiskFactor: 'Overcommitment Risk',
      suggestedChange: 'Remove 5 story points from sprint'
    },
    {
      id: 'rec-2',
      title: 'Split Large Stories',
      description: 'Break down stories larger than 8 points into smaller tasks',
      priority: RecommendationPriority.MEDIUM,
      actionType: ActionType.SPLIT_STORIES,
      addressesRiskFactor: 'Story Size Risk'
    },
    {
      id: 'rec-3',
      title: 'Add Buffer Time',
      description: 'Reserve 10% of capacity for unplanned work',
      priority: RecommendationPriority.LOW,
      actionType: ActionType.ADD_BUFFER,
      addressesRiskFactor: 'Spillover Risk',
      suggestedChange: 'Reserve 3 story points as buffer'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RecommendationsComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty recommendations array', () => {
      expect(component.recommendations).toEqual([]);
    });

    it('should expose ActionType enum', () => {
      expect(component.ActionType).toBe(ActionType);
    });

    it('should display no recommendations state when array is empty', () => {
      fixture.detectChanges();
      const noRecs = fixture.debugElement.query(By.css('.no-recommendations'));
      expect(noRecs).toBeTruthy();
    });
  });

  describe('Recommendations Display', () => {
    beforeEach(() => {
      component.recommendations = [...mockRecommendations];
      fixture.detectChanges();
    });

    it('should display recommendations card when recommendations exist', () => {
      const card = fixture.debugElement.query(By.css('.recommendations-card'));
      expect(card).toBeTruthy();
    });

    it('should display correct number of recommendations in subtitle', () => {
      const subtitle = fixture.debugElement.query(By.css('mat-card-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('3 suggestions');
    });

    it('should display single recommendation without plural', () => {
      component.recommendations = [mockRecommendations[0]];
      fixture.detectChanges();
      const subtitle = fixture.debugElement.query(By.css('mat-card-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('1 suggestion');
    });

    it('should render expansion panels for each recommendation', () => {
      const panels = fixture.debugElement.queryAll(By.css('mat-expansion-panel'));
      expect(panels.length).toBe(3);
    });

    it('should have first panel expanded by default', () => {
      const firstPanel = fixture.debugElement.query(By.css('mat-expansion-panel'));
      expect(firstPanel.classes['mat-expanded']).toBeTruthy();
    });
  });

  describe('getPriorityClass Method', () => {
    it('should return "critical" for CRITICAL priority', () => {
      expect(component.getPriorityClass(RecommendationPriority.CRITICAL)).toBe('critical');
    });

    it('should return "high" for HIGH priority', () => {
      expect(component.getPriorityClass(RecommendationPriority.HIGH)).toBe('high');
    });

    it('should return "medium" for MEDIUM priority', () => {
      expect(component.getPriorityClass(RecommendationPriority.MEDIUM)).toBe('medium');
    });

    it('should return "low" for LOW priority', () => {
      expect(component.getPriorityClass(RecommendationPriority.LOW)).toBe('low');
    });
  });

  describe('getPriorityChipClass Method', () => {
    it('should return "critical-chip" for CRITICAL priority', () => {
      expect(component.getPriorityChipClass(RecommendationPriority.CRITICAL)).toBe('critical-chip');
    });

    it('should return "high-chip" for HIGH priority', () => {
      expect(component.getPriorityChipClass(RecommendationPriority.HIGH)).toBe('high-chip');
    });

    it('should return "medium-chip" for MEDIUM priority', () => {
      expect(component.getPriorityChipClass(RecommendationPriority.MEDIUM)).toBe('medium-chip');
    });

    it('should return "low-chip" for LOW priority', () => {
      expect(component.getPriorityChipClass(RecommendationPriority.LOW)).toBe('low-chip');
    });
  });

  describe('getActionIcon Method', () => {
    it('should return "remove_circle_outline" for REDUCE_SCOPE', () => {
      expect(component.getActionIcon(ActionType.REDUCE_SCOPE)).toBe('remove_circle_outline');
    });

    it('should return "call_split" for SPLIT_STORIES', () => {
      expect(component.getActionIcon(ActionType.SPLIT_STORIES)).toBe('call_split');
    });

    it('should return "security" for ADD_BUFFER', () => {
      expect(component.getActionIcon(ActionType.ADD_BUFFER)).toBe('security');
    });

    it('should return "link_off" for RESOLVE_DEPENDENCIES', () => {
      expect(component.getActionIcon(ActionType.RESOLVE_DEPENDENCIES)).toBe('link_off');
    });

    it('should return "group_add" for INCREASE_CAPACITY', () => {
      expect(component.getActionIcon(ActionType.INCREASE_CAPACITY)).toBe('group_add');
    });

    it('should return "straighten" for IMPROVE_ESTIMATION', () => {
      expect(component.getActionIcon(ActionType.IMPROVE_ESTIMATION)).toBe('straighten');
    });

    it('should return "lightbulb" for unknown action type', () => {
      expect(component.getActionIcon('UNKNOWN' as ActionType)).toBe('lightbulb');
    });
  });

  describe('getReduceScopeRecommendation Method', () => {
    it('should return reduce scope recommendation when present', () => {
      component.recommendations = [...mockRecommendations];
      const result = component.getReduceScopeRecommendation();
      expect(result).toBeTruthy();
      expect(result?.actionType).toBe(ActionType.REDUCE_SCOPE);
    });

    it('should return undefined when no reduce scope recommendation exists', () => {
      component.recommendations = [mockRecommendations[1], mockRecommendations[2]];
      const result = component.getReduceScopeRecommendation();
      expect(result).toBeUndefined();
    });
  });

  describe('hasActionType Method', () => {
    beforeEach(() => {
      component.recommendations = [...mockRecommendations];
    });

    it('should return true when action type exists', () => {
      expect(component.hasActionType(ActionType.REDUCE_SCOPE)).toBeTrue();
      expect(component.hasActionType(ActionType.SPLIT_STORIES)).toBeTrue();
      expect(component.hasActionType(ActionType.ADD_BUFFER)).toBeTrue();
    });

    it('should return false when action type does not exist', () => {
      expect(component.hasActionType(ActionType.RESOLVE_DEPENDENCIES)).toBeFalse();
      expect(component.hasActionType(ActionType.INCREASE_CAPACITY)).toBeFalse();
    });
  });

  describe('onApplyRecommendation Method', () => {
    it('should emit apply event with recommendation', () => {
      spyOn(component.apply, 'emit');
      const rec = mockRecommendations[0];
      
      component.onApplyRecommendation(rec);
      
      expect(component.apply.emit).toHaveBeenCalledWith(rec);
    });

    it('should log to console', () => {
      spyOn(console, 'log');
      const rec = mockRecommendations[0];
      
      component.onApplyRecommendation(rec);
      
      expect(console.log).toHaveBeenCalledWith('Applying recommendation:', rec.title);
    });
  });

  describe('onDismissRecommendation Method', () => {
    beforeEach(() => {
      component.recommendations = [...mockRecommendations];
    });

    it('should remove recommendation from array', () => {
      const rec = mockRecommendations[0];
      const initialLength = component.recommendations.length;
      
      component.onDismissRecommendation(rec);
      
      expect(component.recommendations.length).toBe(initialLength - 1);
      expect(component.recommendations.find(r => r === rec)).toBeUndefined();
    });

    it('should emit dismiss event with recommendation', () => {
      spyOn(component.dismiss, 'emit');
      const rec = mockRecommendations[0];
      
      component.onDismissRecommendation(rec);
      
      expect(component.dismiss.emit).toHaveBeenCalledWith(rec);
    });

    it('should not affect array if recommendation not found', () => {
      const unknownRec: Recommendation = {
        id: 'rec-unknown',
        title: 'Unknown',
        description: 'Test',
        priority: RecommendationPriority.LOW,
        actionType: ActionType.ADD_BUFFER,
        addressesRiskFactor: 'Test'
      };
      const initialLength = component.recommendations.length;
      
      component.onDismissRecommendation(unknownRec);
      
      expect(component.recommendations.length).toBe(initialLength);
    });
  });

  describe('Quick Summary Section', () => {
    beforeEach(() => {
      component.recommendations = [...mockRecommendations];
      fixture.detectChanges();
    });

    it('should display quick summary section', () => {
      const summary = fixture.debugElement.query(By.css('.quick-summary'));
      expect(summary).toBeTruthy();
    });

    it('should display reduce scope summary when applicable', () => {
      const summaryItems = fixture.debugElement.queryAll(By.css('.summary-item'));
      const reduceItem = summaryItems.find(item => 
        item.nativeElement.textContent.includes('Remove 5 story points')
      );
      expect(reduceItem).toBeTruthy();
    });

    it('should display split stories summary when applicable', () => {
      const summaryItems = fixture.debugElement.queryAll(By.css('.summary-item'));
      const splitItem = summaryItems.find(item => 
        item.nativeElement.textContent.includes('splitting large stories')
      );
      expect(splitItem).toBeTruthy();
    });

    it('should display add buffer summary when applicable', () => {
      const summaryItems = fixture.debugElement.queryAll(By.css('.summary-item'));
      const bufferItem = summaryItems.find(item => 
        item.nativeElement.textContent.includes('Reserve buffer')
      );
      expect(bufferItem).toBeTruthy();
    });
  });

  describe('No Recommendations State', () => {
    it('should show no recommendations card when array is empty', () => {
      component.recommendations = [];
      fixture.detectChanges();
      
      const noRecsCard = fixture.debugElement.query(By.css('.no-recommendations-card'));
      const recsCard = fixture.debugElement.query(By.css('.recommendations-card'));
      
      expect(noRecsCard).toBeTruthy();
      expect(recsCard).toBeFalsy();
    });

    it('should show no recommendations card when array is null/undefined', () => {
      component.recommendations = undefined as any;
      fixture.detectChanges();
      
      const noRecsCard = fixture.debugElement.query(By.css('.no-recommendations-card'));
      expect(noRecsCard).toBeTruthy();
    });

    it('should display positive message', () => {
      component.recommendations = [];
      fixture.detectChanges();
      
      const noRecs = fixture.debugElement.query(By.css('.no-recommendations'));
      expect(noRecs.nativeElement.textContent).toContain('No Recommendations Needed');
      expect(noRecs.nativeElement.textContent).toContain('looks good');
    });
  });
});
