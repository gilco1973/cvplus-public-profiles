// @ts-ignore
/**
 * Portal Chat Function for CVPlus Web Portals
 * 
 * Handles real-time chat interactions for generated web portals deployed on HuggingFace Spaces.
 * Provides RAG-based chat functionality with context retrieval from CV data.
 * 
 * @author Gil Klainert
 * @created 2025-08-19
 * @version 1.0
  */

import { onCall, onRequest, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { verifiedClaudeService } from '../services/verified-claude.service';
import { embeddingService } from '../services/embedding.service';
import { enhancedDbService } from '../services/enhanced-db.service';
import { EnhancedJob, UserRAGProfile, ChatMessage } from '../types/enhanced-models';
import { PortalConfig, PortalStatus } from '../types/portal';
import { corsOptions, requestCorsOptions, addCorsHeaders } from '../config/cors';
import { withPremiumAccess } from '../middleware/premiumGuard';
import { nanoid } from 'nanoid';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Portal chat request interface
  */
interface PortalChatRequest {
  /** Portal ID  */
  portalId: string;
  /** User message  */
  message: string;
  /** Optional user ID for authenticated users  */
  userId?: string;
  /** Session ID for conversation tracking  */
  sessionId?: string;
  /** Visitor metadata  */
  visitorMetadata?: {
    userAgent?: string;
    referrer?: string;
    ipAddress?: string;
    location?: string;
  };
}

/**
 * Portal chat response interface
  */
interface PortalChatResponse {
  /** Success status  */
  success: boolean;
  /** AI response content  */
  response: {
    content: string;
    timestamp: Date;
    messageId: string;
    sources?: string[];
    confidence?: number;
  };
  /** Session information  */
  session: {
    sessionId: string;
    messageCount: number;
  };
  /** Suggested follow-up questions  */
  suggestedQuestions?: string[];
  /** Rate limiting information  */
  rateLimiting: {
    remaining: number;
    resetTime: Date;
  };
}

/**
 * Rate limiting configuration
  */
interface RateLimitConfig {
  /** Messages per minute per IP/session  */
  messagesPerMinute: number;
  /** Messages per hour per IP/session  */
  messagesPerHour: number;
  /** Maximum concurrent sessions per IP  */
  maxConcurrentSessions: number;
  /** Session timeout in minutes  */
  sessionTimeoutMinutes: number;
}

/**
 * Chat analytics data
  */
interface ChatAnalytics {
  /** Portal ID  */
  portalId: string;
  /** Session ID  */
  sessionId: string;
  /** Message count in session  */
  messageCount: number;
  /** Response time in milliseconds  */
  responseTime: number;
  /** User type  */
  userType: 'anonymous' | 'authenticated';
  /** Quality metrics  */
  quality: {
    confidence: number;
    sourceRelevance: number;
    userSatisfaction?: number;
  };
  /** Timestamp  */
  timestamp: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  messagesPerMinute: 10,
  messagesPerHour: 100,
  maxConcurrentSessions: 5,
  sessionTimeoutMinutes: 30
};

const CHAT_CONFIG = {
  maxMessageLength: 1000,
  maxResponseTokens: 800,
  temperature: 0.7,
  topK: 5, // Number of relevant chunks to retrieve
  confidenceThreshold: 0.3,
  systemPromptTemplate: `You are an AI assistant representing {name}'s professional profile. You have access to their complete CV information including experience, skills, education, achievements, and projects.

Your role is to:
- Answer questions about their professional background accurately
- Provide specific examples from their experience when relevant
- Maintain a {personality} tone throughout the conversation
- Only discuss information that's available in their CV
- Politely redirect off-topic questions back to their professional background

Remember:
- Be concise but informative
- Use specific details from their CV when answering
- If information isn't in the CV, say so politely
- Encourage meaningful professional conversations

Context from CV:
{context}`
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate chat message
  */
function validateChatMessage(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required and must be a string' };
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > CHAT_CONFIG.maxMessageLength) {
    return { valid: false, error: `Message too long (max ${CHAT_CONFIG.maxMessageLength} characters)` };
  }

  // Check for potential abuse patterns
  const suspiciousPatterns = [
    /ignore\s+(previous\s+)?instructions?/i,
    /system\s*:/i,
    /you\s+are\s+now/i,
    /forget\s+everything/i,
    /pretend\s+to\s+be/i,
    /(hack|exploit|attack)/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Message contains invalid content' };
    }
  }

  return { valid: true };
}

