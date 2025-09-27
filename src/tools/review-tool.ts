import { z } from 'zod';
import { promises as fs } from 'fs';
import { 
  ToolResult, 
  ToolContext, 
  ReviewResult,
  ReviewFinding,
  ValidationError 
} from '../types/index.js';
import { CommandExecutor } from '../utils/index.js';
import { OutputParser } from '../utils/index.js';

const ReviewToolArgsSchema = z.object({
  files: z.array(z.string()).min(1, 'At least one file is required'),
  focusAreas: z.array(z.string()).optional().default([]),
  severity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  language: z.string().optional(),
  includeStyle: z.boolean().default(true),
  includeSecurity: z.boolean().default(true),
  includePerformance: z.boolean().default(true),
  maxIssues: z.number().min(1).max(100).default(50),
});

type ReviewToolArgs = z.infer<typeof ReviewToolArgsSchema>;

export class ReviewTool {
  constructor(
    private readonly commandExecutor: CommandExecutor,
    private readonly outputParser: OutputParser
  ) {}

  async execute(args: unknown, context: ToolContext): Promise<ToolResult> {
    try {
      const validArgs = ReviewToolArgsSchema.parse(args);
      
      // Validate files exist
      await this.validateFiles(validArgs.files);
      
      // Perform review using GitHub Copilot
      const reviewResult = await this.performReview(validArgs, context);
      
      return {
        success: true,
        content: this.formatReviewResult(reviewResult),
        data: {
          reviewResult,
          filesReviewed: validArgs.files.length,
          totalFindings: reviewResult.findings.length,
        },
      };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid arguments for review tool', error.errors);
      }
      
      return {
        success: false,
        content: 'Failed to perform code review',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async validateFiles(files: string[]): Promise<void> {
    const invalidFiles: string[] = [];
    
    for (const file of files) {
      try {
        const stat = await fs.stat(file);
        if (!stat.isFile()) {
          invalidFiles.push(`${file} (not a file)`);
        }
      } catch (error) {
        invalidFiles.push(`${file} (does not exist)`);
      }
    }
    
    if (invalidFiles.length > 0) {
      throw new ValidationError(
        `Invalid files: ${invalidFiles.join(', ')}`
      );
    }
  }

  private async performReview(
    args: ReviewToolArgs, 
    context: ToolContext
  ): Promise<ReviewResult> {
    const findings: ReviewFinding[] = [];
    const recommendations: string[] = [];
    
    // Review each file
    for (const file of args.files) {
      const fileFindings = await this.reviewFile(file, args, context);
      findings.push(...fileFindings);
    }
    
    // Generate overall recommendations
    const overallRecommendations = await this.generateRecommendations(
      findings, 
      args
    );
    recommendations.push(...overallRecommendations);
    
    // Calculate review score (0-100)
    const score = this.calculateReviewScore(findings, args.files.length);
    
    // Generate summary
    const summary = this.generateSummary(findings, args.files.length);
    
    return {
      findings: findings.slice(0, args.maxIssues), // Limit results
      summary,
      score,
      recommendations,
    };
  }

  private async reviewFile(
    file: string, 
    args: ReviewToolArgs, 
    context: ToolContext
  ): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    
    try {
      // Read file content
      const content = await fs.readFile(file, 'utf-8');
      
      // Build review queries based on focus areas
      const queries = this.buildReviewQueries(file, content, args);
      
      // Execute each query
      for (const query of queries) {
        const result = await this.commandExecutor.execute(
          'gh',
          ['copilot', 'suggest', query],
          { timeout: context.config.copilot.timeout }
        );
        
        if (result.success) {
          const response = this.outputParser.parseCopilotOutput(result);
          const fileFindings = this.parseFindings(file, response.output, query);
          findings.push(...fileFindings);
        }
      }
      
    } catch (error) {
      // Add error as a finding
      findings.push({
        file,
        line: 1,
        severity: 'error',
        message: `Failed to review file: ${error instanceof Error ? error.message : String(error)}`,
        category: 'system',
      });
    }
    
    return findings;
  }

  private buildReviewQueries(
    file: string, 
    _content: string, 
    args: ReviewToolArgs
  ): string[] {
    const queries: string[] = [];
    
    const baseContext = `Review this ${args.language || 'code'} file: ${file}`;
    
    // General code quality
    if (args.focusAreas.length === 0 || args.focusAreas.includes('quality')) {
      queries.push(
        `${baseContext}. Identify code quality issues, bugs, and improvements. Focus on logic errors, edge cases, and best practices.`
      );
    }
    
    // Style and formatting
    if (args.includeStyle && (args.focusAreas.length === 0 || args.focusAreas.includes('style'))) {
      queries.push(
        `${baseContext}. Review for coding style, formatting, naming conventions, and readability issues.`
      );
    }
    
    // Security
    if (args.includeSecurity && (args.focusAreas.length === 0 || args.focusAreas.includes('security'))) {
      queries.push(
        `${baseContext}. Analyze for security vulnerabilities, input validation issues, and potential attack vectors.`
      );
    }
    
    // Performance
    if (args.includePerformance && (args.focusAreas.length === 0 || args.focusAreas.includes('performance'))) {
      queries.push(
        `${baseContext}. Review for performance issues, inefficient algorithms, memory leaks, and optimization opportunities.`
      );
    }
    
    // Custom focus areas
    for (const area of args.focusAreas) {
      if (!['quality', 'style', 'security', 'performance'].includes(area)) {
        queries.push(`${baseContext}. Focus specifically on: ${area}`);
      }
    }
    
    return queries;
  }

  private parseFindings(file: string, output: string, query: string): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    
    // Extract line numbers and issues from copilot output
    const lines = output.split('\n');
    let currentLine = 1;
    let currentSeverity: ReviewFinding['severity'] = 'info';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Try to extract line numbers
      const lineMatch = trimmed.match(/line\s+(\d+)/i);
      if (lineMatch && lineMatch[1]) {
        currentLine = parseInt(lineMatch[1], 10);
      }
      
      // Determine severity from keywords
      if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('bug')) {
        currentSeverity = 'error';
      } else if (trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('issue')) {
        currentSeverity = 'warning';
      } else if (trimmed.toLowerCase().includes('suggestion') || trimmed.toLowerCase().includes('improve')) {
        currentSeverity = 'info';
      }
      
