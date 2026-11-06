"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DISEASES, SAMPLES, getDisease, type Disease } from "@/lib/diseases";
import { Leaf, Upload, ScanLine, BrainCircuit, ShieldCheck, Activity, History, BookOpen, BarChart3, X, Check, AlertTriangle, Droplets, FlaskConical, Sprout, Bug, MapPin, User, Trash2, Search, ChevronRight, Sparkles, Camera, RefreshCw, Phone, Clock, TrendingUp, Microscope, Layers, Cpu, Zap, Award, FileImage, Eye, ThumbsUp, ThumbsDown, MessageCircle, Sun, CloudRain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";

type Result = { disease: Disease; confidence: number; severity: string; severityScore: number; health: number; affected: number; predictions: { label: string; confidence: number }[]; scanId?: number; image: string; fileName: string; green: number; brown: number; yellow: number };

const NAV = [
  { id: "detect", label: "Detect Disease", icon: ScanLine },
  { id: "library", label: "Disease Library", icon: BookOpen },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "model", label: "RiceLeafXNet Model", icon: BrainCircuit },
  { id: "history", label: "Scan History", icon: History },
] as const;

const STEPS = ["Preprocessing 224×224 • Normalisation", "RiceLeafXNet Backbone — Feature Extraction", "CBAM Attention — Lesion Localisation", "Classification Head — 9 Classes", "Severity Estimation & Remedy Retrieval"];

function sevColor(s: string) { return s === "Critical" ? "#dc2626" : s === "High" ? "#ea580c" : s === "Moderate" ? "#d97706" : s === "Low" ? "#65a30d" : "#16a34a"; }

export default function Page() {
const router = useRouter();
const { data: authSession, isPending: authPending } = authClient.useSession();
  const [tab, setTab] = useState<string>("detect");
 const [preview, setPreview] = useState<string>("/images/healthy-rice.png");
const [fileName, setFileName] = useState("healthy-rice.png");
  const [drag, setDrag] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [remedyTab, setRemedyTab] = useState<"chemical" | "organic" | "cultural">("chemical");
  const [showHeat, setShowHeat] = useState(true);
  const [scans, setScans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState<Disease | null>(null);
  const [farmer, setFarmer] = useState("Rahim Uddin");
  const [location, setLocation] = useState("Mymensingh, Bangladesh");
  const [fieldId, setFieldId] = useState("Field A-12");
  const [toast, setToast] = useState("");
  const [consult, setConsult] = useState(false);
  const [cForm, setCForm] = useState({ farmerName: "Rahim Uddin", phone: "", location: "Mymensingh, Bangladesh", question: "", urgency: "Medium", diseaseName: "" });
  const fileRef = useRef<HTMLInputElement>(null);

 const loadData = useCallback(async () => {
  if (!authSession) {
    setScans([]);
    setStats(null);
    return;
  }

  try {
    const [scansResponse, statsResponse] = await Promise.all([
      fetch("/api/scans?limit=60"),
      fetch("/api/stats"),
    ]);

    if (scansResponse.status === 401 || statsResponse.status === 401) {
      router.push("/login");
      return;
    }

    if (!scansResponse.ok || !statsResponse.ok) {
      throw new Error("Unable to load account data");
    }

    const a = await scansResponse.json();
    const b = await statsResponse.json();

    setScans(a.scans || []);
    setStats(b);
  } catch (error) {
    console.error("Load account data error:", error);
  }
}, [authSession, router]);

useEffect(() => {
  if (!authPending && authSession) {
    loadData();
  }
}, [authPending, authSession, loadData]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 3200); return () => clearTimeout(t); } }, [toast]);

  async function analyze(src: string, forcedId?: string, name?: string) {
    if (authPending) return;

    if (!authSession) {
      router.push("/login");
      return;
    }

    setAnalyzing(true); setResult(null); setStep(0);
    for (let i = 0; i < STEPS.length; i++) { setStep(i); await new Promise(r => setTimeout(r, 520)); }

    let green = 60, brown = 15, yellow = 10;
    try {
      const img = new Image(); img.crossOrigin = "anonymous";
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
      const c = document.createElement("canvas"); c.width = 100; c.height = 100;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, 100, 100);
      const d = ctx.getImageData(0, 0, 100, 100).data;
      let g = 0, br = 0, y = 0, tot = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gg = d[i + 1], b = d[i + 2];
        tot++;
        if (gg > r + 15 && gg > b + 10 && gg > 60) g++;
        else if (r > 80 && r > gg + 8 && gg < 140) br++;
        else if (r > 130 && gg > 110 && b < 100) y++;
      }
      green = Math.round(g / tot * 100);
      brown = Math.round(br / tot * 100);
      yellow = Math.round(y / tot * 100);
    } catch {}


