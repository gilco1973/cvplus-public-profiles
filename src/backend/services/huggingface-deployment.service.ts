// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * HuggingFace Deployment Service
 * 
 * Comprehensive service for deploying web portals to HuggingFace Spaces.
 * Handles Space creation, repository setup, file deployment, and monitoring.
 * 
 * Features:
 * - Multiple deployment types (Gradio, Streamlit, Docker, Static)
 * - Space creation and management
 * - Repository file operations (Git-based)
 * - Configuration and environment variables
 * - Status monitoring and health checks
 * - Comprehensive error handling and retry logic
 * 
 * @author Gil Klainert
 * @created 2025-08-19
 * @version 1.0
 */

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';

// Import types
import {
  HuggingFaceSpaceConfig,
  HuggingFaceSDK,
  HuggingFaceVisibility,
  HuggingFaceHardware,
  RepositoryFile,
  FileType,
  PortalConfig,
  PortalError,
  PortalErrorCode,
  ErrorCategory
} from '../types/portal';

/**
 * HuggingFace API configuration
 */
interface HuggingFaceAPIConfig {
  baseURL: string;
  token: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Space creation request
 */
interface CreateSpaceRequest {
  id: string;
  sdk: HuggingFaceSDK;
  private: boolean;
  hardware?: HuggingFaceHardware;
  storageType?: 'small' | 'medium' | 'large';
  secrets?: Record<string, string>;
  variables?: Record<string, string>;
}

/**
 * Space creation response
 */
interface CreateSpaceResponse {
  id: string;
  name: string;
  url: string;
  sha: string;
  runtime: {
    stage: 'NO_APP_FILE' | 'CONFIG_ERROR' | 'BUILDING' | 'BUILD_ERROR' | 'RUNNING' | 'RUNTIME_ERROR' | 'PAUSED';
    hardware: string;
    status: 'starting' | 'running' | 'error' | 'paused';
  };
  sdk: string;
  private: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * File upload request
 */
interface FileUploadRequest {
  files: Array<{
    path: string;
    content: string | Buffer;
    encoding?: 'utf-8' | 'base64';
  }>;
  commitMessage: string;
  branch?: string;
}

/**
 * Space status response
 */
interface SpaceStatusResponse {
  id: string;
  runtime: {
    stage: string;
    hardware: string;
    status: string;
    errorMessage?: string;
    logs?: string[];
  };
  lastModified: string;
  sha: string;
}

/**
 * Deployment result
 */
interface DeploymentResult {
  success: boolean;
  spaceId?: string;
  spaceUrl?: string;
  apiUrl?: string;
  status?: string;
  error?: string;
  metadata?: {
    buildTime?: string;
    deploymentTime?: number;
    filesUploaded?: number;
    spaceName?: string;
    sdk?: string;
    hardware?: string;
  };
}

/**
 * File map for easier file management
 */
interface FileMap {
  [path: string]: {
    content: string | Buffer;
    type: FileType;
    required: boolean;
  };
}

/**
 * Space availability check result
 */
interface SpaceAvailabilityResult {
  available: boolean;
  suggestion?: string;
  error?: string;
}

export class HuggingFaceDeploymentService {
  private db = admin.firestore();
  private storage = admin.storage();
  private apiConfig: HuggingFaceAPIConfig;

  // Default configuration
  private readonly DEFAULT_CONFIG: Partial<HuggingFaceAPIConfig> = {
    baseURL: 'https://huggingface.co/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000
  };

  // Template configurations for different deployment types
  private readonly DEPLOYMENT_TEMPLATES = {
    [HuggingFaceSDK.GRADIO]: {
      type: 'python' as const,
      appFile: 'app.py',
      requirementsFile: 'requirements.txt',
      configFile: 'config.yml',
      defaultRequirements: [
        'gradio>=4.0.0',
        'anthropic>=0.8.0',
        'python-dotenv>=1.0.0',
        'requests>=2.31.0'
      ]
    },
    [HuggingFaceSDK.STREAMLIT]: {
      type: 'python' as const,
      appFile: 'streamlit_app.py',
      requirementsFile: 'requirements.txt',
      configFile: '.streamlit/config.toml',
      defaultRequirements: [
        'streamlit>=1.28.0',
        'anthropic>=0.8.0',
        'python-dotenv>=1.0.0',
        'requests>=2.31.0'
      ]
    },
    [HuggingFaceSDK.DOCKER]: {
      type: 'docker' as const,
      appFile: 'app.py',
      dockerFile: 'Dockerfile',
      requirementsFile: 'requirements.txt',
      defaultRequirements: [
        'fastapi>=0.104.0',
        'uvicorn>=0.24.0',
        'anthropic>=0.8.0',
        'python-dotenv>=1.0.0'
      ]
    },
    [HuggingFaceSDK.STATIC]: {
      type: 'static' as const,
      indexFile: 'index.html',
      stylesFile: 'style.css',
      scriptFile: 'script.js'
    }
  };

