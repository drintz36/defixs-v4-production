import './index.css';
import './App.css';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { placeholder } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getHistory, saveToHistory, clearHistory, formatTimestamp, deleteHistoryItem } from './history';

// --- Exact Original UIW Themes ---
const darkTheme = {
  "&": { backgroundColor: "#2f2f2f", color: "#e4e4e7", fontSize: "13px", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace" },
  ".cm-gutters": { backgroundColor: "#2f2f2f", color: "rgba(180, 180, 180, 0.45)", borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: "8px" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "rgba(200, 210, 225, 0.7)" },
  ".cm-activeLine": { backgroundColor: "rgba(110, 168, 254, 0.06)" },
  ".cm-cursor": { borderLeftColor: "#58a6ff", borderLeftWidth: "2px" },
  ".cm-selectionBackground": { backgroundColor: "rgba(56,139,253,0.25) !important" },
  "&.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(56,139,253,0.35) !important" },
  ".cm-matchingBracket": { backgroundColor: "rgba(56,139,253,0.2)", outline: "1px solid rgba(56,139,253,0.4)" }
};

const lightTheme = {
  "&": { backgroundColor: "#f4f4f4", color: "#1e293b", fontSize: "13px", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace" },
  ".cm-gutters": { backgroundColor: "#f4f4f4", color: "rgba(100, 116, 139, 0.4)", borderRight: "1px solid rgba(0,0,0,0.06)", paddingRight: "8px" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "rgba(100, 116, 139, 0.7)" },
  ".cm-activeLine": { backgroundColor: "rgba(0,0,0,0.02)" },
  ".cm-cursor": { borderLeftColor: "#3b82f6", borderLeftWidth: "2px" },
  ".cm-selectionBackground": { backgroundColor: "rgba(59,130,246,0.15) !important" },
  "&.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(59,130,246,0.2) !important" },
  ".cm-matchingBracket": { backgroundColor: "rgba(59,130,246,0.15)", outline: "1px solid rgba(59,130,246,0.3)" }
};

const appDarkTheme = createTheme({ theme: "dark", settings: darkTheme, styles: [{ tag: t.keyword, color: "#c084fc" }, { tag: t.string, color: "#86efac" }, { tag: t.number, color: "#fbbf24" }, { tag: t.comment, color: "#6b7280", fontStyle: "italic" }, { tag: t.function(t.variableName), color: "#60a5fa" }, { tag: t.variableName, color: "#e4e4e7" }, { tag: t.typeName, color: "#67e8f9" }, { tag: t.tagName, color: "#f87171" }, { tag: t.attributeName, color: "#fbbf24" }, { tag: t.operator, color: "#94a3b8" }, { tag: t.punctuation, color: "#94a3b8" }, { tag: t.propertyName, color: "#60a5fa" }, { tag: t.bool, color: "#fbbf24" }, { tag: t.null, color: "#f87171" }, { tag: t.className, color: "#67e8f9" }, { tag: t.definition(t.variableName), color: "#93c5fd" }] });
const appLightTheme = createTheme({ theme: "light", settings: lightTheme, styles: [{ tag: t.keyword, color: "#7c3aed" }, { tag: t.string, color: "#16a34a" }, { tag: t.number, color: "#d97706" }, { tag: t.comment, color: "#9ca3af", fontStyle: "italic" }, { tag: t.function(t.variableName), color: "#2563eb" }, { tag: t.variableName, color: "#1e293b" }, { tag: t.typeName, color: "#0891b2" }, { tag: t.tagName, color: "#dc2626" }, { tag: t.attributeName, color: "#d97706" }, { tag: t.operator, color: "#64748b" }, { tag: t.punctuation, color: "#64748b" }, { tag: t.propertyName, color: "#2563eb" }, { tag: t.bool, color: "#d97706" }, { tag: t.null, color: "#dc2626" }, { tag: t.className, color: "#0891b2" }, { tag: t.definition(t.variableName), color: "#3b82f6" }] });

const themeCompartment = new Compartment();
const isDark = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
if (isDark) document.documentElement.classList.add('dark');
else document.documentElement.classList.remove('dark');

