import { tool } from 'ai';
import { type ChildProcessByStdio, spawn } from 'child_process';
import process from 'process';
import type { Readable } from 'stream';
import { z } from 'zod';

const DEFAULT_TIMEOUT_S = 60;
const TERMINATION_GRACE_MS = 5000;

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
      const proc = spawn('bash', ['-c', command], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      let resolved = false;

      const onAbort = () => {
        if (resolved) return;
        this.signalProcessGroup(proc, 'SIGTERM');
        setTimeout(() => {
          if (!resolved) this.signalProcessGroup(proc, 'SIGKILL');
        }, TERMINATION_GRACE_MS).unref();
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

  private signalProcessGroup(
    proc: ChildProcessByStdio<null, Readable, Readable>,
    signal: NodeJS.Signals | number,
  ): void {
    if (proc.killed) {
      return;
    }
    if (!proc.pid) {
      return;
    }
    try {
      process.kill(-proc.pid, signal);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'ESRCH'
      ) {
        return;
      }
      throw error;
    }
  }
}
