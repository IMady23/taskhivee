import React from 'react';
import { Github, Code2, Monitor, ExternalLink, Terminal, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';

const DevTools = () => {
    const tools = [
        {
            name: 'GitHub Repository',
            icon: <Github className="text-white" size={24} />,
            description: 'View source code, issues, and pull requests.',
            url: 'https://github.com/Madhavm007/TaskHive',
            color: 'bg-zinc-800'
        },
        {
            name: 'Open in VS Code',
            icon: <Code2 className="text-blue-400" size={24} />,
            description: 'Launch VS Code immediately at the project root.',
            url: 'vscode://file/c:/Projectcolab2',
            color: 'bg-blue-500/10'
        },
        {
            name: 'Open in Cursor',
            icon: <Cpu className="text-teal-400" size={24} />,
            description: 'AI-first coding in Cursor at project root.',
            url: 'cursor://file/c:/Projectcolab2',
            color: 'bg-teal-500/10'
        },
        {
            name: 'Terminal / CMD',
            icon: <Terminal className="text-green-400" size={24} />,
            description: 'Quick local terminal access (Windows).',
            url: 'cmd.exe',
            isSpecial: true,
            color: 'bg-green-500/10'
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto relative">
            <ParticleBackground />
            <header className="mb-10 relative z-10">
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                    <Monitor className="text-blue-500" />
                    Developer Workspace
                </h1>
                <p className="text-gray-400 mt-2">Shortcuts and deep links for local development.</p>
            </header>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
            >
                {tools.map((tool, idx) => (
                    <motion.div
                        key={idx}
                        variants={item}
                        className={`p-6 rounded-2xl border border-[#1e293b] hover:border-blue-500/50 transition-all group relative overflow-hidden bg-[#151921]`}
                    >
                        {/* Background Glow */}
                        <div className={`absolute -top-12 -right-12 w-24 h-24 blur-[40px] rounded-full opacity-20 ${tool.color}`} />

                        <div className="relative z-10 flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${tool.color}`}>
                                {tool.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider">
                                    {tool.name}
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">{tool.description}</p>

                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-[10px] text-zinc-600 font-mono italic">
                                        {tool.isSpecial ? 'LOCAL SYSTEM ACTION' : tool.url.substring(0, 30) + '...'}
                                    </span>
                                    <a
                                        href={tool.url}
                                        target={tool.isSpecial ? '_self' : '_blank'}
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-transform group-hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40"
                                    >
                                        Execute <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="mt-12 p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-center gap-4 text-yellow-200/70 text-sm">
                <div className="p-2 bg-yellow-500/20 rounded-full">
                    <Terminal size={16} />
                </div>
                Note: Local protocol handlers (vscode://, cursor://) require the applications to be installed on your system.
            </div>
        </div>
    );
};

export default DevTools;
