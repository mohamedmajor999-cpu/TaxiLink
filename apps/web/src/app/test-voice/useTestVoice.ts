'use client'

import { useCallback, useRef, useState } from 'react'

interface Result {
  text: string
  elapsedMs: number
}

export function useTestVoice() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = useCallback(async () => {
    setError(null)
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
        : ''
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stopStream()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const ext = (recorder.mimeType || 'audio/webm').includes('mp4') ? 'mp4' : 'webm'
        const file = new File([blob], `audio.${ext}`, { type: blob.type })
        const form = new FormData()
        form.append('audio', file)
        setIsProcessing(true)
        try {
          const res = await fetch('/api/missions/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
          setResult({ text: data.text, elapsedMs: data.elapsedMs })
        } catch (err) {
          setError((err as Error).message)
        } finally {
          setIsProcessing(false)
        }
      }
      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      setError((err as Error).message)
      stopStream()
    }
  }, [])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setIsRecording(false)
  }, [])

  return { isRecording, isProcessing, result, error, start, stop }
}
