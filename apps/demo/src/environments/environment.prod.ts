export const environment = {
  version: '1.0.2',
  production: true,
  apiUrl: 'https://pwacore.b2mapp.ca',
  hubUrl: 'https://pwacore.b2mapp.ca/hubs',
  
  // Splash Screen (enabled in production for polished UX)
  showSplashScreen: true,
  splashDisplayDuration: 2000,
  splashFadeDuration: 500,
  
  // AI Provider: 'github' or 'ollama'
  aiProvider: 'ollama' as 'github' | 'ollama',
  
  // GitHub Models API
  githubToken: '', // Set via environment variable in production
  githubModel: 'gpt-4o',
  githubUrl: 'https://models.inference.ai.azure.com/chat/completions',
  
  // Ollama Local AI
  ollamaUrl: 'http://localhost:11434/api/chat',
  ollamaModel: 'llama3.2:1b',
};