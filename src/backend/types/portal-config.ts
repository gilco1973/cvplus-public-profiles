/**
 * Portal Configuration Types
 * 
 * Core configuration interfaces for portal generation system.
 * Extracted from portal.ts to maintain <200 line compliance.
 * 
 * @author Gil Klainert
 * @version 1.0.0
 */

import { RAGConfig } from './portal-rag';
import { PortalTheme } from './portal-theme';

/**
 * Main configuration interface for portal generation
 * Defines all settings needed to create a personalized web portal
 */
export interface PortalConfig {
  /** Unique identifier for the portal configuration */
  id: string;
  
  /** Associated job/CV ID from CVPlus */
  jobId: string;
  
  /** User ID who owns this portal */
  userId: string;
  
  /** Custom domain name for the portal (optional) */
  customDomain?: string;
  
  /** Portal template selection */
  template: PortalTemplate;
  
  /** Customization settings */
  customization: PortalCustomization;
  
  /** RAG system configuration */
  ragConfig: RAGConfig;
  
  /** Features enabled for this portal */
  features: PortalFeatures;
  
  /** SEO and metadata settings */
  metadata: PortalMetadata;
  
  /** Portal status */
  status: PortalStatus;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Portal generation result (if completed) */
  generationResult?: PortalGenerationResult;
}

/**
 * Portal template definition
 */
export interface PortalTemplate {
  /** Template identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Template category */
  category: PortalTemplateCategory;
  
  /** Preview image URL */
  previewUrl: string;
  
  /** Whether this template is premium */
  isPremium: boolean;
  
  /** Template features */
  features: string[];
  
  /** Default theme settings */
  defaultTheme: PortalTheme;
}

/**
 * Portal customization options
 */
export interface PortalCustomization {
  /** Theme customization */
  theme: PortalTheme;
  
  /** Layout preferences */
  layout: {
    /** Header style */
    headerStyle: 'minimal' | 'detailed' | 'hero';
    
    /** Navigation style */
    navigationStyle: 'horizontal' | 'vertical' | 'hidden';
    
    /** Content layout */
    contentLayout: 'single' | 'two-column' | 'grid';
  };
  
  /** Custom CSS (if allowed) */
  customCSS?: string;
  
  /** Custom JavaScript (if allowed) */
  customJS?: string;
}

/**
 * Portal status enumeration
 */
export enum PortalStatus {
  DRAFT = 'draft',
  CONFIGURING = 'configuring',
  GENERATING = 'generating',
  DEPLOYING = 'deploying',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

/**
 * Portal template categories
 */
export enum PortalTemplateCategory {
  PROFESSIONAL = 'professional',
  CREATIVE = 'creative',
  TECHNICAL = 'technical',
  ACADEMIC = 'academic',
  BUSINESS = 'business',
  MINIMAL = 'minimal',
  MODERN = 'modern',
  CLASSIC = 'classic'
}

/**
 * Portal features configuration
 */
export interface PortalFeatures {
  /** RAG-based AI chat */
  aiChat: boolean;
  
  /** Dynamic QR code generation */
  qrCode: boolean;
  
  /** Contact form */
  contactForm: boolean;
  
  /** Calendar integration */
  calendar: boolean;
  
  /** Portfolio showcase */
  portfolio: boolean;
  
  /** Social media links */
  socialLinks: boolean;
  
  /** Testimonials section */
  testimonials: boolean;
  
  /** Analytics integration */
  analytics: boolean;
}

/**
 * Portal SEO and metadata
 */
export interface PortalMetadata {
  /** Page title */
  title: string;
  
  /** Meta description */
  description: string;
  
  /** Keywords for SEO */
  keywords: string[];
  
  /** Open Graph image */
  ogImage?: string;
  
  /** Custom meta tags */
  customMeta?: Record<string, string>;
}

/**
 * Portal generation result
 */
export interface PortalGenerationResult {
  portalUrl: string;
  spaceUrl?: string;
  status: 'success' | 'failed' | 'partial';
  error?: string;
  metadata: { generationTime: number; filesCreated: number; totalSize: number; };
}

/**
 * Error categories
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  GENERATION = 'generation',
  DEPLOYMENT = 'deployment',
  INTEGRATION = 'integration',
  SYSTEM = 'system',
  HUGGINGFACE = 'huggingface',
  RAG = 'rag',
  TEMPLATE = 'template',
  AUTHENTICATION = 'authentication',
  QUOTA = 'quota',
  EXTERNAL_API = 'external_api'
}