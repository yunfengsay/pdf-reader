import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
}

export function MessageContent({ content, role }: MessageContentProps) {
  return (
    <div className={`markdown-content prose prose-sm max-w-none ${
      role === 'assistant' ? 'prose-gray' : 'prose-blue'
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeRaw, { allowDangerousHtml: true }]]}
        components={{
        // Code block rendering
        code({ node, className, children, ...props }) {
          const inline = !className;
          const match = /language-(\w+)/.exec(className || '');
          
          if (inline) {
            return (
              <code className="px-1 py-0.5 bg-gray-100 rounded text-sm" {...props}>
                {children}
              </code>
            );
          }
          
          return match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-md text-sm"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="block bg-gray-100 p-2 rounded-md text-sm" {...props}>
              {children}
            </code>
          );
        },
        // Table rendering
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full divide-y divide-gray-200">
                {children}
              </table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-gray-50">{children}</thead>;
        },
        th({ children }) {
          return (
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
              {children}
            </td>
          );
        },
        // Link rendering
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          );
        },
        // Heading adjustments
        h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
        // List styling
        ul: ({ children }) => <ul className="list-disc pl-4 my-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 my-2">{children}</ol>,
        li: ({ children }) => <li className="my-1">{children}</li>,
        // Blockquote styling
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">
            {children}
          </blockquote>
        ),
        // Paragraph spacing
        p: ({ children }) => <p className="my-2">{children}</p>,
        // HTML div support for diagrams
        div: ({ className, children, ...props }) => {
          // Support for mermaid diagrams
          if (className === 'mermaid' || className === 'diagram') {
            return (
              <div className={`${className} my-4 p-4 bg-gray-50 rounded-lg overflow-x-auto`} {...props}>
                {children}
              </div>
            );
          }
          return <div className={className} {...props}>{children}</div>;
        },
        // SVG support
        svg: ({ ...props }) => <svg {...props} className="max-w-full h-auto mx-auto" />,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}