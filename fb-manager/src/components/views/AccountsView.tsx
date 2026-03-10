'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, Copy, Plus, Users, Eye, EyeOff, Link as LinkIcon, CheckCircle2, X } from 'lucide-react';
import { handleCopy, getStatusColor } from '@/lib/utils';
import { Account, Status } from '@/types';

export default function AccountsView({ showNotification }: { showNotification: (msg: string, type?: 'success' | 'error') => void }) {
    const accounts = useAppStore((state) => state.accounts);
    const pages = useAppStore((state) => state.pages);
    const addAccount = useAppStore((state) => state.addAccount);
    const updateAccount = useAppStore((state) => state.updateAccount);
    const removeAccount = useAppStore((state) => state.removeAccount);

    const [rawInput, setRawInput] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const sortedPages = [...pages].sort((a, b) => (a.order || 0) - (b.order || 0));

    const handleImportAccounts = () => {
        if (!rawInput.trim()) {
            showNotification('กรุณาใส่ข้อมูลบัญชี', 'error');
            return;
        }

        const lines = rawInput.split('\n');
        let successCount = 0;
        let errorCount = 0;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const parts = trimmedLine.split(':');
            if (parts.length >= 5) {
                const mail = parts[0]?.trim() || '';
                const password = parts[1]?.trim() || '';
                const passmail = parts[2]?.trim() || '';
                const twoPin = parts[3]?.trim() || '';
                const url = parts.slice(4).join(':').trim() || '';

                // Fixed URL Parsing Logic
                const cleanUrl = url.replace(/\/+$/, '');
                let id = '';
                if (cleanUrl.includes('id=')) {
                    const match = cleanUrl.match(/[?&]id=([^&]+)/);
                    if (match) id = match[1];
                } else if (cleanUrl) {
                    const urlParts = cleanUrl.split('/');
                    id = urlParts[urlParts.length - 1].split('?')[0];
                }

                addAccount({
                    id: crypto.randomUUID(),
                    uid: id,
                    mail, password, passmail, twoPin, url,
                    pagesManaged: [],
                    status: 'Active',
                    showPassword: false
                });
                successCount++;
            } else {
                errorCount++;
            }
        });

        if (successCount > 0) {
            setRawInput('');
            showNotification(`เพิ่มสำเร็จ ${successCount} บัญชี${errorCount > 0 ? ` (ไม่สามารถแยกข้อมูลได้ ${errorCount} บรรทัด)` : ''}`);
        } else {
            showNotification('รูปแบบไม่ถูกต้อง โปรดตรวจสอบข้อมูล', 'error');
        }
    };

    const openPageSelector = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const togglePageForAccount = (pageId: string) => {
        if (!editingAccount) return;

        const currentPages = editingAccount.pagesManaged || [];
        const newPages = currentPages.includes(pageId)
            ? currentPages.filter(id => id !== pageId)
            : [...currentPages, pageId];

        // Update store
        updateAccount(editingAccount.id, { pagesManaged: newPages });
        // Update local modal state
        setEditingAccount({ ...editingAccount, pagesManaged: newPages });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">เพิ่มบัญชี (Smart Import)</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        รูปแบบ: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-xs">Email : Password : Passmail : 2PIN : URL</code>
                    </p>
                </div>
                <div className="p-5 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
                    <textarea
                        className="flex-1 min-h-[100px] w-full border border-slate-300 rounded-xl p-4 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                        placeholder="วางข้อมูลทีละหลายบรรทัดที่นี่..."
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                    />
                    <button
                        onClick={handleImportAccounts}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-xl transition-all shadow-sm hover:shadow h-[100px] sm:w-[160px] flex flex-col items-center justify-center gap-2"
                    >
                        <Plus size={24} />
                        <span>นำเข้าข้อมูล</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">บัญชีทั้งหมด ({accounts.length})</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                <th className="py-4 px-5 font-semibold w-24">UID/ID</th>
                                <th className="py-4 px-5 font-semibold">อีเมล/รหัสผ่าน</th>
                                <th className="py-4 px-5 font-semibold">Passmail / 2FA</th>
                                <th className="py-4 px-5 font-semibold w-64">เพจที่ดูแล (เชื่อมโยง)</th>
                                <th className="py-4 px-5 font-semibold w-36">สถานะ</th>
                                <th className="py-4 px-5 font-semibold w-20 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>ยังไม่มีข้อมูลบัญชี</p>
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-slate-50 transition-colors group align-top">
                                        <td className="py-3 px-5">
                                            <input
                                                type="text"
                                                value={acc.uid}
                                                onChange={(e) => updateAccount(acc.id, { uid: e.target.value })}
                                                className="w-full bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-2 py-1 outline-none text-xs font-mono text-slate-800 transition-all"
                                                placeholder="UID"
                                            />
                                            {acc.url && (
                                                <a href={acc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 px-2 mt-1">
                                                    <LinkIcon size={10} /> Profile
                                                </a>
                                            )}
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="text-[10px] font-semibold text-slate-400 w-8">Mail:</div>
                                                    <input
                                                        type="text"
                                                        value={acc.mail}
                                                        onChange={(e) => updateAccount(acc.id, { mail: e.target.value })}
                                                        className="flex-1 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-2 py-0.5 outline-none text-sm text-slate-800 transition-all"
                                                    />
                                                    <button onClick={() => handleCopy(acc.mail, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12} /></button>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="text-[10px] font-semibold text-slate-400 w-8">Pass:</div>
                                                    <input
                                                        type={acc.showPassword ? "text" : "password"}
                                                        value={acc.password}
                                                        onChange={(e) => updateAccount(acc.id, { password: e.target.value })}
                                                        className="flex-1 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-2 py-0.5 outline-none text-sm text-slate-800 transition-all"
                                                    />
                                                    <button onClick={() => updateAccount(acc.id, { showPassword: !acc.showPassword })} className="text-slate-400 hover:text-slate-600 p-1">
                                                        {acc.showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                                    </button>
                                                    <button onClick={() => handleCopy(acc.password || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12} /></button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="text-[10px] font-semibold text-slate-400 w-12">PMail:</div>
                                                    <input
                                                        type={acc.showPassword ? "text" : "password"}
                                                        value={acc.passmail}
                                                        onChange={(e) => updateAccount(acc.id, { passmail: e.target.value })}
                                                        className="flex-1 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-2 py-0.5 outline-none text-sm text-slate-800 transition-all"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="text-[10px] font-semibold text-slate-400 w-12">2FA:</div>
                                                    <input
                                                        type="text"
                                                        value={acc.twoPin}
                                                        onChange={(e) => updateAccount(acc.id, { twoPin: e.target.value })}
                                                        className="flex-1 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-2 py-0.5 outline-none text-xs font-mono text-slate-800 transition-all truncate"
                                                    />
                                                    <button onClick={() => handleCopy(acc.twoPin || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12} /></button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {(acc.pagesManaged || []).map(pId => {
                                                    const p = pages.find(x => x.id === pId);
                                                    if (!p) return null;
                                                    return (
                                                        <span key={pId} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-md text-xs font-medium">
                                                            {p.name}
                                                        </span>
                                                    );
                                                })}
                                                {(!acc.pagesManaged || acc.pagesManaged.length === 0) && (
                                                    <span className="text-xs text-slate-400 italic">ไม่ได้เลือกเพจ</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => openPageSelector(acc)}
                                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center gap-1"
                                            >
                                                <Plus size={12} /> เลือกเพจที่ดูแล
                                            </button>
                                        </td>
                                        <td className="py-3 px-5">
                                            <select
                                                value={acc.status}
                                                onChange={(e) => updateAccount(acc.id, { status: e.target.value as Status })}
                                                className={`w-full appearance-none border rounded-lg px-3 py-1.5 text-xs font-bold uppercase text-slate-800 outline-none transition-colors cursor-pointer ${getStatusColor(acc.status)}`}
                                            >
                                                <option value="Active">🟢 Active</option>
                                                <option value="Rest">🟡 Rest</option>
                                                <option value="Error">🔴 Error/บิน</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <button
                                                onClick={() => {
                                                    removeAccount(acc.id);
                                                    showNotification('ลบข้อมูลบัญชีแล้ว');
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"
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

            {/* Account Pages Modal */}
            {isModalOpen && editingAccount && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">เลือกเพจที่ดูแล</h3>
                                <p className="text-xs text-slate-500 mt-1">บัญชี: {editingAccount.mail || editingAccount.uid || 'ไม่ระบุชื่อ'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1">
                            {pages.length === 0 ? (
                                <div className="text-center text-sm text-slate-400 py-8">
                                    ยังไม่มีเพจในระบบ กรุณาไปเพิ่มเพจก่อน
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sortedPages.map(page => {
                                        const isChecked = (editingAccount.pagesManaged || []).includes(page.id);
                                        return (
                                            <label
                                                key={page.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden" // hide default checkbox
                                                    checked={isChecked}
                                                    onChange={() => togglePageForAccount(page.id)}
                                                />
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                                                    }`}>
                                                    {isChecked && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-semibold truncate ${isChecked ? 'text-blue-900' : 'text-slate-700'}`}>
                                                        {page.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                        {page.type} <span className="w-1 h-1 rounded-full bg-slate-300"></span> <span className={getStatusColor(page.status).split(' ')[1]}>{page.status}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
