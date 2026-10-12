"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaLibraryModal } from "./image-picker";

/**
 * Rich text editor for product descriptions, collection copy and pages.
 * Outputs clean HTML (headings, lists, links, images) that the API sanitises.
 * Use H2/H3 headings and lists — search engines read structured content better.
 */
export function RichTextEditor({ value, onChange, placeholder = "Write something…" }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: { attributes: { class: "rich-text tiptap" } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Keep the editor in sync when the form loads data after mount.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background focus-within:border-foreground">
      {editor && <Toolbar editor={editor} onImage={() => setMediaOpen(true)} />}
      <EditorContent editor={editor} />
      <MediaLibraryModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        folder="pages"
        onSelect={(items) => items[0] && editor?.chain().focus().setImage({ src: items[0].url, alt: items[0].alt ?? "" }).run()}
      />
    </div>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const btn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("rounded p-1.5 transition hover:bg-muted", active && "bg-muted text-foreground")}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
  const sep = <span className="mx-1 h-5 w-px bg-border" />;
  const i = "size-4";

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5 text-muted-foreground">
      {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className={i} />, "Heading")}
      {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className={i} />, "Sub-heading")}
      {sep}
      {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold className={i} />, "Bold")}
      {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic className={i} />, "Italic")}
      {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <Underline className={i} />, "Underline")}
      {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <Strikethrough className={i} />, "Strikethrough")}
      {sep}
      {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List className={i} />, "Bullet list")}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className={i} />, "Numbered list")}
      {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <Quote className={i} />, "Quote")}
      {btn(false, () => editor.chain().focus().setHorizontalRule().run(), <Minus className={i} />, "Divider")}
      {sep}
      {btn(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <AlignLeft className={i} />, "Align left")}
      {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <AlignCenter className={i} />, "Align center")}
      {sep}
      {btn(editor.isActive("link"), setLink, <Link2 className={i} />, "Link")}
      {btn(false, onImage, <ImagePlus className={i} />, "Image")}
      {sep}
      {btn(false, () => editor.chain().focus().undo().run(), <Undo2 className={i} />, "Undo")}
      {btn(false, () => editor.chain().focus().redo().run(), <Redo2 className={i} />, "Redo")}
    </div>
  );
}
