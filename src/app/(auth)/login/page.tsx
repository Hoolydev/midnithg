'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('Ocorreu um erro inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-up">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-burgundy/20 glow-burgundy">
                        <BookOpen className="w-8 h-8 text-burgundy-light" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Midnight <span className="text-burgundy-light">AI</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Seu companheiro de escrita com IA
                </p>
            </div>

            {/* Login Card */}
            <div className="glass-strong rounded-2xl p-8 glow-burgundy">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <h2 className="text-lg font-semibold text-foreground">Bem-vindo de volta</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm text-muted-foreground">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="writer@midnight.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50 focus:ring-burgundy/30 placeholder:text-muted-foreground/40 h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm text-muted-foreground">
                            Senha
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50 focus:ring-burgundy/30 placeholder:text-muted-foreground/40 h-11 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-burgundy-gradient hover:opacity-90 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-burgundy/25"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Entrando...
                            </div>
                        ) : (
                            'Entrar'
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Não tem uma conta?{' '}
                        <Link
                            href="/register"
                            className="text-burgundy-light hover:text-gold transition-colors font-medium"
                        >
                            Crie uma
                        </Link>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground/50 mt-6">
                Transforme suas ideias em livros profissionais
            </p>
        </div>
    );
}