const hash = Math.abs((name || src).split("").reduce((a, ch) => a * 33 + ch.charCodeAt(0), 9));

let diseaseId = forcedId;
let confidence = 0;
let predictions: { label: string; confidence: number }[] = [];

if (forcedId) {
  // Keep existing sample buttons as demo mode
  const sampleDisease = getDisease(forcedId);
  confidence = sampleDisease.id === "healthy"
    ? 97.5 + (hash % 20) / 10
    : 89.0 + (hash % 90) / 10;

  const others = DISEASES
    .filter(d => d.id !== sampleDisease.id)
    .sort((a, b) => ((hash + a.id.length) % 7) - ((hash + b.id.length) % 7))
    .slice(0, 3);

  const rest = 100 - confidence;

  predictions = [
    { label: sampleDisease.name, confidence: +confidence.toFixed(1) },
    ...others.map((o, i) => ({
      label: o.name,
      confidence: +(rest * (0.6 - i * 0.18)).toFixed(1)
    }))
  ];
} else {
  // Real image prediction using Random Forest V3
  try {
    const imageResponse = await fetch(src);

    if (!imageResponse.ok) {
      throw new Error("Cannot read selected image");
    }

    const imageBlob = await imageResponse.blob();
    const formData = new FormData();

    formData.append("file", imageBlob, name || "rice-leaf.jpg");

    const predictionResponse = await fetch("/api/predict", {
      method: "POST",
      body: formData
    });

    const prediction = await predictionResponse.json();

    if (!predictionResponse.ok || !prediction.success) {
      throw new Error(prediction.error || prediction.detail || "Prediction failed");
    }

    diseaseId = prediction.diseaseId;
    confidence = Number(prediction.confidence);

    predictions = prediction.predictions.map(
      (item: { label: string; confidence: number }) => ({
        label: getDisease(item.label).name,
        confidence: Number(item.confidence)
      })
    );
  } catch (error) {
    console.error("RiceLeaf AI prediction error:", error);
    setAnalyzing(false);
    setToast("Prediction failed. Please check the AI server.");
    return;
  }
}

const disease = getDisease(diseaseId || "healthy");
const isHealthy = disease.id === "healthy";

const affected = isHealthy
  ? Math.max(1, brown + yellow)
  : Math.min(85, Math.max(12, brown + yellow));

const severityScore = isHealthy
  ? affected
  : Math.min(98, affected + 22);

const severity = isHealthy
  ? "None"
  : severityScore > 72
    ? "Critical"
    : severityScore > 54
      ? "High"
      : severityScore > 35
        ? "Moderate"
        : "Low";

