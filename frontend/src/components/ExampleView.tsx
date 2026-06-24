import type { Example } from "../types";

export default function ExampleView({ example }: { example: Example }) {
  return (
    <div
      data-testid="example-content"
      className="rounded border border-gray-200 bg-white p-4"
    >
      {example.title && (
        <h4 className="mb-2 font-semibold">{example.title}</h4>
      )}
      <div className="space-y-3">
        {example.contentBlocks.map((block, idx) => {
          if (block.kind === "code") {
            return (
              <pre
                key={idx}
                className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-100"
              >
                <code>{block.text}</code>
              </pre>
            );
          }
          return (
            <p key={idx} className="whitespace-pre-wrap text-sm text-gray-800">
              {block.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
