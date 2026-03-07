import { fetchAllLeaderboards, fetchUserHacktivity } from './node_scraper.js';
import { checkUsername, runBatchSherlock } from './sherlock.js';
import { processAvatar, saveJson, getJson, initS3, PROFILE_BUCKET, REPORTS_BUCKET, OSINT_BUCKET } from './s3.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3';
const DATA_FILE = '/app/data/hunters.json';

if (!fs.existsSync('/app/data')) fs.mkdirSync('/app/data', { recursive: true });

app.use(cors());
app.use(express.json());

let cachedHunters = [];

initS3();

if (fs.existsSync(DATA_FILE)) {
  try {
    cachedHunters = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`Loaded ${cachedHunters.length} hunters from disk.`);
  } catch (e) { console.error("Cache load failed:", e); }
}

async function runBatchHacktivity(hunters) {
    console.log(`[Hacktivity] Starting batch fetch for ${hunters.length} hunters...`);
    const CHUNK_SIZE = 3;
    let updated = false;
    
    for (let i = 0; i < hunters.length; i += CHUNK_SIZE) {
        const chunk = hunters.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (h) => {
            try {
                const reports = await fetchUserHacktivity(h.username);
                if (reports.length > 0) {
                    await saveJson(REPORTS_BUCKET, `${h.username}.json`, reports);
                    
                    const hunterInCache = cachedHunters.find(ch => ch.username === h.username);
                    if (hunterInCache) {
                        hunterInCache.report_count = reports.length;
                        updated = true;
                    }
                }
            } catch (e) {
                console.error(`[Hacktivity] Failed for ${h.username}`);
            }
        }));
        await new Promise(r => setTimeout(r, 1000));
    }
    
    if (updated) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(cachedHunters, null, 2));
        console.log(`[Hacktivity] Updated hunter stats with report counts.`);
    }
    console.log(`[Hacktivity] Batch fetch complete.`);
}

async function updateData() {
  console.log("Starting multi-category data fetch...");
  const rawEdges = await fetchAllLeaderboards();
  
  if (rawEdges && rawEdges.length > 0) {
    const uniqueHunters = new Map();

    for (const edge of rawEdges) {
        const node = edge.node;
        const user = node.user;
        
        if (!uniqueHunters.has(user.username)) {
            let score = (node.signal || 0) * 8 + (node.impact || 0);
            if (score > 99) score = 99;
            if (score < 10) score = 10;

            uniqueHunters.set(user.username, {
                id: user.id,
                username: user.username,
                raw_avatar: user.profile_picture,
                avatar: null,
                rank: node.rank, 
                signal: node.signal ? parseFloat(node.signal.toFixed(2)) : 0,
                impact: node.impact ? parseFloat(node.impact.toFixed(2)) : 0,
                reputation: node.reputation, 
                report_count: cachedHunters.find(ch => ch.username === user.username)?.report_count || 0, // Preserve report count
                pt_fit_score: Math.round(score),
                categories: [edge.source_category],
                category_data: {
                    [edge.source_category]: {
                        rank: edge.category_rank,
                        reputation: edge.category_reputation,
                        signal: node.signal ? parseFloat(node.signal.toFixed(2)) : 0,
                        impact: node.impact ? parseFloat(node.impact.toFixed(2)) : 0
                    }
                },
                last_active: "Q1 2026"
            });
        } else {
            const existing = uniqueHunters.get(user.username);
            if (!existing.categories.includes(edge.source_category)) {
                existing.categories.push(edge.source_category);
            }
            existing.category_data[edge.source_category] = {
                rank: edge.category_rank,
                reputation: edge.category_reputation,
                signal: node.signal ? parseFloat(node.signal.toFixed(2)) : 0,
                impact: node.impact ? parseFloat(node.impact.toFixed(2)) : 0
            };
            if (edge.source_category === "Top Reputation") {
                existing.reputation = node.reputation;
                existing.rank = node.rank;
                existing.impact = node.impact ? parseFloat(node.impact.toFixed(2)) : 0;
                existing.signal = node.signal ? parseFloat(node.signal.toFixed(2)) : 0;
            }
        }
    }

    console.log(`Merged into ${uniqueHunters.size} unique profiles. Processing S3 & Sherlock...`);

    const processedHunters = await Promise.all(Array.from(uniqueHunters.values()).map(async (hunter) => {
        hunter.avatar = await processAvatar(hunter.raw_avatar, hunter.username);
        delete hunter.raw_avatar;
        await saveJson(PROFILE_BUCKET, `${hunter.username}.json`, hunter);
        return hunter;
    }));
    
    cachedHunters = processedHunters.sort((a, b) => b.reputation - a.reputation);
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedHunters, null, 2));
    console.log(`Cycle complete. ${cachedHunters.length} hunters updated.`);

    runBatchSherlock(cachedHunters).catch(err => console.error("Sherlock batch failed:", err));
    runBatchHacktivity(cachedHunters).catch(err => console.error("Hacktivity batch failed:", err));
  }
}

updateData();
setInterval(updateData, 600000);

app.get('/api/hunters', (req, res) => {
  res.json(cachedHunters);
});

app.get('/api/stats', (req, res) => {
  const totalReputation = cachedHunters.reduce((sum, h) => sum + h.reputation, 0);
  const avgSignal = cachedHunters.reduce((sum, h) => sum + h.signal, 0) / (cachedHunters.length || 1);
  const categories = {};
  cachedHunters.forEach(h => {
      h.categories.forEach(cat => { categories[cat] = (categories[cat] || 0) + 1; });
  });

  res.json({
    total_hunters: cachedHunters.length,
    total_bounty_tracked: totalReputation * 100,
    avg_signal: parseFloat(avgSignal.toFixed(2)),
    categories: categories
  });
});