/**
 * Check rate limits
  */
async function checkRateLimit(
  sessionId: string, 
  ipAddress?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    // Query recent messages from this session/IP
    const recentMessagesQuery = admin.firestore()
      .collection('portalChatMessages')
      .where('sessionId', '==', sessionId)
      .where('timestamp', '>', oneMinuteAgo);

    const recentMessages = await recentMessagesQuery.get();
    const messagesLastMinute = recentMessages.size;

    // Check hourly limit
    const hourlyMessagesQuery = admin.firestore()
      .collection('portalChatMessages')
      .where('sessionId', '==', sessionId)
      .where('timestamp', '>', oneHourAgo);

    const hourlyMessages = await hourlyMessagesQuery.get();
    const messagesLastHour = hourlyMessages.size;

    const allowed = messagesLastMinute < RATE_LIMIT_CONFIG.messagesPerMinute && 
                   messagesLastHour < RATE_LIMIT_CONFIG.messagesPerHour;

    return {
      allowed,
      remaining: Math.max(0, RATE_LIMIT_CONFIG.messagesPerMinute - messagesLastMinute),
      resetTime: new Date(now.getTime() + 60 * 1000)
    };
  } catch (error) {
    logger.error('[PORTAL-CHAT] Rate limit check failed', { error, sessionId });
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.messagesPerMinute,
      resetTime: new Date(now.getTime() + 60 * 1000)
    };
  }
}

/**
 * Get or create chat session
  */
async function getOrCreateChatSession(
  portalId: string,
  sessionId?: string,
  userId?: string,
  visitorMetadata?: any
): Promise<string> {
  const actualSessionId = sessionId || nanoid();

  try {
    if (sessionId) {
      // Check if session exists and is valid
      const sessionDoc = await admin.firestore()
        .collection('portalChatSessions')
        .doc(sessionId)
        .get();

      if (sessionDoc.exists) {
        const sessionData = sessionDoc.data();
        const lastActivity = sessionData?.lastActivity?.toDate();
        const timeoutThreshold = new Date(Date.now() - RATE_LIMIT_CONFIG.sessionTimeoutMinutes * 60 * 1000);

        if (lastActivity && lastActivity > timeoutThreshold) {
          // Update last activity
          await sessionDoc.ref.update({
            lastActivity: new Date(),
            ...(userId && { userId })
          });
          return sessionId;
        }
      }
    }

    // Create new session
    const sessionData = {
      sessionId: actualSessionId,
      portalId,
      userId: userId || null,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      visitorMetadata: visitorMetadata || {},
      status: 'active'
    };

    await admin.firestore()
      .collection('portalChatSessions')
      .doc(actualSessionId)
      .set(sessionData);

    return actualSessionId;
  } catch (error) {
    logger.error('[PORTAL-CHAT] Session creation failed', { error, portalId });
    throw new Error('Failed to create chat session');
  }
}

/**
 * Get portal configuration and validate access
  */
