# ADR-007: Voice-Guided Onboarding

## Status
Accepted

## Context
The buyer is an owner-operator or a small fleet owner. They set up software from a phone in a truck stop, not from a desk. A 23-field form is where self-serve funnels die. The onboarding profile (`docs/business-model.md` §3) is also the seed of the business plan, so every answer has an immediate, visible payoff.

## Decision
Onboarding at `/start` is a conversation, not a form.

- **Voice in and out, in the browser.** `useVoice` (`apps/web/src/lib/hooks/use-voice.ts`) wraps the Web Speech API: `SpeechSynthesis` speaks each prompt and a short acknowledgement; `SpeechRecognition` captures the answer with interim transcripts; a `getUserMedia` analyser drives the visualizer level. No audio leaves the browser; nothing is recorded.
- **Text is always equal.** Every step renders a typed input, option cards, or a yes/no pair. Voice and typing can be switched mid-flow. When recognition is unsupported (Firefox), the guide still speaks and the user types.
- **Deterministic understanding.** Spoken answers are parsed by `@haulage/core` `nlu.ts` (numbers in words and digits, prices like "two thirty five", percentages, yes/no, keyword choices, company names, DOT digits) with unit tests. No LLM in the loop, so the parse is instant, offline and predictable. Two failed parses fall back to a typed prompt.
- **Every answer is skippable.** Skipped answers take the spec defaults so a plan can always be produced. The step list is data (`onboarding-steps.ts`): prompt, on-screen title, kind, bounds, options, skip rules.
- **The plan builds live.** The right column recomputes `computePlan()` on every answer and reveals sections as chapters complete (company, fleet, economics, cash, suggested plan tier). This is the reward loop that keeps people answering.
- **Launch persists.** Completion writes the profile, chooses a plan tier via `suggestPlan()`, sets Autopilot mode from the user's choice, stores the first plan version and moves the user into `/app`. The API mirrors this in `POST /onboarding/complete`.

## Consequences
- Browser support for speech recognition is Chromium and Safari; the flow degrades to typing elsewhere and says so.
- The step list and the NLU are the two places to change when a question is added; the profile type and the engine already default the field.
- Because acknowledgements are spoken, prompts and acks are written to be read aloud: short, specific, no symbols.
