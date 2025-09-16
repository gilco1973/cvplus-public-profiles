// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Portal Core Types - Main Configuration Interfaces
 *
 * Core portal configuration interfaces and primary types.
 *
 * @author Gil Klainert
 * @version 1.0.0
 */

import type { FieldValue } from 'firebase-admin/firestore';
import { PortalTheme } from './portal-theme';
import { HuggingFaceSpaceConfig } from './portal-huggingface';
import { PortalUrls } from './portal-analytics';
import { RAGConfig } from './portal-rag-config';
import {
  ColorScheme,
  TypographyConfig,
  PortalLayout,
  ComponentVisibility,
  TemplateStyling
} from './portal-styling';
import {
  PortalSEOMetadata,
  PortalBranding,
  HeaderCustomization,
  FooterCustomization,
  LogoConfiguration,
  SocialLinks,
  ContactInformation
} from './portal-customization';

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

  /** Timestamp when portal configuration was created */
  createdAt: FieldValue | Date;

  /** Timestamp when portal configuration was last updated */
  updatedAt: FieldValue | Date;

  /** Optional expiration timestamp for temporary portals */
  expiresAt?: FieldValue | Date;

  /** Portal analytics and tracking settings */
  analyticsEnabled: boolean;

  /** Public visibility setting */
  isPublic: boolean;

  /** SEO metadata */
  seoMetadata?: PortalSEOMetadata;

  /** Custom domain configuration */
  customDomain?: string;

  /** Portal branding options */
  branding?: PortalBranding;
}

/**
 * Portal template configuration
 */
export interface PortalTemplate {
  /** Template identifier */
  id: string;

  /** Template display name */
  name: string;

  /** Template category */
  category: string;

  /** Template theme configuration */
  theme: PortalTheme;

  /** Layout configuration */
  layout: PortalLayout;

  /** Component visibility settings */
  components: ComponentVisibility;

  /** Template-specific styling */
  styling: TemplateStyling;
}

/**
 * User customization settings
 */
export interface PortalCustomization {
  /** Custom colors override */
  colors?: Partial<ColorScheme>;

  /** Custom typography settings */
  typography?: Partial<TypographyConfig>;

  /** Custom header configuration */
  header?: HeaderCustomization;

  /** Custom footer configuration */
  footer?: FooterCustomization;

  /** Custom logo/branding */
  logo?: LogoConfiguration;

  /** Social media links */
  socialLinks?: SocialLinks;

  /** Contact information */
  contactInfo?: ContactInformation;
}

/**
 * Portal generation and deployment status
 */
export enum PortalStatus {
  /** Initial status when portal config is created */
  DRAFT = 'draft',

  /** Portal generation is in progress */
  GENERATING = 'generating',

  /** Portal has been generated but not deployed */
  GENERATED = 'generated',

  /** Portal is being deployed to HuggingFace */
  DEPLOYING = 'deploying',

  /** Portal is live and accessible */
  LIVE = 'live',

  /** Portal generation/deployment failed */
  FAILED = 'failed',

  /** Portal has been archived/disabled */
  ARCHIVED = 'archived'
}

/**
 * Portal generation result
 */
export interface PortalGenerationResult {
  /** Operation success status */
  success: boolean;

  /** Generated portal configuration */
  config?: PortalConfig;

  /** Generated files and assets */
  assets?: GeneratedAsset[];

  /** Deployment information */
  deployment?: DeploymentInfo;

  /** Error information if generation failed */
  error?: PortalError;

  /** Generation metadata */
  metadata: GenerationMetadata;
}

/**
 * Generated asset information
 */
export interface GeneratedAsset {
  /** Asset type */
  type: 'html' | 'css' | 'js' | 'image' | 'config';

  /** Asset file path */
  path: string;

  /** Asset size in bytes */
  size: number;

  /** Asset hash for integrity */
  hash: string;

  /** Asset metadata */
  metadata?: Record<string, any>;
}

/**
 * Deployment information
 */
export interface DeploymentInfo {
  /** Deployment platform */
  platform: 'huggingface' | 'vercel' | 'netlify' | 'custom';

  /** Deployment URL */
  url: string;

  /** Deployment status */
  status: 'pending' | 'deploying' | 'success' | 'failed';

  /** Deployment timestamp */
  timestamp: Date;

  /** Deployment metadata */
  metadata?: Record<string, any>;
}

/**
 * Portal error information
 */
export interface PortalError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error details */
  details?: Record<string, any>;

  /** Error stack trace (development only) */
  stack?: string;

  /** Error timestamp */
  timestamp: Date;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Generation timestamp */
  timestamp: Date;

  /** Generation duration in milliseconds */
  duration: number;

  /** Template used */
  templateId: string;

  /** Generation version */
  version: string;

  /** Feature flags used */
  features: string[];

  /** Performance metrics */
  performance?: PerformanceMetrics;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Total generation time */
  totalTime: number;

  /** Template processing time */
  templateTime: number;

  /** Asset generation time */
  assetTime: number;

  /** RAG setup time */
  ragTime: number;

  /** Deployment time */
  deploymentTime: number;

  /** Memory usage in MB */
  memoryUsage: number;
}