const res: Result = {
  disease,
  confidence: +confidence.toFixed(1),
  severity,
  severityScore,
  health: Math.max(5, 100 - severityScore),
  affected: +affected.toFixed(1),
  predictions,
  image: src,
  fileName: name || fileName,
  green,
  brown,
  yellow
};


   try {
  const saveResponse = await fetch("/api/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageName: res.fileName,
      diseaseId: disease.id,
      diseaseName: disease.name,
      confidence: res.confidence,
      severity,
      severityScore,
      leafHealthScore: res.health,
      affectedArea: res.affected,
      location,
      farmerName: farmer,
      fieldId,
      isHealthy,
      topPredictions: predictions,
    }),
  });

  const saved = await saveResponse.json();

  if (saveResponse.status === 401) {
    setToast("Please log in to save your prediction.");
    router.push("/login");
  } else if (!saveResponse.ok || !saved.scan) {
    setToast("Prediction completed, but the result could not be saved.");
  } else {
    res.scanId = saved.scan.id;
    await loadData();
  }
} catch (error) {
  console.error("Save prediction error:", error);
  setToast("Prediction completed, but the result could not be saved.");
}
    setResult(res);
    setAnalyzing(false);
    setToast(`RiceLeafXNet: ${disease.name} detected (${res.confidence}%)`);
  }

 function onFile(file: File) {
  const url = URL.createObjectURL(file);
  setPreview(url);
  setFileName(file.name);
  setResult(null);
}
 async function feedback(id: number, fb: string) {
  try {
    const response = await fetch(`/api/scans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: fb }),
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setToast("Unable to update feedback. Please try again.");
      return;
    }

    setToast(
      fb === "correct"
        ? "Thanks! Feedback helps retrain RiceLeafXNet"
        : "Feedback recorded — our agronomist will review"
    );

    await loadData();
  } catch (error) {
    console.error("Feedback error:", error);
    setToast("Unable to update feedback. Please try again.");
  }
}

async function delScan(id: number) {
  try {
    const response = await fetch(`/api/scans/${id}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setToast("Unable to delete scan. Please try again.");
      return;
    }

    setToast("Scan deleted");
    await loadData();
  } catch (error) {
    console.error("Delete scan error:", error);
    setToast("Unable to delete scan. Please try again.");
  }
}
  async function submitConsult() { await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...cForm, diseaseName: cForm.diseaseName || result?.disease.name || "", scanId: result?.scanId || null }) }); setConsult(false); setToast("Consultation booked — agronomist will call within 4 hours"); loadData(); }

  const filtered = DISEASES.filter(d => (typeFilter === "All" || d.type === typeFilter) && (d.name.toLowerCase().includes(search.toLowerCase()) || d.scientific.toLowerCase().includes(search.toLowerCase())));
  const diseaseChart = stats?.byDisease ? Object.entries(stats.byDisease).map(([name, value]) => ({ name: name.replace("Bacterial Leaf Blight", "Bacterial Blight"), value })) : DISEASES.slice(1, 6).map(d => ({ name: d.name, value: 0 }));
  const dayChart = stats?.byDay && Object.keys(stats.byDay).length ? Object.entries(stats.byDay).slice(-10).map(([name, scans]) => ({ name, scans })) : [{ name: "No data", scans: 0 }];
  const COLORS = ["#16a34a", "#dc2626", "#d97706", "#0e7490", "#7c2d12", "#65a30d", "#9d174d", "#475569"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-[#0d3b21] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-[#0d3b21]"><Leaf className="h-6 w-6" /></div>
            <div><p className="text-lg font-black leading-none tracking-tight">RiceLeaf<span className="text-amber-400">XNet</span></p><p className="text-[11px] text-emerald-200">AI Rice Disease Detection & Remedies • Machine Learning</p></div>
          </div>

{!authPending && (
  authSession ? (
    <button
      onClick={async () => {
        await authClient.signOut();
        setScans([]);
        setStats(null);
        setTab("detect");
        router.refresh();
        router.push("/");
      }}
      className="shrink-0 rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-[#0d3b21] transition hover:bg-amber-300"
    >
      Logout
    </button>
  ) : (
    <button
      onClick={() => router.push("/login")}
      className="shrink-0 rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-[#0d3b21] transition hover:bg-amber-300"
    >
      Login / Register
    </button>
  )
)}

          </div>
        <nav className="border-t border-white/10"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
        {NAV.map(n => <button key={n.id} onClick={() => {
  if ((n.id === "dashboard" || n.id === "history") && authPending) return;
  if ((n.id === "dashboard" || n.id === "history") && !authSession) {
    router.push("/login");
    return;
  }
  setTab(n.id);
}} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition ${tab === n.id ? "bg-white text-[#0d3b21]" : "text-emerald-100 hover:bg-white/10"}`}><n.icon className="h-4 w-4" />{n.label}</button>)}
        </div></nav>
      </header>

      {toast && <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#0d3b21] px-4 py-3 text-sm font-semibold text-white shadow-2xl"><Check className="h-4 w-4 text-amber-400" />{toast}</div>}

      <main className="mx-auto max-w-7xl px-4 py-8">
        {tab === "detect" && (
          <div id="detector">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-lg font-black"><Camera className="h-5 w-5 text-emerald-700" /> Leaf Image Diagnosis</h2>
                <p className="text-sm text-slate-500">Take a clear close-up of a single leaf in daylight. Avoid shadows.</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <label className="col-span-1"><span className="mb-1 flex items-center gap-1 text-[11px] font-bold text-slate-500"><User className="h-3 w-3" /> FARMER</span><input value={farmer} onChange={e => setFarmer(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-600" /></label>
                  <label><span className="mb-1 flex items-center gap-1 text-[11px] font-bold text-slate-500"><MapPin className="h-3 w-3" /> LOCATION</span><input value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-600" /></label>
                  <label><span className="mb-1 text-[11px] font-bold text-slate-500">FIELD ID</span><input value={fieldId} onChange={e => setFieldId(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-600" /></label>
                </div>

                <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }} onClick={() => fileRef.current?.click()} className={`relative mt-4 flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${drag ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}>


{preview && preview !== "sample" ? (
  <div className="absolute inset-0">
    <img
      src={preview}
      alt="Rice leaf"
      className="h-full w-full bg-slate-100 object-contain"
    />

    {preview === "/images/healthy-rice.png" && (
      <div className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-4 text-center text-white">
        <p className="text-base font-bold">
          Choose a Rice Leaf Image
        </p>
        <p className="mt-1 text-xs">
          Upload your own image to detect rice leaf diseases.
        </p>
        <p className="mt-2 text-xs font-semibold text-amber-300">
          Click here to upload
        </p>
      </div>
    )}
  </div>
) : (
  <div className="flex flex-col items-center justify-center p-4 text-center">
    <FileImage className="h-12 w-12 text-emerald-700" />
    <p className="mt-2 text-sm font-bold text-slate-700">
      {fileName}
    </p>
    <p className="text-xs text-slate-400">
      Click or drop a leaf file here
    </p>
  </div>
)}

                  {analyzing && <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-white"><BrainCircuit className="h-10 w-10 animate-pulse" /><p className="mt-2 text-sm font-bold">RiceLeafXNet is analysing…</p><p className="text-xs text-amber-300">{STEPS[step]}</p></div>}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                </div>

                <button disabled={analyzing} onClick={() => analyze(preview || "sample", undefined, fileName)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#0d3b21] py-3.5 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60">{analyzing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analysing leaf…</> : <><ScanLine className="h-4 w-4 text-amber-400" /> Run RiceLeafXNet Diagnosis</>}</button>

                <p className="mt-5 text-xs font-black tracking-wide text-slate-400">TRY SAMPLE LEAVES — INSTANT DEMO</p>
                <div className="mt-2 grid grid-cols-4 gap-2">{SAMPLES.map(s => <button key={s.id} onClick={() => { setPreview("sample"); setFileName(s.label); analyze("sample", s.diseaseId, s.label); }} className="rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-emerald-100 transition">{s.label}</button>)}</div>
              </div>

              <div>
                {!result && !analyzing && <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center"><div className="relative"><span className="absolute inset-0 rounded-full bg-emerald-200" /><span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#0d3b21] text-amber-400"><Microscope className="h-9 w-9" /></span></div><h3 className="mt-5 text-xl font-black">Waiting for a leaf</h3><p className="mt-2 max-w-sm text-sm text-slate-500">Select a sample or upload data. RiceLeafXNet will classify the disease and prescribe a complete remedy plan.</p></div>}

                {result && (
                  <div className="space-y-4">
                    <div className="rounded-3xl p-5 text-white shadow-lg" style={{ background: result.disease.color }}>
                      <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-widest opacity-80">{result.disease.type} • {result.disease.scientific}</p><h3 className="mt-1 text-3xl font-black">{result.disease.name}</h3><p className="mt-1 text-sm opacity-90">{result.disease.description}</p></div><span className="rounded-2xl bg-white/20 px-3 py-2 text-center"><span className="block text-xl font-black">{result.confidence}%</span><span className="text-[10px] font-bold">CONFIDENCE</span></span></div>
                      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                        {[["Leaf Health", result.health + "%"], ["Affected Area", result.affected + "%"], ["Severity", result.severity], ["Yield Risk", result.disease.yieldLoss]].map(([l, v]) => <div key={l} className="rounded-xl bg-black/20 px-2 py-2.5"><p className="text-sm font-black">{v}</p><p className="text-[10px] font-bold opacity-80">{l}</p></div>)}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                      <h4 className="flex items-center gap-2 text-base font-black"><ShieldCheck className="h-5 w-5 text-emerald-700" /> Remedy Prescription — {result.disease.name}</h4>
                      <div className="mt-4 flex gap-2">{([["chemical", FlaskConical, "Chemical"], ["organic", Sprout, "Organic / Bio"], ["cultural", Bug, "Cultural"]] as const).map(([id, Icon, label]) => <button key={id} onClick={() => setRemedyTab(id)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${remedyTab === id ? "bg-[#0d3b21] text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
                      <div className="mt-4">
                        {remedyTab === "chemical" && (result.disease.chemical.length ? <div className="space-y-2">{result.disease.chemical.map(c => <div key={c.name} className="rounded-2xl border border-red-100 bg-red-50/60 p-3"><p className="text-sm font-black text-red-900">{c.name}</p><div className="mt-1 grid gap-1 text-xs text-slate-600 sm:grid-cols-3"><span><b>Dose:</b> {c.dose}</span><span><b>Timing:</b> {c.timing}</span><span className="text-red-700"><b>Safety:</b> {c.safety}</span></div></div>)}</div> : <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">No chemical needed — leaf is healthy.</p>)}
                        {remedyTab === "organic" && <ul className="space-y-2">{result.disease.organic.map(o => <li key={o} className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm"><Sprout className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{o}</li>)}</ul>}
                        {remedyTab === "cultural" && <ul className="space-y-2">{result.disease.cultural.map(o => <li key={o} className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />{o}</li>)}</ul>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "library" && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Disease Library & Remedy Guide</h2><p className="text-sm text-slate-500">9 RiceLeafXNet classes — symptoms, causes, remedies.</p></div>
              <div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search disease…" className="rounded-full border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-emerald-600" /></div>
                {["All", "Fungal", "Bacterial", "Viral", "Healthy"].map(t => <button key={t} onClick={() => setTypeFilter(t)} className={`rounded-full px-4 py-2 text-xs font-bold ${typeFilter === t ? "bg-[#0d3b21] text-white" : "bg-white ring-1 ring-slate-200"}`}>{t}</button>)}</div></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(d => <article key={d.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"><div className="flex items-center justify-between"><span className="rounded-full px-2.5 py-1 text-[11px] font-black" style={{ background: d.bg, color: d.color }}>{d.type.toUpperCase()}</span><span className="text-xs font-bold text-red-600">Yield loss {d.yieldLoss}</span></div><h3 className="mt-3 text-lg font-black">{d.name}</h3><p className="text-xs italic text-slate-400">{d.scientific}</p><p className="mt-2 line-clamp-3 text-sm text-slate-600">{d.description}</p><button onClick={() => setSelected(d)} className="mt-4 flex w-full items-center justify-center gap-1 rounded-full bg-[#0d3b21] py-2.5 text-xs font-bold text-white">View Details <ChevronRight className="h-3.5 w-3.5" /></button></article>)}
            </div>
          </div>
        )}

        {tab === "dashboard" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-black">Field Health Dashboard</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[["Total Scans", stats?.total ?? 0, ScanLine, "#0d3b21"], ["Healthy Leaves", stats?.healthy ?? 0, Leaf, "#16a34a"], ["Diseased Leaves", stats?.diseased ?? 0, Bug, "#dc2626"], ["High / Critical", stats?.critical ?? 0, AlertTriangle, "#ea580c"], ["Avg Confidence", (stats?.avgConf ? stats.avgConf.toFixed(1) : "0") + "%", BrainCircuit, "#7c3aed"]].map(([l, v, Icon, c]: any) => <div key={l} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: c }}><Icon className="h-4.5 w-4.5" /></span><p className="mt-3 text-2xl font-black">{v}</p><p className="text-xs font-semibold text-slate-500">{l}</p></div>)}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"><h3 className="font-black">Disease Distribution (all scans)</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={diseaseChart} layout="vertical" margin={{ left: 30 }}><XAxis type="number" /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" radius={[0, 8, 8, 0]}>{diseaseChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>{!stats?.total && <p className="text-center text-xs text-slate-400">Run diagnoses in the Detect tab — charts update live from PostgreSQL.</p>}</div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"><h3 className="font-black">Scans Over Time</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dayChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="scans" stroke="#16a34a" fill="#bbf7d0" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"><h3 className="font-black">Recent Diagnoses</h3><div className="mt-3 divide-y">{(stats?.recent || []).map((s: any) => <div key={s.id} className="flex items-center justify-between py-3 text-sm"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full font-black text-white" style={{ background: getDisease(s.diseaseId).color }}>{s.diseaseName[0]}</span><span><b>{s.diseaseName}</b><span className="block text-xs text-slate-400">{s.fieldId} - {s.location} - {new Date(s.createdAt).toLocaleString()}</span></span></span><span className="text-right"><b>{s.confidence}%</b><span className="block text-xs" style={{ color: sevColor(s.severity) }}>{s.severity}</span></span></div>)}{(stats?.recent || []).length === 0 && <p className="py-6 text-center text-sm text-slate-400">No scans yet.</p>}</div></div>
          </div>
        )}


        {tab === "model" && (
          <div className="fade-up space-y-5">
            <div>
              <h2 className="text-2xl font-black">RiceLeafXNet - Random Forest V3</h2>
              <p className="max-w-3xl text-sm text-slate-500">
                A machine learning classifier for rice leaf disease detection.
                It extracts HSV colour histogram, HOG and LBP features from
                leaf images, selects 4,087 features, and uses a Random Forest
                ensemble to classify 9 rice leaf conditions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 overflow-x-auto rounded-3xl bg-[#0d3b21] p-5 text-white">
              {[
                ["Image Input", "Rice leaf image", Camera],
                ["Feature Extraction", "HSV + HOG + LBP", Layers],
                ["Feature Vector", "8,174 original features", Activity],
                ["Feature Selection", "4,087 selected features", Eye],
                ["Random Forest V3", "Ensemble decision trees", Cpu],
                ["Prediction", "One of 9 classes", BrainCircuit]
              ].map(([t, s, Icon]: any, i, arr) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="w-36 rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/15">
                    <Icon className="mx-auto h-6 w-6 text-amber-400" />
                    <p className="mt-1 text-xs font-black">{t}</p>
                    <p className="text-[10px] leading-tight text-emerald-200">{s}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="h-5 w-5 shrink-0 text-amber-400" />
                  )}
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <h3 className="flex items-center gap-2 font-black">
                  <Award className="h-5 w-5 text-emerald-700" />
                  Test Performance
                </h3>

                <div className="mt-3 space-y-3">
                  {[
                    ["Accuracy", 89.09],
                    ["Macro Precision", 90.35],
                    ["Macro Recall", 89.51],
                    ["Macro F1-Score", 89.68],
                    ["Macro AUC-ROC", 98.93]
                  ].map(([l, v]: any) => (
                    <div key={l}>
                      <div className="flex justify-between text-xs font-bold">
                        <span>{l}</span>
                        <span>{v}%</span>
                      </div>
                      <div className="mt-1 h-2.5 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: v + "%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 text-center text-xs">
                  {[
                    ["9", "Classes"],
                    ["8,174", "Raw Features"],
                    ["4,087", "Selected"]
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-slate-50 p-2">
                      <b className="block text-sm">{v}</b>
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <h3 className="font-black">Feature Extraction</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Original image feature configuration
                </p>

                <div className="mt-4 space-y-3">
                  {[
                    ["HSV Histogram", "48"],
                    ["HOG", "8,100"],
                    ["LBP", "26"]
                  ].map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                      <span className="text-sm font-semibold">{name}</span>
                      <b className="text-sm text-emerald-700">{count}</b>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl bg-[#0d3b21] p-4 text-white">
                  <p className="text-xs text-emerald-200">Total Original Features</p>
                  <p className="mt-1 text-2xl font-black">8,174</p>
                  <div className="my-3 border-t border-white/20" />
                  <p className="text-xs text-emerald-200">Features Selected for Model</p>
                  <p className="mt-1 text-2xl font-black text-amber-400">4,087</p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <h3 className="font-black">Evaluation Summary</h3>

                <div className="mt-4 space-y-3">
                  {[
                    ["Test Images", "541"],
                    ["Correct Predictions", "482"],
                    ["Test Accuracy", "89.09%"],
                    ["Validation Accuracy", "88.30%"],
                    ["Validation Macro F1", "87.21%"]
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-500">{label}</span>
                      <b className="text-sm">{value}</b>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                  Test metrics are measured on the Random Forest V3 test set.
                  Validation and test results are reported separately.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="font-black">Supported Rice Leaf Disease Classes</h3>
              <p className="mt-1 text-xs text-slate-500">
                Random Forest V3 classification outputs
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                {DISEASES.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-2xl p-3 text-center text-white"
                    style={{ background: d.color }}
                  >
                    <p className="text-[10px] font-bold leading-tight">{d.name}</p>
                    <p className="mt-1 text-[9px] opacity-80">{d.id}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                The model predicts disease classes and confidence scores.
                Severity and affected-area indicators displayed by the
                application are separate estimates and are not direct
                Random Forest model outputs.
              </p>
            </div>
          </div>
        )}


        {tab === "history" && (
          <div className="fade-up">
            <div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">Scan History</h2><p className="text-sm text-slate-500">Every diagnosis is stored in PostgreSQL — filter, verify or remove records.</p></div><button onClick={loadData} className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-bold ring-1 ring-slate-200"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>
            <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-400"><tr><th className="px-4 py-3">Disease</th><th>Confidence</th><th>Severity</th><th>Health</th><th>Field / Farmer</th><th>Date</th><th>Feedback</th><th /></tr></thead><tbody>{scans.map(s => <tr key={s.id} className="border-t hover:bg-slate-50"><td className="px-4 py-3"><b>{s.diseaseName}</b><span className="block text-xs text-slate-400">{s.imageName}</span></td><td className="font-bold text-emerald-700">{s.confidence}%</td><td><span className="rounded-full px-2 py-1 text-[11px] font-black text-white" style={{ background: sevColor(s.severity) }}>{s.severity}</span></td><td>{s.leafHealthScore}%</td><td>{s.fieldId}<span className="block text-xs text-slate-400">{s.farmerName} - {s.location}</span></td><td className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</td><td>{s.feedback ? <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${s.feedback === "correct" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>{s.feedback}</span> : <span className="flex gap-1"><button onClick={() => feedback(s.id, "correct")} className="rounded-full bg-emerald-50 p-1.5 text-emerald-700"><ThumbsUp className="h-3.5 w-3.5" /></button><button onClick={() => feedback(s.id, "incorrect")} className="rounded-full bg-red-50 p-1.5 text-red-600"><ThumbsDown className="h-3.5 w-3.5" /></button></span>}</td><td className="pr-3"><button onClick={() => delScan(s.id)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-red-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>{scans.length === 0 && <p className="py-14 text-center text-sm text-slate-400">No scans yet — run your first diagnosis in the Detect tab.</p>}</div>
            {(stats?.consultations || []).length > 0 && <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"><h3 className="font-black">Agronomist Consultations</h3>{stats.consultations.map((c: any) => c && <div key={c.id} className="mt-2 flex justify-between border-t py-2 text-sm"><span><b>{c.farmerName}</b> — {c.diseaseName}<span className="block text-xs text-slate-400">{c.question}</span></span><span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800 h-fit">{c.status}</span></div>)}</div>}
          </div>
        )}
      </main>

      <footer className="bg-[#0d3b21] py-8 text-center text-sm text-emerald-200"><p className="font-black text-white">RiceLeafXNet <span className="text-amber-400">•</span> AI-Based Rice Leaf Disease Classification using Machine Learning</p><p className="mt-1 text-xs">Always confirm critical diagnoses with a local agronomist before chemical application. Follow label dose & PHI.</p></footer>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setSelected(null)}><div onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl fade-up"><div className="p-5"><div className="flex items-start justify-between"><div><span className="rounded-full px-2.5 py-1 text-[11px] font-black" style={{ background: selected.bg, color: selected.color }}>{selected.type}</span><h3 className="mt-2 text-2xl font-black">{selected.name}</h3><p className="text-sm italic text-slate-400">{selected.scientific}</p></div><button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button></div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">{[["Yield Loss", selected.yieldLoss], ["Spread Rate", selected.spread], ["Favourable Weather", selected.weather]].map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 p-2"><b className="block text-[13px]">{v}</b>{l}</div>)}</div>
        <h4 className="mt-4 font-black">Symptoms</h4><ul className="mt-1 space-y-1 text-sm text-slate-600">{selected.symptoms.map(s => <li key={s} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{s}</li>)}</ul>
        <h4 className="mt-4 font-black">Cause</h4><p className="text-sm text-slate-600">{selected.causes}</p>
        <h4 className="mt-4 flex items-center gap-1 font-black"><FlaskConical className="h-4 w-4 text-red-600" /> Chemical Remedies</h4>{selected.chemical.length ? selected.chemical.map(c => <div key={c.name} className="mt-2 rounded-xl bg-red-50 p-3 text-sm"><b>{c.name}</b> — {c.dose}<br /><span className="text-xs text-slate-500">{c.timing} - {c.safety}</span></div>) : <p className="text-sm text-slate-500">None required.</p>}
        <h4 className="mt-4 flex items-center gap-1 font-black"><Sprout className="h-4 w-4 text-emerald-600" /> Organic</h4><ul className="mt-1 space-y-1 text-sm text-slate-600">{selected.organic.map(s => <li key={s}>{s}</li>)}</ul>
        <h4 className="mt-4 font-black">Cultural & Prevention</h4><ul className="mt-1 space-y-1 text-sm text-slate-600">{[...selected.cultural, ...selected.prevention].map(s => <li key={s}>{s}</li>)}</ul>
        <button onClick={() => { setSelected(null); setTab("detect"); analyze("sample", selected.id, selected.name); }} className="mt-5 w-full rounded-full bg-[#0d3b21] py-3 text-sm font-bold text-white">Diagnose a leaf like this</button>
      </div></div></div>}

      {consult && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConsult(false)}><div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-5 fade-up"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-black"><Phone className="h-5 w-5 text-emerald-700" /> Book Agronomist Call</h3><button onClick={() => setConsult(false)}><X className="h-5 w-5" /></button></div>
        <div className="mt-4 space-y-3">{[["Farmer name", "farmerName"], ["Phone", "phone"], ["Location", "location"], ["Disease", "diseaseName"]].map(([l, k]) => <label key={k} className="block"><span className="text-xs font-bold text-slate-500">{l}</span><input value={(cForm as any)[k]} onChange={e => setCForm({ ...cForm, [k]: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-emerald-600" /></label>)}
          <label className="block"><span className="text-xs font-bold text-slate-500">Urgency</span><select value={cForm.urgency} onChange={e => setCForm({ ...cForm, urgency: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"><option>Low</option><option>Medium</option><option>High</option><option>Critical — crop dying</option></select></label>
          <label className="block"><span className="text-xs font-bold text-slate-500">Your question</span><textarea rows={3} value={cForm.question} onChange={e => setCForm({ ...cForm, question: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-emerald-600" /></label>
          <button onClick={submitConsult} className="w-full rounded-full bg-amber-400 py-3 text-sm font-black text-[#0d3b21]">Request Callback (within 4 hrs)</button></div></div></div>}



    </div>
  );
}
