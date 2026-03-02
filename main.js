import { GoogleGenAI, Type } from "@google/genai";

// Navigation Logic
const navTriggers = document.querySelectorAll('.nav-trigger');
const sections = document.querySelectorAll('.page-section');
const navLinks = document.querySelectorAll('.nav-link');

function navigate(targetId) {
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
            section.classList.add('active');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === targetId) {
            link.classList.add('active');
        }
    });

    window.scrollTo(0, 0);
    // Update URL hash without jumping
    history.pushState(null, null, `#${targetId}`);
}

navTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const target = trigger.getAttribute('data-target');
        navigate(target);
    });
});

// Handle initial load and back/forward
window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    navigate(hash);
});

// Initial navigation
const initialHash = window.location.hash.replace('#', '') || 'home';
navigate(initialHash);

// Lab Logic
const generateBtn = document.getElementById('generate-btn');
const labQuery = document.getElementById('lab-query');
const labPlaceholder = document.getElementById('lab-placeholder');
const labLoading = document.getElementById('lab-loading');
const labResult = document.getElementById('lab-result');
const labError = document.getElementById('lab-error');

// Result elements
const resultTitle = document.getElementById('result-title');
const resultConcept = document.getElementById('result-concept');
const resultFeasibilityLarge = document.getElementById('result-feasibility-large');
const resultRoadmap = document.getElementById('result-roadmap');
const resultFeasibilityText = document.getElementById('result-feasibility-text');
const feasibilityDot = document.getElementById('feasibility-dot');

async function generateConcept() {
    const query = labQuery.value.trim();
    if (!query) return;

    // UI State: Loading
    labPlaceholder.classList.add('hidden');
    labResult.classList.add('hidden');
    labError.classList.add('hidden');
    labLoading.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.innerHTML = `<div class="w-4 h-4 border-2 border-slate-500 border-t-transparent animate-spin rounded-full"></div> PROCESSING...`;

    try {
        // We need the API key. In a real app, we'd fetch it or it would be in env.
        // For this environment, we'll assume it's available via a global or we'll fetch it.
        // Since we can't use process.env in browser directly without a build tool,
        // we'll fetch it from the server.
        const configRes = await fetch('/api/config');
        const { apiKey } = await configRes.json();

        if (!apiKey) throw new Error("API Key not found. Please configure GEMINI_API_KEY.");

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Brainstorm a futuristic digital transformation concept for: ${query}. Focus on custom software, lifestyle improvement, or tech research.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        concept: { type: Type.STRING },
                        feasibility: { type: Type.NUMBER, description: "Scale 1-100" },
                        roadmap: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["title", "concept", "feasibility", "roadmap"]
                }
            }
        });

        const data = JSON.parse(response.text || '{}');
        
        // UI State: Success
        renderResult(data);
    } catch (err) {
        console.error(err);
        labError.textContent = `SYSTEM ERROR: ${err.message || "The Lab's neural network encountered an error."}`;
        labError.classList.remove('hidden');
        labPlaceholder.classList.remove('hidden');
    } finally {
        labLoading.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.textContent = 'GENERATE CONCEPT';
    }
}

function renderResult(data) {
    resultTitle.textContent = data.title;
    resultConcept.textContent = `"${data.concept}"`;
    resultFeasibilityLarge.textContent = `${data.feasibility}%`;
    resultFeasibilityText.textContent = data.feasibility > 70 ? 'High' : 'Moderate';
    
    feasibilityDot.className = `w-2 h-2 rounded-full ${data.feasibility > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`;

    resultRoadmap.innerHTML = '';
    data.roadmap.forEach((step, idx) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'flex gap-4 group';
        stepDiv.innerHTML = `
            <div class="flex-shrink-0 w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-500 group-hover:border-slate-500 group-hover:text-white transition-all">
                ${idx + 1}
            </div>
            <p class="text-slate-300 pt-1 group-hover:translate-x-1 transition-transform">${step}</p>
        `;
        resultRoadmap.appendChild(stepDiv);
    });

    labResult.classList.remove('hidden');
}

generateBtn.addEventListener('click', generateConcept);
