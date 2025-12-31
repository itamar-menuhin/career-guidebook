import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Session, SessionNotes, PromisingDirection } from '@/data/types';
import { 
  createNewSession, 
  createEmptyDirection,
  saveSession, 
  getSession 
} from '@/lib/sessionStore';

interface SessionContextType {
  session: Session | null;
  isActive: boolean;
  startNewSession: () => void;
  loadSession: (id: string) => void;
  setCurrentStep: (stepId: string) => void;
  updateNotes: (notes: Partial<SessionNotes>) => void;
  updateSnapshot: (field: keyof SessionNotes['snapshot'], value: string | string[]) => void;
  addPromisingDirection: (direction?: Partial<PromisingDirection>) => void;
  updatePromisingDirection: (id: string, updates: Partial<PromisingDirection>) => void;
  removePromisingDirection: (id: string) => void;
  addNextStep: (step: string) => void;
  removeNextStep: (index: number) => void;
  updateFollowUpPlan: (plan: string) => void;
  addLinkToDirection: (directionId: string, label: string, url: string) => void;
  addPersonToDirection: (directionId: string, person: string) => void;
  addFirstSmallStep: (directionId: string, step: string) => void;
  endSession: () => void;
  setSession: (session: Session) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [isActive, setIsActive] = useState(false);

  const setSession = useCallback((newSession: Session) => {
    setSessionState(newSession);
    setIsActive(true);
  }, []);

  const startNewSession = useCallback(() => {
    const newSession = createNewSession();
    setSessionState(newSession);
    setIsActive(true);
    saveSession(newSession);
  }, []);

  const loadSession = useCallback((id: string) => {
    const loaded = getSession(id);
    if (loaded) {
      setSessionState(loaded);
      setIsActive(true);
    }
  }, []);

  const setCurrentStep = useCallback((stepId: string) => {
    if (!session) return;
    const updated = { ...session, currentStep: stepId };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const updateNotes = useCallback((notes: Partial<SessionNotes>) => {
    if (!session) return;
    const updated = { 
      ...session, 
      notes: { ...session.notes, ...notes } 
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const updateSnapshot = useCallback((field: keyof SessionNotes['snapshot'], value: string | string[]) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        snapshot: {
          ...session.notes.snapshot,
          [field]: value,
        },
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const addPromisingDirection = useCallback((direction?: Partial<PromisingDirection>) => {
    if (!session) return;
    const newDirection = { ...createEmptyDirection(), ...direction };
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        promisingDirections: [...session.notes.promisingDirections, newDirection],
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const updatePromisingDirection = useCallback((id: string, updates: Partial<PromisingDirection>) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        promisingDirections: session.notes.promisingDirections.map(d =>
          d.id === id ? { ...d, ...updates } : d
        ),
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const removePromisingDirection = useCallback((id: string) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        promisingDirections: session.notes.promisingDirections.filter(d => d.id !== id),
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const addNextStep = useCallback((step: string) => {
    if (!session || !step.trim()) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        closing: {
          ...session.notes.closing,
          nextSteps: [...session.notes.closing.nextSteps, step.trim()],
        },
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const removeNextStep = useCallback((index: number) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        closing: {
          ...session.notes.closing,
          nextSteps: session.notes.closing.nextSteps.filter((_, i) => i !== index),
        },
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const updateFollowUpPlan = useCallback((plan: string) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        closing: {
          ...session.notes.closing,
          followUpPlan: plan,
        },
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const addLinkToDirection = useCallback((directionId: string, label: string, url: string) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        promisingDirections: session.notes.promisingDirections.map(d =>
          d.id === directionId
            ? { ...d, links: [...d.links, { label, url }] }
            : d
        ),
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const addPersonToDirection = useCallback((directionId: string, person: string) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        promisingDirections: session.notes.promisingDirections.map(d =>
          d.id === directionId
            ? { ...d, peopleToTalkTo: [...d.peopleToTalkTo, person] }
            : d
        ),
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const addFirstSmallStep = useCallback((directionId: string, step: string) => {
    if (!session) return;
    const updated = {
      ...session,
      notes: {
        ...session.notes,
        promisingDirections: session.notes.promisingDirections.map(d =>
          d.id === directionId
            ? { ...d, firstSmallSteps: [...d.firstSmallSteps, step] }
            : d
        ),
      },
    };
    setSessionState(updated);
    saveSession(updated);
  }, [session]);

  const endSession = useCallback(() => {
    setSessionState(null);
    setIsActive(false);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isActive,
        startNewSession,
        loadSession,
        setCurrentStep,
        updateNotes,
        updateSnapshot,
        addPromisingDirection,
        updatePromisingDirection,
        removePromisingDirection,
        addNextStep,
        removeNextStep,
        updateFollowUpPlan,
        addLinkToDirection,
        addPersonToDirection,
        addFirstSmallStep,
        endSession,
        setSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
