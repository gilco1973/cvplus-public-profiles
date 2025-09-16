// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Portal Embeddings Configuration Types
 *
 * Embedding configuration for content processing in portal RAG systems.
 *
 * @author Gil Klainert
 * @version 1.0.0
 */

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
  /** Embedding provider */
  provider: EmbeddingProvider;

  /** Model configuration */
  model: EmbeddingModelConfig;

  /** Processing configuration */
  processing: EmbeddingProcessingConfig;

  /** Batch processing settings */
  batch: EmbeddingBatchConfig;

  /** Quality assurance settings */
  quality: EmbeddingQualityConfig;
}

/**
 * Supported embedding providers
 */
export enum EmbeddingProvider {
  OPENAI = 'openai',
  HUGGINGFACE = 'huggingface',
  COHERE = 'cohere',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  SENTENCE_TRANSFORMERS = 'sentence-transformers',
  AZURE_OPENAI = 'azure-openai'
}

/**
 * Embedding model configuration
 */
export interface EmbeddingModelConfig {
  /** Model name/identifier */
  name: string;

  /** Model dimension */
  dimension: number;

  /** Maximum input tokens */
  maxInputTokens: number;

  /** Model version */
  version?: string;

  /** Model-specific parameters */
  parameters?: Record<string, any>;

  /** Custom model settings */
  custom?: CustomModelConfig;
}

/**
 * Custom model configuration
 */
export interface CustomModelConfig {
  /** Model endpoint URL */
  endpoint?: string;

  /** Authentication headers */
  headers?: Record<string, string>;

  /** Request format */
  requestFormat?: 'json' | 'form' | 'raw';

  /** Response parsing configuration */
  responseParser?: ResponseParserConfig;
}

/**
 * Response parser configuration
 */
export interface ResponseParserConfig {
  /** JSON path to embeddings array */
  embeddingsPath: string;

  /** JSON path to token count */
  tokenCountPath?: string;

  /** JSON path to metadata */
  metadataPath?: string;
}

/**
 * Embedding processing configuration
 */
export interface EmbeddingProcessingConfig {
  /** Chunk size for text splitting */
  chunkSize: number;

  /** Chunk overlap for context preservation */
  chunkOverlap: number;

  /** Text preprocessing options */
  preprocessing: TextPreprocessingConfig;

  /** Metadata extraction settings */
  metadataExtraction: MetadataExtractionConfig;

  /** Content filtering */
  filtering: ContentFilteringOptions;
}

/**
 * Text preprocessing configuration
 */
export interface TextPreprocessingConfig {
  /** Remove special characters */
  removeSpecialChars: boolean;

  /** Normalize whitespace */
  normalizeWhitespace: boolean;

  /** Convert to lowercase */
  lowercase: boolean;

  /** Remove stop words */
  removeStopWords: boolean;

  /** Language for processing */
  language: string;

  /** Custom preprocessing steps */
  customSteps?: PreprocessingStep[];
}

/**
 * Preprocessing step configuration
 */
export interface PreprocessingStep {
  /** Step name/identifier */
  name: string;

  /** Step type */
  type: 'regex' | 'function' | 'filter';

  /** Step configuration */
  config: Record<string, any>;

  /** Step execution order */
  order: number;
}

/**
 * Metadata extraction configuration
 */
export interface MetadataExtractionConfig {
  /** Extract section headers */
  extractHeaders: boolean;

  /** Extract dates */
  extractDates: boolean;

  /** Extract entities (names, organizations) */
  extractEntities: boolean;

  /** Extract numerical data */
  extractNumbers: boolean;

  /** Extract URLs and links */
  extractUrls: boolean;

  /** Custom metadata extractors */
  customExtractors?: MetadataExtractor[];
}

/**
 * Custom metadata extractor
 */
export interface MetadataExtractor {
  /** Extractor name */
  name: string;

  /** Extractor type */
  type: 'regex' | 'nlp' | 'custom';

  /** Extraction pattern or configuration */
  pattern: string | Record<string, any>;

  /** Output field name */
  outputField: string;
}

/**
 * Content filtering options
 */
export interface ContentFilteringOptions {
  /** Minimum content length */
  minLength: number;

  /** Maximum content length */
  maxLength: number;

  /** Filter empty content */
  filterEmpty: boolean;

  /** Filter duplicates */
  filterDuplicates: boolean;

  /** Content quality threshold */
  qualityThreshold: number;

  /** Language filtering */
  languageFilter?: LanguageFilterConfig;
}

/**
 * Language filtering configuration
 */
export interface LanguageFilterConfig {
  /** Allowed languages */
  allowedLanguages: string[];

  /** Language detection threshold */
  detectionThreshold: number;

  /** Auto-detect language */
  autoDetect: boolean;
}

/**
 * Embedding batch processing configuration
 */
export interface EmbeddingBatchConfig {
  /** Batch size for processing */
  batchSize: number;

  /** Delay between batches (ms) */
  batchDelay: number;

  /** Maximum concurrent batches */
  maxConcurrentBatches: number;

  /** Retry configuration */
  retry: RetryConfig;

  /** Progress tracking */
  progressTracking: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;

  /** Base delay between retries (ms) */
  baseDelay: number;

  /** Exponential backoff multiplier */
  backoffMultiplier: number;

  /** Maximum delay between retries (ms) */
  maxDelay: number;

  /** Jitter factor for randomization */
  jitterFactor?: number;
}

/**
 * Embedding quality configuration
 */
export interface EmbeddingQualityConfig {
  /** Enable quality checks */
  enabled: boolean;

  /** Similarity threshold for duplicates */
  similarityThreshold: number;

  /** Dimension validation */
  validateDimensions: boolean;

  /** NaN/Infinity checks */
  validateValues: boolean;

  /** Quality scoring */
  qualityScoring: QualityScoringConfig;
}

/**
 * Quality scoring configuration
 */
export interface QualityScoringConfig {
  /** Enable quality scoring */
  enabled: boolean;

  /** Scoring metrics */
  metrics: QualityMetric[];

  /** Minimum quality score */
  minQualityScore: number;

  /** Quality report generation */
  generateReports: boolean;
}

/**
 * Quality metrics
 */
export enum QualityMetric {
  COHERENCE = 'coherence',
  DIVERSITY = 'diversity',
  COMPLETENESS = 'completeness',
  CONSISTENCY = 'consistency',
  RELEVANCE = 'relevance'
}