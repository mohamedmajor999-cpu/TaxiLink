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
      // Contraintes optimisées pour le micro Bluetooth voiture (HFP mono 8/16 kHz).
      // En fallback, on relâche sampleRate/channelCount qu'iOS Safari et certains
      // kits Bluetooth refusent (OverconstrainedError).
      const preferred: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      }
      const fallback: MediaStreamConstraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(preferred)
      } catch (firstErr) {
        const name = (firstErr as DOMException).name
        // NotReadableError: l'OS bascule A2DP→HFP sur le Bluetooth voiture, ça prend 1-2s.
        // OverconstrainedError: le périphérique refuse 16 kHz mono. Dans les deux cas,
        // on attend le switch puis on retente avec des contraintes minimales.
        if (name !== 'NotReadableError' && name !== 'OverconstrainedError') throw firstErr
        await new Promise((r) => setTimeout(r, 800))
        stream = await navigator.mediaDevices.getUserMedia(fallback)
      }
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
      const name = (err as DOMException).name
      const code = name === 'NotAllowedError' ? 'not-allowed'
        : name === 'NotReadableError' || name === 'OverconstrainedError' ? 'audio-capture'
        : 'unsupported'
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
