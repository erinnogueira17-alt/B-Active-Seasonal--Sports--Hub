import { Route, Switch } from "wouter";
import { Nav } from "./components/Nav";
import { InstallPrompt } from "./components/InstallPrompt";
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
import { MaintenanceGuide } from "./pages/MaintenanceGuide";
import { NotFound } from "./pages/NotFound";

export default function App() {
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
