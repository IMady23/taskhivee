import React, { useEffect, useState, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Mic, MicOff, PhoneOff, User, Users, Volume2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api/voice';

export default function VoiceChannel({ teamId, user, onLeave }) {
    const [callFrame, setCallFrame] = useState(null);
    const [participants, setParticipants] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [activeSpeakerId, setActiveSpeakerId] = useState(null);
    const frameRef = useRef(null);

    useEffect(() => {
        const initCall = async () => {
            try {
                // 1. Create or get room
                const roomRes = await fetch(`${API_BASE_URL}/create-room`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId })
                });
                const { roomUrl, roomName } = await roomRes.json();

                // 2. Get join token
                const tokenRes = await fetch(`${API_BASE_URL}/join-room`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName,
                        userName: user.name,
                        userId: user.uid
                    })
                });
                const { token } = await tokenRes.json();

                // 3. Initialize Daily Frame (Invisible, we use our own UI)
                const newCallFrame = DailyIframe.createCallObject();

                newCallFrame.on('participant-joined', handleParticipants);
                newCallFrame.on('participant-updated', handleParticipants);
                newCallFrame.on('participant-left', handleParticipants);
                newCallFrame.on('active-speaker-change', (e) => {
                    setActiveSpeakerId(e.activeSpeaker.peerId);
                });
                newCallFrame.on('error', (e) => {
                    toast.error('Voice connection error');
                    console.error(e);
                });

                await newCallFrame.join({ url: roomUrl, token });
                setCallFrame(newCallFrame);
                setParticipants(newCallFrame.participants());

            } catch (err) {
                toast.error('Failed to join voice channel');
                console.error(err);
                if (onLeave) onLeave();
            }
        };

        initCall();

        return () => {
            if (callFrame) {
                callFrame.leave();
                callFrame.destroy();
            }
        };
    }, [teamId, user.uid]);

    const handleParticipants = () => {
        if (!callFrame) return;
        setParticipants(callFrame.participants());
    };

    const toggleMute = () => {
        if (!callFrame) return;
        const currentMute = callFrame.localAudio();
        callFrame.setLocalAudio(!currentMute);
        setIsMuted(currentMute);
    };

    const leaveCall = () => {
        if (callFrame) callFrame.leave();
        if (onLeave) onLeave();
    };

    return (
        <div className="bg-[#151921] border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Voice Transmission Active</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase">
                    <Users size={12} />
                    {Object.keys(participants).length} Connected
                </div>
            </div>

            {/* Participants Grid */}
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                {Object.values(participants).map((p) => (
                    <div key={p.user_id || p.session_id} className="flex flex-col items-center gap-2 group">
                        <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${activeSpeakerId === p.session_id ? 'ring-4 ring-green-500 ring-offset-4 ring-offset-[#151921]' : 'bg-white/5 border border-white/10'
                            }`}>
                            <User size={24} className={p.audio ? 'text-white' : 'text-white/20'} />
                            {!p.audio && (
                                <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-[#151921]">
                                    <MicOff size={10} className="text-white" />
                                </div>
                            )}
                            {activeSpeakerId === p.session_id && (
                                <div className="absolute -inset-1 rounded-full border-2 border-green-500 animate-ping opacity-20" />
                            )}
                        </div>
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter truncate w-full text-center">
                            {p.user_name} {p.local ? '(You)' : ''}
                        </span>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-center gap-4">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-2xl transition-all ${isMuted
                            ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                        }`}
                >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                    onClick={leaveCall}
                    className="p-4 bg-red-500/20 text-red-500 border border-red-500/50 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                >
                    <PhoneOff size={20} />
                </button>
            </div>
        </div>
    );
}
