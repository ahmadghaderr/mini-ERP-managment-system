import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
