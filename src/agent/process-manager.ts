import { type ChildProcessByStdio, spawn } from 'child_process';
import process from 'process';
import type { Readable } from 'stream';

type SpawnedProcess = ChildProcessByStdio<null, Readable, Readable>;

export class ProcessManager {
  private readonly children = new Set<SpawnedProcess>();
  private shutdownPromise: Promise<void> | null = null;

  constructor() {
    this.installHandlers();
  }

  spawn(command: string, args: readonly string[] = []): SpawnedProcess {
    const child = spawn(command, [...args], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.children.add(child);
    // Tracking only the direct child means detached/background grandchildren can outlive shutdown.
    child.once('close', () => {
      this.children.delete(child);
    });

    return child;
  }

  shutdown(): Promise<void> {
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    const doShutdown = async () => {
      this.signalAllProcesses('SIGTERM');

      const shutdownDeadlineAt = Date.now() + 5000;
      while (this.children.size > 0 && Date.now() < shutdownDeadlineAt) {
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
      }

      if (this.children.size > 0) {
        this.signalAllProcesses('SIGKILL');
      }
    };
    return this.shutdownPromise = doShutdown();
  }

  signalProcesses(
    proc: SpawnedProcess,
    signal: NodeJS.Signals | number,
  ): void {
    if (proc.killed) {
      return;
    }
    if (!proc.pid) {
      return;
    }
    try {
      // Negative PID process-group signaling is Unix-specific and can fail on Windows.
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

  private installHandlers(): void {
    process.once('exit', () => {
      // synchronous fail-safe in case you forget to call await shutdown()
      this.signalAllProcesses('SIGKILL');
    });

    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
      process.once(signal, async () => {
        try {
          await this.shutdown();
        } finally {
          // self signal
          process.kill(process.pid, signal);
        }
      });
    }
  }

  private signalAllProcesses(signal: NodeJS.Signals): void {
    for (const child of this.children) {
      this.signalProcesses(child, signal);
    }
  }
}

export const processManager = new ProcessManager();
