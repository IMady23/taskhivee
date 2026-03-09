import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code, Layout, Users, Shield, Zap, BarChart3, Heart, ChevronRight } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';

const slideTransition = {
    initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
    whileInView: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
};

const textReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15 + 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    })
};

const SectionWrapper = ({ children, id, className = "" }) => (
    <section
        id={id}
        className={`w-screen h-screen flex-shrink-0 snap-start flex flex-col items-center justify-center relative overflow-hidden px-6 ${className}`}
    >
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={{
                visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="relative z-10 w-full max-w-5xl"
        >
            {children}
        </motion.div>
    </section>
);

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        variants={textReveal}
        custom={delay}
        className="bg-[#151921]/40 backdrop-blur-xl border border-[#1e293b] p-6 rounded-2xl hover:border-blue-500/50 transition-all group shadow-2xl"
    >
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon size={24} className="text-blue-400" />
        </div>
        <h3 className="text-white font-bold mb-2 tracking-tight">{title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
    </motion.div>
);

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-[#0B0F14] text-white selection:bg-blue-500/30 overflow-hidden h-screen relative">
            <ParticleBackground />
            {/* Navigation indicator removed */}
            <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-[#0B0F14] to-transparent pointer-events-none">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-[#151921]/60 backdrop-blur-xl border border-[#1e293b] rounded-xl hover:bg-[#1e293b] transition-all text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest shadow-xl"
                >
                    <ArrowLeft size={14} /> Back to Hub
                </motion.button>

                <div className="hidden md:flex gap-4 pointer-events-auto">
                    {/* Navigation indicator removed */}
                </div>
            </nav>

            {/* Horizontal Scroll Container */}
            <main className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory h-full no-scrollbar">

                {/* Slide 1: Hero */}
                <SectionWrapper id="hero">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center"
                    >
                        <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter">
                            TASK<span className="text-blue-500">HIVE</span>
                        </h1>
                        <div className="h-1 w-24 bg-blue-500 mx-auto rounded-full mb-10 shadow-[0_0_30px_rgba(59,130,246,0.6)]" />
                        <p className="text-lg md:text-xl text-gray-400 font-light tracking-[0.1em] uppercase">
                            Intelligent Multi-Module Environment
                        </p>
                        <motion.div
                            animate={{ x: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="mt-20 flex flex-col items-center gap-4 opacity-30"
                        >
                            <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Scroll Right</span>
                            <ChevronRight size={20} />
                        </motion.div>
                    </motion.div>
                </SectionWrapper>

                {/* Slide 2: Mission */}
                <SectionWrapper id="mission">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            variants={slideTransition}
                            className="bg-[#151921]/40 backdrop-blur-3xl border border-[#1e293b] p-10 md:p-16 rounded-[3rem] shadow-2xl relative"
                        >
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px]" />
                            <motion.h2 variants={textReveal} custom={1} className="text-sm font-bold text-blue-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <span className="h-px w-12 bg-blue-400" /> Genesis
                            </motion.h2>
                            <motion.p variants={textReveal} custom={2} className="text-2xl md:text-3xl text-white leading-tight font-bold tracking-tight mb-8">
                                Optimizing the rhythm of collaborative software engineering.
                            </motion.p>
                            <motion.p variants={textReveal} custom={3} className="text-lg text-gray-400 leading-relaxed font-light">
                                TaskHive is designed to streamline the complex orchestration of modern software teams.
                                By blending high-end aesthetics with powerful collaborative tools, we transform how teams plan,
                                track, and communicate.
                            </motion.p>
                        </motion.div>
                    </div>
                </SectionWrapper>

                {/* Slide 3: Capabilities */}
                <SectionWrapper id="features">
                    <div className="w-full">
                        <motion.div variants={textReveal} custom={0} className="mb-12">
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.4em] mb-4">Architecture</h2>
                            <h3 className="text-5xl font-black tracking-tighter">THE ENGINE</h3>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FeatureCard
                                icon={Users}
                                title="Unified Access"
                                description="Secure role-based environments for Leaders and Members."
                                delay={1}
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Visual Sprinting"
                                description="Real-time task and bug management with interactive boards."
                                delay={2}
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Neural Vault"
                                description="Secure shared documentation with real-time sync capabilities."
                                delay={3}
                            />
                            <FeatureCard
                                icon={BarChart3}
                                title="Performance"
                                description="Deep analytics and metrics to measure project velocity."
                                delay={4}
                            />
                        </div>
                    </div>
                </SectionWrapper>

                {/* Slide 4: Developers */}
                <SectionWrapper id="developers">
                    <div className="max-w-4xl mx-auto w-full">
                        <motion.div variants={textReveal} custom={0} className="text-center mb-20">
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.4em] mb-4">Core Team</h2>
                            <h3 className="text-5xl font-black tracking-tighter">THE ARCHITECTS</h3>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <motion.div variants={textReveal} custom={1} className="group relative">
                                <div className="relative z-10 p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] group-hover:border-blue-500/30 transition-all duration-500">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-2xl mb-8 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <Code size={36} />
                                    </div>
                                    <h4 className="text-3xl font-bold text-white mb-2">Madhav</h4>
                                    <p className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Full-stack Lead</p>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Designed and engineered the backbone of TaskHive, specializing in real-time sync and security protocols.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div variants={textReveal} custom={2} className="group relative">
                                <div className="relative z-10 p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] group-hover:border-pink-500/30 transition-all duration-500">
                                    <div className="w-20 h-20 bg-pink-500/10 rounded-2xl mb-8 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                                        <Layout size={36} />
                                    </div>
                                    <h4 className="text-3xl font-bold text-white mb-2">Manaswini</h4>
                                    <p className="text-pink-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Design & QA</p>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Crafted the premium aesthetic and rigorous testing cycles, ensuring a flawless user experience.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </SectionWrapper>

                {/* Slide 5: Final Footer */}
                <SectionWrapper id="legal">
                    <motion.div
                        variants={slideTransition}
                        className="text-center bg-[#151921]/20 p-12 rounded-3xl border border-[#1e293b] w-full max-w-2xl"
                    >
                        <motion.div variants={textReveal} custom={1} className="flex justify-center mb-8">
                            <div className="p-4 bg-white/5 rounded-full border border-white/10 text-red-500 animate-pulse">
                                <Heart size={32} />
                            </div>
                        </motion.div>
                        <motion.p variants={textReveal} custom={2} className="text-sm font-bold text-gray-400 uppercase tracking-[0.5em] mb-4">
                            Final Year Project | 2026
                        </motion.p>
                        <motion.p variants={textReveal} custom={3} className="text-3xl font-black text-white mb-10 tracking-tighter">
                            MADE BY DEVELOPERS <br />
                            <span className="text-blue-500">FOR DEVELOPERS</span>
                        </motion.p>
                        <motion.div variants={textReveal} custom={4} className="h-px w-20 bg-gray-800 mx-auto mb-10" />
                        <motion.p variants={textReveal} custom={5} className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                            © 2026 TASKHIVE — ALL RIGHTS RESERVED
                        </motion.p>
                    </motion.div>
                </SectionWrapper>

            </main>

            {/* Persistence Controls */}
            <div className="fixed bottom-10 left-0 right-0 z-40 flex justify-center pointer-events-none">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex gap-3 p-2 bg-[#0B0F14]/80 backdrop-blur-xl border border-white/5 rounded-full shadow-2xl pointer-events-auto"
                >
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-white/10" />
                    ))}
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    );
};

export default About;
