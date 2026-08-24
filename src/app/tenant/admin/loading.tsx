export default function TenantAdminLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="h-16 border-b border-border bg-card/50 px-6" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted/60"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
      </div>
    </div>
  );
}