  constructor() {
    const token = process.env.HUGGINGFACE_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
    
    if (!token) {
      logger.warn('[HUGGINGFACE-SERVICE] No HuggingFace API token found in environment variables');
    }

    this.apiConfig = {
      ...this.DEFAULT_CONFIG,
      token: token || '',
      baseURL: process.env.HUGGINGFACE_API_URL || this.DEFAULT_CONFIG.baseURL!,
      timeout: parseInt(process.env.HUGGINGFACE_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.HUGGINGFACE_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.HUGGINGFACE_RETRY_DELAY || '2000')
    } as HuggingFaceAPIConfig;

    logger.info('[HUGGINGFACE-SERVICE] HuggingFace Deployment Service initialized', {
      hasToken: !!this.apiConfig.token,
      baseURL: this.apiConfig.baseURL
    });
  }

  /**
   * Create a new HuggingFace Space
   */
  async createSpace(config: HuggingFaceSpaceConfig): Promise<DeploymentResult> {
    logger.info('[HUGGINGFACE-SERVICE] Creating HuggingFace Space', {
      spaceName: config.spaceName,
      sdk: config.sdk,
      visibility: config.visibility
    });

    try {
      // Validate space name availability
      const availabilityCheck = await this.validateSpaceAvailability(config.spaceName);
      if (!availabilityCheck.available) {
        throw new Error(`Space name "${config.spaceName}" is not available. ${availabilityCheck.suggestion || ''}`);
      }

      const createRequest: CreateSpaceRequest = {
        id: config.spaceName,
        sdk: config.sdk,
        private: config.visibility === HuggingFaceVisibility.PRIVATE,
        hardware: config.hardware,
        secrets: this.prepareSecrets(config.environmentVariables),
        variables: this.prepareVariables(config.environmentVariables)
      };

      const response = await this.makeAPIRequest<CreateSpaceResponse>('POST', '/spaces', createRequest);

      logger.info('[HUGGINGFACE-SERVICE] Space created successfully', {
        spaceId: response.id,
        spaceUrl: response.url,
        status: response.runtime.status
      });

      return {
        success: true,
        spaceId: response.id,
        spaceUrl: response.url,
        apiUrl: `${response.url}/api`,
        status: response.runtime.status,
        metadata: {
          spaceName: response.name,
          sdk: response.sdk,
          hardware: response.runtime.hardware,
          deploymentTime: Date.now()
        }
      };

    } catch (error) {
      logger.error('[HUGGINGFACE-SERVICE] Failed to create Space', {
        spaceName: config.spaceName,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during Space creation'
      };
    }
  }

  /**
   * Deploy portal to existing HuggingFace Space
   */
  async deployPortal(portalData: PortalConfig, spaceConfig: HuggingFaceSpaceConfig): Promise<DeploymentResult> {
    logger.info('[HUGGINGFACE-SERVICE] Deploying portal to HuggingFace Space', {
      spaceName: spaceConfig.spaceName,
      portalId: portalData.id
    });

    const startTime = Date.now();

    try {
      // Step 1: Generate portal files based on template and data
      const files = await this.generatePortalFiles(portalData, spaceConfig);
      
      // Step 2: Upload files to Space repository
      const uploadResult = await this.uploadFiles(spaceConfig.spaceName, files);
      
      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.error}`);
      }

      // Step 3: Update Space configuration if needed
      await this.updateSpace(spaceConfig.spaceName, {
        secrets: this.prepareSecrets(spaceConfig.environmentVariables),
        variables: this.prepareVariables(spaceConfig.environmentVariables)
      });

      // Step 4: Monitor deployment status
      const statusResult = await this.monitorDeployment(spaceConfig.spaceName);
      
      const deploymentTime = Date.now() - startTime;

      logger.info('[HUGGINGFACE-SERVICE] Portal deployment completed', {
        spaceName: spaceConfig.spaceName,
        deploymentTimeMs: deploymentTime,
        status: statusResult.status
      });

      return {
        success: true,
        spaceId: spaceConfig.spaceName,
        spaceUrl: `https://huggingface.co/spaces/${spaceConfig.spaceName}`,
        apiUrl: `https://${spaceConfig.spaceName}.hf.space`,
        status: statusResult.status,
        metadata: {
          deploymentTime,
          filesUploaded: Object.keys(files).length,
          spaceName: spaceConfig.spaceName,
          sdk: spaceConfig.sdk,
          buildTime: statusResult.buildTime
        }
      };

    } catch (error) {
      logger.error('[HUGGINGFACE-SERVICE] Portal deployment failed', {
        spaceName: spaceConfig.spaceName,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during portal deployment'
      };
    }
  }

