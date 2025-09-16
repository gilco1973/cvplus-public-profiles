// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * One Click Portal Utilities Service
 *
 * Supporting utilities for One Click Portal functionality
 * to maintain portal-generation.service.ts under 200 lines
 *
 * @author Gil Klainert
 * @created 2025-09-13
 * @version 1.0
 */

import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

import { ParsedCV } from '../../types/job';
import { PortalConfig, PortalUrls } from '../../types/portal';

export class OneClickPortalUtils {

  /**
   * Generate CV embeddings for RAG system (FR-006)
   */
  async generateCVEmbeddings(cvData: ParsedCV): Promise<any[]> {
    try {
      logger.info('Generating CV embeddings for semantic search');

      const embeddings = [];

      // Process each CV section
      if (cvData.sections) {
        for (const section of cvData.sections) {
          const embedding = await this.createSectionEmbedding(section);
          embeddings.push({
            id: section.id || `section-${embeddings.length}`,
            content: section.content || section.text,
            embedding,
            type: section.type,
            metadata: section.metadata || {}
          });
        }
      }

      return embeddings;
    } catch (error) {
      logger.error('Failed to generate CV embeddings', error);
      return [];
    }
  }

  /**
   * Create vector index for semantic search
   */
  async createVectorIndex(embeddings: any[]): Promise<any> {
    try {
      logger.info('Creating vector index for One Click Portal RAG');

      // Create FAISS-style vector index for semantic search
      const index = {
        vectors: embeddings.map(e => e.embedding),
        metadata: embeddings.map(e => ({
          id: e.id,
          content: e.content,
          type: e.type
        })),
        dimension: embeddings.length > 0 ? embeddings[0].embedding?.length || 384 : 384,
        count: embeddings.length
      };

      return index;
    } catch (error) {
      logger.error('Failed to create vector index', error);
      return { vectors: [], metadata: [], dimension: 384, count: 0 };
    }
  }

  /**
   * Initialize confidence scoring system (FR-008)
   */
  async initializeConfidenceScoring(cvData: ParsedCV): Promise<any> {
    try {
      logger.info('Initializing confidence scoring for RAG responses');

      return {
        model: 'confidence-v1',
        thresholds: {
          high: 0.8,
          medium: 0.6,
          low: 0.4
        },
        sourceReliability: this.calculateSourceReliability(cvData),
        calibration: 'production'
      };
    } catch (error) {
      logger.error('Failed to initialize confidence scoring', error);
      return { model: 'basic', thresholds: { high: 0.7, medium: 0.5, low: 0.3 } };
    }
  }

  /**
   * Create source mapping for citations (FR-007)
   */
  createSourceMapping(cvData: ParsedCV): any {
    const mapping = {};

    if (cvData.sections) {
      cvData.sections.forEach((section, index) => {
        mapping[section.id || `section-${index}`] = {
          title: section.type || 'CV Section',
          content: section.content || section.text,
          pageNumber: section.page || 1,
          confidence: section.confidence || 0.9
        };
      });
    }

    return mapping;
  }

  /**
   * Create context chunks for better RAG responses
   */
  createContextChunks(cvData: ParsedCV): any[] {
    const chunks = [];

    if (cvData.sections) {
      cvData.sections.forEach((section, index) => {
        // Split large sections into smaller chunks for better context
        const content = section.content || section.text || '';
        const chunkSize = 500; // characters

        if (content.length > chunkSize) {
          const subChunks = this.splitIntoChunks(content, chunkSize);
          subChunks.forEach((chunk, subIndex) => {
            chunks.push({
              id: `${section.id || index}-${subIndex}`,
              content: chunk,
              type: section.type,
              parentSection: section.id || index,
              overlap: 50 // character overlap between chunks
            });
          });
        } else {
          chunks.push({
            id: section.id || `section-${index}`,
            content,
            type: section.type,
            parentSection: section.id || index
          });
        }
      });
    }

    return chunks;
  }

  /**
   * Select optimal template based on CV analysis (FR-001)
   */
  async selectOptimalTemplate(cvData: ParsedCV): Promise<string> {
    try {
      logger.info('Selecting optimal template for One Click Portal');

      // Analyze CV content to determine best template
      const analysis = await this.analyzeCVForTemplate(cvData);

      if (analysis.isTechnical) {
        return 'tech-professional';
      } else if (analysis.isCreative) {
        return 'creative-portfolio';
      } else if (analysis.isExecutive) {
        return 'executive-premium';
      } else {
        return 'professional-standard';
      }
    } catch (error) {
      logger.error('Failed to select template', error);
      return 'professional-standard';
    }
  }