async function getPortalConfig(portalId: string): Promise<{ portal: PortalConfig; job: EnhancedJob; ragProfile: UserRAGProfile }> {
  try {
    // Get portal configuration
    const portalDoc = await admin.firestore()
      .collection('portalConfigs')
      .doc(portalId)
      .get();

    if (!portalDoc.exists) {
      throw new HttpsError('not-found', 'Portal not found');
    }

    const portal = portalDoc.data() as PortalConfig;

    // Check if portal is active and chat is enabled
    if (portal.status !== PortalStatus.COMPLETED) {
      throw new HttpsError('failed-precondition', 'Portal is not active');
    }

    if (!portal.customization?.features?.chatbot) {
      throw new HttpsError('permission-denied', 'Chat is disabled for this portal');
    }

    // Get associated job
    const jobDoc = await admin.firestore()
      .collection('jobs')
      .doc(portal.jobId)
      .get();

    if (!jobDoc.exists) {
      throw new HttpsError('not-found', 'Associated CV not found');
    }

    const job = jobDoc.data() as EnhancedJob;

    // Get RAG profile
    const ragProfileDoc = await admin.firestore()
      .collection('ragProfiles')
      .doc(`${job.userId}_${portal.jobId}`)
      .get();

    if (!ragProfileDoc.exists || !job.ragChat?.enabled) {
      throw new HttpsError('failed-precondition', 'RAG system not available');
    }

    const ragProfile = ragProfileDoc.data() as UserRAGProfile;

    return { portal, job, ragProfile };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('[PORTAL-CHAT] Portal config retrieval failed', { error, portalId });
    throw new HttpsError('internal', 'Failed to retrieve portal configuration');
  }
}

/**
 * Generate AI response using RAG
  */
