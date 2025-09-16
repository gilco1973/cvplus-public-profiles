// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Enhanced Portal Chat Service - One Click Portal Implementation
 *
 * Implements enhanced RAG chat with confidence scoring and source citations
 * for One Click Portal functionality (FR-005, FR-007, FR-008)
 *
 * @author Gil Klainert
 * @created 2025-09-13
 * @version 1.0
 */

import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

import { ParsedCV } from '../../types/job';
import { oneClickPortalUtils } from './one-click-portal-utils.service';

export interface ChatRequest {
  jobId: string;
  message: string;
  sessionId?: string;
  context?: any;
}

export interface ChatResponse {
  response: string;
  confidence: number;
  sources: SourceCitation[];
  responseTime: number;
  sessionId: string;
  suggestedQuestions?: string[];
}

export interface SourceCitation {
  section: string;
  content: string;
  confidence: number;
  pageNumber?: number;
}

export interface ConfidenceScore {
  overall: number;
  semantic: number;
  factual: number;
  completeness: number;
}

export class EnhancedPortalChatService {

  /**
   * Process chat message with enhanced RAG (FR-005)
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      logger.info(`Processing One Click Portal chat message for job: ${request.jobId}`);

      // Retrieve CV data and RAG components
      const ragData = await this.retrieveRAGData(request.jobId);

      // Perform semantic search on CV content (FR-006)
      const relevantSections = await this.performSemanticSearch(
        request.message,
        ragData.embeddings
      );

      // Generate response with confidence scoring (FR-008)
      const response = await this.generateResponseWithConfidence(
        request.message,
        relevantSections,
        ragData.contextChunks
      );

      // Create source citations (FR-007)
      const sources = this.generateSourceCitations(relevantSections, ragData.sourceMapping);

      // Calculate response metrics
      const responseTime = Date.now() - startTime;
      const sessionId = request.sessionId || this.generateSessionId();

      // Track analytics
      await this.trackChatInteraction(request.jobId, {
        message: request.message,
        response: response.text,
        confidence: response.confidence,
        responseTime,
        sessionId
      });

      // Generate suggested follow-up questions
      const suggestedQuestions = await this.generateSuggestedQuestions(
        request.message,
        relevantSections
      );

      const chatResponse: ChatResponse = {
        response: response.text,
        confidence: response.confidence.overall,
        sources,
        responseTime,
        sessionId,
        suggestedQuestions: suggestedQuestions.slice(0, 3) // Limit to 3 suggestions
      };

      logger.info(`One Click Portal chat response generated in ${responseTime}ms with confidence ${response.confidence.overall}`);

      return chatResponse;

    } catch (error) {
      logger.error('Failed to process chat message', error);

      return {
        response: 'I apologize, but I encountered an error while processing your question. Please try again.',
        confidence: 0,
        sources: [],
        responseTime: Date.now() - startTime,
        sessionId: request.sessionId || this.generateSessionId(),
        suggestedQuestions: [
          'Can you tell me about the work experience?',
          'What skills does this person have?',
          'What is their educational background?'
        ]
      };
    }
  }

  /**
   * Initialize chat session for portal
   */
  async initializeChatSession(jobId: string): Promise<string> {
    const sessionId = this.generateSessionId();

    try {
      await admin.firestore()
        .collection('portalChatSessions')
        .doc(sessionId)
        .set({
          jobId,
          sessionId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: 0,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
          active: true
        });

      return sessionId;
    } catch (error) {
      logger.error('Failed to initialize chat session', error);
      return sessionId; // Return ID anyway for graceful degradation
    }
  }

  /**
   * Get chat analytics for portal
   */
  async getChatAnalytics(jobId: string, timeRange: string = 'last_7_days'): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case 'last_24_hours':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case 'last_7_days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last_30_days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const interactions = await admin.firestore()
        .collection('portalChatInteractions')
        .where('jobId', '==', jobId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const analytics = {
        totalInteractions: interactions.size,
        averageConfidence: 0,
        averageResponseTime: 0,
        topQuestions: [],
        sessionCount: new Set(),
        timeRange
      };

      if (interactions.size > 0) {
        let totalConfidence = 0;
        let totalResponseTime = 0;
        const questions = {};

        interactions.forEach(doc => {
          const data = doc.data();
          totalConfidence += data.confidence || 0;
          totalResponseTime += data.responseTime || 0;
          analytics.sessionCount.add(data.sessionId);

          const question = data.message?.substring(0, 100);
          if (question) {
            questions[question] = (questions[question] || 0) + 1;
          }
        });

        analytics.averageConfidence = totalConfidence / interactions.size;
        analytics.averageResponseTime = totalResponseTime / interactions.size;
        analytics.topQuestions = Object.entries(questions)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([question, count]) => ({ question, count }));
      }

