import { useState, useEffect } from 'react'
import { Moon, Sun, Search, ArrowUpRight, X, LayoutGrid, List, Network, Settings, Pencil, Save, RefreshCw } from 'lucide-react'
import { cn } from './lib/utils'
import toolsData from './data/tools.json'

const getMediaUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/';
    return base.endsWith('/') ? base + url.slice(1) : base + '/' + url.slice(1);
  }
  return url;
};

const getEmbedUrl = (url, isBackground = false) => {
  if (!url) return url;
  let finalUrl = getMediaUrl(url);
  
  const ytMatch = finalUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  if (ytMatch && ytMatch[1]) {
    finalUrl = `https://www.youtube.com/embed/${ytMatch[1]}?`;
  }

  if (isBackground) {
    const separator = finalUrl.endsWith('?') ? '' : finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}autoplay=1&mute=1&muted=1&loop=1&controls=0&background=1&modestbranding=1&playsinline=1&rel=0`;
    const ytEmbedMatch = finalUrl.match(/youtube\.com\/embed\/([^&?]+)/);
    if (ytEmbedMatch && ytEmbedMatch[1]) {
      finalUrl += `&playlist=${ytEmbedMatch[1]}`;
    }
  }
  
  return finalUrl;
}

const parseDesignSystem = (md) => {
  if (!md) return null;

  const themeMatch = md.match(/\*\*Theme:\*\*\s*(light|dark)/i);
  const theme = themeMatch ? themeMatch[1].toLowerCase() : 'auto';


  const getQuickColor = (name) => {
    const quickRefMatch = md.match(/Quick Color Reference[\s\S]*?(?:###|$)/i);
    if (quickRefMatch) {
      const quickRef = quickRefMatch[0];
      const regex = new RegExp(`-\\s*(?:[\\*\\_]*)${name}(?:[\\*\\_]*)[^#\n]*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})\\b`, 'i');
      const match = quickRef.match(regex);
      if (match) return match[1];
    }
    const regex = new RegExp(`${name}[^#\n]*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})\\b`, 'i');
    const match = md.match(regex);
    return match ? match[1] : null;
  };

  const getFonts = () => {
    let fontHeading = 'Inter, sans-serif';
    let fontBody = 'Inter, sans-serif';

    const allSubstitutes = [...md.matchAll(/\*\*Substitute:\*\*\s*([^\n]+)/gi)];
    if (allSubstitutes.length > 0) {
      fontHeading = allSubstitutes[0][1].trim();
      const nextUnique = allSubstitutes.find(s => s[1].trim() !== fontHeading);
      fontBody = nextUnique ? nextUnique[1].trim() : fontHeading;
    } else {
      const cssMatch = md.match(/--font-[^:]+:\s*([^;]+);/g);
      if (cssMatch && cssMatch.length > 0) {
        const fonts = cssMatch.map(m => {
          const val = m.split(':')[1].replace(';', '').trim();
          return val.split(',')[0].replace(/['"]/g, '').trim();
        });
        fontHeading = fonts[0];
        const nextUnique = fonts.find(f => f !== fontHeading);
        fontBody = nextUnique || fontHeading;
      }
    }
    return { fontHeading, fontBody };
  };


  const bgExtracted = getQuickColor('Background') || getQuickColor('Base');
  const textExtracted = getQuickColor('Text') || getQuickColor('Foreground');
  const ctaExtracted = getQuickColor('CTA') || getQuickColor('Accent');
  const borderExtracted = getQuickColor('Border') || getQuickColor('Divider');

  const radiusCardMatch = md.match(/cards\s*\|\s*([\d.]+px)/i) || md.match(/--radius-lg:\s*([\d.]+px)/i) || md.match(/--radius-cards:\s*([\d.]+px)/i);
  const radiusButtonMatch = md.match(/buttons\s*\|\s*([\d.]+px)/i) || md.match(/--radius-md:\s*([\d.]+px)/i) || md.match(/--radius-buttons:\s*([\d.]+px)/i);

  const { fontHeading, fontBody } = getFonts();

  const hexColors = md.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g) || [];

  let bg = bgExtracted || (hexColors.length >= 2 ? hexColors[1] : '#ffffff');
  let text = textExtracted || (hexColors.length >= 1 ? hexColors[0] : '#000000');
  let primary = ctaExtracted || (hexColors.length >= 3 ? hexColors[2] : '#3b82f6');
  let border = borderExtracted || (hexColors.length >= 4 ? hexColors[3] : 'rgba(128,128,128,0.2)');

  const normalizeHex = (hex) => {
    if (!hex || !hex.startsWith('#')) return '#000000';
    if (hex.length === 4) {
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex.toLowerCase();
  };

  let normBg = normalizeHex(bg);
  let normText = normalizeHex(text);

  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const bgLum = getLuminance(normBg);
  const textLum = getLuminance(normText);

  // If contrast is too low, force black or white text
  if (Math.abs(bgLum - textLum) < 100) {
    if (bgLum > 128) {
      text = '#000000'; // light background, need dark text
    } else {
      text = '#ffffff'; // dark background, need light text
    }
  }

  return {
    theme,
    bg,
    text,
    primary,
    border,
    radiusCard: radiusCardMatch ? radiusCardMatch[1] : '24px',
    radiusButton: radiusButtonMatch ? radiusButtonMatch[1] : '8px',
    fontHeading: fontHeading,
    fontBody: fontBody
  };
};

function ToolCard({ tool, onClick, getThemeColorClass, viewMode, darkMode }) {
  const theme = parseDesignSystem(tool.designMd);
  const isDarkMode = theme?.theme === 'light' ? false : (theme?.theme === 'dark' ? true : darkMode);

  const getTierBadge = (tier) => {
    if (tier === '필수') return <span className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm border border-red-200 dark:border-red-800/50">필수</span>
    if (tier === '심화') return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm border border-blue-200 dark:border-blue-800/50">심화</span>
    return null
  }

  const baseCardClasses = "text-left w-full group relative flex overflow-hidden transition-all duration-300";

  if (viewMode === 'list') {
    return (
      <button
        onClick={() => onClick(tool)}
        className={cn(
          baseCardClasses,
          "items-center gap-4 p-4 hover:-translate-y-0.5",
          theme ? "hover:shadow-md border" : "border bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md"
        )}
        style={theme ? {
          backgroundColor: isDarkMode && theme.theme !== 'dark' ? '#121212' : theme.bg,
          color: isDarkMode && theme.theme !== 'dark' ? '#ffffff' : theme.text,
          borderColor: theme.border,
          borderRadius: theme.radiusCard,
          fontFamily: theme.fontBody,
          '--brand-color': theme.primary
        } : {
          borderRadius: '16px',
          borderColor: 'rgba(128,128,128,0.2)',
          '--brand-color': tool.themeColor ? 'var(--tw-colors-blue-500)' : '#3b82f6'
        }}
      >
        <div 
          className={cn(
            "w-12 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden",
            theme ? "" : "bg-zinc-100 dark:bg-zinc-800 rounded-xl"
          )}
          style={theme ? { borderRadius: theme.radiusButton, backgroundColor: `${theme.border}40` } : {}}
        >
          {tool.favicon ? (
            <img src={tool.favicon} alt="favicon" className="w-8 h-8 object-contain" style={{ borderRadius: theme ? theme.radiusButton : '6px' }} />
          ) : (
            <span className="font-bold text-[var(--brand-color)]">{tool.name.charAt(0)}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold truncate group-hover:opacity-80 transition-opacity" style={{ fontFamily: theme?.fontHeading, color: theme ? theme.text : undefined }}>
              {tool.name}
            </h3>
            {getTierBadge(tool.tier)}
          </div>
          <p className="text-sm truncate mt-0.5" style={{ opacity: 0.7, color: theme ? theme.text : undefined }}>
            {tool.description}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span 
            className="px-2.5 py-1 text-xs font-semibold border"
            style={{ borderRadius: theme?.radiusButton || '6px', borderColor: `${theme?.primary || '#3b82f6'}40`, color: theme ? theme.primary : undefined }}
          >
            {tool.category}
          </span>
          <span 
            className="text-xs font-medium px-2 py-1"
            style={{ borderRadius: theme?.radiusButton || '6px', backgroundColor: theme ? `${theme.border}40` : (isDarkMode ? '#27272a' : '#f4f4f5'), color: theme ? theme.text : undefined }}
          >
            {tool.type}
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => onClick(tool)}
      className={cn(
        baseCardClasses,
        "flex-col h-full hover:-translate-y-1 border group/card",
        theme ? "hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5" : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]"
      )}
      style={theme ? {
        backgroundColor: isDarkMode && theme.theme !== 'dark' ? '#121212' : theme.bg,
        color: isDarkMode && theme.theme !== 'dark' ? '#ffffff' : theme.text,
        borderColor: theme.border,
        borderRadius: '24px',
        fontFamily: theme.fontBody,
        '--brand-color': theme.primary
      } : {
        borderRadius: '24px',
        '--brand-color': '#3b82f6'
      }}
    >
      <div className="p-2 w-full">
        <div 
          className={cn("relative w-full aspect-[4/3] sm:h-[180px] overflow-hidden rounded-[18px]", theme ? "" : "bg-zinc-100 dark:bg-zinc-800")}
        >
          {tool.thumbnailMedia ? (
            tool.thumbnailMedia.match(/\.(mp4|webm)$/i) ? (
              <>
                <video
                  src={getMediaUrl(tool.thumbnailMedia)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover scale-[1.02] group-hover/card:scale-105 transition-transform duration-700 ease-out"
                />
              </>
            ) : tool.thumbnailMedia.match(/vimeo\.com|youtube\.com|youtu\.be/i) ? (
              <>
                <iframe
                  src={getEmbedUrl(tool.thumbnailMedia, true)}
                  allow="autoplay; fullscreen; picture-in-picture"
                  className="w-full h-full scale-[1.15] group-hover/card:scale-[1.2] transition-transform duration-700 ease-out pointer-events-none border-0"
                />
              </>
            ) : tool.thumbnailMedia.match(/drive\.google\.com\/file\/d\/([^/]+)/) ? (
              <>
                <iframe
                  src={`https://drive.google.com/file/d/${tool.thumbnailMedia.match(/drive.google.com.file.d.([^/]+)/)[1]}/preview`}
                  allow="autoplay"
                  className="w-full h-full object-cover scale-[1.02] group-hover/card:scale-105 transition-transform duration-700 ease-out border-0"
                  style={{ pointerEvents: 'none' }}
                />
              </>
            ) : (
              <>
                <img 
                  src={getMediaUrl(tool.thumbnailMedia)} 
                  alt={tool.name} 
                  className="relative z-0 w-full h-full object-cover scale-[1.02] group-hover/card:scale-105 transition-transform duration-700 ease-out"
                />
              </>
            )
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                <div className="text-6xl font-black opacity-20 text-[var(--brand-color)]">
                  {tool.name.charAt(0)}
                </div>
              </div>
              <img 
                src={`https://image.thum.io/get/width/600/crop/800/${tool.site}`} 
                alt={tool.name} 
                className="relative z-0 w-full h-full object-cover scale-[1.02] group-hover/card:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover/card:opacity-100"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] rounded-[18px] pointer-events-none" />

          <div className="absolute z-20 top-3 left-3 flex gap-2">
            <span 
              className="px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md bg-black/20 dark:bg-white/10 text-white rounded-lg border border-white/10"
            >
              {tool.category}
            </span>
          </div>
          <div className="absolute z-20 top-3 right-3">
            {getTierBadge(tool.tier)}
          </div>
        </div>
      </div>
      
      <div 
        className="px-5 pb-5 pt-2 flex-1 flex flex-col relative w-full"
      >
        <div className="flex items-center gap-3 mb-2">
          {tool.favicon ? (
            <img src={tool.favicon} alt={`${tool.name} favicon`} className="w-5 h-5 object-contain rounded-[4px] shadow-sm" />
          ) : (
            <span className="w-5 h-5 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-[4px] text-[10px] font-bold text-[var(--brand-color)]">
              {tool.name.charAt(0)}
            </span>
          )}
          <h3 className="text-[17px] font-bold group-hover/card:opacity-80 transition-colors" style={{ fontFamily: theme?.fontHeading, color: theme ? theme.text : undefined }}>
            {tool.name}
          </h3>
        </div>
        <p className="text-[13px] line-clamp-2 leading-relaxed" style={{ opacity: 0.6, color: theme ? theme.text : undefined }}>
          {tool.description}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span 
            className="text-[11px] font-medium px-2.5 py-1 rounded-md"
            style={{ backgroundColor: theme ? `${theme.border}40` : (isDarkMode ? '#27272a' : '#f4f4f5'), color: theme ? theme.text : undefined }}
          >
            {tool.type}
          </span>
          <span className="text-[12px] font-bold opacity-0 -translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-300 flex items-center gap-1" style={{ color: theme ? theme.primary : 'var(--brand-color)' }}>
            자세히 보기 <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
      {tool._adminMode && (
        <button
          onClick={(e) => { e.stopPropagation(); tool._onEdit(tool); }}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-blue-500 text-white shadow-lg hover:scale-110 transition-transform"
        >
          <Pencil size={14} />
        </button>
      )}
    </button>
  )
}


export default function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [selectedTool, setSelectedTool] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list' | 'map'
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [editingTool, setEditingTool] = useState(null)
  const [toolsState, setToolsState] = useState(toolsData)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const categories = ["전체", ...new Set(toolsState.map(t => t.category))]

  const filteredTools = toolsState.filter(tool => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = tool.name.toLowerCase().includes(searchStr) || 
                          tool.description.toLowerCase().includes(searchStr) ||
                          (tool.keywords && tool.keywords.toLowerCase().includes(searchStr));
    const matchesCategory = selectedCategory === "전체" || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  }).map(t => ({...t, _adminMode: isAdminMode, _onEdit: setEditingTool}))

  const getThemeColorClass = (color) => {
    const map = {
      emerald: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      orange: 'text-orange-600 dark:text-orange-400 border-orange-500/30',
      purple: 'text-purple-600 dark:text-purple-400 border-purple-500/30',
      blue: 'text-blue-600 dark:text-blue-400 border-blue-500/30',
      indigo: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      rose: 'text-rose-600 dark:text-rose-400 border-rose-500/30',
      slate: 'text-slate-700 dark:text-slate-300 border-slate-500/30',
    }
    return map[color] || map.slate
  }

  const handleSaveTool = async (updatedTool) => {
    setIsSaving(true)
    // Check if tool already exists (update) or is new (add)
    const exists = toolsState.find(t => t.id === updatedTool.id)
    const newTools = exists 
      ? toolsState.map(t => t.id === updatedTool.id ? updatedTool : t)
      : [updatedTool, ...toolsState]
    
    try {
      const res = await fetch('/api/save-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTools)
      })
      if(res.ok) {
        setToolsState(newTools)
        setEditingTool(null)
      } else {
        alert('저장에 실패했습니다.')
      }
    } catch(err) {
      alert('서버 오류: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTool = async (id) => {
    if(!window.confirm('이 툴을 정말 삭제하시겠습니까?')) return;
    setIsSaving(true)
    const newTools = toolsState.filter(t => t.id !== id)
    
    try {
      const res = await fetch('/api/save-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTools)
      })
      if(res.ok) {
        setToolsState(newTools)
        setEditingTool(null)
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch(err) {
      alert('서버 오류: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExtractDesign = () => {
    if(!editingTool.designMd) {
      alert("DESIGN.md 텍스트를 먼저 붙여넣어 주세요.");
      return;
    }
    const extracted = parseDesignSystem(editingTool.designMd);

    setEditingTool({
      ...editingTool,
      designToken: {
        ...(editingTool.designToken || {}),
        primaryColor: extracted.primary,
        backgroundColor: extracted.bg,
        textColor: extracted.text,
        fontFamily: extracted.fontBody || "system-ui, sans-serif",
        buttonStyle: `bg-[${extracted.primary}] text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-90`
      }
    });
    alert('DESIGN.md에서 색상과 폰트를 추출하여 디자인 토큰에 적용했습니다!\n아래 세부 설정 칸에서 미세조정(수정)도 가능합니다.');
  }

  const handleAddTool = () => {
    setEditingTool({
      id: "tool-" + Date.now(),
      name: "",
      description: "",
      category: "필수 AI",
      tier: "일반",
      site: "https://",
      keywords: "",
      favicon: "",
      thumbnailMedia: "",
      designMd: "",
      themeColor: "blue",
      designToken: {
        fontFamily: "system-ui, sans-serif",
        primaryColor: "#3b82f6",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        borderRadius: "16px",
        borderStyle: "1px solid #e5e5e5",
        buttonStyle: "bg-[#3b82f6] text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-90",
        animationClass: "animate-fade-in-up"
      },
      useCases: [{ title: "실제 활용 사례", description: "", media: [{ type: "image", url: "" }] }]
    })
  }

  return (
    <div className="min-h-screen font-sans bg-[#f8f9fc] dark:bg-zinc-950 transition-colors relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 dark:bg-zinc-950/60 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            AI Tool Curation
          </h1>
          <div className="flex items-center gap-3">
            {isAdminMode && (
              <button
                onClick={handleAddTool}
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors mr-2"
              >
                + 새 툴 추가
              </button>
            )}
            {import.meta.env.DEV && (
              <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={cn("p-2.5 rounded-full transition-colors shadow-sm border backdrop-blur-md", isAdminMode ? "bg-blue-500 text-white border-blue-600" : "text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700/50 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                title="Admin Mode"
              >
                <Settings size={18} />
              </button>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="flex flex-col gap-6 mb-10">
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="궁금한 AI 툴을 검색해보세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-zinc-900 dark:text-zinc-50 shadow-lg shadow-zinc-200/20 dark:shadow-none text-lg"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto hide-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border",
                    selectedCategory === cat 
                      ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white" 
                      : "bg-white/80 text-zinc-600 border-zinc-200/80 hover:bg-white dark:bg-zinc-900/80 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800 backdrop-blur-md"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex bg-white/80 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md shadow-sm self-end sm:self-auto">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}
                title="List View"
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'map' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}
                title="Map View"
              >
                <Network size={18} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.filter(c => c !== "전체").map(cat => {
              const catTools = filteredTools.filter(t => t.category === cat);
              if (catTools.length === 0) return null;
              
              let bgClass = "bg-zinc-100 dark:bg-zinc-800";
              let textClass = "text-zinc-900 dark:text-white";
              if (cat === '필수 AI') { bgClass = "bg-emerald-100 dark:bg-emerald-900/40"; textClass = "text-emerald-800 dark:text-emerald-300"; }
              else if (cat === '디자인/이미지 생성' || cat === '이미지') { bgClass = "bg-blue-100 dark:bg-blue-900/40"; textClass = "text-blue-800 dark:text-blue-300"; }
              else if (cat === '문서/기획/업무' || cat === '문서/기획') { bgClass = "bg-purple-100 dark:bg-purple-900/40"; textClass = "text-purple-800 dark:text-purple-300"; }
              else if (cat === '영상/음성 제작' || cat === '비디오' || cat === '오디오') { bgClass = "bg-orange-100 dark:bg-orange-900/40"; textClass = "text-orange-800 dark:text-orange-300"; }
              else if (cat === '개발/업무 자동화' || cat === '코딩/자동화') { bgClass = "bg-rose-100 dark:bg-rose-900/40"; textClass = "text-rose-800 dark:text-rose-300"; }
              
              return (
                <div key={cat} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-sm flex flex-col h-full animate-fade-in-up">
                  <div className={cn("px-5 py-3.5 font-bold border-b border-zinc-200/80 dark:border-zinc-800/80 text-lg flex justify-between items-center", bgClass, textClass)}>
                    {cat} <span className="opacity-60 text-sm font-semibold bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">{catTools.length}</span>
                  </div>
                  <div className="p-5 flex flex-wrap gap-2.5">
                    {catTools.map(tool => (
                      <button 
                        key={tool.id}
                        onClick={() => setSelectedTool(tool)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm"
                      >
                        {tool.favicon ? (
                          <img src={tool.favicon} className="w-5 h-5 rounded object-contain drop-shadow-md dark:drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]" alt="" />
                        ) : (
                          <span className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold">{tool.name.charAt(0)}</span>
                        )}
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{tool.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTools.map((tool) => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                onClick={setSelectedTool} 
                getThemeColorClass={getThemeColorClass}
                viewMode="grid"
              darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            {filteredTools.map((tool) => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                onClick={setSelectedTool} 
                getThemeColorClass={getThemeColorClass}
                viewMode="list"
              darkMode={darkMode} />
            ))}
          </div>
        )}
        
        {filteredTools.length === 0 && (
          <div className="py-20 text-center text-zinc-500 font-medium">
            검색 결과가 없습니다.
          </div>
        )}
      </main>

      {/* Custom Design Tool Detail Modal */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 sm:py-12">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-blur-in"
            onClick={() => setSelectedTool(null)}
          />
          {(() => {
            const theme = parseDesignSystem(selectedTool.designMd);
            const isDarkMode = theme?.theme === 'light' ? false : (theme?.theme === 'dark' ? true : darkMode);

            return (
              <div 
                className={cn(
                  "relative w-full h-full sm:h-auto sm:max-h-[85vh] max-w-4xl overflow-y-auto flex flex-col",
                  theme ? "animate-fade-in-up" : "shadow-2xl sm:rounded-3xl animate-fade-in-up"
                )}
                style={theme ? {
                  backgroundColor: isDarkMode && theme.theme !== 'dark' ? '#121212' : theme.bg,
                  color: isDarkMode && theme.theme !== 'dark' ? '#ffffff' : theme.text,
                  fontFamily: theme.fontBody,
                  borderRadius: theme.radiusCard,
                  border: `1px solid ${theme.border}`,
                  boxShadow: `0 20px 40px -10px rgba(0,0,0,0.15)`
                } : {
                  backgroundColor: darkMode ? '#121212' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#000000',
                  borderTop: `6px solid ${selectedTool.designToken?.primaryColor || '#3b82f6'}`,
                  borderRadius: '24px'
                }}
              >
                <div 
                  className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
                  style={theme ? {
                    backgroundColor: isDarkMode ? 'rgba(18,18,18,0.9)' : `${theme.bg}ee`,
                    backdropFilter: 'blur(12px)',
                    borderBottom: `1px solid ${theme.border}`,
                    borderTopLeftRadius: theme.radiusCard,
                    borderTopRightRadius: theme.radiusCard
                  } : {
                    backgroundColor: darkMode ? 'rgba(18,18,18,0.8)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(128,128,128,0.2)',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px'
                  }}
                >
                  <div className="flex items-center gap-4">
                    {selectedTool.favicon && (
                      <img src={selectedTool.favicon} alt="icon" className="w-8 h-8 object-contain" style={{ borderRadius: theme?.radiusButton || '8px' }} />
                    )}
                    <h2 className="text-2xl font-bold" style={theme ? { fontFamily: theme.fontHeading, color: theme.primary } : { color: selectedTool.designToken?.primaryColor || '#3b82f6' }}>
                      {selectedTool.name}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedTool(null)}
                    className="p-2.5 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 sm:p-12 flex-1">
                  <div className="max-w-3xl">
                    <p className="text-xl opacity-90 mb-10 leading-relaxed font-medium" style={{ color: 'inherit' }}>
                      {selectedTool.description}
                    </p>
                    <a 
                      href={selectedTool.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-semibold"
                      style={theme ? {
                        backgroundColor: theme.primary,
                        color: theme.theme === 'dark' || isDarkMode ? '#ffffff' : theme.bg,
                        padding: '12px 24px',
                        borderRadius: theme.radiusButton
                      } : {
                        backgroundColor: selectedTool.designToken?.primaryColor || '#3b82f6',
                        color: '#ffffff',
                        padding: '12px 24px',
                        borderRadius: '8px'
                      }}
                    >
                      바로가기
                    </a>
                  </div>

                  {selectedTool.useCases && selectedTool.useCases.length > 0 && selectedTool.useCases[0].media && selectedTool.useCases[0].media[0].url && (
                    <div className="mt-16 space-y-8 animate-fade-in-up">
                      <h3 
                        className="text-2xl font-bold pb-4 opacity-90"
                        style={{ borderBottom: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`, fontFamily: theme?.fontHeading, color: theme ? theme.text : undefined }}
                      >
                        실제 활용 사례
                      </h3>
                      {selectedTool.useCases.map((useCase, idx) => (
                        <div key={idx} className="space-y-6">
                          {useCase.description && (
                            <p className="opacity-90 text-lg leading-relaxed whitespace-pre-wrap bg-black/5 dark:bg-white/5 p-6 rounded-2xl">{useCase.description}</p>
                          )}
                          {useCase.media && (
                            <div className="grid gap-8 mt-4">
                              {useCase.media.map((item, mIdx) => (
                                item.url.match(/\.(mp4|webm)$/i) ? (
                                  <video 
                                    key={mIdx} 
                                    src={getMediaUrl(item.url)} 
                                    controls
                                    className="w-full shadow-2xl"
                                    style={{
                                      borderRadius: theme?.radiusCard || '24px',
                                      border: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`
                                    }}
                                  />
                                ) : item.url.match(/vimeo\.com|youtube\.com|youtu\.be/i) ? (
                                  <div 
                                    key={mIdx} 
                                    className="relative w-full aspect-video shadow-2xl" 
                                    style={{
                                      borderRadius: theme?.radiusCard || '24px',
                                      border: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <iframe
                                      src={getEmbedUrl(item.url)}
                                      allow="autoplay; fullscreen; picture-in-picture"
                                      className="absolute inset-0 w-full h-full border-0"
                                    />
                                  </div>
                                ) : item.url.match(/drive\.google\.com\/file\/d\/([^/]+)/) ? (
                                  <div
                                    key={mIdx}
                                    className="relative w-full aspect-video shadow-2xl"
                                    style={{
                                      borderRadius: theme?.radiusCard || '24px',
                                      border: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <iframe
                                      src={`https://drive.google.com/file/d/${item.url.match(/drive\.google\.com\/file\/d\/([^/]+)/)[1]}/preview`}
                                      allow="autoplay"
                                      className="absolute inset-0 w-full h-full border-0"
                                    />
                                  </div>
                                ) : item.url.match(/^https?:\/\//i) && !item.url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) ? (
                                  <a
                                    key={mIdx}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-5 shadow-lg hover:shadow-xl transition-shadow no-underline"
                                    style={{
                                      borderRadius: theme?.radiusCard || '16px',
                                      border: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`,
                                      backgroundColor: theme ? `${theme.border}25` : 'rgba(0,0,0,0.03)',
                                      color: theme ? theme.text : undefined,
                                      textDecoration: 'none'
                                    }}
                                  >
                                    <div
                                      className="w-12 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden"
                                      style={{ borderRadius: theme?.radiusButton || '8px', backgroundColor: theme ? `${theme.border}50` : 'rgba(0,0,0,0.08)' }}
                                    >
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=64`}
                                        alt=""
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => { e.target.style.display='none'; }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm truncate" style={{ color: theme ? theme.text : undefined }}>{new URL(item.url).hostname}</p>
                                      <p className="text-xs truncate mt-0.5" style={{ opacity: 0.6, color: theme ? theme.text : undefined }}>{item.url}</p>
                                    </div>
                                    <ArrowUpRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
                                  </a>
                                ) : (
                                  <img 
                                    key={mIdx} 
                                    src={getMediaUrl(item.url)} 
                                    alt="" 
                                    className="w-full shadow-2xl"
                                    style={{
                                      borderRadius: theme?.radiusCard || '24px',
                                      border: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`
                                    }}
                                  />
                                )
                              ))}
                            </div>
                          )}
                          {/* links: embed / bookmark / mention */}
                          {useCase.links && useCase.links.length > 0 && (
                            <div className="space-y-4 mt-4">
                              {useCase.links.filter(l => l.url).map((link, lIdx) => (
                                link.type === 'embed' ? (
                                  <div
                                    key={lIdx}
                                    className="relative w-full shadow-2xl"
                                    style={{
                                      borderRadius: theme?.radiusCard || '16px',
                                      border: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`,
                                      overflow: 'hidden',
                                      aspectRatio: '16/9'
                                    }}
                                  >
                                    <iframe
                                      src={link.url}
                                      title={link.title || link.url}
                                      className="absolute inset-0 w-full h-full border-0"
                                      allow="autoplay; fullscreen"
                                    />
                                  </div>
                                ) : link.type === 'mention' ? (
                                  <a
                                    key={lIdx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 font-semibold text-sm underline underline-offset-2"
                                    style={{ color: theme ? theme.primary : '#3b82f6' }}
                                  >
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(link.url).hostname } catch { return '' } })()}&sz=32`}
                                      alt=""
                                      className="w-4 h-4 object-contain"
                                      onError={(e) => { e.target.style.display='none'; }}
                                    />
                                    {link.title || link.url}
                                    <ArrowUpRight size={13} />
                                  </a>
                                ) : (
                                  /* bookmark (default) */
                                  <a
                                    key={lIdx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-5 shadow-lg hover:shadow-xl transition-shadow"
                                    style={{
                                      borderRadius: theme?.radiusCard || '16px',
                                      border: `1px solid ${theme?.border || 'rgba(128,128,128,0.2)'}`,
                                      backgroundColor: theme ? `${theme.border}25` : 'rgba(0,0,0,0.03)',
                                      color: theme ? theme.text : undefined,
                                      textDecoration: 'none'
                                    }}
                                  >
                                    <div
                                      className="w-12 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden"
                                      style={{ borderRadius: theme?.radiusButton || '8px', backgroundColor: theme ? `${theme.border}50` : 'rgba(0,0,0,0.08)' }}
                                    >
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(link.url).hostname } catch { return '' } })()}&sz=64`}
                                        alt=""
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => { e.target.style.display='none'; }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm truncate" style={{ color: theme ? theme.text : undefined }}>
                                        {link.title || (() => { try { return new URL(link.url).hostname } catch { return link.url } })()}
                                      </p>
                                      <p className="text-xs truncate mt-0.5" style={{ opacity: 0.6, color: theme ? theme.text : undefined }}>{link.url}</p>
                                    </div>
                                    <ArrowUpRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
                                  </a>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  

                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Editor Modal */}
      {editingTool && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setEditingTool(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
              <Pencil size={24} className="text-blue-500" /> 데이터 수정 ({editingTool.name})
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">이름</label>
                <input 
                  type="text" 
                  value={editingTool.name}
                  onChange={(e) => setEditingTool({...editingTool, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">설명</label>
                <input 
                  type="text" 
                  value={editingTool.description}
                  onChange={(e) => setEditingTool({...editingTool, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">검색 키워드 (쉼표 구분)</label>
                <input 
                  type="text" 
                  value={editingTool.keywords || ''}
                  onChange={(e) => setEditingTool({...editingTool, keywords: e.target.value})}
                  placeholder="예: 클로드, 챗지피티, 제미나이"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">카테고리</label>
                  <input 
                    type="text" 
                    value={editingTool.category}
                    onChange={(e) => setEditingTool({...editingTool, category: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">등급 (필수/심화/일반)</label>
                  <input 
                    type="text" 
                    value={editingTool.tier}
                    onChange={(e) => setEditingTool({...editingTool, tier: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">사이트 주소 (URL)</label>
                <input 
                  type="text" 
                  value={editingTool.site}
                  onChange={(e) => setEditingTool({...editingTool, site: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">썸네일 영상/이미지 (URL)</label>
                <input 
                  type="text" 
                  value={editingTool.thumbnailMedia || ''}
                  onChange={(e) => setEditingTool({...editingTool, thumbnailMedia: e.target.value})}
                  placeholder="예: https://.../demo.mp4 (입력 시 캡처 대신 이 미디어가 재생됩니다)"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">🎨 디자인 (DESIGN.md 파싱)</h4>

                </div>
                <div>
                  <textarea 
                    rows={4}
                    value={editingTool.designMd || ''}
                    onChange={(e) => setEditingTool({...editingTool, designMd: e.target.value})}
                    placeholder="Refero 사이트 등에서 복사한 DESIGN.md 텍스트를 이곳에 붙여넣어주세요."
                    className="w-full px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono resize-none"
                  />
                </div>
                

              </div>
              <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">실제 활용 사례</h4>
                  <button 
                    onClick={() => {
                      const newUseCases = [...(editingTool.useCases || [])];
                      newUseCases.push({ title: "활용 사례", description: "", media: [{ type: "image", url: "" }] });
                      setEditingTool({...editingTool, useCases: newUseCases});
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30"
                  >
                    + 사례 추가
                  </button>
                </div>
                
                {editingTool.useCases?.map((useCase, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 relative">
                    <button 
                      onClick={() => {
                        const newUseCases = [...editingTool.useCases];
                        newUseCases.splice(idx, 1);
                        setEditingTool({...editingTool, useCases: newUseCases});
                      }}
                      className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700 font-bold p-2"
                    >
                      삭제
                    </button>
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">활용 영상/이미지 URL</label>
                        <input 
                          type="text" 
                          value={useCase.media?.[0]?.url || ''}
                          onChange={(e) => {
                            const newUseCases = [...editingTool.useCases];
                            if(!newUseCases[idx].media) newUseCases[idx].media = [{ type: "image", url: "" }];
                            newUseCases[idx].media[0].url = e.target.value;
                            setEditingTool({...editingTool, useCases: newUseCases});
                          }}
                          placeholder="예: https://example.com/demo.mp4"
                          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">활용 설명</label>
                        <textarea 
                          rows={3}
                          value={useCase.description || ''}
                          onChange={(e) => {
                            const newUseCases = [...editingTool.useCases];
                            newUseCases[idx].description = e.target.value;
                            setEditingTool({...editingTool, useCases: newUseCases});
                          }}
                          placeholder="이 툴을 실제로 어떻게 활용했는지 설명해주세요."
                          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm resize-none"
                        />
                      </div>
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">외부 링크 (임베드/북마크/멘션)</label>
                          <button
                            onClick={() => {
                              const newUseCases = [...editingTool.useCases];
                              if (!newUseCases[idx].links) newUseCases[idx].links = [];
                              newUseCases[idx].links.push({ url: "", type: "bookmark", title: "" });
                              setEditingTool({...editingTool, useCases: newUseCases});
                            }}
                            className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded"
                          >
                            + 링크 추가
                          </button>
                        </div>
                        {useCase.links?.map((link, lIdx) => (
                          <div key={lIdx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 mb-2 bg-white dark:bg-zinc-800 p-2 rounded border border-zinc-200 dark:border-zinc-700 relative">
                            <select
                              value={link.type}
                              onChange={(e) => {
                                const newUseCases = [...editingTool.useCases];
                                newUseCases[idx].links[lIdx].type = e.target.value;
                                setEditingTool({...editingTool, useCases: newUseCases});
                              }}
                              className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-1 py-1"
                            >
                              <option value="bookmark">🔖 북마크</option>
                              <option value="embed">📺 임베드</option>
                              <option value="mention">💬 멘션</option>
                            </select>
                            <input
                              type="text"
                              placeholder="제목 (선택)"
                              value={link.title || ''}
                              onChange={(e) => {
                                const newUseCases = [...editingTool.useCases];
                                newUseCases[idx].links[lIdx].title = e.target.value;
                                setEditingTool({...editingTool, useCases: newUseCases});
                              }}
                              className="w-24 sm:w-32 shrink-0 text-xs px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-900"
                            />
                            <input
                              type="text"
                              placeholder="https://..."
                              value={link.url}
                              onChange={(e) => {
                                const newUseCases = [...editingTool.useCases];
                                newUseCases[idx].links[lIdx].url = e.target.value;
                                setEditingTool({...editingTool, useCases: newUseCases});
                              }}
                              className="flex-1 min-w-[150px] text-xs px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-900"
                            />
                            <button
                              onClick={() => {
                                const newUseCases = [...editingTool.useCases];
                                newUseCases[idx].links.splice(lIdx, 1);
                                setEditingTool({...editingTool, useCases: newUseCases});
                              }}
                              className="text-red-500 font-bold text-xs px-2"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button 
                onClick={() => handleDeleteTool(editingTool.id)}
                className="px-4 py-2 rounded-xl font-bold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                삭제
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingTool(null)}
                  className="px-5 py-2 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => handleSaveTool(editingTool)}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
