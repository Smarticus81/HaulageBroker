import Bull from 'bull'
import { Load } from '@clearhaul/types'

export class ClearhaulWorkers {
  private queue: Bull.Queue

  constructor(redisUrl: string) {
    this.queue = new Bull('clearhaul-jobs', redisUrl)
  }

  async processLoadCreated(load: Load): Promise<void> {
    await this.queue.add('process-load-created', load)
  }

  async processTenderAccepted(tenderId: string): Promise<void> {
    await this.queue.add('process-tender-accepted', { tenderId })
  }
}

export default ClearhaulWorkers
