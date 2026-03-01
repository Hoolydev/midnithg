'use client';

import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Highlighter,
    Undo2,
    Redo2,
    Minus,
} from 'lucide-react';

interface ToolbarButton {
    icon: React.FC<{ className?: string }>;
    label: string;
    action: () => void;
    isActive?: boolean;
}

interface EditorToolbarProps {
    editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const groups: (ToolbarButton | 'separator')[][] = [
        [
            {
                icon: Bold,
                label: 'Negrito',
                action: () => editor.chain().focus().toggleBold().run(),
                isActive: editor.isActive('bold'),
            },
            {
                icon: Italic,
                label: 'Itálico',
                action: () => editor.chain().focus().toggleItalic().run(),
                isActive: editor.isActive('italic'),
            },
            {
                icon: Underline,
                label: 'Sublinhado',
                action: () => editor.chain().focus().toggleUnderline().run(),
                isActive: editor.isActive('underline'),
            },
            {
                icon: Strikethrough,
                label: 'Tachado',
                action: () => editor.chain().focus().toggleStrike().run(),
                isActive: editor.isActive('strike'),
            },
            {
                icon: Highlighter,
                label: 'Destaque',
                action: () => editor.chain().focus().toggleHighlight().run(),
                isActive: editor.isActive('highlight'),
            },
        ],
        [
            {
                icon: Heading1,
                label: 'Título 1',
                action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                isActive: editor.isActive('heading', { level: 1 }),
            },
            {
                icon: Heading2,
                label: 'Título 2',
                action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                isActive: editor.isActive('heading', { level: 2 }),
            },
            {
                icon: Heading3,
                label: 'Título 3',
                action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                isActive: editor.isActive('heading', { level: 3 }),
            },
        ],
        [
            {
                icon: List,
                label: 'Lista de Marcadores',
                action: () => editor.chain().focus().toggleBulletList().run(),
                isActive: editor.isActive('bulletList'),
            },
            {
                icon: ListOrdered,
                label: 'Lista Numerada',
                action: () => editor.chain().focus().toggleOrderedList().run(),
                isActive: editor.isActive('orderedList'),
            },
            {
                icon: Quote,
                label: 'Citação',
                action: () => editor.chain().focus().toggleBlockquote().run(),
                isActive: editor.isActive('blockquote'),
            },
            {
                icon: Minus,
                label: 'Linha Horizontal',
                action: () => editor.chain().focus().setHorizontalRule().run(),
            },
        ],
        [
            {
                icon: AlignLeft,
                label: 'Alinhar à Esquerda',
                action: () => editor.chain().focus().setTextAlign('left').run(),
                isActive: editor.isActive({ textAlign: 'left' }),
            },
            {
                icon: AlignCenter,
                label: 'Centralizar',
                action: () => editor.chain().focus().setTextAlign('center').run(),
                isActive: editor.isActive({ textAlign: 'center' }),
            },
            {
                icon: AlignRight,
                label: 'Alinhar à Direita',
                action: () => editor.chain().focus().setTextAlign('right').run(),
                isActive: editor.isActive({ textAlign: 'right' }),
            },
        ],
        [
            {
                icon: Undo2,
                label: 'Desfazer',
                action: () => editor.chain().focus().undo().run(),
            },
            {
                icon: Redo2,
                label: 'Refazer',
                action: () => editor.chain().focus().redo().run(),
            },
        ],
    ];

    return (
        <div className="flex items-center gap-1 flex-wrap px-3 py-2 border-b border-border/50 bg-midnight-lighter/50">
            {groups.map((group, groupIndex) => (
                <div key={groupIndex} className="flex items-center gap-0.5">
                    {groupIndex > 0 && (
                        <div className="w-px h-6 bg-border/50 mx-1.5" />
                    )}
                    {group.map((item, itemIndex) => {
                        if (item === 'separator') return null;
                        const btn = item as ToolbarButton;
                        const Icon = btn.icon;
                        return (
                            <Tooltip key={itemIndex} delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={btn.action}
                                        className={`h-8 w-8 p-0 transition-all ${btn.isActive
                                            ? 'bg-burgundy/20 text-burgundy-light'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    className="glass-strong text-xs"
                                >
                                    {btn.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
