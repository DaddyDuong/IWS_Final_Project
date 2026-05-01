import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StateBlock } from '../components/shared/StateBlock'

describe('StateBlock', () => {
  it('shows backend validation messages from nested error responses', () => {
    render(
      <StateBlock
        isError
        error={{
          response: {
            data: {
              success: false,
              error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
              },
            },
          },
        }}
      >
        <div>ok</div>
      </StateBlock>,
    )

    expect(screen.getByText('Validation failed')).toBeInTheDocument()
  })
})
