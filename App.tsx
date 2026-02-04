
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Download, Settings2, AlertCircle, CheckCircle2, 
  BrainCircuit, Loader2, Trophy, Layers, Sparkles, Search, 
  BookOpen, ChevronRight, Filter, Database, Trash2, GraduationCap,
  Briefcase, ShoppingCart, Activity, Landmark, FileJson, FileText,
  Zap, Info, Eye, RefreshCw
} from 'lucide-react';
import { DatasetType, GeneratorConfig, ColumnDefinition, DataRow, DifficultyLevel } from './types';
import { generateDataset, getPresetColumns, getPracticeQuestions } from './services/dataGenerator';
import { exportMultiSheetExcel } from './services/excelService';
import { generateCustomSchema } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'challenge'>('generator');
  const [config, setConfig] = useState<GeneratorConfig>({
    type: DatasetType.STUDENT,
    difficulty: DifficultyLevel.BEGINNER,
    rowCount: 100,
    messy: {
      missingPct: 0,
      duplicatePct: 0,
      extraSpaces: false,
      mixedCasing: false,
      wrongTypes: false,
      invalidFormats: false
    },
    filename: 'xcellab_practice_data',
    customPrompt: '',
    customColumns: [],
    format: 'xlsx'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [previewData, setPreviewData] = useState<DataRow[]>([]);
  const [previewRows, setPreviewRows] = useState(15);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  // Constants for limits
  const EXCEL_LIMIT = 1048576;
  const PERFORMANCE_DANGER_ZONE = 50000;
  const MAX_PREVIEW_LIMIT = 1000;

  // Sync Difficulty Presets
  useEffect(() => {
    if (config.difficulty === DifficultyLevel.BEGINNER) {
      setConfig(prev => ({ ...prev, messy: { ...prev.messy, missingPct: 0, duplicatePct: 0, extraSpaces: false, mixedCasing: false, wrongTypes: false, invalidFormats: false } }));
    } else if (config.difficulty === DifficultyLevel.INTERMEDIATE) {
      setConfig(prev => ({ ...prev, messy: { ...prev.messy, missingPct: 8, duplicatePct: 5, extraSpaces: true, mixedCasing: false, wrongTypes: false, invalidFormats: true } }));
    } else if (config.difficulty === DifficultyLevel.ADVANCED) {
      setConfig(prev => ({ ...prev, messy: { ...prev.messy, missingPct: 18, duplicatePct: 15, extraSpaces: true, mixedCasing: true, wrongTypes: true, invalidFormats: true } }));
    }
  }, [config.difficulty]);

  // Small Auto-Preview Update
  useEffect(() => {
    const cols = config.type === DatasetType.CUSTOM ? config.customColumns || [] : getPresetColumns(config.type);
    if (cols.length > 0) {
      // Automatically show small preview when settings change
      setPreviewData(generateDataset(Math.min(config.rowCount, previewRows), cols, config.messy, config.type));
    }
  }, [config.type, config.customColumns, config.messy, config.rowCount, previewRows]);

  const refreshPreview = (count: number = 15) => {
    setIsPreviewLoading(true);
    setPreviewRows(count);
    setTimeout(() => {
      const cols = config.type === DatasetType.CUSTOM ? config.customColumns || [] : getPresetColumns(config.type);
      setPreviewData(generateDataset(Math.min(config.rowCount, count), cols, config.messy, config.type));
      setIsPreviewLoading(false);
    }, 400);
  };

  const handleExport = () => {
    if (config.rowCount > EXCEL_LIMIT && config.format === 'xlsx') {
      setNotification({ 
        type: 'error', 
        message: `Excel only supports 1,048,576 rows. You requested ${config.rowCount.toLocaleString()}.` 
      });
      return;
    }

    if (config.rowCount > 200000) {
      const confirmLarge = window.confirm(
        `Warning: Generating ${config.rowCount.toLocaleString()} rows might freeze your browser for a few minutes. Continue?`
      );
      if (!confirmLarge) return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const cols = config.type === DatasetType.CUSTOM ? config.customColumns || [] : getPresetColumns(config.type);
        const fullData = generateDataset(config.rowCount, cols, config.messy, config.type);
        const tasks = getPracticeQuestions(config.type).map(q => ({ "Practice Task": q }));
        
        if (config.format === 'xlsx') {
          exportMultiSheetExcel([
            { name: "Raw Data", data: fullData },
            { name: "Instructions & Tasks", data: tasks }
          ], config.filename);
        } else if (config.format === 'csv') {
          const csvContent = "data:text/csv;charset=utf-8," 
            + Object.keys(fullData[0]).join(",") + "\n"
            + fullData.map(r => Object.values(r).join(",")).join("\n");
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `${config.filename}.csv`);
          document.body.appendChild(link);
          link.click();
        }

        setNotification({ type: 'success', message: `Exported ${fullData.length.toLocaleString()} records!` });
      } catch (err) {
        setNotification({ type: 'error', message: 'Memory Overflow! Try a smaller dataset or CSV format.' });
      } finally {
        setIsGenerating(false);
      }
    }, 1000);
  };

  const handleAiSchema = async () => {
    if (!config.customPrompt) return;
    setIsAiLoading(true);
    try {
      const schema = await generateCustomSchema(config.customPrompt);
      setConfig(prev => ({ ...prev, customColumns: schema }));
      setNotification({ type: 'success', message: 'Custom schema generated!' });
    } catch (e) {
      setNotification({ type: 'error', message: 'AI failed to respond.' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const columnsToShow = config.type === DatasetType.CUSTOM ? config.customColumns || [] : getPresetColumns(config.type);

  const getTemplateIcon = (type: DatasetType) => {
    switch(type) {
      case DatasetType.STUDENT: return <GraduationCap size={16} />;
      case DatasetType.REPORT_CARD: return <FileText size={16} />;
      case DatasetType.PAYROLL: return <Briefcase size={16} />;
      case DatasetType.SALES: return <ShoppingCart size={16} />;
      case DatasetType.HOSPITAL: return <Activity size={16} />;
      case DatasetType.BANKING: return <Landmark size={16} />;
      default: return <Database size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-green-100 selection:text-green-900">
      <nav className="w-full bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-green-600 to-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-green-100">
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">Xcel<span className="text-green-600 italic">Lab</span></span>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Practice Platform</div>
            </div>
          </div>
          
          <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'generator' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Database size={16} /> Generator
            </button>
            <button 
              onClick={() => setActiveTab('challenge')}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'challenge' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Trophy size={16} className="text-yellow-500" /> Challenge Lab
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Settings2 size={22} className="text-green-500" />
                Build Dataset
              </h2>
              <DifficultyBadge level={config.difficulty} />
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 block">Choose a Template</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.values(DatasetType).filter(t => t !== DatasetType.CUSTOM).map(t => (
                    <button
                      key={t}
                      onClick={() => setConfig({...config, type: t})}
                      className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl border transition-all ${config.type === t ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      {getTemplateIcon(t)}
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                  <button
                    onClick={() => setConfig({...config, type: DatasetType.CUSTOM})}
                    className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl border transition-all ${config.type === DatasetType.CUSTOM ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}
                  >
                    <Sparkles size={16} /> AI Custom Builder
                  </button>
                </div>
              </div>

              {config.type === DatasetType.CUSTOM && (
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <textarea 
                    value={config.customPrompt}
                    onChange={(e) => setConfig({...config, customPrompt: e.target.value})}
                    placeholder="Describe columns e.g., 'A list of 50 space explorers with mission duration and planet visited'"
                    className="w-full text-xs font-medium border-indigo-100 rounded-xl focus:ring-indigo-500 bg-white"
                    rows={3}
                  />
                  <button 
                    onClick={handleAiSchema}
                    disabled={isAiLoading || !config.customPrompt}
                    className="w-full mt-3 bg-indigo-600 text-white text-xs font-black py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                    Apply AI Logic
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 block">Target Row Count</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={config.rowCount}
                    min="1"
                    max="1000000000"
                    onChange={(e) => setConfig({...config, rowCount: parseInt(e.target.value) || 0})}
                    className={`w-full border rounded-xl text-sm font-bold px-4 py-3 transition-colors ${config.rowCount > EXCEL_LIMIT ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500' : 'border-slate-200 focus:ring-green-500'}`}
                  />
                  {config.rowCount > EXCEL_LIMIT && (
                    <div className="absolute right-3 top-3 text-red-500 flex items-center gap-1 group">
                      <AlertCircle size={18} />
                      <div className="absolute hidden group-hover:block bottom-full right-0 w-48 p-2 bg-slate-900 text-white text-[10px] rounded mb-2">
                        Excel only supports 1,048,576 rows. Large datasets should use CSV.
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-[9px] mt-2 font-bold uppercase tracking-tighter ${config.rowCount > PERFORMANCE_DANGER_ZONE ? 'text-orange-500' : 'text-slate-400'}`}>
                  {config.rowCount > 1000000 ? '🔥 Massive Scale Mode' : config.rowCount > 50000 ? '⚠️ High Performance Needed' : '✅ Standard Size'}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <MessySlider 
                  label="Missing Values (%)" 
                  value={config.messy.missingPct} 
                  onChange={(v) => setConfig({...config, messy: {...config.messy, missingPct: v}})} 
                />
                <MessySlider 
                  label="Duplicate Rows (%)" 
                  value={config.messy.duplicatePct} 
                  onChange={(v) => setConfig({...config, messy: {...config.messy, duplicatePct: v}})} 
                />
                <div className="grid grid-cols-2 gap-3">
                  <MessyToggle label="Spaces" active={config.messy.extraSpaces} onToggle={() => setConfig({...config, messy: {...config.messy, extraSpaces: !config.messy.extraSpaces}})} />
                  <MessyToggle label="Case Mix" active={config.messy.mixedCasing} onToggle={() => setConfig({...config, messy: {...config.messy, mixedCasing: !config.messy.mixedCasing}})} />
                  <MessyToggle label="Wrong Types" active={config.messy.wrongTypes} onToggle={() => setConfig({...config, messy: {...config.messy, wrongTypes: !config.messy.wrongTypes}})} />
                  <MessyToggle label="Invalid Data" active={config.messy.invalidFormats} onToggle={() => setConfig({...config, messy: {...config.messy, invalidFormats: !config.messy.invalidFormats}})} />
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={config.filename}
                  onChange={(e) => setConfig({...config, filename: e.target.value})}
                  className="flex-1 border-slate-200 rounded-xl text-xs font-bold"
                  placeholder="filename"
                />
                <select 
                  value={config.format}
                  onChange={(e) => setConfig({...config, format: e.target.value as any})}
                  className="bg-slate-50 border-slate-200 rounded-xl text-xs font-black uppercase"
                >
                  <option value="xlsx">XLSX</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              {config.rowCount > EXCEL_LIMIT && config.format === 'xlsx' && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2 text-red-700">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold leading-tight">Switch to CSV format to export datasets larger than 1M rows. Excel cannot open larger files.</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => refreshPreview(MAX_PREVIEW_LIMIT)}
                  className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  <Eye size={16} /> Preview 1,000 Rows
                </button>
                <button
                  onClick={handleExport}
                  disabled={isGenerating || columnsToShow.length === 0}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                  Generate & Download
                </button>
              </div>
            </div>
          </div>

          {notification && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-left-4 ${
              notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
              notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-xs font-black">{notification.message}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'generator' ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[700px]">
              <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-900 flex items-center gap-2">
                    <Layers size={18} className="text-green-500" />
                    Dataset Preview
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Showing {previewData.length.toLocaleString()} of {config.rowCount.toLocaleString()} rows</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => refreshPreview(15)}
                    className="p-2 text-slate-400 hover:text-green-600 transition-colors bg-white border border-slate-200 rounded-lg shadow-sm"
                    title="Refresh Preview"
                  >
                    <RefreshCw size={16} className={isPreviewLoading ? 'animate-spin' : ''} />
                  </button>
                  <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase ${config.rowCount > EXCEL_LIMIT ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white border-slate-200 text-slate-500'}`}>
                    {config.rowCount.toLocaleString()} Total Rows
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 relative">
                {isPreviewLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={32} className="animate-spin text-green-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Generating Preview...</span>
                    </div>
                  </div>
                )}
                {columnsToShow.length > 0 ? (
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm border-b border-slate-100">
                      <tr>
                        {columnsToShow.map((c, i) => (
                          <th key={i} className="px-6 py-5 font-black text-slate-500 uppercase tracking-tighter border-r border-slate-50 min-w-[120px]">
                            {c.name}
                            <div className="text-[9px] font-bold text-slate-300 normal-case italic">{c.type}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors group">
                          {columnsToShow.map((col, cIdx) => {
                            const val = row[col.name];
                            const isNull = val === null || val === undefined;
                            const isDirty = typeof val === 'string' && (val.startsWith(' ') || val.endsWith(' '));
                            return (
                              <td key={cIdx} className="px-6 py-4 text-slate-700 whitespace-nowrap border-r border-slate-50">
                                {isNull ? (
                                  <span className="text-red-400 font-black italic opacity-60 flex items-center gap-1">
                                    <Trash2 size={10} /> NULL
                                  </span>
                                ) : (
                                  <span className={`${isDirty ? 'bg-yellow-100/50 text-orange-700 px-1 rounded ring-1 ring-yellow-200' : ''}`}>
                                    {String(val)}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                      {config.rowCount > previewData.length && (
                        <tr>
                          <td colSpan={columnsToShow.length} className="px-6 py-8 text-center bg-slate-50/50 border-t border-slate-100">
                            <button 
                              onClick={() => refreshPreview(MAX_PREVIEW_LIMIT)}
                              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-green-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                            >
                              <Eye size={14} /> Show up to 1,000 rows in preview
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <EmptyPreview />
                )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4">
                <QualityLegend color="bg-red-500" label="Missing Data" />
                <QualityLegend color="bg-yellow-400" label="Format Inconsistency" />
                <QualityLegend color="bg-indigo-500" label="AI Logic Columns" />
                {config.rowCount > EXCEL_LIMIT && (
                  <QualityLegend color="bg-rose-600 animate-pulse" label="Exceeds Excel Row Limit" />
                )}
              </div>
            </div>
          ) : (
            <ChallengeDashboard config={config} />
          )}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-10 py-16 border-t border-slate-200 text-slate-400 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 grayscale opacity-60">
          <FileSpreadsheet size={20} />
          <span className="text-sm font-black tracking-tighter">XcelLab Practice Hub &copy; 2025</span>
        </div>
        <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest">
          <a href="#" className="hover:text-green-600 transition-colors">Learning Path</a>
          <a href="#" className="hover:text-green-600 transition-colors">Teacher Mode</a>
          <a href="#" className="hover:text-green-600 transition-colors">Pro Tier</a>
        </div>
      </footer>
    </div>
  );
};

const DifficultyBadge = ({ level }: { level: DifficultyLevel }) => {
  const colors = {
    [DifficultyLevel.BEGINNER]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [DifficultyLevel.INTERMEDIATE]: 'bg-amber-100 text-amber-700 border-amber-200',
    [DifficultyLevel.ADVANCED]: 'bg-rose-100 text-rose-700 border-rose-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colors[level]}`}>
      {level}
    </span>
  );
};

const MessySlider = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-500 uppercase">{label}</span>
      <span className="text-[10px] font-black text-green-600">{value}%</span>
    </div>
    <input 
      type="range" min="0" max="60" step="5" 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))} 
      className="w-full accent-green-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
    />
  </div>
);

const MessyToggle = ({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${active ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
  >
    {label}
    <div className={`w-3.5 h-3.5 rounded-full border-2 ${active ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`} />
  </button>
);

const QualityLegend = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    {label}
  </div>
);

const EmptyPreview = () => (
  <div className="h-full flex flex-col items-center justify-center p-20 text-center text-slate-300">
    <div className="bg-slate-50 p-8 rounded-full mb-6">
      <Search size={64} className="opacity-20" />
    </div>
    <h4 className="text-xl font-black text-slate-400 mb-2">No Active Schema</h4>
    <p className="max-w-xs text-sm font-medium opacity-60">
      Pick a preset template from the sidebar or describe your data to the AI builder to see a live preview.
    </p>
  </div>
);

const ChallengeDashboard = ({ config }: { config: GeneratorConfig }) => (
  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-green-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]" />
      
      <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/5">
            <Trophy size={12} className="text-yellow-400" /> Cleaning Challenge Active
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">Mastering {config.type.replace('_', ' ')} Data</h2>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-medium">
            You've generated a dataset at <b>{config.difficulty}</b> level. Load it into Excel and complete the listed tasks to level up your mastery score.
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[30px] border border-white/10 text-center min-w-[180px]">
          <div className="text-5xl font-black text-green-400">0%</div>
          <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-2">Proficiency</div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {getPracticeQuestions(config.type).map((task, i) => (
        <div key={i} className="bg-white p-7 rounded-3xl border border-slate-200 flex items-start gap-6 hover:border-green-300 hover:shadow-xl hover:shadow-slate-100 transition-all cursor-default group">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-black text-slate-400 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all">
            {i + 1}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-relaxed mb-3">{task}</p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><BookOpen size={12} /> Solution Tip Available</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-indigo-600 rounded-[35px] p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-indigo-100 border border-indigo-500">
      <div className="bg-white/20 p-5 rounded-3xl">
        <GraduationCap size={48} className="text-white" />
      </div>
      <div className="text-center md:text-left">
        <h4 className="text-xl font-black mb-1 italic">Why this data is messy?</h4>
        <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80">
          We've introduced real-world friction. Your dataset contains {config.messy.duplicatePct}% duplicates and inconsistent text casing. 
          Use <b>Power Query</b>'s 'Remove Duplicates' and 'Format' functions to clean it in seconds!
        </p>
      </div>
      <button className="whitespace-nowrap bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all">
        Watch Guide
      </button>
    </div>
  </div>
);

export default App;
