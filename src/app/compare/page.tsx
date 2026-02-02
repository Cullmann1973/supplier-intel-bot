'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { gsap } from 'gsap';
import {
  Building2,
  Globe,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Shield,
  Leaf,
  Heart,
  Scale,
  ChevronLeft,
  Loader2,
  Search,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Minus,
  Award,
  ArrowRight,
} from 'lucide-react';

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
  risks: { category: string; level: string; description: string }[];
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
  aiAnalysis: string;
  reputation: {
    overall: number;
    consumerSentiment: number;
    socialMediaSentiment: number;
    mediaSentiment: number;
    regulatoryCompliance: number;
    summary: string;
  };
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);
  
  const [supplier1Name, setSupplier1Name] = useState(searchParams.get('s1') || '');
  const [supplier2Name, setSupplier2Name] = useState(searchParams.get('s2') || '');
  const [supplier1, setSupplier1] = useState<SupplierIntel | null>(null);
  const [supplier2, setSupplier2] = useState<SupplierIntel | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mainRef.current) {
      gsap.fromTo(mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const fetchSupplier = async (name: string, setSupplier: (s: SupplierIntel | null) => void, setLoading: (l: boolean) => void) => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/intel?supplier=${encodeURIComponent(name)}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSupplier(data);
    } catch (err) {
      setError('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (supplier1Name.trim()) fetchSupplier(supplier1Name, setSupplier1, setLoading1);
    if (supplier2Name.trim()) fetchSupplier(supplier2Name, setSupplier2, setLoading2);
    
    // Update URL
    const params = new URLSearchParams();
    if (supplier1Name) params.set('s1', supplier1Name);
    if (supplier2Name) params.set('s2', supplier2Name);
    router.push(`/compare?${params.toString()}`);
  };

  // Load from URL params on mount
  useEffect(() => {
    const s1 = searchParams.get('s1');
    const s2 = searchParams.get('s2');
    if (s1) {
      setSupplier1Name(s1);
      fetchSupplier(s1, setSupplier1, setLoading1);
    }
    if (s2) {
      setSupplier2Name(s2);
      fetchSupplier(s2, setSupplier2, setLoading2);
    }
  }, []);

  const CompareIndicator = ({ val1, val2, higherBetter = true }: { val1: number; val2: number; higherBetter?: boolean }) => {
    if (val1 === val2) return <Minus className="w-4 h-4 text-gray-400" />;
    const winner = higherBetter ? val1 > val2 : val1 < val2;
    return winner ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    );
  };

  const ScoreBar = ({ score, color = 'blue' }: { score: number; color?: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-[var(--si-blue)]'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8">{score}</span>
    </div>
  );

  const RiskLevel = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500/20 text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || colors.medium}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="nav-header">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="nav-back">
            <ChevronLeft className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">Compare Suppliers</h1>
          <div className="w-20" />
        </div>
      </header>

      <main ref={mainRef} className="pt-20 pb-8 px-4 max-w-6xl mx-auto" style={{ opacity: 0 }}>
        {/* Search Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="card p-4">
            <label className="text-sm text-[var(--text-tertiary)] mb-2 block">Supplier 1</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={supplier1Name}
                onChange={(e) => setSupplier1Name(e.target.value)}
                placeholder="e.g., BASF SE"
                className="input-field flex-1 px-4 py-2 bg-[var(--bg-secondary)] rounded-lg"
              />
            </div>
          </div>
          <div className="card p-4">
            <label className="text-sm text-[var(--text-tertiary)] mb-2 block">Supplier 2</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={supplier2Name}
                onChange={(e) => setSupplier2Name(e.target.value)}
                placeholder="e.g., Dow Chemical"
                className="input-field flex-1 px-4 py-2 bg-[var(--bg-secondary)] rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleCompare}
            disabled={!supplier1Name.trim() || !supplier2Name.trim() || loading1 || loading2}
            className="btn-primary px-8 py-3 inline-flex items-center gap-2"
          >
            {(loading1 || loading2) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Scale className="w-5 h-5" />
                Compare Suppliers
              </>
            )}
          </button>
        </div>

        {/* Comparison Results */}
        {(supplier1 || supplier2) && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--si-blue)]" />
                Company Overview
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <h3 className="font-semibold text-[var(--si-blue)]">{supplier1?.company || '—'}</h3>
                  {loading1 && <Loader2 className="w-4 h-4 animate-spin mx-auto mt-2" />}
                </div>
                <div className="text-center text-[var(--text-tertiary)] text-sm">Metric</div>
                <div className="text-center">
                  <h3 className="font-semibold text-[var(--si-blue)]">{supplier2?.company || '—'}</h3>
                  {loading2 && <Loader2 className="w-4 h-4 animate-spin mx-auto mt-2" />}
                </div>

                {/* Industry */}
                <div className="text-sm text-white">{supplier1?.industry || '—'}</div>
                <div className="text-sm text-[var(--text-tertiary)] text-center">Industry</div>
                <div className="text-sm text-white text-right">{supplier2?.industry || '—'}</div>

                {/* HQ */}
                <div className="text-sm text-white">{supplier1?.headquarters || '—'}</div>
                <div className="text-sm text-[var(--text-tertiary)] text-center">Headquarters</div>
                <div className="text-sm text-white text-right">{supplier2?.headquarters || '—'}</div>

                {/* Employees */}
                <div className="text-sm text-white">{supplier1?.employees || '—'}</div>
                <div className="text-sm text-[var(--text-tertiary)] text-center">Employees</div>
                <div className="text-sm text-white text-right">{supplier2?.employees || '—'}</div>

                {/* Revenue */}
                <div className="text-sm text-white">{supplier1?.revenue || '—'}</div>
                <div className="text-sm text-[var(--text-tertiary)] text-center">Revenue</div>
                <div className="text-sm text-white text-right">{supplier2?.revenue || '—'}</div>

                {/* Founded */}
                <div className="text-sm text-white">{supplier1?.founded || '—'}</div>
                <div className="text-sm text-[var(--text-tertiary)] text-center">Founded</div>
                <div className="text-sm text-white text-right">{supplier2?.founded || '—'}</div>
              </div>
            </div>

            {/* ESG Comparison */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                ESG Scores
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  {supplier1?.esgScore && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Overall</div>
                        <ScoreBar score={supplier1.esgScore.overall} color="green" />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Environmental</div>
                        <ScoreBar score={supplier1.esgScore.environmental} color="green" />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Social</div>
                        <ScoreBar score={supplier1.esgScore.social} color="yellow" />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Governance</div>
                        <ScoreBar score={supplier1.esgScore.governance} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center items-center space-y-3 text-[var(--text-tertiary)] text-xs">
                  <div className="h-6 flex items-center">
                    {supplier1?.esgScore && supplier2?.esgScore && (
                      <CompareIndicator val1={supplier1.esgScore.overall} val2={supplier2.esgScore.overall} />
                    )}
                  </div>
                  <div className="h-6 flex items-center">
                    {supplier1?.esgScore && supplier2?.esgScore && (
                      <CompareIndicator val1={supplier1.esgScore.environmental} val2={supplier2.esgScore.environmental} />
                    )}
                  </div>
                  <div className="h-6 flex items-center">
                    {supplier1?.esgScore && supplier2?.esgScore && (
                      <CompareIndicator val1={supplier1.esgScore.social} val2={supplier2.esgScore.social} />
                    )}
                  </div>
                  <div className="h-6 flex items-center">
                    {supplier1?.esgScore && supplier2?.esgScore && (
                      <CompareIndicator val1={supplier1.esgScore.governance} val2={supplier2.esgScore.governance} />
                    )}
                  </div>
                </div>
                <div>
                  {supplier2?.esgScore && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Overall</div>
                        <ScoreBar score={supplier2.esgScore.overall} color="green" />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Environmental</div>
                        <ScoreBar score={supplier2.esgScore.environmental} color="green" />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Social</div>
                        <ScoreBar score={supplier2.esgScore.social} color="yellow" />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Governance</div>
                        <ScoreBar score={supplier2.esgScore.governance} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reputation Comparison */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--si-blue)]" />
                Reputation Scores
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  {supplier1?.reputation && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Overall</div>
                        <ScoreBar score={supplier1.reputation.overall} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Consumer</div>
                        <ScoreBar score={supplier1.reputation.consumerSentiment} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Social Media</div>
                        <ScoreBar score={supplier1.reputation.socialMediaSentiment} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Regulatory</div>
                        <ScoreBar score={supplier1.reputation.regulatoryCompliance} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center items-center space-y-3 text-[var(--text-tertiary)] text-xs">
                  <div className="h-6 flex items-center">
                    {supplier1?.reputation && supplier2?.reputation && (
                      <CompareIndicator val1={supplier1.reputation.overall} val2={supplier2.reputation.overall} />
                    )}
                  </div>
                  <div className="h-6 flex items-center">
                    {supplier1?.reputation && supplier2?.reputation && (
                      <CompareIndicator val1={supplier1.reputation.consumerSentiment} val2={supplier2.reputation.consumerSentiment} />
                    )}
                  </div>
                  <div className="h-6 flex items-center">
                    {supplier1?.reputation && supplier2?.reputation && (
                      <CompareIndicator val1={supplier1.reputation.socialMediaSentiment} val2={supplier2.reputation.socialMediaSentiment} />
                    )}
                  </div>
                  <div className="h-6 flex items-center">
                    {supplier1?.reputation && supplier2?.reputation && (
                      <CompareIndicator val1={supplier1.reputation.regulatoryCompliance} val2={supplier2.reputation.regulatoryCompliance} />
                    )}
                  </div>
                </div>
                <div>
                  {supplier2?.reputation && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Overall</div>
                        <ScoreBar score={supplier2.reputation.overall} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Consumer</div>
                        <ScoreBar score={supplier2.reputation.consumerSentiment} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Social Media</div>
                        <ScoreBar score={supplier2.reputation.socialMediaSentiment} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Regulatory</div>
                        <ScoreBar score={supplier2.reputation.regulatoryCompliance} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Risks Comparison */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Risk Assessment
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-[var(--si-blue)] mb-3">{supplier1?.company}</h3>
                  <div className="space-y-2">
                    {supplier1?.risks?.map((risk, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{risk.category}</span>
                        <RiskLevel level={risk.level} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--si-blue)] mb-3">{supplier2?.company}</h3>
                  <div className="space-y-2">
                    {supplier2?.risks?.map((risk, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{risk.category}</span>
                        <RiskLevel level={risk.level} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--si-blue)]" />
                Certifications
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-[var(--si-blue)] mb-3">{supplier1?.company}</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier1?.certifications?.map((cert, i) => (
                      <span key={i} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-secondary)]">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--si-blue)] mb-3">{supplier2?.company}</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier2?.certifications?.map((cert, i) => (
                      <span key={i} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-secondary)]">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--si-blue)]" />
                AI Analysis
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-[var(--si-blue)] mb-3">{supplier1?.company}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {supplier1?.aiAnalysis || '—'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--si-blue)] mb-3">{supplier2?.company}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {supplier2?.aiAnalysis || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!supplier1 && !supplier2 && !loading1 && !loading2 && (
          <div className="text-center py-16">
            <Scale className="w-16 h-16 mx-auto mb-4 text-[var(--text-quaternary)]" />
            <h3 className="text-xl font-semibold text-white mb-2">Compare Two Suppliers</h3>
            <p className="text-[var(--text-tertiary)] max-w-md mx-auto">
              Enter two supplier names above to see a side-by-side comparison of their profiles, ESG scores, risks, and more.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => { setSupplier1Name('BASF SE'); setSupplier2Name('Dow Chemical'); }}
                className="text-sm text-[var(--si-blue)] hover:underline"
              >
                Try: BASF vs Dow
              </button>
              <button 
                onClick={() => { setSupplier1Name('Siemens AG'); setSupplier2Name('Honeywell'); }}
                className="text-sm text-[var(--si-blue)] hover:underline"
              >
                Try: Siemens vs Honeywell
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--si-blue)]" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
