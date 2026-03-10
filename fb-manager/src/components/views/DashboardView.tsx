'use client';
import { useAppStore } from '@/store/useAppStore';
import { LayoutDashboard, Plus, Link as LinkIcon, Users } from 'lucide-react';

export default function DashboardView({ onGoToPages }: { onGoToPages: () => void }) {
    const pages = useAppStore((state) => state.pages);
    const accounts = useAppStore((state) => state.accounts);
    const sortedPages = [...pages].sort((a, b) => (a.order || 0) - (b.order || 0));

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'Rest': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'Warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'Error':
            case 'Restricted': return 'bg-rose-100 text-rose-800 border-rose-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    if (pages.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center font-sans">
                <LayoutDashboard size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-heading font-semibold text-slate-800">ยังไม่มีข้อมูลเพจ</h3>
                <p className="text-slate-500 mt-1 mb-4 font-sans text-sm">เริ่มต้นการใช้งานโดยการเพิ่มเพจที่คุณดูแลเข้าสู่ระบบก่อน</p>
                <button
                    onClick={onGoToPages}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                    <Plus size={18} /> ไปที่หน้าจัดการเพจ
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in duration-300">
            {sortedPages.map((page) => {
                const admins = accounts.filter(acc => (acc.pagesManaged || []).includes(page.id));

                return (
                    <div key={page.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full font-sans">
                        <div className="flex justify-between items-start mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-heading font-bold text-slate-800 truncate" title={page.name}>
                                    {page.name}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold font-heading tracking-wide">
                                        {page.type}
                                    </span>
                                    {page.url && (
                                        <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700" title="เปิดเพจ">
                                            <LinkIcon size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold font-heading uppercase tracking-wider border flex-shrink-0 ${getStatusColor(page.status)}`}>
                                {page.status}
                            </span>
                        </div>

                        {page.comment && (
                            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-2.5 mb-4 border border-slate-100 italic">
                                "{page.comment}"
                            </div>
                        )}

                        <div className="flex-grow"></div>

                        <div className="pt-4 border-t border-slate-100 mt-4">
                            <h4 className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Users size={12} /> ผู้ดูแล (<span className="font-number text-[13px] text-slate-600">{admins.length}</span>)
                            </h4>

                            {admins.length === 0 ? (
                                <div className="text-sm text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded p-2 text-center">
                                    ยังไม่มีบัญชีที่ดูแลเพจนี้
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {admins.map(admin => (
                                        <div
                                            key={admin.id}
                                            className={`text-xs px-2 py-1 rounded border font-medium truncate max-w-full font-sans ${admin.status === 'Active' ? 'bg-white border-slate-200 text-slate-700' :
                                                admin.status === 'Error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                                    'bg-amber-50 border-amber-200 text-amber-700'
                                                }`}
                                            title={`ID: ${admin.uid || '-'} | สถานะ: ${admin.status}`}
                                        >
                                            {admin.mail ? admin.mail.split('@')[0] : (admin.uid ? <span className="font-number">{admin.uid}</span> : 'No Name')}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
