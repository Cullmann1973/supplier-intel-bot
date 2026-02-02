'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, AlertTriangle, TrendingUp, TrendingDown, Minus, 
  Search, Plus, Sparkles, RefreshCw, FileText, Users, 
  ArrowLeft, ExternalLink, Trash2, BarChart3
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
  score: number;
  trend: 'up' | 'down' | 'flat';
  lastUpdated: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  time: string;
  supplierId?: string;
}

const defaultSuppliers: Supplier[] = [
  { id: '1', name: 'Shenzhen Electronics Ltd', category: 'Electronics', risk: 'high', score: 42, trend: 'down', lastUpdated: '30 min ago' },
  { id: '2', name: 'Gujarat Chemicals', category: 'Chemicals', risk: 'high', score: 38, trend: 'down', lastUpdated: '2 hours ago' },
  { id: '3', name: 'Taiwan Semiconductor', category: 'Semiconductors', risk: 'medium', score: 65, trend: 'flat', lastUpdated: '1 hour ago' },
  { id: '4', name: 'Korean Steel Co', category: 'Raw Materials', risk: 'medium', score: 71, trend: 'down', lastUpdated: '3 hours ago' },
  { id: '5', name: 'Munich Precision GmbH', category: 'Components', risk: 'low', score: 92, trend: 'up', lastUpdated: '1 day ago' },
  { id: '6', name: 'Tokyo Instruments', category: 'Equipment', risk: 'low', score: 88, trend: 'flat', lastUpdated: '6 hours ago' },
  { id: '7', name: 'Mexico Plastics SA', category: 'Packaging', risk: 'low', score: 85, trend: 'up', lastUpdated: '12 hours ago' },
  { id: '8', name: 'Midwest Logistics', category: 'Logistics', risk: 'medium', score: 68, trend: 'flat', lastUpdated: '4 hours ago' },
];

const defaultAlerts: Alert[] = [
  { id: '1', type: 'critical', icon: '🚨', title: 'Shenzhen Electronics Ltd - Credit Rating Downgrade', description: "Moody's downgraded from A3 to Baa1. Payment risk elevated.", time: '30 minutes ago', supplierId: '1' },
  { id: '2', type: 'critical', icon: '🏭', title: 'Gujarat Chemicals - Plant Incident', description: 'Minor fire at production facility. No injuries. Assessing supply impact.', time: '2 hours ago', supplierId: '2' },
  { id: '3', type: 'warning', icon: '⚡', title: 'Taiwan Semiconductor - Lead Time Increase', description: 'Quoted lead times extended from 12 to 16 weeks.', time: '6 hours ago', supplierId: '3' },
  { id: '4', type: 'warning', icon: '📈', title: 'Korean Steel Co - Price Increase', description: 'Announced 8% price increase effective next quarter.', time: '1 day ago', supplierId: '4' },
  { id: '5', type: 'info', icon: '📋', title: 'Munich Precision - Audit Complete', description: 'Annual quality audit passed. ISO 9001 certification renewed.', time: '2 days ago', supplierId: '5' },
];

const newsItems = [
  { source: 'Reuters', title: 'Global chip shortage shows signs of easing as new fabs come online', time: '2 hours ago' },
  { source: 'Supply Chain Dive', title: 'Red Sea disruptions force rerouting of Asia-Europe shipments', time: '5 hours ago' },
  { source: 'Bloomberg', title: 'China rare earth exports hit new high amid EV demand surge', time: '8 hours ago' },
];

