import { tool } from 'ai';
import { spawn } from 'child_process';
import { z } from 'zod';

const executeInputSchema = z.object({
  command: z
    .string()
    .describe('The bash command to execute, ie `bash -c <COMMAND>`'),
});

export type ExecuteToolOutput = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export class ExecuteTool {
  readonly name = 'execute';

  definition() {
    return tool({
      description:
        'Execute a shell command in bash and return stdout/stderr/exit code.',
      inputSchema: executeInputSchema,
    });
  }

  execute(input: unknown): Promise<ExecuteToolOutput> {
    const { command } = executeInputSchema.parse(input);

    return new Promise<ExecuteToolOutput>((resolve) => {
      const proc = spawn('bash', ['-c', command]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          exitCode: code ?? -1,
          stdout,
          stderr,
        });
      });
    });
  }
}
