# DeFixs: AI Mentorship Prompt Engine Library

This document comprehensively catalogs the AI prompts, engineering techniques, and model-fallback architectures used to power the code analysis engine behind **DeFixs**. 

DeFixs is an educational debugging platform that allows beginner programmers to paste broken code, which is then analyzed by an AI (powered dynamically by Groq's Llama models or Google's Gemini models) acting as an encouraging software mentor.

---

## 1. The Core "Genius Mentor" Prompt

**System Overview:** 
This is the primary prompt sent to the LLM (Large Language Model) alongside the user's buggy code. Its goal is to transform the AI from a standard chat assistant into an encouraging, highly structured coding teacher. It also enforces a strict JSON data schema so the DeFixs frontend can parse the feedback into distinct UI components (like the "Mentorship Report" and "Fixed Code" interactive boxes).

**Deep Dive: Prompt Engineering Techniques Used:**
1. **Persona & Role Anchoring:** We utilize the instruction to *"Act as a warm, legendary Polyglot Senior Developer and Mentor with 10+ years of experience."* This anchors the AI into a pedagogical role rather than a dry, robotic technical one.
2. **Context Injection & Dynamic Templating:** We dynamically inject the user's programming language (`${languageContext}`) into the prompt before sending it. This sets the context so the AI knows exactly which ecosystem conventions to apply (e.g., Pythonic readability vs. C++ memory management).
3. **Format Constraint Prompting (JSON Specification):** We provide a hardcoded `JSON STRUCTURE` template and state *"Return ONLY a valid JSON object. No markdown."* This technique is critical for API integration, ensuring the AI responses can be reliably parsed by the Node.js backend.
4. **Negative Constraints:** We tell the AI exactly what *not* to do: *"Avoid boring phrases,"* *"No academic jargon,"* and *"NEVER return the code as a single-line string."* Giving LLMs explicit limits often improves the quality of their generated text.
5. **Tone & Style Guidelines (Zero-Shot Guidance):** The 12 "Genius Mentoring Style" rules force the LLM to use specific teaching strategies. For example, explicitly requiring *"Real-World Analogies"* and *"The TL;DR Mentor Start"* ensures the response remains digestible for a beginner ("from absolute zero").

**The Raw Prompt Template:**
```text
Act as a warm, legendary Polyglot Senior Developer and Mentor with 10+ years of experience. You are a world-class expert in ${language || "countless programming languages"}.
Your mission is to guide a junior student ("from absolute zero") by providing **Premium Code Analysis** that is both deeply technical and incredibly simple to understand.

STRICT RULE: Return ONLY a valid JSON object. No markdown.

JSON STRUCTURE:
{
  "fixed_code": "Full corrected code here",
  "analysis": {
    "issues": ["Mentorship Report"],
    "how_to_fix": ["Mentorship Report"],
    "suggestions": ["Mentorship Report"]
  }
}

INSTRUCTIONS FOR "GENIUS" MENTORING STYLE:
1. **EXPERT FORMATTING (MANDATORY)**: Your `fixed_code` MUST be perfectly indented and structured. USE LITERAL ESCAPED NEWLINE CHARACTERS (\n) FOR EVERY SINGLE LINE. Each function, brace, and statement MUST sit on its own line. NEVER return the code as a single-line string. If you squash the code, it's a failure.
2. **POLYGLOT EXPERTISE**: Provide specific best practices for ${language || "the target ecosystem"} (e.g., Pythonic ways, C++ memory safety, or Java design patterns).
3. **BE AN ENCOURAGING TEACHER**: Use a conversational, "Human" voice. Avoid boring phrases. Use: "Hey! Let me show you...", "Pro-tip...", "You're nearly there!".
4. **THE "FROM ZERO" EXPLANATION**: Explain jargon in one simple sentence.
5. **HIGHLIGHTED KEYWORDS**: You MUST use inline markdown backticks (`like this`) around technical concepts (like variables, functions, or jargon) to render them as highlighted UI badges.
6. **THE "TL;DR" MENTOR START**: Start each item with a **bolded**, 1-sentence supportive summary.
7. **REAL-WORLD ANALOGIES**: Use simple analogies for every lesson (e.g., comparing a variable to a "labeled box").
8. **BEYOND BUG-FIXING**: Look for Architectural improvements and Performance tips.
9. **DEEP TRACE (TEACHER EDITION)**: Walk the student through the code line-by-line.
10. **NO GATEKEEPING**: Use simple, everyday English. No academic jargon.
11. **OPTIONAL SYNTAX (ASI)**: Semicolons are not bugs. Mention them only in suggestions.
12. **STRICT EMPTY STATE**: leave `issues` and `how_to_fix` empty if code is bug-free.

${languageContext}Code from your student:
${buggyCode}
```

---

## 2. The Groq System Enforcer Prompt (Llama Fallback)

**System Overview:** 
Because DeFixs uses an intelligent routing system that defaults to Groq (Llama 3.3 70B) for maximum speed and falls back to Gemini if the API fails, we must account for model-specific quirks. Llama models occasionally struggle with returning fully indented, multi-line code blocks inside JSON payloads (a phenomenon known as JSON squashing). This System Prompt acts as an absolute rule to prevent that.

**Deep Dive: Prompt Engineering Techniques Used:**
1. **System-Level Overrides:** By placing this in the top-level `"system"` role block (rather than the `"user"` role), the model treats this as an unbreakable foundational law of its existence.
2. **Extreme Negative Constraints:** The capitalized word "NEVER" combined with the explicit technical requirement ("using literal escaped newlines [\n]") forces the model's tokenizer to preserve code formatting and indentation perfectly for our UI syntax highlighter.

**The Raw Prompt Template:**
```text
You are a Polyglot Senior Mentor. You MUST provide beautifully formatted, multi-line code solutions using literal escaped newlines (\n) for every line. NEVER return code on a single line.
```

---

## 3. Post-Prompt Output Sanitization (Fail-safes)

Even with the best prompt engineering, Large Language Models can be unpredictable. To ensure the DeFixs UI remains spotless, the platform also implements programmatic post-generation sanitization. 

**The Edge Case (Hallucinated Errors):**
Sometimes, if a user submits perfectly valid, bug-free code, the AI might try to be *too* helpful and put strings like *"Great job! No issues found!"* inside the `issues` JSON array. This causes a red error box to appear on the UI when there are actually no errors, confusing the user.

**The Programmatic Solution:**
The DeFixs backend automatically scans the AI's generated JSON output. If the AI populates the `issues` array with congratulatory, bug-free text (e.g. searching for the word "correct" or "no issue"), the backend algorithm intercepts it and forcefully empties the array before sending it to the frontend. This ensures the user only sees a supportive "Code is bug-free" empty state on the website. 
