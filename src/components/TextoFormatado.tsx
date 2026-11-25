import ReactMarkdown from "react-markdown";

/** Shows formatted text (Markdown). Raw HTML is never rendered, so it is safe. */
export function TextoFormatado({ texto }: { texto: string }) {
  return (
    <div className="texto-formatado">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
