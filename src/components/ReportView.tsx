import { useRef, useState } from "react";
import { X, Printer, Image as ImageIcon, FileText } from "lucide-react";
import type { Result } from "../server/db/schema";
import { formatDate } from "../lib/utils";

function weekRange(monday: Date): [Date, Date] {
  const start = new Date(monday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

function parseResult(r: string | null): "win" | "loss" | "draw" | "other" {
  const t = (r ?? "").toLowerCase();
  if (t.includes("win") || t.startsWith("w")) return "win";
  if (t.includes("loss") || t.includes("lose") || t.startsWith("l")) return "loss";
  if (t.includes("draw") || t.startsWith("d")) return "draw";
  const m = t.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > b) return "win";
    if (a < b) return "loss";
    return "draw";
  }
  return "other";
}

function safeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function ReportPage({
  school,
  monday,
  results,
  pageRef,
}: {
  school: string;
  monday: Date;
  results: Result[];
  pageRef?: (el: HTMLDivElement | null) => void;
}) {
  const [start, end] = weekRange(monday);
  const rows = results.filter((r) => {
    const d = new Date(r.date);
    return r.team === school && d >= start && d <= end;
  });
  const wins = rows.filter((r) => parseResult(r.result) === "win").length;
  const losses = rows.filter((r) => parseResult(r.result) === "loss").length;
  const draws = rows.filter((r) => parseResult(r.result) === "draw").length;

  const stats = [
    ["Matches", rows.length],
    ["Wins", wins],
    ["Losses", losses],
    ["Draws", draws],
  ] as const;

  return (
    <div
      ref={pageRef}
      className="print-page mx-auto mb-6 w-[794px] max-w-full bg-white shadow-lg"
    >
      <div className="flex items-center justify-between bg-neutral-950 px-8 py-6 text-white">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="B-Active"
            className="h-12 w-12 rounded object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null;
              t.src = "/logo.svg";
            }}
          />
          <div className="heading text-xl">B-Active</div>
        </div>
        <div className="text-right">
          <div className="heading text-lg">{school}</div>
          <div className="text-sm text-white/70">
            Week of {formatDate(start)} – {formatDate(end)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 px-8 py-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border-2 border-[#f59e0b] p-3 text-center">
            <div className="text-3xl font-extrabold text-[#dc2626]">{value}</div>
            <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="px-8 pb-8">
        {rows.length === 0 ? (
          <div className="rounded border border-dashed p-8 text-center text-neutral-400">
            No results recorded for this week.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#f59e0b]/15 text-left">
                <th className="border-b-2 border-[#f59e0b] px-2 py-2">Sport</th>
                <th className="border-b-2 border-[#f59e0b] px-2 py-2">Team / Age</th>
                <th className="border-b-2 border-[#f59e0b] px-2 py-2">Opposition</th>
                <th className="border-b-2 border-[#f59e0b] px-2 py-2">Result</th>
                <th className="border-b-2 border-[#f59e0b] px-2 py-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-2 py-2">{r.sport}</td>
                  <td className="px-2 py-2">{r.ageGroup || "—"}</td>
                  <td className="px-2 py-2">{r.opposition || "—"}</td>
                  <td className="px-2 py-2 font-semibold">{r.result || "—"}</td>
                  <td className="px-2 py-2 text-neutral-600">{r.feedback || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t bg-neutral-100 px-8 py-3 text-center text-xs text-neutral-500">
        Powered by B-Active
      </div>
    </div>
  );
}

export function ReportView({
  school,
  mondays,
  results,
  onClose,
}: {
  school: string;
  mondays: Date[];
  results: Result[];
  onClose: () => void;
}) {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [busy, setBusy] = useState<"jpeg" | "pdf" | null>(null);
  const single = mondays.length === 1;

  async function downloadJpeg() {
    const node = pageRefs.current[0];
    if (!node) return;
    setBusy("jpeg");
    try {
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(node, { quality: 0.95, backgroundColor: "#ffffff", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${safeName(school)}_Weekly_Results_Roundup.jpg`;
      a.click();
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    setBusy("pdf");
    try {
      const [{ toJpeg }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let first = true;
      for (let i = 0; i < mondays.length; i++) {
        const node = pageRefs.current[i];
        if (!node) continue;
        const dataUrl = await toJpeg(node, { quality: 0.95, backgroundColor: "#ffffff", pixelRatio: 2 });
        if (!first) pdf.addPage();
        first = false;
        // Fit image width to the page, preserving aspect ratio.
        const imgProps = pdf.getImageProperties(dataUrl);
        const h = (imgProps.height * pageW) / imgProps.width;
        pdf.addImage(dataUrl, "JPEG", 0, 0, pageW, Math.min(h, pageH));
      }
      const label = single
        ? `${safeName(school)}_Weekly_Results`
        : `${safeName(school)}_Results_${mondays.length}_Weeks`;
      pdf.save(`${label}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-neutral-200 p-6">
      <div className="no-print mx-auto mb-4 flex w-[794px] max-w-full flex-wrap items-center justify-between gap-2">
        <div className="font-semibold text-neutral-700">
          {school} — {mondays.length} week{mondays.length > 1 ? "s" : ""}
        </div>
        <div className="flex flex-wrap gap-2">
          {single && (
            <button className="btn-gold" onClick={downloadJpeg} disabled={busy !== null}>
              <ImageIcon className="h-4 w-4" /> {busy === "jpeg" ? "Rendering…" : "Download JPEG"}
            </button>
          )}
          <button className="btn-primary" onClick={downloadPdf} disabled={busy !== null}>
            <FileText className="h-4 w-4" /> {busy === "pdf" ? "Rendering…" : "Download PDF"}
          </button>
          <button className="btn-outline" onClick={() => window.print()} disabled={busy !== null}>
            <Printer className="h-4 w-4" /> Print
          </button>
          <button className="btn-outline" onClick={onClose} disabled={busy !== null}>
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      </div>
      {mondays.map((m, i) => (
        <ReportPage
          key={m.toISOString()}
          school={school}
          monday={m}
          results={results}
          pageRef={(el) => (pageRefs.current[i] = el)}
        />
      ))}
    </div>
  );
}
