export const environment = {
  production: true,
  apiUrl: 'https://pwacore.b2mapp.ca/api',
  hubUrl: 'https://pwacore.b2mapp.ca/hubs',
  
  // AI Provider: 'github' or 'ollama'
  aiProvider: 'ollama' as 'github' | 'ollama',
  
  // GitHub Models API
  githubToken: 'REMOVED_SECRET',
  githubModel: 'gpt-4o',
  githubUrl: 'https://models.inference.ai.azure.com/chat/completions',
  
  // Ollama Local AI
  ollamaUrl: 'http://localhost:11434/api/chat',
  ollamaModel: 'llama3.2:1b',
};