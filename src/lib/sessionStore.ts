import { Session, SessionNotes, PromisingDirection } from '@/data/types';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'career-counseling-sessions';
const SHARE_STORAGE_KEY = 'career-counseling-shared-sessions';

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

// Shared sessions (short links)
export function generateShareSlug(): string {
  return nanoid(8);
}

export function shareSession(session: Session): string {
  const slug = generateShareSlug();
  const sharedSessions = getSharedSessions();
  
  const sharedSession = {
    ...session,
    shareSlug: slug,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };
  
  sharedSessions[slug] = sharedSession;
  localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(sharedSessions));
  
  // Update original session with share slug
  session.shareSlug = slug;
  saveSession(session);
  
  return slug;
}

export function getSharedSession(slug: string): Session | null {
  const sharedSessions = getSharedSessions();
  const session = sharedSessions[slug];
  
  if (!session) return null;
  
  // Check expiry
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    delete sharedSessions[slug];
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(sharedSessions));
    return null;
  }
  
  return session;
}

export function getSharedSessions(): Record<string, Session> {
  try {
    const data = localStorage.getItem(SHARE_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
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