export default function Dashboard() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>(defaultSuppliers);
  const [alerts] = useState<Alert[]>(defaultAlerts);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCategory, setNewSupplierCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check Ollama status
    checkOllamaStatus();
    // Load saved suppliers from localStorage
    const saved = localStorage.getItem('dashboard_suppliers');
    if (saved) {
      setSuppliers(JSON.parse(saved));
    }
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const res = await fetch('/api/ollama-status');
      const data = await res.json();
      setOllamaStatus(data.status === 'online' ? 'online' : 'offline');
    } catch {
      setOllamaStatus('offline');
    }
  };

  const saveSuppliers = (updated: Supplier[]) => {
    setSuppliers(updated);
    localStorage.setItem('dashboard_suppliers', JSON.stringify(updated));
  };

  const addSupplier = () => {
    if (!newSupplierName.trim()) return;
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: newSupplierName.trim(),
      category: newSupplierCategory.trim() || 'General',
      risk: 'medium',
      score: 70,
      trend: 'flat',
      lastUpdated: 'Just now',
    };
    saveSuppliers([...suppliers, newSupplier]);
    setNewSupplierName('');
    setNewSupplierCategory('');
  };

  const removeSupplier = (id: string) => {
    saveSuppliers(suppliers.filter(s => s.id !== id));
  };

  const analyzePortfolio = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);
    
    try {
      const res = await fetch('/api/portfolio-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suppliers }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.analysis);
      } else {
        setAiInsight('Unable to generate analysis. Please check if local AI is running.');
      }
    } catch (error) {
      setAiInsight('Error connecting to AI service.');
    }
    
    setIsAnalyzing(false);
  };

  const highRisk = suppliers.filter(s => s.risk === 'high').length;
  const mediumRisk = suppliers.filter(s => s.risk === 'medium').length;
  const lowRisk = suppliers.filter(s => s.risk === 'low').length;
  const avgScore = Math.round(suppliers.reduce((sum, s) => sum + s.score, 0) / suppliers.length);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const RiskBadge = ({ risk }: { risk: string }) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[risk as keyof typeof colors]}`}>
        {risk.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="nav-header">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[var(--si-blue)] to-[var(--si-blue-dark)] rounded-xl">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Risk Dashboard</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
              ollamaStatus === 'online' 
                ? 'bg-green-500/20 text-green-400' 
                : ollamaStatus === 'offline'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                ollamaStatus === 'online' ? 'bg-green-400' : 
                ollamaStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
              }`} />
              <span className="text-[11px]">
                {ollamaStatus === 'online' ? 'AI Online' : 
                 ollamaStatus === 'offline' ? 'AI Offline' : 'Checking...'}
              </span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-400">{highRisk}</div>
            <div className="text-sm text-[var(--text-tertiary)]">High Risk</div>
          </div>
          <div className="card p-4 border-l-4 border-yellow-500">
            <div className="text-3xl font-bold text-yellow-400">{mediumRisk}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Medium Risk</div>
          </div>
          <div className="card p-4 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-400">{lowRisk}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Low Risk</div>
          </div>
          <div className="card p-4 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-400">{avgScore}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Avg Health Score</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Portfolio */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[var(--si-blue)]" />
                  Supplier Portfolio
                </h2>
                <button
                  onClick={analyzePortfolio}
                  disabled={isAnalyzing}
                  className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
                </button>
              </div>

              {/* Add Supplier Form */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Add supplier name..."
                  className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg text-white placeholder-[var(--text-quaternary)]"
                  onKeyDown={(e) => e.key === 'Enter' && addSupplier()}
                />
                <input
                  type="text"
                  value={newSupplierCategory}
                  onChange={(e) => setNewSupplierCategory(e.target.value)}
                  placeholder="Category"
                  className="w-32 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg text-white placeholder-[var(--text-quaternary)]"
                  onKeyDown={(e) => e.key === 'Enter' && addSupplier()}
                />
                <button
                  onClick={addSupplier}
                  className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Supplier Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-[var(--si-blue)]">Supplier</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-[var(--si-blue)]">Category</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-[var(--si-blue)]">Risk</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-[var(--si-blue)]">Score</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-[var(--si-blue)]">Trend</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-[var(--si-blue)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr 
                        key={supplier.id} 
                        className="border-b border-[var(--glass-border)]/50 hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <span className="font-medium text-white">{supplier.name}</span>
                        </td>
                        <td className="py-3 px-2 text-[var(--text-secondary)]">{supplier.category}</td>
                        <td className="py-3 px-2"><RiskBadge risk={supplier.risk} /></td>
                        <td className="py-3 px-2 text-[var(--text-secondary)]">{supplier.score}/100</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <TrendIcon trend={supplier.trend} />
                            <span className="text-sm text-[var(--text-tertiary)]">
                              {supplier.trend === 'up' ? 'Improving' : supplier.trend === 'down' ? 'Declining' : 'Stable'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => router.push(`/intel?supplier=${encodeURIComponent(supplier.name)}`)}
                              className="p-1.5 hover:bg-[var(--bg-elevated)] rounded transition-colors"
                              title="View Intel"
                            >
                              <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </button>
                            <button
                              onClick={() => removeSupplier(supplier.id)}
                              className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4 text-[var(--text-tertiary)] hover:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI Insight */}
              {(isAnalyzing || aiInsight) && (
                <div className="mt-4 p-4 bg-gradient-to-br from-[var(--si-blue)]/10 to-purple-500/10 border border-[var(--si-blue)]/30 rounded-xl">
                  <h4 className="text-sm font-semibold text-[var(--si-blue)] flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" />
                    AI Risk Assessment
                  </h4>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing supplier portfolio with local AI...</span>
                    </div>
                  ) : (
                    <div className="text-[var(--text-secondary)] whitespace-pre-wrap">{aiInsight}</div>
                  )}
                </div>
              )}
            </div>

            {/* Market Intelligence */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[var(--si-blue)]" />
                Market Intelligence
              </h2>
              <div className="space-y-3">
                {newsItems.map((item, i) => (
                  <div key={i} className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <div className="text-xs text-red-400 font-medium">{item.source}</div>
                    <div className="text-white mt-1">{item.title}</div>
                    <div className="text-xs text-[var(--text-quaternary)] mt-1">{item.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Alerts */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Active Alerts
              </h2>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'critical' ? 'bg-red-500/10 border-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                      'bg-blue-500/10 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{alert.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{alert.title}</div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">{alert.description}</div>
                        <div className="text-xs text-[var(--text-quaternary)] mt-1">{alert.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[var(--si-blue)]" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors text-sm text-[var(--text-secondary)]">
                  Run Due Diligence Check
                </button>
                <button className="w-full text-left px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors text-sm text-[var(--text-secondary)]">
                  Generate Risk Report
                </button>
                <button 
                  onClick={() => router.push('/compare')}
                  className="w-full text-left px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors text-sm text-[var(--text-secondary)]"
                >
                  Compare Suppliers
                </button>
                <button className="w-full text-left px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors text-sm text-[var(--text-secondary)]">
                  Find Alternative Suppliers
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
