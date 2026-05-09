import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockCaptureException, mockCaptureMessage } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function setEnv(value: 'development' | 'production' | 'test') {
  vi.stubEnv('NODE_ENV', value)
}

describe('logger', () => {
  it('info en dev print sur console.log avec scope, sans Sentry', async () => {
    setEnv('development')
    const { createLogger } = await import('@/lib/logger')
    const log = createLogger('my-route')
    log.info('hello', { foo: 1 })
    expect(console.log).toHaveBeenCalledWith('[my-route]', 'hello', { foo: 1 })
    expect(mockCaptureMessage).not.toHaveBeenCalled()
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('info en prod ne print pas et ne touche pas Sentry', async () => {
    setEnv('production')
    const { createLogger } = await import('@/lib/logger')
    createLogger('x').info('silent in prod')
    expect(console.log).not.toHaveBeenCalled()
    expect(mockCaptureMessage).not.toHaveBeenCalled()
  })

  it('warn print sur console.warn (dev) et envoie a Sentry (prod)', async () => {
    setEnv('production')
    const { createLogger } = await import('@/lib/logger')
    createLogger('alert').warn('something off', { id: 'x-1' })
    expect(console.warn).toHaveBeenCalledWith('[alert]', 'something off', { id: 'x-1' })
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      '[alert] something off',
      expect.objectContaining({ level: 'warning', tags: { scope: 'alert' } }),
    )
  })

  it('error print sur console.error (toujours) + Sentry captureException en prod avec une Error', async () => {
    setEnv('production')
    const { createLogger } = await import('@/lib/logger')
    const realErr = new Error('boom')
    createLogger('boom-route').error('failed', realErr)
    expect(console.error).toHaveBeenCalledWith('[boom-route]', 'failed', realErr)
    expect(mockCaptureException).toHaveBeenCalledWith(realErr, expect.objectContaining({ tags: { scope: 'boom-route' } }))
  })

  it('error en prod sans Error reelle wrappe le message dans une Error et passe data en extra', async () => {
    setEnv('production')
    const { createLogger } = await import('@/lib/logger')
    createLogger('rest').error('upstream 500', { status: 500, body: 'x' })
    const [errArg, opts] = mockCaptureException.mock.calls[0]
    expect(errArg).toBeInstanceOf(Error)
    expect((errArg as Error).message).toBe('upstream 500')
    expect(opts.extra).toEqual({ data: { status: 500, body: 'x' } })
  })

  it('error en dev print mais ne touche pas Sentry', async () => {
    setEnv('development')
    const { createLogger } = await import('@/lib/logger')
    createLogger('x').error('local fail', new Error('e'))
    expect(console.error).toHaveBeenCalled()
    expect(mockCaptureException).not.toHaveBeenCalled()
  })
})
