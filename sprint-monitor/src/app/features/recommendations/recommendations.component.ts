import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  Recommendation,
  RecommendationPriority,
  ActionType
} from '../../core/models/risk.model';

/**
 * Recommendations Component
 * Displays actionable recommendations based on risk assessment.
 * Provides prioritized suggestions for improving sprint feasibility.
 */
@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.scss']
})
export class RecommendationsComponent {
  @Input() recommendations: Recommendation[] = [];
  @Output() apply = new EventEmitter<Recommendation>();
  @Output() dismiss = new EventEmitter<Recommendation>();

  // Expose ActionType enum for template
  ActionType = ActionType;

  /**
   * Get CSS class for recommendation priority
   */
  getPriorityClass(priority: RecommendationPriority): string {
    return priority.toLowerCase();
  }

  /**
   * Get CSS class for priority chip styling
   */
  getPriorityChipClass(priority: RecommendationPriority): string {
    return priority.toLowerCase() + '-chip';
  }

  /**
   * Get icon name based on action type
   */
  getActionIcon(actionType: ActionType): string {
    switch (actionType) {
      case ActionType.REDUCE_SCOPE: return 'remove_circle_outline';
      case ActionType.SPLIT_STORIES: return 'call_split';
      case ActionType.ADD_BUFFER: return 'security';
      case ActionType.RESOLVE_DEPENDENCIES: return 'link_off';
      case ActionType.INCREASE_CAPACITY: return 'group_add';
      case ActionType.IMPROVE_ESTIMATION: return 'straighten';
      default: return 'lightbulb';
    }
  }

  /**
   * Find the reduce scope recommendation if present
   */
  getReduceScopeRecommendation(): Recommendation | undefined {
    return this.recommendations.find(r => r.actionType === ActionType.REDUCE_SCOPE);
  }

  /**
   * Check if any recommendation has the specified action type
   */
  hasActionType(type: ActionType): boolean {
    return this.recommendations.some(r => r.actionType === type);
  }

  /**
   * Handle apply recommendation action
   */
  onApplyRecommendation(rec: Recommendation): void {
    console.log('Applying recommendation:', rec.title);
    this.apply.emit(rec);
  }

  /**
   * Handle dismiss recommendation action
   */
  onDismissRecommendation(rec: Recommendation): void {
    const index = this.recommendations.indexOf(rec);
    if (index > -1) {
      this.recommendations = [
        ...this.recommendations.slice(0, index),
        ...this.recommendations.slice(index + 1)
      ];
    }
    this.dismiss.emit(rec);
  }
}