  /**
   * Upload files to HuggingFace Space repository
   */
  async uploadFiles(spaceId: string, files: FileMap): Promise<{ success: boolean; error?: string; filesUploaded?: number }> {
    logger.info('[HUGGINGFACE-SERVICE] Uploading files to Space', {
      spaceId,
      fileCount: Object.keys(files).length
    });

    try {
      // Prepare files for upload
      const uploadFiles = Object.entries(files).map(([path, fileData]) => ({
        path,
        content: typeof fileData.content === 'string' ? fileData.content : fileData.content.toString('base64'),
        encoding: typeof fileData.content === 'string' ? 'utf-8' as const : 'base64' as const
      }));

      const uploadRequest: FileUploadRequest = {
        files: uploadFiles,
        commitMessage: 'Deploy CVPlus portal',
        branch: 'main'
      };

      // Split large uploads into batches to avoid API limits
      const batchSize = 10;
      const batches = this.chunkArray(uploadFiles, batchSize);
      let totalUploaded = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(`[HUGGINGFACE-SERVICE] Uploading batch ${i + 1}/${batches.length}`, {
          filesInBatch: batch.length
        });

        const batchRequest = {
          ...uploadRequest,
          files: batch,
          commitMessage: `Deploy CVPlus portal (batch ${i + 1}/${batches.length})`
        };

        await this.makeAPIRequest('POST', `/spaces/${spaceId}/commit`, batchRequest);
        totalUploaded += batch.length;

        // Add delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('[HUGGINGFACE-SERVICE] Files uploaded successfully', {
        spaceId,
        filesUploaded: totalUploaded
      });

      return {
        success: true,
        filesUploaded: totalUploaded
      };

    } catch (error) {
      logger.error('[HUGGINGFACE-SERVICE] File upload failed', {
        spaceId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during file upload'
      };
    }
  }

  /**
   * Update HuggingFace Space configuration
   */
  async updateSpace(spaceId: string, updates: {
    secrets?: Record<string, string>;
    variables?: Record<string, string>;
    hardware?: HuggingFaceHardware;
    visibility?: HuggingFaceVisibility;
  }): Promise<{ success: boolean; error?: string }> {
    logger.info('[HUGGINGFACE-SERVICE] Updating Space configuration', {
      spaceId,
      updates: Object.keys(updates)
    });

    try {
      // Update secrets if provided
      if (updates.secrets) {
        for (const [key, value] of Object.entries(updates.secrets)) {
          await this.makeAPIRequest('POST', `/spaces/${spaceId}/secrets`, {
            key,
            value
          });
        }
      }

      // Update environment variables if provided
      if (updates.variables) {
        for (const [key, value] of Object.entries(updates.variables)) {
          await this.makeAPIRequest('POST', `/spaces/${spaceId}/variables`, {
            key,
            value
          });
        }
      }

      // Update hardware if provided
      if (updates.hardware) {
        await this.makeAPIRequest('POST', `/spaces/${spaceId}/hardware`, {
          flavor: updates.hardware
        });
      }

      // Update visibility if provided
      if (updates.visibility !== undefined) {
        await this.makeAPIRequest('PATCH', `/spaces/${spaceId}`, {
          private: updates.visibility === HuggingFaceVisibility.PRIVATE
        });
      }

      logger.info('[HUGGINGFACE-SERVICE] Space configuration updated successfully', { spaceId });

      return { success: true };

    } catch (error) {
      logger.error('[HUGGINGFACE-SERVICE] Failed to update Space configuration', {
        spaceId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during Space update'
      };
    }
  }

  /**
   * Get HuggingFace Space status
   */
  async getSpaceStatus(spaceId: string): Promise<{ 
    success: boolean; 
    status?: string; 
    stage?: string;
    error?: string; 
    errorMessage?: string;
    buildTime?: string;
    logs?: string[];
  }> {
    try {
      const response = await this.makeAPIRequest<SpaceStatusResponse>('GET', `/spaces/${spaceId}`);

      return {
        success: true,
        status: response.runtime.status,
        stage: response.runtime.stage,
        errorMessage: response.runtime.errorMessage,
        logs: response.runtime.logs
      };

    } catch (error) {
      logger.error('[HUGGINGFACE-SERVICE] Failed to get Space status', {
        spaceId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while checking Space status'
      };
    }
  }

  /**
   * Generate unique Space name
   */
  generateSpaceName(userName: string, suffix?: string): string {
    // Sanitize user name
    const sanitized = userName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20); // HuggingFace has length limits

    // Add suffix or timestamp
    const uniqueSuffix = suffix || Date.now().toString().slice(-6);
    const spaceName = `${sanitized}-cv-portal-${uniqueSuffix}`;

    // Ensure it meets HuggingFace naming requirements
    if (spaceName.length > 50) {
      return `${sanitized.substring(0, 30)}-cv-${uniqueSuffix}`;
    }

    return spaceName;
  }

  /**
   * Validate Space name availability
   */
  async validateSpaceAvailability(spaceName: string): Promise<SpaceAvailabilityResult> {
    try {
      // Check if space already exists
      const response = await this.makeAPIRequest('GET', `/spaces/${spaceName}`, null, false);
      
      if (response) {
        // Space exists, suggest alternative
        const timestamp = Date.now().toString().slice(-4);
        return {
          available: false,
          suggestion: `${spaceName}-${timestamp}`
        };
      }

      return { available: true };

    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        // Space doesn't exist, it's available
        return { available: true };
      }

      logger.warn('[HUGGINGFACE-SERVICE] Could not validate space availability', {
        spaceName,
        error: error instanceof Error ? error.message : String(error)
      });

      // Assume available if we can't check
      return { available: true };
    }
  }

