import { useEffect, useState, useCallback } from 'react';
import { Loader2, Building, Search, CheckCircle } from 'lucide-react';
import { api } from '../lib/services/api';
import { useUser } from '../contexts/UserContext';

interface Industry {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
}

interface Company {
    id: string;
    name: string;
    industry?: string;
    verified: boolean;
    totalCredits?: number;
    totalActions?: number;
    walletAddress: string;
}

export function Companies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
    const [filterIndustry, setFilterIndustry] = useState<string>('all');
    const [industries, setIndustries] = useState<Industry[]>([]);
    const { user } = useUser();
    
    const isVerifier = user?.role?.toUpperCase() === 'VERIFIER';
    const isAuditor = user?.role?.toUpperCase() === 'AUDITOR';
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

    useEffect(() => {
        loadCompanies();
        loadIndustries();
    }, []);

    async function loadIndustries() {
        try {
            const response = await api.getIndustries();
            if (response.success) {
                setIndustries(response.data);
            }
        } catch (error) {
            console.error('Failed to load industries:', error);
        }
    }

    const filterCompanies = useCallback(() => {
        let filtered = companies;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.industry?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        // Verification filter
        if (filterVerified === 'verified') {
            filtered = filtered.filter(c => c.verified);
        } else if (filterVerified === 'unverified') {
            filtered = filtered.filter(c => !c.verified);
        }

        // Industry filter
        if (filterIndustry !== 'all') {
            filtered = filtered.filter(c => c.industry === filterIndustry);
        }

        setFilteredCompanies(filtered);
    }, [companies, searchTerm, filterVerified, filterIndustry]);

    useEffect(() => {
        filterCompanies();
    }, [filterCompanies]);

    async function loadCompanies() {
        setLoading(true);
        try {
            const response = await api.getCompanies();
            const mappedCompanies: Company[] = (response.data || []).map((c) => ({
                id: c.id,
                name: c.name,
                industry: c.industry,
                verified: c.verified,
                totalCredits: 0,
                totalActions: 0,
                walletAddress: c.walletAddress
            }));
            setCompanies(mappedCompanies);
        } catch (error) {
            console.error('Failed to load companies:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900">
                    {isAdmin ? 'Company Management' : isVerifier ? 'Company Directory' : isAuditor ? 'Company Audits' : 'Companies'}
                </h1>
                <p className="mt-2 text-secondary-600">
                    {isAdmin
                        ? 'Manage and oversee all companies on the platform.'
                        : isVerifier 
                        ? 'Browse companies and their eco actions for verification.'
                        : isAuditor
                        ? 'Audit company profiles and compliance status.'
                        : 'Explore companies participating in the EcoCred ecosystem.'}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filterVerified}
                            onChange={(e) => setFilterVerified(e.target.value as 'all' | 'verified' | 'unverified')}
                            className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="all">All Companies</option>
                            <option value="verified">Verified Only</option>
                            <option value="unverified">Unverified Only</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={filterIndustry}
                            onChange={(e) => setFilterIndustry(e.target.value)}
                            className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="all">All Industries</option>
                            {industries.map((industry) => (
                                <option key={industry.id} value={industry.name}>
                                    {industry.icon} {industry.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Building size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Total Companies</p>
                            <p className="text-2xl font-bold text-secondary-900">{companies.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Verified</p>
                            <p className="text-2xl font-bold text-secondary-900">
                                {companies.filter(c => c.verified).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Building size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary-500">Showing</p>
                            <p className="text-2xl font-bold text-secondary-900">{filteredCompanies.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Companies Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-secondary-200">
                    <Building size={48} className="mx-auto text-secondary-400 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900">No companies found</h3>
                    <p className="text-secondary-500 mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                                        {company.name}
                                    </h3>
                                    <p className="text-sm text-secondary-500">{company.industry}</p>
                                </div>
                                {company.verified && (
                                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                                )}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary-600">Total Credits:</span>
                                    <span className="font-semibold text-green-600">{company.totalCredits}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary-600">Eco Actions:</span>
                                    <span className="font-semibold text-secondary-900">{company.totalActions}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-secondary-100">
                                <p className="text-xs text-secondary-400 font-mono truncate">
                                    {company.walletAddress}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
