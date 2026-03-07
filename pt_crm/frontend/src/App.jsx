import React, { useState, useEffect } from 'react';
import { Activity, Shield, Users, Search, Terminal, BarChart2, X, ExternalLink, Globe, CheckCircle, UserCheck, BadgeCheck, Flame, Crosshair, Zap, Briefcase, MessageSquare, FileText, Calendar, DollarSign, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';


const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-lg">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-2 rounded-md bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

const CategoryBadge = ({ category }) => {
    let color = "bg-gray-800 text-gray-300";
    let icon = null;

    if (category === "Critical Master") {
        color = "bg-red-900/40 text-red-400 border border-red-900/50";
        icon = <Flame className="w-3 h-3 mr-1" />;
    } else if (category === "Top Reputation") {
        color = "bg-yellow-900/40 text-yellow-400 border border-yellow-900/50";
        icon = <Zap className="w-3 h-3 mr-1" />;
    } else if (category === "Collectives") {
        color = "bg-purple-900/40 text-purple-400 border border-purple-900/50";
        icon = <Briefcase className="w-3 h-3 mr-1" />;
    }

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center w-fit ${color}`}>
            {icon} {category}
        </span>
    );
};

const HunterRow = ({ hunter, onClick, activeTab, index }) => {
    let displayReputation = hunter.reputation;
    let displayRank = index + 1; 
    let displaySignal = hunter.signal;
    let displayImpact = hunter.impact;

    if (activeTab === "Critical Master" && hunter.category_data?.["Critical Master"]) {
        displayReputation = hunter.category_data["Critical Master"].reputation;
        // displayRank = hunter.category_data["Critical Master"].rank; 
        displaySignal = hunter.category_data["Critical Master"].signal || hunter.signal;
        displayImpact = hunter.category_data["Critical Master"].impact || hunter.impact;
    }
    return (
        <tr 
            onClick={() => onClick(hunter)}
            className="border-b border-gray-800 hover:bg-[#252525] transition-colors cursor-pointer group"
        >
            <td className="py-4 px-4">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img 
                    src={hunter.avatar} 
                    alt="" 
                    className="w-10 h-10 rounded-full bg-gray-700 object-cover" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    />
                    <div className="absolute -top-1 -left-1 bg-gray-900 text-[10px] text-gray-400 px-1 rounded border border-gray-700">
                        #{displayRank}
                    </div>
                </div>
                <div>
                    <div className="font-medium text-white group-hover:text-red-400 transition-colors">{hunter.username}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {hunter.categories.slice(0, 2).map(cat => (
                            <CategoryBadge key={cat} category={cat} />
                        ))}
                    </div>
                </div>
            </div>
            </td>
            <td className="py-4 px-4 font-mono text-yellow-500">
            {displayReputation}
            </td>
            <td className="py-4 px-4 text-gray-300">{displaySignal}</td>
            <td className="py-4 px-4 text-gray-300">{displayImpact}</td>
            <td className="py-4 px-4">
            <div className="flex items-center gap-2">
                <div className="w-full bg-gray-700 rounded-full h-2 w-24">
                <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${hunter.pt_fit_score}%` }}
                ></div>
                </div>
                <span className="text-xs text-gray-400">{hunter.pt_fit_score}</span>
            </div>
            </td>
        </tr>
    );
};

