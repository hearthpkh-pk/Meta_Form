'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, Copy, Plus, Users, Eye, EyeOff, Link as LinkIcon, CheckCircle2, X, LayoutGrid, List } from 'lucide-react';
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

    const [importFormat, setImportFormat] = useState<'Standard' | 'FB_Pipe'>('Standard');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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

            if (importFormat === 'Standard') {
                const parts = trimmedLine.split(':');
                if (parts.length >= 5) {
                    const mail = parts[0]?.trim() || '';
                    const password = parts[1]?.trim() || '';
                    const passmail = parts[2]?.trim() || '';
                    const twoPin = parts[3]?.trim() || '';
                    const url = parts.slice(4).join(':').trim() || '';

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
            } else if (importFormat === 'FB_Pipe') {
                const parts = trimmedLine.split('|');
                if (parts.length >= 5) {
                    const uid = parts[0]?.trim() || '';
                    const password = parts[1]?.trim() || '';
                    // parts[2] is seemingly empty/unused in the example
                    const mail = parts[3]?.trim() || '';
                    const passmail = parts[4]?.trim() || '';

                    // The rest might be cookies or other data, we can store it in URL or leave it blank or extract 2FA if there is any.
                    // Assuming no explicit 2FA or URL in this format, leaving URL as facebook profile based on UID.
                    const url = uid ? `https://www.facebook.com/profile.php?id=${uid}` : '';

                    addAccount({
                        id: crypto.randomUUID(),
                        uid,
                        mail, password, passmail, twoPin: '', url,
                        pagesManaged: [],
                        status: 'Active',
                        showPassword: false
                    });
                    successCount++;
                } else {
                    errorCount++;
                }
            }
        });

        if (successCount > 0) {
            setRawInput('');
            showNotification(`เพิ่มสำเร็จ ${successCount} บัญชี${errorCount > 0 ? ` (ไม่สามารถแยกข้อมูลได้ ${errorCount} บรรทัด)` : ''}`);
        } else {
            showNotification('รูปแบบไม่ถูกต้อง โปรดตรวจสอบข้อมูลให้ตรงกับ Format ที่เลือก', 'error');
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

        updateAccount(editingAccount.id, { pagesManaged: newPages });
        setEditingAccount({ ...editingAccount, pagesManaged: newPages });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col gap-2">
                    <h2 className="text-lg font-semibold text-slate-800">เพิ่มบัญชี (Smart Import)</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-500 font-medium whitespace-nowrap">รูปแบบ:</span>
                        <div className="relative group/select inline-flex items-center">
                            <select
                                value={importFormat}
                                onChange={(e) => setImportFormat(e.target.value as 'Standard' | 'FB_Pipe')}
                                className="appearance-none bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-md px-2 py-1 outline-none cursor-pointer transition-colors pr-6 h-[22px]"
                            >
                                <option value="Standard">F1: Email : Password : Passmail : 2PIN : URL</option>
                                <option value="FB_Pipe">F2: UID | Pass | ? | Email | Passmail | Cookies</option>
                            </select>
                            <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px] flex-1 min-w-[300px] truncate max-w-full">
                            {importFormat === 'Standard' ? 'Email : Password : Passmail : 2PIN : URL' : 'UID | Pass | ? | Email | Passmail | Cookies'}
                        </code>
                    </div>
                </div>
                <div className="p-5 flex gap-4 items-stretch bg-slate-50/50">
                    <textarea
                        className="flex-1 min-h-[60px] h-[60px] w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        placeholder="วางข้อมูลทีละหลายบรรทัดที่นี่..."
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                    />
                    <button
                        onClick={handleImportAccounts}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 h-[60px] whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span>นำเข้าข้อมูล</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">บัญชีทั้งหมด ({accounts.length})</h2>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Table View"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[13px] uppercase tracking-wider">
                                    <th className="py-4 px-6 font-medium w-32">UID/ID</th>
                                    <th className="py-4 px-6 font-medium">อีเมล/รหัสผ่าน</th>
                                    <th className="py-4 px-6 font-medium">Passmail / 2FA</th>
                                    <th className="py-4 px-6 font-medium w-72">เพจที่ดูแล (เชื่อมโยง)</th>
                                    <th className="py-4 px-6 font-medium w-40">สถานะ</th>
                                    <th className="py-4 px-6 font-medium w-24 text-center">จัดการ</th>
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
                                        <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group align-top">
                                            <td className="py-4 px-6">
                                                <input
                                                    type="text"
                                                    value={acc.uid}
                                                    onChange={(e) => updateAccount(acc.id, { uid: e.target.value })}
                                                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-sm font-mono text-slate-700 transition-all placeholder:text-slate-300"
                                                    placeholder="กรอก UID 15 หลัก..."
                                                />
                                                {acc.url && (
                                                    <a href={acc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium px-2 mt-2 transition-colors">
                                                        <LinkIcon size={12} /> ข้อมูลโปรไฟล์
                                                    </a>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-10">Mail:</div>
                                                        <input
                                                            type="text"
                                                            value={acc.mail}
                                                            onChange={(e) => updateAccount(acc.id, { mail: e.target.value })}
                                                            className="flex-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-[13px] text-slate-700 transition-all placeholder:text-slate-300"
                                                            placeholder="อีเมล"
                                                        />
                                                        <button onClick={() => handleCopy(acc.mail, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1.5 rounded-md hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"><Copy size={13} /></button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-10">Pass:</div>
                                                        <input
                                                            type={acc.showPassword ? "text" : "password"}
                                                            value={acc.password}
                                                            onChange={(e) => updateAccount(acc.id, { password: e.target.value })}
                                                            className="flex-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-[13px] font-mono text-slate-700 transition-all placeholder:text-slate-300"
                                                            placeholder="รหัสผ่าน"
                                                        />
                                                        <button onClick={() => updateAccount(acc.id, { showPassword: !acc.showPassword })} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-all">
                                                            {acc.showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                                        </button>
                                                        <button onClick={() => handleCopy(acc.password || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1.5 rounded-md hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"><Copy size={13} /></button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-10">PMail:</div>
                                                        <input
                                                            type={acc.showPassword ? "text" : "password"}
                                                            value={acc.passmail}
                                                            onChange={(e) => updateAccount(acc.id, { passmail: e.target.value })}
                                                            className="flex-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-[13px] font-mono text-slate-700 transition-all placeholder:text-slate-300"
                                                            placeholder="รหัสผ่านสำรอง"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-10">2FA:</div>
                                                        <input
                                                            type="text"
                                                            value={acc.twoPin}
                                                            onChange={(e) => updateAccount(acc.id, { twoPin: e.target.value })}
                                                            className="flex-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-[13px] font-mono text-slate-700 transition-all placeholder:text-slate-300 tracking-[0.2em]"
                                                            placeholder="รหัสยืนยัน 2FA"
                                                        />
                                                        <button onClick={() => handleCopy(acc.twoPin || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1.5 rounded-md hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"><Copy size={13} /></button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {(acc.pagesManaged || []).map(pId => {
                                                        const p = pages.find(x => x.id === pId);
                                                        if (!p) return null;
                                                        return (
                                                            <span key={pId} className="inline-flex items-center gap-1 bg-indigo-50/80 text-indigo-700 border border-indigo-200/60 px-2.5 py-1 rounded-md text-[13px] font-medium shadow-sm">
                                                                {p.name}
                                                            </span>
                                                        );
                                                    })}
                                                    {(!acc.pagesManaged || acc.pagesManaged.length === 0) && (
                                                        <span className="text-[13px] text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 px-3 py-1 rounded-md">ยังไม่ได้เลือกเพจดูแล...</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => openPageSelector(acc)}
                                                    className="text-[13px] bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg transition-all border border-slate-200 shadow-sm flex items-center gap-2 hover:border-slate-300 hover:text-blue-600"
                                                >
                                                    <Plus size={14} className="text-blue-500" /> จัดการสิทธิ์เพจ
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <select
                                                    value={acc.status}
                                                    onChange={(e) => updateAccount(acc.id, { status: e.target.value as Status })}
                                                    className={`w-full appearance-none border rounded-lg px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-slate-800 outline-none transition-all cursor-pointer shadow-sm hover:shadow-md ${getStatusColor(acc.status)}`}
                                                >
                                                    <option value="Active">🟢 Active (ปกติ)</option>
                                                    <option value="Rest">🟡 Rest (พักบัญชี)</option>
                                                    <option value="Error">🔴 Error (บิน/แดง)</option>
                                                </select>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้ออกจากระบบ?')) {
                                                            removeAccount(acc.id);
                                                            showNotification('ลบข้อมูลบัญชีแล้ว');
                                                        }
                                                    }}
                                                    className="text-slate-400 hover:text-rose-600 p-2.5 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                                                    title="ลบบัญชี"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-50/50">
                        {accounts.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p>ยังไม่มีข้อมูลบัญชี</p>
                            </div>
                        ) : (
                            accounts.map((acc) => (
                                <div key={acc.id} className="bg-white border text-left border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group hover:border-blue-200 relative">
                                    <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4">
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={acc.uid}
                                                onChange={(e) => updateAccount(acc.id, { uid: e.target.value })}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-slate-50 rounded-lg px-2 py-1 -ml-2 outline-none text-[15px] font-bold font-mono text-slate-800 transition-all truncate placeholder:text-slate-300"
                                                placeholder="UID"
                                            />
                                            {acc.url && (
                                                <a href={acc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium px-0 mt-1 transition-colors">
                                                    <LinkIcon size={12} /> ข้อมูลโปรไฟล์
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <select
                                                value={acc.status}
                                                onChange={(e) => updateAccount(acc.id, { status: e.target.value as Status })}
                                                className={`appearance-none border rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide outline-none transition-all cursor-pointer shadow-sm hover:shadow ${getStatusColor(acc.status)}`}
                                            >
                                                <option value="Active">🟢 Active</option>
                                                <option value="Rest">🟡 Rest</option>
                                                <option value="Error">🔴 Error</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้ออกจากระบบ?')) {
                                                        removeAccount(acc.id);
                                                        showNotification('ลบข้อมูลบัญชีแล้ว');
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                title="ลบบัญชี"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest w-10 shrink-0">Mail</div>
                                            <input
                                                type="text"
                                                value={acc.mail}
                                                onChange={(e) => updateAccount(acc.id, { mail: e.target.value })}
                                                className="flex-1 bg-transparent outline-none text-[13px] text-slate-700 min-w-0 placeholder:text-slate-300"
                                                placeholder="Email Address"
                                            />
                                            <button onClick={() => handleCopy(acc.mail, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white transition-all"><Copy size={13} /></button>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest w-10 shrink-0">Pass</div>
                                            <input
                                                type={acc.showPassword ? "text" : "password"}
                                                value={acc.password}
                                                onChange={(e) => updateAccount(acc.id, { password: e.target.value })}
                                                className="flex-1 bg-transparent outline-none text-[13px] font-mono text-slate-700 min-w-0 placeholder:text-slate-300"
                                                placeholder="Password"
                                            />
                                            <button onClick={() => updateAccount(acc.id, { showPassword: !acc.showPassword })} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-all">
                                                {acc.showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                            <button onClick={() => handleCopy(acc.password || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white transition-all"><Copy size={13} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1.5 bg-slate-50/80 rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-colors">
                                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PMail</div>
                                                <input
                                                    type={acc.showPassword ? "text" : "password"}
                                                    value={acc.passmail}
                                                    onChange={(e) => updateAccount(acc.id, { passmail: e.target.value })}
                                                    className="w-full bg-transparent outline-none text-[13px] font-mono text-slate-700 placeholder:text-slate-300"
                                                    placeholder="Passmail"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5 bg-slate-50/80 rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-colors relative group/2fa">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">2FA</div>
                                                    <button onClick={() => handleCopy(acc.twoPin || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 absolute top-2 right-2 p-1 rounded hover:bg-white opacity-0 group-hover/2fa:opacity-100 transition-all"><Copy size={12} /></button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={acc.twoPin}
                                                    onChange={(e) => updateAccount(acc.id, { twoPin: e.target.value })}
                                                    className="w-full bg-transparent outline-none text-[13px] font-mono tracking-widest text-slate-700 truncate placeholder:text-slate-300"
                                                    placeholder="2FA Key"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="text-[12px] font-bold text-slate-800">เพจที่ดูแล <span className="text-slate-400 font-normal">({acc.pagesManaged?.length || 0})</span></div>
                                            <button
                                                onClick={() => openPageSelector(acc)}
                                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100/50"
                                            >
                                                <Plus size={12} /> จัดการสิทธิ์
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                                            {(acc.pagesManaged || []).slice(0, 3).map(pId => {
                                                const p = pages.find(x => x.id === pId);
                                                if (!p) return null;
                                                return (
                                                    <span key={pId} className="inline-flex items-center bg-indigo-50/80 text-indigo-700 border border-indigo-200/60 px-2 py-1 rounded-md text-[11px] font-medium truncate max-w-[120px] shadow-sm" title={p.name}>
                                                        {p.name}
                                                    </span>
                                                );
                                            })}
                                            {(acc.pagesManaged || []).length > 3 && (
                                                <span className="inline-flex items-center bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[11px] font-medium shadow-sm">
                                                    +{acc.pagesManaged!.length - 3}
                                                </span>
                                            )}
                                            {(!acc.pagesManaged || acc.pagesManaged.length === 0) && (
                                                <span className="text-[11px] text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 px-2 py-1 rounded-md w-full text-center">ยังไม่ได้ระบุเพจดูแล</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Account Pages Modal */}
            {
                isModalOpen && editingAccount && (
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
                )
            }

        </div >
    );
}
