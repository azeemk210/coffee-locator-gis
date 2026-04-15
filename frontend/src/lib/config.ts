/**
 * Runtime Configuration for Frontend
 * This reads environment variables set at build time or deployment
 * 
 * Next.js variables prefixed with NEXT_PUBLIC_ are compiled into the app
 * Variables without prefix are only available server-side
 */

export const getConfig = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'local'
  const nodeEnv = process.env.NODE_ENV || 'development'

  // Validate configuration
  if (!apiUrl) {
    console.warn('[CONFIG] NEXT_PUBLIC_API_URL not set, using default localhost:8000')
  }

  return {
    // API Configuration
    apiUrl: apiUrl,
    
    // Environment
    environment: environment,
    isDevelopment: environment === 'local' || nodeEnv === 'development',
    isProduction: environment === 'production',
    isServer: environment === 'server',
    isDocker: environment === 'docker',
    
    // Features
    enableDebug: !['production'].includes(environment),
  }
}

// Export static config for immediate use
export const config = getConfig()

console.log('[CONFIG] Frontend runtime config:', {
  apiUrl: config.apiUrl,
  environment: config.environment,
  isDevelopment: config.isDevelopment,
})
