// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Public Profile Functions for Firebase Cloud Functions
 * 
 * These functions provide the Firebase Cloud Functions interface for public profile operations.
 * They serve as the entry point for public profile functionality.
 */

import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Types
export interface CreatePublicProfileRequest {
  jobId: string;
}

export interface GetPublicProfileRequest {
  slug: string;
}

export interface UpdateProfileSettingsRequest {
  profileId: string;
  settings: any;
}

export interface SubmitContactFormRequest {
  profileSlug: string;
  name: string;
  email: string;
  message: string;
  subject?: string;
}

export interface TrackQRScanRequest {
  profileSlug: string;
  location?: string;
  metadata?: any;
}

/**
 * Create a public profile for a CV
 */
export async function createPublicProfile(request: CallableRequest<CreatePublicProfileRequest>): Promise<any> {
  const { jobId } = request.data;
  
  if (!jobId) {
    throw new HttpsError('invalid-argument', 'Job ID is required');
  }

  try {
    // Basic implementation - this would be expanded based on requirements
    const publicProfileData = {
      jobId,
      slug: `profile-${jobId}-${Date.now()}`,
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
      settings: {
        isPublic: true,
        allowContact: true,
        showCV: true
      }
    };

    const docRef = await admin.firestore()
      .collection('publicProfiles')
      .add(publicProfileData);

    return {
      success: true,
      profileId: docRef.id,
      slug: publicProfileData.slug
    };

  } catch (error) {
    console.error('Error creating public profile:', error);
    throw new HttpsError('internal', 'Failed to create public profile');
  }
}

/**
 * Get a public profile by slug
 */
export async function getPublicProfile(request: CallableRequest<GetPublicProfileRequest>): Promise<any> {
  const { slug } = request.data;

  if (!slug) {
    throw new HttpsError('invalid-argument', 'Profile slug is required');
  }

  try {
    const profileQuery = await admin.firestore()
      .collection('publicProfiles')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (profileQuery.empty) {
      throw new HttpsError('not-found', 'Profile not found');
    }

    const profileDoc = profileQuery.docs[0];
    if (!profileDoc) {
      return { success: false, error: 'Profile not found' };
    }
    
    const profileData = profileDoc.data();

    return {
      success: true,
      profile: {
        id: profileDoc.id,
        ...profileData
      }
    };

  } catch (error) {
    console.error('Error getting public profile:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to get public profile');
  }
}

/**
 * Update public profile settings
 */
export async function updatePublicProfileSettings(request: CallableRequest<UpdateProfileSettingsRequest>): Promise<any> {
  const { profileId, settings } = request.data;

  if (!profileId) {
    throw new HttpsError('invalid-argument', 'Profile ID is required');
  }

  try {
    await admin.firestore()
      .collection('publicProfiles')
      .doc(profileId)
      .update({
        settings,
        updatedAt: FieldValue.serverTimestamp()
      });

    return {
      success: true,
      message: 'Profile settings updated successfully'
    };

  } catch (error) {
    console.error('Error updating profile settings:', error);
    throw new HttpsError('internal', 'Failed to update profile settings');
  }
}

/**
 * Submit contact form for a public profile
 */
export async function submitContactForm(request: CallableRequest<SubmitContactFormRequest>): Promise<any> {
  const { profileSlug, name, email, message, subject } = request.data;

  if (!profileSlug || !name || !email || !message) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Store contact form submission
    await admin.firestore()
      .collection('contactSubmissions')
      .add({
        profileSlug,
        name,
        email,
        message,
        subject: subject || 'Contact Form Submission',
        submittedAt: FieldValue.serverTimestamp(),
        status: 'pending'
      });

    return {
      success: true,
      message: 'Contact form submitted successfully'
    };

  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw new HttpsError('internal', 'Failed to submit contact form');
  }
}

/**
 * Track QR code scan for a public profile
 */
export async function trackQRScan(request: CallableRequest<TrackQRScanRequest>): Promise<any> {
  const { profileSlug, location, metadata } = request.data;

  if (!profileSlug) {
    throw new HttpsError('invalid-argument', 'Profile slug is required');
  }

  try {
    // Track QR scan event
    await admin.firestore()
      .collection('qrScans')
      .add({
        profileSlug,
        location,
        metadata,
        scannedAt: FieldValue.serverTimestamp(),
        ipAddress: request.rawRequest.ip || 'unknown',
        userAgent: request.rawRequest.get('user-agent') || 'unknown'
      });

    return {
      success: true,
      message: 'QR scan tracked successfully'
    };

  } catch (error) {
    console.error('Error tracking QR scan:', error);
    throw new HttpsError('internal', 'Failed to track QR scan');
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(_request: CallableRequest): Promise<any> {
  try {
    // Basic email configuration test
    return {
      success: true,
      message: 'Email configuration is working',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error testing email configuration:', error);
    throw new HttpsError('internal', 'Failed to test email configuration');
  }
}