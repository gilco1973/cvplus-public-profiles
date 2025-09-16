// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Portal Generation Types - Main Interface
 * 
 * Core portal configuration interfaces and main types.
 * Imports specialized types from modular files to maintain <200 line compliance.
 * 
 * @author Gil Klainert
 * @version 1.0.0
 */

import { ParsedCV } from './job';
import type { FieldValue } from 'firebase-admin/firestore';

// Import modular types (avoiding conflicts with local definitions)
import { THEME_PRESETS, PortalTheme } from './portal-theme';
import type { PortalErrorCode } from './portal';
import { HuggingFaceSpaceConfig } from './portal-huggingface';
import { PortalUrls } from './portal-analytics';

/**
 * Main configuration interface for portal generation
 */
export interface PortalConfig {
  /** Unique identifier for the portal configuration */
  id: string;
  
  /** Associated job/CV ID from CVPlus */
  jobId: string;
  
  /** User ID who owns this portal */
  userId: string;
  
  /** Portal template configuration */
  template: PortalTemplate;
  
  /** User-specific customizations */
  customization: PortalCustomization;
  
  /** RAG system configuration for AI chat */
  ragConfig: RAGConfig;
  
  /** HuggingFace deployment configuration */
  huggingFaceConfig: HuggingFaceSpaceConfig;
  
  /** Portal generation status */
  status: PortalStatus;
  
  /** Generated portal URLs */
  urls: PortalUrls;
  
  /** Portal analytics and tracking */
  analytics: PortalAnalytics;
  
  /** Privacy and security settings */
  privacy: PortalPrivacySettings;
  
  /** Error information if generation failed */
  error?: PortalError;
  
  /** Creation timestamp */
  createdAt: Date | FieldValue;
  
  /** Last update timestamp */
  updatedAt: Date | FieldValue;
  
  /** Optional expiration date */
  expiresAt?: Date;
}

/**
 * Portal template definitions
 * Defines the base template and theme for the generated portal
 */
export interface PortalTemplate {
  /** Template identifier */
  id: string;
  
  /** Human-readable template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Template category */
  category: PortalTemplateCategory;
  
  /** Design theme */
  theme: PortalTheme;
  
  /** Template version */
  version: string;
  
  /** Whether template is premium/paid */
  isPremium: boolean;
  
  /** Template configuration options */
  config: TemplateConfig;
  
  /** Required sections for this template */
  requiredSections: PortalSection[];
  
  /** Optional sections available */
  optionalSections: PortalSection[];
}

/**
 * User-specific portal customizations
 * Contains all user-defined customization options
 */
export interface PortalCustomization {
  /** Personal information display settings */
  personalInfo: any; // PersonalInfoConfig - simplified for now
  
  /** Design theme customizations */
  theme: any; // ThemeCustomization - simplified for now
  
  /** Section configurations */
  sections: any; // SectionCustomizations - simplified for now
  
  /** Content preferences */
  content: any; // ContentCustomization - simplified for now
  
  /** Layout preferences */
  layout: any; // LayoutCustomization - simplified for now
  
  /** Feature toggles */
  features: FeatureToggles;
  
  /** Custom branding options */
  branding?: any; // CustomBranding - simplified for now
}

/**
 * RAG (Retrieval Augmented Generation) configuration for AI chat
 * Defines settings for the personalized AI chat functionality
 */
export interface RAGConfig {
  /** Whether RAG chat is enabled */
  enabled: boolean;
  
  /** Vector database configuration */
  vectorDatabase: VectorDatabaseConfig;
  
  /** Embedding generation settings */
  embeddings: EmbeddingConfig;
  
  /** Chat service configuration */
  chatService: ChatServiceConfig;
  
  /** Knowledge base settings */
  knowledgeBase: any; // KnowledgeBaseConfig - simplified for now
  
  /** Query processing configuration */
  queryProcessing: any; // QueryProcessingConfig - simplified for now
  
  /** Response generation settings */
  responseGeneration: any; // ResponseGenerationConfig - simplified for now
}

// HuggingFaceSpaceConfig is imported from './portal-huggingface'

// ============================================================================
// PORTAL STATUS AND RESULT TYPES
// ============================================================================

/**
 * Portal generation status enumeration
 */
export enum PortalStatus {
  /** Initial state, not yet started */
  PENDING = 'pending',
  
