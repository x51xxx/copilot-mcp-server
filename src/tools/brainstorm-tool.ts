import { z } from 'zod';
import { 
  ToolResult, 
  ToolContext, 
  ValidationError 
} from '../types/index.js';
import { CommandExecutor } from '../utils/index.js';
import { OutputParser } from '../utils/index.js';

import { 
  BrainstormResult,
  BrainstormIdea 
} from '../types/index.js';

const BrainstormToolArgsSchema = z.object({
  topic: z.string().min(1, 'Topic cannot be empty'),
  context: z.string().optional(),
  constraints: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  ideaCount: z.number().min(1).max(20).default(5),
  includeImplementation: z.boolean().default(false),
  includeRisks: z.boolean().default(false),
  creativityLevel: z.enum(['conservative', 'balanced', 'creative']).default('balanced'),
});

type BrainstormToolArgs = z.infer<typeof BrainstormToolArgsSchema>;

export class BrainstormTool {
  constructor(
    private readonly commandExecutor: CommandExecutor,
    private readonly outputParser: OutputParser
  ) {}

  async execute(args: unknown, context: ToolContext): Promise<ToolResult> {
    try {
      const validArgs = BrainstormToolArgsSchema.parse(args);
      
      const brainstormResult = await this.performBrainstorm(validArgs, context);
      
      return {
        success: true,
        content: this.formatBrainstormResult(brainstormResult),
        data: {
          brainstormResult,
          ideaCount: brainstormResult.ideas.length,
          topic: validArgs.topic,
        },
      };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid arguments for brainstorm tool', error.errors);
      }
      
      return {
        success: false,
        content: 'Failed to perform brainstorming session',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async performBrainstorm(
    args: BrainstormToolArgs, 
    context: ToolContext
  ): Promise<BrainstormResult> {
    // Generate ideas using different prompting strategies
    const ideas = await this.generateIdeas(args, context);
    
    // Generate summary
    const summary = this.generateSummary(ideas, args.topic);
    
    // Generate next steps
    const nextSteps = await this.generateNextSteps(ideas, args);
    
    return {
      ideas,
      summary,
      nextSteps,
    };
  }

  private async generateIdeas(
    args: BrainstormToolArgs, 
    context: ToolContext
  ): Promise<BrainstormIdea[]> {
    const ideas: BrainstormIdea[] = [];
    
    // Generate ideas using different approaches
    const approaches = this.getBrainstormApproaches(args);
    
    for (const approach of approaches) {
      try {
        const query = this.buildBrainstormQuery(args, approach);
        
        const result = await this.commandExecutor.execute(
          'gh',
          ['copilot', 'suggest', query],
          { timeout: context.config.copilot.timeout }
        );
        
        if (result.success) {
          const response = this.outputParser.parseCopilotOutput(result);
          const extractedIdeas = this.extractIdeas(response.output, approach);
          ideas.push(...extractedIdeas);
        }
      } catch (error) {
        // Continue with other approaches if one fails
        console.warn(`Brainstorm approach "${approach.name}" failed:`, error);
      }
    }
    
    // Remove duplicates and limit to requested count
    const uniqueIdeas = this.deduplicateIdeas(ideas);
    const scoredIdeas = this.scoreIdeas(uniqueIdeas);
    
    // Sort by combined score and take top ideas
    const sortedIdeas = scoredIdeas.sort((a, b) => 
      this.calculateOverallScore(b) - this.calculateOverallScore(a)
    );
    
    return sortedIdeas.slice(0, args.ideaCount);
  }

  private getBrainstormApproaches(args: BrainstormToolArgs): Array<{
    name: string;
    description: string;
    creativityBoost: boolean;
  }> {
    const approaches = [
      {
        name: 'direct',
        description: 'Direct brainstorming',
        creativityBoost: false,
      },
      {
        name: 'analogy',
        description: 'Analogical thinking',
        creativityBoost: true,
      },
      {
        name: 'reverse',
        description: 'Reverse brainstorming',
        creativityBoost: true,
      },
      {
        name: 'scamper',
        description: 'SCAMPER technique',
        creativityBoost: true,
      },
    ];
    
    // Filter based on creativity level
    if (args.creativityLevel === 'conservative') {
      return approaches.filter(a => !a.creativityBoost);
    } else if (args.creativityLevel === 'balanced') {
      return approaches.slice(0, 2);
    } else {
      return approaches;
    }
  }

  private buildBrainstormQuery(
    args: BrainstormToolArgs, 
    approach: { name: string; description: string }
  ): string {
    let query = '';
    
    switch (approach.name) {
      case 'direct':
        query = `Generate creative ideas for: ${args.topic}`;
        break;
        
      case 'analogy':
        query = `Think of analogies and metaphors related to "${args.topic}" and use them to generate innovative solutions`;
        break;
        
      case 'reverse':
        query = `Use reverse brainstorming for "${args.topic}": think of ways to make the problem worse, then reverse those ideas`;
        break;
        
      case 'scamper':
        query = `Apply SCAMPER technique (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse) to "${args.topic}"`;
        break;
        
      default:
        query = `Brainstorm ideas for: ${args.topic}`;
    }
    
    // Add context
    if (args.context) {
      query += `. Context: ${args.context}`;
    }
    
    // Add constraints
    if (args.constraints.length > 0) {
      query += `. Constraints: ${args.constraints.join(', ')}`;
    }
    
    // Add goals
    if (args.goals.length > 0) {
      query += `. Goals: ${args.goals.join(', ')}`;
    }
    
    // Add specific instructions
    query += '. Provide specific, actionable ideas with brief descriptions.';
    
    if (args.includeImplementation) {
      query += ' Include implementation suggestions.';
    }
    
    if (args.includeRisks) {
      query += ' Mention potential risks or challenges.';
    }
    
    return query;
  }

  private extractIdeas(output: string, approach: { name: string }): BrainstormIdea[] {
    const ideas: BrainstormIdea[] = [];
    const lines = output.split('\n');
    
    let currentIdea: Partial<BrainstormIdea> | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Look for numbered items or bullet points
      const numberedMatch = trimmed.match(/^(\d+)\.?\s+(.+)$/);
      const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
      
      if (numberedMatch || bulletMatch) {
        // Save previous idea
        if (currentIdea && currentIdea.title) {
          ideas.push(this.completeIdea(currentIdea, approach));
        }
        
        // Start new idea
        const title = (numberedMatch?.[2] || bulletMatch?.[1] || '').trim();
        currentIdea = {
          id: this.generateIdeaId(title),
          title,
          description: title, // Will be enhanced later
          tags: [approach.name],
        };
      } else if (currentIdea && trimmed.length > 20) {
        // Additional description for current idea
        currentIdea.description = (currentIdea.description || '') + ' ' + trimmed;
      } else if (trimmed.length > 10 && !currentIdea) {
        // Standalone idea without numbering
        const title = trimmed.length > 100 ? trimmed.substring(0, 100) + '...' : trimmed;
        currentIdea = {
          id: this.generateIdeaId(title),
          title,
          description: trimmed,
          tags: [approach.name],
        };
        
        ideas.push(this.completeIdea(currentIdea, approach));
        currentIdea = null;
      }
    }
    
    // Add last idea
    if (currentIdea && currentIdea.title) {
      ideas.push(this.completeIdea(currentIdea, approach));
    }
    
    return ideas;
  }

  private completeIdea(
    partial: Partial<BrainstormIdea>, 
    approach: { name: string }
  ): BrainstormIdea {
    return {
      id: partial.id || this.generateIdeaId(partial.title || 'untitled'),
      title: partial.title || 'Untitled Idea',
      description: (partial.description || '').trim(),
      feasibility: this.estimateFeasibility(partial.description || ''),
      impact: this.estimateImpact(partial.description || ''),
      complexity: this.estimateComplexity(partial.description || ''),
      tags: partial.tags || [approach.name],
    };
  }

  private generateIdeaId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private estimateFeasibility(description: string): number {
    // Simple heuristic based on keywords
    const lowFeasibilityKeywords = ['revolutionary', 'breakthrough', 'impossible', 'never'];
    const highFeasibilityKeywords = ['simple', 'easy', 'existing', 'available', 'proven'];
    
    const lowerDesc = description.toLowerCase();
    let score = 5; // Base score
    
    for (const keyword of lowFeasibilityKeywords) {
      if (lowerDesc.includes(keyword)) score -= 2;
    }
    
    for (const keyword of highFeasibilityKeywords) {
      if (lowerDesc.includes(keyword)) score += 2;
    }
    
    return Math.max(1, Math.min(10, score));
  }

  private estimateImpact(description: string): number {
    // Simple heuristic based on keywords
    const highImpactKeywords = ['transform', 'revolutionize', 'significant', 'major', 'game-changer'];
    const mediumImpactKeywords = ['improve', 'enhance', 'optimize', 'better'];
    
    const lowerDesc = description.toLowerCase();
    let score = 5; // Base score
    
    for (const keyword of highImpactKeywords) {
      if (lowerDesc.includes(keyword)) score += 2;
    }
    
    for (const keyword of mediumImpactKeywords) {
      if (lowerDesc.includes(keyword)) score += 1;
    }
    
    return Math.max(1, Math.min(10, score));
  }

  private estimateComplexity(description: string): number {
    // Simple heuristic - longer descriptions often indicate more complexity
    const length = description.length;
    const complexityKeywords = ['integrate', 'multiple', 'complex', 'advanced', 'sophisticated'];
    
    let score = Math.min(8, Math.floor(length / 50) + 3);
    
    const lowerDesc = description.toLowerCase();
    for (const keyword of complexityKeywords) {
      if (lowerDesc.includes(keyword)) score += 1;
    }
    
    return Math.max(1, Math.min(10, score));
  }

  private deduplicateIdeas(ideas: BrainstormIdea[]): BrainstormIdea[] {
    const seen = new Set<string>();
    const unique: BrainstormIdea[] = [];
    
    for (const idea of ideas) {
      // Create a normalized version for comparison
      const normalized = idea.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(normalized) && normalized.length > 5) {
        seen.add(normalized);
        unique.push(idea);
      }
    }
    
    return unique;
  }

