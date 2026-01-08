"use client";

function ElegantShapeWrapper({
    className,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
    style,
}: {
    className?: string;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div className={className} style={style}>
            <div
                style={{
                    width,
                    height,
                    transform: `rotate(${rotate}deg)`,
                }}
                className="relative"
            >
                <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r to-transparent ${gradient} backdrop-blur-[2px] border-2 border-white/[0.15] dark:border-white/[0.05] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.05)] after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]`}
                />
            </div>
        </div>
    );
}

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Animated Background Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <ElegantShapeWrapper
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.08] dark:from-indigo-500/[0.15]"
          className="absolute left-[-10%] md:left-[-5%] top-[15%] md:top-[20%] animate-float"
        />
        <ElegantShapeWrapper
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.08] dark:from-rose-500/[0.15]"
          className="absolute right-[-5%] md:right-[0%] top-[70%] md:top-[75%] animate-float"
          style={{ animationDelay: '2s' } as React.CSSProperties}
        />
        <ElegantShapeWrapper
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.08] dark:from-violet-500/[0.15]"
          className="absolute left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%] animate-float"
          style={{ animationDelay: '4s' } as React.CSSProperties}
        />
        <ElegantShapeWrapper
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.08] dark:from-amber-500/[0.15]"
          className="absolute right-[15%] md:right-[20%] top-[10%] md:top-[15%] animate-float"
          style={{ animationDelay: '1s' } as React.CSSProperties}
        />
        <ElegantShapeWrapper
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.08] dark:from-cyan-500/[0.15]"
          className="absolute left-[20%] md:left-[25%] top-[5%] md:top-[10%] animate-float"
          style={{ animationDelay: '3s' } as React.CSSProperties}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03] dark:from-indigo-500/[0.05] dark:to-rose-500/[0.05] blur-3xl" />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
