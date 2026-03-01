export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-midnight-gradient overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Top-right glow */}
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-burgundy opacity-10 blur-[120px] animate-pulse-glow" />
                {/* Bottom-left glow */}
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-deep opacity-15 blur-[120px]" />
                {/* Center subtle glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-burgundy opacity-5 blur-[200px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md px-4">
                {children}
            </div>
        </div>
    );
}