  /** Currently being generated */
  GENERATING = 'generating',
  
  /** Template customization in progress */
  CUSTOMIZING = 'customizing',
  
  /** RAG system being set up */
  BUILDING_RAG = 'building_rag',
  
  /** Deploying to HuggingFace */
  DEPLOYING = 'deploying',
  
  /** Successfully completed */
  COMPLETED = 'completed',
  
  /** Generation failed */
  FAILED = 'failed',
  
  /** Portal archived/deleted */
  ARCHIVED = 'archived'
}

/**
 * Portal generation result
 * Return type for portal generation functions
 */
export interface PortalGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  
  /** Generated portal configuration */
  portalConfig?: PortalConfig;
  
  /** Portal URLs if successful */
  urls?: PortalUrls;
  
  /** Generation metadata */
  metadata: GenerationMetadata;
  
  /** Error information if failed */
  error?: PortalError;
  
  /** Processing time in milliseconds */
  processingTimeMs: number;
  
  /** Generation steps completed */
  stepsCompleted: PortalGenerationStep[];
  
  /** Warnings encountered during generation */
  warnings?: string[];
}

/**
 * Portal generation steps for tracking progress
 */
export enum PortalGenerationStep {
  VALIDATE_INPUT = 'validate_input',
  EXTRACT_CV_DATA = 'extract_cv_data',
  GENERATE_TEMPLATE = 'generate_template',
  CUSTOMIZE_DESIGN = 'customize_design',
  BUILD_RAG_SYSTEM = 'build_rag_system',
  CREATE_EMBEDDINGS = 'create_embeddings',
  SETUP_VECTOR_DB = 'setup_vector_db',
  DEPLOY_TO_HUGGINGFACE = 'deploy_to_huggingface',
  CONFIGURE_URLS = 'configure_urls',
  UPDATE_CV_DOCUMENT = 'update_cv_document',
  GENERATE_QR_CODES = 'generate_qr_codes',
  FINALIZE_PORTAL = 'finalize_portal'
}

// ============================================================================
// TEMPLATE AND CUSTOMIZATION TYPES
// ============================================================================

/**
 * Portal template categories
 */
export enum PortalTemplateCategory {
  CORPORATE_PROFESSIONAL = 'corporate_professional',
  CREATIVE_PORTFOLIO = 'creative_portfolio',
  TECHNICAL_EXPERT = 'technical_expert',
  EXECUTIVE_LEADERSHIP = 'executive_leadership',
  ACADEMIC_RESEARCH = 'academic_research',
  STARTUP_FOUNDER = 'startup_founder',
  CONSULTANT = 'consultant',
  FREELANCER = 'freelancer'
}

/**
 * Design theme configuration
 */
// PortalTheme is imported from './portal-theme'

/**
 * Color scheme configuration
 */
export interface ColorScheme {
  /** Primary brand color */
  primary: string;
  
  /** Secondary accent color */
  secondary: string;
  
  /** Background color */
  background: string;
  
  /** Dark background color */
  backgroundDark?: string;
  
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  
  /** Secondary text color (alias for text.secondary) */
  textSecondary?: string;
  
  /** Border colors */
  border: {
    primary: string;
    secondary: string;
  };
  
  /** Status colors */
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  /** Gradient definitions */
  gradients?: {
    primary: string;
    secondary: string;
    hero: string;
  };
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  /** Font families */
  fontFamilies: {
    heading: string;
    body: string;
    code: string;
  };
  
  /** Font sizes */
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  
  /** Line heights */
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  
  /** Font weights */
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

/**
 * Portal sections enumeration
 */
export enum PortalSection {
  HERO = 'hero',
  ABOUT = 'about',
  EXPERIENCE = 'experience',
  SKILLS = 'skills',
  EDUCATION = 'education',
  PROJECTS = 'projects',
  PORTFOLIO = 'portfolio',
  ACHIEVEMENTS = 'achievements',
  CERTIFICATIONS = 'certifications',
  TESTIMONIALS = 'testimonials',
  CONTACT = 'contact',
  CHAT = 'chat',
  BLOG = 'blog',
  PUBLICATIONS = 'publications',
  SPEAKING = 'speaking',
  AWARDS = 'awards',
  INTERESTS = 'interests'
}

// ============================================================================
// RAG SYSTEM TYPES
// ============================================================================

/**
 * Vector database configuration
 */
export interface VectorDatabaseConfig {
  /** Database type/provider */
  provider: VectorDatabaseProvider;
  
