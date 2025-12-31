import { SessionStep } from './types';

export const sessionSteps: SessionStep[] = [
  {
    id: 'opening',
    title: 'Opening & Goals',
    shortTitle: 'Opening',
    description: 'Set the frame for the session. What does the person hope to walk away with?',
    prompts: [
      'What would make this conversation feel like a success for you?',
      'Is there a specific decision you\'re trying to make, or are you more in exploration mode?',
      'How much time do we have, and what should we definitely cover?',
    ],
    color: 'step-opening',
  },
  {
    id: 'background',
    title: 'What They Bring',
    shortTitle: 'Background',
    description: 'Understand their current situation, skills, and experience.',
    prompts: [
      'Walk me through your current situation — what are you doing now?',
      'What skills or experiences do you feel most confident about?',
      'What have you already tried or explored regarding your next steps?',
    ],
    color: 'step-background',
  },
  {
    id: 'happiness',
    title: 'What Makes Them Happy',
    shortTitle: 'Happiness',
    description: 'Explore what energizes them and what they want more of in their work.',
    prompts: [
      'Tell me about a time you felt most engaged and energized by your work.',
      'What activities do you look forward to? What do you dread?',
      'If you had no constraints, what would you be doing?',
    ],
    color: 'step-happiness',
  },
  {
    id: 'constraints',
    title: 'Constraints & Non-Negotiables',
    shortTitle: 'Constraints',
    description: 'Surface the practical realities that will shape what\'s possible.',
    prompts: [
      'What constraints are you working with? (geography, finances, visa, family, etc.)',
      'Are there any non-negotiables — things you definitely need or definitely can\'t do?',
      'How much runway do you have to explore vs. needing income soon?',
    ],
    color: 'step-constraints',
  },
  {
    id: 'directions',
    title: 'Iterative Direction Testing',
    shortTitle: 'Directions',
    description: 'Explore potential directions, test fit, and narrow down.',
    prompts: [
      'Based on what we\'ve discussed, here are a few directions that might fit... (propose 2-3)',
      'What resonates? What doesn\'t feel right?',
      'Let\'s go deeper on [direction] — what would the first small step be?',
      'Are there focus areas or recommendation cards that might help?',
    ],
    color: 'step-directions',
  },
  {
    id: 'wrap',
    title: 'Wrap & Export',
    shortTitle: 'Wrap Up',
    description: 'Synthesize key takeaways and set concrete next steps.',
    prompts: [
      'Let me summarize what we\'ve discussed...',
      'What are your concrete next steps for the next 1-2 weeks?',
      'When should we check in again?',
      'Is there anything we didn\'t cover that you want to address?',
    ],
    color: 'step-wrap',
  },
];

export function getStepById(id: string): SessionStep | undefined {
  return sessionSteps.find(step => step.id === id);
}

export function getNextStep(currentStepId: string): SessionStep | undefined {
  const currentIndex = sessionSteps.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === sessionSteps.length - 1) {
    return undefined;
  }
  return sessionSteps[currentIndex + 1];
}

export function getPreviousStep(currentStepId: string): SessionStep | undefined {
  const currentIndex = sessionSteps.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return sessionSteps[currentIndex - 1];
}
