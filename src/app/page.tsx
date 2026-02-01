'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Shield, TrendingUp, AlertTriangle, Globe } from 'lucide-react';

export default function Home() {
  const [supplierName, setSupplierName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    
    setIsLoading(true);
    router.push(`/intel?supplier=${encodeURIComponent(supplierName.trim())}`);
  };

  const demoSuppliers = [
    'BASF SE',
    'Dow Chemical',
    'Honeywell',
    'Siemens AG',
    '3M Company'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Supplier Intel</h1>
              <p className="text-xs text-slate-400">AI-Powered Supply Chain Intelligence</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Know Your Suppliers
            <span className="block text-blue-400">Before They Know You</span>
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Instant intelligence on any supplier. Financial health, news, risks, and opportunities - 
            all analyzed by AI in seconds.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Enter supplier name (e.g., BASF, Honeywell, Siemens)"
                className="w-full pl-12 pr-32 py-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <button
                type="submit"
                disabled={isLoading || !supplierName.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Analyzing...' : 'Get Intel'}
              </button>
            </div>
          </form>

          {/* Quick Demo Links */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            <span className="text-slate-400 text-sm">Try:</span>
            {demoSuppliers.map((supplier) => (
              <button
                key={supplier}
                onClick={() => setSupplierName(supplier)}
                className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-full transition-colors"
              >
                {supplier}
              </button>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-6 text-left">
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Web Intelligence"
              description="Aggregates news, press releases, and public data in real-time"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Financial Health"
              description="Revenue trends, market position, and growth indicators"
            />
            <FeatureCard
              icon={<AlertTriangle className="w-6 h-6" />}
              title="Risk Assessment"
              description="AI-powered analysis of supply chain and operational risks"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Compliance Check"
              description="ESG, regulatory, and quality certification status"
            />
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-10">Built for Supply Chain Leaders</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <UseCase
              title="Vendor Qualification"
              description="Screen new suppliers before onboarding with comprehensive intelligence reports"
            />
            <UseCase
              title="Risk Monitoring"
              description="Stay ahead of supply disruptions with real-time alerts and trend analysis"
            />
            <UseCase
              title="Strategic Sourcing"
              description="Make data-driven decisions with competitive landscape insights"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            Supplier Intel Demo • Built with AI for Supply Chain Excellence
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
      <div className="text-blue-400 mb-3">{icon}</div>
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function UseCase({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