async function generateRAGResponse(
  message: string,
  job: EnhancedJob,
  ragProfile: UserRAGProfile,
  sessionId: string
): Promise<{ content: string; sources: string[]; confidence: number; processingTime: number }> {
  const startTime = Date.now();

  try {
    // 1. Retrieve relevant context from embeddings
    const relevantChunks = await embeddingService.querySimilarChunks(
      message,
      job.ragChat?.vectorNamespace || '',
      CHAT_CONFIG.topK
    );

    // 2. Build context from retrieved chunks
    const context = relevantChunks.length > 0
      ? relevantChunks.map((chunk, index) => 
          `[Source ${index + 1}]: ${chunk.metadata?.content || chunk.text}`
        ).join('\n\n')
      : 'No specific information found in the CV for this query.';

    // 3. Build system prompt
    const personalInfo = job.parsedData?.personalInfo || {};
    const systemPrompt = CHAT_CONFIG.systemPromptTemplate
      .replace('{name}', personalInfo.name || 'this professional')
      .replace('{personality}', ragProfile.settings.personality || 'professional')
      .replace('{context}', context);

    // 4. Generate response using Verified Claude
    const claudeResponse = await verifiedClaudeService.createVerifiedMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: CHAT_CONFIG.maxResponseTokens,
      temperature: CHAT_CONFIG.temperature,
      messages: [{ role: 'user', content: message }],
      system: systemPrompt,
      service: 'portal-chat',
      context: `Portal chat for ${personalInfo.name || 'professional'} (${job.id})`,
      validationCriteria: [
        'Response is professional and relevant to CV content',
        'No personal opinions or speculation beyond CV facts',
        'Maintains appropriate tone and personality',
        'Provides specific examples when possible'
      ]
    });

    // 5. Calculate confidence score
    const confidence = Math.min(
      (claudeResponse.verification?.confidence || 0.5) * 
      (relevantChunks.length > 0 ? 1.0 : 0.3),
      1.0
    );

    // 6. Extract sources
    const sources = relevantChunks.map(chunk => 
      chunk.metadata?.section || 'CV Content'
    ).filter((source, index, arr) => arr.indexOf(source) === index);

    return {
      content: claudeResponse.content[0].text,
      sources,
      confidence,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    logger.error('[PORTAL-CHAT] RAG response generation failed', { error, sessionId });
    
    // Fallback response
    return {
      content: "I apologize, but I'm having trouble accessing the CV information right now. Please try asking your question again, or feel free to contact this professional directly.",
      sources: [],
      confidence: 0.1,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Store chat message and analytics
  */
async function storeChatMessage(
  sessionId: string,
  portalId: string,
  userMessage: string,
  aiResponse: string,
  analytics: Partial<ChatAnalytics>
): Promise<void> {
  try {
    const messageId = nanoid();
    const timestamp = new Date();

    // Store user message
    await admin.firestore()
      .collection('portalChatMessages')
      .doc(`${messageId}-user`)
      .set({
        messageId: `${messageId}-user`,
        sessionId,
        portalId,
        role: 'user',
        content: userMessage,
        timestamp,
        ...analytics
      });

    // Store AI response
    await admin.firestore()
      .collection('portalChatMessages')
      .doc(`${messageId}-assistant`)
      .set({
        messageId: `${messageId}-assistant`,
        sessionId,
        portalId,
        role: 'assistant',
        content: aiResponse,
        timestamp,
        ...analytics
      });

    // Update session message count
    await admin.firestore()
      .collection('portalChatSessions')
      .doc(sessionId)
      .update({
        messageCount: admin.firestore.FieldValue.increment(1),
        lastActivity: timestamp
      });

    // Update portal analytics
    await admin.firestore()
      .collection('portalConfigs')
      .doc(portalId)
      .update({
        'analytics.metrics.chatSessions': admin.firestore.FieldValue.increment(1),
        'analytics.metrics.lastUpdated': timestamp
      });

  } catch (error) {
    logger.error('[PORTAL-CHAT] Message storage failed', { error, sessionId });
    // Don't throw error - chat should still work even if storage fails
  }
}

/**
 * Get suggested follow-up questions
  */
function getSuggestedQuestions(job: EnhancedJob, previousMessage: string): string[] {
  const suggestions = [];
  const cvData = job.parsedData;

  // Base suggestions based on CV content
  if (cvData?.experience && cvData.experience.length > 0) {
    suggestions.push("What's your most recent work experience?");
    suggestions.push("Can you tell me about your key achievements?");
  }

  if (cvData?.skills && (
    (Array.isArray(cvData.skills) && cvData.skills.length > 0) ||
    (typeof cvData.skills === 'object' && !Array.isArray(cvData.skills) && 
     (cvData.skills.technical?.length > 0 || cvData.skills.soft?.length > 0))
  )) {
    suggestions.push("What are your main technical skills?");
  }

  if (cvData?.education && cvData.education.length > 0) {
    suggestions.push("What's your educational background?");
  }

  if (cvData?.projects && cvData.projects.length > 0) {
    suggestions.push("What notable projects have you worked on?");
  }

  // General questions
  suggestions.push("What type of role are you looking for?");
  suggestions.push("How can I contact you?");

  // Return 3 random suggestions
  return suggestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
}

// ============================================================================
// MAIN CHAT FUNCTION
// ============================================================================

/**
 * Portal Chat Function - Callable for authenticated access
  */
export const portalChat = onCall(
  {
    timeoutSeconds: 60,
    memory: '1GiB',
    ...corsOptions
  },
  withPremiumAccess('aiChat', async (request: CallableRequest<PortalChatRequest>): Promise<PortalChatResponse> => {
    const startTime = Date.now();

    try {
      const { portalId, message, userId, sessionId, visitorMetadata } = request.data;

      // Validate input
      if (!portalId) {
        throw new HttpsError('invalid-argument', 'Portal ID is required');
      }

      const messageValidation = validateChatMessage(message);
      if (!messageValidation.valid) {
        throw new HttpsError('invalid-argument', messageValidation.error || 'Invalid message');
      }

      // Get or create session
      const actualSessionId = await getOrCreateChatSession(
        portalId, 
        sessionId, 
        userId, 
        visitorMetadata
      );

      // Check rate limits
      const rateLimitCheck = await checkRateLimit(actualSessionId);
      if (!rateLimitCheck.allowed) {
        throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before sending another message.');
      }

      // Get portal configuration and validate access
      const { portal, job, ragProfile } = await getPortalConfig(portalId);

      // Generate AI response
      const response = await generateRAGResponse(message, job, ragProfile, actualSessionId);

      // Get session info
      const sessionDoc = await admin.firestore()
        .collection('portalChatSessions')
        .doc(actualSessionId)
        .get();
      
      const sessionData = sessionDoc.data();
      const messageCount = (sessionData?.messageCount || 0) + 1;

      // Prepare analytics data
      const analytics: Partial<ChatAnalytics> = {
        portalId,
        sessionId: actualSessionId,
        messageCount,
        responseTime: response.processingTime,
        userType: userId ? 'authenticated' : 'anonymous',
        quality: {
          confidence: response.confidence,
          sourceRelevance: response.sources.length > 0 ? 0.8 : 0.3
        }
      };

      // Store messages and analytics
      await storeChatMessage(
        actualSessionId,
        portalId,
        message,
        response.content,
        analytics
      );

      // Get suggested follow-up questions
      const suggestedQuestions = getSuggestedQuestions(job, message);

      // Prepare response
      const chatResponse: PortalChatResponse = {
        success: true,
        response: {
          content: response.content,
          timestamp: new Date(),
          messageId: nanoid(),
          sources: response.sources,
          confidence: response.confidence
        },
        session: {
          sessionId: actualSessionId,
          messageCount
        },
        suggestedQuestions,
        rateLimiting: {
          remaining: rateLimitCheck.remaining - 1,
          resetTime: rateLimitCheck.resetTime
        }
      };

      logger.info('[PORTAL-CHAT] Chat completed successfully', {
        portalId,
        sessionId: actualSessionId,
        responseTime: Date.now() - startTime,
        confidence: response.confidence,
        sourcesCount: response.sources.length
      });

      return chatResponse;

    } catch (error) {
      logger.error('[PORTAL-CHAT] Chat function failed', { 
        error: error instanceof Error ? error.message : error,
        portalId: request.data?.portalId,
        processingTime: Date.now() - startTime
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Chat service temporarily unavailable');
    }
  })
);

/**
 * Portal Chat HTTP Function - For public access from HuggingFace portals
  */
export const portalChatPublic = onRequest(
  {
    timeoutSeconds: 60,
    memory: '1GiB',
    ...requestCorsOptions
  },
  async (req, res) => {
    const startTime = Date.now();

    try {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        addCorsHeaders(res, req.get('Origin') || '');
        res.status(204).send('');
        return;
      }

      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Add CORS headers
      addCorsHeaders(res, req.get('Origin') || '');

      // Parse request body
      const { portalId, message, sessionId, visitorMetadata } = req.body;

      // Validate input
      if (!portalId) {
        res.status(400).json({ error: 'Portal ID is required' });
        return;
      }

      const messageValidation = validateChatMessage(message);
      if (!messageValidation.valid) {
        res.status(400).json({ error: messageValidation.error });
        return;
      }

      // Get or create session
      const actualSessionId = await getOrCreateChatSession(
        portalId, 
        sessionId, 
        undefined, // No userId for public access
        {
          ...visitorMetadata,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          referrer: req.get('Referer')
        }
      );

      // Check rate limits
      const rateLimitCheck = await checkRateLimit(actualSessionId);
      if (!rateLimitCheck.allowed) {
        res.status(429).json({ 
          error: 'Rate limit exceeded', 
          retryAfter: Math.ceil((rateLimitCheck.resetTime.getTime() - Date.now()) / 1000)
        });
        return;
      }

      // Get portal configuration and validate access
      const { portal, job, ragProfile } = await getPortalConfig(portalId);

      // Generate AI response
      const response = await generateRAGResponse(message, job, ragProfile, actualSessionId);

      // Get session info
      const sessionDoc = await admin.firestore()
        .collection('portalChatSessions')
        .doc(actualSessionId)
        .get();
      
      const sessionData = sessionDoc.data();
      const messageCount = (sessionData?.messageCount || 0) + 1;

      // Prepare analytics data
      const analytics: Partial<ChatAnalytics> = {
        portalId,
        sessionId: actualSessionId,
        messageCount,
        responseTime: response.processingTime,
        userType: 'anonymous',
        quality: {
          confidence: response.confidence,
          sourceRelevance: response.sources.length > 0 ? 0.8 : 0.3
        }
      };

      // Store messages and analytics
      await storeChatMessage(
        actualSessionId,
        portalId,
        message,
        response.content,
        analytics
      );

      // Get suggested follow-up questions
      const suggestedQuestions = getSuggestedQuestions(job, message);

      // Prepare response
      const chatResponse: PortalChatResponse = {
        success: true,
        response: {
          content: response.content,
          timestamp: new Date(),
          messageId: nanoid(),
          sources: response.sources,
          confidence: response.confidence
        },
        session: {
          sessionId: actualSessionId,
          messageCount
        },
        suggestedQuestions,
        rateLimiting: {
          remaining: rateLimitCheck.remaining - 1,
          resetTime: rateLimitCheck.resetTime
        }
      };

      logger.info('[PORTAL-CHAT-PUBLIC] Chat completed successfully', {
        portalId,
        sessionId: actualSessionId,
        responseTime: Date.now() - startTime,
        confidence: response.confidence,
        sourcesCount: response.sources.length
      });

      res.status(200).json(chatResponse);

    } catch (error) {
      logger.error('[PORTAL-CHAT-PUBLIC] Chat function failed', { 
        error: error instanceof Error ? error.message : error,
        processingTime: Date.now() - startTime
      });

      if (error instanceof HttpsError) {
        res.status(error.httpErrorCode?.status || 500).json({ 
          error: error.message 
        });
      } else {
        res.status(500).json({ 
          error: 'Chat service temporarily unavailable' 
        });
      }
    }
  }
);

/**
 * Portal Chat Analytics Function
  */
export const getPortalChatAnalytics = onCall(
  { ...corsOptions },
  async (request: CallableRequest<{ portalId: string; timeRange?: string }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { portalId, timeRange = '7d' } = request.data;

    if (!portalId) {
      throw new HttpsError('invalid-argument', 'Portal ID is required');
    }

    try {
      // Verify portal ownership
      const portalDoc = await admin.firestore()
        .collection('portalConfigs')
        .doc(portalId)
        .get();

      if (!portalDoc.exists) {
        throw new HttpsError('not-found', 'Portal not found');
      }

      const portal = portalDoc.data() as PortalConfig;
      if (portal.userId !== request.auth.uid) {
        throw new HttpsError('permission-denied', 'Not authorized to view analytics');
      }

      // Calculate time range
      const now = new Date();
      const timeRangeMs = timeRange === '24h' ? 24 * 60 * 60 * 1000 :
                         timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                         timeRange === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                         7 * 24 * 60 * 60 * 1000; // Default to 7 days

      const startTime = new Date(now.getTime() - timeRangeMs);

      // Get chat sessions
      const sessionsQuery = await admin.firestore()
        .collection('portalChatSessions')
        .where('portalId', '==', portalId)
        .where('createdAt', '>=', startTime)
        .get();

      // Get chat messages
      const messagesQuery = await admin.firestore()
        .collection('portalChatMessages')
        .where('portalId', '==', portalId)
        .where('timestamp', '>=', startTime)
        .get();

      const sessions = sessionsQuery.docs.map(doc => doc.data());
      const messages = messagesQuery.docs.map(doc => doc.data());

      // Calculate analytics
      const totalSessions = sessions.length;
      const totalMessages = messages.filter(m => m.role === 'user').length;
      const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;
      
      const responseTimes = messages.filter(m => m.responseTime).map(m => m.responseTime);
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      const confidenceScores = messages.filter(m => m.quality?.confidence).map(m => m.quality.confidence);
      const averageConfidence = confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

      return {
        success: true,
        analytics: {
          timeRange,
          summary: {
            totalSessions,
            totalMessages,
            averageMessagesPerSession: Math.round(averageMessagesPerSession * 10) / 10,
            averageResponseTime: Math.round(averageResponseTime),
            averageConfidence: Math.round(averageConfidence * 100) / 100
          },
          sessions: sessions.slice(0, 20).map(s => ({
            sessionId: s.sessionId,
            createdAt: s.createdAt,
            messageCount: s.messageCount,
            userType: s.userId ? 'authenticated' : 'anonymous'
          })),
          topQuestions: [], // TODO: Implement question analysis
          performanceMetrics: {
            responseTimeDistribution: [], // TODO: Implement
            confidenceDistribution: [], // TODO: Implement
            userSatisfaction: null // TODO: Implement feedback collection
          }
        }
      };

    } catch (error) {
      logger.error('[PORTAL-CHAT] Analytics retrieval failed', { error, portalId });
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to retrieve analytics');
    }
  }
);