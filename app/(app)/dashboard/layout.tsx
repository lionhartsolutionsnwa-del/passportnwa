import DashboardTabs from "./dashboard-tabs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="eyebrow">Concierge</div>
        <h1 className="headline text-3xl mt-2">Restaurant dashboard</h1>
      </header>
      <DashboardTabs />
      {children}
    </div>
  );
}