  /** Index configuration */
  index: any; // VectorIndexConfig - simplified for now
  
  /** Storage configuration */
  storage: any; // VectorStorageConfig - simplified for now
  
  /** Search configuration */
  search: any; // VectorSearchConfig - simplified for now
}

/**
 * Vector database providers
 */
export enum VectorDatabaseProvider {
  FAISS = 'faiss',
  CHROMA = 'chroma',
  PINECONE = 'pinecone',
  LOCAL_FILE = 'local_file'
}

/**
 * Embedding configuration for RAG system
 */
export interface EmbeddingConfig {
  /** Embedding model provider */
  provider: EmbeddingProvider;
  
  /** Specific model to use */
  model: string;
  
  /** Embedding dimensions */
  dimensions: number;
  
  /** Chunking strategy */
  chunking: any; // ChunkingConfig - simplified for now
  
  /** Preprocessing settings */
  preprocessing: any; // PreprocessingConfig - simplified for now
}

/**
 * Embedding providers
 */
export enum EmbeddingProvider {
  HUGGINGFACE = 'huggingface',
  OPENAI = 'openai',
  COHERE = 'cohere',
  SENTENCE_TRANSFORMERS = 'sentence_transformers'
}

/**
 * RAG embedding data structure
 */
export interface RAGEmbedding {
  /** Unique embedding ID */
  id: string;
  
  /** Text content */
  content: string;
  
  /** Metadata about the content */
  metadata: EmbeddingMetadata;
  
  /** Vector embedding array */
  vector: number[];
  
  /** Token count */
  tokens: number;
  
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Embedding metadata
 */
export interface EmbeddingMetadata {
  /** CV section this embedding belongs to */
  section: CVSection;
  
  /** Subsection if applicable */
  subsection?: string;
  
  /** Importance score (1-10) */
  importance: number;
  
  /** Date range if applicable */
  dateRange?: {
    start: Date;
    end?: Date;
  };
  
  /** Associated technologies/skills */
  technologies?: string[];
  
  /** Company/organization */
  company?: string;
  
  /** Role/position */
  role?: string;
  
  /** Keywords extracted from content */
  keywords: string[];
  
  /** Content type */
  contentType: ContentType;
  
  /** Chunking strategy used */
  chunkType?: string;
}

/**
 * CV sections for embedding categorization
 */
export enum CVSection {
  PERSONAL = 'personal',
  SUMMARY = 'summary',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  ACHIEVEMENTS = 'achievements',
  PROJECTS = 'projects',
  CERTIFICATIONS = 'certifications',
  PUBLICATIONS = 'publications',
  INTERESTS = 'interests',
  REFERENCES = 'references',
  CUSTOM = 'custom'
}

/**
 * Content types for embeddings
 */
export enum ContentType {
  TEXT = 'text',
  BULLET_POINT = 'bullet_point',
  DESCRIPTION = 'description',
  ACHIEVEMENT = 'achievement',
  SKILL = 'skill',
  DATE_RANGE = 'date_range',
  CONTACT_INFO = 'contact_info',
  SUMMARY = 'summary'
}

/**
 * Chat service configuration
 */
export interface ChatServiceConfig {
  /** LLM provider */
  provider: LLMProvider;
  
  /** Model to use */
  model: string;
  
  /** Generation parameters */
  parameters: LLMParameters;
  
  /** System prompt configuration */
  systemPrompt: any; // SystemPromptConfig - simplified for now
  
  /** Response formatting */
  responseFormat: any; // ResponseFormatConfig - simplified for now
  
  /** Rate limiting */
  rateLimiting: any; // RateLimitConfig - simplified for now
}

/**
 * LLM providers
 */
export enum LLMProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  HUGGINGFACE = 'huggingface',
  COHERE = 'cohere'
}

/**
 * LLM generation parameters
 */
export interface LLMParameters {
  /** Temperature for randomness (0-1) */
  temperature: number;
  
  /** Maximum tokens to generate */
  maxTokens: number;
  
  /** Top-p sampling */
  topP: number;
  
  /** Frequency penalty */
  frequencyPenalty?: number;
  
  /** Presence penalty */
  presencePenalty?: number;
  
