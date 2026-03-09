import { useState, useContext } from "react";
import BugsContext from "../context/BugsContext";
import { toast } from "react-hot-toast";
import { Trash2, AlertCircle, Clock, Flag, Paperclip, Bug } from "lucide-react";

const STATUS_COLORS = {
    Open: "bg-red-500/10 text-red-400 border-red-500/20",
    "In Progress": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Resolved: "bg-green-500/10 text-green-400 border-green-500/20",
};

const SEVERITY_COLORS = {
    Low: "text-gray-400",
    Medium: "text-orange-400",
    High: "text-red-400 font-semibold",
    Critical: "text-red-500 font-bold"
};

export default function BugList({ teamId, role, filterByReporter }) {
    const { bugs, updateBug, deleteBug, requestBugDeletion } = useContext(BugsContext);
    const [filterStatus, setFilterStatus] = useState("All");

    const handleStatusUpdate = async (bugId, newStatus) => {
        try {
            await updateBug(bugId, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error("Status update error:", error);
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (bugId) => {
        if (role !== "leader") {
            toast.error("Only leaders can delete bugs");
            return;
        }
        if (!confirm("Are you sure you want to delete this bug?")) return;

        try {
            await deleteBug(bugId);
            toast.success("Bug deleted");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete bug");
        }
    };

    const handleRequestDeletion = async (bug) => {
        if (!confirm("Request leader to delete this bug?")) return;

        try {
            const success = await requestBugDeletion(bug.id, bug.title);
            if (success) {
                toast.success("Deletion request sent to Leader");
            } else {
                toast.error("Failed to send request");
            }
        } catch (error) {
            console.error("Request deletion error:", error);
            toast.error("Failed to send request");
        }
    };

    // Filter Logic
    const getFilteredBugs = () => {
        let result = bugs || [];

        // 1. Filter by Reporter (for Members)
        if (filterByReporter) {
            // Check formatted name or simple name match
            result = result.filter(b => b.reportedBy === filterByReporter || b.reportedByName === filterByReporter);
        }

        // 2. Filter by Status
        if (filterStatus !== "All") {
            result = result.filter(b => b.status === filterStatus);
        }

        // 3. Exclude Deleted
        result = result.filter(b => b.status !== 'Deleted');

        // 4. Sort by date (newest first)
        return result.sort((a, b) => {
            const dA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
            const dB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
            return dB - dA;
        });
    };

    const filteredBugs = getFilteredBugs();

    if (filteredBugs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-secondary)]/30 rounded-2xl border border-dashed border-[var(--border-color)] animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 rotate-3">
                    <Bug className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">Pristine Codebase</h4>
                <p className="text-[var(--text-secondary)] text-sm max-w-[200px] text-center leading-relaxed">
                    {filterByReporter ? "You haven't reported any issues. Your reports will appear here." : "No active bugs found in the system. High five!"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex justify-end mb-4">
                <select
                    className="bg-[#1e293b] text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                </select>
            </div>

            <div className="space-y-3">
                {filteredBugs.map((bug) => (
                    <div key={bug.id} className="bg-[#151921] p-4 rounded-xl border border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between gap-4 group">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs border font-medium ${STATUS_COLORS[bug.status] || "text-gray-400 bg-gray-800"}`}>
                                    {bug.status}
                                </span>
                                <span className={`text-xs flex items-center gap-1 ${SEVERITY_COLORS[bug.severity]}`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {bug.severity} Priority
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {(() => {
                                        if (!bug.createdAt) return 'Just now';
                                        try {
                                            const date = bug.createdAt.toDate ? bug.createdAt.toDate() : new Date(bug.createdAt);
                                            // Format: "Feb 6, 2026, 11:30 PM"
                                            return isNaN(date.getTime()) ? 'Just now' : date.toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            });
                                        } catch (e) {
                                            return 'Just now';
                                        }
                                    })()}
                                </span>
                            </div>
                            <h4 className="text-white font-medium text-lg">{bug.title}</h4>
                            <p className="text-gray-400 text-sm mt-1 mb-3">{bug.description}</p>

                            {/* Screenshot Link */}
                            {bug.screenshotUrl && (
                                <div className="mt-2">
                                    <a
                                        href={bug.screenshotUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                    >
                                        <Paperclip className="w-3 h-3" />
                                        View Screenshot
                                    </a>
                                </div>
                            )}

                            {/* Dev Tool Links */}
                            {bug.filePath && (
                                <div className="mt-3 bg-[#0B0F14] p-3 rounded-lg border border-gray-800">
                                    <div className="text-xs text-gray-500 font-mono mb-2 flex items-center gap-1">
                                        <span className="font-semibold text-gray-400">File:</span>
                                        {bug.filePath}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                toast("Opening in VS Code...", { icon: '🔧' });
                                                window.location.href = `vscode://file/${bug.filePath}`;
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e293b] text-blue-400 text-xs rounded hover:bg-[#2e3b4e] border border-blue-900/30 transition-colors"
                                            title="Open in VS Code"
                                        >
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg" className="w-3 h-3" alt="VS" />
                                            Open in VS Code
                                        </button>
                                        <button
                                            onClick={() => {
                                                toast("Opening in Cursor...", { icon: '🖱️' });
                                                window.location.href = `cursor://file/${bug.filePath}`;
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e293b] text-gray-300 text-xs rounded hover:bg-[#2e3b4e] border border-gray-700 transition-colors"
                                            title="Open in Cursor"
                                        >
                                            <span className="font-bold font-mono">C</span>
                                            Open in Cursor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!filterByReporter && (
                                <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-700 bg-gray-800 flex items-center justify-center flex-shrink-0">
                                        {bug.reportedByPhotoURL ? (
                                            <img src={bug.reportedByPhotoURL} alt={bug.reportedByName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-gray-500 uppercase text-[8px] font-bold">
                                                {bug.reportedByName ? bug.reportedByName.charAt(0) : '?'}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Reported by: <span className="font-medium text-gray-400">{bug.reportedByName || bug.reportedBy || 'Unknown'}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-start gap-2 min-w-fit">
                            {(role === "leader" || (role === "member" && (filterByReporter || bug.reportedBy === filterByReporter))) && (
                                <div className="flex items-center gap-2">
                                    <select
                                        className="bg-[#1e293b] text-gray-300 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                                        value={bug.status}
                                        onChange={(e) => handleStatusUpdate(bug.id, e.target.value)}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>

                                    {/* Delete Button - LEADER ONLY */}
                                    {role === "leader" ? (
                                        <button
                                            onClick={() => handleDelete(bug.id)}
                                            className="text-gray-500 hover:text-red-400 transition p-1 rounded hover:bg-red-900/20"
                                            title="Delete Bug"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRequestDeletion(bug)}
                                            className="text-gray-500 hover:text-orange-400 transition p-1 rounded hover:bg-orange-900/20"
                                            title="Request Deletion"
                                        >
                                            <Flag className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
