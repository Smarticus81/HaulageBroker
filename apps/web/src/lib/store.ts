'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AutopilotPolicies, BusinessPlan, OnboardingProfile, PlanTier } from '@haulage/types';
import { policies as defaultPolicies, demoProfile } from './data';

interface Session {
  authed: boolean;
  onboarded: boolean;
  plan: PlanTier;
  profile: OnboardingProfile;
  policies: AutopilotPolicies;
  businessPlan: BusinessPlan | null;
  resolvedEvents: string[];
  signIn: () => void;
  signOut: () => void;
  completeOnboarding: (profile: OnboardingProfile, plan: PlanTier, businessPlan: BusinessPlan) => void;
  setPolicies: (p: Partial<AutopilotPolicies>) => void;
  setProfile: (p: Partial<OnboardingProfile>) => void;
  setBusinessPlan: (p: BusinessPlan) => void;
  resolveEvent: (id: string) => void;
  loadDemo: () => void;
}

export const useSession = create<Session>()(
  persist(
    (set) => ({
      authed: false,
      onboarded: false,
      plan: 'fleet',
      profile: demoProfile,
      policies: defaultPolicies,
      businessPlan: null,
      resolvedEvents: [],
      signIn: () => {
        document.cookie = 'haulage.session=1; path=/; max-age=604800; SameSite=Lax';
        set({ authed: true });
      },
      signOut: () => {
        document.cookie = 'haulage.session=; path=/; max-age=0';
        set({ authed: false });
      },
      completeOnboarding: (profile, plan, businessPlan) => {
        document.cookie = 'haulage.session=1; path=/; max-age=604800; SameSite=Lax';
        set({ profile, plan, businessPlan, onboarded: true, authed: true });
      },
      setPolicies: (p) => set((s) => ({ policies: { ...s.policies, ...p } })),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setBusinessPlan: (businessPlan) => set({ businessPlan }),
      resolveEvent: (id) => set((s) => ({ resolvedEvents: [...new Set([...s.resolvedEvents, id])] })),
      loadDemo: () => {
        document.cookie = 'haulage.session=1; path=/; max-age=604800; SameSite=Lax';
        set({ authed: true, onboarded: true, profile: demoProfile, plan: 'fleet' });
      },
    }),
    { name: 'haulage.session', version: 1 },
  ),
);
