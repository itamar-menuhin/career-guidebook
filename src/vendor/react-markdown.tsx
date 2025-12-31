// Lightweight, in-repo markdown renderer used via Vite alias to avoid external runtime dependencies.
import { Fragment, createElement, ReactElement, ReactNode } from 'react';

type Components = Partial<Record<string, React.ComponentType<{ children?: ReactNode }>>>;

interface ReactMarkdownProps {
  children?: string;
  components?: Components;
  remarkPlugins?: unknown[];
}

type MarkdownNode =
  | { type: 'heading'; depth: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'hr' };

const parseInline = (text: string): ReactNode[] => {
  const tokens: ReactNode[] = [];
  let remaining = text;
  let safety = 0;

  while (remaining && safety < 1000) {
    safety += 1;
    const patterns: { regex: RegExp; render: (match: RegExpExecArray, key: number) => ReactNode }[] = [
      {
        regex: /\[([^\]]+)]\(([^)]+)\)/,
        render: (match, key) => (
          <a key={key} href={match[2]} target="_blank" rel="noreferrer">
            {match[1]}
          </a>
        ),
      },
      {
        regex: /\*\*([^*]+)\*\*/,
        render: (match, key) => <strong key={key}>{match[1]}</strong>,
      },
      {
        regex: /\*([^*]+)\*/,
        render: (match, key) => <em key={key}>{match[1]}</em>,
      },
      {
        regex: /`([^`]+)`/,
        render: (match, key) => (
          <code key={key} className="px-1 py-0.5 rounded bg-muted/80">
            {match[1]}
          </code>
        ),
      },
    ];

    const nextMatches = patterns
      .map(({ regex, render }) => {
        const match = regex.exec(remaining);
        return match
          ? {
              index: match.index,
              length: match[0].length,
              render,
              match,
            }
          : null;
      })
      .filter(Boolean) as {
      index: number;
      length: number;
      render: (match: RegExpExecArray, key: number) => ReactNode;
      match: RegExpExecArray;
    }[];

    if (nextMatches.length === 0) {
      tokens.push(remaining);
      break;
    }

    nextMatches.sort((a, b) => a.index - b.index);
    const next = nextMatches[0];

    if (next.index > 0) {
      tokens.push(remaining.slice(0, next.index));
    }

    tokens.push(next.render(next.match, safety + tokens.length));
    remaining = remaining.slice(next.index + next.length);
  }

  if (safety >= 1000 && import.meta?.env?.DEV) {
    console.warn('Markdown inline parsing bailed out for safety.');
  }

  return tokens;
};

const parseMarkdown = (markdown: string): MarkdownNode[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const nodes: MarkdownNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      nodes.push({ type: 'code', text: codeLines.join('\n') });
      i += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        depth: Math.min(headingMatch[1].length, 4),
        text: headingMatch[2],
      });
      i += 1;
      continue;
    }

    if (/^\s*---\s*$/.test(line)) {
      nodes.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*> ?/, ''));
        i += 1;
      }
      nodes.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items: string[] = [];
      const ordered = /^\s*\d+\.\s+/.test(line);
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '').trim());
        i += 1;
      }
      nodes.push({ type: 'list', ordered, items });
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      paraLines.push(lines[i]);
      i += 1;
    }
    nodes.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return nodes;
};

const renderInline = (text: string, keyPrefix: string): ReactNode[] =>
  parseInline(text).map((token, index) =>
    typeof token === 'string' ? (
      <Fragment key={`${keyPrefix}-${index}`}>{token}</Fragment>
    ) : (
      token
    )
  );

const renderWithComponent = (
  tag: string,
  props: Record<string, unknown>,
  components?: Components
): ReactElement => {
  const Component = components?.[tag];
  return createElement(Component ?? tag, props, props.children as ReactNode);
};

const renderNode = (node: MarkdownNode, index: number, components?: Components) => {
  switch (node.type) {
    case 'heading': {
      const tag = `h${Math.min(node.depth, 4)}`;
      return renderWithComponent(
        tag,
        { key: index, children: renderInline(node.text, `${index}-h`) },
        components
      );
    }
    case 'paragraph':
      return renderWithComponent(
        'p',
        { key: index, children: renderInline(node.text, `${index}-p`) },
        components
      );
    case 'list': {
      const ListTag = node.ordered ? 'ol' : 'ul';
      return renderWithComponent(
        ListTag,
        {
          key: index,
          children: node.items.map((item, idx) =>
            renderWithComponent(
              'li',
              { key: idx, children: renderInline(item, `${index}-li-${idx}`) },
              components
            )
          ),
        },
        components
      );
    }
    case 'code':
      return renderWithComponent(
        'pre',
        {
          key: index,
          children: renderWithComponent(
            'code',
            { children: node.text },
            components
          ),
        },
        components
      );
    case 'blockquote':
      return renderWithComponent(
        'blockquote',
        {
          key: index,
          children: renderInline(node.text, `${index}-bq`),
        },
        components
      );
    case 'hr':
      return renderWithComponent('hr', { key: index }, components);
    default:
      return null;
  }
};

export default function ReactMarkdown({ children = '', components }: ReactMarkdownProps) {
  const nodes = parseMarkdown(children);
  return <>{nodes.map((node, index) => renderNode(node, index, components))}</>;
}
