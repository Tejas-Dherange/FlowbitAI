import { vannaAI } from './vanna-client';

export async function generateSQL(query: string): Promise<string> {
  try {
    // Use Vanna AI to generate SQL from natural language
    const sql = await vannaAI.generateSQL(query);
    
    // Also train the model with this query-SQL pair
    // Don't await this as we don't need to block on training
    vannaAI.trainModel(sql, query).catch(err => {
      console.error('Error training model:', err);
    });

    return sql;
  } catch (error) {
    console.error('Error generating SQL:', error);
    throw new Error("Could not understand the query. Please try rephrasing your question.");
  }
}
