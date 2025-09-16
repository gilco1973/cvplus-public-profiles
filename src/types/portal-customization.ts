// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Portal Customization Types
 *
 * User customization and branding types for portal configuration.
 *
 * @author Gil Klainert
 * @version 1.0.0
 */

/**
 * Portal SEO metadata
 */
export interface PortalSEOMetadata {
  /** Page title */
  title?: string;

  /** Meta description */
  description?: string;

  /** Keywords for SEO */
  keywords?: string[];

  /** Open Graph image URL */
  ogImage?: string;

  /** Twitter card type */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';

  /** Canonical URL */
  canonicalUrl?: string;

  /** Additional meta tags */
  additionalMeta?: MetaTag[];

  /** Schema.org structured data */
  structuredData?: Record<string, any>;
}

/**
 * Meta tag configuration
 */
export interface MetaTag {
  /** Meta tag name */
  name?: string;

  /** Meta tag property */
  property?: string;

  /** Meta tag content */
  content: string;

  /** Meta tag type */
  type?: 'name' | 'property' | 'http-equiv';
}

/**
 * Portal branding configuration
 */
export interface PortalBranding {
  /** Logo URL */
  logoUrl?: string;

  /** Favicon URL */
  faviconUrl?: string;

  /** Company/organization name */
  companyName?: string;

  /** Brand tagline */
  tagline?: string;

  /** Brand colors */
  brandColors?: BrandColorScheme;

  /** Custom fonts */
  customFonts?: CustomFontConfig[];

  /** Brand assets */
  assets?: BrandAsset[];
}

/**
 * Brand color scheme
 */
export interface BrandColorScheme {
  /** Primary brand color */
  primary: string;

  /** Secondary brand color */
  secondary: string;

  /** Accent color */
  accent: string;

  /** Neutral colors */
  neutral?: {
    light: string;
    medium: string;
    dark: string;
  };
}

/**
 * Custom font configuration
 */
export interface CustomFontConfig {
  /** Font family name */
  name: string;

  /** Font source URL or provider */
  source: string;

  /** Font weights available */
  weights: number[];

  /** Font styles available */
  styles: ('normal' | 'italic')[];

  /** Font display property */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

/**
 * Brand asset configuration
 */
export interface BrandAsset {
  /** Asset type */
  type: 'logo' | 'icon' | 'background' | 'pattern' | 'image';

  /** Asset name/identifier */
  name: string;

  /** Asset URL */
  url: string;

  /** Asset dimensions */
  dimensions?: {
    width: number;
    height: number;
  };

  /** Asset format */
  format: 'png' | 'jpg' | 'svg' | 'webp' | 'gif';

  /** Asset usage context */
  context?: string[];
}

/**
 * Header customization configuration
 */
export interface HeaderCustomization {
  /** Show logo in header */
  showLogo: boolean;

  /** Show navigation in header */
  showNavigation: boolean;

  /** Header background color */
  backgroundColor?: string;

  /** Header text color */
  textColor?: string;

  /** Header height */
  height?: string;

  /** Header padding */
  padding?: string;

  /** Header position */
  position?: 'static' | 'sticky' | 'fixed';

  /** Custom header content */
  customContent?: HeaderContent[];

  /** Header animation */
  animation?: AnimationConfig;
}

/**
 * Header content configuration
 */
export interface HeaderContent {
  /** Content type */
  type: 'text' | 'image' | 'link' | 'button' | 'custom';

  /** Content value */
  content: string;

  /** Content positioning */
  position: 'left' | 'center' | 'right';

  /** Content styling */
  styling?: ContentStyling;

  /** Content order */
  order: number;
}

/**
 * Footer customization configuration
 */
export interface FooterCustomization {
  /** Show social links in footer */
  showSocialLinks: boolean;

  /** Show contact information in footer */
  showContact: boolean;

  /** Footer background color */
  backgroundColor?: string;

  /** Footer text color */
  textColor?: string;

  /** Footer padding */
  padding?: string;

  /** Copyright text */
  copyright?: string;

  /** Custom footer content */
  customContent?: FooterContent[];

  /** Footer columns configuration */
  columns?: FooterColumn[];
}

/**
 * Footer content configuration
 */
export interface FooterContent {
  /** Content type */
  type: 'text' | 'link' | 'links' | 'custom';

  /** Content title */
  title?: string;

  /** Content value */
  content: string | string[];

  /** Content column */
  column: number;

  /** Content order within column */
  order: number;
}

/**
 * Footer column configuration
 */
export interface FooterColumn {
  /** Column identifier */
  id: number;

  /** Column title */
  title?: string;

