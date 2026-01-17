"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Code, Users, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

interface CollaborativeEditorProps {
  documentId: string;
  token: string;
  serverUrl: string;
  placeholder?: string;
  className?: string;
  onSave?: (html: string) => void;
}

interface AwarenessUser {
  id: string;
  name: string;
  color: string;
}

export function CollaborativeEditor({
  documentId,
  token,
  serverUrl,
  placeholder,
  className,
  onSave,
}: CollaborativeEditorProps) {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [collaborators, setCollaborators] = useState<AwarenessUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track Y.js instances for proper cleanup
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);

  // Initialize Y.js document and provider
  useEffect(() => {
    // Clean up previous instances
    if (providerRef.current) {
      providerRef.current.destroy();
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
    }

    setStatus("connecting");
    setError(null);

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new HocuspocusProvider({
      url: serverUrl,
      name: documentId,
      document: ydoc,
      token,
      connect: true,
      onConnect: () => {
        setStatus("connected");
        setError(null);
      },
      onDisconnect: () => {
        setStatus("disconnected");
      },
      onAuthenticationFailed: ({ reason }) => {
        setStatus("error");
        setError(reason || "Authentication failed");
      },
      onAwarenessUpdate: ({ states }) => {
        const users: AwarenessUser[] = [];
        states.forEach((state) => {
          if (state.user) {
            users.push(state.user as AwarenessUser);
          }
        });
        setCollaborators(users);
      },
    });
    providerRef.current = provider;

    // Cleanup on unmount or when dependencies change
    return () => {
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
    };
  }, [documentId, token, serverUrl]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder: placeholder || "Text eingeben...",
        }),
        ...(ydocRef.current
          ? [
              Collaboration.configure({
                document: ydocRef.current,
              }),
            ]
          : []),
        ...(providerRef.current
          ? [
              CollaborationCursor.configure({
                provider: providerRef.current,
                user: {
                  name: "Loading...",
                  color: "#6366f1",
                },
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class: "outline-none min-h-[80px]",
        },
      },
      immediatelyRender: false,
    },
    [ydocRef.current, providerRef.current]
  );

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Save handler
  const handleSave = useCallback(() => {
    if (editor && onSave) {
      onSave(editor.getHTML());
    }
  }, [editor, onSave]);

  useEffect(() => {
    if (!editor || !onSave) return;

    editor.on("blur", handleSave);
    return () => {
      editor.off("blur", handleSave);
    };
  }, [editor, onSave, handleSave]);

  // Show error state
  if (status === "error") {
    return (
      <div className={`rounded-lg bg-surface-3 border border-red-500/50 p-4 ${className || ""}`}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Verbindungsfehler: {error || "Unbekannter Fehler"}</span>
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className={`rounded-lg bg-surface-3 border border-glass-border p-4 ${className || ""}`}>
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Editor wird geladen...</span>
        </div>
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void;
    isActive: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded text-text-secondary transition-colors ${
        isActive
          ? "bg-primary/20 text-primary"
          : "hover:bg-surface-2 hover:text-text-primary"
      }`}
      title={title}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-6 bg-glass-border mx-1" />;

  return (
    <div className={`rounded-lg bg-surface-3 border border-glass-border focus-within:ring-2 focus-within:ring-primary ${className || ""}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-glass-border">
        {/* Connection status */}
        <div className="flex items-center gap-2 mr-2" title={
          status === "connecting" ? "Verbindung wird hergestellt..." :
          status === "connected" ? "Verbunden" :
          "Getrennt - Versuche Wiederverbindung..."
        }>
          {status === "connecting" && (
            <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
          )}
          {status === "connected" && (
            <div className="w-2 h-2 rounded-full bg-green-500" />
          )}
          {status === "disconnected" && (
            <div className="w-2 h-2 rounded-full bg-red-500" />
          )}
        </div>

        {/* Collaborators */}
        {collaborators.length > 0 && (
          <>
            <div className="flex items-center gap-1 mr-2">
              <Users className="w-4 h-4 text-text-secondary" />
              <div className="flex -space-x-2">
                {collaborators.slice(0, 5).map((user, i) => (
                  <div
                    key={user.id || i}
                    className="w-6 h-6 rounded-full border-2 border-surface-3 flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                ))}
                {collaborators.length > 5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-surface-3 bg-surface-2 flex items-center justify-center text-xs text-text-secondary">
                    +{collaborators.length - 5}
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

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
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-text-secondary
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.collaboration-cursor__caret]:relative
          [&_.collaboration-cursor__caret]:ml-[-1px]
          [&_.collaboration-cursor__caret]:mr-[-1px]
          [&_.collaboration-cursor__caret]:border-l-[2px]
          [&_.collaboration-cursor__caret]:border-solid
          [&_.collaboration-cursor__label]:absolute
          [&_.collaboration-cursor__label]:top-[-1.4em]
          [&_.collaboration-cursor__label]:left-[-1px]
          [&_.collaboration-cursor__label]:text-xs
          [&_.collaboration-cursor__label]:font-semibold
          [&_.collaboration-cursor__label]:whitespace-nowrap
          [&_.collaboration-cursor__label]:px-1
          [&_.collaboration-cursor__label]:py-0.5
          [&_.collaboration-cursor__label]:rounded"
      />
    </div>
  );
}
