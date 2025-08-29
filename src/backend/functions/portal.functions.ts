/**
 * Web Portal Functions for Firebase Cloud Functions
 * 
 * These functions handle web portal generation and management for public profiles.
 */

import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Types
export interface GenerateWebPortalRequest {
  jobId: string;
  options?: {
    theme?: string;
    includeCV?: boolean;
    includePortfolio?: boolean;
    customDomain?: string;
  };
}

export interface PortalStatusRequest {
  portalId: string;
}

export interface UpdatePortalPreferencesRequest {
  portalId: string;
  preferences: any;
}

/**
 * Generate a web portal for a CV
 */
export async function generateWebPortal(request: CallableRequest<GenerateWebPortalRequest>): Promise<any> {
  const { jobId, options } = request.data;

  if (!jobId) {
    throw new HttpsError('invalid-argument', 'Job ID is required');
  }

  try {
    // Create portal generation job
    const portalData = {
      jobId,
      status: 'generating',
      createdAt: FieldValue.serverTimestamp(),
      options: options || {},
      progress: {
        currentStep: 'initializing',
        completedSteps: [],
        totalSteps: 5
      }
    };

    const docRef = await admin.firestore()
      .collection('webPortals')
      .add(portalData);

    return {
      success: true,
      portalId: docRef.id,
      status: 'generating',
      message: 'Web portal generation started'
    };

  } catch (error) {
    console.error('Error generating web portal:', error);
    throw new HttpsError('internal', 'Failed to generate web portal');
  }
}

/**
 * Get portal generation status
 */
export async function getPortalStatus(request: CallableRequest<PortalStatusRequest>): Promise<any> {
  const { portalId } = request.data;

  if (!portalId) {
    throw new HttpsError('invalid-argument', 'Portal ID is required');
  }

  try {
    const portalDoc = await admin.firestore()
      .collection('webPortals')
      .doc(portalId)
      .get();

    if (!portalDoc.exists) {
      throw new HttpsError('not-found', 'Portal not found');
    }

    const portalData = portalDoc.data();

    return {
      success: true,
      portal: {
        id: portalDoc.id,
        ...portalData
      }
    };

  } catch (error) {
    console.error('Error getting portal status:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to get portal status');
  }
}

/**
 * Update portal preferences
 */
export async function updatePortalPreferences(request: CallableRequest<UpdatePortalPreferencesRequest>): Promise<any> {
  const { portalId, preferences } = request.data;

  if (!portalId) {
    throw new HttpsError('invalid-argument', 'Portal ID is required');
  }

  try {
    await admin.firestore()
      .collection('webPortals')
      .doc(portalId)
      .update({
        preferences,
        updatedAt: FieldValue.serverTimestamp()
      });

    return {
      success: true,
      message: 'Portal preferences updated successfully'
    };

  } catch (error) {
    console.error('Error updating portal preferences:', error);
    throw new HttpsError('internal', 'Failed to update portal preferences');
  }
}

/**
 * Retry portal generation
 */
export async function retryPortalGeneration(request: CallableRequest<PortalStatusRequest>): Promise<any> {
  const { portalId } = request.data;

  if (!portalId) {
    throw new HttpsError('invalid-argument', 'Portal ID is required');
  }

  try {
    await admin.firestore()
      .collection('webPortals')
      .doc(portalId)
      .update({
        status: 'generating',
        retriedAt: FieldValue.serverTimestamp(),
        progress: {
          currentStep: 'initializing',
          completedSteps: [],
          totalSteps: 5
        }
      });

    return {
      success: true,
      message: 'Portal generation restarted'
    };

  } catch (error) {
    console.error('Error retrying portal generation:', error);
    throw new HttpsError('internal', 'Failed to retry portal generation');
  }
}

/**
 * Get user portal preferences
 */
export async function getUserPortalPreferences(_request: CallableRequest): Promise<any> {
  try {
    // This would typically get user-specific preferences
    // For now, returning default preferences
    const defaultPreferences = {
      theme: 'professional',
      includeCV: true,
      includePortfolio: true,
      showContact: true,
      showSocial: true
    };

    return {
      success: true,
      preferences: defaultPreferences
    };

  } catch (error) {
    console.error('Error getting user portal preferences:', error);
    throw new HttpsError('internal', 'Failed to get user portal preferences');
  }
}

/**
 * List user portals
 */
export async function listUserPortals(_request: CallableRequest): Promise<any> {
  try {
    // This would typically list portals for the authenticated user
    // For now, returning empty array
    return {
      success: true,
      portals: [],
      total: 0
    };

  } catch (error) {
    console.error('Error listing user portals:', error);
    throw new HttpsError('internal', 'Failed to list user portals');
  }
}