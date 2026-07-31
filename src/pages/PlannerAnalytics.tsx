import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import { AdminOnly } from "../components/Guards";
import { TERMS, type Term, formatDate, formatDateTime } from "../lib/utils";
import { allMondaysForAnalytics, isoDate, mondayOf } from "../lib/dates";
import { Loading, PageContainer, PageHeader, StatCard, TermTabs } from "../components/ui";

export function PlannerAnalytics() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  const [term, setTerm] = useState<Term>("term3");
  const mondays = useMemo(() => allMondaysForAnalytics().reverse(), []); // newest first
  const [week, setWeek] = useState(() => isoDate(mondayOf(new Date())));

  const roster = trpc.coaches.list.useQuery({ term });
  const all = trpc.planner.listAll.useQuery({ term });
  const byWeek = trpc.planner.listByWeek.useQuery({ weekDate: new Date(week + "T00:00:00") });
  const history = trpc.pointsHistory.list.useQuery({ term });

  const submittedNames = useMemo(
    () => new Set((byWeek.data ?? []).map((s) => s.coachName.toLowerCase())),
    [byWeek.data],
  );
  const rosterList = roster.data ?? [];
  const missing = rosterList.filter((c) => !submittedNames.has(c.name.toLowerCase()));

  const uniqueEver = useMemo(
    () => new Set((all.data ?? []).map((s) => s.coachName.toLowerCase())).size,
    [all.data],
  );
  const compliancePct = rosterList.length
    ? Math.round((submittedNames.size / rosterList.length) * 100)
    : 0;

  // Weekly submissions (last 12 weeks of the term)
  const weeklyData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of all.data ?? []) {
      const key = isoDate(mondayOf(new Date(s.weekDate)));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([k, v]) => ({ week: formatDate(new Date(k + "T00:00:00"), { month: "short", day: "numeric" }), count: v }));
  }, [all.data]);

  // Time-of-day distribution
  const hourData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}`, count: 0 }));
    for (const s of all.data ?? []) {
      if (!s.submittedAt) continue;
      const h = new Date(s.submittedAt).getHours();
      buckets[h].count++;
    }
    return buckets;
  }, [all.data]);

  const pieData = [
    { name: "Submitted", value: submittedNames.size },
    { name: "Missing", value: Math.max(missing.length, 0) },
  ];

  if (roster.isLoading || all.isLoading) return <PageContainer><Loading /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Planner Analytics" subtitle="Submission compliance and trends by term." />
      <TermTabs value={term} onChange={setTerm} />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Selected week</label>
          <select className="input" value={week} onChange={(e) => setWeek(e.target.value)}>
            {mondays.map((m) => <option key={m.toISOString()} value={isoDate(m)}>Week of {formatDate(m)}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total submissions" value={all.data?.length ?? 0} />
        <StatCard label="Coaches registered" value={rosterList.length} />
        <StatCard label="Unique coaches ever" value={uniqueEver} />
        <StatCard label="Compliance (selected week)" value={`${compliancePct}%`} accent="text-[#dc2626]" />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <ChartCard title="Weekly submissions">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Time of day">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" fontSize={10} interval={2} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Compliance (selected week)">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} label>
                <Cell fill="#16a34a" />
                <Cell fill="#e5e7eb" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="heading mb-3 text-sm text-green-700">Submitted ({submittedNames.size})</h3>
          <ul className="space-y-1 text-sm">
            {(byWeek.data ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span>{s.coachName}</span>
                <span className="flex items-center gap-2 text-neutral-400">
                  {s.submittedAt && formatDateTime(s.submittedAt)}
                  <a href={s.plannerUrl} target="_blank" rel="noreferrer" className="text-[#dc2626] underline">link</a>
                  <DeleteSub id={s.id} />
                </span>
              </li>
            ))}
            {(byWeek.data?.length ?? 0) === 0 && <li className="text-neutral-400">None yet.</li>}
          </ul>
        </div>
        <div className="card p-4">
          <h3 className="heading mb-3 text-sm text-[#dc2626]">Missing ({missing.length})</h3>
          <ul className="grid grid-cols-2 gap-1 text-sm">
            {missing.map((c) => <li key={c.id}>{c.name}</li>)}
            {missing.length === 0 && <li className="text-neutral-400">Everyone submitted 🎉</li>}
          </ul>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="heading mb-3 text-xl">All Submissions</h3>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950 text-white">
              <tr>
                <th className="px-3 py-2">Coach</th>
                <th className="px-3 py-2">Week</th>
                <th className="px-3 py-2">Submitted</th>
                <th className="px-3 py-2">Planner</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(all.data ?? []).map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{s.coachName}</td>
                  <td className="px-3 py-2">{formatDate(s.weekDate)}</td>
                  <td className="px-3 py-2">{s.submittedAt && formatDateTime(s.submittedAt)}</td>
                  <td className="px-3 py-2"><a href={s.plannerUrl} target="_blank" rel="noreferrer" className="text-[#dc2626] underline">open</a></td>
                  <td className="px-3 py-2"><DeleteSub id={s.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="heading mb-3 text-xl">Points History</h3>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950 text-white">
              <tr>
                <th className="px-3 py-2">Coach</th>
                <th className="px-3 py-2">Points</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Week</th>
                <th className="px-3 py-2">Awarded</th>
              </tr>
            </thead>
            <tbody>
              {(history.data ?? []).map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{h.coachName}</td>
                  <td className="px-3 py-2 font-semibold">+{h.points}</td>
                  <td className="px-3 py-2">{h.reason}</td>
                  <td className="px-3 py-2">{formatDate(h.weekDate)}</td>
                  <td className="px-3 py-2">{h.awardedAt && formatDateTime(h.awardedAt)}</td>
                </tr>
              ))}
              {(history.data?.length ?? 0) === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-neutral-400">No points awarded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="heading mb-2 text-sm text-neutral-600">{title}</h3>
      {children}
    </div>
  );
}

function DeleteSub({ id }: { id: number }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const del = trpc.planner.delete.useMutation({
    onSuccess: () => { utils.planner.listAll.invalidate(); utils.planner.listByWeek.invalidate(); toast("Deleted"); },
    onError: (e) => toast(e.message, "error"),
  });
  return (
    <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => { if (confirm("Delete submission?")) del.mutate({ id }); }}>
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
