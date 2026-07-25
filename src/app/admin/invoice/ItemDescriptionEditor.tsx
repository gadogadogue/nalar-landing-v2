// src/app/admin/invoice/ItemDescriptionEditor.tsx
import { useRef } from "react";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";

type ItemDescriptionEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type WrapResult = { value: string; selStart: number; selEnd: number };

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
): WrapResult {
  const { selectionStart, selectionEnd, value } = textarea;
  const hasSelection = selectionEnd > selectionStart;
  const selected = hasSelection ? value.slice(selectionStart, selectionEnd) : placeholder;
  const nextValue =
    value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  const selStart = selectionStart + before.length;
  const selEnd = selStart + selected.length;
  return { value: nextValue, selStart, selEnd };
}

/**
 * Markdown editor for a work-item description: Bold/Italic/Link buttons
 * wrap the current textarea selection with markdown syntax (**bold**,
 * *italic*, [text](url)) instead of pulling in a full rich-text editor
 * dependency. InvoiceDocument renders the result back out with
 * react-markdown (already a repo dependency, used by PortfolioModal),
 * restricted to inline formatting + links — handy for linking a
 * third-party reference invoice.
 */
export function ItemDescriptionEditor({ value, onChange }: ItemDescriptionEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function applyWrap(before: string, after: string, placeholder: string) {
    const textarea = ref.current;
    if (!textarea) return;
    const result = wrapSelection(textarea, before, after, placeholder);
    onChange(result.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selStart, result.selEnd);
    });
  }

  function handleLink() {
    const textarea = ref.current;
    if (!textarea) return;
    const url = window.prompt("Link URL — e.g. a third-party reference invoice:", "https://");
    if (!url) return;

    const { selectionStart, selectionEnd, value: current } = textarea;
    const hasSelection = selectionEnd > selectionStart;
    const label = hasSelection ? current.slice(selectionStart, selectionEnd) : "reference invoice";
    const inserted = `[${label}](${url})`;
    const nextValue = current.slice(0, selectionStart) + inserted + current.slice(selectionEnd);
    onChange(nextValue);

    const cursor = selectionStart + inserted.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div>
      <div className="mb-1 flex gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => applyWrap("**", "**", "bold text")}
          title="Bold"
          className="h-7 w-7 p-0 font-bold"
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => applyWrap("*", "*", "italic text")}
          title="Italic"
          className="h-7 w-7 p-0 italic"
        >
          I
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleLink}
          title="Insert link"
          className="h-7 px-2 text-xs"
        >
          🔗 Link
        </Button>
      </div>
      <Textarea
        ref={ref}
        placeholder="Work item description — supports **bold**, *italic*, and [links](https://…)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />
    </div>
  );
}
