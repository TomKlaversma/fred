export default function DashboardPage() {
  const stats = [
    { label: "Total Leads", value: "0", description: "Across all campaigns" },
    { label: "Active Campaigns", value: "0", description: "Currently running" },
    { label: "Conversion Rate", value: "0%", description: "Last 30 days" },
    { label: "Pipeline Status", value: "$0", description: "Total value" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview of your sales pipeline and campaigns.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-background p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