  // ============================================================================
  // TYPE GUARDS
  // ============================================================================
  
  /**
   * Type guard for Python-based templates (Gradio/Streamlit)
   */
  private isPythonTemplate(template: any): template is {
    type: 'python';
    appFile: string;
    requirementsFile: string;
    configFile: string;
    defaultRequirements: string[];
  } {
    return template.type === 'python';
  }
  
  /**
   * Type guard for Docker-based templates
   */
  private isDockerTemplate(template: any): template is {
    type: 'docker';
    appFile: string;
    dockerFile: string;
    requirementsFile: string;
    defaultRequirements: string[];
  } {
    return template.type === 'docker';
  }
  
  /**
   * Type guard for Static templates
   */
  private isStaticTemplate(template: any): template is {
    type: 'static';
    indexFile: string;
    stylesFile: string;
    scriptFile: string;
  } {
    return template.type === 'static';
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate portal files based on template and configuration
   */
  private async generatePortalFiles(portalData: PortalConfig, spaceConfig: HuggingFaceSpaceConfig): Promise<FileMap> {
    logger.info('[HUGGINGFACE-SERVICE] Generating portal files', {
      sdk: spaceConfig.sdk,
      templateId: portalData.template?.id
    });

    const files: FileMap = {};
    const template = this.DEPLOYMENT_TEMPLATES[spaceConfig.sdk];

    switch (spaceConfig.sdk) {
      case HuggingFaceSDK.GRADIO:
        if (this.isPythonTemplate(template)) {
          files[template.appFile] = {
            content: this.generateGradioApp(portalData),
            type: FileType.JAVASCRIPT,
            required: true
          };
          files[template.requirementsFile] = {
            content: template.defaultRequirements.join('\n'),
            type: FileType.CONFIG,
            required: true
          };
        }
        break;

      case HuggingFaceSDK.STREAMLIT:
        if (this.isPythonTemplate(template)) {
          files[template.appFile] = {
            content: this.generateStreamlitApp(portalData),
            type: FileType.JAVASCRIPT,
            required: true
          };
          files[template.requirementsFile] = {
            content: template.defaultRequirements.join('\n'),
            type: FileType.CONFIG,
            required: true
          };
        }
        break;

      case HuggingFaceSDK.DOCKER:
        if (this.isDockerTemplate(template)) {
          files[template.appFile] = {
            content: this.generateFastAPIApp(portalData),
            type: FileType.JAVASCRIPT,
            required: true
          };
          files[template.dockerFile] = {
            content: this.generateDockerfile(),
            type: FileType.CONFIG,
            required: true
          };
          files[template.requirementsFile] = {
            content: template.defaultRequirements.join('\n'),
            type: FileType.CONFIG,
            required: true
          };
        }
        break;

      case HuggingFaceSDK.STATIC:
        if (this.isStaticTemplate(template)) {
          files[template.indexFile] = {
            content: this.generateStaticHTML(portalData),
            type: FileType.HTML,
            required: true
          };
          files[template.stylesFile] = {
            content: this.generateStaticCSS(portalData),
            type: FileType.CSS,
            required: true
          };
          files[template.scriptFile] = {
            content: this.generateStaticJS(portalData),
            type: FileType.JAVASCRIPT,
            required: true
          };
        }
        break;
    }

    // Add README file
    files['README.md'] = {
      content: this.generateReadme(portalData, spaceConfig),
      type: FileType.MARKDOWN,
      required: false
    };

    // Add .gitignore if applicable
    if (spaceConfig.sdk !== HuggingFaceSDK.STATIC) {
      files['.gitignore'] = {
        content: this.generateGitignore(),
        type: FileType.CONFIG,
        required: false
      };
    }

    return files;
  }

  /**
   * Generate Gradio application code
   */
  private generateGradioApp(portalData: PortalConfig): string {
    const personalInfo = portalData.customization?.personalInfo || {};
    const name = personalInfo.name || 'Professional';

    return `import gradio as gr
import os
from anthropic import Anthropic
import json

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Portal data (simplified for demo)
PORTAL_DATA = {
    "name": "${name}",
    "title": "${personalInfo.title || 'Professional'}",
    "summary": "${personalInfo.summary || 'Professional summary not available'}",
    "contact": "${personalInfo.email || 'Contact information available on request'}"
}

def chat_with_ai(message, history):
    """Handle chat messages with AI assistant"""
    try:
        # Build context from portal data
        context = f"""You are an AI assistant representing {PORTAL_DATA['name']}.
        
Professional Information:
- Name: {PORTAL_DATA['name']}
- Title: {PORTAL_DATA['title']}
- Summary: {PORTAL_DATA['summary']}

Please answer questions about this professional's background and experience.
Be helpful and conversational."""

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0.7,
            system=context,
            messages=[{"role": "user", "content": message}]
        )
        
        return response.content[0].text
        
    except Exception as e:
        return f"I'm sorry, I'm experiencing technical difficulties. Please try again later. Error: {str(e)}"

def get_contact_info():
    """Return contact information"""
    return f"""
    ## Contact Information
    
    **Name:** {PORTAL_DATA['name']}
    **Title:** {PORTAL_DATA['title']}
    **Contact:** {PORTAL_DATA['contact']}
    
    Feel free to reach out for professional opportunities or collaborations.
    """

def get_portfolio():
    """Return portfolio information"""
    return f"""
    ## Professional Portfolio
    
    **{PORTAL_DATA['name']}**
    
    {PORTAL_DATA['summary']}
    
    This is an AI-powered professional portal. You can chat with me to learn more about my background and experience.
    """

# Create Gradio interface
with gr.Blocks(title="${name} - Professional Portal", theme=gr.themes.Soft()) as app:
    gr.Markdown(f"# {PORTAL_DATA['name']} - Professional Portal")
    gr.Markdown(f"*{PORTAL_DATA['title']}*")
    
    with gr.Tabs():
        with gr.TabItem("🏠 About"):
            gr.Markdown(get_portfolio())
        
        with gr.TabItem("💬 Chat with AI"):
            gr.Markdown("Ask me anything about my professional background!")
            chatbot = gr.Chatbot(height=400)
            msg = gr.Textbox(
                placeholder="Ask about my experience, skills, or background...",
                label="Your message"
            )
            clear = gr.Button("Clear Chat")
            
            msg.submit(chat_with_ai, [msg, chatbot], [chatbot])
            clear.click(lambda: None, None, chatbot, queue=False)
        
        with gr.TabItem("📧 Contact"):
            gr.Markdown(get_contact_info())

if __name__ == "__main__":
    app.launch()`;
  }

  /**
   * Generate Streamlit application code
   */
  private generateStreamlitApp(portalData: PortalConfig): string {
    const personalInfo = portalData.customization?.personalInfo || {};
    const name = personalInfo.name || 'Professional';

    return `import streamlit as st
import os
from anthropic import Anthropic

# Page configuration
st.set_page_config(
    page_title="${name} - Professional Portal",
    page_icon="👤",
    layout="wide"
)

# Initialize Anthropic client
@st.cache_resource
def get_anthropic_client():
    return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

client = get_anthropic_client()

# Portal data
PORTAL_DATA = {
    "name": "${name}",
    "title": "${personalInfo.title || 'Professional'}",
    "summary": "${personalInfo.summary || 'Professional summary not available'}",
    "contact": "${personalInfo.email || 'Contact information available on request'}"
}

# Main app
def main():
    # Header
    st.title(f"🏠 {PORTAL_DATA['name']}")
    st.subheader(PORTAL_DATA['title'])
    
    # Sidebar navigation
    page = st.sidebar.selectbox(
        "Navigation",
        ["About", "AI Chat", "Contact"]
    )
    
    if page == "About":
        show_about()
    elif page == "AI Chat":
        show_chat()
    elif page == "Contact":
        show_contact()

def show_about():
    st.markdown("## About")
    st.markdown(PORTAL_DATA['summary'])
    st.markdown("---")
    st.markdown("This is an AI-powered professional portal. Use the AI Chat to learn more about my background and experience.")

def show_chat():
    st.markdown("## 💬 Chat with AI Assistant")
    st.markdown("Ask me anything about my professional background!")
    
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Ask about my experience, skills, or background..."):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Generate AI response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    context = f"""You are an AI assistant representing {PORTAL_DATA['name']}.
                    
Professional Information:
- Name: {PORTAL_DATA['name']}
- Title: {PORTAL_DATA['title']}
- Summary: {PORTAL_DATA['summary']}

Please answer questions about this professional's background and experience.
Be helpful and conversational."""

                    response = client.messages.create(
                        model="claude-3-haiku-20240307",
                        max_tokens=1000,
                        temperature=0.7,
                        system=context,
                        messages=[{"role": "user", "content": prompt}]
                    )
                    
                    assistant_response = response.content[0].text
                    st.markdown(assistant_response)
                    
                    # Add assistant response to chat history
                    st.session_state.messages.append({"role": "assistant", "content": assistant_response})
                    
                except Exception as e:
                    error_message = "I'm sorry, I'm experiencing technical difficulties. Please try again later."
                    st.error(error_message)
                    st.session_state.messages.append({"role": "assistant", "content": error_message})

def show_contact():
    st.markdown("## 📧 Contact Information")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown(f"**Name:** {PORTAL_DATA['name']}")
        st.markdown(f"**Title:** {PORTAL_DATA['title']}")
        st.markdown(f"**Contact:** {PORTAL_DATA['contact']}")
    
    with col2:
        st.markdown("Feel free to reach out for professional opportunities or collaborations.")

if __name__ == "__main__":
    main()`;
  }

  /**
   * Generate FastAPI application code for Docker deployment
   */
  private generateFastAPIApp(portalData: PortalConfig): string {
    const personalInfo = portalData.customization?.personalInfo || {};
    const name = personalInfo.name || 'Professional';

    return `from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import os
from anthropic import Anthropic
import uvicorn

# Initialize FastAPI app
app = FastAPI(title="${name} - Professional Portal")

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Portal data
PORTAL_DATA = {
    "name": "${name}",
    "title": "${personalInfo.title || 'Professional'}",
    "summary": "${personalInfo.summary || 'Professional summary not available'}",
    "contact": "${personalInfo.email || 'Contact information available on request'}"
}

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.get("/", response_class=HTMLResponse)
async def read_root():
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{PORTAL_DATA['name']} - Professional Portal</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
            .header {{ text-align: center; margin-bottom: 40px; }}
            .chat-container {{ max-width: 800px; margin: 0 auto; }}
            .chat-box {{ border: 1px solid #ddd; height: 400px; overflow-y: scroll; padding: 20px; margin-bottom: 20px; }}
            .input-container {{ display: flex; gap: 10px; }}
            .input-container input {{ flex: 1; padding: 10px; border: 1px solid #ddd; }}
            .input-container button {{ padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{PORTAL_DATA['name']}</h1>
            <h3>{PORTAL_DATA['title']}</h3>
            <p>{PORTAL_DATA['summary']}</p>
        </div>
        
        <div class="chat-container">
            <h3>💬 Chat with AI Assistant</h3>
            <div id="chatBox" class="chat-box"></div>
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Ask about my experience, skills, or background..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        
        <script>
            function handleKeyPress(event) {{
                if (event.key === 'Enter') sendMessage();
            }}
            
            async function sendMessage() {{
                const input = document.getElementById('messageInput');
                const message = input.value.trim();
                if (!message) return;
                
                const chatBox = document.getElementById('chatBox');
                
                // Add user message
                chatBox.innerHTML += '<div><strong>You:</strong> ' + message + '</div>';
                input.value = '';
                
                try {{
                    const response = await fetch('/chat', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{ message: message }})
                    }});
                    
                    const data = await response.json();
                    chatBox.innerHTML += '<div><strong>AI:</strong> ' + data.response + '</div>';
                }} catch (error) {{
                    chatBox.innerHTML += '<div><strong>AI:</strong> Sorry, I encountered an error. Please try again.</div>';
                }}
                
                chatBox.scrollTop = chatBox.scrollHeight;
            }}
        </script>
    </body>
    </html>
    """
    return html_content

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_message: ChatMessage):
    try:
        context = f"""You are an AI assistant representing {PORTAL_DATA['name']}.
        
Professional Information:
- Name: {PORTAL_DATA['name']}
- Title: {PORTAL_DATA['title']}
- Summary: {PORTAL_DATA['summary']}

Please answer questions about this professional's background and experience.
Be helpful and conversational."""

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0.7,
            system=context,
            messages=[{"role": "user", "content": chat_message.message}]
        )
        
        return ChatResponse(response=response.content[0].text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")

@app.get("/api/info")
async def get_info():
    return PORTAL_DATA

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)`;
  }

  /**
   * Generate static HTML
   */
  private generateStaticHTML(portalData: PortalConfig): string {
    const personalInfo = portalData.customization?.personalInfo || {};
    const name = personalInfo.name || 'Professional';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Professional Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="hero">
        <div class="container">
            <h1>${name}</h1>
            <p class="title">${personalInfo.title || 'Professional'}</p>
            <p class="summary">${personalInfo.summary || 'Professional summary not available'}</p>
        </div>
    </header>

    <main>
        <section class="about">
            <div class="container">
                <h2>About</h2>
                <p>Welcome to my professional portal. This is a static demonstration of a CVPlus-generated professional website.</p>
                <p>For the full interactive experience with AI chat capabilities, please use the Gradio or Streamlit versions.</p>
            </div>
        </section>

        <section class="contact">
            <div class="container">
                <h2>Contact</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Title:</strong> ${personalInfo.title || 'Professional'}</p>
                <p><strong>Contact:</strong> ${personalInfo.email || 'Contact information available on request'}</p>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2024 ${name}. Generated by CVPlus.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  }

  /**
   * Generate static CSS
   */
  private generateStaticCSS(portalData: PortalConfig): string {
    const colors = portalData.template?.theme?.colors || {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff',
      text: { primary: '#333333', secondary: '#666666', muted: '#999999' }
    };

    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: ${colors.text.primary};
    background-color: ${colors.background};
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.hero {
    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
    color: white;
    padding: 100px 0;
    text-align: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 10px;
    font-weight: bold;
}

.hero .title {
    font-size: 1.5rem;
    margin-bottom: 20px;
    opacity: 0.9;
}

.hero .summary {
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
    opacity: 0.8;
}

main {
    padding: 60px 0;
}

section {
    margin-bottom: 60px;
}

h2 {
    font-size: 2rem;
    margin-bottom: 30px;
    color: ${colors.primary};
    text-align: center;
}

.about p,
.contact p {
    font-size: 1.1rem;
    margin-bottom: 15px;
    text-align: center;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.contact {
    background-color: #f8f9fa;
    padding: 60px 0;
}

footer {
    background-color: ${colors.primary};
    color: white;
    text-align: center;
    padding: 30px 0;
}

@media (max-width: 768px) {
    .hero {
        padding: 60px 0;
    }
    
    .hero h1 {
        font-size: 2rem;
    }
    
    .hero .title {
        font-size: 1.2rem;
    }
    
    main {
        padding: 40px 0;
    }
}`;
  }

  /**
   * Generate static JavaScript
   */
  private generateStaticJS(portalData: PortalConfig): string {
    return `// Static portal JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Add smooth scrolling for any anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add fade-in animation for sections
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s, transform 0.6s';
        observer.observe(section);
    });
});`;
  }

  /**
   * Generate Dockerfile for Docker deployment
   */
  private generateDockerfile(): string {
    return `FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["python", "app.py"]`;
  }

  /**
   * Generate README file
   */
  private generateReadme(portalData: PortalConfig, spaceConfig: HuggingFaceSpaceConfig): string {
    const personalInfo = portalData.customization?.personalInfo || {};
    const name = personalInfo.name || 'Professional';

    return `# ${name} - Professional Portal

This is an AI-powered professional portal generated by [CVPlus](https://cvplus.com).

## Features

- 🤖 **AI Chat Assistant**: Interactive chat powered by Claude AI
- 📱 **Responsive Design**: Optimized for all devices
- 🎨 **Professional Theme**: Clean, modern design
- 📧 **Contact Information**: Easy access to professional details

## Technology Stack

- **Platform**: HuggingFace Spaces
- **Framework**: ${spaceConfig.sdk}
- **AI Model**: Claude AI (Anthropic)
- **Deployment**: ${spaceConfig.hardware}

## Usage

Visit this Space to:
1. Learn about ${name}'s professional background
2. Chat with an AI assistant about their experience and skills
3. Access contact information for professional opportunities

## About CVPlus

This portal was automatically generated by CVPlus, an AI-powered CV transformation platform that creates interactive, multimedia-rich professional profiles.

---

*Generated on ${new Date().toISOString().split('T')[0]} by CVPlus*`;
  }

  /**
   * Generate .gitignore file
   */
  private generateGitignore(): string {
    return `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env
.venv
pip-log.txt
pip-delete-this-directory.txt

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Local development
.env.local
config.local.yml`;
  }

  /**
   * Prepare secrets from environment variables
   */
  private prepareSecrets(environmentVariables: Record<string, string>): Record<string, string> {
    const secrets: Record<string, string> = {};
    
    // Filter out sensitive keys that should be secrets
    const sensitiveKeys = ['API_KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'PRIVATE'];
    
    Object.entries(environmentVariables).forEach(([key, value]) => {
      if (sensitiveKeys.some(sensitiveKey => key.toUpperCase().includes(sensitiveKey))) {
        secrets[key] = value;
      }
    });

    return secrets;
  }

  /**
   * Prepare public variables from environment variables
   */
  private prepareVariables(environmentVariables: Record<string, string>): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Filter out sensitive keys - these should not be public variables
    const sensitiveKeys = ['API_KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'PRIVATE'];
    
    Object.entries(environmentVariables).forEach(([key, value]) => {
      if (!sensitiveKeys.some(sensitiveKey => key.toUpperCase().includes(sensitiveKey))) {
        variables[key] = value;
      }
    });

    return variables;
  }

  /**
   * Monitor deployment status with retry logic
   */
  private async monitorDeployment(spaceId: string, maxAttempts = 30, intervalMs = 10000): Promise<{
    success: boolean;
    status?: string;
    buildTime?: string;
    error?: string;
  }> {
    logger.info('[HUGGINGFACE-SERVICE] Starting deployment monitoring', {
      spaceId,
      maxAttempts,
      intervalMs
    });

    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResult = await this.getSpaceStatus(spaceId);
        
        if (!statusResult.success) {
          throw new Error(statusResult.error || 'Failed to get Space status');
        }

        const { status, stage, errorMessage } = statusResult;
        
        logger.info(`[HUGGINGFACE-SERVICE] Deployment status check ${attempts + 1}/${maxAttempts}`, {
          spaceId,
          status,
          stage
        });

        // Check for completion
        if (status === 'running' && stage === 'RUNNING') {
          const buildTime = Math.round((Date.now() - startTime) / 1000);
          logger.info('[HUGGINGFACE-SERVICE] Deployment completed successfully', {
            spaceId,
            buildTimeSeconds: buildTime
          });

          return {
            success: true,
            status,
            buildTime: `${buildTime}s`
          };
        }

        // Check for errors
        if (status === 'error' || stage === 'BUILD_ERROR' || stage === 'RUNTIME_ERROR') {
          logger.error('[HUGGINGFACE-SERVICE] Deployment failed', {
            spaceId,
            status,
            stage,
            errorMessage
          });

          return {
            success: false,
            error: errorMessage || `Deployment failed with status: ${status}, stage: ${stage}`
          };
        }

        // Continue monitoring for other statuses (building, starting, etc.)
        attempts++;
        await new Promise(resolve => setTimeout(resolve, intervalMs));

      } catch (error) {
        logger.error(`[HUGGINGFACE-SERVICE] Error during deployment monitoring attempt ${attempts + 1}`, {
          spaceId,
          error: error instanceof Error ? error.message : String(error)
        });

        attempts++;
        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: `Deployment monitoring failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`
          };
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    return {
      success: false,
      error: `Deployment monitoring timed out after ${maxAttempts} attempts`
    };
  }

  /**
   * Make authenticated API request with retry logic
   */
  private async makeAPIRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    throwOnError = true
  ): Promise<T> {
    if (!this.apiConfig.token) {
      throw new Error('HuggingFace API token not configured');
    }

    const url = `${this.apiConfig.baseURL}${endpoint}`;
    let lastError: Error;

    for (let attempt = 1; attempt <= this.apiConfig.retryAttempts; attempt++) {
      try {
        logger.info(`[HUGGINGFACE-SERVICE] API request attempt ${attempt}/${this.apiConfig.retryAttempts}`, {
          method,
          endpoint,
          hasData: !!data
        });

        const response = await axios({
          method,
          url,
          data,
          headers: {
            'Authorization': `Bearer ${this.apiConfig.token}`,
            'Content-Type': 'application/json'
          },
          timeout: this.apiConfig.timeout
        });

        return response.data;

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const statusText = error.response?.statusText;
          const responseData = error.response?.data;

          logger.warn(`[HUGGINGFACE-SERVICE] API request failed (attempt ${attempt}/${this.apiConfig.retryAttempts})`, {
            method,
            endpoint,
            status,
            statusText,
            responseData,
            attempt
          });

          // Don't retry on authentication errors or client errors (4xx)
          if (status && status >= 400 && status < 500) {
            if (throwOnError) {
              throw new Error(`HuggingFace API error: ${status} ${statusText} - ${JSON.stringify(responseData)}`);
            }
            return responseData;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.apiConfig.retryAttempts) {
          const delay = this.apiConfig.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (throwOnError) {
      throw new Error(`HuggingFace API request failed after ${this.apiConfig.retryAttempts} attempts: ${lastError.message}`);
    }

    return null as T;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance
export const huggingFaceDeploymentService = new HuggingFaceDeploymentService();