  private scoreIdeas(ideas: BrainstormIdea[]): BrainstormIdea[] {
    // Scoring is already done during idea completion
    // This method could be used for additional scoring based on args
    return ideas;
  }

  private calculateOverallScore(idea: BrainstormIdea): number {
    // Weight feasibility higher for conservative creativity
    // Weight impact higher for creative approaches
    return (idea.feasibility * 0.4) + (idea.impact * 0.4) + ((11 - idea.complexity) * 0.2);
  }

  private async generateNextSteps(
    ideas: BrainstormIdea[], 
    args: BrainstormToolArgs
  ): Promise<string[]> {
    if (ideas.length === 0) {
      return ['No ideas were generated. Consider refining the topic or constraints.'];
    }
    
    const nextSteps: string[] = [];
    
    // General next steps
    nextSteps.push('Evaluate and prioritize the generated ideas based on your specific criteria');
    nextSteps.push('Gather feedback from stakeholders or domain experts');
    
    // Idea-specific next steps
    const topIdea = ideas[0];
    if (topIdea) {
      nextSteps.push(`Create a detailed implementation plan for "${topIdea.title}"`);
      
      if (topIdea.feasibility < 5) {
        nextSteps.push('Research technical requirements and potential blockers');
      }
      
      if (topIdea.complexity > 7) {
        nextSteps.push('Break down complex ideas into smaller, manageable tasks');
      }
    }
    
    // Context-specific next steps
    if (args.includeImplementation) {
      nextSteps.push('Develop prototypes or proof-of-concepts for promising ideas');
    }
    
    if (args.includeRisks) {
      nextSteps.push('Conduct risk assessment and mitigation planning');
    }
    
    nextSteps.push('Set up regular review sessions to track progress and iterate');
    
    return nextSteps;
  }