const activeTheme = isDark ? appDarkTheme : appLightTheme;

// --- Language Selector Logic (Ported exactly from LanguageSelector.jsx) ---
const LANGUAGES = ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart", "HTML", "CSS", "SQL", "Bash", "Lua", "R", "Scala"];
let selectedLanguage = "";

const dropdownBtn = document.getElementById('language-dropdown-btn');
const dropdownMenu = document.getElementById('language-dropdown-menu');
const dropdownArrow = document.getElementById('language-dropdown-arrow');
const dropdownList = document.getElementById('language-dropdown-list');
const selectedText = document.getElementById('language-selected-text');

function renderLanguages() {
  dropdownList.innerHTML = LANGUAGES.map(lang => {
    const val = lang === "Auto-Detect" ? "" : lang;
    const isSelected = selectedLanguage === val;
    return `
      <button
        type="button"
        data-lang="${val}"
        class="lang-option w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center justify-between cursor-pointer ${isSelected
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
      }"
      >
        <span>${lang}</span>
        ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>' : ''}
      </button>
    `;
  }).join('');

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lang = e.currentTarget.getAttribute('data-lang');
      selectedLanguage = lang;
      selectedText.innerText = lang || "Language";
      renderLanguages();
      closeDropdown();
      updateEditorMode();

      // Hide validation tooltip if it was showing
      const validationTooltip = document.getElementById('language-validation-tooltip');
      if (validationTooltip) validationTooltip.classList.add('hidden');

      // Hide error banner if it was showing a language requirement
      const errorBanner = document.getElementById('error-banner');
      if (errorBanner && !errorBanner.classList.contains('hidden')) {
        errorBanner.classList.add('hidden');
      }
    });
  });
}

function toggleDropdown() {
  const isOpen = !dropdownMenu.classList.contains('hidden');
  if (isOpen) closeDropdown();
  else openDropdown();
}

function openDropdown() {
  dropdownMenu.classList.remove('hidden');
  dropdownArrow.classList.add('rotate-180');
  updateAria(true);
}

function closeDropdown() {
  dropdownMenu.classList.add('hidden');
  dropdownArrow.classList.remove('rotate-180');
  updateAria(false);
}

if (dropdownBtn) {
  dropdownBtn.setAttribute('aria-haspopup', 'listbox');
  dropdownBtn.setAttribute('aria-expanded', 'false');
  dropdownBtn.addEventListener('click', toggleDropdown);
  renderLanguages();
  document.addEventListener("mousedown", (e) => {
    const container = document.getElementById('language-dropdown-container');
    if (container && !container.contains(e.target)) closeDropdown();
  });
}

function updateAria(isOpen) {
  if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', isOpen.toString());
}

function updateEditorMode() {
  // Simple mapping update for the CodeMirror editor logic if needed
  // Real implementation uses compartments, but for now we rely on backend mapping.
}

// --- Editor Configuration ---
const updateListener = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    const hasText = update.state.doc.toString().trim().length > 0;
    const btnDebug = document.getElementById('btn-debug');
    const btnClear = document.getElementById('btn-clear');
    if (btnDebug) btnDebug.disabled = !hasText;
    if (btnClear) btnClear.disabled = !hasText;
  }
});

const inputState = EditorState.create({
  doc: "",
  extensions: [
    basicSetup,
    javascript(),
    themeCompartment.of(activeTheme),
    EditorView.lineWrapping,
    placeholder("// Paste your buggy code here...\nfunction calculateTotal(items) {\n  return items.map(i => i.price).reduce((a,b) => a+b)\n}"),
    updateListener
  ]
});
const inputEditor = new EditorView({
  state: inputState,
  parent: document.getElementById('editor-container')
});

// --- Output Panel Logic ---
const btnCopy = document.getElementById('btn-copy');
const copyIcon = document.getElementById('copy-icon');
const copyTextEle = document.getElementById('copy-text');
const outputEditorWrapper = document.getElementById('output-editor-wrapper');
const outputEmpty = document.getElementById('output-empty');
const outputLoading = document.getElementById('output-loading');

