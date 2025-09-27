import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CommandExecutor } from '../../../utils/command-executor.js';
import { Config } from '../../../types/index.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
const mockSpawn = jest.mocked(spawn);

describe('CommandExecutor', () => {
  let commandExecutor: CommandExecutor;
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0',
      },
      copilot: {
        cliPath: 'gh',
        timeout: 5000,
        maxRetries: 2,
        retryDelay: 100,
      },
      logging: {
        level: 'info',
        format: 'pretty',
      },
    };

    commandExecutor = new CommandExecutor(mockConfig);
    mockSpawn.mockClear();
  });

  it('should execute a successful command', async () => {
    // Mock successful command execution
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockChildProcess.kill = jest.fn();
    
    mockSpawn.mockReturnValue(mockChildProcess);

    const executePromise = commandExecutor.execute('echo', ['hello']);

    // Simulate command output
    setTimeout(() => {
      mockChildProcess.stdout.emit('data', Buffer.from('hello\n'));
      mockChildProcess.emit('close', 0);
    }, 10);

    const result = await executePromise;

    expect(result.success).toBe(true);
    expect(result.stdout).toBe('hello');
    expect(result.exitCode).toBe(0);
    expect(result.command).toBe('echo hello');
  });

  it('should handle command failure', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockChildProcess.kill = jest.fn();
    
    mockSpawn.mockReturnValue(mockChildProcess);

    const executePromise = commandExecutor.execute('false', []);

    setTimeout(() => {
      mockChildProcess.stderr.emit('data', Buffer.from('command failed\n'));
      mockChildProcess.emit('close', 1);
    }, 10);

    const result = await executePromise;

    expect(result.success).toBe(false);
    expect(result.stderr).toBe('command failed');
    expect(result.exitCode).toBe(1);
  });

  it('should retry on failure', async () => {
    let callCount = 0;
    mockSpawn.mockImplementation(() => {
      callCount++;
      const mockChildProcess = new EventEmitter() as any;
      mockChildProcess.stdout = new EventEmitter();
      mockChildProcess.stderr = new EventEmitter();
      mockChildProcess.kill = jest.fn();
      
      setTimeout(() => {
        if (callCount < 2) {
          mockChildProcess.emit('close', 1);
        } else {
          mockChildProcess.stdout.emit('data', Buffer.from('success\n'));
          mockChildProcess.emit('close', 0);
        }
      }, 10);
      
      return mockChildProcess;
    });

    const result = await commandExecutor.execute('flaky-command', []);

    expect(callCount).toBe(2);
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('success');
  });

  it('should respect timeout', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockChildProcess.kill = jest.fn();
    
    mockSpawn.mockReturnValue(mockChildProcess);

    const executePromise = commandExecutor.execute('sleep', ['10'], { timeout: 100 });

    // Don't emit close event to simulate hanging command
    setTimeout(() => {
      // Should be killed by timeout
    }, 200);

    await expect(executePromise).rejects.toThrow('timeout');
    expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('should handle spawn errors', async () => {
    mockSpawn.mockImplementation(() => {
      const mockChildProcess = new EventEmitter() as any;
      mockChildProcess.stdout = new EventEmitter();
      mockChildProcess.stderr = new EventEmitter();
      mockChildProcess.kill = jest.fn();
      
      setTimeout(() => {
        mockChildProcess.emit('error', new Error('spawn error'));
      }, 10);
      
      return mockChildProcess;
    });

    await expect(commandExecutor.execute('nonexistent', [])).rejects.toThrow('spawn error');
  });
});