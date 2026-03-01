'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Award, PenTool } from 'lucide-react';

interface Stats {
    totalWords: number;
    dailyGoal: number;
    todayWords: number;
    streak: number;
}

export function StatsCards() {
    const [stats, setStats] = useState<Stats>({
        totalWords: 0,
        dailyGoal: 500,
        todayWords: 0,
        streak: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const supabase = createClient();

        // 1. Get total words across projects
        const { data: projects } = await supabase
            .from('projects')
            .select('word_count');

        const totalWords = projects?.reduce((sum, p) => sum + (p.word_count || 0), 0) || 0;

        // 2. Get user goals
        const { data: goalData } = await supabase
            .from('user_goals')
            .select('*')
            .single();

        // 3. (Mock) Calculate today's words - ideally need a 'writing_sessions' table
        // For now we'll simulate or just show 0 if no session tracking implemented
        // In a real app we'd log session deltas.
        const todayWords = 0;

        setStats({
            totalWords,
            dailyGoal: goalData?.daily_word_count_goal || 500,
            todayWords,
            streak: goalData?.current_streak || 0,
        });
        setLoading(false);
    };

    if (loading) return <div className="h-32 animate-pulse bg-muted/20 rounded-xl" />;

    const progress = Math.min(100, (stats.todayWords / stats.dailyGoal) * 100);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass border-burgundy/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Palavras</CardTitle>
                    <PenTool className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Em todos os projetos</p>
                </CardContent>
            </Card>

            <Card className="glass border-burgundy/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Meta Diária</CardTitle>
                    <Target className="h-4 w-4 text-burgundy-light" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.todayWords} / {stats.dailyGoal}</div>
                    <Progress value={progress} className="h-2 mt-2 bg-muted theme-progress" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% concluído</p>
                </CardContent>
            </Card>

            <Card className="glass border-burgundy/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sequência de Escrita</CardTitle>
                    <TrendingUp className="h-4 w-4 text-gold" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.streak} Dias</div>
                    <p className="text-xs text-muted-foreground">Mantenha o ritmo!</p>
                </CardContent>
            </Card>

            <Card className="glass border-burgundy/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nível</CardTitle>
                    <Award className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Iniciante</div>
                    <p className="text-xs text-muted-foreground">Escreva mais 5k para subir de nível</p>
                </CardContent>
            </Card>
        </div>
    );
}
