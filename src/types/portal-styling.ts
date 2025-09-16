// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * Portal Styling Types
 *
 * Styling configuration types for portal theming and layout.
 *
 * @author Gil Klainert
 * @version 1.0.0
 */

/**
 * Color scheme configuration
 */
export interface ColorScheme {
  /** Primary brand color */
  primary: string;

  /** Secondary accent color */
  secondary: string;

  /** Background color */
  background: string;

  /** Surface color for cards/components */
  surface: string;

  /** Primary text color */
  textPrimary: string;

  /** Secondary text color */
  textSecondary: string;

  /** Border color */
  border: string;

  /** Success color for positive actions */
  success: string;

  /** Warning color for cautions */
  warning: string;

  /** Error color for errors */
  error: string;

  /** Gradient configurations */
  gradients?: {
    primary: string;
    secondary: string;
    hero: string;
  };
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  /** Font family for headings */
  headingFontFamily: string;

  /** Font family for body text */
  bodyFontFamily: string;

  /** Base font size */
  baseFontSize: string;

  /** Font weight scale */
  fontWeights: {
    light: number;
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };

  /** Line height settings */
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };

  /** Font size scale */
  fontSizes?: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };

  /** Letter spacing settings */
  letterSpacing?: {
    tight: string;
    normal: string;
    wide: string;
  };
}

/**
 * Portal layout configuration
 */
export interface PortalLayout {
  /** Enable sidebar */
  sidebar: boolean;

  /** Navigation type */
  navigation: 'top' | 'side' | 'both';

  /** Sections to include */
  sections: string[];

  /** Layout grid settings */
  grid?: GridConfig;

  /** Container settings */
  container?: ContainerConfig;

  /** Responsive breakpoints */
  breakpoints?: BreakpointConfig;
}

/**
 * Grid configuration
 */
export interface GridConfig {
  /** Number of columns */
  columns: number;

  /** Grid gap */
  gap: string;

  /** Auto-fit columns */
  autoFit: boolean;

  /** Minimum column width */
  minColumnWidth?: string;
}

/**
 * Container configuration
 */
export interface ContainerConfig {
  /** Maximum width */
  maxWidth: string;

  /** Padding */
  padding: string;

  /** Margin */
  margin: string;

  /** Center container */
  centered: boolean;
}

/**
 * Responsive breakpoint configuration
 */
export interface BreakpointConfig {
  /** Mobile breakpoint */
  mobile: string;

  /** Tablet breakpoint */
  tablet: string;

  /** Desktop breakpoint */
  desktop: string;

  /** Large desktop breakpoint */
  large: string;
}

/**
 * Component visibility settings
 */
export interface ComponentVisibility {
  /** Show header */
  header: boolean;

  /** Show footer */
  footer: boolean;

  /** Show sidebar */
  sidebar: boolean;

  /** Show chat widget */
  chat: boolean;

  /** Show analytics */
  analytics: boolean;

  /** Show navigation */
  navigation: boolean;

  /** Show search */
  search: boolean;

  /** Show social links */
  socialLinks: boolean;

  /** Show contact form */
  contactForm: boolean;
}

/**
 * Template-specific styling
 */
export interface TemplateStyling {
  /** Border radius for components */
  borderRadius: string;

  /** Enable shadows */
  shadows: boolean;

  /** Enable animations */
  animations: boolean;

  /** Animation duration */
  animationDuration?: string;

  /** Animation timing function */
  animationTimingFunction?: string;

  /** Custom CSS variables */
  cssVariables?: Record<string, string>;

  /** Component-specific styles */
  componentStyles?: ComponentStyleConfig;
}

/**
 * Component style configuration
 */
export interface ComponentStyleConfig {
  /** Button styles */
  button?: ButtonStyleConfig;

  /** Card styles */
  card?: CardStyleConfig;

  /** Input styles */
  input?: InputStyleConfig;

  /** Navigation styles */
  navigation?: NavigationStyleConfig;
}

/**
 * Button style configuration
 */
export interface ButtonStyleConfig {
  /** Border radius */
  borderRadius: string;

  /** Padding */
  padding: string;

  /** Font weight */
  fontWeight: number;

  /** Text transform */
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

  /** Hover effects */
  hoverEffects: boolean;

  /** Shadow settings */
  shadow?: ShadowConfig;
}

/**
 * Card style configuration
 */
export interface CardStyleConfig {
  /** Background color */
  backgroundColor: string;

  /** Border radius */
  borderRadius: string;

  /** Padding */
  padding: string;

  /** Shadow settings */
  shadow?: ShadowConfig;

  /** Border settings */
  border?: BorderConfig;
}

/**
 * Input style configuration
 */
export interface InputStyleConfig {
  /** Border radius */
  borderRadius: string;

  /** Padding */
  padding: string;

  /** Border settings */
  border?: BorderConfig;

  /** Focus effects */
  focusEffects: boolean;

  /** Placeholder styling */
  placeholder?: PlaceholderConfig;
}

/**
 * Navigation style configuration
 */
export interface NavigationStyleConfig {
  /** Background color */
  backgroundColor: string;

  /** Text color */
  textColor: string;

  /** Active link color */
  activeLinkColor: string;

  /** Hover effects */
  hoverEffects: boolean;

  /** Spacing between items */
  itemSpacing: string;
}

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  /** Enable shadow */
  enabled: boolean;

  /** Shadow color */
  color: string;

  /** Shadow blur */
  blur: string;

  /** Shadow spread */
  spread: string;

  /** Shadow offset X */
  offsetX: string;

  /** Shadow offset Y */
  offsetY: string;
}

/**
 * Border configuration
 */
export interface BorderConfig {
  /** Border width */
  width: string;

  /** Border style */
  style: 'solid' | 'dashed' | 'dotted' | 'none';

  /** Border color */
  color: string;

  /** Border radius */
  radius?: string;
}

/**
 * Placeholder styling configuration
 */
export interface PlaceholderConfig {
  /** Text color */
  color: string;

  /** Font style */
  fontStyle: 'normal' | 'italic';

  /** Opacity */
  opacity: number;
}