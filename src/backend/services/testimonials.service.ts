/**
 * Testimonials Service - Simplified Version
 * Manages testimonials with Firestore integration
 * Author: Gil Klainert
 * Date: 2025-08-22
 */

import * as admin from 'firebase-admin';
import { https } from 'firebase-functions';

interface Testimonial {
  id?: string;
  userId: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorImage?: string;
  authorLinkedIn?: string;
  content: string;
  rating?: number;
  relationship: 'colleague' | 'manager' | 'client' | 'partner' | 'other';
  projectName?: string;
  skills?: string[];
  date: string;
  verified: boolean;
  source: 'manual' | 'linkedin' | 'email';
  displayOrder?: number;
  isPublic: boolean;
}

export class TestimonialsService {
  private db = admin.firestore();

  async createTestimonial(testimonial: Testimonial): Promise<string> {
    try {
      this.validateTestimonial(testimonial);
      const testimonialDoc = {
        ...testimonial,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db
        .collection('users')
        .doc(testimonial.userId)
        .collection('testimonials')
        .add(testimonialDoc);

      if (testimonial.isPublic) {
        await this.db
          .collection('public_testimonials')
          .doc(docRef.id)
          .set({ ...testimonialDoc, testimonialId: docRef.id });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating testimonial:', error);
      throw new https.HttpsError('internal', 'Failed to create testimonial');
    }
  }

  async updateTestimonial(
    userId: string,
    testimonialId: string,
    updates: Partial<Testimonial>
  ): Promise<void> {
    const updateDoc = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await this.db
      .collection('users')
      .doc(userId)
      .collection('testimonials')
      .doc(testimonialId)
      .update(updateDoc);
  }

  async deleteTestimonial(userId: string, testimonialId: string): Promise<void> {
    await this.db
      .collection('users')
      .doc(userId)
      .collection('testimonials')
      .doc(testimonialId)
      .delete();

    await this.db
      .collection('public_testimonials')
      .doc(testimonialId)
      .delete();
  }

  async getUserTestimonials(
    userId: string,
    includePrivate = false
  ): Promise<Testimonial[]> {
    let query = this.db
      .collection('users')
      .doc(userId)
      .collection('testimonials')
      .orderBy('displayOrder', 'asc')
      .orderBy('createdAt', 'desc');

    if (!includePrivate) {
      query = query.where('isPublic', '==', true);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Testimonial));
  }

  async reorderTestimonials(
    userId: string,
    testimonialIds: string[]
  ): Promise<void> {
    const batch = this.db.batch();

    testimonialIds.forEach((id, index) => {
      const ref = this.db
        .collection('users')
        .doc(userId)
        .collection('testimonials')
        .doc(id);

      batch.update(ref, { displayOrder: index });
    });

    await batch.commit();
  }

  async getPublicTestimonials(userId: string): Promise<Testimonial[]> {
    const snapshot = await this.db
      .collection('public_testimonials')
      .where('userId', '==', userId)
      .where('isPublic', '==', true)
      .orderBy('displayOrder', 'asc')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Testimonial));
  }

  private validateTestimonial(testimonial: Testimonial): void {
    if (!testimonial.authorName?.trim()) {
      throw new https.HttpsError('invalid-argument', 'Author name is required');
    }
    if (!testimonial.content?.trim()) {
      throw new https.HttpsError('invalid-argument', 'Content is required');
    }
    if (testimonial.content.length > 1000) {
      throw new https.HttpsError('invalid-argument', 'Content too long (max 1000)');
    }
    if (testimonial.rating && (testimonial.rating < 1 || testimonial.rating > 5)) {
      throw new https.HttpsError('invalid-argument', 'Rating must be 1-5');
    }
  }

  async getTestimonialStats(userId: string) {
    const testimonials = await this.getUserTestimonials(userId, true);
    
    const stats = {
      total: testimonials.length,
      averageRating: 0,
      byRelationship: {} as Record<string, number>,
      topSkills: [] as string[]
    };

    if (testimonials.length === 0) return stats;

    const ratingsSum = testimonials
      .filter(t => t.rating)
      .reduce((sum, t) => sum + (t.rating || 0), 0);
    
    stats.averageRating = ratingsSum / testimonials.filter(t => t.rating).length || 0;

    testimonials.forEach(t => {
      stats.byRelationship[t.relationship] = 
        (stats.byRelationship[t.relationship] || 0) + 1;
    });

    const skillCounts: Record<string, number> = {};
    testimonials.forEach(t => {
      (t.skills || []).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    stats.topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);

    return stats;
  }
}

export const testimonialsService = new TestimonialsService();
