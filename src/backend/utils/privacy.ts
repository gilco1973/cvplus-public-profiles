/**
 * Privacy utilities for PII masking
 */

import { ParsedCV } from '../types/job';
import { PrivacySettings } from '../types/enhanced-models';

/**
 * Mask PII in CV data based on privacy settings
 */
export function maskPII(cv: ParsedCV, settings: PrivacySettings): ParsedCV {
  const masked = JSON.parse(JSON.stringify(cv)); // Deep clone

  // Apply masking based on privacy settings
  // If contact info should not be shown, mask it
  if (!settings.showContactInfo && masked.personalInfo) {
    if (masked.personalInfo.name) {
      masked.personalInfo.name = maskName(masked.personalInfo.name);
    }
    
    if (masked.personalInfo.email) {
      masked.personalInfo.email = 'Contact via form';
    }

    if (masked.personalInfo.phone) {
      masked.personalInfo.phone = 'Available upon request';
    }

    if (masked.personalInfo.address) {
      masked.personalInfo.address = maskAddress(masked.personalInfo.address);
    }
  }

  // For basic privacy, mask sensitive employment details  
  if (!settings.showContactInfo && masked.experience) {
    masked.experience = masked.experience.map((exp: any) => ({
      ...exp,
      company: maskCompany(exp.company)
    }));
  }

  // Mask dates for enhanced privacy
  if (!settings.showContactInfo) {
    if (masked.experience) {
      masked.experience = masked.experience.map((exp: any) => ({
        ...exp,
        startDate: maskDate(exp.startDate),
        endDate: exp.endDate ? maskDate(exp.endDate) : undefined,
        duration: calculateDurationString(exp.startDate, exp.endDate)
      }));
    }

    if (masked.education) {
      masked.education = masked.education.map((edu: any) => ({
        ...edu,
        graduationDate: maskYear(edu.graduationDate)
      }));
    }
  }

  // Note: Custom masking rules not available in this privacy settings interface

  return masked;
}

/**
 * Mask a name while keeping initials
 */
function maskName(name: string): string {
  const parts = name.split(' ');
  if (parts.length === 1) {
    return `${parts[0][0]}${'*'.repeat(5)}`;
  }
  
  return parts.map(part => `${part[0]}${'*'.repeat(3)}`).join(' ');
}

/**
 * Mask address keeping only city/country
 */
function maskAddress(address: string): string {
  // Try to extract city and country
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Keep last two parts (usually city, country)
    return parts.slice(-2).join(', ');
  }
  return 'Location available upon request';
}

/**
 * Mask company name based on size/type
 */
function maskCompany(company: string): string {
  const lowerCompany = company.toLowerCase();
  
  // Don't mask well-known companies
  const wellKnownCompanies = [
    'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta',
    'netflix', 'tesla', 'uber', 'airbnb', 'twitter', 'linkedin'
  ];
  
  if (wellKnownCompanies.some(known => lowerCompany.includes(known))) {
    return company;
  }
  
  // For other companies, show type
  if (lowerCompany.includes('startup')) return 'Technology Startup';
  if (lowerCompany.includes('bank')) return 'Financial Institution';
  if (lowerCompany.includes('consult')) return 'Consulting Firm';
  if (lowerCompany.includes('agency')) return 'Digital Agency';
  
  return 'Fortune 500 Company';
}

/**
 * Mask specific dates but keep duration
 */
function maskDate(date: string): string {
  const year = new Date(date).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsAgo = currentYear - year;
  
  if (yearsAgo === 0) return 'Present';
  if (yearsAgo === 1) return '1 year ago';
  return `${yearsAgo} years ago`;
}

/**
 * Mask year to show relative time
 */
function maskYear(year: string): string {
  const numYear = parseInt(year);
  const currentYear = new Date().getFullYear();
  const diff = currentYear - numYear;
  
  if (diff <= 2) return 'Recent';
  if (diff <= 5) return '2-5 years ago';
  if (diff <= 10) return '5-10 years ago';
  return '10+ years ago';
}

/**
 * Calculate duration string from dates
 */
function calculateDurationString(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                 (end.getMonth() - start.getMonth());
  
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
}

/**
 * Check if data contains PII
 */
export function detectPII(text: string): {
  hasPII: boolean;
  types: string[];
} {
  const types: string[] = [];
  
  // Email pattern
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    types.push('email');
  }
  
  // Phone pattern (various formats)
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/.test(text)) {
    types.push('phone');
  }
  
  // SSN pattern
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
    types.push('ssn');
  }
  
  // Address patterns (street addresses)
  if (/\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/.test(text)) {
    types.push('address');
  }
  
  return {
    hasPII: types.length > 0,
    types
  };
}