'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { useEffect, useCallback, useRef } from 'react';
import { EditorToolbar } from './editor-toolbar';

interface TipTapEditorProps {
    content: string;
    onChange: (html: string, wordCount: number) => void;
    editable?: boolean;
    className?: string;
}

function countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
}

export function TipTapEditor({
    content,
    onChange,
    editable = true,
    className = '',
}: TipTapEditorProps) {
    const isExternalUpdate = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: 'Comece a escrever seu capítulo...',
            }),
            CharacterCount,
            UnderlineExt,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight.configure({
                multicolor: false,
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        content,
        editable,
        editorProps: {
            attributes: {
                class: 'tiptap-content prose prose-invert focus:outline-none min-h-[calc(100vh-220px)] px-8 py-6',
            },
        },
        onUpdate: ({ editor: ed }) => {
            if (isExternalUpdate.current) return;
            const html = ed.getHTML();
            const words = countWords(html);
            onChange(html, words);
        },
    });

    // Insert content from AI at the current cursor position
    const insertContent = useCallback(
        (text: string) => {
            if (!editor) return;
            editor.chain().focus().insertContent(text).run();
        },
        [editor]
    );

    // Expose insertContent via ref on the DOM element
    useEffect(() => {
        if (editor) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as unknown as Record<string, unknown>).__tiptapInsert = insertContent;
        }
        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (window as unknown as Record<string, unknown>).__tiptapInsert;
        };
    }, [editor, insertContent]);

    if (!editor) return null;

    return (
        <div className={`flex flex-col border border-border/30 rounded-xl overflow-hidden bg-midnight-light/50 ${className}`}>
            <EditorToolbar editor={editor} />
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
