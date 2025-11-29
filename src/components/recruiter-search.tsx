'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Recruiter {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
}

interface RecruiterSearchProps {
    selectedRecruiters: Recruiter[];
    onSelect: (recruiter: Recruiter) => void;
    onRemove: (recruiterId: string) => void;
}

export function RecruiterSearch({
    selectedRecruiters,
    onSelect,
    onRemove
}: RecruiterSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Recruiter[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/recruiters/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.recruiters || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search by name or email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
            </div>

            {/* Selected Recruiters */}
            {selectedRecruiters.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-white">Panel Members ({selectedRecruiters.length})</p>
                    <div className="space-y-2">
                        {selectedRecruiters.map(recruiter => (
                            <div
                                key={recruiter.id}
                                className="flex items-center justify-between p-2 bg-slate-800 border border-slate-700 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={recruiter.photoUrl} />
                                        <AvatarFallback className="bg-slate-700 text-white text-xs">
                                            {getInitials(recruiter.name || recruiter.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {recruiter.name || 'Unnamed'}
                                        </p>
                                        <p className="text-xs text-slate-400">{recruiter.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemove(recruiter.id)}
                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Results */}
            {query.length >= 2 && (
                <div className="border border-slate-700 rounded-lg max-h-60 overflow-y-auto bg-slate-900">
                    {loading ? (
                        <p className="p-4 text-sm text-slate-400">Searching...</p>
                    ) : results.length === 0 ? (
                        <p className="p-4 text-sm text-slate-400">No recruiters found</p>
                    ) : (
                        results
                            .filter(r => !selectedRecruiters.some(s => s.id === r.id))
                            .map(recruiter => (
                                <button
                                    key={recruiter.id}
                                    onClick={() => {
                                        onSelect(recruiter);
                                        setQuery('');
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={recruiter.photoUrl} />
                                        <AvatarFallback className="bg-slate-700 text-white text-xs">
                                            {getInitials(recruiter.name || recruiter.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white">
                                            {recruiter.name || 'Unnamed'}
                                        </p>
                                        <p className="text-xs text-slate-400">{recruiter.email}</p>
                                    </div>
                                </button>
                            ))
                    )}
                </div>
            )}
        </div>
    );
}
