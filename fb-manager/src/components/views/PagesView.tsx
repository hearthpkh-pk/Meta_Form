'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, Copy, Plus, Flag } from 'lucide-react';
import { handleCopy, getStatusColor } from '@/lib/utils';
import { PageType, Status } from '@/types';

export default function PagesView({ showNotification }: { showNotification: (msg: string, type?: 'success' | 'error') => void }) {
    const pages = useAppStore((state) => state.pages);
    const pageTypes = useAppStore((state) => state.pageTypes);
    const addPage = useAppStore((state) => state.addPage);
    const updatePage = useAppStore((state) => state.updatePage);
    const removePage = useAppStore((state) => state.removePage);

    const [newPageName, setNewPageName] = useState('');
    const [newPageUrl, setNewPageUrl] = useState('');
    const [isFetchingName, setIsFetchingName] = useState(false);

    const sortedPages = [...pages].sort((a, b) => (a.order || 0) - (b.order || 0));

    const handleAddPage = () => {
        if (!newPageName.trim()) {
            showNotification('กรุณาใส่ชื่อเพจ', 'error');
            return;
        }

        addPage({
            id: crypto.randomUUID(),
            name: newPageName.trim(),
            type: pageTypes[0] || 'Profile Page',
            url: newPageUrl.trim(),
            status: 'Active',
            comment: '',
            order: pages.length + 1
        });

        setNewPageName('');
        setNewPageUrl('');
        showNotification('เพิ่มเพจสำเร็จ');
    };

    const handleUrlBlur = async () => {
        const url = newPageUrl.trim();
        if (!url || !url.startsWith('http')) return;

        // Only auto-fill if the name is currently empty
        if (newPageName.trim()) return;

        try {
            setIsFetchingName(true);
            const response = await fetch(`/api/fetch-fb-meta?url=${encodeURIComponent(url)}`);

            if (response.ok) {
                const data = await response.json();
                if (data.title) {
                    setNewPageName(data.title);
                    showNotification(`ดึงชื่อเพจอัตโนมัติ: ${data.title}`, 'success');
                }
            } else {
                console.warn('Could not fetch page title automatically.');
            }
        } catch (error) {
            console.warn('Network error or server failed to respond.');
            // Fail silently, let the user type manually.
        } finally {
            setIsFetchingName(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Plus size={18} /></div>
                    <h2 className="text-lg font-semibold text-slate-800">เพิ่มเพจใหม่เข้าระบบ</h2>
                </div>
                <div className="p-5 flex flex-col sm:flex-row gap-4 items-end bg-slate-50/50">
                    <div className="w-full sm:flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">ลิงก์เพจ (URL)</label>
                        <input
                            type="text"
                            value={newPageUrl}
                            onChange={(e) => setNewPageUrl(e.target.value)}
                            onBlur={handleUrlBlur}
                            placeholder="https://facebook.com/..."
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อเพจ (Name Page) <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            value={newPageName}
                            onChange={(e) => setNewPageName(e.target.value)}
                            placeholder={isFetchingName ? "กำลังดึงข้อมูล..." : "เช่น ร้านเสื้อผ้าแฟชั่น..."}
                            disabled={isFetchingName}
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                        />
                    </div>
                    <button
                        onClick={handleAddPage}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-sm hover:shadow w-full sm:w-auto flex items-center justify-center gap-2 h-[42px]"
                    >
                        บันทึกเพจ
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">คลังเพจทั้งหมด ({pages.length})</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                <th className="py-4 px-5 font-semibold w-1/5">ชื่อเพจ</th>
                                <th className="py-4 px-5 font-semibold w-32">ประเภท</th>
                                <th className="py-4 px-5 font-semibold w-1/3">URL</th>
                                <th className="py-4 px-5 font-semibold w-32">สถานะ</th>
                                <th className="py-4 px-5 font-semibold w-48">หมายเหตุ</th>
                                <th className="py-4 px-5 font-semibold w-24 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <Flag size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>ยังไม่มีข้อมูลเพจ</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedPages.map((page) => (
                                    <tr key={page.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-2 px-5">
                                            <input
                                                type="text"
                                                value={page.name}
                                                onChange={(e) => updatePage(page.id, { name: e.target.value })}
                                                className="w-full bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-sm font-medium text-slate-800 transition-all"
                                            />
                                        </td>
                                        <td className="py-2 px-5">
                                            <select
                                                value={page.type}
                                                onChange={(e) => updatePage(page.id, { type: e.target.value as PageType })}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white cursor-pointer transition-all"
                                            >
                                                {pageTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-2 px-5">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={page.url}
                                                    onChange={(e) => updatePage(page.id, { url: e.target.value })}
                                                    className="w-full bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-sm text-slate-800 transition-all truncate"
                                                />
                                                <button onClick={() => handleCopy(page.url, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-slate-100 rounded">
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-2 px-5">
                                            <select
                                                value={page.status}
                                                onChange={(e) => updatePage(page.id, { status: e.target.value as Status })}
                                                className={`w-full appearance-none border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 outline-none transition-colors cursor-pointer ${getStatusColor(page.status)}`}
                                            >
                                                <option value="Active">🟢 Active</option>
                                                <option value="Warning">🟡 Warning</option>
                                                <option value="Restricted">🔴 Restricted</option>
                                                <option value="Rest">⚪ Rest/Unpub</option>
                                            </select>
                                        </td>
                                        <td className="py-2 px-5">
                                            <input
                                                type="text"
                                                value={page.comment}
                                                onChange={(e) => updatePage(page.id, { comment: e.target.value })}
                                                placeholder="เพิ่มหมายเหตุ..."
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded-lg px-2 py-1.5 outline-none text-sm text-slate-800 transition-all placeholder:text-slate-300"
                                            />
                                        </td>
                                        <td className="py-2 px-5 text-center">
                                            <button
                                                onClick={() => {
                                                    removePage(page.id);
                                                    showNotification('ลบข้อมูลเพจแล้ว');
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="ลบเพจ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