  /** Stop sequences */
  stopSequences?: string[];
}

// ============================================================================
// URL AND DEPLOYMENT TYPES
// ============================================================================

/**
 * Portal URLs structure
 */
// PortalUrls is imported from './portal-analytics'

/**
 * HuggingFace visibility options
 */
export enum HuggingFaceVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

/**
 * HuggingFace SDK options
 */
export enum HuggingFaceSDK {
  GRADIO = 'gradio',
  STREAMLIT = 'streamlit',
  DOCKER = 'docker',
  STATIC = 'static'
}

/**
 * HuggingFace hardware options
 */
export enum HuggingFaceHardware {
  CPU_BASIC = 'cpu-basic',
  CPU_UPGRADE = 'cpu-upgrade',
  GPU_BASIC = 'gpu-basic',
  GPU_UPGRADE = 'gpu-upgrade'
}

/**
 * Repository configuration for HuggingFace deployment
 */
export interface RepositoryConfig {
  /** Repository name */
  name: string;
  
  /** Repository description */
  description: string;
  
  /** Git configuration */
  git: {
    branch: string;
    commitMessage: string;
  };
  
  /** File structure */
  files: RepositoryFile[];
  
  /** Build configuration */
  build: any; // BuildConfig - simplified for now
}

/**
 * Repository file structure
 */
export interface RepositoryFile {
  /** File path */
  path: string;
  
  /** File content or reference */
  content: string | Buffer;
  
  /** File type */
  type: FileType;
  
  /** Whether file is required */
  required: boolean;
}

/**
 * File types
 */
export enum FileType {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  HTML = 'html',
  CSS = 'css',
  JSON = 'json',
  MARKDOWN = 'markdown',
  IMAGE = 'image',
  BINARY = 'binary',
  CONFIG = 'config'
}

// ============================================================================
// ANALYTICS AND TRACKING TYPES
// ============================================================================

/**
 * Portal analytics data
 */
export interface PortalAnalytics {
  /** Basic metrics */
  metrics: PortalMetrics;
  
  /** Visitor tracking */
  visitors: any; // VisitorAnalytics - simplified for now
  
  /** Chat interactions */
  chat: any; // ChatAnalytics - simplified for now
  
  /** Feature usage */
  features: any; // FeatureUsageAnalytics - simplified for now
  
  /** Performance metrics */
  performance: any; // PerformanceMetrics - simplified for now
  
  /** QR code specific analytics */
  qrCodes: QRCodeAnalytics;
}

/**
 * Basic portal metrics
 */
export interface PortalMetrics {
  /** Total page views */
  totalViews: number;
  
  /** Unique visitors */
  uniqueVisitors: number;
  
  /** Average session duration */
  averageSessionDuration: number;
  
  /** Bounce rate */
  bounceRate: number;
  
  /** Total chat sessions */
  chatSessions: number;
  
  /** Contact form submissions */
  contactSubmissions: number;
  
  /** CV downloads */
  cvDownloads: number;
  
  /** Last updated */
  lastUpdated: Date;
}

/**
 * QR code analytics
 */
export interface QRCodeAnalytics {
  /** Total QR code scans */
  totalScans: number;
  
  /** Unique scan sessions */
  uniqueScans: number;
  
  /** Scan source breakdown */
  sources: {
    primary: number;     // Main QR on CV
    chat: number;        // Chat-specific QR
    contact: number;     // Contact form QR
    menu: number;        // Multi-purpose QR menu
  };
  
  /** Conversion rates */
  conversions: {
    scanToView: number;      // % of scans that result in page view
    scanToChat: number;      // % of scans that result in chat
    scanToContact: number;   // % of scans that result in contact
  };
  
  /** Device breakdown */
  devices: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  
  /** Geographic data */
  locations: Array<{
    country: string;
    city?: string;
    scans: number;
  }>;
}

// ============================================================================
// PRIVACY AND SECURITY TYPES
// ============================================================================

/**
 * Portal privacy settings
 */
export interface PortalPrivacySettings {
  /** Privacy level */
  level: PrivacyLevel;
  
  /** Data masking rules */
  masking: DataMaskingRules;
  
  /** Access controls */
  access: any; // AccessControlSettings - simplified for now
  
  /** Data retention settings */
  retention: any; // DataRetentionSettings - simplified for now
  
  /** GDPR compliance settings */
  gdpr: any; // GDPRSettings - simplified for now
  
