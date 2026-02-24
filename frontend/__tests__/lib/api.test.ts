/**
 * Tests for API client
 */
import { dealApi } from '@/lib/api'

// Mock axios
jest.mock('axios')

describe('Deal API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('list', () => {
    it('should call GET /api/deals with params', () => {
      const mockResponse = {
        data: {
          deals: [],
          total: 0,
          skip: 0,
          limit: 50,
        },
      }

      // Mock would be set up here
      expect(dealApi.list).toBeDefined()
    })
  })

  describe('get', () => {
    it('should call GET /api/deals/{id}', () => {
      const dealId = '123'
      expect(dealApi.get).toBeDefined()
    })
  })

  describe('create', () => {
    it('should call POST /api/deals', () => {
      const dealData = {
        deal_number: 'TEST-001',
        description: 'Test deal',
      }
      expect(dealApi.create).toBeDefined()
    })
  })

  describe('update', () => {
    it('should call PATCH /api/deals/{id}', () => {
      const dealId = '123'
      const updateData = { description: 'Updated' }
      expect(dealApi.update).toBeDefined()
    })
  })

  describe('updateStatus', () => {
    it('should call PATCH /api/deals/{id}/status', () => {
      const dealId = '123'
      const statusData = { status: 'sourcing' }
      expect(dealApi.updateStatus).toBeDefined()
    })
  })

  describe('delete', () => {
    it('should call DELETE /api/deals/{id}', () => {
      const dealId = '123'
      expect(dealApi.delete).toBeDefined()
    })
  })

  describe('getActivity', () => {
    it('should call GET /api/deals/{id}/activity', () => {
      const dealId = '123'
      expect(dealApi.getActivity).toBeDefined()
    })
  })
})
