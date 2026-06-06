/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Info,
  Loader2,
  Camera,
  Cpu,
  Zap,
  Box,
  MapPin,
  FileText,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  RefreshCcw,
  Download,
  LogOut,
  User as UserIcon,
  Target,
  RotateCcw,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Flame,
  Eye,
  EyeOff
} from 'lucide-react';
import Auth from './components/Auth';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { jsPDF } from 'jspdf';
import { analyzeStructuralDamage, DamageAnalysis } from './services/geminiService';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('struct_guard_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [image, setImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DamageAnalysis | null>(null);
  const [savedRecords, setSavedRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem('struct_guard_registry');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'documentation'>('diagnostics');
  const [exportingReport, setExportingReport] = useState(false);
  const [logs, setLogs] = useState<{msg: string, time: string}[]>([]);
  const [history, setHistory] = useState<{ past: { image: string | null, result: DamageAnalysis | null }[], future: { image: string | null, result: DamageAnalysis | null }[] }>({ past: [], future: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ msg, time }, ...prev].slice(0, 10));
  };

  const pushToHistory = (currImage: string | null, currResult: DamageAnalysis | null) => {
    setHistory(prev => ({
      past: [...prev.past, { image: currImage, result: currResult }].slice(-20),
      future: []
    }));
  };

  const undo = () => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    
    setHistory({
      past: newPast,
      future: [{ image, result }, ...history.future].slice(0, 20)
    });
    
    setImage(previous.image);
    setResult(previous.result);
    addLog("SYSTEM_STATE: UNDO_EXECUTED");
  };

  const redo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    setHistory({
      past: [...history.past, { image, result }],
      future: newFuture
    });
    
    setImage(next.image);
    setResult(next.result);
    addLog("SYSTEM_STATE: REDO_EXECUTED");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y or Cmd+Y
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, image, result]);

  useEffect(() => {
    addLog("SYSTEM_BOOT: KERNEL_LOADED");
    addLog("NETWORK_READY: SSL_ENCRYPTED");
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`IO_STREAM: FILE_RECEIVED [${file.name}]`);
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      pushToHistory(image, result);
      setImage(e.target?.result as string);
      setResult(null);
      setError(null);
      setRotation(0);
      addLog("IMAGE_BUFFER: RENDER_SUCCESS");
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async () => {
    if (!image) return;
    setAnalyzing(true);
    setResult(null);
    setSelectedAreaIndex(null);
    setError(null);
    addLog("COMPUTE_UNIT: STARTING_CNN_INFERENCE");
    try {
      const data = await analyzeStructuralDamage(image);
      pushToHistory(image, result);
      setResult(data);
      
      // Save to registry
      setSavedRecords(prev => {
        const newRecords = [{ 
          id: `REC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          date: new Date().toISOString(),
          level: data.damageLevel,
          confidence: data.confidence,
          author: user?.name || 'System'
        }, ...prev].slice(0, 50);
        localStorage.setItem('struct_guard_registry', JSON.stringify(newRecords));
        return newRecords;
      });

      addLog("INFERENCE_COMPLETE: RESULTS_POSTED");
    } catch (err) {
      setError("ANALYSIS_LOG: FAILED_TO_EXTRACT_FEATURES");
      addLog("CRITICAL_ERR: FEATURE_EXTRACTION_FAILURE");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReport = async () => {
    if (!result || !image) return;
    setExportingReport(true);
    addLog("PDF_GEN: INITIALIZING_REPORT_KERNEL");

    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const reportId = `SG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Branding & Header
      doc.setFillColor(30, 30, 35);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("STRUCTGUARD ENTERPRISE", 20, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("STRUCTURAL INTEGRITY ASSESSMENT REPORT", 20, 32);
      
      // Metadata
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(`REPORT_ID: ${reportId}`, 150, 20);
      doc.text(`TIMESTAMP: ${timestamp}`, 150, 25);
      doc.text(`ENGINE: GEMINI-3-FLASH`, 150, 30);

      // Section: Executive Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("EXECUTIVE SUMMARY", 20, 55);
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1);
      doc.line(20, 58, 40, 58);

      // Damage Level Indicator
      const levelColor = result.damageLevel === 'Severe' ? [244, 63, 94] : result.damageLevel === 'Minor' ? [245, 158, 11] : [16, 185, 129];
      doc.setFillColor(levelColor[0], levelColor[1], levelColor[2]);
      doc.rect(20, 65, 170, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(`THREAT LEVEL: ${result.damageLevel.toUpperCase()}`, 25, 75);
      doc.text(`CONFIDENCE: ${(result.confidence * 100).toFixed(2)}%`, 150, 75);

      // Description
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(result.description, 170);
      doc.text(splitDesc, 20, 90);

      // Image Assessment
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("VISUAL TELEMETRY", 20, 125);
      
      // Add the image
      // Note: we might need to handle CORS if image was from external URL, but here it's base64 or internal blob usually.
      try {
        doc.addImage(image, 'JPEG', 20, 130, 170, 95);
      } catch (e) {
        doc.text("UNABLE TO RENDER IMAGE IN REPORT BUFFER", 20, 140);
      }

      // Recommendations
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RECOMMENDED ACTIONS", 20, 240);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      result.recommendations?.forEach((rec, i) => {
        doc.text(`• ${rec}`, 25, 250 + (i * 7));
      });

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text("CONFIDENTIAL - FOR AUTHORIZED USE ONLY. VERIFY ALL SEVERE ANOMALIES WITH A LICENSED ENGINEER.", 105, 285, { align: "center" });

      doc.save(`StructGuard_Report_${reportId}.pdf`);
      addLog("PDF_GEN: REPORT_EXPORTED_SUCCESSFULLY");
    } catch (err) {
      addLog("CRITICAL_ERR: PDF_GENERATION_FAILED");
      console.error(err);
    } finally {
      setExportingReport(false);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('struct_guard_session', JSON.stringify(userData));
    addLog(`AUTH_SUCCESS: IDENTITY_REGISTERED [${userData.name}]`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('struct_guard_session');
    setImage(null);
    setResult(null);
    addLog("AUTH_REVOKED: SESSION_TERMINATED");
  };

  const rotate = (dir: 'cw' | 'ccw') => {
    setRotation(prev => {
      if (dir === 'cw') return (prev + 90) % 360;
      return (prev - 90 + 360) % 360;
    });
    addLog(`IMAGE_BUFFER: ROTATED_${dir.toUpperCase()}`);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-base text-zinc-900 overflow-hidden relative selection:bg-brand-accent/20">
      {/* Studio Background Detail */}
      <div className="soft-glow top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/50"></div>
      <div className="soft-glow bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-50/30"></div>
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none"></div>

      {/* Primary Header */}
      <header className="h-16 px-8 flex items-center justify-between shrink-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border sticky top-0">
        <div className="flex items-center gap-10 min-w-0 flex-1">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-brand-accent flex items-center justify-center text-white shadow-sm">
               <Building2 className="w-5 h-5" />
            </div>
            <div className="hidden lg:flex flex-col">
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 leading-none">Post-Earthquake Detection</h1>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Core v4.2</span>
            </div>
          </div>
        </div>

        {/* Centered Navigation Options */}
        <div className="flex-1 flex justify-center px-4">
          <nav className="flex items-center p-1 bg-zinc-100 rounded-2xl border border-zinc-200/50 shadow-inner">
            {[
              { id: 'diagnostics', icon: Activity, label: 'Live Diagnostics' },
              { id: 'documentation', icon: FileText, label: 'System Registry' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
                  ${activeTab === tab.id 
                    ? 'bg-white text-brand-accent shadow-md shadow-black/5 ring-1 ring-zinc-200/50' 
                    : 'text-zinc-400 hover:text-zinc-600'}
                `}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-brand-accent' : 'text-zinc-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 flex items-center justify-end gap-6">
          <div className="hidden md:flex items-center gap-3 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${analyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
              {analyzing ? 'Processing' : 'Standby'}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-200 hidden sm:block"></div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 pl-4 pr-2 py-1.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50/50 transition-all group shrink-0"
            title="Terminate Session"
          >
            <div className="flex flex-col items-end mr-1">
              <span className="text-[10px] font-black text-zinc-900 leading-none group-hover:text-rose-600 transition-colors uppercase tracking-tight">{user.name}</span>
              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-1">Authorized Node</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-rose-500 group-hover:border-rose-200 transition-all shadow-sm">
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 flex overflow-hidden z-10 p-6 gap-6">
        
        {/* Left Control Column */}
        <aside className="w-80 flex flex-col gap-6 shrink-0">
          <section className="flex flex-col gap-6 studio-surface p-8">
             <div className="space-y-1">
                <h2 className="technical-label">Image Telemetry</h2>
                <p className="text-xs text-zinc-500 leading-relaxed">Neural structural mapping pipeline.</p>
             </div>

             <div 
                className={`relative group h-64 rounded-[24px] border border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden
                  ${image ? 'border-brand-accent/30 ' : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <>
                    <img src={image} alt="Input" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-4 inset-x-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg shadow-black/5 translate-y-2 group-hover:translate-y-0 transition-transform">
                      <p className="text-brand-accent text-[10px] font-black uppercase tracking-widest text-center">Swap Signal Node</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-zinc-400 group-hover:text-brand-accent transition-colors" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Connect Matrix</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={startAnalysis}
                  disabled={!image || analyzing}
                  className="w-full btn-primary disabled:opacity-30 disabled:grayscale"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline"/> : <Zap className="w-4 h-4 mr-2 inline"/>}
                  Start Analysis
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={undo} disabled={history.past.length === 0} className="btn-secondary">Undo</button>
                   <button onClick={redo} disabled={history.future.length === 0} className="btn-secondary">Redo</button>
                </div>
              </div>
          </section>

          <section className="flex-1 flex flex-col min-h-0 studio-surface p-8">
             <h2 className="technical-label mb-6">Process Logs</h2>
             <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 items-start border-b border-zinc-50 pb-3 last:border-0">
                    <span className="text-[9px] font-semibold text-zinc-300 tabular-nums uppercase">{log.time}</span>
                    <p className={`text-[11px] font-semibold leading-relaxed ${log.msg.includes('ERR') ? 'text-brand-danger' : 'text-zinc-500'}`}>
                      {log.msg}
                    </p>
                  </div>
                ))}
             </div>
          </section>
        </aside>

        {/* Center: Main Viewport */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'diagnostics' ? (
              <motion.div 
                key="diagnostics"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 studio-surface overflow-hidden relative bg-white">
                  {image ? (
                    <TransformWrapper 
                      initialScale={1}
                      minScale={0.5}
                      maxScale={20}
                      centerOnInit
                      smooth
                      limitToBounds={false}
                      wheel={{ 
                        step: 0.05,
                        smoothStep: 0.005
                      }}
                      pinch={{ step: 2 }}
                      doubleClick={{ mode: 'reset' }}
                    >
                      {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                        <>
                          <div className="absolute top-6 right-6 flex flex-col gap-2 z-50">
                            {[
                              { icon: RotateCw, action: () => rotate('cw'), label: 'Rotate CW' },
                              { icon: RotateCcw, action: () => rotate('ccw'), label: 'Rotate CCW' },
                              { icon: showHeatmap ? EyeOff : Flame, action: () => setShowHeatmap(!showHeatmap), label: showHeatmap ? 'Hide Heatmap' : 'Show Heatmap', active: showHeatmap },
                              { icon: ZoomIn, action: () => zoomIn(0.2), label: 'Zoom In' },
                              { icon: ZoomOut, action: () => zoomOut(0.2), label: 'Zoom Out' },
                              { icon: Maximize, action: () => resetTransform(), label: 'Reset' },
                              { icon: Target, action: () => centerView(), label: 'Center' }
                            ].map((btn, i) => (
                              <button 
                                key={i} 
                                onClick={btn.action} 
                                className={`w-10 h-10 ${btn.active ? 'bg-brand-accent text-white' : 'bg-white/95 text-zinc-500'} backdrop-blur-md border border-zinc-100 rounded-xl flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all shadow-sm group active:scale-95 cursor-pointer`}
                                title={btn.label}
                              >
                                <btn.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                            ))}
                          </div>

                          {/* Diagnostics Status Indicator */}
                          {result && !analyzing && (
                            <div className="absolute top-6 left-6 z-50 pointer-events-none">
                              <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 bg-zinc-900 text-white pl-3 pr-4 py-2 rounded-xl shadow-2xl border border-white/10"
                              >
                                 <div className="relative">
                                   <div className="w-2 h-2 bg-brand-accent rounded-full animate-ping"></div>
                                   <div className="absolute inset-0 w-2 h-2 bg-brand-accent rounded-full"></div>
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="text-[9px] font-black uppercase tracking-widest leading-none">Layer_Active</span>
                                   <span className="text-[8px] font-mono text-zinc-400 leading-none mt-1">Spatial_Analysis_V2.0</span>
                                 </div>
                              </motion.div>
                            </div>
                          )}

                          <TransformComponent wrapperClassName="!w-full !h-full cursor-move" contentClassName="!w-full !h-full flex items-center justify-center">
                            <div 
                              className="relative inline-block transition-transform duration-300 ease-in-out bg-white rounded-2xl shadow-2xl overflow-hidden"
                              style={{ transform: `rotate(${rotation}deg)` }}
                            >
                              <img src={image} alt="Target" className="block max-w-[85vw] max-h-[70vh] w-auto h-auto rounded-2xl" />
                              
                              {/* Heatmap Overlay */}
                              {result && showHeatmap && !analyzing && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="absolute inset-0 z-20 pointer-events-none"
                                >
                                  <svg viewBox="0 0 1000 1000" className="w-full h-full opacity-80 mix-blend-multiply">
                                    <defs>
                                      <filter id="heatBlur">
                                        <feGaussianBlur stdDeviation="30" />
                                      </filter>
                                      <radialGradient id="heatGradientSevere">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                      </radialGradient>
                                      <radialGradient id="heatGradientMinor">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                      </radialGradient>
                                    </defs>
                                    <g filter="url(#heatBlur)">
                                      {result.spatialTelemetry?.map((area, i) => {
                                        const [ymin, xmin, ymax, xmax] = area.box_2d;
                                        return (
                                          <ellipse 
                                            key={i}
                                            cx={(xmin+xmax)/2} 
                                            cy={(ymin+ymax)/2} 
                                            rx={(xmax-xmin)*0.8} 
                                            ry={(ymax-ymin)*0.8} 
                                            fill={area.severity === 'Severe' ? 'url(#heatGradientSevere)' : 'url(#heatGradientMinor)'} 
                                          />
                                        );
                                      })}
                                    </g>
                                  </svg>
                                </motion.div>
                              )}

                               {/* Spatial Telemetry Overlays */}
                               {result && !showHeatmap && !analyzing && (
                                 <div className="absolute inset-0 pointer-events-none">
                                   {result.spatialTelemetry?.map((area, i) => {
                                     const [ymin, xmin, ymax, xmax] = area.box_2d;
                                     const color = area.severity === 'Severe' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';
                                     const borderColor = area.severity === 'Severe' ? '#ef4444' : '#f59e0b';
                                     
                                     return (
                                       <motion.div
                                         key={i}
                                         initial={{ opacity: 0, scale: 0.95 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         whileHover={{ scale: 1.02, backgroundColor: area.severity === 'Severe' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)' }}
                                         onClick={() => setSelectedAreaIndex(selectedAreaIndex === i ? null : i)}
                                         transition={{ delay: 0.3 + i * 0.05 }}
                                         className={`absolute z-10 border-2 rounded-lg cursor-help group/area pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.1)] backdrop-blur-[0.5px] transition-all
                                           ${selectedAreaIndex === i ? 'ring-4 ring-brand-accent/50 scale-105 z-20' : ''}
                                         `}
                                         style={{
                                           top: `${ymin / 10}%`,
                                           left: `${xmin / 10}%`,
                                           height: `${(ymax - ymin) / 10}%`,
                                           width: `${(xmax - xmin) / 10}%`,
                                           backgroundColor: color,
                                           borderColor: borderColor,
                                           borderWidth: 'clamp(1px, 0.2vw, 2px)'
                                         }}
                                       >
                                         <div className="absolute top-0 left-0 p-2 opacity-0 group-hover/area:opacity-100 transition-opacity bg-zinc-900 backdrop-blur-md rounded-br-xl pointer-events-none">
                                            <div className="flex items-center gap-2">
                                              <div className={`w-1.5 h-1.5 rounded-full ${area.severity === 'Severe' ? 'bg-rose-400' : 'bg-amber-400'} shadow-[0_0_8px_rgba(251,113,133,0.6)]`}></div>
                                              <span className="text-[10px] font-black text-white uppercase tracking-tighter">{area.label}</span>
                                            </div>
                                         </div>
                                         <div className={`absolute top-0 left-full ml-6 min-w-[240px] bg-white/98 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-zinc-100 p-5 rounded-3xl transition-all z-20 pointer-events-none origin-left
                                           ${selectedAreaIndex === i ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-90 group-hover/area:opacity-100 group-hover/area:translate-x-0 group-hover/area:scale-100'}
                                         `}>
                                           <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-zinc-50">
                                             <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest truncate">{area.label}</span>
                                             <div className="flex gap-1.5 shrink-0">
                                               <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-zinc-50 text-zinc-500 border border-zinc-100">
                                                 {Math.round(area.confidenceScore * 100)}%
                                               </span>
                                               <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${area.severity === 'Severe' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}>
                                                 {area.severity}
                                               </span>
                                             </div>
                                           </div>
                                           <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mb-3">
                                             {area.characteristics}
                                           </p>
                                           <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-bold bg-zinc-50 p-2 rounded-xl">
                                             <MapPin className="w-3 h-3 text-brand-accent" />
                                             <span className="truncate">{area.location}</span>
                                           </div>
                                         </div>
                                         
                                         <motion.div 
                                           animate={{ opacity: [0.3, 1, 0.3] }}
                                           transition={{ duration: 2, repeat: Infinity }}
                                         >
                                           <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/80 rounded-tl-sm"></div>
                                           <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/80 rounded-tr-sm"></div>
                                           <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/80 rounded-bl-sm"></div>
                                           <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/80 rounded-br-sm"></div>
                                         </motion.div>
                                       </motion.div>
                                     );
                                   })}
                                 </div>
                               )}
                               
                               {analyzing && (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-50 rounded-2xl">
                                   <div className="w-24 h-24 rounded-full border border-zinc-100 flex items-center justify-center relative bg-white shadow-xl">
                                      <motion.div 
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.5, 0.1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-brand-accent rounded-full blur-2xl"
                                      />
                                      <div className="relative">
                                        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                           <div className="w-1 h-1 bg-brand-accent rounded-full animate-ping"></div>
                                        </div>
                                      </div>
                                   </div>
                                   <div className="flex flex-col items-center gap-2 mt-8">
                                     <span className="text-zinc-900 font-black text-[10px] tracking-[0.2em] uppercase">Neural mapping active</span>
                                     <span className="text-zinc-400 text-[9px] font-mono tracking-widest animate-pulse">EXTRACTING_FEATURES_LAYER_7...</span>
                                   </div>
                                 </div>
                               )}
                             </div>
                             
                             {result && !analyzing && (
                               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
                                 <div className="absolute bottom-12 right-12 flex flex-col items-end">
                                    <div className="w-12 h-12 border border-brand-accent rounded-full animate-ping opacity-20 absolute -top-1 -left-1"></div>
                                    <div className="bg-zinc-900/40 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                                       <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-[0_0_8px_rgb(var(--brand-accent-rgb))]"></div>
                                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Signal_Locked</span>
                                    </div>
                                 </div>
                               </motion.div>
                             )}
                          </TransformComponent>
                        </>
                      )}
                    </TransformWrapper>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-8 px-12">
                       <div className="relative">
                          <div className="w-24 h-24 bg-zinc-50 rounded-[40px] flex items-center justify-center shadow-inner">
                             <Box className="w-10 h-10 text-zinc-200" strokeWidth={1} />
                          </div>
                          <motion.div 
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-brand-accent/10 border border-brand-accent/20 rounded-full flex items-center justify-center"
                          >
                            <div className="w-1.5 h-1.5 bg-brand-accent rounded-full"></div>
                          </motion.div>
                       </div>
                       <div className="text-center space-y-3">
                          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">Diagnostics Pipeline Idle</h3>
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                            Initialize a signal node by uploading structural telemetry for analysis.
                          </p>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-black text-brand-accent uppercase tracking-widest pt-4 hover:opacity-70 transition-opacity"
                          >
                             // Connect Data Matrix
                          </button>
                       </div>
                    </div>
                  )}

                  {/* Studio HUD Overlay */}
                  <div className="absolute bottom-8 left-8 pointer-events-none flex items-center gap-8">
                     <div className="flex flex-col">
                        <span className="technical-label !text-zinc-300">Vector Index</span>
                        <span className="text-[11px] font-bold text-zinc-500 tabular-nums">40.712N | 74.006W</span>
                     </div>
                     <div className="h-6 w-px bg-zinc-100"></div>
                     <div className="flex flex-col">
                        <span className="technical-label !text-zinc-300">Resolution</span>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">High_FIDELITY</span>
                     </div>
                     {result && (
                       <>
                         <div className="h-6 w-px bg-zinc-100"></div>
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <div className="flex flex-col">
                               <span className="technical-label !text-emerald-400">Diag_Stream</span>
                               <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">Encrypted_RT</span>
                            </div>
                         </div>
                       </>
                     )}
                  </div>
                </div>

                {/* Metrics Bar Area */}
                <div className="grid grid-cols-3 gap-6 shrink-0 mt-6 h-36">
                  <div className="col-span-2 studio-surface p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h4 className="technical-label !text-brand-accent">Inference Confidence</h4>
                      <span className="text-[10px] font-bold text-zinc-400 tabular-nums">P(X) = {(result?.confidence ?? 0).toFixed(4)}</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-10">
                      {Array.from({length: 48}).map((_, i) => (
                        <motion.div 
                          key={i} 
                          animate={{ 
                            height: analyzing ? ['20%', '100%', '30%'] : result ? `${Math.random() * 80 + 20}%` : '15%',
                            backgroundColor: result?.damageLevel === 'Severe' ? '#ef4444' : '#4f46e5'
                          }}
                          transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                          className="flex-1 opacity-10 rounded-full"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="studio-surface p-8 flex flex-col justify-center items-center text-center">
                    <p className="text-4xl font-bold text-zinc-900 tracking-tighter leading-none mb-2">
                       {result ? (result.confidence * 100).toFixed(1) : '0.0'}%
                    </p>
                    <p className="technical-label">Score Index</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="documentation"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                className="flex-1 studio-surface p-12 overflow-y-auto bg-white/50 backdrop-blur-md"
              >
                <div className="max-w-4xl mx-auto space-y-16">
                  <header className="space-y-6">
                    <div className="h-1 w-12 bg-brand-accent rounded-full"></div>
                    <h2 className="text-5xl font-bold text-zinc-900 tracking-tight leading-[1.1]">System <br/><span className="text-zinc-300">Registry</span></h2>
                    
                    <div className="p-8 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-between shadow-2xl">
                       <div className="flex items-center gap-6">
                         <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-brand-accent text-2xl font-black">
                           {user?.name?.[0] || 'A'}
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-1">Authorized Node</span>
                           <h3 className="text-xl font-bold text-white uppercase tracking-tight">{user?.name || 'Authorized Member'}</h3>
                           <span className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-widest mt-1">ID_{user?.id || 'ROOT'} • {user?.email}</span>
                         </div>
                       </div>
                       <div className="hidden sm:flex flex-col items-end">
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Status</span>
                         <span className="text-emerald-400 font-black uppercase tracking-tighter text-sm">Synchronized</span>
                       </div>
                    </div>
                  </header>

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <h3 className="technical-label !text-zinc-900 underline underline-offset-8 decoration-brand-accent">Analysis Protocols</h3>
                       <div className="grid grid-cols-1 gap-6">
                         <div className="p-6 bg-white border border-zinc-100 rounded-2xl space-y-3 shadow-sm">
                            <Cpu className="w-5 h-5 text-brand-accent" />
                            <h4 className="text-xs font-black text-zinc-900 uppercase">Detection Kernel</h4>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                              Sub-pixel extraction enabled via G3_FLASH architecture for real-time resilience assessment.
                            </p>
                         </div>
                         <div className="p-6 bg-white border border-zinc-100 rounded-2xl space-y-3 shadow-sm">
                            <FileText className="w-5 h-5 text-brand-accent" />
                            <h4 className="text-xs font-black text-zinc-900 uppercase">Compliance Standard</h4>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                              Evaluation mapped against ASCE 41-17 international earthquake resilience compliance.
                            </p>
                         </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <h3 className="technical-label !text-zinc-900 underline underline-offset-8 decoration-brand-accent">Personnel Directory</h3>
                       <div className="flex flex-wrap gap-4">
                          {(() => {
                            const users = JSON.parse(localStorage.getItem('struct_guard_users') || '[]');
                            const uniqueUsers = users.length > 0 ? users : [{ name: user.name, email: user.email, id: user.id }];
                            return uniqueUsers.map((u: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 bg-white border border-zinc-100 pl-2 pr-4 py-2 rounded-2xl shadow-sm">
                                <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white text-[10px] font-black">
                                  {u.name[0]}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">{u.name}</span>
                                   <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{u.email}</span>
                                </div>
                              </div>
                            ));
                          })()}
                       </div>
                    </div>

                    <div className="space-y-8">
                       <h3 className="technical-label !text-zinc-900 underline underline-offset-8 decoration-brand-accent">Persistent Logs</h3>
                       <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                         {savedRecords.length > 0 ? (
                           savedRecords.map((rec, i) => (
                             <div key={i} className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-between hover:bg-white transition-all group hover:shadow-xl hover:shadow-zinc-200/50">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm
                                     ${rec.level === 'Severe' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                                       rec.level === 'Minor' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}
                                   `}>
                                     {rec.level[0]}
                                   </div>
                                   <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">{rec.id}</span>
                                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">• {rec.author || 'ROOT'}</span>
                                      </div>
                                      <span className="text-[9px] font-medium text-zinc-400 font-mono uppercase tracking-widest mt-0.5">{new Date(rec.date).toLocaleDateString()} {new Date(rec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <div className="flex flex-col items-end mr-2">
                                      <span className="text-[10px] font-black text-zinc-900">{(rec.confidence * 100).toFixed(1)}%</span>
                                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Conf</span>
                                   </div>
                                   <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-brand-accent transition-colors" />
                                </div>
                             </div>
                           ))
                         ) : (
                           <div className="h-40 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 opacity-50">
                              <Box className="w-6 h-6 mb-2 text-zinc-300" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Zero Records Found</span>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Info Rail */}
        <aside className="w-80 flex flex-col gap-6 shrink-0 overflow-hidden">
           <section className={`flex flex-col min-h-0 studio-surface transition-all duration-500 ${showSuggestions ? 'flex-[1.5]' : 'h-16 flex-none'} overflow-hidden`}>
              <div className="p-6 pb-4 border-b border-zinc-50 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                  <h2 className="technical-label">AI Suggestions</h2>
                </div>
                <button 
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest"
                >
                  {showSuggestions ? 'Collapse' : 'Expand'}
                </button>
              </div>
              
              <AnimatePresence initial={false}>
                {showSuggestions && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex-1 min-h-0 overflow-y-auto scrollbar-hide bg-zinc-50/20"
                  >
                    <div className="p-6 space-y-4">
                      {result?.aiSuggestions ? (
                        result.aiSuggestions.map((suggestion, i) => (
                          <div key={i} className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm space-y-2">
                             <div className="flex items-center justify-between">
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md
                                 ${suggestion.type === 'warning' ? 'bg-rose-50 text-rose-600' : 
                                   suggestion.type === 'safety' ? 'bg-amber-50 text-amber-600' :
                                   suggestion.type === 'expert' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}
                               `}>
                                 {suggestion.type}
                               </span>
                             </div>
                             <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-tight">{suggestion.title}</h4>
                             <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                               {suggestion.description}
                             </p>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-10">
                           <Sparkles className="w-6 h-6 mb-2 text-zinc-300" strokeWidth={1} />
                           <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                             Analysis pending
                           </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </section>

           <section className="flex-1 flex flex-col min-h-0 studio-surface overflow-hidden">
              <div className="p-6 pb-4 border-b border-zinc-50 bg-white flex items-center justify-between shrink-0">
                <h2 className="technical-label">Detailed Telemetry</h2>
                {result?.spatialTelemetry && (
                  <span className="text-[10px] font-mono text-zinc-400 font-bold bg-zinc-50 px-2 py-0.5 rounded-md">
                    {result.spatialTelemetry.length} Anomalies
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide bg-zinc-50/30">
                 {result?.spatialTelemetry ? (
                   result.spatialTelemetry.map((area, i) => (
                     <div 
                       key={i}
                       className={`group/item border rounded-2xl transition-all duration-300 overflow-hidden
                         ${selectedAreaIndex === i 
                           ? 'bg-white border-brand-accent/20 shadow-lg shadow-zinc-200/50' 
                           : 'bg-white border-zinc-100 hover:border-zinc-200'
                         }
                       `}
                     >
                       <button 
                         onClick={() => setSelectedAreaIndex(selectedAreaIndex === i ? null : i)}
                         className="w-full p-4 flex items-center justify-between text-left"
                       >
                         <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${area.severity === 'Severe' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                           <span className={`text-[11px] font-black uppercase tracking-tight ${selectedAreaIndex === i ? 'text-brand-accent' : 'text-zinc-900'}`}>
                             {area.label}
                           </span>
                         </div>
                         {selectedAreaIndex === i ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />}
                       </button>

                       <AnimatePresence>
                         {selectedAreaIndex === i && (
                           <motion.div 
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="overflow-hidden"
                           >
                             <div className="px-4 pb-4 space-y-4">
                               <div className="p-3 bg-zinc-50 rounded-xl space-y-3">
                                 <div className="flex justify-between items-center">
                                   <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Confidence</span>
                                   <span className="text-[10px] font-mono font-bold text-zinc-900">{Math.round(area.confidenceScore * 100)}%</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                   <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Severity</span>
                                   <span className={`text-[10px] font-bold uppercase ${area.severity === 'Severe' ? 'text-rose-500' : 'text-amber-500'}`}>{area.severity}</span>
                                 </div>
                               </div>

                               <div className="space-y-1.5">
                                 <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Characteristics</span>
                                 <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                                   {area.characteristics}
                                 </p>
                               </div>

                               <div className="space-y-1.5">
                                 <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Localization</span>
                                 <div className="flex items-start gap-2 text-[10px] text-zinc-500 font-semibold leading-tight">
                                   <MapPin className="w-3 h-3 text-brand-accent shrink-0 mt-0.5" />
                                   <span>{area.location}</span>
                                 </div>
                               </div>
                               
                               <div className="pt-2 border-t border-zinc-100">
                                  <div className="flex items-center gap-2">
                                     <Layers className="w-3 h-3 text-zinc-300" />
                                     <span className="text-[9px] font-mono text-zinc-300 uppercase">Normalized_Bounds: [{area.box_2d.join(', ')}]</span>
                                  </div>
                               </div>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   ))
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                      <Layers className="w-8 h-8 mb-4 text-zinc-300" strokeWidth={1} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 leading-relaxed">
                        Awaiting structural <br/> spatial analysis logs
                      </p>
                   </div>
                 )}
              </div>

              {result && !analyzing && (
                <div className="p-8 border-t border-zinc-50 bg-zinc-50/50">
                  <button onClick={downloadReport} disabled={exportingReport} className="w-full btn-secondary h-12 flex items-center justify-center gap-2">
                     {exportingReport ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                     Download Manifest
                  </button>
                </div>
              )}
           </section>
        </aside>

      </main>

      {/* Persistence Bar */}
      <footer className="h-10 px-8 flex items-center justify-between z-20 bg-white border-t border-border shrink-0">
        <div className="flex gap-10">
          <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em] flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-brand-accent rounded-full"></div>
            System: <span className="text-zinc-500">Node_Stable_4.2</span>
          </span>
          <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em] flex items-center gap-2.5">
             Instance: <span className="text-zinc-500">Gemini_High_Op</span>
          </span>
        </div>
        
        <div className="flex items-center gap-8">
           <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-3 h-3" /> Secure_Channel
           </span>
           <div className="h-3 w-px bg-zinc-100"></div>
           <span className="text-[9px] font-mono text-zinc-300 font-bold tracking-[0.2em] uppercase">UID_{user?.id || 'ANON'}</span>
        </div>
      </footer>
    </div>
  );
}

