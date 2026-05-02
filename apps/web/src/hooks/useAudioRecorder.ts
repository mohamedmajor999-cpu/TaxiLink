'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Options {
  onStop: (blob: Blob) => void
  onError?: (error: string) => void
}

interface UseAudioRecorder {
  isSupported: boolean
  isRecording: boolean
  start: () => Promise<void>
  stop: () => void
}

export function useAudioRecorder({ onStop, onError }: Options): UseAudioRecorder {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const onStopRef = useRef(onStop)
  onStopRef.current = onStop
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsSupported(
      typeof navigator !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && typeof MediaRecorder !== 'undefined',
    )
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    if (recorderRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
        : ''
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stopStream()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        recorderRef.current = null
        setIsRecording(false)
        onStopRef.current(blob)
      }
      recorder.onerror = () => {
        stopStream()
        recorderRef.current = null
        setIsRecording(false)
        onErrorRef.current?.('record-error')
      }
      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      stopStream()
      const code = (err as DOMException).name === 'NotAllowedError' ? 'not-allowed' : 'unsupported'
      onErrorRef.current?.(code)
    }
  }, [stopStream])

  const stop = useCallback(() => {
    const r = recorderRef.current
    if (!r) return
    if (r.state !== 'inactive') r.stop()
  }, [])

  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    stopStream()
  }, [stopStream])

  return { isSupported, isRecording, start, stop }
}
