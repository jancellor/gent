import {readFileSync} from 'fs';
import {homedir} from 'os';
import {join, parse, sep} from 'path';

export class InitPrompt {
  build(): string {
    const contents = [
      join(homedir(), '.agents'),
      ...this.ancestorPaths(process.cwd()),
    ]
      .map((dir) => this.tryRead(join(dir, 'AGENTS.md')))
      .filter(Boolean);

    return !contents.length ? '' : [
      'Follow the instructions below that came from AGENTS.md files',
      '<INSTRUCTIONS>',
        ...contents,
      '</INSTRUCTIONS>',
    ].join('\n\n');
  }

  private ancestorPaths(dir: string): string[] {
    const { root } = parse(dir);
    const parts = dir.slice(root.length).split(sep).filter(Boolean);
    return Array.from({ length: parts.length + 1 }, (_, i) =>
      join(root, ...parts.slice(0, i)),
    );
  }

  private tryRead(path: string): string | undefined {
    try {
      return readFileSync(path, 'utf-8');
    } catch {
    }
  }
}