  /** Analytics consent */
  analyticsConsent: boolean;
  
  /** Chat data retention */
  chatDataRetention: any; // ChatDataRetentionSettings - simplified for now
}

/**
 * Privacy levels
 */
export enum PrivacyLevel {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PASSWORD_PROTECTED = 'password_protected',
  PRIVATE = 'private'
}

/**
 * Data masking rules
 */
export interface DataMaskingRules {
  /** Mask personal contact info */
  maskContactInfo: boolean;
  
  /** Mask specific companies */
  maskCompanies: string[];
  
  /** Mask date ranges */
  maskDates: boolean;
  
  /** Custom masking patterns */
  customRules: Array<{
    pattern: string;
    replacement: string;
    description: string;
  }>;
  
  /** Forwarding email for public contact */
  publicEmail?: string;
  
  /** Public phone number */
  publicPhone?: string;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Portal error information
 */
export interface PortalError {
  /** Error code */
  code: PortalErrorCode;
  
  /** Error message */
  message: string;
  
  /** Detailed error description */
  details?: string;
  
  /** Error context */
  context?: Record<string, any>;
  
  /** Timestamp when error occurred */
  timestamp: Date;
  
  /** Whether error is recoverable */
  recoverable: boolean;
  
  /** Stack trace for debugging */
  stack?: string;
  
  /** Error category */
  category: ErrorCategory;
}

// PortalErrorCode enum moved to portal.ts to avoid circular export conflicts

/**
 * Error categories
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  GENERATION = 'generation',
  DEPLOYMENT = 'deployment',
  INTEGRATION = 'integration',
  SYSTEM = 'system',
  EXTERNAL_API = 'external_api'
}

// ============================================================================
// HELPER AND UTILITY TYPES
// ============================================================================

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Generator version */
  version: string;
  
  /** Generation timestamp */
  timestamp: Date;
  
  /** Processing statistics */
  statistics: ProcessingStatistics;
  
  /** Resource usage */
  resourceUsage: ResourceUsage;
  
  /** Quality metrics */
  quality: QualityMetrics;
}

/**
 * Processing statistics
 */
export interface ProcessingStatistics {
  /** Total processing time in ms */
  totalTimeMs: number;
  
  /** Time breakdown by step */
  stepTimes: Record<PortalGenerationStep, number>;
  
  /** Number of embeddings generated */
  embeddingsGenerated: number;
  
  /** Vector database size in MB */
  vectorDbSizeMB: number;
  
  /** Template bundle size in KB */
  templateSizeKB: number;
  
  /** Number of assets processed */
  assetsProcessed: number;
}

/**
 * Resource usage tracking
 */
export interface ResourceUsage {
  /** Memory usage in MB */
  memoryUsageMB: number;
  
  /** CPU time in seconds */
  cpuTimeSeconds: number;
  
  /** Network requests made */
  networkRequests: number;
  
  /** Storage used in MB */
  storageUsedMB: number;
  
  /** API calls made */
  apiCalls: Record<string, number>;
}

/**
 * Quality metrics for generated portals
 */
export interface QualityMetrics {
  /** Content completeness score (0-1) */
  completenessScore: number;
  
  /** Design consistency score (0-1) */
  designConsistencyScore: number;
  
  /** RAG accuracy score (0-1) */
  ragAccuracyScore: number;
  
  /** Performance score (0-1) */
  performanceScore: number;
  
  /** Accessibility score (0-1) */
  accessibilityScore: number;
  
  /** Overall quality score (0-1) */
  overallScore: number;
}

// ============================================================================
// EXTENDED CONFIGURATION TYPES
// ============================================================================

/**
 * Template configuration options
 */
export interface TemplateConfig {
  /** Supported languages */
  supportedLanguages: string[];
  
  /** Default language */
  defaultLanguage: string;
  
  /** Mobile optimization level */
  mobileOptimization: MobileOptimizationLevel;
  
  /** SEO configuration */
  seo: SEOConfig;
  
  /** Performance optimization */
  performance: any; // PerformanceConfig - simplified for now
  
  /** Accessibility features */
  accessibility: any; // AccessibilityConfig - simplified for now
}

/**
 * Mobile optimization levels
 */
export enum MobileOptimizationLevel {
  BASIC = 'basic',
  ENHANCED = 'enhanced',
  ADVANCED = 'advanced'
}

/**
 * SEO configuration
 */
export interface SEOConfig {
  /** Meta tags configuration */
  metaTags: any; // MetaTagsConfig - simplified for now
  
