import { Route, Switch } from "wouter";
import { Nav } from "./components/Nav";
import { InstallPrompt } from "./components/InstallPrompt";
import { useAuth } from "./lib/useAuth";
import { Loading } from "./components/ui";
import { Home } from "./pages/Home";
import { Allocations } from "./pages/Allocations";
import { Results } from "./pages/Results";
import { Resources } from "./pages/Resources";
import { Gallery } from "./pages/Gallery";
import { Log } from "./pages/Log";
import { SubmitPlanner } from "./pages/SubmitPlanner";
import { Tutorial } from "./pages/Tutorial";
import { Welcome } from "./pages/Welcome";
import { Login } from "./pages/Login";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ManageEvents } from "./pages/ManageEvents";
import { ManageResources } from "./pages/ManageResources";
import { ManageCoaches } from "./pages/ManageCoaches";
import { PlannerAnalytics } from "./pages/PlannerAnalytics";
import { ManageAccounts } from "./pages/ManageAccounts";
import { MaintenanceGuide } from "./pages/MaintenanceGuide";
import { NotFound } from "./pages/NotFound";

export default function App() {
  const { isLoading, isAuthed } = useAuth();

  // Whole site requires login — coach or admin. No anonymous access.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }
  if (!isAuthed) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="no-print border-b-2 border-[#f59e0b] bg-neutral-950">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
            <img
              src="/logo.jpg"
              alt="B-Active"
              className="h-9 w-9 rounded object-cover"
              onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = "/logo.svg"; }}
            />
            <span className="heading text-white">Seasonal Sports Hub</span>
          </div>
        </header>
        <main className="flex flex-1 items-start justify-center py-10">
          <Login />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/allocations" component={Allocations} />
          <Route path="/results" component={Results} />
          <Route path="/resources" component={Resources} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/log" component={Log} />
          <Route path="/submit-planner" component={SubmitPlanner} />
          <Route path="/tutorial" component={Tutorial} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/login" component={Login} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/manage-events" component={ManageEvents} />
          <Route path="/manage-resources" component={ManageResources} />
          <Route path="/manage-coaches" component={ManageCoaches} />
          <Route path="/planner-analytics" component={PlannerAnalytics} />
          <Route path="/manage-accounts" component={ManageAccounts} />
          <Route path="/maintenance-guide" component={MaintenanceGuide} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <InstallPrompt />
    </div>
  );
}

function Footer() {
  return (
    <footer className="no-print mt-12 border-t-2 border-[#f59e0b] bg-neutral-950 py-8 text-center text-sm text-white/70">
      <div className="mx-auto max-w-6xl px-4">
        <div className="heading text-white">The B-Active Group</div>
        <p className="mt-1">Seasonal Sports Hub — Powered by B-Active</p>
      </div>
    </footer>
  );
}