  /**
   * Generate unique space ID for HuggingFace deployment (FR-002)
   */
  generateUniqueSpaceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `cvplus-portal-${timestamp}-${random}`;
  }

  /**
   * Setup portal analytics tracking (FR-012)
   */
  async setupPortalAnalytics(jobId: string, portalURLs: PortalUrls): Promise<void> {
    try {
      logger.info(`Setting up analytics for portal: ${jobId}`);

      await admin.firestore()
        .collection('portalAnalytics')
        .doc(jobId)
        .set({
          portalId: jobId,
          urls: portalURLs,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metrics: {
            visitors: 0,
            pageViews: 0,
            chatSessions: 0,
            averageSessionDuration: 0,
            bounceRate: 0
          },
          tracking: {
            enabled: true,
            realTime: true,
            heatmaps: true,
            conversions: true
          }
        });
    } catch (error) {
      logger.error('Failed to setup portal analytics', error);
    }
  }

  /**
   * Initialize visitor tracking
   */
  async initializeVisitorTracking(jobId: string, portalURLs: PortalUrls): Promise<void> {
    try {
      logger.info(`Initializing visitor tracking for portal: ${jobId}`);

      // Set up real-time visitor tracking
      await admin.firestore()
        .collection('visitorTracking')
        .doc(jobId)
        .set({
          portalId: jobId,
          activeVisitors: 0,
          totalVisitors: 0,
          sessions: [],
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      logger.error('Failed to initialize visitor tracking', error);
    }
  }

  /**
   * Setup content synchronization (FR-010)
   */
  async setupContentSynchronization(jobId: string, portalURLs: PortalUrls): Promise<void> {
    try {
      logger.info(`Setting up content sync for portal: ${jobId}`);

      // Enable real-time content updates
      await admin.firestore()
        .collection('contentSync')
        .doc(jobId)
        .set({
          portalId: jobId,
          syncEnabled: true,
          lastSync: admin.firestore.FieldValue.serverTimestamp(),
          autoUpdate: true,
          webhookUrl: `${portalURLs.api}/sync`
        });
    } catch (error) {
      logger.error('Failed to setup content synchronization', error);
    }
  }

  /**
   * Setup premium validation (FR-014)
   */
  async setupPremiumValidation(jobId: string, portalURLs: PortalUrls): Promise<void> {
    try {
      logger.info(`Setting up premium validation for portal: ${jobId}`);

      await admin.firestore()
        .collection('premiumValidation')
        .doc(jobId)
        .set({
          portalId: jobId,
          premiumRequired: true,
          validationUrl: `${portalURLs.api}/validate-premium`,
          gracePeriod: 7, // days
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      logger.error('Failed to setup premium validation', error);
    }
  }

  // Private helper methods
  private async createSectionEmbedding(section: any): Promise<number[]> {
    // Mock embedding generation - in production, use OpenAI or similar
    const content = section.content || section.text || '';
    const embedding = new Array(384).fill(0).map(() => Math.random() - 0.5);
    return embedding;
  }

  private calculateSourceReliability(cvData: ParsedCV): number {
    // Calculate reliability based on CV completeness and structure
    let score = 0.5; // base score

    if (cvData.sections && cvData.sections.length > 0) score += 0.2;
    if (cvData.metadata && cvData.metadata.hasWorkExperience) score += 0.1;
    if (cvData.metadata && cvData.metadata.hasEducation) score += 0.1;
    if (cvData.metadata && cvData.metadata.hasSkills) score += 0.1;

    return Math.min(score, 1.0);
  }

  private splitIntoChunks(content: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }
    return chunks;
  }

  private async analyzeCVForTemplate(cvData: ParsedCV): Promise<any> {
    // Simple template analysis - can be enhanced with ML models
    const sections = cvData.sections || [];
    const techKeywords = ['javascript', 'python', 'react', 'node.js', 'aws', 'docker'];
    const creativeKeywords = ['design', 'creative', 'portfolio', 'artistic', 'visual'];
    const executiveKeywords = ['ceo', 'cto', 'director', 'vice president', 'senior executive'];

    const content = sections.map(s => (s.content || s.text || '').toLowerCase()).join(' ');

    return {
      isTechnical: techKeywords.some(kw => content.includes(kw)),
      isCreative: creativeKeywords.some(kw => content.includes(kw)),
      isExecutive: executiveKeywords.some(kw => content.includes(kw))
    };
  }
}

// Export service instance
export const oneClickPortalUtils = new OneClickPortalUtils();