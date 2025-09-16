// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts// @ts-ignore - Export conflicts/**
 * RAG (Retrieval Augmented Generation) Service
 *
 * Handles vector storage, similarity search, and CV content retrieval
 * for AI-powered chat in One Click Portal
 *
 * @author CVPlus Team
 * @version 1.0.0
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { CVEmbeddingDocument, EmbeddingService } from './embedding.service';

export interface RAGSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    section: string;
    type: string;
    chunkIndex: number;
    processedCvId: string;
  };
}

export interface RAGContextResult {
  query: string;
  results: RAGSearchResult[];
  context: string;
  sources: string[];
  confidence: number;
}

export class RAGService {
  private pinecone: Pinecone;
  private embeddingService: EmbeddingService;
  private readonly INDEX_NAME = 'cvplus-embeddings';
  private readonly NAMESPACE_PREFIX = 'cv_';
  private readonly TOP_K = 5;
  private readonly MIN_SIMILARITY_SCORE = 0.7;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Initialize Pinecone index for CV embeddings
   */
  async initializeIndex(): Promise<boolean> {
    try {
      const indexStats = await this.getIndexStats();
      console.log(`Pinecone index ${this.INDEX_NAME} is ready. Stats:`, indexStats);
      return true;
    } catch (error) {
      console.error('Failed to initialize Pinecone index:', error);
      return false;
    }
  }

