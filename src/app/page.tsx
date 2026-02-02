'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { Search, Building2, Shield, TrendingUp, AlertTriangle, Globe, Clock, X, Sparkles, ChevronRight, Scale, ArrowRight, BarChart3 } from 'lucide-react';

export default function Home() {
  const [supplierName, setSupplierName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPageLoaded(true);
    const stored = localStorage.getItem('recentSupplierSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (isPageLoaded && mainRef.current) {
      gsap.fromTo(mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [isPageLoaded]);

  const saveSearch = (name: string) => {
    const updated = [name, ...recentSearches.filter(s => s !== name)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSupplierSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSupplierSearches');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    
    setIsLoading(true);
    saveSearch(supplierName.trim());
    
    // Animate out
    if (mainRef.current) {
      gsap.to(mainRef.current, {
        opacity: 0,
        x: -30,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          router.push(`/intel?supplier=${encodeURIComponent(supplierName.trim())}`);
        }
      });
    } else {
      router.push(`/intel?supplier=${encodeURIComponent(supplierName.trim())}`);
    }
  };

  const demoSuppliers = [
    { name: 'BASF SE', industry: 'Chemicals' },
    { name: 'Honeywell', industry: 'Industrial' },
    { name: 'Siemens AG', industry: 'Technology' },
    { name: '3M Company', industry: 'Manufacturing' },
  ];

  const features = [
    { icon: Globe, label: 'Web Intelligence', desc: 'Real-time news & data' },
    { icon: TrendingUp, label: 'Financial Health', desc: 'Revenue & growth analysis' },
    { icon: AlertTriangle, label: 'Risk Assessment', desc: 'AI-powered risk scoring' },
    { icon: Shield, label: 'Compliance', desc: 'ESG & regulatory status' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--si-blue)]/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="nav-header">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[var(--si-blue)] to-[var(--si-blue-dark)] rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Supplier Intel</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)]">
            <Sparkles className="w-3 h-3 text-[var(--si-blue)]" />
            <span className="text-[11px] text-[var(--text-tertiary)]">AI-Powered</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main ref={mainRef} className="pt-20 pb-8 px-4 max-w-4xl mx-auto" style={{ opacity: 0 }}>
        {/* Hero */}
        <div className="text-center mb-10 pt-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Know Your Suppliers
            <span className="block text-[var(--si-blue)]">Before They Know You</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-base max-w-lg mx-auto">
            Instant intelligence on any supplier. Financial health, news, risks, and reputation - analyzed by AI.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
          <div className="input-container flex gap-2 p-2">
            <div className="flex items-center pl-3">
              <Search className="w-5 h-5 text-[var(--text-quaternary)]" />
            </div>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Enter supplier name (e.g., BASF, Honeywell)"
              className="input-field flex-1 py-3"
            />
            <button
              type="submit"
              disabled={isLoading || !supplierName.trim()}
              className="btn-primary px-6 py-3"
            >
              {isLoading ? 'Analyzing...' : 'Get Intel'}
            </button>
          </div>
        </form>

        {/* Demo Suppliers */}
        <div className="mb-10">
          <p className="text-center text-sm text-[var(--text-tertiary)] mb-4">Try a demo supplier:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {demoSuppliers.map((supplier) => (
              <button
                key={supplier.name}
                onClick={() => {
                  setSupplierName(supplier.name);
                  saveSearch(supplier.name);
                  if (mainRef.current) {
                    gsap.to(mainRef.current, {
                      opacity: 0,
                      x: -30,
                      duration: 0.3,
                      ease: 'power2.in',
                      onComplete: () => {
                        router.push(`/intel?supplier=${encodeURIComponent(supplier.name)}`);
                      }
                    });
                  }
                }}
                className="card card-interactive p-3 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">{supplier.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{supplier.industry}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:text-[var(--si-blue)] group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <Clock className="w-4 h-4" />
                <span>Recent searches</span>
              </div>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-[var(--text-quaternary)] hover:text-[var(--si-blue)] transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setSupplierName(search);
                    if (mainRef.current) {
                      gsap.to(mainRef.current, {
                        opacity: 0,
                        x: -30,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                          router.push(`/intel?supplier=${encodeURIComponent(search)}`);
                        }
                      });
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-full text-[var(--text-secondary)] transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="card p-6 max-w-2xl mx-auto mb-6">
          <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
            What You'll Get
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature.label} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--si-blue)]/10">
                  <feature.icon className="w-4 h-4 text-[var(--si-blue)]" />
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{feature.label}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard & Compare Features */}
        <div className="max-w-2xl mx-auto space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full card card-interactive p-4 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Risk Dashboard</div>
                <div className="text-sm text-[var(--text-tertiary)]">Monitor your supplier portfolio with AI</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-quaternary)] group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => router.push('/compare')}
            className="w-full card card-interactive p-4 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                <Scale className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Compare Suppliers</div>
                <div className="text-sm text-[var(--text-tertiary)]">Side-by-side analysis of two suppliers</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-quaternary)] group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--glass-border)] py-4 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 text-center text-[11px] text-[var(--text-quaternary)]">
          Supplier Intel Demo • AI-Powered Supply Chain Intelligence
        </div>
      </footer>
    </div>
  );
}
