import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ProgressTracker } from '../../../services/progress-tracker.js';
import { Progress, ProgressStep } from '../../../types/index.js';

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let mockListener: jest.Mock;

  beforeEach(() => {
    progressTracker = new ProgressTracker();
    mockListener = jest.fn();
    progressTracker.addListener(mockListener);
  });

  it('should create progress with pending steps', () => {
    const progress = progressTracker.create('test-id', 'Test Progress', ['step1', 'step2']);

    expect(progress.id).toBe('test-id');
    expect(progress.name).toBe('Test Progress');
    expect(progress.status).toBe('running');
    expect(progress.steps).toHaveLength(2);
    expect(progress.steps[0]?.name).toBe('step1');
    expect(progress.steps[0]?.status).toBe('pending');
    expect(progress.steps[1]?.name).toBe('step2');
    expect(progress.steps[1]?.status).toBe('pending');
    expect(mockListener).toHaveBeenCalledWith(progress);
  });

  it('should start a step', () => {
    const progress = progressTracker.create('test-id', 'Test Progress', ['step1']);
    const stepId = progress.steps[0]?.id || '';
    mockListener.mockClear();

    progressTracker.startStep('test-id', stepId);

    expect(progress.steps[0]?.status).toBe('running');
    expect(progress.steps[0]?.startTime).toBeDefined();
    expect(mockListener).toHaveBeenCalledWith(progress);
  });

  it('should complete a step', () => {
    const progress = progressTracker.create('test-id', 'Test Progress', ['step1']);
    const stepId = progress.steps[0]?.id || '';
    mockListener.mockClear();

    progressTracker.completeStep('test-id', stepId, 'Step completed');

    expect(progress.steps[0]?.status).toBe('completed');
    expect(progress.steps[0]?.endTime).toBeDefined();
    expect(progress.steps[0]?.output).toBe('Step completed');
    expect(mockListener).toHaveBeenCalledWith(progress);
  });

  it('should fail a step', () => {
    const progress = progressTracker.create('test-id', 'Test Progress', ['step1']);
    const stepId = progress.steps[0]?.id || '';
    mockListener.mockClear();

    progressTracker.failStep('test-id', stepId, 'Step failed');

    expect(progress.steps[0]?.status).toBe('failed');
    expect(progress.steps[0]?.error).toBe('Step failed');
    expect(progress.status).toBe('failed');
    expect(mockListener).toHaveBeenCalledWith(progress);
  });

  it('should mark progress as completed when all steps are completed', () => {
    const progress = progressTracker.create('test-id', 'Test Progress', ['step1', 'step2']);
    const step1Id = progress.steps[0]?.id || '';
    const step2Id = progress.steps[1]?.id || '';

    progressTracker.completeStep('test-id', step1Id);
    expect(progress.status).toBe('running');

    progressTracker.completeStep('test-id', step2Id);
    expect(progress.status).toBe('completed');
    expect(progress.endTime).toBeDefined();
  });

  it('should retrieve progress by ID', () => {
    const progress = progressTracker.create('test-id', 'Test Progress', ['step1']);
    
    const retrieved = progressTracker.getProgress('test-id');
    expect(retrieved).toBe(progress);

    const notFound = progressTracker.getProgress('nonexistent');
    expect(notFound).toBeUndefined();
  });

  it('should list all progress items', () => {
    progressTracker.create('id1', 'Progress 1', ['step1']);
    progressTracker.create('id2', 'Progress 2', ['step1']);

    const allProgress = progressTracker.getAllProgress();
    expect(allProgress).toHaveLength(2);
    expect(allProgress.map(p => p.id)).toEqual(['id1', 'id2']);
  });

  it('should cleanup old progress items', () => {
    // Create a progress item and mark it as completed
    const progress = progressTracker.create('old-id', 'Old Progress', ['step1']);
    const stepId = progress.steps[0]?.id || '';
    progressTracker.completeStep('old-id', stepId);

    // Manually set end time to be old
    progress.endTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

    // Cleanup with 24 hour threshold
    progressTracker.cleanup(24 * 60 * 60 * 1000);

    const retrieved = progressTracker.getProgress('old-id');
    expect(retrieved).toBeUndefined();
  });

  it('should format progress for display', () => {
    const progress = progressTracker.create('test-id', 'Test Progress', ['step1', 'step2']);
    const step1Id = progress.steps[0]?.id || '';
    
    progressTracker.startStep('test-id', step1Id);
    progressTracker.completeStep('test-id', step1Id, 'First step done');

    const formatted = progressTracker.formatProgress(progress);

    expect(formatted).toContain('Test Progress');
    expect(formatted).toContain('RUNNING');
    expect(formatted).toContain('✅ step1');
    expect(formatted).toContain('⏳ step2');
    expect(formatted).toContain('Output: First step done');
  });

  it('should remove listeners', () => {
    progressTracker.removeListener(mockListener);
    
    progressTracker.create('test-id', 'Test Progress', ['step1']);
    
    expect(mockListener).not.toHaveBeenCalled();
  });

  it('should handle listener errors gracefully', () => {
    const errorListener = jest.fn(() => {
      throw new Error('Listener error');
    });
    
    progressTracker.addListener(errorListener);
    
    // Should not throw even if listener throws
    expect(() => {
      progressTracker.create('test-id', 'Test Progress', ['step1']);
    }).not.toThrow();
    
    expect(errorListener).toHaveBeenCalled();
  });
});