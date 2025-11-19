// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --configuration production` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://pwacore.b2mapp.ca/api',
  hubUrl: 'https://pwacore.b2mapp.ca/hubs',
  
  // AI Provider: 'github' or 'ollama'
  aiProvider: 'ollama' as 'github' | 'ollama',
  
  // GitHub Models API for AI Assistant
  // Get your token from: https://github.com/settings/tokens
  // No specific scopes required for GitHub Models
  githubToken: 'REMOVED_SECRET',
  githubModel: 'gpt-4o',
  githubUrl: 'https://models.inference.ai.azure.com/chat/completions',
  
  // Ollama Local AI (no rate limits, works offline)
  // Install from: https://ollama.com
  // Run: ollama pull llama3.1 (or mistral, phi3, qwen2.5, etc.)
  ollamaUrl: 'http://localhost:11434/api/chat',
  ollamaModel: 'llama3.2:1b',
};