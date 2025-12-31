import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownPageProps {
  content: string;
  className?: string;
}

export function MarkdownPage({ content, className }: MarkdownPageProps) {
  return (
    <article
      className={cn(
        'prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-[15px] prose-p:leading-relaxed prose-li:marker:text-muted-foreground prose-li:text-[15px] prose-li:leading-relaxed prose-blockquote:text-muted-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-code:text-sm prose-code:before:hidden prose-code:after:hidden prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-muted/60 prose-pre:border prose-pre:border-border/60 prose-pre:text-sm prose-pre:rounded-xl prose-pre:p-4 prose-hr:border-border/60 prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: props => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border/60 bg-muted/40">
              <table className="min-w-[480px] text-sm" {...props} />
            </div>
          ),
          th: props => <th className="px-3 py-2 text-left font-semibold" {...props} />,
          td: props => <td className="px-3 py-2 align-top" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
