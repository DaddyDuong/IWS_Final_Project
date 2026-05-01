import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../api/httpClient'
import { fetchAddresses, fetchCart, register } from '../api/services'

vi.mock('../api/httpClient', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('api services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('omits blank phone numbers from register payloads', async () => {
    httpClient.post.mockResolvedValue({ data: { data: { token: 'token' } } })

    await register({
      email: 'alice@example.com',
      password: 'strong-password',
      fullName: 'Alice',
      phone: '',
    })

    expect(httpClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'alice@example.com',
      password: 'strong-password',
      fullName: 'Alice',
    })
  })

  it('defaults cart list requests to the backend page size', async () => {
    httpClient.get.mockResolvedValue({ data: { data: { items: [] }, meta: {} } })

    await fetchCart()

    expect(httpClient.get).toHaveBeenCalledWith('/cart', {
      params: { limit: 100 },
    })
  })

  it('defaults address list requests to the backend page size', async () => {
    httpClient.get.mockResolvedValue({ data: { data: [], meta: {} } })

    await fetchAddresses()

    expect(httpClient.get).toHaveBeenCalledWith('/addresses', {
      params: { limit: 100 },
    })
  })
})
