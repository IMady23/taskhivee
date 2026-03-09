import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import LeadershipTransitionModal from '../../components/LeadershipTransitionModal';
import { UserPlus, ShieldAlert, Zap, Quote } from 'lucide-react';

export default function MemberTransition() {
    const { user } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="relative min-h-screen bg-[#0B0F14] text-white p-8">
            <div className="max-w-4xl mx-auto relative z-10 py-12">
                <header className="space-y-4 mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <UserPlus className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Leadership Transition</h1>
                    </div>
                    <p className="text-gray-400 text-lg font-medium max-w-2xl leading-relaxed">
                        Every great organization eventually undergoes a change in leadership. In TaskHive, this is an ethical, professional process designed to sustain team growth.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-[#151921] p-8 rounded-3xl border border-white/5 space-y-6">
                        <ShieldAlert className="text-blue-400" size={32} />
                        <h3 className="text-xl font-bold uppercase tracking-tight">Professional Approach</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            We do not believe in "rebellion." Transition requests are formal records that allow the team to propose a new lead. Both leaders can coexist to ensure a smooth handover.
                        </p>
                    </div>

                    <div className="bg-[#151921] p-8 rounded-3xl border border-white/5 space-y-6">
                        <Zap className="text-purple-400" size={32} />
                        <h3 className="text-xl font-bold uppercase tracking-tight">Outcome Driven</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            This request notifies the proposed individual to consider leading. No existing leader is removed automatically, maintaining stability and respect.
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-3xl shadow-2xl shadow-blue-500/20">
                    <div className="bg-[#0B0F14] rounded-[22px] p-10 flex flex-col items-center text-center space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Ready to initiate?</h2>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">Formal submission required</p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white text-[#0B0F14] hover:bg-gray-200 font-black px-12 py-5 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-sm flex items-center gap-2"
                        >
                            <UserPlus size={18} />
                            Open Transition Request
                        </button>

                        <div className="inline-flex items-center gap-2 text-blue-400/50 italic font-medium pt-4">
                            <Quote size={14} />
                            Leadership transition is a process, not a revolt.
                        </div>
                    </div>
                </div>
            </div>

            <LeadershipTransitionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamId={user?.teamId}
            />
        </div>
    );
}
