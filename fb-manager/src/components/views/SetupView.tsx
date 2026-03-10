'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function SetupView({ showNotification }: { showNotification: (msg: string, type?: 'success' | 'error') => void }) {
    const pageTypes = useAppStore((state) => state.pageTypes);
    const pages = useAppStore((state) => state.pages);
    const addPageType = useAppStore((state) => state.addPageType);
    const removePageType = useAppStore((state) => state.removePageType);
    const updatePageOrder = useAppStore((state) => state.updatePageOrder);

    const [newType, setNewType] = useState('');

    const sortedPages = [...pages].sort((a, b) => (a.order || 0) - (b.order || 0));

    const handleAddType = () => {
        if (!newType.trim()) return;
        if (pageTypes.includes(newType.trim())) {
            showNotification('มีประเภทนี้อยู่แล้ว', 'error');
            return;
        }
        addPageType(newType.trim());
        setNewType('');
        showNotification('เพิ่มประเภทเพจสำเร็จ');
    };

    const deleteType = (typeToRemove: string) => {
        removePageType(typeToRemove);
        showNotification('ลบประเภทเพจแล้ว');
    };

    const movePageOrder = (index: number, direction: 'up' | 'down') => {
        const newPages = [...sortedPages];
        if (direction === 'up' && index > 0) {
            const temp = newPages[index].order;
            newPages[index].order = newPages[index - 1].order;
            newPages[index - 1].order = temp;
        } else if (direction === 'down' && index < newPages.length - 1) {
            const temp = newPages[index].order;
            newPages[index].order = newPages[index + 1].order;
            newPages[index + 1].order = temp;
        }
        updatePageOrder(newPages);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">จัดการประเภทเพจ (Page Types)</h2>
                </div>
                <div className="p-5">
                    <div className="flex gap-2 mb-5">
                        <input
                            type="text"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            placeholder="เพิ่มประเภทใหม่..."
                            className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                        />
                        <button onClick={handleAddType} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
                            เพิ่ม
                        </button>
                    </div>
                    <ul className="space-y-2">
                        {pageTypes.map(type => (
                            <li key={type} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <span className="text-sm font-medium text-slate-700">{type}</span>
                                <button onClick={() => deleteType(type)} className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">จัดลำดับความสำคัญเพจ</h2>
                    <p className="text-xs text-slate-500 mt-1">ลูกศรเพื่อเรียงลำดับการแสดงผลในหน้าแรก (Dashboard)</p>
                </div>
                <div className="p-5">
                    {pages.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-4 border border-dashed border-slate-200 rounded-xl">ยังไม่มีข้อมูลเพจ</p>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {sortedPages.map((page, index) => (
                                <div key={page.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm hover:border-slate-300 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            onClick={() => movePageOrder(index, 'up')} disabled={index === 0}
                                            className={`p-1 rounded-md ${index === 0 ? 'text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => movePageOrder(index, 'down')} disabled={index === pages.length - 1}
                                            className={`p-1 rounded-md ${index === pages.length - 1 ? 'text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-800 truncate">{page.name}</div>
                                        <div className="text-xs text-slate-500">{page.type}</div>
                                    </div>
                                    <div className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-bold">
                                        #{index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