  private generateSummary(ideas: BrainstormIdea[], topic: string): string {
    if (ideas.length === 0) {
      return `No ideas generated for topic: ${topic}`;
    }
    
    const avgFeasibility = ideas.reduce((sum, idea) => sum + idea.feasibility, 0) / ideas.length;
    const avgImpact = ideas.reduce((sum, idea) => sum + idea.impact, 0) / ideas.length;
    const avgComplexity = ideas.reduce((sum, idea) => sum + idea.complexity, 0) / ideas.length;
    
    const parts: string[] = [];
    parts.push(`Generated ${ideas.length} ideas for "${topic}"`);
    parts.push(`Average feasibility: ${avgFeasibility.toFixed(1)}/10`);
    parts.push(`Average impact: ${avgImpact.toFixed(1)}/10`);
    parts.push(`Average complexity: ${avgComplexity.toFixed(1)}/10`);
    
    return parts.join(', ');
  }

  private formatBrainstormResult(result: BrainstormResult): string {
    const lines: string[] = [];
    
    lines.push('🧠 Brainstorming Results');
    lines.push('='.repeat(50));
    lines.push('');
    
    // Summary
    lines.push(`📊 Summary: ${result.summary}`);
    lines.push('');
    
    // Ideas
    if (result.ideas.length > 0) {
      lines.push('💡 Ideas:');
      lines.push('');
      
      for (let i = 0; i < result.ideas.length; i++) {
        const idea = result.ideas[i];
        if (!idea) continue;
        const rank = i + 1;
        
        lines.push(`${rank}. **${idea.title}**`);
        lines.push(`   ${idea.description}`);
        lines.push('');
        lines.push(`   📈 Feasibility: ${idea.feasibility}/10 | Impact: ${idea.impact}/10 | Complexity: ${idea.complexity}/10`);
        
        if (idea.tags.length > 0) {
          lines.push(`   🏷️ Tags: ${idea.tags.join(', ')}`);
        }
        
        lines.push('');
      }
    }
    
    // Next steps
    if (result.nextSteps.length > 0) {
      lines.push('🚀 Recommended Next Steps:');
      for (const step of result.nextSteps) {
        lines.push(`• ${step}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }

  getSchema(): object {
    return {
      name: 'brainstorm',
      description: 'Generate creative ideas and solutions using GitHub Copilot for ideation',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or problem to brainstorm about',
            minLength: 1,
          },
          context: {
            type: 'string',
            description: 'Additional context or background information',
          },
          constraints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Constraints or limitations to consider',
            default: [],
          },
          goals: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific goals or objectives to achieve',
            default: [],
          },
          ideaCount: {
            type: 'number',
            minimum: 1,
            maximum: 20,
            description: 'Number of ideas to generate',
            default: 5,
          },
          includeImplementation: {
            type: 'boolean',
            description: 'Include implementation suggestions for ideas',
            default: false,
          },
          includeRisks: {
            type: 'boolean',
            description: 'Include potential risks and challenges',
            default: false,
          },
          creativityLevel: {
            type: 'string',
            enum: ['conservative', 'balanced', 'creative'],
            description: 'Level of creativity in idea generation',
            default: 'balanced',
          },
        },
        required: ['topic'],
      },
    };
  }
}