app.get('/api/sherlock/:username', async (req, res) => {
    const { username } = req.params;
    const results = await checkUsername(username);
    res.json(results);
});

app.get('/api/reports/:username', async (req, res) => {
    const { username } = req.params;
    const reports = await getJson(REPORTS_BUCKET, `${username}.json`);
    res.json(reports || []);
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    const topRepHunters = cachedHunters.filter(h => h.categories.includes("Top Reputation"));

    const huntersToAnalyze = topRepHunters;

    const maxRep = huntersToAnalyze.reduce((max, h) => (h.reputation || 0) > (max.reputation || 0) ? h : max, { reputation: 0, username: "N/A" });
    const maxImpact = huntersToAnalyze.reduce((max, h) => (h.impact || 0) > (max.impact || 0) ? h : max, { impact: 0, username: "N/A" });
    const maxSignal = huntersToAnalyze.reduce((max, h) => (h.signal || 0) > (max.signal || 0) ? h : max, { signal: 0, username: "N/A" });
    const maxReports = huntersToAnalyze.reduce((max, h) => (h.report_count || 0) > (max.report_count || 0) ? h : max, { report_count: 0, username: "N/A" });

    const topByRep = [...huntersToAnalyze].sort((a,b) => b.reputation - a.reputation).slice(0, 5);
    const topByImpact = [...huntersToAnalyze].sort((a,b) => (b.impact || 0) - (a.impact || 0)).slice(0, 10); 
    const topBySignal = [...huntersToAnalyze].sort((a,b) => (b.signal || 0) - (a.signal || 0)).slice(0, 5);
    const topByReports = [...huntersToAnalyze].sort((a,b) => (b.report_count || 0) - (a.report_count || 0)).slice(0, 5);

    const relevantHunters = new Map();
    [...topByRep, ...topByImpact, ...topBySignal, ...topByReports].forEach(h => {
        if (!relevantHunters.has(h.username)) {
            relevantHunters.set(h.username, h);
        }
    });

    const messageLower = message.toLowerCase();
    const specificHunter = huntersToAnalyze.find(h => messageLower.includes(h.username.toLowerCase()));
    
    if (specificHunter) {
        relevantHunters.set(specificHunter.username, specificHunter);
    }

    const detailedList = await Promise.all(Array.from(relevantHunters.values()).map(async h => {
        let contacts = "No public contacts found.";
        try {
            const osint = await getJson(OSINT_BUCKET, `${h.username}.json`);
            if (osint && Array.isArray(osint)) {
                const found = osint.filter(r => r.found).map(r => `${r.site}: ${r.url}`);
                if (found.length > 0) contacts = found.join(', ');
            }
        } catch (e) {}

        let recentVulns = "No public reports analyzed yet.";
        try {
            const reports = await getJson(REPORTS_BUCKET, `${h.username}.json`);
            if (reports && Array.isArray(reports) && reports.length > 0) {
                const publicReports = reports.filter(r => r.public);
                const reportsToAnalyze = publicReports.length > 0 ? publicReports : reports;
                
                const limitedReports = reportsToAnalyze.slice(0, 10);
                
                recentVulns = limitedReports.map(r => 
                    `- [${r.severity_rating || 'Unknown'}] ${r.report?.title || 'Private Report'} (CWE: ${r.cwe || 'N/A'})`
                ).join('\n');
            }
        } catch (e) {}

        return `
### CANDIDATE PROFILE: ${h.username}
- **Reputation**: ${h.reputation}
- **Impact Score**: ${h.effectiveImpact} (Max is ~50)
- **Signal Score**: ${h.effectiveSignal} (Max is ~7)
- **Report Count**: ${h.report_count || '0'}
- **Contacts**: ${contacts}
- **Recent Vulnerabilities**:
${recentVulns}
`;
    }));

    const allHuntersSummary = huntersToAnalyze.map(h => 
        `${h.username} | Rep:${h.reputation} | Imp:${h.impact} | Sig:${h.signal} | Reps:${h.report_count || 0}`
    ).join('\n');

    const prompt = `
<|system|>
You are an expert Security Analyst for Positive Technologies. Your goal is to evaluate bug bounty hunters from HackerOne for potential recruitment into the "Standoff" red team.

DATA CONTEXT (Global Maximums in Top Reputation):
- Highest Reputation: ${maxRep.username} (${maxRep.reputation})
- Highest Impact: ${maxImpact.username} (${maxImpact.impact})
- Highest Signal: ${maxSignal.username} (${maxSignal.signal})
- Highest Report Count: ${maxReports.username} (${maxReports.report_count})

FULL ROSTER SUMMARY (Username | Reputation | Impact | Signal | Report Count):
${allHuntersSummary}

DETAILED PROFILES (Top Performers):
${detailedList.join('\n')}

INSTRUCTIONS:
1. Answer the user's question based on the FULL ROSTER SUMMARY and DETAILED PROFILES.
2. If the user asks "Who has the biggest impact?", scan the FULL ROSTER SUMMARY for the highest "Imp" value.
3. If the user asks "Who has the most reports?", scan the FULL ROSTER SUMMARY for the highest "Reps" value.
4. If the user asks for contacts, list them from the DETAILED PROFILES section if available.
5. Answer in English.
6. Be concise and professional.
<|end|>
<|user|>
${message}
<|end|>
<|assistant|>`;

    try {
        const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.1,
                num_predict: 500
            }
        });
        res.json({ response: response.data.response });
    } catch (error) {
        console.error("Ollama Error:", error.message);
        res.status(500).json({ response: "Error connecting to AI Analyst. Please ensure Ollama is running and 'phi3' model is pulled." });
    }
});

app.listen(PORT, () => {
  console.log(`Node.js Scraper Service running on port ${PORT}`);
});
