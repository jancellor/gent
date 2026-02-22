export class ShutdownManager {
  private readonly cleanup: () => Promise<void>;
  private shutdownPromise: Promise<void> | null = null;

  constructor(cleanup: () => Promise<void>) {
    this.cleanup = cleanup;
  }

  requestShutdown(): void {
    void this.shutdown(() => {
      process.exit(0);
    });
  }

  installSignalHandlers(): void {
    for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM'] as const) {
      process.once(signal, () => {
        void this.shutdown(() => {
          // resignal to get proper exit/signal values
          process.kill(process.pid, signal);
        });
      });
    }
  }

  private shutdown(finalize: () => void): Promise<void> {
    if (!this.shutdownPromise) {
      this.shutdownPromise = (async () => {
        try {
          await this.cleanup();
        } finally {
          finalize();
        }
      })();
    }
    return this.shutdownPromise;
  }
}
