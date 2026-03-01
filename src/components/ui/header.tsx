'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Settings, User, CreditCard, LogOut, Menu, LayoutDashboard, FolderOpen, BookOpen } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Profile } from '@/lib/database.types';

const navItems = [
    { label: 'Painel', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projetos', href: '/projects', icon: FolderOpen },
    { label: 'Configurações', href: '/settings', icon: Settings },
];

export function Header() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (data) setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const initials = profile?.full_name
        ? profile.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '?';

    const planColors: Record<string, string> = {
        free: 'bg-muted text-muted-foreground',
        pro: 'bg-burgundy/20 text-burgundy-light border-burgundy/30',
        creator: 'bg-gold/20 text-gold border-gold/30',
    };

    return (
        <header className="h-16 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="p-2 -ml-2 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors">
                                <Menu className="w-5 h-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r border-sidebar-border h-full flex flex-col">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                            </SheetHeader>
                            {/* Logo */}
                            <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
                                <div className="p-1.5 rounded-lg bg-burgundy/20 shrink-0">
                                    <BookOpen className="w-5 h-5 text-burgundy-light" />
                                </div>
                                <span className="text-lg font-bold text-foreground tracking-tight whitespace-nowrap">
                                    Midnight <span className="text-burgundy-light">AI</span>
                                </span>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
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
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Sign out */}
                            <div className="px-3 pb-4 pt-4 border-t border-sidebar-border/50 shrink-0">
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleSignOut();
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                                >
                                    <LogOut className="w-5 h-5 shrink-0" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Credits */}
                {profile && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Créditos:</span>
                        <Badge
                            variant="outline"
                            className="text-gold border-gold/30 bg-gold/10"
                        >
                            {profile.credits}
                        </Badge>
                    </div>
                )}

                {/* Plan badge */}
                {profile && (
                    <Badge
                        variant="outline"
                        className={`capitalize ${planColors[profile.plan] || ''}`}
                    >
                        {profile.plan}
                    </Badge>
                )}

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-sidebar-accent transition-colors">
                            <Avatar className="w-8 h-8 border border-burgundy/30">
                                <AvatarFallback className="bg-burgundy/20 text-burgundy-light text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {profile && (
                                <span className="text-sm text-foreground font-medium max-w-[120px] truncate hidden md:block">
                                    {profile.full_name || 'Escritor'}
                                </span>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-48 glass-strong border-burgundy/20"
                    >
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <CreditCard className="w-4 h-4" />
                            Faturamento
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
