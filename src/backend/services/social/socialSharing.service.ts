/**
 * Enhanced Social Sharing Service
 * Handles social media integration and sharing
 * Author: Gil Klainert
 * Date: 2025-08-22
 */

import * as admin from 'firebase-admin';
import { https } from 'firebase-functions';

interface SocialProfile {
  platform: 'linkedin' | 'twitter' | 'github' | 'instagram' | 'facebook';
  username: string;
  url: string;
  verified?: boolean;
}

interface ShareCard {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  tags?: string[];
}

interface OpenGraphTags {
  'og:title': string;
  'og:description': string;
  'og:image': string;
  'og:url': string;
  'og:type': string;
  'twitter:card': string;
  'twitter:title': string;
  'twitter:description': string;
  'twitter:image': string;
}

export class SocialSharingService {
  private db = admin.firestore();

  /**
   * Generate share links for all platforms
   */
  generateShareLinks(shareCard: ShareCard): Record<string, string> {
    const encodedUrl = encodeURIComponent(shareCard.url);
    const encodedTitle = encodeURIComponent(shareCard.title);
    const encodedDesc = encodeURIComponent(shareCard.description);
    const encodedTags = shareCard.tags ? encodeURIComponent(shareCard.tags.join(',')) : '';

    return {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%20${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`
    };
  }

  /**
   * Generate Open Graph meta tags
   */
  generateOpenGraphTags(shareCard: ShareCard): OpenGraphTags {
    return {
      'og:title': shareCard.title,
      'og:description': shareCard.description,
      'og:image': shareCard.imageUrl,
      'og:url': shareCard.url,
      'og:type': 'profile',
      'twitter:card': 'summary_large_image',
      'twitter:title': shareCard.title,
      'twitter:description': shareCard.description,
      'twitter:image': shareCard.imageUrl
    };
  }

  /**
   * Link social profiles to user account
   */
  async linkSocialProfile(
    userId: string,
    profile: SocialProfile
  ): Promise<void> {
    await this.db
      .collection('users')
      .doc(userId)
      .collection('social_profiles')
      .doc(profile.platform)
      .set({
        ...profile,
        linkedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  }

  /**
   * Get user's linked social profiles
   */
  async getSocialProfiles(userId: string): Promise<SocialProfile[]> {
    const snapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('social_profiles')
      .get();

    return snapshot.docs.map(doc => doc.data() as SocialProfile);
  }

  /**
   * Unlink social profile
   */
  async unlinkSocialProfile(
    userId: string,
    platform: string
  ): Promise<void> {
    await this.db
      .collection('users')
      .doc(userId)
      .collection('social_profiles')
      .doc(platform)
      .delete();
  }

  /**
   * Track share event
   */
  async trackShare(
    userId: string,
    platform: string,
    contentType: string
  ): Promise<void> {
    await this.db.collection('share_analytics').add({
      userId,
      platform,
      contentType,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Get share analytics
   */
  async getShareAnalytics(userId: string): Promise<{
    totalShares: number;
    byPlatform: Record<string, number>;
    recentShares: Array<{ platform: string; timestamp: Date }>;
  }> {
    const snapshot = await this.db
      .collection('share_analytics')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const shares = snapshot.docs.map(doc => doc.data());
    
    const analytics = {
      totalShares: shares.length,
      byPlatform: {} as Record<string, number>,
      recentShares: [] as Array<{ platform: string; timestamp: Date }>
    };

    shares.forEach(share => {
      analytics.byPlatform[share.platform] = 
        (analytics.byPlatform[share.platform] || 0) + 1;
    });

    analytics.recentShares = shares.slice(0, 10).map(share => ({
      platform: share.platform,
      timestamp: share.timestamp.toDate()
    }));

    return analytics;
  }

  /**
   * Generate social sharing preview image
   */
  async generatePreviewImage(
    userId: string,
    template: 'default' | 'professional' | 'creative'
  ): Promise<string> {
    // This would integrate with an image generation service
    // For now, return a placeholder
    return `https://cvplus-app.web.app/api/preview/${userId}/${template}.png`;
  }

  /**
   * Verify social profile ownership
   */
  async verifySocialProfile(
    userId: string,
    platform: string,
    verificationCode: string
  ): Promise<boolean> {
    // Implementation would vary by platform
    // This is a simplified version
    const verification = await this.db
      .collection('social_verifications')
      .where('userId', '==', userId)
      .where('platform', '==', platform)
      .where('code', '==', verificationCode)
      .limit(1)
      .get();

    if (!verification.empty) {
      await this.db
        .collection('users')
        .doc(userId)
        .collection('social_profiles')
        .doc(platform)
        .update({ verified: true });
      
      return true;
    }

    return false;
  }

  /**
   * Create shareable short link
   */
  async createShortLink(longUrl: string): Promise<string> {
    // This would integrate with a URL shortening service
    // For now, return a placeholder
    const shortId = Math.random().toString(36).substring(7);
    
    await this.db.collection('short_links').doc(shortId).set({
      longUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      clicks: 0
    });

    return `https://cvpl.us/${shortId}`;
  }

  /**
   * Get platform-specific profile URL format
   */
  getPlatformUrlFormat(platform: string): string {
    const formats: Record<string, string> = {
      linkedin: 'https://linkedin.com/in/{username}',
      twitter: 'https://twitter.com/{username}',
      github: 'https://github.com/{username}',
      instagram: 'https://instagram.com/{username}',
      facebook: 'https://facebook.com/{username}'
    };

    return formats[platform] || '';
  }
}

export const socialSharingService = new SocialSharingService();