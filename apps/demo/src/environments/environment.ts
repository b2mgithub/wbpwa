// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --configuration production` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  version: '1.0.2',
  production: false,
  apiUrl: 'https://pwacore.b2mapp.ca',
  hubUrl: 'https://pwacore.b2mapp.ca/hubs',
  
  // Splash Screen (disabled in dev for faster iteration)
  showSplashScreen: true,
  splashDisplayDuration: 2000,
  splashFadeDuration: 500,
  
  // AI Provider: 'github' or 'ollama'
  aiProvider: 'ollama' as 'github' | 'ollama',
  
  // GitHub Models API for AI Assistant
  // Get your token from: https://github.com/settings/tokens
  // No specific scopes required for GitHub Models
  githubToken: '', // Set your token here locally (not committed to git)
  githubModel: 'gpt-4o',
  githubUrl: 'https://models.inference.ai.azure.com/chat/completions',
  
  // Ollama Local AI (no rate limits, works offline)
  // Install from: https://ollama.com
  // Run: ollama pull llama3.1 (or mistral, phi3, qwen2.5, etc.)
  ollamaUrl: 'http://localhost:11434/api/chat',
  ollamaModel: 'llama3.2:1b',
};