// Types - Export main types only to avoid conflicts
export type { 
  PublicProfileData,
  ProfileCreationOptions,
  ProfileUpdateOptions,
  PublicProfileResult,
  ProfileUpdateResult,
  SEOSettings,
  SEOReport
} from './types/profile.types';

export type {
  AnalyticsData,
  AnalyticsTimeRange,
  ProfileMetrics
} from './types/analytics.types';

export type {
  NetworkingConfiguration
} from './types/networking.types';

export type {
  SEOMetadata,
  SEOOptimizationResult
} from './types/seo.types';

// Constants - Export specific constants to avoid conflicts
export { PROFILE_CONSTANTS } from './constants/profile.constants';
export { SEO_CONSTANTS } from './constants/seo.constants';
export { ANALYTICS_CONSTANTS } from './constants/analytics.constants';

// Services
export * from './services';

// Main Public Profiles Manager
import { PublicProfilesServiceFactory } from './services';
import { 
  PublicProfileData, 
  ProfileCreationOptions, 
  ProfileUpdateOptions,
  PublicProfileResult,
  ProfileUpdateResult 
} from './types/profile.types';
import { AnalyticsData, AnalyticsTimeRange } from './types/analytics.types';
import { SEOReport } from './types/profile.types';

export class PublicProfilesManager {
  private serviceFactory: PublicProfilesServiceFactory;

  constructor() {
    this.serviceFactory = PublicProfilesServiceFactory.getInstance();
  }

  // Profile Management
  async createProfile(
    userId: string,
    profileData: Partial<PublicProfileData>,
    options: ProfileCreationOptions = {}
  ): Promise<PublicProfileResult> {
    const profileService = this.serviceFactory.getProfileService();
    return await profileService.createPublicProfile(userId, profileData, options);
  }

  async updateProfile(
    profileId: string,
    updates: Partial<PublicProfileData>,
    options: ProfileUpdateOptions = {}
  ): Promise<ProfileUpdateResult> {
    const profileService = this.serviceFactory.getProfileService();
    return await profileService.updatePublicProfile(profileId, updates, options);
  }

  async getProfile(identifier: string): Promise<PublicProfileData | null> {
    const profileService = this.serviceFactory.getProfileService();
    return await profileService.getPublicProfile(identifier);
  }

  async publishProfile(profileId: string): Promise<boolean> {
    const profileService = this.serviceFactory.getProfileService();
    return await profileService.publishProfile(profileId);
  }

  async unpublishProfile(profileId: string): Promise<boolean> {
    const profileService = this.serviceFactory.getProfileService();
    return await profileService.unpublishProfile(profileId);
  }

  async deleteProfile(profileId: string): Promise<boolean> {
    const profileService = this.serviceFactory.getProfileService();
    return await profileService.deleteProfile(profileId);
  }

  // SEO Management
  async generateSEOReport(profileId: string): Promise<SEOReport> {
    const seoService = this.serviceFactory.getSEOService();
    return await seoService.generateSEOReport(profileId);
  }

  async optimizeSEO(
    profile: PublicProfileData,
    options: {
      targetKeywords?: string[];
      industryFocus?: string;
      locationTargeting?: string;
    } = {}
  ): Promise<{ optimizedSettings: any }> {
    const seoService = this.serviceFactory.getSEOService();
    return await seoService.optimizeProfile(profile, options);
  }

  async generateSitemap(profile: PublicProfileData): Promise<string> {
    const seoService = this.serviceFactory.getSEOService();
    return await seoService.generateSitemap(profile);
  }

  // Analytics Management
  async setupAnalytics(profileId: string, profileSlug: string): Promise<any> {
    const analyticsService = this.serviceFactory.getAnalyticsService();
    return await analyticsService.setupProfileTracking(profileId, profileSlug);
  }

  async getAnalytics(
    profileId: string,
    timeRange: AnalyticsTimeRange = 'last_30_days',
    customRange?: { startDate: Date; endDate: Date }
  ): Promise<AnalyticsData> {
    const analyticsService = this.serviceFactory.getAnalyticsService();
    return await analyticsService.getAnalyticsData(profileId, timeRange, customRange);
  }

  async trackView(
    profileId: string,
    viewData: {
      timestamp: Date;
      source: string;
      referrer?: string;
      userAgent?: string;
      ipAddress?: string;
      sessionId?: string;
      userId?: string;
    }
  ): Promise<void> {
    const analyticsService = this.serviceFactory.getAnalyticsService();
    await analyticsService.trackProfileView(profileId, viewData);
  }

  async trackEvent(
    profileId: string,
    eventType: string,
    eventData: {
      category: string;
      action: string;
      label?: string;
      value?: number;
      sessionId?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const analyticsService = this.serviceFactory.getAnalyticsService();
    await analyticsService.trackEvent(profileId, eventType, eventData);
  }

  // Networking Management
  async enableNetworking(profileId: string, options: any = {}): Promise<void> {
    const networkingService = this.serviceFactory.getNetworkingService();
    await networkingService.enableNetworking(profileId, options);
  }

  // Utility Methods
  getServiceFactory(): PublicProfilesServiceFactory {
    return this.serviceFactory;
  }

  // Static Factory Method
  static create(): PublicProfilesManager {
    return new PublicProfilesManager();
  }
}

// Default Export
export default PublicProfilesManager;

// Version Information
export const VERSION = '1.0.0';
export const MODULE_NAME = '@cvplus/public-profiles';

// Module Configuration
export interface PublicProfilesConfig {
  baseUrl?: string;
  apiEndpoint?: string;
  enableAnalytics?: boolean;
  enableNetworking?: boolean;
  enableSEO?: boolean;
  defaultTemplate?: string;
  storageProvider?: 'firebase' | 'aws' | 'local';
  analyticsProvider?: 'google' | 'plausible' | 'custom';
}

// Module Initialization
export function initializePublicProfiles(config: PublicProfilesConfig = {}): PublicProfilesManager {
  // Apply configuration
  if (config.baseUrl) {
    process.env.PUBLIC_PROFILES_BASE_URL = config.baseUrl;
  }

  if (config.apiEndpoint) {
    process.env.PUBLIC_PROFILES_API_ENDPOINT = config.apiEndpoint;
  }

  return PublicProfilesManager.create();
}