let lastGeneratedCode = "";

const outputState = EditorState.create({
  doc: "",
  extensions: [
    basicSetup,
    javascript(),
    themeCompartment.of(activeTheme),
    EditorView.lineWrapping,
    EditorState.readOnly.of(true)
  ]
});

const outputEditor = new EditorView({
  state: outputState,
  parent: document.getElementById('output-editor-wrapper')
});

if (btnCopy) {
  btnCopy.addEventListener('click', () => {
    if (!lastGeneratedCode) return;
    navigator.clipboard.writeText(lastGeneratedCode);
    btnCopy.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-green-500"></i><span>Copied!</span>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      btnCopy.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>`;
      if (window.lucide) window.lucide.createIcons();
    }, 2000);
  });
}

// --- Particles Background Physics ---
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particlesArray = [];
  const mouse = { x: null, y: null, radius: 150 };

  const handleMouseMove = (event) => {
    if (event.target && event.target.closest('footer, .group, #code-editor-section, .rounded-xl')) {
      mouse.x = null; mouse.y = null; return;
    }
    mouse.x = event.x; mouse.y = event.y;
  };
  const handleMouseOut = () => { mouse.x = null; mouse.y = null; };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseout', handleMouseOut);

  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8b5cf6', '#3b82f6', '#0ea5e9'];

  class Particle {
    constructor() {
      this.x = Math.random() * window.innerWidth;
      this.y = Math.random() * window.innerHeight;
      this.size = Math.random() * 2 + 1.2;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.speedY = (Math.random() - 0.5) * 0.8;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > window.innerWidth) this.speedX *= -1;
      if (this.y < 0 || this.y > window.innerHeight) this.speedY *= -1;

      if (mouse.x != null && mouse.y != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          this.x -= forceDirectionX * force * 4;
          this.y -= forceDirectionY * force * 4;
        }
      }
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.shadowBlur = 4;
      ctx.shadowColor = this.color;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  const connectNodes = () => {
    for (let a = 0; a < particlesArray.length; a++) {
      for (let b = a + 1; b < particlesArray.length; b++) {
        const dx = particlesArray[a].x - particlesArray[b].x;
        const dy = particlesArray[a].y - particlesArray[b].y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < 15000) {
          const distance = Math.sqrt(distanceSq);
          let opacity = 1 - distance / 120;
          if (opacity < 0) opacity = 0;
          ctx.strokeStyle = `rgba(130, 150, 180, ${opacity * 0.25})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }
    }
  };

  const init = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesArray = [];
    const numberOfParticles = Math.min(150, Math.floor((canvas.width * canvas.height) / 8000));
    for (let i = 0; i < numberOfParticles; i++) particlesArray.push(new Particle());
  };

  const animate = () => {
    ctx.fillStyle = document.documentElement.className.includes("dark") ? "rgba(12, 12, 14, 0.2)" : "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
    connectNodes();
    requestAnimationFrame(animate);
  };

  init();
  animate();
  window.addEventListener('resize', init);
}

// --- Initializations ---
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  if (window.lucide) window.lucide.createIcons();
  if (window.AOS) window.AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
  renderHistory();
});

const scrollToEditorBtn = document.getElementById('scroll-to-editor');
if (scrollToEditorBtn) {
  scrollToEditorBtn.addEventListener('click', () => {
    document.getElementById('code-editor-section').scrollIntoView({ behavior: 'smooth' });
  });
}

const scrollToHowItWorksBtn = document.getElementById('scroll-to-how-it-works');
if (scrollToHowItWorksBtn) {
  scrollToHowItWorksBtn.addEventListener('click', () => {
    document.getElementById('how-it-works-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
// --- Theme Toggle Persistence ---
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDarkNow = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');

    // Update CodeMirror themes
    const nextTheme = isDarkNow ? appDarkTheme : appLightTheme;
    inputEditor.dispatch({
      effects: themeCompartment.reconfigure(nextTheme)
    });
    outputEditor.dispatch({
      effects: themeCompartment.reconfigure(nextTheme)
    });

    // Refresh Lucide icons if any switch
    if (window.lucide) window.lucide.createIcons();
  });
}
// --- API Execution ---
const btnDebug = document.getElementById('btn-debug');
const btnDebugText = document.getElementById('btn-debug-text');
const btnDebugIcon = document.getElementById('btn-debug-icon');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const explanationContent = document.getElementById('explanation-content');
const explanationEmpty = document.getElementById('explanation-empty');
const orbitalLoader = document.getElementById('orbital-loader');
const historySidebar = document.getElementById('history-sidebar');
const historyContainer = document.getElementById('history-container');
const historyIndicator = document.getElementById('history-indicator');
const openHistoryBtn = document.getElementById('open-history');
const closeHistoryBtn = document.getElementById('close-history');
const historyBackdrop = document.getElementById('history-backdrop');

function renderHistory() {
  const history = getHistory();

  if (history.length > 0) {
    openHistoryBtn.classList.remove('hidden');
    historyIndicator.classList.remove('hidden');
  } else {
    historyIndicator.classList.add('hidden');
    if (historySidebar && !historySidebar.classList.contains('translate-x-full')) {
      toggleHistory();
    }
  }

  if (history.length === 0) {
    historyContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center opacity-40 py-20">
          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <i data-lucide="clock" class="w-8 h-8"></i>
          </div>
          <p class="text-[13px] font-medium text-gray-400">Your history is empty</p>
        </div>
      `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  historyContainer.innerHTML = history.map((item, index) => {
    const previewTitle = item.buggyCode.substring(0, 120).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));

    const delay = index < 10 ? `${index * 0.05}s` : '0s';

    return `
        <div 
          class="history-card w-full flex flex-col group cursor-pointer animate-[fadeIn_0.5s_ease-out_both]"
          data-id="${item.id}"
          style="animation-delay: ${delay}"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] text-[var(--color-primary-500)] dark:text-[var(--color-primary-400)] font-bold uppercase tracking-widest opacity-70">
              ${formatTimestamp(item.timestamp)}
            </span>
            <button class="delete-history-btn p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all" data-id="${item.id}">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          
          <div class="relative overflow-hidden rounded-xl border border-[var(--color-primary-500)]/20 dark:border-[var(--color-primary-500)]/20 bg-white dark:bg-white/[0.03] shadow-sm group-hover:shadow-md group-hover:scale-[0.98] transition-all duration-300">
             <div class="p-4 pr-16">
                <pre class="text-[11.5px] font-mono text-gray-600 dark:text-gray-400 leading-relaxed truncate"><code>${previewTitle}${item.buggyCode.length > 80 ? '...' : ''}</code></pre>
             </div>
             
             <!-- Restore Fixed Indicator -->
             <div class="absolute bottom-3 right-4 flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary-500)] transition-all duration-300">
                <span>Restore</span>
                <i data-lucide="corner-down-left" class="w-3 h-3"></i>
             </div>
          </div>
        </div>
      `;
  }).join('');

  document.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.delete-history-btn')) return;
      const id = card.getAttribute('data-id');
      const item = getHistory().find(h => h.id === id);
      if (item) restoreHistoryItem(item);
    });
  });

  document.querySelectorAll('.delete-history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(btn.getAttribute('data-id'));
      renderHistory();
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function toggleHistory() {
  const isOpening = historySidebar.classList.contains('translate-x-full');
  historySidebar.classList.toggle('translate-x-full');

  if (isOpening) {
    historyBackdrop.classList.remove('pointer-events-none');
    historyBackdrop.classList.add('opacity-100');
  } else {
    historyBackdrop.classList.add('pointer-events-none');
    historyBackdrop.classList.remove('opacity-100');
  }
}

if (openHistoryBtn) openHistoryBtn.addEventListener('click', toggleHistory);
if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', toggleHistory);
if (historyBackdrop) historyBackdrop.addEventListener('click', toggleHistory);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !historySidebar.classList.contains('translate-x-full')) {
    toggleHistory();
  }
});

