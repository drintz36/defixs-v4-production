import './index.css';
import './App.css';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { placeholder } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";
import DOMPurify from 'dompurify';
import { marked } from 'marked';

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

const appDarkTheme = createTheme({ theme: "dark", settings: darkTheme, styles: [ { tag: t.keyword, color: "#c084fc" }, { tag: t.string, color: "#86efac" }, { tag: t.number, color: "#fbbf24" }, { tag: t.comment, color: "#6b7280", fontStyle: "italic" }, { tag: t.function(t.variableName), color: "#60a5fa" }, { tag: t.variableName, color: "#e4e4e7" }, { tag: t.typeName, color: "#67e8f9" }, { tag: t.tagName, color: "#f87171" }, { tag: t.attributeName, color: "#fbbf24" }, { tag: t.operator, color: "#94a3b8" }, { tag: t.punctuation, color: "#94a3b8" }, { tag: t.propertyName, color: "#60a5fa" }, { tag: t.bool, color: "#fbbf24" }, { tag: t.null, color: "#f87171" }, { tag: t.className, color: "#67e8f9" }, { tag: t.definition(t.variableName), color: "#93c5fd" } ] });
const appLightTheme = createTheme({ theme: "light", settings: lightTheme, styles: [ { tag: t.keyword, color: "#7c3aed" }, { tag: t.string, color: "#16a34a" }, { tag: t.number, color: "#d97706" }, { tag: t.comment, color: "#9ca3af", fontStyle: "italic" }, { tag: t.function(t.variableName), color: "#2563eb" }, { tag: t.variableName, color: "#1e293b" }, { tag: t.typeName, color: "#0891b2" }, { tag: t.tagName, color: "#dc2626" }, { tag: t.attributeName, color: "#d97706" }, { tag: t.operator, color: "#64748b" }, { tag: t.punctuation, color: "#64748b" }, { tag: t.propertyName, color: "#2563eb" }, { tag: t.bool, color: "#d97706" }, { tag: t.null, color: "#dc2626" }, { tag: t.className, color: "#0891b2" }, { tag: t.definition(t.variableName), color: "#3b82f6" } ] });

const isDark = document.documentElement.className.includes('dark');
const activeTheme = isDark ? appDarkTheme : appLightTheme;

// --- Language Selector Logic (Ported exactly from LanguageSelector.jsx) ---
const LANGUAGES = ["Auto-Detect", "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart", "HTML", "CSS", "SQL", "Bash", "Lua", "R", "Scala"];
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
        class="lang-option w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
          isSelected
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
      selectedText.innerText = lang || "Auto-Detect";
      renderLanguages();
      closeDropdown();
      updateEditorMode();
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
}

function closeDropdown() {
  dropdownMenu.classList.add('hidden');
  dropdownArrow.classList.remove('rotate-180');
}

if(dropdownBtn) {
  dropdownBtn.addEventListener('click', toggleDropdown);
  renderLanguages();
  document.addEventListener("mousedown", (e) => {
    const container = document.getElementById('language-dropdown-container');
    if (container && !container.contains(e.target)) closeDropdown();
  });
}

function updateEditorMode() {
  // Simple mapping update for the CodeMirror editor logic if needed
  // Real implementation uses compartments, but for now we rely on backend mapping.
}

// --- Editor Configuration ---
const updateListener = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    const hasText = update.state.doc.toString().trim().length > 0;
    const btn = document.getElementById('btn-debug');
    if (btn) btn.disabled = !hasText;
  }
});

const inputState = EditorState.create({
  doc: "",
  extensions: [
    basicSetup, 
    javascript(), 
    activeTheme, 
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
const outputPre = document.getElementById('output-pre');
const outputCodeEle = document.getElementById('output-code');
const outputEmpty = document.getElementById('output-empty');
const outputLoading = document.getElementById('output-loading');

let lastGeneratedCode = "";

if(btnCopy) {
  btnCopy.addEventListener('click', () => {
    if(!lastGeneratedCode) return;
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
    ctx.fillStyle = document.documentElement.className.includes("dark") ? "rgba(10, 10, 10, 0.2)" : "rgba(255, 255, 255, 0.2)";
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
});

const scrollToEditorBtn = document.getElementById('scroll-to-editor');
if(scrollToEditorBtn) {
  scrollToEditorBtn.addEventListener('click', () => {
    document.getElementById('code-editor-section').scrollIntoView({ behavior: 'smooth' });
  });
}

const scrollToHowItWorksBtn = document.getElementById('scroll-to-how-it-works');
if(scrollToHowItWorksBtn) {
  scrollToHowItWorksBtn.addEventListener('click', () => {
    document.getElementById('how-it-works-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
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

btnDebug.addEventListener('click', async () => {
  const code = inputEditor.state.doc.toString();
  if (!code.trim()) return;

  // Set Loading UI State
  btnDebug.disabled = true;
  btnCopy.disabled = true;
  btnDebugText.innerText = 'Debugging...';
  btnDebugIcon.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>';
  errorBanner.classList.add('hidden');
  
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
  outputPre.classList.add('hidden');
  outputLoading.classList.remove('hidden');

  try {
    const res = await fetch('http://localhost:3000/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buggyCode: code, language: selectedLanguage })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to analyze code.');
    }

    const data = await res.json();
    
    // Set Output Panel
    lastGeneratedCode = data.fixedCode || '';
    outputCodeEle.innerText = lastGeneratedCode;

    outputLoading.classList.add('hidden');
    outputPre.classList.remove('hidden');

    if (data.explanation) {
      explanationContent.innerHTML = DOMPurify.sanitize(marked.parse(data.explanation));
    } else {
      explanationContent.innerHTML = '<p>No explanation provided.</p>';
    }
  } catch (err) {
    errorBanner.classList.remove('hidden');
    errorMessage.innerText = err.message;
    explanationContent.innerHTML = '';
    explanationEmpty.classList.remove('hidden');
    explanationContent.classList.add('hidden');
    
    outputLoading.classList.add('hidden');
    outputPre.classList.add('hidden');
    outputEmpty.classList.remove('hidden');
  } finally {
    btnDebug.disabled = false;
    btnCopy.disabled = false;
    btnDebugText.innerText = 'Debug Code';
    btnDebugIcon.innerHTML = '<i data-lucide="play" class="w-4 h-4 fill-current"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
});