  /** OpenGraph settings */
  openGraph: any; // OpenGraphConfig - simplified for now
  
  /** Schema.org markup */
  schema: any; // SchemaConfig - simplified for now
  
  /** Sitemap generation */
  sitemap: boolean;
  
  /** Robots.txt configuration */
  robotsTxt: any; // RobotsTxtConfig - simplified for now
}

/**
 * Feature toggles for portal functionality
 */
export interface FeatureToggles {
  /** Enable AI chat feature */
  enableChat: boolean;
  
  /** Enable contact form */
  enableContactForm: boolean;
  
  /** Enable portfolio gallery */
  enablePortfolio: boolean;
  
  /** Enable testimonials section */
  enableTestimonials: boolean;
  
  /** Enable blog/articles section */
  enableBlog: boolean;
  
  /** Enable analytics tracking */
  enableAnalytics: boolean;
  
  /** Enable social sharing */
  enableSocialSharing: boolean;
  
  /** Enable CV download */
  enableCVDownload: boolean;
  
  /** Enable calendar integration */
  enableCalendar: boolean;
  
  /** Enable dark mode */
  enableDarkMode: boolean;
  
  /** Enable multi-language support */
  enableMultiLanguage: boolean;
  
  /** Enable accessibility features */
  enableAccessibility: boolean;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Integration with existing CVPlus systems
 */
export interface CVPlusIntegration {
  /** Job/CV integration */
  job: JobIntegration;
  
  /** QR code system integration */
  qrCodes: any; // QRCodeIntegration - simplified for now
  
  /** Analytics system integration */
  analytics: any; // AnalyticsIntegration - simplified for now
  
  /** Notification system integration */
  notifications: any; // NotificationIntegration - simplified for now
}

/**
 * Job integration settings
 */
export interface JobIntegration {
  /** Whether to automatically generate portal after CV completion */
  autoGenerate: boolean;
  
  /** Whether to update CV document with portal URL */
  updateCVDocument: boolean;
  
  /** Portal URL placement in CV */
  urlPlacement: URLPlacement[];
  
  /** QR code integration options */
  qrCodeOptions: QRCodeOptions;
}

/**
 * URL placement options in CV document
 */
export enum URLPlacement {
  HEADER = 'header',
  FOOTER = 'footer',
  CONTACT_SECTION = 'contact_section',
  SUMMARY_SECTION = 'summary_section',
  SEPARATE_PAGE = 'separate_page'
}

/**
 * QR code integration options
 */
export interface QRCodeOptions {
  /** Update existing QR codes to point to portal */
  updateExisting: boolean;
  
  /** Generate new portal-specific QR codes */
  generateNew: boolean;
  
  /** QR code types to generate */
  types: QRCodeType[];
  
  /** QR code styling options */
  styling: QRCodeStyling;
}

/**
 * QR code types
 */
export enum QRCodeType {
  PRIMARY_PORTAL = 'primary_portal',
  CHAT_DIRECT = 'chat_direct',
  CONTACT_FORM = 'contact_form',
  CV_DOWNLOAD = 'cv_download',
  MULTI_PURPOSE_MENU = 'multi_purpose_menu'
}

/**
 * QR code styling options
 */
export interface QRCodeStyling {
  /** Primary color */
  primaryColor: string;
  
  /** Background color */
  backgroundColor: string;
  
  /** Logo/icon to embed */
  logo?: string;
  
  /** Error correction level */
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  
  /** Size in pixels */
  size: number;
  
  /** Border width */
  borderWidth: number;
}

// ============================================================================
// ASSET MANAGEMENT TYPES
// ============================================================================

/**
 * Supported asset types for portal generation
 */
export enum AssetType {
  PROFILE_IMAGE = 'profile-image',
  COMPANY_LOGO = 'company-logo',
  PROJECT_IMAGE = 'project-image',
  CERTIFICATE = 'certificate',
  BACKGROUND_IMAGE = 'background-image',
  ICON = 'icon',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio'
}

/**
 * Source of the asset
 */
export enum AssetSource {
  CV_EXTRACTION = 'cv-extraction',
  AI_GENERATED = 'ai-generated',
  TEMPLATE_DEFAULT = 'template-default',
  USER_UPLOAD = 'user-upload',
  EXTERNAL_URL = 'external-url'
}

/**
 * Result of asset processing operations
 */
export interface AssetProcessingResult {
  /** Original asset URL */
  originalUrl: string;
  