function restoreHistoryItem(item) {
  inputEditor.dispatch({
    changes: { from: 0, to: inputEditor.state.doc.length, insert: item.buggyCode }
  });
  lastGeneratedCode = item.fixedCode;
  outputEditor.dispatch({
    changes: { from: 0, to: outputEditor.state.doc.length, insert: item.fixedCode }
  });
  outputEmpty.classList.add('hidden');
  outputEditorWrapper.classList.remove('hidden');
  outputLoading.classList.add('hidden');

  if (item.analysis) {
    renderAnalysis(item.analysis);
    explanationEmpty.classList.add('hidden');
    explanationContent.classList.remove('hidden');
  }

  // Scroll back to top
  document.getElementById('code-editor-section').scrollIntoView({ behavior: 'smooth' });

  // Auto-close sidebar on mobile or large screens too for focus
  if (window.innerWidth < 1024) toggleHistory();
}

function renderAnalysis(analysis) {
  const { issues, how_to_fix, suggestions } = analysis;

  const renderSection = (title, items, type) => {
    if (!items || items.length === 0) return '';

    const themeMap = {
      issues: {
        color: 'text-red-500',
        bg: 'bg-red-500/5',
        border: 'border-red-500/20',
        hover: 'hover:border-red-500/40',
        icon: 'alert-circle',
        itemIcon: 'circle-dot',
        itemIconColor: 'text-red-500/60'
      },
      fix: {
        color: 'text-green-500',
        bg: 'bg-green-500/5',
        border: 'border-green-500/20',
        hover: 'hover:border-green-500/40',
        icon: 'check-circle',
        itemIcon: 'arrow-right-circle',
        itemIconColor: 'text-green-500/60'
      },
      suggestions: {
        color: 'text-blue-500',
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
        hover: 'hover:border-blue-500/40',
        icon: 'lightbulb',
        itemIcon: 'zap',
        itemIconColor: 'text-blue-500/60'
      }
    };

    const theme = themeMap[type];

    return `
        <section class="flex flex-col gap-5 p-8 rounded-3xl ${theme.bg} border ${theme.border} ${theme.hover} transition-all duration-300 animate-[fadeIn_0.5s_ease-out_both] group">
          <div class="flex items-center justify-between">
            <h4 class="font-bold ${theme.color} text-[15px] uppercase tracking-[0.2em] flex items-center gap-2.5">
              <i data-lucide="${theme.icon}" class="w-5 h-5"></i>
              + ${title}
            </h4>
          </div>
          <div class="space-y-4">
            ${items.map((item, idx) => `
              <div class="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 group-hover:border-white/10 transition-all duration-300">
                 <div class="mt-1 ${theme.itemIconColor}">
                    <i data-lucide="${theme.itemIcon}" class="w-4 h-4"></i>
                 </div>
                 <div class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    ${marked.parse(item)}
                 </div>
              </div>
            `).join('')}
          </div>
        </section>
      `;
  };

  const explanationHTML = `
      <div class="flex flex-col gap-10 max-w-[1300px] mx-auto pb-10">
        ${renderSection('Issues Detected', issues, 'issues')}
        ${renderSection('How to Fix', how_to_fix, 'fix')}
        ${renderSection('Suggestions & Tips', suggestions, 'suggestions')}
      </div>
    `;
  explanationContent.innerHTML = DOMPurify.sanitize(explanationHTML);
  if (window.lucide) window.lucide.createIcons();
}

