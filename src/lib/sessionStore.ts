import { Session, SessionNotes, PromisingDirection } from '@/data/types';
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'career-counseling-sessions';

export function createEmptySessionNotes(): SessionNotes {
  return {
    snapshot: {
      currentSituation: '',
      aimingFor: '',
      mustHaves: [],
      constraints: [],
    },
    promisingDirections: [],
    closing: {
      nextSteps: [],
      followUpPlan: '',
    },
  };
}

export function createNewSession(): Session {
  return {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentStep: 'opening',
    notes: createEmptySessionNotes(),
  };
}

export function createEmptyDirection(): PromisingDirection {
  return {
    id: nanoid(),
    title: '',
    whyPromising: '',
    firstSmallSteps: [],
    links: [],
    peopleToTalkTo: [],
  };
}

// Local session storage
export function saveSession(session: Session): void {
  const sessions = getAllSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  session.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSession(id: string): Session | null {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === id) || null;
}

export function getAllSessions(): Session[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deleteSession(id: string): void {
  const sessions = getAllSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Shared sessions (remote via Supabase)
export function generateShareSlug(): string {
  return nanoid(10);
}

export type ShareResult = {
  success: true;
  slug: string;
} | {
  success: false;
  error: string;
};

export async function shareSession(session: Session): Promise<ShareResult> {
  const slug = generateShareSlug();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('shared_sessions')
    .insert([{
      slug,
      session_json: session as any,
    }]);
  
  if (error) {
    console.error('Error sharing session:', error);
    return { success: false, error: error.message };
  }
  
  // Update local session with share slug
  session.shareSlug = slug;
  saveSession(session);
  
  return { success: true, slug };
}

export type SharedSessionResult = {
  success: true;
  session: Session;
} | {
  success: false;
  error: 'not_found' | 'expired' | 'unknown';
  message: string;
};

export async function getSharedSession(slug: string): Promise<SharedSessionResult> {
  const { data, error } = await supabase
    .from('shared_sessions')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching shared session:', error);
    return { success: false, error: 'unknown', message: 'Failed to load session' };
  }
  
  if (!data) {
    return { success: false, error: 'not_found', message: 'Session not found' };
  }
  
  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { 
      success: false, 
      error: 'expired', 
      message: 'This session link has expired. Ask the owner to share a new link.' 
    };
  }
  
  return { success: true, session: data.session_json as unknown as Session };
}

export function forkSession(session: Session): Session {
  return {
    ...session,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shareSlug: undefined,
    expiresAt: undefined,
  };
}

// Export session as markdown
export function exportSessionAsMarkdown(session: Session): string {
  const { notes } = session;
  let md = '# Career Counseling Session Notes\n\n';
  md += `*Session Date: ${new Date(session.createdAt).toLocaleDateString()}*\n\n`;
  
  md += '## Snapshot\n\n';
  md += `**Current Situation:** ${notes.snapshot.currentSituation || 'Not specified'}\n\n`;
  md += `**Aiming For:** ${notes.snapshot.aimingFor || 'Not specified'}\n\n`;
  
  if (notes.snapshot.mustHaves.length > 0) {
    md += '**Must-Haves:**\n';
    notes.snapshot.mustHaves.forEach(item => {
      md += `- ${item}\n`;
    });
    md += '\n';
  }
  
  if (notes.snapshot.constraints.length > 0) {
    md += '**Constraints:**\n';
    notes.snapshot.constraints.forEach(item => {
      md += `- ${item}\n`;
    });
    md += '\n';
  }
  
  if (notes.promisingDirections.length > 0) {
    md += '## Promising Directions\n\n';
    notes.promisingDirections.forEach((dir, i) => {
      md += `### ${i + 1}. ${dir.title}\n\n`;
      if (dir.whyPromising) {
        md += `**Why Promising:** ${dir.whyPromising}\n\n`;
      }
      if (dir.firstSmallSteps.length > 0) {
        md += '**First Small Steps (≤60 min):**\n';
        dir.firstSmallSteps.forEach(step => {
          md += `- ${step}\n`;
        });
        md += '\n';
      }
      if (dir.links.length > 0) {
        md += '**Links:**\n';
        dir.links.forEach(link => {
          md += `- [${link.label}](${link.url})\n`;
        });
        md += '\n';
      }
      if (dir.peopleToTalkTo.length > 0) {
        md += '**People to Talk To:**\n';
        dir.peopleToTalkTo.forEach(person => {
          md += `- ${person}\n`;
        });
        md += '\n';
      }
    });
  }
  
  md += '## Closing\n\n';
  if (notes.closing.nextSteps.length > 0) {
    md += '**Next Steps:**\n';
    notes.closing.nextSteps.forEach(step => {
      md += `- ${step}\n`;
    });
    md += '\n';
  }
  
  if (notes.closing.followUpPlan) {
    md += `**Follow-up Plan:** ${notes.closing.followUpPlan}\n`;
  }
  
  return md;
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
