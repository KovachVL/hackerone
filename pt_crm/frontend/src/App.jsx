import React, { useState, useEffect, useRef } from 'react';
import { Activity, Shield, Users, Search, Terminal, BarChart2, X, ExternalLink, Globe, CheckCircle, UserCheck, BadgeCheck, Flame, Crosshair, Zap, Briefcase, MessageSquare, FileText, Calendar, DollarSign, Target, Share2 } from 'lucide-react';
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
    } else     if (category === "Collectives") {
        color = "bg-purple-900/40 text-purple-400 border border-purple-900/50";
        icon = <Briefcase className="w-3 h-3 mr-1" />;
    } else if (category.includes("OWASP")) {
        color = "bg-blue-900/40 text-blue-400 border border-blue-900/50";
        icon = <Shield className="w-3 h-3 mr-1" />;
    }

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center w-fit ${color}`}>
            {icon} {category}
        </span>
    );
};

const HunterRow = ({ hunter, onClick, activeTab, index, compareList = [], compareMode }) => {
    let displayReputation = hunter.reputation;
    let displayRank = index + 1; 
    let displaySignal = hunter.signal;
    let displayImpact = hunter.impact;

    if (activeTab === "Critical Master" && hunter.category_data?.["Critical Master"]) {
        displayReputation = hunter.category_data["Critical Master"].reputation;
        // displayRank = hunter.category_data["Critical Master"].rank; 
        displaySignal = hunter.category_data["Critical Master"].signal || hunter.signal;
        displayImpact = hunter.category_data["Critical Master"].impact || hunter.impact;
    } else if (activeTab.includes("OWASP") && hunter.category_data?.[activeTab]) {
        displayReputation = hunter.category_data[activeTab].reputation;
        displaySignal = hunter.category_data[activeTab].signal || hunter.signal;
        displayImpact = hunter.category_data[activeTab].impact || hunter.impact;
    }
    const isSelected = compareMode && compareList.find(h => h.id === hunter.id);

    return (
        <tr 
            onClick={() => onClick(hunter)}
            className={`border-b border-gray-800 transition-colors cursor-pointer group relative ${
                isSelected ? 'bg-blue-900/10 border-blue-900/50' : 'hover:bg-[#252525]'
            }`}
        >
            <td className="py-4 px-4 pl-8">
            <div className="flex items-center gap-3">
                {isSelected && (
                    <div className="absolute left-3 text-blue-500">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                )}
                <div className="relative">
                    <img 
                    src={hunter.avatar} 
                    alt="" 
                    className={`w-10 h-10 rounded-full bg-gray-700 object-cover ${isSelected ? 'ring-2 ring-blue-500' : ''}`} 
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
                        {hunter.categories.map(cat => (
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
        { subject: 'Impact', A: (hunter.impact || 0) * 2, fullMark: 100, displayValue: hunter.impact }, 
        { subject: 'Signal', A: (hunter.signal || 0) * 14, fullMark: 100, displayValue: hunter.signal },
        { subject: 'Reputation', A: Math.min(hunter.reputation / 100, 100), fullMark: 100, displayValue: hunter.reputation },
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

const CompareModal = ({ hunters, onClose }) => {
    const [h1, h2] = hunters;

    const getData = (hunter) => [
        { subject: 'Impact', A: (hunter.impact || 0) * 2, fullMark: 100 },
        { subject: 'Signal', A: (hunter.signal || 0) * 14, fullMark: 100 },
        { subject: 'Reputation', A: Math.min(hunter.reputation / 50, 100), fullMark: 100 },
        { subject: 'Score', A: hunter.pt_fit_score, fullMark: 100 },
    ];

    const data = [
        { subject: 'Impact', A: (h1.impact || 0) * 2, B: (h2.impact || 0) * 2, fullMark: 100, valA: h1.impact, valB: h2.impact },
        { subject: 'Signal', A: (h1.signal || 0) * 14, B: (h2.signal || 0) * 14, fullMark: 100, valA: h1.signal, valB: h2.signal },
        { subject: 'Reputation', A: Math.min(h1.reputation / 50, 100), B: Math.min(h2.reputation / 50, 100), fullMark: 100, valA: h1.reputation, valB: h2.reputation },
        { subject: 'Score', A: h1.pt_fit_score, B: h2.pt_fit_score, fullMark: 100, valA: h1.pt_fit_score, valB: h2.pt_fit_score },
    ];

    const CustomCompareTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#252525] border border-gray-700 p-3 rounded shadow-lg">
                    <p className="text-white text-sm font-bold mb-2">{label}</p>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                            <span className="text-red-400 font-mono">{h1.username}: {payload[0].payload.valA}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-blue-400 font-mono">{h2.username}: {payload[0].payload.valB}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#252525]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-red-500" />
                        Candidate Comparison
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-3 gap-8 overflow-y-auto">
                    {/* Hunter 1 */}
                    <div className="flex flex-col items-center space-y-4 border-r border-gray-800 pr-4">
                        <img src={h1.avatar} className="w-24 h-24 rounded-full border-4 border-red-600 shadow-lg shadow-red-900/20" />
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white">{h1.username}</h3>
                            <div className="flex gap-2 justify-center mt-2 flex-wrap">
                                {h1.categories.map(cat => <CategoryBadge key={cat} category={cat} />)}
                            </div>
                        </div>
                        <div className="w-full space-y-3 mt-4">
                            <div className="bg-[#1a1a1a] p-4 rounded border border-gray-800">
                                <div className="text-xs text-gray-500 uppercase">Reputation</div>
                                <div className={`text-2xl font-mono font-bold ${h1.reputation > h2.reputation ? 'text-green-400' : 'text-white'}`}>
                                    {h1.reputation}
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded border border-gray-800">
                                <div className="text-xs text-gray-500 uppercase">Signal</div>
                                <div className={`text-2xl font-mono font-bold ${h1.signal > h2.signal ? 'text-green-400' : 'text-white'}`}>
                                    {h1.signal}
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded border border-gray-800">
                                <div className="text-xs text-gray-500 uppercase">Impact</div>
                                <div className={`text-2xl font-mono font-bold ${h1.impact > h2.impact ? 'text-green-400' : 'text-white'}`}>
                                    {h1.impact}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="flex flex-col justify-center items-center">
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name={h1.username} dataKey="A" stroke="#E31E24" strokeWidth={3} fill="#E31E24" fillOpacity={0.1} />
                                    <Radar name={h2.username} dataKey="B" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.1} />
                                    <Tooltip content={<CustomCompareTooltip />} cursor={{ stroke: '#666', strokeWidth: 1 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                <span className="text-sm text-gray-300">{h1.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-gray-300">{h2.username}</span>
                            </div>
                        </div>
                    </div>

                    {/* Hunter 2 */}
                    <div className="flex flex-col items-center space-y-4 border-l border-gray-800 pl-4">
                        <img src={h2.avatar} className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg shadow-blue-900/20" />
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white">{h2.username}</h3>
                            <div className="flex gap-2 justify-center mt-2 flex-wrap">
                                {h2.categories.map(cat => <CategoryBadge key={cat} category={cat} />)}
                            </div>
                        </div>
                        <div className="w-full space-y-3 mt-4">
                            <div className="bg-[#1a1a1a] p-4 rounded border border-gray-800">
                                <div className="text-xs text-gray-500 uppercase">Reputation</div>
                                <div className={`text-2xl font-mono font-bold ${h2.reputation > h1.reputation ? 'text-green-400' : 'text-white'}`}>
                                    {h2.reputation}
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded border border-gray-800">
                                <div className="text-xs text-gray-500 uppercase">Signal</div>
                                <div className={`text-2xl font-mono font-bold ${h2.signal > h1.signal ? 'text-green-400' : 'text-white'}`}>
                                    {h2.signal}
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded border border-gray-800">
                                <div className="text-xs text-gray-500 uppercase">Impact</div>
                                <div className={`text-2xl font-mono font-bold ${h2.impact > h1.impact ? 'text-green-400' : 'text-white'}`}>
                                    {h2.impact}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserProfileModal = ({ hunter, activeTab, onClose }) => {
  const [osintResults, setOsintResults] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingOsint, setLoadingOsint] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [localActiveTab, setLocalActiveTab] = useState("overview");

  let displayReputation = hunter.reputation;
  let displaySignal = hunter.signal;
  let displayImpact = hunter.impact;

  if (activeTab === "Critical Master" && hunter.category_data?.["Critical Master"]) {
      displayReputation = hunter.category_data["Critical Master"].reputation;
      displaySignal = hunter.category_data["Critical Master"].signal || hunter.signal;
      displayImpact = hunter.category_data["Critical Master"].impact || hunter.impact;
  } else if (activeTab.includes("OWASP") && hunter.category_data?.[activeTab]) {
      displayReputation = hunter.category_data[activeTab].reputation;
      displaySignal = hunter.category_data[activeTab].signal || hunter.signal;
      displayImpact = hunter.category_data[activeTab].impact || hunter.impact;
  }

  const displayHunter = {
      ...hunter,
      reputation: displayReputation,
      signal: displaySignal,
      impact: displayImpact
  };

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
                onClick={() => setLocalActiveTab("overview")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${localActiveTab === "overview" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
                <Activity className="w-4 h-4 inline-block mr-2" /> Overview
            </button>
            <button 
                onClick={() => setLocalActiveTab("osint")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${localActiveTab === "osint" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
                <Globe className="w-4 h-4 inline-block mr-2" /> Digital Footprint
            </button>
            <button 
                onClick={() => setLocalActiveTab("reports")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${localActiveTab === "reports" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
                <FileText className="w-4 h-4 inline-block mr-2" /> Hacktivity ({reports.length})
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {localActiveTab === "overview" && (
              <div className="grid grid-cols-1 gap-6">
                  <div>
                      <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Performance Stats</h3>
                      <HunterRadar hunter={displayHunter} reportsCount={reports.length} />
                      
                      <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                              <div className="text-xs text-gray-500">Signal</div>
                              <div className="text-xl font-bold text-white">{displaySignal || "N/A"}</div>
                          </div>
                          <div className="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                              <div className="text-xs text-gray-500">Impact</div>
                              <div className="text-xl font-bold text-white">{displayImpact || "N/A"}</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {localActiveTab === "osint" && (
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

          {localActiveTab === "reports" && (
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

const CommunityGraph = ({ hunters }) => {
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hoveredNode, setHoveredNode] = useState(null);
    const svgRef = useRef(null);
    const simulationRef = useRef(null);

    useEffect(() => {
        if (!hunters || hunters.length === 0) return;

        const buildGraph = async () => {
            setLoading(true);
            const topHunters = hunters.slice(0, 5); 
            const nodeMap = new Map();
            let newLinks = [];

            topHunters.forEach(h => {
                if (!nodeMap.has(h.username)) {
                    nodeMap.set(h.username, { 
                        id: h.username, 
                        type: 'hunter', 
                        data: h, 
                        x: 400 + (Math.random() - 0.5) * 50, 
                        y: 300 + (Math.random() - 0.5) * 50,
                        vx: 0, vy: 0,
                        radius: 25
                    });
                }
            });

            for (const hunter of topHunters) {
                try {
                    const res = await fetch(`http://localhost:8000/api/reports/${hunter.username}`);
                    const allReports = await res.json();
                    const reports = allReports.slice(0, 5);

                    reports.forEach(report => {
                        const teamHandle = report.team?.handle;
                        if (teamHandle) {
                            if (!nodeMap.has(teamHandle)) {
                                nodeMap.set(teamHandle, { 
                                    id: teamHandle, 
                                    type: 'team', 
                                    data: report.team, 
                                    x: 400 + (Math.random() - 0.5) * 100, 
                                    y: 300 + (Math.random() - 0.5) * 100,
                                    vx: 0, vy: 0,
                                    radius: 15
                                });
                            }
                            newLinks.push({ source: hunter.username, target: teamHandle, type: 'report' });
                        }

                        const cwe = report.cwe;
                        if (cwe && cwe !== "Vulnerability") {
                            if (!nodeMap.has(cwe)) {
                                nodeMap.set(cwe, { 
                                    id: cwe, 
                                    type: 'cwe', 
                                    data: { name: cwe }, 
                                    x: 400 + (Math.random() - 0.5) * 100, 
                                    y: 300 + (Math.random() - 0.5) * 100,
                                    vx: 0, vy: 0,
                                    radius: 10
                                });
                            }
                            newLinks.push({ source: hunter.username, target: cwe, type: 'finding' });
                        }
                    });
                } catch (e) {
                    console.error("Error fetching reports for graph:", e);
                }
            }

            setNodes(Array.from(nodeMap.values()));
            setLinks(newLinks);
            setLoading(false);
        };

        buildGraph();
    }, [hunters]);

    useEffect(() => {
        if (loading || nodes.length === 0) return;

        const simulation = () => {
            const width = 800;
            const height = 600;
            const repulsion = 800; 
            const springLength = 100;
            const springStrength = 0.05;
            const centerStrength = 0.01;

            setNodes(prevNodes => {
                const nextNodes = prevNodes.map(n => ({ ...n }));

                for (let i = 0; i < nextNodes.length; i++) {
                    const nodeA = nextNodes[i];
                    
                    nodeA.vx += (width / 2 - nodeA.x) * centerStrength;
                    nodeA.vy += (height / 2 - nodeA.y) * centerStrength;

                    for (let j = i + 1; j < nextNodes.length; j++) {
                        const nodeB = nextNodes[j];
                        const dx = nodeA.x - nodeB.x;
                        const dy = nodeA.y - nodeB.y;
                        const distSq = dx * dx + dy * dy || 1;
                        const dist = Math.sqrt(distSq);
                        
                        const minDist = nodeA.radius + nodeB.radius + 10;
                        if (dist < minDist) {
                             const overlap = minDist - dist;
                             const fx = (dx / dist) * overlap * 0.1;
                             const fy = (dy / dist) * overlap * 0.1;
                             nodeA.vx += fx;
                             nodeA.vy += fy;
                             nodeB.vx -= fx;
                             nodeB.vy -= fy;
                        } else {

                             const force = repulsion / distSq;
                             const fx = (dx / dist) * force;
                             const fy = (dy / dist) * force;
                             nodeA.vx += fx;
                             nodeA.vy += fy;
                             nodeB.vx -= fx;
                             nodeB.vy -= fy;
                        }
                    }
                }

                links.forEach(link => {
                    const source = nextNodes.find(n => n.id === link.source);
                    const target = nextNodes.find(n => n.id === link.target);
                    if (source && target) {
                        const dx = target.x - source.x;
                        const dy = target.y - source.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        
                        const force = (dist - springLength) * springStrength;
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;

                        source.vx += fx;
                        source.vy += fy;
                        target.vx -= fx;
                        target.vy -= fy;
                    }
                });

                return nextNodes.map(n => {
                    let nextX = n.x + n.vx;
                    let nextY = n.y + n.vy;

                    nextX = Math.max(n.radius, Math.min(width - n.radius, nextX));
                    nextY = Math.max(n.radius, Math.min(height - n.radius, nextY));

                    return {
                        ...n,
                        x: nextX,
                        y: nextY,
                        vx: n.vx * 0.8, 
                        vy: n.vy * 0.8
                    };
                });
            });
            
            simulationRef.current = requestAnimationFrame(simulation);
        };

        simulationRef.current = requestAnimationFrame(simulation);
        return () => cancelAnimationFrame(simulationRef.current);
    }, [nodes.length, links, loading]);

    if (loading) return (
        <div className="h-[600px] flex items-center justify-center bg-[#1e1e1e] rounded-lg border border-gray-800">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 animate-pulse">Building Community Graph...</p>
            </div>
        </div>
    );

    return (
        <div className="h-[600px] bg-[#0f0f0f] rounded-lg border border-gray-800 overflow-hidden relative shadow-inner">
            <div className="absolute top-4 left-4 z-10 bg-[#1a1a1a]/90 p-4 rounded-lg border border-gray-700 backdrop-blur shadow-xl">
                <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-red-500" /> Community Graph
                </h3>
                <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div> 
                        <span className="text-gray-300">Hunter</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> 
                        <span className="text-gray-300">Program (Team)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> 
                        <span className="text-gray-300">Vulnerability (CWE)</span>
                    </div>
                </div>
            </div>
            
            <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 600" className="w-full h-full">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Links */}
                {links.map((link, i) => {
                    const source = nodes.find(n => n.id === link.source);
                    const target = nodes.find(n => n.id === link.target);
                    if (!source || !target) return null;
                    
                    const isConnected = hoveredNode && (
                        hoveredNode.id === source.id || 
                        hoveredNode.id === target.id
                    );
                    
                    return (
                        <line 
                            key={i} 
                            x1={source.x} y1={source.y} 
                            x2={target.x} y2={target.y} 
                            stroke={isConnected ? "#fff" : "#333"} 
                            strokeWidth={isConnected ? 2 : 1}
                            opacity={isConnected ? 0.8 : 0.2}
                            className="transition-all duration-300"
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node, i) => {
                    const isHovered = hoveredNode?.id === node.id;
                    const isConnected = hoveredNode && links.some(l => 
                        (l.source === hoveredNode.id && l.target === node.id) ||
                        (l.target === hoveredNode.id && l.source === node.id)
                    );
                    const dim = hoveredNode && !isHovered && !isConnected;

                    return (
                        <g 
                            key={i} 
                            transform={`translate(${node.x},${node.y})`} 
                            className={`cursor-pointer transition-opacity duration-300 ${dim ? 'opacity-20' : 'opacity-100'}`}
                            onMouseEnter={() => setHoveredNode(node)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Glow Effect Circle */}
                            <circle 
                                r={node.radius} 
                                fill={
                                    node.type === 'hunter' ? '#DC2626' : 
                                    node.type === 'team' ? '#3B82F6' : '#10B981'
                                } 
                                className="transition-all duration-300"
                                filter={isHovered ? "url(#glow)" : ""}
                                opacity={node.type === 'hunter' ? 1 : 0.8}
                            />
                            
                            {/* Hunter Avatar */}
                            {node.type === 'hunter' && (
                                <image 
                                    href={node.data.avatar} 
                                    x={-node.radius} 
                                    y={-node.radius} 
                                    height={node.radius * 2} 
                                    width={node.radius * 2} 
                                    clipPath={`circle(${node.radius}px at ${node.radius}px ${node.radius}px)`} 
                                />
                            )}

                            {/* Labels - Only show for Hunters or Hovered/Connected nodes */}
                            {(node.type === 'hunter' || isHovered || isConnected) && (
                                <g transform={`translate(0, ${node.radius + 15})`}>
                                    <rect 
                                        x="-50" y="-10" width="100" height="20" 
                                        rx="4" 
                                        fill="rgba(0,0,0,0.7)" 
                                        className={isHovered ? "fill-black" : ""}
                                    />
                                    <text 
                                        textAnchor="middle" 
                                        fill="#fff" 
                                        fontSize="10" 
                                        dy="4"
                                        className="font-mono font-bold pointer-events-none select-none"
                                    >
                                        {node.id.length > 15 ? node.id.substring(0, 12) + '...' : node.id}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
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
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/hunters')
      .then(res => res.json())
      .then(data => setHunters(data));
      
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const toggleCompare = (hunter) => {
    if (compareList.find(h => h.id === hunter.id)) {
        setCompareList(compareList.filter(h => h.id !== hunter.id));
    } else {
        if (compareList.length < 2) {
            setCompareList([...compareList, hunter]);
        }
    }
  };

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
      if (activeTab.includes("OWASP")) {
          const repA = a.category_data?.[activeTab]?.reputation || 0;
          const repB = b.category_data?.[activeTab]?.reputation || 0;
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
        <div className="flex border-b border-gray-800 overflow-x-auto items-center justify-between">
            <div className="flex">
                {["Top Reputation", "Critical Master", "OWASP A01 (Access Control)", "OWASP A03 (Injection)", "Collectives", "Community Graph", "AI Analyst"].map(tab => (
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
                        {tab === "Community Graph" && <Share2 className="w-4 h-4 inline-block mr-2" />}
                        {tab}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 px-4">
                <button 
                    onClick={() => {
                        if (compareMode) {
                            setCompareList([]);
                            setCompareMode(false);
                        } else {
                            setCompareMode(true);
                        }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-colors ${
                        compareMode 
                            ? "bg-blue-900/30 border-blue-500 text-blue-400" 
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                    }`}
                >
                    <Crosshair className="w-4 h-4" />
                    {compareMode ? "Compare Mode On" : "Compare"}
                </button>
                {compareList.length > 0 && (
                     <button 
                        onClick={() => setShowCompareModal(true)}
                        disabled={compareList.length < 2}
                        className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                            compareList.length === 2 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        Compare ({compareList.length}/2)
                    </button>
                )}
            </div>
        </div>

        {activeTab === "Community Graph" ? (
            <CommunityGraph hunters={hunters} />
        ) : activeTab !== "AI Analyst" ? (
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
                            <HunterRow 
                                key={h.id} 
                                hunter={h} 
                                onClick={(hunter) => {
                                    if (compareMode) {
                                        toggleCompare(hunter);
                                    } else {
                                        setSelectedHunter(hunter);
                                    }
                                }} 
                                activeTab={activeTab} 
                                index={index}
                                compareList={compareList}
                                compareMode={compareMode}
                            />
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

      {/* Compare Modal */}
      {showCompareModal && compareList.length === 2 && (
          <CompareModal hunters={compareList} onClose={() => setShowCompareModal(false)} />
      )}

      {/* User Profile Modal (Replaces SherlockModal) */}
      {selectedHunter && (
        <UserProfileModal hunter={selectedHunter} activeTab={activeTab} onClose={() => setSelectedHunter(null)} />
      )}
    </div>
  );
}
