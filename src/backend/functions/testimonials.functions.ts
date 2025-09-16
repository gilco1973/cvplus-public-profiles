// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Testimonials Functions for Firebase Cloud Functions
 * 
 * These functions handle testimonials and testimonials carousel for public profiles.
 */

import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Types
export interface GenerateTestimonialsCarouselRequest {
  profileId: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  maxTestimonials?: number;
}

export interface TestimonialRequest {
  profileId: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  authorImage?: string;
  testimonialText: string;
  rating?: number;
}

export interface UpdateTestimonialRequest extends TestimonialRequest {
  testimonialId: string;
}

export interface RemoveTestimonialRequest {
  testimonialId: string;
}

export interface UpdateCarouselLayoutRequest {
  profileId: string;
  layout: {
    style: 'horizontal' | 'vertical' | 'grid';
    autoPlay?: boolean;
    showRatings?: boolean;
    showAuthorImages?: boolean;
    maxVisible?: number;
  };
}

/**
 * Generate testimonials carousel for a profile
 */
export async function generateTestimonialsCarousel(request: CallableRequest<GenerateTestimonialsCarouselRequest>): Promise<any> {
  const { profileId, layout = 'horizontal', maxTestimonials = 10 } = request.data;

  if (!profileId) {
    throw new HttpsError('invalid-argument', 'Profile ID is required');
  }

  try {
    const carouselData = {
      profileId,
      layout,
      maxTestimonials,
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
      settings: {
        autoPlay: true,
        showRatings: true,
        showAuthorImages: true,
        transitionSpeed: 3000
      }
    };

    const docRef = await admin.firestore()
      .collection('testimonialsCarousels')
      .add(carouselData);

    return {
      success: true,
      carouselId: docRef.id,
      layout,
      message: 'Testimonials carousel created successfully'
    };

  } catch (error) {
    console.error('Error generating testimonials carousel:', error);
    throw new HttpsError('internal', 'Failed to generate testimonials carousel');
  }
}

/**
 * Add a testimonial to a profile
 */
export async function addTestimonial(request: CallableRequest<TestimonialRequest>): Promise<any> {
  const { profileId, authorName, authorTitle, authorCompany, authorImage, testimonialText, rating } = request.data;

  if (!profileId || !authorName || !testimonialText) {
    throw new HttpsError('invalid-argument', 'Profile ID, author name, and testimonial text are required');
  }

  try {
    const testimonialData = {
      profileId,
      authorName,
      authorTitle: authorTitle || '',
      authorCompany: authorCompany || '',
      authorImage: authorImage || '',
      testimonialText,
      rating: rating || 5,
      addedAt: FieldValue.serverTimestamp(),
      isActive: true,
      isApproved: false, // Testimonials need approval
      views: 0
    };

    const docRef = await admin.firestore()
      .collection('testimonials')
      .add(testimonialData);

    return {
      success: true,
      testimonialId: docRef.id,
      message: 'Testimonial added successfully. Pending approval.'
    };

  } catch (error) {
    console.error('Error adding testimonial:', error);
    throw new HttpsError('internal', 'Failed to add testimonial');
  }
}

/**
 * Update a testimonial
 */
export async function updateTestimonial(request: CallableRequest<UpdateTestimonialRequest>): Promise<any> {
  const { testimonialId, authorName, authorTitle, authorCompany, authorImage, testimonialText, rating } = request.data;

  if (!testimonialId) {
    throw new HttpsError('invalid-argument', 'Testimonial ID is required');
  }

  try {
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
      isApproved: false // Re-approval needed after updates
    };

    if (authorName) updateData.authorName = authorName;
    if (authorTitle !== undefined) updateData.authorTitle = authorTitle;
    if (authorCompany !== undefined) updateData.authorCompany = authorCompany;
    if (authorImage !== undefined) updateData.authorImage = authorImage;
    if (testimonialText) updateData.testimonialText = testimonialText;
    if (rating !== undefined) updateData.rating = rating;

    await admin.firestore()
      .collection('testimonials')
      .doc(testimonialId)
      .update(updateData);

    return {
      success: true,
      message: 'Testimonial updated successfully. Pending approval.'
    };

  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw new HttpsError('internal', 'Failed to update testimonial');
  }
}

/**
 * Remove a testimonial
 */
export async function removeTestimonial(request: CallableRequest<RemoveTestimonialRequest>): Promise<any> {
  const { testimonialId } = request.data;

  if (!testimonialId) {
    throw new HttpsError('invalid-argument', 'Testimonial ID is required');
  }

  try {
    await admin.firestore()
      .collection('testimonials')
      .doc(testimonialId)
      .update({
        isActive: false,
        removedAt: FieldValue.serverTimestamp()
      });

    return {
      success: true,
      message: 'Testimonial removed successfully'
    };

  } catch (error) {
    console.error('Error removing testimonial:', error);
    throw new HttpsError('internal', 'Failed to remove testimonial');
  }
}

/**
 * Update carousel layout and settings
 */
export async function updateCarouselLayout(request: CallableRequest<UpdateCarouselLayoutRequest>): Promise<any> {
  const { profileId, layout } = request.data;

  if (!profileId || !layout) {
    throw new HttpsError('invalid-argument', 'Profile ID and layout are required');
  }

  try {
    // Find the carousel for this profile
    const carouselQuery = await admin.firestore()
      .collection('testimonialsCarousels')
      .where('profileId', '==', profileId)
      .limit(1)
      .get();

    if (carouselQuery.empty) {
      throw new HttpsError('not-found', 'Testimonials carousel not found for profile');
    }

    const carouselDoc = carouselQuery.docs[0];
    if (carouselDoc) {
      const carouselData = carouselDoc.data();
      await carouselDoc.ref.update({
        layout: layout.style,
        settings: {
          ...carouselData.settings,
          autoPlay: layout.autoPlay !== undefined ? layout.autoPlay : carouselData.settings.autoPlay,
          showRatings: layout.showRatings !== undefined ? layout.showRatings : carouselData.settings.showRatings,
          showAuthorImages: layout.showAuthorImages !== undefined ? layout.showAuthorImages : carouselData.settings.showAuthorImages,
          maxVisible: layout.maxVisible || carouselData.settings.maxVisible || 3
        },
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    return {
      success: true,
      message: 'Carousel layout updated successfully'
    };

  } catch (error) {
    console.error('Error updating carousel layout:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update carousel layout');
  }
}

/**
 * Get testimonials for a profile (helper function)
 */
export async function getProfileTestimonials(profileId: string): Promise<any> {
  try {
    const testimonialsQuery = await admin.firestore()
      .collection('testimonials')
      .where('profileId', '==', profileId)
      .where('isActive', '==', true)
      .where('isApproved', '==', true)
      .orderBy('addedAt', 'desc')
      .get();

    const testimonials = testimonialsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      testimonials,
      total: testimonials.length
    };

  } catch (error) {
    console.error('Error getting profile testimonials:', error);
    throw new HttpsError('internal', 'Failed to get profile testimonials');
  }
}

/**
 * Approve a testimonial (admin function)
 */
export async function approveTestimonial(testimonialId: string): Promise<any> {
  try {
    await admin.firestore()
      .collection('testimonials')
      .doc(testimonialId)
      .update({
        isApproved: true,
        approvedAt: FieldValue.serverTimestamp()
      });

    return {
      success: true,
      message: 'Testimonial approved successfully'
    };

  } catch (error) {
    console.error('Error approving testimonial:', error);
    throw new HttpsError('internal', 'Failed to approve testimonial');
  }
}