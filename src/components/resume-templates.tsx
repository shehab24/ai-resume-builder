import React from 'react';

interface ResumeTemplateProps {
    data: {
        personalInfo?: {
            fullName?: string;
            email?: string;
            phone?: string;
            location?: string;
        };
        summary?: string;
        skills?: string[];
        experience?: Array<{
            position: string;
            company: string;
            startDate: string;
            endDate: string;
            description: string;
        }>;
        education?: Array<{
            degree: string;
            school: string;
            startDate: string;
            endDate: string;
        }>;
    };
    template: 'professional' | 'modern' | 'classic';
}

export function ResumeTemplate({ data, template }: ResumeTemplateProps) {
    console.log(data);
    if (template === 'professional') {
        return <ProfessionalTemplate data={data} />;
    } else if (template === 'modern') {
        return <ModernTemplate data={data} />;
    } else {
        return <ClassicTemplate data={data} />;
    }
}

// Professional Template
function ProfessionalTemplate({ data }: { data: ResumeTemplateProps['data'] }) {
    return (
        <div className="bg-white p-8 shadow-lg rounded-lg max-w-4xl mx-auto" style={{ minHeight: '842px' }}>
            {/* Header */}
            <div className="border-b-4 border-black pb-4 mb-6">
                <h1 className="text-4xl font-bold text-black mb-2">
                    {data.personalInfo?.fullName || 'Your Name'}
                </h1>
                <div className="text-sm text-gray-700 space-y-1">
                    {data.personalInfo?.email && <p>{data.personalInfo.email}</p>}
                    {data.personalInfo?.phone && <p>{data.personalInfo.phone}</p>}
                    {data.personalInfo?.location && <p>{data.personalInfo.location}</p>}
                </div>
            </div>

            {/* Summary */}
            {data.summary && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-black mb-2 uppercase">Professional Summary</h2>
                    <p className="text-gray-800 text-sm leading-relaxed">{data.summary}</p>
                </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-black mb-2 uppercase">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-black mb-3 uppercase">Experience</h2>
                    <div className="space-y-4">
                        {data.experience.map((exp, i) => (
                            <div key={i}>
                                <h3 className="text-lg font-semibold text-black">{exp.position}</h3>
                                <p className="text-sm text-gray-700 font-medium">{exp.company}</p>
                                <p className="text-xs text-gray-600 mb-2">{exp.startDate} - {exp.endDate}</p>
                                <p className="text-sm text-gray-800 leading-relaxed">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-black mb-3 uppercase">Education</h2>
                    <div className="space-y-3">
                        {data.education.map((edu, i) => {
                            let dateRange = '';
                            if (edu.startDate && edu.endDate) {
                                const endDateStr = edu.endDate.toLowerCase() === 'present'
                                    ? 'Present'
                                    : new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                dateRange = `${new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDateStr}`;
                            } else if (edu.startDate) {
                                dateRange = `${new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - Present`;
                            } else {
                                dateRange = edu.endDate || '';
                            }
                            return (
                                <div key={i}>
                                    <h3 className="text-lg font-semibold text-black">{edu.degree}</h3>
                                    <p className="text-sm text-gray-700">{edu.school}</p>
                                    <p className="text-xs text-gray-600">{dateRange}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Modern Template
function ModernTemplate({ data }: { data: ResumeTemplateProps['data'] }) {
    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 shadow-lg rounded-lg max-w-4xl mx-auto" style={{ minHeight: '842px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
                <h1 className="text-4xl font-bold mb-2">
                    {data.personalInfo?.fullName || 'Your Name'}
                </h1>
                <div className="text-sm space-y-1 opacity-90">
                    {data.personalInfo?.email && <p>{data.personalInfo.email}</p>}
                    {data.personalInfo?.phone && <p>{data.personalInfo.phone}</p>}
                    {data.personalInfo?.location && <p>{data.personalInfo.location}</p>}
                </div>
            </div>

            {/* Summary */}
            {data.summary && (
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="h-1 w-12 bg-blue-600 rounded"></span>
                        About Me
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed">{data.summary}</p>
                </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="h-1 w-12 bg-purple-600 rounded"></span>
                        Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill, i) => (
                            <span key={i} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-full font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="h-1 w-12 bg-blue-600 rounded"></span>
                        Experience
                    </h2>
                    <div className="space-y-4">
                        {data.experience.map((exp, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800">{exp.position}</h3>
                                <p className="text-sm text-blue-600 font-semibold">{exp.company}</p>
                                <p className="text-xs text-gray-500 mb-2">{exp.startDate} - {exp.endDate}</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="h-1 w-12 bg-purple-600 rounded"></span>
                        Education
                    </h2>
                    <div className="space-y-3">
                        {data.education.map((edu, i) => {
                            let dateRange = '';
                            if (edu.startDate && edu.endDate) {
                                const endDateStr = edu.endDate.toLowerCase() === 'present'
                                    ? 'Present'
                                    : new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                dateRange = `${new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDateStr}`;
                            } else if (edu.startDate) {
                                dateRange = `${new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - Present`;
                            } else {
                                dateRange = edu.endDate || '';
                            }
                            return (
                                <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800">{edu.degree}</h3>
                                    <p className="text-sm text-purple-600 font-semibold">{edu.school}</p>
                                    <p className="text-xs text-gray-500">{dateRange}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Classic Template
function ClassicTemplate({ data }: { data: ResumeTemplateProps['data'] }) {
    return (
        <div className="bg-white p-8 shadow-lg rounded-lg max-w-4xl mx-auto border-2 border-gray-300" style={{ minHeight: '842px' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-400 pb-4 mb-6">
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                    {data.personalInfo?.fullName || 'Your Name'}
                </h1>
                <div className="text-sm text-gray-600 space-x-3">
                    {data.personalInfo?.email && <span>{data.personalInfo.email}</span>}
                    {data.personalInfo?.phone && <span>• {data.personalInfo.phone}</span>}
                    {data.personalInfo?.location && <span>• {data.personalInfo.location}</span>}
                </div>
            </div>

            {/* Summary */}
            {data.summary && (
                <div className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                        PROFESSIONAL SUMMARY
                    </h2>
                    <p className="text-gray-800 text-sm leading-relaxed">{data.summary}</p>
                </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                        SKILLS
                    </h2>
                    <p className="text-gray-800 text-sm">
                        {data.skills.join(' • ')}
                    </p>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                        PROFESSIONAL EXPERIENCE
                    </h2>
                    <div className="space-y-4">
                        {data.experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-base font-semibold text-gray-900">{exp.position}</h3>
                                    <span className="text-xs text-gray-600">{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <p className="text-sm text-gray-700 italic mb-1">{exp.company}</p>
                                <p className="text-sm text-gray-800 leading-relaxed">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-serif font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                        EDUCATION
                    </h2>
                    <div className="space-y-3">
                        {data.education.map((edu, i) => {
                            let dateRange = '';
                            if (edu.startDate && edu.endDate) {
                                const endDateStr = edu.endDate.toLowerCase() === 'present'
                                    ? 'Present'
                                    : new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                dateRange = `${new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDateStr}`;
                            } else if (edu.startDate) {
                                dateRange = `${new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - Present`;
                            } else {
                                dateRange = edu.endDate || '';
                            }
                            return (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-base font-semibold text-gray-900">{edu.degree}</h3>
                                        <span className="text-xs text-gray-600">{dateRange}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 italic">{edu.school}</p>
                                </div>
                            );
                        })})
                    </div>
                </div>
            )}
        </div>
    );
}
