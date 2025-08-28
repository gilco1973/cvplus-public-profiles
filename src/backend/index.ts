/**
 * CVPlus Public Profiles Backend Functions
 * 
 * This module exports Firebase Cloud Functions for public profile functionality.
 */

// Public Profile Functions
export {
  createPublicProfile,
  getPublicProfile,
  updatePublicProfileSettings,
  submitContactForm,
  trackQRScan,
  testEmailConfiguration
} from './functions/profile.functions';

// Web Portal Functions
export {
  generateWebPortal,
  getPortalStatus,
  updatePortalPreferences,
  retryPortalGeneration,
  getUserPortalPreferences,
  listUserPortals
} from './functions/portal.functions';

// Social Media Integration Functions
export {
  generateSocialMediaIntegration,
  addSocialProfile,
  updateSocialProfile,
  removeSocialProfile,
  trackSocialClick,
  getSocialAnalytics,
  updateSocialDisplaySettings
} from './functions/social.functions';

// Testimonials Functions
export {
  generateTestimonialsCarousel,
  addTestimonial,
  updateTestimonial,
  removeTestimonial,
  updateCarouselLayout
} from './functions/testimonials.functions';