const btnClearHistory = document.getElementById('btn-clear-history');
if (btnClearHistory) {
  btnClearHistory.addEventListener('click', () => {
    clearHistory();
    renderHistory();
  });
}

btnDebug.addEventListener('click', async () => {
  const code = inputEditor.state.doc.toString();
  if (!code.trim()) return;

  if (!selectedLanguage) {
    // Show the validation tooltip with a bounce
    const validationTooltip = document.getElementById('language-validation-tooltip');
    if (validationTooltip) validationTooltip.classList.remove('hidden');

    dropdownBtn.classList.add('ring-2', 'ring-red-500');
    setTimeout(() => {
      dropdownBtn.classList.remove('ring-2', 'ring-red-500');
      if (validationTooltip) validationTooltip.classList.add('hidden');
    }, 3000);
    return;
  }

  // Reset error text if previously changed
  const errorTitle = document.getElementById('error-title');
  if (errorTitle) errorTitle.innerText = 'Action Required';

  // Set Loading UI State
  btnDebug.disabled = true;
  btnCopy.disabled = true;
  btnDebugText.innerText = 'Debugging...';
  btnDebugIcon.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>';
  errorBanner.classList.add('hidden');

  if (orbitalLoader) {
    orbitalLoader.classList.remove('hidden');
    orbitalLoader.classList.add('flex');
  }

  explanationEmpty.classList.add('hidden');
  explanationContent.classList.remove('hidden');
  explanationContent.innerHTML = `
    <div class="h-full flex flex-col gap-4 animate-pulse">
      <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-full mt-4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-11/12"></div>
      <div class="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl w-full mt-6"></div>
    </div>
  `;

  outputEmpty.classList.add('hidden');
  outputEditorWrapper.classList.add('hidden');
  outputLoading.classList.remove('hidden');

  try {
    // If the frontend is hosted on GitHub Pages, you MUST change this string to your live Backend URL (e.g. 'https://my-backend.onrender.com/api/debug')
    const API_URL = '/api/debug';

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buggyCode: code, language: selectedLanguage })
    });

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("The backend AI server is unreachable. (Received an HTML error page instead of API JSON). If you are testing this on GitHub Pages, remember that GitHub Pages cannot host Node.js backends. You must deploy the backend server code and update API_URL.");
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${res.status}`);
    }

    const data = await res.json();

    // Set Output Panel
    lastGeneratedCode = data.fixed_code || '';

    // Update the CodeMirror instance safely without recreating
    outputEditor.dispatch({
      changes: {
        from: 0,
        to: outputEditor.state.doc.length,
        insert: lastGeneratedCode
      }
    });

    outputLoading.classList.add('hidden');
    outputEditorWrapper.classList.remove('hidden');

    if (data.analysis) {
      renderAnalysis(data.analysis);
    } else {
      explanationContent.innerHTML = '<p>No analysis provided.</p>';
    }

    // Save to History
    saveToHistory({
      language: selectedLanguage || "Auto-Detect",
      buggyCode: code,
      fixedCode: data.fixed_code,
      analysis: data.analysis
    });
    renderHistory();
  } catch (err) {
    errorBanner.classList.remove('hidden');
    errorMessage.innerText = err.message;
    explanationContent.innerHTML = '';
    explanationEmpty.classList.remove('hidden');
    explanationContent.classList.add('hidden');

    outputLoading.classList.add('hidden');
    outputEditorWrapper.classList.add('hidden');
    outputEmpty.classList.remove('hidden');
  } finally {
    btnDebug.disabled = false;
    btnCopy.disabled = false;
    btnDebugText.innerText = 'Debug Code';
    btnDebugIcon.innerHTML = '<i data-lucide="zap" class="w-4 h-4 fill-current"></i>';
    if (window.lucide) window.lucide.createIcons();

    if (orbitalLoader) {
      orbitalLoader.classList.add('hidden');
      orbitalLoader.classList.remove('flex');
    }
  }
});

const btnClear = document.getElementById('btn-clear');
if (btnClear) {
  btnClear.addEventListener('click', () => {
    // 1. Clear Input Editor
    inputEditor.dispatch({
      changes: { from: 0, to: inputEditor.state.doc.length, insert: "" }
    });

    // 2. Clear Output Editor
    outputEditor.dispatch({
      changes: { from: 0, to: outputEditor.state.doc.length, insert: "" }
    });
    outputEmpty.classList.remove('hidden');
    outputEditorWrapper.classList.add('hidden');
    lastGeneratedCode = "";

    // 3. Clear Analysis Report
    explanationContent.innerHTML = "";
    explanationContent.classList.add('hidden');
    explanationEmpty.classList.remove('hidden');

    // Reset UI states
    errorBanner.classList.add('hidden');
    errorMessage.innerText = "";

    // Refresh icons
    if (window.lucide) window.lucide.createIcons();
  });
}
