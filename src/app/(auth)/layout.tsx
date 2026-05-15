export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-card-foreground p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
