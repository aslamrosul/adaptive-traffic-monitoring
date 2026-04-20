import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local file manually
export function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envFile = readFileSync(envPath, 'utf-8');
    
    envFile.split('\n').forEach(line => {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) return;
      
      // Parse KEY=VALUE
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        // Set environment variable
        process.env[key] = cleanValue;
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error loading .env.local file:', error);
    return false;
  }
}
