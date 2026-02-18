import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export class ConfigReader {
  private static CONFIG_PATH = join(
    homedir(),
    '.config',
    'gent',
    'config.json',
  );

  private readConfigFile(): Record<string, unknown> {
    try {
      return JSON.parse(
        readFileSync(ConfigReader.CONFIG_PATH, 'utf-8'),
      ) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private envOrFile(
    envKey: string,
    fileKey: string,
    fileValues: Record<string, unknown>,
  ): string {
    const envValue = process.env[envKey];
    if (envValue) return envValue.trim();
    const fileValue = fileValues[fileKey];
    if (fileValue != null) return String(fileValue).trim();
    throw new Error(`neither ${envKey} nor ${fileKey} is set`);
  }

  read(): Config {
    const fileValues = this.readConfigFile();
    return {
      apiKey: this.envOrFile('GENT_API_KEY', 'api_key', fileValues),
      model: this.envOrFile('GENT_MODEL', 'model', fileValues),
      baseUrl: this.envOrFile('GENT_BASE_URL', 'base_url', fileValues),
    };
  }
}
