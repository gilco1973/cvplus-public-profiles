// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Claude AI Service for RAG-powered Chat
 *
 * Handles Anthropic Claude API integration for generating contextual
 * responses based on retrieved CV content in One Click Portal
 *
 * @author CVPlus Team
 * @version 1.0.0
 */

import Anthropic from '@anthropic-ai/sdk';
import { RAGContextResult } from './rag.service';

export interface ChatContext {
  cvOwnerName?: string;
  cvTitle?: string;
  language?: string;
  responseStyle?: 'professional' | 'casual' | 'detailed';
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export interface ClaudeResponse {
  message: string;
  confidence: number;
  sources: string[];
  suggestedFollowUps: string[];
  processingTime: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class ClaudeService {
  private anthropic: Anthropic;
  private readonly MODEL = 'claude-3-haiku-20240307'; // Fast model for chat
  private readonly MAX_TOKENS = 1000;
  private readonly MAX_CONTEXT_LENGTH = 8000;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Generate RAG-powered response using Claude
   */
  async generateResponse(
    userQuery: string,
    ragContext: RAGContextResult,
    chatContext: ChatContext = {}
  ): Promise<ClaudeResponse> {
    const startTime = Date.now();

    try {
      console.log(`Generating Claude response for query: "${userQuery}"`);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(ragContext, chatContext);

      // Build user message with context
      const userMessage = this.buildUserMessage(userQuery, ragContext, chatContext);

      // Include conversation history if available
      const messages = this.buildMessageHistory(chatContext);
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: this.MODEL,
        max_tokens: this.MAX_TOKENS,
        system: systemPrompt,
        messages: messages
      });

      // Extract response content
      const responseContent = response.content[0];
      const responseText = responseContent.type === 'text' ? responseContent.text : '';

      // Generate follow-up suggestions
      const suggestedFollowUps = this.generateFollowUpSuggestions(
        userQuery,
        responseText,
        ragContext.sources
      );

      const processingTime = Date.now() - startTime;

      console.log(`Claude response generated in ${processingTime}ms`);

      return {
        message: responseText,
        confidence: ragContext.confidence,
        sources: ragContext.sources,
        suggestedFollowUps,
        processingTime,
        tokenUsage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      };

    } catch (error) {
      console.error('Error generating Claude response:', error);
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt for Claude
   */
  private buildSystemPrompt(ragContext: RAGContextResult, chatContext: ChatContext): string {
    const cvOwnerName = chatContext.cvOwnerName || 'this professional';
    const responseStyle = chatContext.responseStyle || 'professional';

    let systemPrompt = `You are an AI assistant helping recruiters and hiring managers learn about ${cvOwnerName} based on their CV/resume content.

Your role is to:
- Answer questions accurately using ONLY the provided CV content
- Maintain a ${responseStyle} tone throughout the conversation
- Provide specific details and examples from the CV when relevant
- Cite which sections of the CV your information comes from
- If information isn't in the CV, politely state that it's not available

IMPORTANT GUIDELINES:
- Only use information from the provided CV content - do not make assumptions or add external information
- If asked about something not in the CV, clearly state "This information is not available in the CV"
- Keep responses focused and relevant to the question
- Always maintain confidentiality and professionalism
- Provide helpful follow-up suggestions when appropriate

Available CV sections: ${ragContext.sources.join(', ')}`;

    // Add language-specific instructions
    if (chatContext.language && chatContext.language !== 'en') {
      systemPrompt += `\n\nPlease respond in ${this.getLanguageName(chatContext.language)}.`;
    }

    return systemPrompt;
  }

  /**
   * Build user message with RAG context
   */
  private buildUserMessage(
    userQuery: string,
    ragContext: RAGContextResult,
    chatContext: ChatContext
  ): string {
    let message = `Question: ${userQuery}\n\n`;

    if (ragContext.context && ragContext.context.trim().length > 0) {
      // Truncate context if too long
      let context = ragContext.context;
      if (context.length > this.MAX_CONTEXT_LENGTH) {
        context = context.substring(0, this.MAX_CONTEXT_LENGTH) + '\n...[content truncated]';
      }

      message += `Relevant CV Content:\n${context}\n\n`;
    } else {
      message += `No directly relevant CV content found for this query. Please respond based on general CV knowledge if appropriate, or state that the information is not available in the CV.\n\n`;
    }

    message += `Please provide a helpful response based on the available CV information.`;

    return message;
  }

  /**
   * Build message history for conversation context
   */
  private buildMessageHistory(chatContext: ChatContext): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (!chatContext.conversationHistory || chatContext.conversationHistory.length === 0) {
      return [];
    }

    // Include last 5 messages to maintain context while staying within token limits
    const recentHistory = chatContext.conversationHistory.slice(-5);

    return recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Generate follow-up suggestions based on response and available content
   */
  private generateFollowUpSuggestions(
    originalQuery: string,
    response: string,
    availableSections: string[]
  ): string[] {
    const suggestions: string[] = [];

    // Base suggestions based on available sections
    const sectionSuggestions: Record<string, string[]> = {
      experience: [
        "Tell me more about their work experience",
        "What are their key responsibilities?",
        "Which companies have they worked for?"
      ],
      education: [
        "What is their educational background?",
        "What degrees do they have?",
        "Where did they study?"
      ],
      skills: [
        "What are their main skills?",
        "What technologies do they know?",
        "What are their core competencies?"
      ],
      projects: [
        "What projects have they worked on?",
        "Can you tell me about their notable projects?",
        "What kind of project experience do they have?"
      ],
      certifications: [
        "What certifications do they have?",
        "Are they certified in any technologies?",
        "What professional certifications have they earned?"
      ]
    };

    // Add suggestions based on available sections
    for (const section of availableSections) {
      const sectionKey = section.toLowerCase();
      if (sectionSuggestions[sectionKey]) {
        // Add one random suggestion from this section
        const sectionOptions = sectionSuggestions[sectionKey];
        const randomSuggestion = sectionOptions[Math.floor(Math.random() * sectionOptions.length)];
        if (!suggestions.includes(randomSuggestion)) {
          suggestions.push(randomSuggestion);
        }
      }
    }

    // Add general follow-ups
    if (suggestions.length < 3) {
      const generalSuggestions = [
        "What makes them a good candidate?",
        "Can you summarize their background?",
        "What are their career highlights?"
      ];

      for (const suggestion of generalSuggestions) {
        if (suggestions.length < 3 && !suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Get language name from code
   */
  private getLanguageName(languageCode: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese'
    };

    return languages[languageCode] || 'English';
  }

  /**
   * Validate Claude API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const testResponse = await this.anthropic.messages.create({
        model: this.MODEL,
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hello'
        }]
      });

      return testResponse.content.length > 0;

    } catch (error) {
      console.error('Claude API connection validation failed:', error);
      return false;
    }
  }

  /**
   * Generate welcome message for chat sessions
   */
  generateWelcomeMessage(chatContext: ChatContext = {}): string {
    const name = chatContext.cvOwnerName || 'this professional';
    const title = chatContext.cvTitle || 'professional';
    const language = chatContext.language || 'en';

    const welcomeMessages: Record<string, string> = {
      en: `Hello! I'm an AI assistant here to help you learn more about ${name}, a ${title}. I can answer questions about their experience, skills, projects, education, and any other details from their CV. What would you like to know?`,
      es: `¡Hola! Soy un asistente de IA aquí para ayudarte a conocer más sobre ${name}, un/a ${title}. Puedo responder preguntas sobre su experiencia, habilidades, proyectos, educación y otros detalles de su CV. ¿Qué te gustaría saber?`,
      fr: `Bonjour ! Je suis un assistant IA ici pour vous aider à en savoir plus sur ${name}, un/e ${title}. Je peux répondre à des questions sur son expérience, ses compétences, ses projets, son éducation et d'autres détails de son CV. Que souhaitez-vous savoir ?`
    };

    return welcomeMessages[language] || welcomeMessages.en;
  }
}