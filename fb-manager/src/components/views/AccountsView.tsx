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

    const [importFormat, setImportFormat] = useState<'Standard' | 'Alt_Standard' | 'FB_Pipe'>('Standard');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const FORMAT_OPTIONS = [
        { key: 'Standard' as const, label: 'F1', hint: 'Email : Password : Passmail : 2FA : URL' },
        { key: 'Alt_Standard' as const, label: 'F2', hint: 'Email : Password : 2FA : Passmail : URL' },
        { key: 'FB_Pipe' as const, label: 'F3', hint: 'UID | Pass | ? | Email | Passmail | Cookies' },
    ];

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
                // Format: Email:Password:Passmail:2FA:URL
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
            } else if (importFormat === 'Alt_Standard') {
                // Format: Email:Password:2FA:Passmail:URL
                // สลับตำแหน่ง 2FA กับ Passmail
                const parts = trimmedLine.split(':');
                if (parts.length >= 5) {
                    const mail = parts[0]?.trim() || '';
                    const password = parts[1]?.trim() || '';
                    const twoPin = parts[2]?.trim() || '';
                    const passmail = parts[3]?.trim() || '';
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
                    const mail = parts[3]?.trim() || '';
                    const passmail = parts[4]?.trim() || '';
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
                        <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
                            {FORMAT_OPTIONS.map(fmt => (
                                <button
                                    key={fmt.key}
                                    onClick={() => setImportFormat(fmt.key)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${importFormat === fmt.key ? 'bg-white text-blue-600 shadow-sm border border-blue-200' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
                                    title={fmt.hint}
                                >
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                        <code className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200 text-[11px] flex-1 min-w-[250px] truncate max-w-full font-mono">
                            {FORMAT_OPTIONS.find(f => f.key === importFormat)?.hint}
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
                    <div className="divide-y divide-slate-100">
                        {accounts.length === 0 ? (
                            <div className="py-16 text-center text-slate-400">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p>ยังไม่มีข้อมูลบัญชี</p>
                            </div>
                        ) : (
                            accounts.map((acc) => (
                                <div key={acc.id} className="p-5 hover:bg-slate-50/30 transition-colors group">
                                    {/* Row 1: Note + UID + Status + Actions */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={acc.note || ''}
                                                onChange={(e) => updateAccount(acc.id, { note: e.target.value })}
                                                className="bg-amber-50/60 border border-amber-200/60 hover:border-amber-300 focus:border-amber-400 focus:bg-amber-50 rounded-lg px-3 py-1.5 outline-none text-sm font-semibold text-amber-800 transition-all placeholder:text-amber-300/80 w-44 shrink-0"
                                                placeholder="ชื่อ / แท็ก"
                                            />
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">ID</span>
                                                <input
                                                    type="text"
                                                    value={acc.uid}
                                                    onChange={(e) => updateAccount(acc.id, { uid: e.target.value })}
                                                    className="bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-sm font-mono text-slate-600 transition-all placeholder:text-slate-300 w-36"
                                                    placeholder="UID"
                                                />
                                                {acc.url && (
                                                    <a href={acc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 shrink-0 transition-colors" title="ดูโปรไฟล์">
                                                        <LinkIcon size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <select
                                                value={acc.status}
                                                onChange={(e) => updateAccount(acc.id, { status: e.target.value as Status })}
                                                className={`appearance-none border rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider outline-none transition-all cursor-pointer ${getStatusColor(acc.status)}`}
                                            >
                                                <option value="Active">🟢 Active</option>
                                                <option value="Rest">🟡 Rest</option>
                                                <option value="Error">🔴 Error</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?')) {
                                                        removeAccount(acc.id);
                                                        showNotification('ลบข้อมูลบัญชีแล้ว');
                                                    }
                                                }}
                                                className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="ลบบัญชี"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Row 2: Credentials — 4 neat columns */}
                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</div>
                                            <div className="flex items-center gap-1">
                                                <input type="text" value={acc.mail} onChange={(e) => updateAccount(acc.id, { mail: e.target.value })} className="flex-1 bg-transparent outline-none text-[13px] text-slate-700 min-w-0 placeholder:text-slate-300 truncate" placeholder="อีเมล" />
                                                <button onClick={() => handleCopy(acc.mail, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"><Copy size={12} /></button>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</div>
                                            <div className="flex items-center gap-1">
                                                <input type={acc.showPassword ? "text" : "password"} value={acc.password} onChange={(e) => updateAccount(acc.id, { password: e.target.value })} className="flex-1 bg-transparent outline-none text-[13px] font-mono text-slate-700 min-w-0 placeholder:text-slate-300" placeholder="รหัสผ่าน" />
                                                <button onClick={() => updateAccount(acc.id, { showPassword: !acc.showPassword })} className="text-slate-400 hover:text-slate-600 p-1 rounded transition-all shrink-0">{acc.showPassword ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                                                <button onClick={() => handleCopy(acc.password || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"><Copy size={12} /></button>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passmail</div>
                                            <input type={acc.showPassword ? "text" : "password"} value={acc.passmail} onChange={(e) => updateAccount(acc.id, { passmail: e.target.value })} className="w-full bg-transparent outline-none text-[13px] font-mono text-slate-700 placeholder:text-slate-300" placeholder="รหัสผ่านเมล" />
                                        </div>
                                        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">2FA Key</div>
                                            <div className="flex items-center gap-1">
                                                <input type="text" value={acc.twoPin} onChange={(e) => updateAccount(acc.id, { twoPin: e.target.value })} className="flex-1 bg-transparent outline-none text-[13px] font-mono tracking-wide text-slate-700 min-w-0 placeholder:text-slate-300 truncate" placeholder="2FA" />
                                                <button onClick={() => handleCopy(acc.twoPin || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-300 hover:text-blue-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"><Copy size={12} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Pages + Comment */}
                                    <div className="flex items-start gap-4">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">เพจ</span>
                                            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                                                {(acc.pagesManaged || []).map(pId => {
                                                    const p = pages.find(x => x.id === pId);
                                                    if (!p) return null;
                                                    return (
                                                        <span key={pId} className="inline-flex items-center bg-indigo-50/80 text-indigo-700 border border-indigo-200/50 px-2 py-0.5 rounded text-[11px] font-medium truncate max-w-[120px]" title={p.name}>
                                                            {p.name}
                                                        </span>
                                                    );
                                                })}
                                                {(!acc.pagesManaged || acc.pagesManaged.length === 0) && (
                                                    <span className="text-[11px] text-slate-300 italic">—</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => openPageSelector(acc)}
                                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors shrink-0"
                                            >
                                                <Plus size={12} /> จัดการ
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 w-72 shrink-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Memo</span>
                                            <input
                                                type="text"
                                                value={acc.comment || ''}
                                                onChange={(e) => updateAccount(acc.id, { comment: e.target.value })}
                                                className="flex-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1 outline-none text-[13px] text-slate-500 transition-all placeholder:text-slate-300"
                                                placeholder="คอมเมนต์..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50">
                        {accounts.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p>ยังไม่มีข้อมูลบัญชี</p>
                            </div>
                        ) : (
                            accounts.map((acc) => (
                                <div key={acc.id} className="bg-white border text-left border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group hover:border-blue-200 relative">
                                    <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-3">
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={acc.note || ''}
                                                onChange={(e) => updateAccount(acc.id, { note: e.target.value })}
                                                className="w-full bg-transparent border border-transparent hover:border-amber-200 focus:border-amber-300 focus:bg-amber-50/30 rounded-lg px-1.5 py-0.5 -ml-1.5 outline-none text-[13px] font-semibold text-amber-800 transition-all truncate placeholder:text-amber-300/70"
                                                placeholder="ชื่อ / แท็ก"
                                            />
                                            <div className="flex items-center gap-1.5 mt-0.5 px-0">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ID</span>
                                                <input
                                                    type="text"
                                                    value={acc.uid}
                                                    onChange={(e) => updateAccount(acc.id, { uid: e.target.value })}
                                                    className="bg-transparent outline-none text-[11px] font-mono text-slate-500 w-full placeholder:text-slate-300"
                                                    placeholder="UID"
                                                />
                                                {acc.url && (
                                                    <a href={acc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 shrink-0 transition-colors" title="โปรไฟล์">
                                                        <LinkIcon size={11} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <select
                                                value={acc.status}
                                                onChange={(e) => updateAccount(acc.id, { status: e.target.value as Status })}
                                                className={`appearance-none border rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide outline-none transition-all cursor-pointer shadow-sm hover:shadow ${getStatusColor(acc.status)}`}
                                            >
                                                <option value="Active">🟢 Active</option>
                                                <option value="Rest">🟡 Rest</option>
                                                <option value="Error">🔴 Error</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?')) {
                                                        removeAccount(acc.id);
                                                        showNotification('ลบข้อมูลบัญชีแล้ว');
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                                                title="ลบบัญชี"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 bg-slate-50/80 rounded-lg p-2 border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-8 shrink-0">Mail</div>
                                            <input
                                                type="text"
                                                value={acc.mail}
                                                onChange={(e) => updateAccount(acc.id, { mail: e.target.value })}
                                                className="flex-1 bg-transparent outline-none text-xs text-slate-700 min-w-0 placeholder:text-slate-300"
                                                placeholder="Email"
                                            />
                                            <button onClick={() => handleCopy(acc.mail, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-white transition-all"><Copy size={12} /></button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50/80 rounded-lg p-2 border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-8 shrink-0">Pass</div>
                                            <input
                                                type={acc.showPassword ? "text" : "password"}
                                                value={acc.password}
                                                onChange={(e) => updateAccount(acc.id, { password: e.target.value })}
                                                className="flex-1 bg-transparent outline-none text-xs font-mono text-slate-700 min-w-0 placeholder:text-slate-300"
                                                placeholder="Pass"
                                            />
                                            <button onClick={() => updateAccount(acc.id, { showPassword: !acc.showPassword })} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-white transition-all">
                                                {acc.showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                            </button>
                                            <button onClick={() => handleCopy(acc.password || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-white transition-all"><Copy size={12} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col gap-1 bg-slate-50/80 rounded-lg p-2 border border-slate-100 hover:border-slate-200 transition-colors">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PMail</div>
                                                <input
                                                    type={acc.showPassword ? "text" : "password"}
                                                    value={acc.passmail}
                                                    onChange={(e) => updateAccount(acc.id, { passmail: e.target.value })}
                                                    className="w-full bg-transparent outline-none text-xs font-mono text-slate-700 placeholder:text-slate-300"
                                                    placeholder="PMail"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 bg-slate-50/80 rounded-lg p-2 border border-slate-100 hover:border-slate-200 transition-colors relative group/2fa">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2FA</div>
                                                    <button onClick={() => handleCopy(acc.twoPin || '', () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 absolute top-2 right-2 p-1 rounded hover:bg-white opacity-0 group-hover/2fa:opacity-100 transition-all"><Copy size={12} /></button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={acc.twoPin}
                                                    onChange={(e) => updateAccount(acc.id, { twoPin: e.target.value })}
                                                    className="w-full bg-transparent outline-none text-xs font-mono tracking-wider text-slate-700 truncate placeholder:text-slate-300"
                                                    placeholder="2FA"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="text-[11px] font-bold text-slate-800">เพจที่ดูแล <span className="text-slate-400 font-normal">({acc.pagesManaged?.length || 0})</span></div>
                                            <button
                                                onClick={() => openPageSelector(acc)}
                                                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 bg-blue-50/50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors border border-blue-100/50"
                                            >
                                                <Plus size={10} /> จัดการ
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1 min-h-[24px]">
                                            {(acc.pagesManaged || []).slice(0, 3).map(pId => {
                                                const p = pages.find(x => x.id === pId);
                                                if (!p) return null;
                                                return (
                                                    <span key={pId} className="inline-flex items-center bg-indigo-50/80 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded text-[10px] font-medium truncate max-w-[100px]" title={p.name}>
                                                        {p.name}
                                                    </span>
                                                );
                                            })}
                                            {(acc.pagesManaged || []).length > 3 && (
                                                <span className="inline-flex items-center bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                    +{acc.pagesManaged!.length - 3}
                                                </span>
                                            )}
                                            {(!acc.pagesManaged || acc.pagesManaged.length === 0) && (
                                                <span className="text-[10px] text-slate-400 italic">ยังไม่ได้ระบุเพจ</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
                }
            </div >

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
