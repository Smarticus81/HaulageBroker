import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { Load, Shipper, Carrier } from '@clearhaul/types'

export class ClearhaulSDK {
  private client: AxiosInstance

  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  // Load Management
  async createLoad(loadData: any): Promise<Load> {
    const response: AxiosResponse<{ data: Load }> = await this.client.post('/v1/loads', loadData)
    return response.data.data
  }

  async getLoad(loadId: string): Promise<Load> {
    const response: AxiosResponse<{ data: Load }> = await this.client.get(`/v1/loads/${loadId}`)
    return response.data.data
  }

  async getLoads(page = 1, limit = 20): Promise<{ data: Load[]; pagination: any }> {
    const response: AxiosResponse<{ data: Load[]; pagination: any }> = await this.client.get('/v1/loads', {
      params: { page, limit }
    })
    return response.data
  }
}

export default ClearhaulSDK