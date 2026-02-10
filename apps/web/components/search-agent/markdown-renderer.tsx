import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ ...props }) => (
          <h1 className="text-2xl font-bold my-4 text-foreground" {...props} />
        ),
        h2: ({ ...props }) => (
          <h2 className="text-xl font-semibold my-3 text-foreground" {...props} />
        ),
        h3: ({ ...props }) => (
          <h3 className="text-lg font-semibold my-2 text-foreground" {...props} />
        ),
        p: ({ ...props }) => (
          <p className="my-2 text-foreground leading-relaxed" {...props} />
        ),
        ul: ({ ...props }) => (
          <ul className="list-disc list-inside my-2 space-y-1 text-foreground" {...props} />
        ),
        ol: ({ ...props }) => (
          <ol className="list-decimal list-inside my-2 space-y-1 text-foreground" {...props} />
        ),
        li: ({ ...props }) => (
          <li className="text-foreground" {...props} />
        ),
        strong: ({ ...props }) => (
          <strong className="font-semibold text-foreground" {...props} />
        ),
        code: ({ inline, ...props }: any) =>
          inline ? (
            <code
              className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm font-mono"
              {...props}
            />
          ) : (
            <code
              className="block bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm font-mono my-2 overflow-x-auto"
              {...props}
            />
          ),
        pre: ({ ...props }) => (
          <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md my-2 overflow-x-auto" {...props} />
        ),
        table: ({ ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse" {...props} />
          </div>
        ),
        thead: ({ ...props }) => (
          <thead className="bg-slate-100 dark:bg-slate-800" {...props} />
        ),
        tbody: ({ ...props }) => (
          <tbody {...props} />
        ),
        tr: ({ ...props }) => (
          <tr className="border-b border-slate-200 dark:border-slate-700" {...props} />
        ),
        th: ({ ...props }) => (
          <th className="border border-slate-300 dark:border-slate-600 p-2 text-left font-semibold text-foreground" {...props} />
        ),
        td: ({ ...props }) => (
          <td className="border border-slate-300 dark:border-slate-600 p-2 text-foreground" {...props} />
        ),
        blockquote: ({ ...props }) => (
          <blockquote
            className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 my-2 italic text-slate-600 dark:text-slate-400"
            {...props}
          />
        ),
        a: ({ ...props }) => (
          <a
            className="text-blue-600 dark:text-blue-400 hover:underline"
            {...props}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