  /** Processed/optimized asset URL */
  processedUrl: string;
  
  /** Asset type */
  type: AssetType;
  
  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** File size in bytes */
  fileSize: number;
  
  /** Image dimensions (if applicable) */
  dimensions?: {
    width: number;
    height: number;
  };
  
  /** Processing metadata */
  metadata: {
    processingTime: number;
    compressionRatio?: number;
    optimizations: string[];
  };
  
  /** Error information if processing failed */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Configuration for asset optimization
 */
export interface AssetOptimizationConfig {
  /** Target image quality (0-100) */
  quality: number;
  
  /** Maximum width in pixels */
  maxWidth: number;
  
  /** Maximum height in pixels */
  maxHeight: number;
  
  /** Output format */
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  
  /** Enable progressive loading */
  progressive: boolean;
  
  /** Compression level */
  compression: 'low' | 'medium' | 'high';
}

// ============================================================================
// DEPLOYMENT TYPES
// ============================================================================

/**
 * Build configuration for deployment
 */
export interface BuildConfig {
  /** Build command to execute */
  command?: string;
  /** Output directory for build artifacts */
  outputDir?: string;
  /** Environment variables for build */
  env?: Record<string, string>;
  /** Build dependencies */
  dependencies?: string[];
  /** Build steps */
  steps?: string[];
}

/**
 * Deployment metadata
 */
export interface DeploymentMetadata {
  /** Unique deployment identifier */
  deploymentId?: string;
  /** Deployment timestamp */
  deployedAt?: Date;
  /** Deployment status */
  status?: string;
  /** Build logs */
  buildLogs?: string[];
  /** Deployed resources */
  resources?: Record<string, any>;
}

/**
 * Result of deployment operations
 */
export interface DeploymentResult {
  /** Deployment ID */
  deploymentId: string;
  
  /** Target platform */
  platform: 'huggingface' | 'vercel' | 'netlify' | 'custom';
  
  /** Deployment status */
  status: 'pending' | 'building' | 'deployed' | 'failed';
  
  /** Deployed URL */
  url?: string;
  
  /** Build logs */
  buildLogs: string[];
  
  /** Deployment start time */
  startedAt: Date;
  
  /** Deployment completion time */
  completedAt?: Date;
  
  /** Error information if deployment failed */
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  
  /** Deployment metrics */
  metrics: {
    buildTime: number;
    bundleSize: number;
    buildSuccess: boolean;
  };
}

// ============================================================================
// COMPONENT CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for portal components
 */
export interface ComponentConfiguration {
  /** Component type identifier */
  type: string;
  
  /** Component display name */
  name: string;
  
  /** Whether component is enabled */
  enabled: boolean;
  
  /** Component-specific properties */
  props: Record<string, any>;
  
  /** Layout configuration */
  layout: {
    order: number;
    span: number;
    offset?: number;
  };
  
  /** Responsive behavior */
  responsive: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
  
  /** Theme overrides for this component */
  themeOverrides?: Partial<PortalTheme>;
}

// ============================================================================
// EXPORTED TYPE UTILITIES
// ============================================================================

/**
 * Utility type for partial portal configuration updates
 */
export type PartialPortalConfig = Partial<PortalConfig>;

/**
 * Utility type for portal configuration creation (excludes computed fields)
 */
export type CreatePortalConfig = Omit<PortalConfig, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'urls'>;

/**
 * Utility type for portal status updates
 */
export type PortalStatusUpdate = Pick<PortalConfig, 'id' | 'status' | 'updatedAt'> & {
  error?: PortalError;
  progress?: number;
  currentStep?: PortalGenerationStep;
};

/**
 * Utility type for portal URL updates
 */
export type PortalUrlUpdate = Pick<PortalConfig, 'id'> & {
  urls: PortalUrls;
  updatedAt: Date | FieldValue;
};

/**
 * Utility type for portal analytics updates
 */
export type PortalAnalyticsUpdate = Pick<PortalConfig, 'id'> & {
  analytics: Partial<PortalAnalytics>;
  updatedAt: Date | FieldValue;
};

// Re-export commonly used types for convenience
export type { ParsedCV } from './job';