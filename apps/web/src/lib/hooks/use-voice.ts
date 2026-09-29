'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* Minimal typings for the Web Speech API (not in lib.dom for all targets). */
interface SRResultAlt { transcript: string; confidence: number }
interface SRResult { isFinal: boolean; 0: SRResultAlt; length: number }
interface SREvent extends Event { resultIndex: number; results: ArrayLike<SRResult> }
interface SR extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
}
type SRCtor = new () => SR;

function getRecognition(): SRCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface VoiceState {
  supported: { listen: boolean; speak: boolean };
  listening: boolean;
  speaking: boolean;
  interim: string;
  level: number;
  error: string | null;
}

/**
 * Voice in and out. `speak` uses SpeechSynthesis; `listen` resolves with a final
 * transcript. Both degrade gracefully: when unsupported, callers fall back to text.
 */
export function useVoice(opts: { lang?: string; voiceHint?: string[]; rate?: number } = {}) {
  const { lang = 'en-US', voiceHint = ['Samantha', 'Google US English', 'Microsoft Aria', 'Karen', 'Daniel'], rate = 1.0 } = opts;
  const [state, setState] = useState<VoiceState>({
    supported: { listen: false, speak: false },
    listening: false,
    speaking: false,
    interim: '',
    level: 0,
    error: null,
  });
  const recRef = useRef<SR | null>(null);
  const resolveRef = useRef<((t: string) => void) | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; raf: number; stream: MediaStream } | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setState((s) => ({ ...s, supported: { listen: !!getRecognition(), speak: typeof window !== 'undefined' && 'speechSynthesis' in window } }));
    return () => {
      recRef.current?.abort();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      stopMeter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    for (const hint of voiceHint) {
      const v = voices.find((x) => x.name.includes(hint) && x.lang.startsWith('en'));
      if (v) return v;
    }
    return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
  }, [voiceHint, lang]);

  const speak = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = rate;
        u.pitch = 1;
        const v = pickVoice();
        if (v) u.voice = v;
        u.onstart = () => setState((s) => ({ ...s, speaking: true }));
        u.onend = () => {
          setState((s) => ({ ...s, speaking: false }));
          resolve();
        };
        u.onerror = () => {
          setState((s) => ({ ...s, speaking: false }));
          resolve();
        };
        window.speechSynthesis.speak(u);
      }),
    [lang, rate, muted, pickVoice],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setState((s) => ({ ...s, speaking: false }));
  }, []);

  async function startMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setState((s) => ({ ...s, level: Math.min(1, rms * 4) }));
        if (audioRef.current) audioRef.current.raf = requestAnimationFrame(tick);
      };
      audioRef.current = { ctx, raf: requestAnimationFrame(tick), stream };
    } catch {
      /* mic meter is cosmetic */
    }
  }
  function stopMeter() {
    const a = audioRef.current;
    if (!a) return;
    cancelAnimationFrame(a.raf);
    a.stream.getTracks().forEach((t) => t.stop());
    a.ctx.close().catch(() => {});
    audioRef.current = null;
    setState((s) => ({ ...s, level: 0 }));
  }

  const stopListening = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const listen = useCallback(
    (timeoutMs = 9000): Promise<string> =>
      new Promise((resolve) => {
        const Ctor = getRecognition();
        if (!Ctor) return resolve('');
        stopSpeaking();
        const rec = new Ctor();
        recRef.current = rec;
        rec.lang = lang;
        rec.continuous = false;
        rec.interimResults = true;
        let finalText = '';
        let done = false;
        const finish = (t: string) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          stopMeter();
          setState((s) => ({ ...s, listening: false, interim: '' }));
          resolve(t.trim());
        };
        const timer = setTimeout(() => {
          rec.stop();
        }, timeoutMs);
        rec.onresult = (e) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText += r[0].transcript;
            else interim += r[0].transcript;
          }
          setState((s) => ({ ...s, interim: interim || finalText }));
        };
        rec.onerror = (e) => {
          setState((s) => ({ ...s, error: e.error ?? 'error' }));
          finish(finalText);
        };
        rec.onend = () => finish(finalText);
        setState((s) => ({ ...s, listening: true, interim: '', error: null }));
        resolveRef.current = finish;
        startMeter();
        try {
          rec.start();
        } catch {
          finish('');
        }
      }),
    [lang, stopSpeaking],
  );

  return { ...state, muted, setMuted, speak, stopSpeaking, listen, stopListening };
}
