'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    BookOpen,
    LayoutDashboard,
    FolderOpen,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
    {
        label: 'Painel',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Projetos',
        href: '/projects',
        icon: FolderOpen,
    },
    {
        label: 'Configurações',
        href: '/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside
            className={`relative flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden md:flex ${collapsed ? 'w-[68px]' : 'w-[240px]'
                }`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
                <div className="p-1.5 rounded-lg bg-burgundy/20 shrink-0">
                    <BookOpen className="w-5 h-5 text-burgundy-light" />
                </div>
                {!collapsed && (
                    <span className="text-lg font-bold text-foreground tracking-tight whitespace-nowrap">
                        Midnight <span className="text-burgundy-light">AI</span>
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/');

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-burgundy/15 text-burgundy-light glow-burgundy'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                                }`}
                        >
                            <Icon
                                className={`w-5 h-5 shrink-0 transition-colors ${isActive
                                    ? 'text-burgundy-light'
                                    : 'text-muted-foreground group-hover:text-foreground'
                                    }`}
                            />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="glass-strong">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return linkContent;
                })}
            </nav>

            {/* Upgrade banner (show only when expanded) */}
            {!collapsed && (
                <div className="mx-3 mb-3 p-3 rounded-xl bg-burgundy/10 border border-burgundy/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span className="text-xs font-semibold text-gold">Plano</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Desbloqueie projetos ilimitados, ilustrações com IA e exportação premium.
                    </p>
                    <Button
                        size="sm"
                        className="w-full mt-2 h-7 text-xs bg-burgundy-gradient hover:opacity-90 text-white"
                    >
                        Seja Pro
                    </Button>
                </div>
            )}

            {/* Sign out */}
            <div className="px-3 pb-3">
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            {!collapsed && <span>Sign Out</span>}
                        </button>
                    </TooltipTrigger>
                    {collapsed && (
                        <TooltipContent side="right" className="glass-strong">
                            Sign Out
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
            >
                {collapsed ? (
                    <ChevronRight className="w-3 h-3" />
                ) : (
                    <ChevronLeft className="w-3 h-3" />
                )}
            </button>
        </aside>
    );
}
