'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Eye, EyeOff, Crown, Sparkles, Zap, Check } from 'lucide-react';

const plans = [
    {
        id: 'free',
        name: 'Grátis',
        icon: Sparkles,
        price: '$0',
        features: ['1 projeto', 'Escrita básica', 'Palavras limitadas'],
        color: 'text-muted-foreground',
        borderColor: 'border-border',
        bgColor: 'bg-midnight/30',
    },
    {
        id: 'pro',
        name: 'Pro',
        icon: Zap,
        price: '$19/mês',
        features: ['Projetos ilimitados', 'Exportação completa', 'Ilustrações com IA'],
        color: 'text-burgundy-light',
        borderColor: 'border-burgundy/30',
        bgColor: 'bg-burgundy/5',
        popular: true,
    },
    {
        id: 'creator',
        name: 'Criador',
        icon: Crown,
        price: '$39/mês',
        features: ['Tudo do Pro', 'Ilustrações ilimitadas', 'Análise de mercado'],
        color: 'text-gold',
        borderColor: 'border-gold/30',
        bgColor: 'bg-gold/5',
    },
];

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('free');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                setError(error.message);
            } else {
                // Update profile with selected plan
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('profiles')
                        .update({ plan: selectedPlan })
                        .eq('id', user.id);
                }
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
        <div className="animate-fade-in-up max-w-lg mx-auto">
            {/* Logo */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-burgundy/20 glow-burgundy">
                        <BookOpen className="w-7 h-7 text-burgundy-light" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Junte-se ao Midnight <span className="text-burgundy-light">AI</span>
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Comece sua jornada de escrita
                </p>
            </div>

            {/* Register Card */}
            <div className="glass-strong rounded-2xl p-6 glow-burgundy">
                <form onSubmit={handleRegister} className="space-y-5">
                    {/* Name & Email */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm text-muted-foreground">
                                Nome Completo
                            </Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Seu nome"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50 focus:ring-burgundy/30 placeholder:text-muted-foreground/40 h-10"
                            />
                        </div>

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
                                className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50 focus:ring-burgundy/30 placeholder:text-muted-foreground/40 h-10"
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
                                    placeholder="Mínimo de 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50 focus:ring-burgundy/30 placeholder:text-muted-foreground/40 h-10 pr-10"
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
                    </div>

                    {/* Plan Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground">Escolha seu plano</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {plans.map((plan) => {
                                const Icon = plan.icon;
                                const isSelected = selectedPlan === plan.id;
                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative p-3 rounded-xl border text-left transition-all duration-300 ${isSelected
                                            ? `${plan.borderColor} ${plan.bgColor} scale-[1.02]`
                                            : 'border-border/50 bg-midnight/20 hover:border-border'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-burgundy-gradient text-white px-2 py-0.5 rounded-full">
                                                Popular
                                            </span>
                                        )}
                                        <Icon className={`w-4 h-4 mb-2 ${plan.color}`} />
                                        <p className={`text-sm font-semibold ${plan.color}`}>{plan.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{plan.price}</p>
                                        <ul className="mt-2 space-y-1">
                                            {plan.features.map((f) => (
                                                <li key={f} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Check className="w-2.5 h-2.5 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                );
                            })}
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
                                Criando conta...
                            </div>
                        ) : (
                            'Criar Conta'
                        )}
                    </Button>
                </form>

                <div className="mt-5 text-center">
                    <p className="text-sm text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link
                            href="/login"
                            className="text-burgundy-light hover:text-gold transition-colors font-medium"
                        >
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
