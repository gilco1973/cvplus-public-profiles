// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Contract Test: POST /profile/public
 *
 * Tests the public profile creation endpoint following TDD principles.
 * This test MUST FAIL initially (RED phase), then pass after implementation (GREEN phase).
 *
 * @fileoverview Contract test for public profile creation endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

// Local imports from public-profiles submodule
import {
  PROFILE_CONSTANTS,
  API_CONSTANTS
} from '../../constants';
import type {
  PublicProfileData,
  ProfileTemplate,
  SocialLinks,
  ContactFormSettings
} from '../../types';
import {
  TEST_JOB_IDS,
  TEST_TOKENS,
  ERROR_CODES,
  INVALID_TEST_DATA,
  createTestProfileData,
  createValidSocialLinks,
  expectValidProfileResponse,
  expectValidationError,
  getAvailableThemes,
  getAvailableVisibility
} from '../utils';

// Test configuration
const API_BASE_URL = process.env.VITE_FIREBASE_FUNCTION_URL || 'http://localhost:5001';
const TEST_TIMEOUT = 30000;

// Mock authentication token (in real implementation, would be Firebase Auth)
const authToken = TEST_TOKENS.VALID;

describe('Contract Test: POST /profile/public', () => {
  beforeAll(() => {
    // Configure axios defaults for tests
    axios.defaults.timeout = TEST_TIMEOUT;
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  });

  describe('Success Cases', () => {
    it('should return 201 with public profile created', async () => {
      const requestData = createTestProfileData({
        settings: {
          customUrl: 'john-doe-portfolio'
        },
        personalInfo: {
          displayName: 'John Doe',
          tagline: 'Full Stack Developer & UI/UX Designer',
          bio: 'Passionate developer with 5+ years of experience building scalable web applications.'
        },
        contactInfo: {
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          website: 'https://johndoe.dev',
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe'
        }
      });

      // This MUST fail initially (TDD Red phase)
      const response = await axios.post(`${API_BASE_URL}/profile/public`, requestData);

      expectValidProfileResponse(response, TEST_JOB_IDS.VALID);
      expect(response.data.publicUrl).toContain('john-doe-portfolio');
    }, TEST_TIMEOUT);

    it('should handle different themes', async () => {
      const themes = getAvailableThemes();

      for (const theme of themes) {
        const requestData = createTestProfileData({
          settings: {
            customUrl: `test-${theme}-theme`,
            theme: theme
          },
          personalInfo: {
            displayName: 'Test User',
            tagline: 'Testing themes'
          }
        });

        const response = await axios.post(`${API_BASE_URL}/profile/public`, requestData);

        expectValidProfileResponse(response, TEST_JOB_IDS.VALID);
        expect(response.data.settings.theme).toBe(theme);
      }
    }, TEST_TIMEOUT);

    it('should handle different visibility options', async () => {
      const visibilityOptions = getAvailableVisibility();

      for (const visibility of visibilityOptions) {
        const requestData = createTestProfileData({
          settings: {
            visibility: visibility,
            customUrl: `test-${visibility}-profile`
          },
          personalInfo: {
            displayName: 'Test User'
          }
        });

        const response = await axios.post(`${API_BASE_URL}/profile/public`, requestData);

        expectValidProfileResponse(response, TEST_JOB_IDS.VALID);
        expect(response.data.settings.visibility).toBe(visibility);
      }
    }, TEST_TIMEOUT);

    it('should generate custom URL when not provided', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        settings: {
          visibility: PROFILE_CONSTANTS.VISIBILITY_LEVELS.PUBLIC,
          theme: PROFILE_CONSTANTS.TEMPLATES.PROFESSIONAL
        },
        personalInfo: {
          displayName: 'Jane Smith',
          tagline: 'Data Scientist'
        }
      };

      const response = await axios.post(`${API_BASE_URL}/profile/public`, requestData);

      expect(response.status).toBe(API_CONSTANTS.RESPONSE_CODES.CREATED);
      expect(response.data.publicUrl).toMatch(/jane-smith/);
    }, TEST_TIMEOUT);

    it('should accept minimal configuration', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'Minimal User'
        }
      };

      const response = await axios.post(`${API_BASE_URL}/profile/public`, requestData);

      expect(response.status).toBe(API_CONSTANTS.RESPONSE_CODES.CREATED);
      expect(response.data.profileId).toBeDefined();
      // Should apply defaults
      expect(response.data.settings.visibility).toBe(PROFILE_CONSTANTS.VISIBILITY_LEVELS.PUBLIC);
      expect(response.data.settings.theme).toBe(PROFILE_CONSTANTS.TEMPLATES.PROFESSIONAL);
    }, TEST_TIMEOUT);

    it('should handle social media links', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'Social Media User'
        },
        contactInfo: {
          email: 'user@example.com',
          linkedin: 'https://linkedin.com/in/user',
          github: 'https://github.com/user',
          twitter: 'https://twitter.com/user',
          instagram: 'https://instagram.com/user',
          behance: 'https://behance.net/user',
          dribbble: 'https://dribbble.com/user'
        },
        settings: {
          includeSocialMedia: true
        }
      };

      const response = await axios.post(`${API_BASE_URL}/profile/public`, requestData);

      expect(response.status).toBe(API_CONSTANTS.RESPONSE_CODES.CREATED);
      expect(response.data.profileId).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Validation Error Cases', () => {
    it('should return 400 for missing jobId', async () => {
      const requestData = {
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.MISSING_REQUIRED_FIELD,
            message: expect.stringContaining('jobId')
          }
        }
      });
    });

    it('should return 400 for missing displayName', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          tagline: 'Developer without a name'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.MISSING_REQUIRED_FIELD,
            message: expect.stringContaining('displayName')
          }
        }
      });
    });

    it('should return 400 for invalid jobId format', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.INVALID_FORMAT,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.INVALID_JOB_ID_FORMAT,
            message: expect.stringContaining('UUID')
          }
        }
      });
    });

    it('should return 404 for non-existent job', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.NON_EXISTENT,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.NOT_FOUND,
          data: {
            error: ERROR_CODES.JOB_NOT_FOUND,
            message: expect.stringContaining('not found')
          }
        }
      });
    });

    it('should return 400 for invalid theme', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        settings: {
          theme: 'invalid_theme'
        },
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.INVALID_THEME,
            message: expect.stringContaining('theme')
          }
        }
      });
    });

    it('should return 400 for invalid visibility option', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        settings: {
          visibility: 'invalid_visibility'
        },
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.INVALID_VISIBILITY_OPTION,
            message: expect.stringContaining('visibility')
          }
        }
      });
    });

    it('should return 400 for invalid email format', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe'
        },
        contactInfo: {
          email: INVALID_TEST_DATA.EMAIL
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.INVALID_EMAIL_FORMAT,
            message: expect.stringContaining('email')
          }
        }
      });
    });

    it('should return 400 for invalid URL format', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe'
        },
        contactInfo: {
          website: INVALID_TEST_DATA.URL
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.INVALID_URL_FORMAT,
            message: expect.stringContaining('URL')
          }
        }
      });
    });

    it('should return 409 for duplicate customUrl', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        settings: {
          customUrl: 'existing-profile-url'
        },
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      // First request should succeed
      const firstResponse = await axios.post(`${API_BASE_URL}/profile/public`, requestData);
      expect(firstResponse.status).toBe(API_CONSTANTS.RESPONSE_CODES.CREATED);

      // Second request with same URL should fail
      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, {
          ...requestData,
          jobId: TEST_JOB_IDS.PROCESSING
        })
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.CONFLICT,
          data: {
            error: ERROR_CODES.CUSTOM_URL_ALREADY_EXISTS,
            message: expect.stringContaining('already taken')
          }
        }
      });
    });
  });

  describe('Job Status Validation', () => {
    it('should return 409 for incomplete CV job', async () => {
      const processingJobId = TEST_JOB_IDS.PROCESSING;

      const requestData = {
        jobId: processingJobId,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.CONFLICT,
          data: {
            error: ERROR_CODES.JOB_NOT_COMPLETED,
            message: expect.stringContaining('must be completed')
          }
        }
      });
    });

    it('should return 409 for failed CV job', async () => {
      const failedJobId = TEST_JOB_IDS.FAILED;

      const requestData = {
        jobId: failedJobId,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.CONFLICT,
          data: {
            error: ERROR_CODES.JOB_FAILED,
            message: expect.stringContaining('failed')
          }
        }
      });
    });

    it('should return 409 if public profile already exists for job', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      // First request should succeed
      const firstResponse = await axios.post(`${API_BASE_URL}/profile/public`, requestData);
      expect(firstResponse.status).toBe(API_CONSTANTS.RESPONSE_CODES.CREATED);

      // Second request should fail (profile already exists)
      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.CONFLICT,
          data: {
            error: ERROR_CODES.PROFILE_ALREADY_EXISTS,
            message: expect.stringContaining('already exists')
          }
        }
      });
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 for missing authentication', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData, {
          headers: {}
        })
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.UNAUTHORIZED,
          data: {
            error: ERROR_CODES.UNAUTHORIZED,
            message: expect.stringContaining('Authentication')
          }
        }
      });
    });

    it('should return 401 for invalid token', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData, {
          headers: { Authorization: 'Bearer invalid-token' }
        })
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.UNAUTHORIZED,
          data: {
            error: ERROR_CODES.UNAUTHORIZED,
            message: expect.stringContaining('token')
          }
        }
      });
    });

    it('should return 403 for jobs owned by other users', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData, {
          headers: { Authorization: 'Bearer different-user-token' }
        })
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.FORBIDDEN,
          data: {
            error: ERROR_CODES.ACCESS_DENIED,
            message: expect.stringContaining('permission')
          }
        }
      });
    });
  });

  describe('Method Validation', () => {
    it('should return 405 for unsupported methods', async () => {
      await expect(
        axios.get(`${API_BASE_URL}/profile/public`)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.METHOD_NOT_ALLOWED,
          data: {
            error: ERROR_CODES.METHOD_NOT_ALLOWED,
            message: expect.stringContaining('POST')
          }
        }
      });
    });

    it('should handle OPTIONS preflight request', async () => {
      const response = await axios.options(`${API_BASE_URL}/profile/public`);

      expect(response.status).toBe(API_CONSTANTS.RESPONSE_CODES.SUCCESS);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Content Validation', () => {
    it('should validate bio length', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe',
          bio: INVALID_TEST_DATA.LONG_BIO
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.BIO_TOO_LONG,
            message: expect.stringContaining(`${PROFILE_CONSTANTS.MAX_SUMMARY_LENGTH} characters`)
          }
        }
      });
    });

    it('should validate tagline length', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        personalInfo: {
          displayName: 'John Doe',
          tagline: INVALID_TEST_DATA.LONG_TAGLINE
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.TAGLINE_TOO_LONG,
            message: expect.stringContaining(`${PROFILE_CONSTANTS.MAX_HEADLINE_LENGTH} characters`)
          }
        }
      });
    });

    it('should validate customUrl format', async () => {
      const requestData = {
        jobId: TEST_JOB_IDS.VALID,
        settings: {
          customUrl: INVALID_TEST_DATA.CUSTOM_URL
        },
        personalInfo: {
          displayName: 'John Doe'
        }
      };

      await expect(
        axios.post(`${API_BASE_URL}/profile/public`, requestData)
      ).rejects.toMatchObject({
        response: {
          status: API_CONSTANTS.RESPONSE_CODES.BAD_REQUEST,
          data: {
            error: ERROR_CODES.INVALID_CUSTOM_URL_FORMAT,
            message: expect.stringContaining('alphanumeric')
          }
        }
      });
    });
  });
});