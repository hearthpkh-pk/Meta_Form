'use client';
import { ReactNode } from 'react';
import { UserCircle2 } from 'lucide-react';

interface MainLayoutProps {
    children: ReactNode;
    navTabs?: ReactNode;
}

export default function MainLayout({ children, navTabs }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* Top Navigation Bar (Meta Views Style) */}
            <header className="bg-blue-600 text-white sticky top-0 z-50 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 h-auto sm:h-14 gap-2 sm:gap-0 py-2 sm:py-0">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Official Solid Facebook Logo */}
                        <svg viewBox="0 0 24 24" className="w-[30px] h-[30px] fill-white" aria-label="Facebook Logo">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        <span className="font-heading font-bold text-[20px] tracking-wide lg:text-[22px] ml-1">Meta Form : Manager</span>
                    </div>

                    {/* Navigation Tabs (Right Aligned) */}
                    <div className="flex-1 flex justify-end items-center gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        {navTabs && navTabs}

                        <div className="w-px h-6 bg-blue-500/80 mx-1 hidden sm:block"></div>
                        <button className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
                            <UserCircle2 size={26} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
