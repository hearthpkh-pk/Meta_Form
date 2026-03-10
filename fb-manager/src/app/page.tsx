'use client';
import { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import DashboardView from '@/components/views/DashboardView';
import PagesView from '@/components/views/PagesView';
import AccountsView from '@/components/views/AccountsView';
import SetupView from '@/components/views/SetupView';
import { useAppStore } from '@/store/useAppStore';
import { LayoutDashboard, Flag, Users, Settings, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pages' | 'accounts' | 'setup'>('dashboard');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const pages = useAppStore((state) => state.pages);
  const accounts = useAppStore((state) => state.accounts);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const navTabs = (
    <div className="flex gap-2 sm:gap-3">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-[0_2px_10px_rgba(0,0,0,0.15)] scale-105 w-auto' : 'bg-transparent text-blue-100 hover:bg-white/15 hover:text-white hover:scale-110 w-10 sm:w-auto'
          }`}
        title="ภาพรวม"
      >
        <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-current'} />
        <span className={`${activeTab === 'dashboard' ? 'block' : 'hidden'} whitespace-nowrap overflow-hidden transition-all duration-300`}>ภาพรวม</span>
      </button>

      <button
        onClick={() => setActiveTab('pages')}
        className={`px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'pages' ? 'bg-white text-blue-600 shadow-[0_2px_10px_rgba(0,0,0,0.15)] scale-105 w-auto' : 'bg-transparent text-blue-100 hover:bg-white/15 hover:text-white hover:scale-110 w-10 sm:w-auto'
          }`}
        title="จัดการเพจ"
      >
        <Flag size={18} className={activeTab === 'pages' ? 'text-blue-600' : 'text-current'} />
        <span className={`${activeTab === 'pages' ? 'block' : 'hidden'} whitespace-nowrap overflow-hidden transition-all duration-300`}>จัดการเพจ</span>
      </button>

      <button
        onClick={() => setActiveTab('accounts')}
        className={`px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'accounts' ? 'bg-white text-blue-600 shadow-[0_2px_10px_rgba(0,0,0,0.15)] scale-105 w-auto' : 'bg-transparent text-blue-100 hover:bg-white/15 hover:text-white hover:scale-110 w-10 sm:w-auto'
          }`}
        title="จัดการบัญชีเฟซบุ๊ก"
      >
        <Users size={18} className={activeTab === 'accounts' ? 'text-blue-600' : 'text-current'} />
        <span className={`${activeTab === 'accounts' ? 'block' : 'hidden'} whitespace-nowrap overflow-hidden transition-all duration-300`}>จัดการบัญชี</span>
      </button>

      <button
        onClick={() => setActiveTab('setup')}
        className={`px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'setup' ? 'bg-white text-blue-600 shadow-[0_2px_10px_rgba(0,0,0,0.15)] scale-105 w-auto' : 'bg-transparent text-blue-100 hover:bg-white/15 hover:text-white hover:scale-110 w-10 sm:w-auto'
          }`}
        title="ตั้งค่า"
      >
        <Settings size={18} className={activeTab === 'setup' ? 'text-blue-600' : 'text-current'} />
        <span className={`${activeTab === 'setup' ? 'block' : 'hidden'} whitespace-nowrap overflow-hidden transition-all duration-300`}>ตั้งค่า</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-blue-500/50 mx-1 sm:mx-2 my-auto hidden sm:block"></div>

      {/* External Link Button */}
      <a
        href="https://hhoverview.netlify.app/#/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-white/10 text-white hover:bg-white/20 hover:scale-110 w-10 sm:w-auto"
        title="เปิด Meta Views"
      >
        <ExternalLink size={18} />
        <span className="hidden sm:inline whitespace-nowrap">Meta Views</span>
      </a>
    </div>
  );

  return (
    <>
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all animate-in slide-in-from-top-4 ${notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
          }`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      <MainLayout navTabs={navTabs}>
        {/* Space adjustment since heading is removed from here */}
        <div className="mb-6 flex justify-end">
          {/* Header Stats */}
          <div className="flex gap-4 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 w-fit h-fit">
            <div className="text-center px-3">
              <div className="text-2xl font-bold font-number text-blue-600 leading-none">{pages.length}</div>
              <div className="text-[10px] font-bold font-sans text-slate-500 uppercase tracking-wider mt-1.5">Pages</div>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="text-center px-3">
              <div className="text-2xl font-bold font-number text-indigo-600 leading-none">{accounts.length}</div>
              <div className="text-[10px] font-bold font-sans text-slate-500 uppercase tracking-wider mt-1.5">Accounts</div>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="mt-2">
          {activeTab === 'dashboard' && <DashboardView onGoToPages={() => setActiveTab('pages')} />}
          {activeTab === 'pages' && <PagesView showNotification={showNotification} />}
          {activeTab === 'accounts' && <AccountsView showNotification={showNotification} />}
          {activeTab === 'setup' && <SetupView showNotification={showNotification} />}
        </div>
      </MainLayout>
    </>
  );
}