const ReportCard = ({ report }) => {
    const severityColor = {
        critical: "text-red-500 border-red-900/50 bg-red-900/20",
        high: "text-orange-500 border-orange-900/50 bg-orange-900/20",
        medium: "text-yellow-500 border-yellow-900/50 bg-yellow-900/20",
        low: "text-green-500 border-green-900/50 bg-green-900/20",
        none: "text-gray-500 border-gray-800 bg-gray-800"
    };

    const rating = report.severity_rating ? report.severity_rating.toLowerCase() : "none";
    const colorClass = severityColor[rating] || severityColor.none;
    
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
    };

    return (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded p-3 hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colorClass}`}>
                        {rating !== "none" ? rating : "Private"}
                    </span>
                    <span className="text-gray-400 text-xs truncate max-w-[150px]">{report.cwe || "Vulnerability"}</span>
                </div>
                <span className="text-gray-500 text-[10px] flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="w-3 h-3" />
                    {formatDate(report.latest_disclosable_activity_at || report.submitted_at)}
                </span>
            </div>
            <div className="text-sm font-medium text-white mb-1 line-clamp-1">
                {report.report?.title || "Private Report"}
            </div>
            <div className="flex justify-between items-center text-xs">
                <div className="text-gray-400 flex items-center gap-1">
                    Program: <span className="text-white">{report.team?.handle}</span>
                </div>
                {report.total_awarded_amount > 0 && (
                    <div className="text-green-400 font-mono flex items-center">
                        <DollarSign className="w-3 h-3" />
                        {report.total_awarded_amount}
                    </div>
                )}
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#252525] border border-gray-700 p-2 rounded shadow-lg">
                <p className="text-white text-xs font-bold mb-1">{label}</p>
                <p className="text-red-400 text-xs">
                    Value: {payload[0].payload.displayValue}
                </p>
            </div>
        );
    }
    return null;
};

const HunterRadar = ({ hunter, reportsCount }) => {
    const data = [
        { subject: 'Impact', A: (hunter.impact || 0) * 2, fullMark: 100, displayValue: hunter.impact }, // Impact * 2 для масштаба, но показываем оригинал
        { subject: 'Signal', A: (hunter.signal || 0) * 14, fullMark: 100, displayValue: hunter.signal },
        { subject: 'Reputation', A: Math.min(hunter.reputation / 50, 100), fullMark: 100, displayValue: hunter.reputation },
        { subject: 'Activity', A: Math.min(reportsCount * 2, 100), fullMark: 100, displayValue: reportsCount },
        { subject: 'Score', A: hunter.pt_fit_score, fullMark: 100, displayValue: hunter.pt_fit_score },
    ];

    return (
        <div className="h-[250px] w-full bg-[#1a1a1a] rounded border border-gray-800 relative">
            <div className="absolute top-2 left-2 text-xs text-gray-500 flex items-center gap-1">
                <Target className="w-3 h-3" /> Combat Stats
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name={hunter.username}
                        dataKey="A"
                        stroke="#E31E24"
                        strokeWidth={2}
                        fill="#E31E24"
                        fillOpacity={0.3}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

const UserProfileModal = ({ hunter, onClose }) => {
  const [osintResults, setOsintResults] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingOsint, setLoadingOsint] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setLoadingOsint(true);
    fetch(`http://localhost:8000/api/sherlock/${hunter.username}`)
      .then(res => res.json())
      .then(data => {
        setOsintResults(data);
        setLoadingOsint(false);
      });

    setLoadingReports(true);
    fetch(`http://localhost:8000/api/reports/${hunter.username}`)
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoadingReports(false);
      });
  }, [hunter]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-[#252525] shrink-0">
          <div className="flex items-center gap-4">
            <img 
              src={hunter.avatar} 
              className="w-16 h-16 rounded-full border-2 border-red-600 object-cover" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {hunter.username}
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </h2>
              <div className="flex gap-2 mt-2">
                 {hunter.categories.map(cat => <CategoryBadge key={cat} category={cat} />)}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-[#1a1a1a] shrink-0">
            <button 
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "overview" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
                <Activity className="w-4 h-4 inline-block mr-2" /> Overview
            </button>
            <button 
                onClick={() => setActiveTab("osint")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "osint" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
                <Globe className="w-4 h-4 inline-block mr-2" /> Digital Footprint
            </button>
            <button 
                onClick={() => setActiveTab("reports")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "reports" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
                <FileText className="w-4 h-4 inline-block mr-2" /> Hacktivity ({reports.length})
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-6">
                  <div>
                      <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Performance Stats</h3>
                      <HunterRadar hunter={hunter} reportsCount={reports.length} />
                      
                      <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                              <div className="text-xs text-gray-500">Signal</div>
                              <div className="text-xl font-bold text-white">{hunter.signal || "N/A"}</div>
                          </div>
                          <div className="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                              <div className="text-xs text-gray-500">Impact</div>
                              <div className="text-xl font-bold text-white">{hunter.impact || "N/A"}</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === "osint" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loadingOsint ? (
                   Array(6).fill(0).map((_, i) => (
                     <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
                   ))
                ) : (
                  osintResults.map((res, i) => (
                    <a 
                      key={i} 
                      href={res.found ? res.url : '#'} 
                      target="_blank"
                      className={`flex items-center justify-between p-3 rounded border transition-all ${
                        res.found 
                          ? res.isVerified
                            ? 'bg-red-900/20 border-red-900 hover:bg-red-900/30 cursor-pointer' 
                            : res.isSearch 
                                ? 'bg-blue-900/20 border-blue-900 hover:bg-blue-900/30 cursor-pointer' 
                                : 'bg-green-900/20 border-green-900 hover:bg-green-900/30 cursor-pointer' 
                          : 'bg-gray-800/50 border-gray-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span className={res.found ? 'text-white' : 'text-gray-500'}>{res.name}</span>
                      {res.found ? (
                        <div className={`flex items-center gap-2 text-xs font-mono ${
                            res.isVerified ? 'text-red-400' : res.isSearch ? 'text-blue-400' : 'text-green-400'
                        }`}>
                          {res.isVerified ? (
                            <>VERIFIED <BadgeCheck className="w-3 h-3" /></>
                          ) : res.isSearch ? (
                            <>SEARCH <Search className="w-3 h-3" /></>
                          ) : (
                            <>FOUND <ExternalLink className="w-3 h-3" /></>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs font-mono">NOT FOUND</span>
                      )}
                    </a>
                  ))
                )}
              </div>
          )}

          {activeTab === "reports" && (
              <div className="space-y-3">
                  {loadingReports ? (
                      Array(4).fill(0).map((_, i) => (
                          <div key={i} className="h-24 bg-gray-800 rounded animate-pulse"></div>
                      ))
                  ) : reports.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {reports.map((report, i) => (
                              <ReportCard key={i} report={report} />
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-10 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          No public reports found for this user.
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AIChatView = () => {
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chat_history');
        return saved ? JSON.parse(saved) : [
            { role: 'ai', text: "Hello! I've analyzed the profiles of top bug bounty hunters. Ask me anything about their skills, activity, or who would be the best fit for our Standoff team." }
        ];
    });
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        localStorage.setItem('chat_history', JSON.stringify(messages));
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.text })
            });
            const data = await res.json();
            
            setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Error: Could not connect to the AI Analyst. Please check if Ollama is running." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="flex flex-col h-[600px] bg-[#1e1e1e] rounded-lg border border-gray-800 overflow-hidden">
             <div className="p-4 border-b border-gray-800 bg-[#252525] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-900/30 flex items-center justify-center text-red-500">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Standoff AI Analyst</h3>
                        <p className="text-xs text-gray-400">Powered by Local LLM (Phi-3)</p>
                    </div>
                </div>
                <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded border border-green-900/50 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Online
                </span>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shrink-0">AI</div>
                        )}
                        <div className={`p-3 rounded-lg max-w-[80%] border ${
                            msg.role === 'user' 
                                ? 'bg-red-900/20 border-red-900/50 text-white rounded-tr-none' 
                                : 'bg-[#2a2a2a] border-gray-700 text-gray-200 rounded-tl-none'
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold shrink-0">You</div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shrink-0">AI</div>
                        <div className="bg-[#2a2a2a] p-3 rounded-lg rounded-tl-none border border-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[#252525] border-t border-gray-800">
                <div className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about specific hunters or skills..." 
                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors text-white"
                        disabled={loading}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading}
                        className="absolute right-2 top-2 p-1.5 bg-red-600 rounded text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const [hunters, setHunters] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedHunter, setSelectedHunter] = useState(null);
  const [activeTab, setActiveTab] = useState("Top Reputation"); 

  useEffect(() => {
    fetch('http://localhost:8000/api/hunters')
      .then(res => res.json())
      .then(data => setHunters(data));
      
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const filteredHunters = hunters.filter(h => {
      if (activeTab === "AI Analyst") return false;
      return h.categories.includes(activeTab);
  });

  const sortedHunters = [...filteredHunters].sort((a, b) => {
      if (activeTab === "Critical Master") {
          const repA = a.category_data?.["Critical Master"]?.reputation || 0;
          const repB = b.category_data?.["Critical Master"]?.reputation || 0;
          return repB - repA;
      }
      return b.reputation - a.reputation; 
  });

  const uniqueHunters = Array.from(new Map(sortedHunters.map(item => [item.id, item])).values());

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-red-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1a1a1a]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-lg">P</div>
            <h1 className="text-xl font-bold tracking-tight">PT <span className="text-gray-400 font-normal">Hunter CRM</span></h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 overflow-x-auto">
            {["Top Reputation", "Critical Master", "Collectives", "AI Analyst"].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === tab 
                            ? "border-red-500 text-white" 
                            : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                >
                    {tab === "AI Analyst" && <MessageSquare className="w-4 h-4 inline-block mr-2" />}
                    {tab}
                </button>
            ))}
        </div>

        {activeTab !== "AI Analyst" ? (
            <>
                <div className="grid grid-cols-1 gap-8">
                {/* Main Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        {activeTab}
                    </h2>
                    </div>
                    
                    <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#252525] text-xs uppercase text-gray-400 font-medium">
                        <tr>
                            <th className="py-3 px-4">User & Categories</th>
                            <th className="py-3 px-4">Reputation</th>
                            <th className="py-3 px-4">Signal</th>
                            <th className="py-3 px-4">Impact</th>
                            <th className="py-3 px-4">PT Fit Score</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {uniqueHunters.map((h, index) => (
                            <HunterRow key={h.id} hunter={h} onClick={setSelectedHunter} activeTab={activeTab} index={index} />
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                </div>
            </>
        ) : (
            <AIChatView />
        )}
      </main>

      {/* User Profile Modal (Replaces SherlockModal) */}
      {selectedHunter && (
        <UserProfileModal hunter={selectedHunter} onClose={() => setSelectedHunter(null)} />
      )}
    </div>
  );
}