  /**
   * Store CV embeddings in Pinecone
   */
  async storeCVEmbeddings(embeddings: CVEmbeddingDocument[]): Promise<boolean> {
    if (embeddings.length === 0) {
      console.warn('No embeddings provided to store');
      return true;
    }

    try {
      const processedCvId = embeddings[0].processedCvId;
      const namespace = `${this.NAMESPACE_PREFIX}${processedCvId}`;

      console.log(`Storing ${embeddings.length} embeddings in namespace: ${namespace}`);

      const index = this.pinecone.index(this.INDEX_NAME);

      // Prepare vectors for Pinecone
      const vectors = embeddings.map(embedding => ({
        id: embedding.id,
        values: embedding.embedding,
        metadata: {
          content: this.truncateContent(embedding.content, 40960), // Pinecone metadata limit
          section: embedding.metadata.section,
          type: embedding.metadata.type,
          chunkIndex: embedding.metadata.chunkIndex,
          processedCvId: embedding.processedCvId,
          embeddingModel: embedding.metadata.embeddingModel,
          createdAt: embedding.metadata.createdAt.toISOString()
        }
      }));

      // Store vectors in batches to avoid rate limits
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);

        await index.namespace(namespace).upsert(batch);

        console.log(`Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);

        // Small delay between batches
        if (i + batchSize < vectors.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`Successfully stored all ${embeddings.length} embeddings for CV ${processedCvId}`);
      return true;

    } catch (error) {
      console.error('Error storing CV embeddings:', error);
      throw new Error(`Failed to store CV embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for relevant CV content using semantic similarity
   */
  async searchRelevantContent(
    processedCvId: string,
    query: string,
    topK: number = this.TOP_K
  ): Promise<RAGContextResult> {
    try {
      console.log(`Searching for relevant content in CV ${processedCvId} with query: "${query}"`);

      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateQueryEmbedding(query);

      // Search in Pinecone
      const namespace = `${this.NAMESPACE_PREFIX}${processedCvId}`;
      const index = this.pinecone.index(this.INDEX_NAME);

      const searchResponse = await index.namespace(namespace).query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        includeValues: false
      });

      // Process search results
      const results: RAGSearchResult[] = [];
      const sources = new Set<string>();

      for (const match of searchResponse.matches || []) {
        if (match.score && match.score >= this.MIN_SIMILARITY_SCORE && match.metadata) {
          results.push({
            id: match.id,
            content: match.metadata.content as string,
            score: match.score,
            metadata: {
              section: match.metadata.section as string,
              type: match.metadata.type as string,
              chunkIndex: match.metadata.chunkIndex as number,
              processedCvId: match.metadata.processedCvId as string
            }
          });

          sources.add(match.metadata.section as string);
        }
      }

      // Calculate confidence score
      const confidence = results.length > 0
        ? results.reduce((sum, result) => sum + result.score, 0) / results.length
        : 0;

      // Combine content for context
      const context = results
        .map(result => `[${result.metadata.section}] ${result.content}`)
        .join('\n\n');

      console.log(`Found ${results.length} relevant content chunks with average confidence: ${confidence.toFixed(3)}`);

      return {
        query,
        results,
        context,
        sources: Array.from(sources),
        confidence
      };

    } catch (error) {
      console.error('Error searching relevant content:', error);
      throw new Error(`Failed to search relevant content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete CV embeddings from Pinecone
   */
  async deleteCVEmbeddings(processedCvId: string): Promise<boolean> {
    try {
      const namespace = `${this.NAMESPACE_PREFIX}${processedCvId}`;
      const index = this.pinecone.index(this.INDEX_NAME);

      // Delete all vectors in the namespace
      await index.namespace(namespace).deleteAll();

      console.log(`Successfully deleted all embeddings for CV ${processedCvId}`);
      return true;

    } catch (error) {
      console.error('Error deleting CV embeddings:', error);
      return false;
    }
  }

  /**
   * Check if CV embeddings exist in Pinecone
   */
  async hasCVEmbeddings(processedCvId: string): Promise<boolean> {
    try {
      const namespace = `${this.NAMESPACE_PREFIX}${processedCvId}`;
      const index = this.pinecone.index(this.INDEX_NAME);

      // Try to query with a dummy vector to check if namespace has data
      const dummyVector = new Array(1536).fill(0);
      const response = await index.namespace(namespace).query({
        vector: dummyVector,
        topK: 1,
        includeMetadata: false,
        includeValues: false
      });

      return (response.matches?.length || 0) > 0;

    } catch (error) {
      console.warn(`Could not check embeddings for CV ${processedCvId}:`, error);
      return false;
    }
  }

  /**
   * Get Pinecone index statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const index = this.pinecone.index(this.INDEX_NAME);
      const stats = await index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('Error getting index stats:', error);
      return null;
    }
  }

  /**
   * Generate embeddings and store them for a CV
   */
  async processAndStoreCVEmbeddings(processedCV: any): Promise<boolean> {
    try {
      console.log(`Processing and storing embeddings for CV: ${processedCV.id}`);

      // Check if embeddings already exist
      const hasExisting = await this.hasCVEmbeddings(processedCV.id);
      if (hasExisting) {
        console.log(`Embeddings already exist for CV ${processedCV.id}, skipping`);
        return true;
      }

      // Generate embeddings
      const embeddings = await this.embeddingService.generateCVEmbeddings(processedCV);

      if (embeddings.length === 0) {
        console.warn(`No embeddings generated for CV ${processedCV.id}`);
        return false;
      }

      // Store in Pinecone
      const success = await this.storeCVEmbeddings(embeddings);

      if (success) {
        console.log(`Successfully processed and stored ${embeddings.length} embeddings for CV ${processedCV.id}`);
      }

      return success;

    } catch (error) {
      console.error('Error processing and storing CV embeddings:', error);
      return false;
    }
  }

  /**
   * Validate RAG service configuration
   */
  async validateConfiguration(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check Pinecone API key
      if (!process.env.PINECONE_API_KEY) {
        errors.push('PINECONE_API_KEY environment variable not set');
      }

      // Check OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        errors.push('OPENAI_API_KEY environment variable not set');
      }

      // Test Pinecone connection
      try {
        await this.getIndexStats();
      } catch (error) {
        errors.push(`Pinecone connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test OpenAI connection
      const openaiValid = await this.embeddingService.validateConnection();
      if (!openaiValid) {
        errors.push('OpenAI embeddings API connection failed');
      }

    } catch (error) {
      errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Truncate content to fit Pinecone metadata limits
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Truncate and add ellipsis
    return content.substring(0, maxLength - 3) + '...';
  }
}