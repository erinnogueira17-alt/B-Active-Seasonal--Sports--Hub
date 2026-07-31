import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "installPromptDismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** Slim, dismissible banner inviting the user to install the hub to their home screen. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS has no beforeinstallprompt — show manual Share-sheet steps instead.
    if (isIos()) {
      setIosHint(true);
      setShow(true);
    }

    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl border border-[#f59e0b]/40 bg-neutral-950 p-3 text-white shadow-xl">
        <img src="/pwa-192.png" alt="" className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">Install the Sports Hub app</p>
          {iosHint ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/70">
              Tap <Share className="inline h-3.5 w-3.5" /> then “Add to Home Screen”.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-white/70">Full-screen, fast, right on your home screen.</p>
          )}
        </div>
        {!iosHint && (
          <button className="btn-gold shrink-0 px-3 py-1.5 text-sm" onClick={install}>
            <Download className="h-4 w-4" /> Install
          </button>
        )}
        <button className="shrink-0 rounded p-1 text-white/60 hover:bg-white/10 hover:text-white" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
