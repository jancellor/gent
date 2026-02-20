import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { ancestorPaths } from './paths.js';

export class AgentsPrompt {
  async build(): Promise<string> {
    const contents = (
      await Promise.all(
        [join(homedir(), '.agents'), ...ancestorPaths(process.cwd())].map(
          (dir) => this.tryRead(join(dir, 'AGENTS.md')),
        ),
      )
    ).filter(Boolean);

    return !contents.length
      ? ''
      : [
          'Follow the instructions below that came from AGENTS.md files.',
          '<INSTRUCTIONS>',
          ...contents,
          '</INSTRUCTIONS>',
        ].join('\n\n');
  }

  private async tryRead(path: string): Promise<string | undefined> {
    try {
      return await readFile(path, 'utf-8');
    } catch {}
  }
}
