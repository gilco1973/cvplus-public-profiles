// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Portal RAG Configuration Types
 *
 * Core RAG system configuration interfaces for portal generation.
 *
 * @author Gil Klainert
 * @version 1.0.0
 */

export { VectorDatabaseConfig, VectorDatabaseProvider } from './portal-vector-db';
export { EmbeddingConfig, EmbeddingProvider } from './portal-embeddings';
export { ChatServiceConfig, ChatModelConfig } from './portal-chat-config';

/**
 * Main RAG system configuration for AI-powered chat
 */
export interface RAGConfig {
  /** Vector database configuration */
  vectorDb: VectorDatabaseConfig;

  /** Embedding configuration for document processing */
  embeddings: EmbeddingConfig;

  /** Chat service configuration */
  chatService: ChatServiceConfig;

  /** Content processing settings */
  contentProcessing: ContentProcessingConfig;

  /** RAG-specific metadata */
  metadata: RAGMetadata;

  /** Performance and optimization settings */
  optimization: RAGOptimizationConfig;
}

/**
 * Content processing configuration
 */
export interface ContentProcessingConfig {
  /** CV sections to include */
  includedSections: CVSection[];

  /** Content filtering settings */
  filtering: ContentFilteringConfig;

  /** Content enhancement settings */
  enhancement: ContentEnhancementConfig;
}

/**
 * CV sections for processing
 */
export enum CVSection {
  PERSONAL_INFO = 'personal_info',
  SUMMARY = 'summary',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  PROJECTS = 'projects',
  CERTIFICATIONS = 'certifications',
  LANGUAGES = 'languages',
  ACHIEVEMENTS = 'achievements',
  REFERENCES = 'references'
}

/**
 * Content filtering configuration
 */
export interface ContentFilteringConfig {
  /** Filter sensitive information */
  filterSensitiveInfo: boolean;

  /** Allowed content types */
  allowedContentTypes: ContentType[];

  /** Content quality threshold */
  qualityThreshold: number;
}

/**
 * Content types
 */
export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  LINK = 'link',
  STRUCTURED_DATA = 'structured_data'
}

/**
 * Content enhancement configuration
 */
export interface ContentEnhancementConfig {
  /** Generate summaries */
  generateSummaries: boolean;

  /** Extract keywords */
  extractKeywords: boolean;

  /** Enhance with external data */
  externalDataEnhancement: boolean;
}

/**
 * RAG metadata
 */
export interface RAGMetadata {
  /** Content source information */
  sources: ContentSourceInfo[];

  /** Processing timestamps */
  timestamps: RAGTimestamps;

  /** Content statistics */
  statistics: ContentStatistics;

  /** Quality metrics */
  qualityMetrics: QualityMetrics;
}

/**
 * Content source information
 */
export interface ContentSourceInfo {
  /** Source identifier */
  id: string;

  /** Source type */
  type: 'cv' | 'document' | 'url' | 'manual';

  /** Source metadata */
  metadata: Record<string, any>;

  /** Processing status */
  status: 'pending' | 'processed' | 'failed';
}

/**
 * RAG processing timestamps
 */
export interface RAGTimestamps {
  /** When content was first indexed */
  indexed: Date;

  /** Last update timestamp */
  lastUpdated: Date;

  /** Last query timestamp */
  lastQueried?: Date;
}

/**
 * Content statistics
 */
export interface ContentStatistics {
  /** Total number of chunks */
  totalChunks: number;

  /** Total tokens */
  totalTokens: number;

  /** Average chunk size */
  averageChunkSize: number;

  /** Content coverage percentage */
  coveragePercentage: number;
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  /** Embedding quality score */
  embeddingQuality: number;

  /** Content completeness score */
  completenessScore: number;

  /** Processing success rate */
  successRate: number;
}

/**
 * RAG optimization configuration
 */
export interface RAGOptimizationConfig {
  /** Enable caching */
  enableCaching: boolean;

  /** Cache TTL in seconds */
  cacheTTL: number;

  /** Enable compression */
  enableCompression: boolean;

  /** Performance monitoring */
  performanceMonitoring: boolean;
}