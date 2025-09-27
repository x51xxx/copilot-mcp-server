import { Progress, ProgressStep } from '../types/index.js';

export class ProgressTracker {
  private progressMap = new Map<string, Progress>();
  private listeners: Array<(progress: Progress) => void> = [];

  /**
   * Create a new progress tracker
   */
  create(id: string, name: string, stepNames: string[]): Progress {
    const steps: ProgressStep[] = stepNames.map((stepName, index) => ({
      id: `${id}-step-${index}`,
      name: stepName,
      status: 'pending',
    }));

    const progress: Progress = {
      id,
      name,
      steps,
      startTime: new Date(),
      status: 'running',
    };

    this.progressMap.set(id, progress);
    this.notifyListeners(progress);

    return progress;
  }

  /**
   * Start a specific step
   */
  startStep(progressId: string, stepId: string): void {
    const progress = this.progressMap.get(progressId);
    if (!progress) return;

    const step = progress.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.status = 'running';
    step.startTime = new Date();

    this.notifyListeners(progress);
  }

  /**
   * Complete a step successfully
   */
  completeStep(progressId: string, stepId: string, output?: string): void {
    const progress = this.progressMap.get(progressId);
    if (!progress) return;

    const step = progress.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.status = 'completed';
    step.endTime = new Date();
    if (output !== undefined) {
      step.output = output;
    }

    // Check if all steps are completed
    const allCompleted = progress.steps.every((s) => s.status === 'completed');
    if (allCompleted) {
      progress.status = 'completed';
      progress.endTime = new Date();
    }

    this.notifyListeners(progress);
  }

  /**
   * Mark a step as failed
   */
  failStep(progressId: string, stepId: string, error: string): void {
    const progress = this.progressMap.get(progressId);
    if (!progress) return;

    const step = progress.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.status = 'failed';
    step.endTime = new Date();
    step.error = error;

    // Mark overall progress as failed
    progress.status = 'failed';
    progress.endTime = new Date();

    this.notifyListeners(progress);
  }

  /**
   * Get progress by ID
   */
  getProgress(id: string): Progress | undefined {
    return this.progressMap.get(id);
  }

  /**
   * Get all progress items
   */
  getAllProgress(): Progress[] {
    return Array.from(this.progressMap.values());
  }

  /**
   * Remove completed or failed progress items older than specified time
   */
  cleanup(olderThanMs = 24 * 60 * 60 * 1000): void {
    // 24 hours default
    const cutoffTime = new Date(Date.now() - olderThanMs);

    for (const [id, progress] of this.progressMap.entries()) {
      if (progress.status !== 'running' && progress.endTime && progress.endTime < cutoffTime) {
        this.progressMap.delete(id);
      }
    }
  }

  /**
   * Add a progress listener
   */
  addListener(listener: (progress: Progress) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a progress listener
   */
  removeListener(listener: (progress: Progress) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Format progress for display
   */
  formatProgress(progress: Progress): string {
    const lines: string[] = [];

    lines.push(`📊 ${progress.name} [${progress.status.toUpperCase()}]`);
    lines.push(`Started: ${progress.startTime.toLocaleString()}`);

    if (progress.endTime) {
      const duration = progress.endTime.getTime() - progress.startTime.getTime();
      lines.push(`Duration: ${Math.round(duration / 1000)}s`);
    }

    lines.push('');
    lines.push('Steps:');

    for (const step of progress.steps) {
      const statusIcon = this.getStatusIcon(step.status);
      const duration =
        step.startTime && step.endTime
          ? ` (${Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s)`
          : '';

      lines.push(`  ${statusIcon} ${step.name}${duration}`);

      if (step.error) {
        lines.push(`    Error: ${step.error}`);
      }

      if (step.output && step.output.trim()) {
        const output = step.output.trim();
        if (output.length > 100) {
          lines.push(`    Output: ${output.substring(0, 100)}...`);
        } else {
          lines.push(`    Output: ${output}`);
        }
      }
    }

    return lines.join('\n');
  }

  private getStatusIcon(status: ProgressStep['status']): string {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  }

  private notifyListeners(progress: Progress): void {
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch (error) {
        // Ignore listener errors to prevent cascading failures
        console.error('Progress listener error:', error);
      }
    }
  }
}
