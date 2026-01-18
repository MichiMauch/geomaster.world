"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Code, ImageIcon, Youtube as YoutubeIcon, Loader2, Check } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

// Extended YouTube extension that can parse existing iframes
const CustomYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      width: {
        default: 640,
      },
      height: {
        default: 360,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video] iframe',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const iframe = node as HTMLIFrameElement;
          const src = iframe.getAttribute('src');
          if (!src) return false;
          // Extract video ID from various YouTube URL formats
          const match = src.match(/(?:youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]+)/);
          if (!match) return false;
          return { src: `https://www.youtube.com/embed/${match[1]}` };
        },
      },
      {
        tag: 'iframe',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const iframe = node as HTMLIFrameElement;
          const src = iframe.getAttribute('src');
          if (!src) return false;
          // Check if it's a YouTube iframe
          if (!src.includes('youtube.com') && !src.includes('youtube-nocookie.com')) return false;
          const match = src.match(/(?:youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]+)/);
          if (!match) return false;
          return { src: `https://www.youtube.com/embed/${match[1]}` };
        },
      },
    ];
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onAutoSave?: (html: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  autoSaveInterval?: number; // in milliseconds, default 30000 (30s)
}

export function RichTextEditor({
  value,
  onChange,
  onAutoSave,
  placeholder,
  className,
  autoSaveInterval = 30000,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const lastSavedContent = useRef<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Text eingeben...",
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      CustomYoutube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: "w-full aspect-video rounded-lg my-4",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none min-h-[80px]",
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Auto-save functionality
  useEffect(() => {
    if (!onAutoSave || !editor) return;

    const interval = setInterval(async () => {
      const currentContent = editor.getHTML();
      if (currentContent !== lastSavedContent.current) {
        setAutoSaveStatus("saving");
        try {
          await onAutoSave(currentContent);
          lastSavedContent.current = currentContent;
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Auto-save failed:", error);
          setAutoSaveStatus("idle");
        }
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [editor, onAutoSave, autoSaveInterval]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/news-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await response.json();
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Bild-Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }, [editor]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleImageUpload]);

  // Handle YouTube embed
  const handleYoutubeEmbed = useCallback(() => {
    if (!editor) return;

    const url = prompt("YouTube URL eingeben:");
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={`rounded-lg bg-surface-3 border border-glass-border focus-within:ring-2 focus-within:ring-primary ${className || ""}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-glass-border">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Fett (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Kursiv (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Überschrift 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Überschrift 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Aufzählung"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Nummerierte Liste"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Zitat"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Media */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          isActive={false}
          title="Bild einfügen"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </ToolbarButton>
        <ToolbarButton
          onClick={handleYoutubeEmbed}
          isActive={false}
          title="YouTube Video einfügen"
        >
          <YoutubeIcon className="w-4 h-4" />
        </ToolbarButton>

        {/* Auto-save status */}
        {onAutoSave && (
          <div className="ml-auto flex items-center gap-1 text-xs text-text-secondary">
            {autoSaveStatus === "saving" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Speichern...</span>
              </>
            )}
            {autoSaveStatus === "saved" && (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span>Gespeichert</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="p-3 text-text-primary prose prose-invert max-w-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_p]:my-2
          [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2
          [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-2
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-2
          [&_.ProseMirror_li]:my-1
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/50 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-text-secondary
          [&_.ProseMirror_code]:bg-surface-2 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-primary [&_.ProseMirror_code]:text-sm
          [&_.ProseMirror_pre]:bg-surface-2 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:my-2
          [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-4
          [&_.ProseMirror_iframe]:w-full [&_.ProseMirror_iframe]:aspect-video [&_.ProseMirror_iframe]:rounded-lg [&_.ProseMirror_iframe]:my-4
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-text-secondary
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}

// Helper components moved outside to avoid recreating during render
function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded text-text-secondary transition-colors ${
        isActive
          ? "bg-primary/20 text-primary"
          : "hover:bg-surface-2 hover:text-text-primary"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={title}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-6 bg-glass-border mx-1" />;
}
