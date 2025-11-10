import axios from 'axios';

const VANNA_API_URL = process.env.NEXT_PUBLIC_VANNA_API_URL || 'https://app.vanna.ai';

interface RequestContext {
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  remote_addr?: string;
  query_params?: Record<string, string>;
  metadata?: Record<string, any>;
}

interface ChatRequest {
  message: string;
  conversation_id?: string;
  request_id?: string;
  request_context?: RequestContext;
  metadata?: Record<string, any>;
}

interface ChatStreamChunk {
  rich: {
    id: string;
    type: string;
    data?: {
      content?: string;
      sql?: string;
      status?: string;
      message?: string;
    };
    lifecycle?: string;
  };
  simple?: {
    type?: string;
    text?: string;
  } | null;
  conversation_id: string;
  request_id: string;
  timestamp: number;
}

interface ChatResponse {
  chunks: ChatStreamChunk[];
  conversation_id: string;
  request_id: string;
  total_chunks: number;
}

type ChatCallback = (chunk: ChatStreamChunk) => void;

interface TableInfo {
  name: string;
  columns: string[];
}

const AVAILABLE_TABLES: TableInfo[] = [
  {
    name: 'invoices',
    columns: ['id', 'invoice_number', 'vendor_id', 'total', 'status', 'invoice_date', 'due_date', 'category']
  },
  {
    name: 'vendors',
    columns: ['id', 'name', 'category', 'status']
  }
];

export class VannaAIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = VANNA_API_URL;
  }

  async generateSQL(question: string): Promise<string> {
    try {
      // Format the question with available schema information
      const schemaInfo = AVAILABLE_TABLES.map(table => 
        `Table ${table.name}: ${table.columns.join(', ')}`
      ).join('\n');

      const enhancedQuestion = `Using these tables:\n${schemaInfo}\n\nGenerate SQL query for: ${question}`;

      // Use chat API with schema information
      const chatResponse = await axios.post(`${this.baseUrl}/api/vanna/v2/chat_poll`, {
        message: enhancedQuestion,
        conversation_id: Math.random().toString(36).substring(7),
        request_id: Math.random().toString(36).substring(7),
        metadata: {
          type: 'sql_generation',
          schema: AVAILABLE_TABLES,
          question: question
        }
      });

      if (!chatResponse.data?.chunks || chatResponse.data.chunks.length === 0) {
        throw new Error('No response generated');
      }

      console.log('Chat response:', JSON.stringify(chatResponse.data, null, 2));

      let sqlQuery = '';
      let hasFoundSQL = false;

      // Look for SQL in all possible locations
      for (const chunk of chatResponse.data.chunks) {
        if (chunk.rich?.type === 'text' && chunk.rich?.data?.content) {
          const content = chunk.rich.data.content;
          
          // Look for SQL code blocks
          const sqlMatch = content.match(/```sql\n?([\s\S]*?)\n?```/);
          if (sqlMatch) {
            sqlQuery = sqlMatch[1].trim();
            hasFoundSQL = true;
            break;
          }

          // Look for SELECT statements
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.trim().toLowerCase().startsWith('select')) {
              sqlQuery = line.trim();
              hasFoundSQL = true;
              break;
            }
          }

          if (hasFoundSQL) break;
        }

        // Check simple text responses as a fallback
        if (!hasFoundSQL && chunk.simple?.text) {
          const text = chunk.simple.text;
          if (text.toLowerCase().includes('select') && text.toLowerCase().includes('from')) {
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.trim().toLowerCase().startsWith('select')) {
                sqlQuery = line.trim();
                hasFoundSQL = true;
                break;
              }
            }
          }
        }
      }

      if (!hasFoundSQL || !sqlQuery) {
        // If no SQL found, try with a more specific prompt
        const retryResponse = await axios.post(`${this.baseUrl}/api/vanna/v2/chat_poll`, {
          message: `Generate a SELECT query using tables (${AVAILABLE_TABLES.map(t => t.name).join(', ')}) for: ${question}. Return only the SQL query, no explanation.`,
          conversation_id: Math.random().toString(36).substring(7),
          request_id: Math.random().toString(36).substring(7)
        });

        for (const chunk of retryResponse.data.chunks) {
          if (chunk.rich?.type === 'text' && chunk.rich?.data?.content) {
            const content = chunk.rich.data.content;
            if (content.toLowerCase().includes('select')) {
              sqlQuery = content.trim();
              hasFoundSQL = true;
              break;
            }
          }
        }
      }

      if (!hasFoundSQL || !sqlQuery) {
        throw new Error('No SQL query in response');
      }

      return sqlQuery;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Vanna AI API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('Error generating SQL with Vanna AI:', error);
      }
      throw new Error('Failed to generate SQL query');
    }
  }

  async explainSQL(sql: string): Promise<string> {
    try {
      // Use chat API for SQL explanation
      const chatResponse = await axios.post(`${this.baseUrl}/api/vanna/v2/chat_poll`, {
        message: `Explain what this SQL query does: ${sql}`,
        conversation_id: Math.random().toString(36).substring(7),
        request_id: Math.random().toString(36).substring(7),
        metadata: {
          type: 'sql_explanation',
          sql: sql
        }
      });

      if (!chatResponse.data?.chunks || chatResponse.data.chunks.length === 0) {
        throw new Error('No explanation generated');
      }

      console.log('Explanation response:', JSON.stringify(chatResponse.data, null, 2));

      // Look for explanation in text chunks
      for (const chunk of chatResponse.data.chunks) {
        // Skip status updates and metadata chunks
        if (chunk.rich?.type === 'status_bar_update' || 
            chunk.rich?.type === 'task_tracker_update' ||
            chunk.rich?.type === 'chat_input_update') {
          continue;
        }

        // Check for text content in rich data
        if (chunk.rich?.type === 'text' && chunk.rich?.data?.content) {
          const content = chunk.rich.data.content;
          if (!content.includes('```sql') && content.length > 10) {
            return content.trim();
          }
        }

        // Check simple text responses
        if (chunk.simple?.text && chunk.simple.text.length > 10) {
          const text = chunk.simple.text;
          if (!text.includes('```sql')) {
            return text.trim();
          }
        }
      }

      throw new Error('No explanation in response');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Vanna AI Explanation Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('Error getting SQL explanation from Vanna AI:', error);
      }
      throw new Error('Failed to get SQL explanation');
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await axios.post<ChatResponse>(
        `${this.baseUrl}/api/vanna/v2/chat_poll`,
        request
      );

      return response.data;
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<ChatStreamChunk> {
    const response = await fetch(`${this.baseUrl}/api/vanna/v2/chat_sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk: ChatStreamChunk = JSON.parse(decoder.decode(value));
        yield chunk;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async chatWithCallback(request: ChatRequest, callback: ChatCallback): Promise<void> {
    for await (const chunk of this.chatStream(request)) {
      callback(chunk);
    }
  }
}

export const vannaAI = new VannaAIClient();