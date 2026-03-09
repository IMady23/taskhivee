import { useState, useContext } from "react";
import BugsContext from "../context/BugsContext";
import { toast } from "react-hot-toast";
import { uploadFile } from "../services/fileService";
import { Paperclip, X, Bug, CheckSquare, Loader2, Flag } from "lucide-react";
import { motion } from "framer-motion";

export default function BugReportForm({ teamId, onBugReported }) {
    const { addBug } = useContext(BugsContext);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState("Low");
    const [formData, setFormData] = useState({ filePath: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be < 5MB");
            return;
        }

        const toastId = toast.loading("Uploading screenshot...");
        try {
            const path = `bugs/${teamId}/${Date.now()}`;
            const url = await uploadFile(file, path);
            setFormData(prev => ({ ...prev, screenshotUrl: url }));
            toast.success("Attached!", { id: toastId });
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Upload failed", { id: toastId });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            await addBug({
                title,
                description,
                severity,
                filePath: formData.filePath?.trim() || null,
                screenshotUrl: formData.screenshotUrl || null
            });
            toast.success("Bug reported successfully");
            setTitle("");
            setDescription("");
            setSeverity("Low");
            setFormData({ filePath: "", screenshotUrl: "" });
            if (onBugReported) onBugReported();
        } catch (error) {
            console.error("Failed to report bug", error);
            toast.error("Failed to report bug");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[#151921] p-6 rounded-2xl shadow-xl border border-[#1e293b] relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <div className="p-2 bg-red-500/10 rounded-lg">
                    <Bug className="w-5 h-5 text-red-500" />
                </div>
                Report a Bug
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bug Title</label>
                    <input
                        type="text"
                        className="w-full bg-[#0B0F14] border border-[#1e293b] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600"
                        placeholder="E.g., Login page crashing on mobile"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Severity</label>
                        <select
                            className="w-full bg-[#0B0F14] border border-[#1e293b] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all appearance-none"
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                        >
                            <option value="Low">Low - Minor issue</option>
                            <option value="Medium">Medium - Standard</option>
                            <option value="High">High - Critical failure</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">File Path (Optional)</label>
                        <input
                            type="text"
                            className="w-full bg-[#0B0F14] border border-[#1e293b] rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600"
                            placeholder="client/src/pages/Login.jsx"
                            value={formData?.filePath || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, filePath: e.target.value }))}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Screenshot (Optional)</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0B0F14] border border-dashed border-[#1e293b] hover:border-red-500/50 hover:bg-red-500/5 rounded-xl text-gray-400 transition-all">
                            <Paperclip className="w-5 h-5" />
                            <span className="text-sm font-medium">Attach Image</span>
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                        {formData.screenshotUrl && (
                            <div className="flex items-center gap-3 text-sm text-green-400 bg-green-500/10 px-4 py-3 rounded-xl border border-green-500/20">
                                <CheckSquare size={16} />
                                <span className="font-medium">Attached</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, screenshotUrl: "" }))}
                                    className="text-red-400 hover:text-red-300 ml-2"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Detailed Description</label>
                    <textarea
                        className="w-full bg-[#0B0F14] border border-[#1e293b] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 h-32 resize-none transition-all placeholder:text-gray-600"
                        placeholder="What steps did you take? What was the expected result?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-900/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Reporting Bug...
                        </>
                    ) : (
                        <>
                            <Flag className="w-5 h-5" />
                            Submit Bug Report
                        </>
                    )}
                </motion.button>
            </form>
        </div>
    );
}
