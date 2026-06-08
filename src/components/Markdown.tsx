import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Renders Penny's replies as Markdown (bold, lists, links) instead of raw text.
// Styling is in index.css under `.penny-md`, tuned to sit tight inside a bubble.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="penny-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
