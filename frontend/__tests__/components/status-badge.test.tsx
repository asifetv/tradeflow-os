/**
 * Tests for StatusBadge component
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/deals/status-badge'
import { DealStatus } from '@/lib/types/deal'

describe('StatusBadge', () => {
  it('renders RFQ_RECEIVED status', () => {
    render(<StatusBadge status={DealStatus.RFQ_RECEIVED} />)
    expect(screen.getByText('RFQ Received')).toBeInTheDocument()
  })

  it('renders SOURCING status', () => {
    render(<StatusBadge status={DealStatus.SOURCING} />)
    expect(screen.getByText('Sourcing')).toBeInTheDocument()
  })

  it('renders QUOTED status', () => {
    render(<StatusBadge status={DealStatus.QUOTED} />)
    expect(screen.getByText('Quoted')).toBeInTheDocument()
  })

  it('renders PO_RECEIVED status', () => {
    render(<StatusBadge status={DealStatus.PO_RECEIVED} />)
    expect(screen.getByText('PO Received')).toBeInTheDocument()
  })

  it('renders ORDERED status', () => {
    render(<StatusBadge status={DealStatus.ORDERED} />)
    expect(screen.getByText('Ordered')).toBeInTheDocument()
  })

  it('renders IN_PRODUCTION status', () => {
    render(<StatusBadge status={DealStatus.IN_PRODUCTION} />)
    expect(screen.getByText('In Production')).toBeInTheDocument()
  })

  it('renders SHIPPED status', () => {
    render(<StatusBadge status={DealStatus.SHIPPED} />)
    expect(screen.getByText('Shipped')).toBeInTheDocument()
  })

  it('renders DELIVERED status', () => {
    render(<StatusBadge status={DealStatus.DELIVERED} />)
    expect(screen.getByText('Delivered')).toBeInTheDocument()
  })

  it('renders INVOICED status', () => {
    render(<StatusBadge status={DealStatus.INVOICED} />)
    expect(screen.getByText('Invoiced')).toBeInTheDocument()
  })

  it('renders PAID status', () => {
    render(<StatusBadge status={DealStatus.PAID} />)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('renders CLOSED status', () => {
    render(<StatusBadge status={DealStatus.CLOSED} />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('renders CANCELLED status', () => {
    render(<StatusBadge status={DealStatus.CANCELLED} />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<StatusBadge status={DealStatus.RFQ_RECEIVED} />)
    const badge = container.firstChild
    expect(badge).toHaveClass('px-3', 'py-1', 'rounded-full', 'text-sm', 'font-semibold')
  })

  it('applies status-specific colors', () => {
    const { container: containerRFQ } = render(
      <StatusBadge status={DealStatus.RFQ_RECEIVED} />
    )
    expect(containerRFQ.firstChild).toHaveClass('bg-blue-100', 'text-blue-800')

    const { container: containerSourceing } = render(
      <StatusBadge status={DealStatus.SOURCING} />
    )
    expect(containerSourceing.firstChild).toHaveClass('bg-cyan-100', 'text-cyan-800')
  })
})
