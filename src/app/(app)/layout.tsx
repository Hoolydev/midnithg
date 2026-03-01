import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/ui/header';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TooltipProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
                </div>
            </div>
        </TooltipProvider>
    );
}
