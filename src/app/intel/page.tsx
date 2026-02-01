'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Globe,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Shield,
  Leaf,
  Heart,
  Scale,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Award,
  Newspaper,
  Brain,
  RefreshCw,
} from 'lucide-react';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string;
  snippet: string;
}

interface RiskFactor {
  category: string;
  level: 'low' | 'medium' | 'high';
  description: string;
}

interface SupplierIntel {
  company: string;
  summary: string;
  industry: string;
  headquarters: string;
  employees: string;
  revenue: string;
  founded: string;
  website: string;
  stockSymbol?: string;
  news: NewsItem[];
  risks: RiskFactor[];
  opportunities: string[];
  esgScore: {
    environmental: number;
    social: number;
    governance: number;
    overall: number;
  };
  competitivePosition: string;
  supplyChainRole: string;
  certifications: string[];
  recentDevelopments: string[];
  aiAnalysis: string;
}

function IntelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supplier = searchParams.get('supplier');
  
  const [intel, setIntel] = useState<SupplierIntel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supplier) {
      router.push('/');
      return;
    }

    const fetchIntel = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/intel?supplier=${encodeURIComponent(supplier)}`);
        if (!response.ok) throw new Error('Failed to fetch intelligence');
        
        const data = await response.json();
        setIntel(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchIntel();
  }, [supplier, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Gathering Intelligence</h2>
          <p className="text-slate-400">Analyzing {supplier}...</p>
          <div className="mt-6 space-y-2 text-sm text-slate-500">
            <p>• Searching web sources</p>
            <p>• Analyzing news and press releases</p>
            <p>• Evaluating risk factors</p>
            <p>• Generating AI insights</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !intel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-slate-400 mb-4">{error || 'Failed to load intelligence'}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-10 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{intel.company}</h1>
                  <p className="text-xs text-slate-400">{intel.industry}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
          <p className="text-lg text-slate-200 leading-relaxed">{intel.summary}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Globe className="w-5 h-5" />} label="Headquarters" value={intel.headquarters} />
          <StatCard icon={<Users className="w-5 h-5" />} label="Employees" value={intel.employees} />
          <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenue" value={intel.revenue} />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Founded" value={intel.founded} />
          <StatCard 
            icon={<ExternalLink className="w-5 h-5" />} 
            label="Website" 
            value={intel.stockSymbol || 'Visit'} 
            link={intel.website}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Analysis */}
            <Section title="AI Analysis" icon={<Brain className="w-5 h-5" />}>
              <p className="text-slate-300 leading-relaxed">{intel.aiAnalysis}</p>
            </Section>

            {/* Risk Assessment */}
            <Section title="Risk Assessment" icon={<AlertTriangle className="w-5 h-5" />}>
              <div className="space-y-3">
                {intel.risks.map((risk, i) => (
                  <RiskItem key={i} risk={risk} />
                ))}
              </div>
            </Section>

            {/* News & Developments */}
            <Section title="Recent News" icon={<Newspaper className="w-5 h-5" />}>
              <div className="space-y-4">
                {intel.news.map((item, i) => (
                  <NewsCard key={i} news={item} />
                ))}
              </div>
            </Section>

            {/* Recent Developments */}
            {intel.recentDevelopments.length > 0 && (
              <Section title="Recent Developments" icon={<TrendingUp className="w-5 h-5" />}>
                <ul className="space-y-2">
                  {intel.recentDevelopments.map((dev, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      <span>{dev}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* ESG Score */}
            <Section title="ESG Score" icon={<Shield className="w-5 h-5" />}>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-blue-500">
                  <span className="text-2xl font-bold text-white">{intel.esgScore.overall}</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">Overall Score</p>
              </div>
              <div className="space-y-3">
                <ESGBar icon={<Leaf className="w-4 h-4" />} label="Environmental" score={intel.esgScore.environmental} />
                <ESGBar icon={<Heart className="w-4 h-4" />} label="Social" score={intel.esgScore.social} />
                <ESGBar icon={<Scale className="w-4 h-4" />} label="Governance" score={intel.esgScore.governance} />
              </div>
            </Section>

            {/* Opportunities */}
            <Section title="Opportunities" icon={<TrendingUp className="w-5 h-5" />}>
              <ul className="space-y-2">
                {intel.opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Certifications */}
            {intel.certifications.length > 0 && (
              <Section title="Certifications" icon={<Award className="w-5 h-5" />}>
                <div className="flex flex-wrap gap-2">
                  {intel.certifications.map((cert, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-full">
                      {cert}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Supply Chain Role */}
            <Section title="Supply Chain Role" icon={<Building2 className="w-5 h-5" />}>
              <p className="text-slate-300 text-sm">{intel.supplyChainRole}</p>
            </Section>

            {/* Competitive Position */}
            <Section title="Competitive Position" icon={<TrendingUp className="w-5 h-5" />}>
              <p className="text-slate-300 text-sm">{intel.competitivePosition}</p>
            </Section>
          </div>
        </div>

        {/* Export Actions */}
        <div className="mt-12 flex justify-center gap-4">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF Report
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }}
            className="px-6 py-3 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Link
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            Supplier Intel Demo • Data gathered from public sources • Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function IntelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
    }>
      <IntelContent />
    </Suspense>
  );
}

function StatCard({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: string }) {
  const content = (
    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center hover:bg-slate-800/50 transition-colors">
      <div className="text-slate-400 mb-2 flex justify-center">{icon}</div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-white font-medium truncate">{value}</p>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
        <span className="text-blue-400">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function RiskItem({ risk }: { risk: RiskFactor }) {
  const colors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[risk.level]}`}>
        {risk.level.toUpperCase()}
      </span>
      <div>
        <p className="text-white font-medium text-sm">{risk.category}</p>
        <p className="text-slate-400 text-sm">{risk.description}</p>
      </div>
    </div>
  );
}

function NewsCard({ news }: { news: NewsItem }) {
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-white font-medium text-sm line-clamp-2">{news.title}</h4>
        <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </div>
      <p className="text-slate-400 text-xs line-clamp-2 mb-2">{news.snippet}</p>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{news.source}</span>
        {news.date && (
          <>
            <span>•</span>
            <span>{news.date}</span>
          </>
        )}
      </div>
    </a>
  );
}

function ESGBar({ icon, label, score }: { icon: React.ReactNode; label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xs text-white font-medium">{score}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor(score)} rounded-full transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