      // Extract actual findings (simple heuristic)
      if (trimmed.length > 20 && 
          (trimmed.includes(':') || trimmed.includes('should') || trimmed.includes('could'))) {
        
        // Determine category from query
        let category = 'general';
        if (query.toLowerCase().includes('security')) category = 'security';
        else if (query.toLowerCase().includes('performance')) category = 'performance';
        else if (query.toLowerCase().includes('style')) category = 'style';
        else if (query.toLowerCase().includes('quality')) category = 'quality';
        
        findings.push({
          file,
          line: currentLine,
          severity: currentSeverity,
          message: trimmed,
          category,
        });
      }
    }
    
    return findings;
  }

  private async generateRecommendations(
    findings: ReviewFinding[], 
    _args: ReviewToolArgs
  ): Promise<string[]> {
    if (findings.length === 0) {
      return ['Code looks good! No major issues found.'];
    }
    
    // Group findings by category
    const categories = new Map<string, ReviewFinding[]>();
    for (const finding of findings) {
      const categoryFindings = categories.get(finding.category) || [];
      categoryFindings.push(finding);
      categories.set(finding.category, categoryFindings);
    }
    
    const recommendations: string[] = [];
    
    for (const [category, categoryFindings] of categories) {
      const highPriorityCount = categoryFindings.filter(f => f.severity === 'error').length;
      const mediumPriorityCount = categoryFindings.filter(f => f.severity === 'warning').length;
      
      if (highPriorityCount > 0) {
        recommendations.push(
          `Address ${highPriorityCount} critical ${category} issue(s) immediately`
        );
      }
      
      if (mediumPriorityCount > 0) {
        recommendations.push(
          `Consider fixing ${mediumPriorityCount} ${category} warning(s) in the next iteration`
        );
      }
    }
    
    // Add general recommendations based on findings
    if (findings.some(f => f.category === 'security')) {
      recommendations.push('Consider running additional security scans');
    }
    
    if (findings.some(f => f.category === 'performance')) {
      recommendations.push('Profile the application to validate performance improvements');
    }
    
    return recommendations;
  }

  private calculateReviewScore(findings: ReviewFinding[], fileCount: number): number {
    if (findings.length === 0) return 100;
    
    let deductionPoints = 0;
    
    for (const finding of findings) {
      switch (finding.severity) {
        case 'error':
          deductionPoints += 10;
          break;
        case 'warning':
          deductionPoints += 5;
          break;
        case 'info':
          deductionPoints += 1;
          break;
      }
    }
    
    // Normalize by file count
    const averageDeduction = deductionPoints / fileCount;
    const score = Math.max(0, 100 - averageDeduction);
    
    return Math.round(score);
  }

  private generateSummary(findings: ReviewFinding[], fileCount: number): string {
    const errorCount = findings.filter(f => f.severity === 'error').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;
    
    const parts: string[] = [];
    parts.push(`Reviewed ${fileCount} file${fileCount > 1 ? 's' : ''}`);
    
    if (errorCount > 0) {
      parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
    }
    if (warningCount > 0) {
      parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    }
    if (infoCount > 0) {
      parts.push(`${infoCount} suggestion${infoCount > 1 ? 's' : ''}`);
    }
    
    if (findings.length === 0) {
      return `${parts[0]} - no issues found`;
    }
    
    return parts.join(', ');
  }

  private formatReviewResult(result: ReviewResult): string {
    const lines: string[] = [];
    
    lines.push('🔍 Code Review Results');
    lines.push('='.repeat(50));
    lines.push('');
    
    // Summary
    lines.push(`📊 Summary: ${result.summary}`);
    if (result.score !== undefined) {
      const scoreEmoji = result.score >= 90 ? '🟢' : result.score >= 70 ? '🟡' : '🔴';
      lines.push(`${scoreEmoji} Quality Score: ${result.score}/100`);
    }
    lines.push('');
    
    // Findings
    if (result.findings.length > 0) {
      lines.push('📋 Findings:');
      lines.push('');
      
      // Group by file
      const fileGroups = new Map<string, ReviewFinding[]>();
      for (const finding of result.findings) {
        const fileFindings = fileGroups.get(finding.file) || [];
        fileFindings.push(finding);
        fileGroups.set(finding.file, fileFindings);
      }
      
      for (const [file, fileFindings] of fileGroups) {
        lines.push(`📄 ${file}:`);
        
        for (const finding of fileFindings) {
          const severityIcon = finding.severity === 'error' ? '❌' : 
                              finding.severity === 'warning' ? '⚠️' : 'ℹ️';
          
          lines.push(`  ${severityIcon} Line ${finding.line}: ${finding.message}`);
          
          if (finding.suggestion) {
            lines.push(`    💡 Suggestion: ${finding.suggestion}`);
          }
        }
        lines.push('');
      }
    }
    
    // Recommendations
    if (result.recommendations.length > 0) {
      lines.push('💡 Recommendations:');
      for (const recommendation of result.recommendations) {
        lines.push(`• ${recommendation}`);
      }
    }
    
    return lines.join('\n');
  }

  getSchema(): object {
    return {
      name: 'review',
      description: 'Perform automated code review using GitHub Copilot',
      inputSchema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of files to review',
            minItems: 1,
          },
          focusAreas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific areas to focus on (e.g., security, performance, style)',
            default: [],
          },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Minimum severity level for findings',
            default: 'medium',
          },
          language: {
            type: 'string',
            description: 'Programming language of the files',
          },
          includeStyle: {
            type: 'boolean',
            description: 'Include style and formatting issues',
            default: true,
          },
          includeSecurity: {
            type: 'boolean',
            description: 'Include security vulnerability checks',
            default: true,
          },
          includePerformance: {
            type: 'boolean',
            description: 'Include performance optimization suggestions',
            default: true,
          },
          maxIssues: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            description: 'Maximum number of issues to report',
            default: 50,
          },
        },
        required: ['files'],
      },
    };
  }
}