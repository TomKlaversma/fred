export default function LeadsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track your leads.
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
          Add Lead
        </button>
      </div>

      {/* Placeholder for data table — will use Orval-generated hooks */}
      <div className="mt-6 rounded-lg border border-border">
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No leads yet. Import leads or create your first campaign to get
          started.
        </div>
      </div>
    </div>
  );
}
