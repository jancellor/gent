import { tool } from 'ai';
import { z } from 'zod';
import { processManager } from './process-manager.js';

const DEFAULT_TIMEOUT_S = 60;

const executeInputSchema = z.object({
  command: z
    .string()
    .describe('The bash command to execute, ie `bash -c <COMMAND>`'),
});

export type ExecuteToolOutput = {
  exit?: number;
  signal?: string;
  stdout?: string;
  stderr?: string;
};

export class ExecuteTool {
  readonly name = 'execute';

  definition() {
    return tool({
      description:
        `Execute a shell command in bash and return stdout/stderr/exit/signal. ` +
        `Commands are killed after ${DEFAULT_TIMEOUT_S}s. `,
      inputSchema: executeInputSchema,
    });
  }

  execute(input: unknown, signal: AbortSignal): Promise<ExecuteToolOutput> {
    const { command } = executeInputSchema.parse(input);

    const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_S * 1000);
    const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

    if (combinedSignal.aborted) {
      return Promise.resolve({});
    }

    return new Promise<ExecuteToolOutput>((resolve) => {
      const proc = processManager.spawn('bash', ['-c', command]);
      let stdout = '';
      let stderr = '';
      let resolved = false;

      const onAbort = () => {
        if (resolved) return;
        processManager.signalProcesses(proc, 'SIGTERM');
        setTimeout(() => {
          if (!resolved) processManager.signalProcesses(proc, 'SIGKILL');
        }, 5000).unref();
      };

      combinedSignal.addEventListener('abort', onAbort);

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (exit, signal) => {
        resolved = true;
        combinedSignal.removeEventListener('abort', onAbort);
        resolve({
          ...(exit !== null && { exit }),
          ...(signal && { signal }),
          ...(stdout && { stdout }),
          ...(stderr && { stderr }),
        });
      });
    });
  }
}
