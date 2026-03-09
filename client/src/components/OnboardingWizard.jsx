import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Shield, Users, ArrowRight, CheckCircle2, Layout, Zap } from 'lucide-react';
import QuantumBackground from './QuantumBackground';

const OnboardingWizard = ({ userName, onComplete }) => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
        teamName: userName ? `${userName}'s Team` : 'My Super Team',
        workType: 'Software Development',
        notifications: true
    });

    const nextStep = () => setStep(s => s + 1);

    const finish = () => {
        localStorage.setItem('taskhive_onboarding_completed', 'true');
        onComplete();
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: -20 }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <QuantumBackground />
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-[#151921] border border-[#1e293b] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                                <Rocket className="text-blue-500" size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome to <span className="text-blue-500">TASKHIVE</span></h2>
                            <p className="text-gray-400">Let's get your space ready. How should we name your team?</p>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Workspace Name</label>
                                <input
                                    type="text"
                                    value={config.teamName}
                                    onChange={(e) => setConfig({ ...config, teamName: e.target.value })}
                                    className="w-full bg-[#0B0F14] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={nextStep}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 group shadow-xl shadow-blue-900/20 transition-all"
                            >
                                Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                                <Layout className="text-purple-500" size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">What's your focus?</h2>
                            <p className="text-gray-400">We'll pre-configure your dashboard based on your work type.</p>

                            <div className="grid grid-cols-1 gap-3">
                                {['Software Development', 'Marketing & Sales', 'Personal Projects', 'HR & Operations'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setConfig({ ...config, workType: type })}
                                        className={`p-4 text-left rounded-xl border transition-all flex justify-between items-center ${config.workType === type ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-[#0B0F14] border-[#1e293b] text-gray-500 hover:border-zinc-700'}`}
                                    >
                                        <span className="font-bold">{type}</span>
                                        {config.workType === type && <CheckCircle2 size={18} className="text-purple-500" />}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={nextStep}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 group shadow-xl shadow-purple-900/20 transition-all"
                            >
                                Next Step <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                                <Zap className="text-green-500" size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">Ready to launch!</h2>
                            <p className="text-gray-400">Your workspace is optimized for <span className="text-white font-bold underline decoration-green-500">{config.workType}</span>.</p>

                            <div className="bg-[#0B0F14] rounded-2xl p-6 border border-[#1e293b] space-y-4">
                                <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Standard Workflow</h4>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 flex-1 bg-zinc-800 rounded-full" />
                                    <div className="h-2 flex-1 bg-zinc-800 rounded-full" />
                                    <div className="h-2 flex-1 bg-zinc-800 rounded-full" />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                    <span>TO DO</span>
                                    <span>IN PROGRESS</span>
                                    <span>DONE</span>
                                </div>
                            </div>

                            <button
                                onClick={finish}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-green-900/20 transition-all font-mono tracking-widest"
                            >
                                START WORKING <Rocket size={18} />
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default OnboardingWizard;
