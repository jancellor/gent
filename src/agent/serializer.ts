export class Serializer {
  private tail: Promise<unknown> = Promise.resolve();

  async submit<T>(task: () => Promise<T>): Promise<T> {
    return this.tail = (async () => {
      try {
        await this.tail;
      } catch (ignored) {
      }
      return task();
    })();
  }
}