      analytics.sessionCount = analytics.sessionCount.size;
      return analytics;

    } catch (error) {
      logger.error('Failed to get chat analytics', error);
      return {
        totalInteractions: 0,
        averageConfidence: 0,
        averageResponseTime: 0,
        topQuestions: [],
        sessionCount: 0,
        timeRange,
        error: 'Analytics unavailable'
      };
    }
  }

  // Private helper methods

  private async retrieveRAGData(jobId: string): Promise<any> {
    // Retrieve RAG data created during portal generation
    const ragDoc = await admin.firestore()
      .collection('portalRAGData')
      .doc(jobId)
      .get();

    if (ragDoc.exists) {
      return ragDoc.data();
    }

    // Fallback: create basic RAG data if not exists
    const cvData = { jobId, sections: [], metadata: {} } as ParsedCV;
    return {
      embeddings: await oneClickPortalUtils.generateCVEmbeddings(cvData),
      contextChunks: oneClickPortalUtils.createContextChunks(cvData),
      sourceMapping: oneClickPortalUtils.createSourceMapping(cvData)
    };
  }

  private async performSemanticSearch(query: string, embeddings: any[]): Promise<any[]> {
    // Simplified semantic search - in production, use proper vector similarity
    const queryWords = query.toLowerCase().split(' ');

    return embeddings
      .map(embedding => ({
        ...embedding,
        similarity: this.calculateSimilarity(queryWords, embedding.content || '')
      }))
      .filter(item => item.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 most relevant sections
  }

  private calculateSimilarity(queryWords: string[], content: string): number {
    const contentWords = content.toLowerCase().split(' ');
    const matches = queryWords.filter(word =>
      contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))
    );
    return matches.length / Math.max(queryWords.length, 1);
  }

  private async generateResponseWithConfidence(
    query: string,
    relevantSections: any[],
    contextChunks: any[]
  ): Promise<{ text: string; confidence: ConfidenceScore }> {

    if (relevantSections.length === 0) {
      return {
        text: "I don't have specific information to answer that question based on this CV. Please try asking about work experience, education, or skills.",
        confidence: {
          overall: 0.1,
          semantic: 0.1,
          factual: 0.1,
          completeness: 0.1
        }
      };
    }

    // Build response from relevant sections
    const context = relevantSections
      .map(section => section.content || section.text)
      .join('\n\n');

    // Generate contextual response
    let response = '';
    const queryLower = query.toLowerCase();

    if (queryLower.includes('experience') || queryLower.includes('work')) {
      const workSections = relevantSections.filter(s =>
        s.type === 'work_experience' || s.type === 'experience'
      );
      response = this.generateWorkExperienceResponse(workSections);
    } else if (queryLower.includes('education') || queryLower.includes('study')) {
      const eduSections = relevantSections.filter(s =>
        s.type === 'education' || s.type === 'academic'
      );
      response = this.generateEducationResponse(eduSections);
    } else if (queryLower.includes('skill') || queryLower.includes('ability')) {
      const skillSections = relevantSections.filter(s =>
        s.type === 'skills' || s.type === 'technical_skills'
      );
      response = this.generateSkillsResponse(skillSections);
    } else {
      response = this.generateGeneralResponse(relevantSections, query);
    }

    // Calculate confidence scores
    const confidence = this.calculateConfidenceScore(relevantSections, query, response);

    return { text: response, confidence };
  }

  private generateWorkExperienceResponse(workSections: any[]): string {
    if (workSections.length === 0) {
      return "I don't see specific work experience information in the available CV data.";
    }

    return `Based on the CV, here's the work experience information: ${workSections.map(s => s.content || s.text).join(' ')}`;
  }

  private generateEducationResponse(eduSections: any[]): string {
    if (eduSections.length === 0) {
      return "I don't see specific educational background information in the available CV data.";
    }

    return `Based on the CV, here's the educational background: ${eduSections.map(s => s.content || s.text).join(' ')}`;
  }

  private generateSkillsResponse(skillSections: any[]): string {
    if (skillSections.length === 0) {
      return "I don't see specific skills information in the available CV data.";
    }

    return `Based on the CV, here are the key skills: ${skillSections.map(s => s.content || s.text).join(' ')}`;
  }

  private generateGeneralResponse(sections: any[], query: string): string {
    const content = sections.map(s => s.content || s.text).join(' ');
    return `Based on the CV information, ${content}`;
  }

  private calculateConfidenceScore(sections: any[], query: string, response: string): ConfidenceScore {
    const semantic = Math.min(sections.length / 3.0, 1.0); // More sections = higher confidence
    const factual = sections.filter(s => s.confidence > 0.8).length / Math.max(sections.length, 1);
    const completeness = Math.min(response.length / 200.0, 1.0); // Longer responses generally more complete
    const overall = (semantic * 0.4 + factual * 0.4 + completeness * 0.2);

    return {
      overall: Math.round(overall * 100) / 100,
      semantic: Math.round(semantic * 100) / 100,
      factual: Math.round(factual * 100) / 100,
      completeness: Math.round(completeness * 100) / 100
    };
  }

  private generateSourceCitations(sections: any[], sourceMapping: any): SourceCitation[] {
    return sections.slice(0, 3).map(section => ({ // Limit to top 3 sources
      section: section.type || 'CV Section',
      content: (section.content || section.text || '').substring(0, 200) + '...',
      confidence: section.confidence || 0.8,
      pageNumber: section.page || 1
    }));
  }

  private async generateSuggestedQuestions(query: string, sections: any[]): Promise<string[]> {
    // Generate contextual follow-up questions based on available CV sections
    const suggestions = [
      'Can you tell me more about the work experience?',
      'What educational qualifications does this person have?',
      'What are the key technical skills?',
      'What achievements or accomplishments are highlighted?',
      'How many years of experience does this person have?'
    ];

    // Filter suggestions based on available sections
    const availableTypes = sections.map(s => s.type);

    return suggestions.filter((_, index) => {
      switch (index) {
        case 0: return availableTypes.includes('work_experience') || availableTypes.includes('experience');
        case 1: return availableTypes.includes('education') || availableTypes.includes('academic');
        case 2: return availableTypes.includes('skills') || availableTypes.includes('technical_skills');
        case 3: return availableTypes.includes('achievements') || availableTypes.includes('accomplishments');
        default: return true;
      }
    });
  }

  private async trackChatInteraction(jobId: string, interaction: any): Promise<void> {
    try {
      await admin.firestore()
        .collection('portalChatInteractions')
        .add({
          jobId,
          ...interaction,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      logger.error('Failed to track chat interaction', error);
    }
  }

  private generateSessionId(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

// Export service instance
export const enhancedPortalChatService = new EnhancedPortalChatService();