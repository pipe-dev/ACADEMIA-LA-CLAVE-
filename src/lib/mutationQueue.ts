// S.H.I.E.L.D. Pillar 15: Asynchronous Sequential Write Queue (FIFO)

type QueueTask = () => Promise<void>;

class MutationQueue {
  private queue: QueueTask[] = [];
  private isProcessing = false;
  private minIntervalMs = 50;

  public enqueue(task: QueueTask): void {
    this.queue.push(task);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const currentTask = this.queue.shift();

    if (currentTask) {
      try {
        await currentTask();
      } catch (err) {
        console.error('[MUTATION QUEUE ERROR]', err);
      }
    }

    setTimeout(() => this.processQueue(), this.minIntervalMs);
  }
}

export const mutationQueue = new MutationQueue();
