# DeFixs 🚀
**The Intelligent, Zero-Friction Code Mentorship Platform**

DeFixs is an ultra-fast, minimalist AI-powered debugging engine. Built entirely with Vanilla JavaScript and Node.js, it replaces frustrating syntax searches with an instantly responsive, senior-developer-level AI mentor that pinpoints errors, fixes them, and explains them clearly.

## ✨ Key Features
- **Instant Bug Identification:** Paste broken code and let the AI find exact syntax, logic, and structural errors instantly.
- **Deep Explanations:** Get simple, jargon-free explanations to understand *why* the bug occurred and how to prevent it.
- **Multi-Language Support:** First-class support for over 15 programming languages including JavaScript, Python, Java, C++, TypeScript, Go, Rust, and more.
- **Minimalist Aesthetic UI:** A clean, completely distraction-free interface built with Tailwind CSS, featuring interactive physics backgrounds, glassmorphism typography, and blazing fast syntax highlighting via CodeMirror 6.
- **Persistent Local History:** Your most recent debugging sessions automatically save to your system's `localStorage` for up to 3 days, allowing instant retrieval of past solutions via a sleek sidebar drawer without needing a heavy database.
- **Dual AI Processing:** Powered by an intelligent backend that seamlessly routes requests between Groq (LLaMA-3 70B) and Google Gemini AI for incredibly fast generation, maximum uptime, and dynamic quota balancing.

## 🛠️ Tech Stack
- **Frontend:** HTML5, Vanilla JS (`src/main.js`), Vanilla CSS heavily augmented with TailwindCSS (Utility styling & color-mix tokens), CodeMirror 6 (Code editing & custom theming), Lucide Icons, and AOS (Animations).
- **Backend:** Node.js, Express.js API middleware.
- **AI Engines:** Groq SDK (`llama-3.3-70b`), Google Gemini SDK.

## ⚙️ Quick Start & Local Development

### 1. Clone the Repository
Ensure you have cloned the repository and navigated to the project root directory.

### 2. Install Dependencies
Install all root frontend and server dependencies.
```bash
npm install
cd server && npm install
```

### 3. Environment Configuration
From the root directory, navigate to the `server/` directory and create a `.env` file to securely store your API keys. You will need to configure your AI providers.
```bash
cd server
touch .env
```
Inside the `server/.env` file, provide the following variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

### 4. Boot Development Servers
Since the platform uses Vite for the frontend and Express for the modular API, you should boot both environments for local testing.
```bash
# Terminal 1: Boot the Frontend UI Hub (Vite)
npm run dev

# Terminal 2: Boot the AI Backend (Express API)
cd server
node server.js
```
*Note: If doing a final unified production build, you can simply run `npm run build` and use `npm start` from root to serve everything directly via the Express API server at `http://localhost:3000`.*

## 📐 Platform Architecture
DeFixs follows a strict decoupling pattern for ultimate speed:
1. **The Client:** A lightweight Vite build serves `index.html` and a monolithic `main.js` controller. UI states are completely reactive and handled securely using native Vanilla Web APIs without the overhead of heavy frameworks like React.
2. **The API Bridge:** A Node/Express.js backend acts as a secure proxy. It orchestrates all LLM Prompt Engineering, safely hides API keys, explicitly filters responses, and sanitizes AI outputs sequentially into standardized JSON objects for the frontend workspace engine to render.

## 🤝 Contributing
Contributions are absolutely welcome! Whether it is expanding the UI's micro-animations, adding support for a new language, or refining the AI Server's prompt logic, feel free to open a pull request.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
Distributed under the MIT License.