  /** Column width */
  width?: string;

  /** Column alignment */
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Logo configuration
 */
export interface LogoConfiguration {
  /** Logo image URL */
  url: string;

  /** Logo width */
  width?: number;

  /** Logo height */
  height?: number;

  /** Logo alt text */
  alt?: string;

  /** Logo link URL */
  linkUrl?: string;

  /** Logo position */
  position?: 'left' | 'center' | 'right';

  /** Logo variants for different contexts */
  variants?: LogoVariant[];
}

/**
 * Logo variant configuration
 */
export interface LogoVariant {
  /** Variant name */
  name: string;

  /** Variant URL */
  url: string;

  /** Usage context */
  context: 'dark' | 'light' | 'mobile' | 'print' | 'favicon';

  /** Variant dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Social media links configuration
 */
export interface SocialLinks {
  /** LinkedIn profile URL */
  linkedin?: string;

  /** GitHub profile URL */
  github?: string;

  /** Twitter profile URL */
  twitter?: string;

  /** Personal website URL */
  website?: string;

  /** Email address */
  email?: string;

  /** Instagram profile URL */
  instagram?: string;

  /** Facebook profile URL */
  facebook?: string;

  /** YouTube channel URL */
  youtube?: string;

  /** Medium profile URL */
  medium?: string;

  /** Custom social links */
  custom?: CustomSocialLink[];
}

/**
 * Custom social link configuration
 */
export interface CustomSocialLink {
  /** Platform name */
  platform: string;

  /** Profile URL */
  url: string;

  /** Icon URL or identifier */
  icon?: string;

  /** Display name */
  displayName?: string;
}

/**
 * Contact information configuration
 */
export interface ContactInformation {
  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** Physical address */
  address?: AddressConfig;

  /** Website URL */
  website?: string;

  /** Additional contact methods */
  additional?: AdditionalContact[];

  /** Contact form configuration */
  contactForm?: ContactFormConfig;
}

/**
 * Address configuration
 */
export interface AddressConfig {
  /** Street address */
  street?: string;

  /** City */
  city?: string;

  /** State/Province */
  state?: string;

  /** Postal code */
  postalCode?: string;

  /** Country */
  country?: string;

  /** Full formatted address */
  formatted?: string;
}

/**
 * Additional contact method
 */
export interface AdditionalContact {
  /** Contact type */
  type: string;

  /** Contact label */
  label: string;

  /** Contact value */
  value: string;

  /** Contact icon */
  icon?: string;
}

/**
 * Contact form configuration
 */
export interface ContactFormConfig {
  /** Enable contact form */
  enabled: boolean;

  /** Form fields to include */
  fields: ContactFormField[];

  /** Form submission endpoint */
  endpoint?: string;

  /** Success message */
  successMessage?: string;

  /** Email notification settings */
  emailNotification?: EmailNotificationConfig;
}

/**
 * Contact form field configuration
 */
export interface ContactFormField {
  /** Field type */
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';

  /** Field name */
  name: string;

  /** Field label */
  label: string;

  /** Field placeholder */
  placeholder?: string;

  /** Field is required */
  required: boolean;

  /** Field validation rules */
  validation?: FieldValidationConfig;

  /** Field options (for select fields) */
  options?: string[];
}

/**
 * Field validation configuration
 */
export interface FieldValidationConfig {
  /** Minimum length */
  minLength?: number;

  /** Maximum length */
  maxLength?: number;

  /** Validation pattern (regex) */
  pattern?: string;

  /** Custom validation message */
  message?: string;
}

/**
 * Email notification configuration
 */
export interface EmailNotificationConfig {
  /** Notification recipient */
  recipient: string;

  /** Email subject template */
  subject: string;

  /** Email body template */
  template: string;

  /** Send confirmation to submitter */
  sendConfirmation: boolean;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Animation type */
  type: 'fade' | 'slide' | 'bounce' | 'scale' | 'rotate' | 'custom';

  /** Animation duration */
  duration: string;

  /** Animation delay */
  delay?: string;

  /** Animation timing function */
  timingFunction?: string;

  /** Animation iterations */
  iterations?: number | 'infinite';

  /** Animation direction */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

/**
 * Content styling configuration
 */
export interface ContentStyling {
  /** Font size */
  fontSize?: string;

  /** Font weight */
  fontWeight?: number;

  /** Text color */
  color?: string;

  /** Background color */
  backgroundColor?: string;

  /** Padding */
  padding?: string;

  /** Margin */
  margin?: string;

  /** Border radius */
  borderRadius?: string;

  /** Custom CSS properties */
  customCss?: Record<string, string>;
}