import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import TasksContext from '../../context/TasksContext';
import { createDocument, getTeamDocuments, updateDocument, deleteDocument } from '../../services/documentService';
import { FileText, Plus, Edit2, Trash2, Save, X, ExternalLink, Link as LinkIcon, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MemberDocs() {
    const { user } = useContext(AuthContext);
    const { tasks } = useContext(TasksContext) || { tasks: [] }; // Fallback if context is missing
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkedTaskId, setLinkedTaskId] = useState('');

    useEffect(() => {
        if (user?.teamId) {
            fetchDocs();
        }
    }, [user]);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            console.log('[MemberDocs] User state:', { 
                uid: user?.uid, 
                teamId: user?.teamId,
                email: user?.email 
            });
            const data = await getTeamDocuments(user.teamId);
            setDocs(data);
        } catch (error) {
            console.error('[MemberDocs] Fetch error:', error);
            toast.error(`Failed to load documents: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedDoc(null);
        setTitle('');
        setContent('');
        setLinkedTaskId('');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Title and content are required");
            return;
        }

        try {
            const linkedTask = tasks.find(t => t.id === linkedTaskId);
            const taskData = linkedTask ? {
                linkedTaskId: linkedTask.id,
                linkedTaskTitle: linkedTask.title
            } : { linkedTaskId: null, linkedTaskTitle: null };

            if (selectedDoc) {
                // Update
                await updateDocument(selectedDoc.id, { title, content, ...taskData });
                toast.success("Document updated");
            } else {
                // Create
                await createDocument({
                    title,
                    content,
                    authorId: user.uid,
                    authorName: user.name || user.email,
                    teamId: user.teamId,
                    ...taskData
                });
                toast.success("Document created");
            }
            setIsEditing(false);
            setSelectedDoc(null);
            fetchDocs();
        } catch (error) {
            toast.error("Failed to save document");
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this document?")) return;

        try {
            await deleteDocument(id);
            toast.success("Document deleted");
            if (selectedDoc?.id === id) setSelectedDoc(null);
            fetchDocs();
        } catch (error) {
            toast.error("Failed to delete document");
        }
    };

    const handleSelect = (doc) => {
        if (isEditing) {
            if (!confirm("Discard unsaved changes?")) return;
        }
        setSelectedDoc(doc);
        setTitle(doc.title);
        setContent(doc.content);
        setLinkedTaskId(doc.linkedTaskId || '');
        setIsEditing(false);
    };

    const startEdit = () => {
        if (selectedDoc.authorId !== user.uid) {
            toast.error("You can only edit your own documents");
            return;
        }
        setIsEditing(true);
    };

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 p-2">
            {/* Sidebar List */}
            <div className="w-1/3 bg-[#151921]/40 backdrop-blur-md rounded-2xl shadow-2xl border border-[#1e293b] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#1e293b] flex justify-between items-center bg-[#0B0F14]/50">
                    <h2 className="font-bold text-white flex items-center gap-3 uppercase tracking-wider text-sm">
                        <FileText size={18} className="text-blue-400" />
                        Documents
                    </h2>
                    <button
                        onClick={handleCreate}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-900/40"
                        title="New Document"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
                    ) : docs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm italic">No documents yet.</div>
                    ) : (
                        docs.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => handleSelect(doc)}
                                className={`p-4 rounded-xl cursor-pointer border transition-all group ${selectedDoc?.id === doc.id
                                    ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                                    : 'bg-[#1a1f26] border-[#1e293b] hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold text-sm leading-tight ${selectedDoc?.id === doc.id ? 'text-blue-400' : 'text-gray-200'}`}>
                                        {doc.title}
                                    </h3>
                                    {/* Only show delete if author */}
                                    {user.uid === doc.authorId && (
                                        <button
                                            onClick={(e) => handleDelete(doc.id, e)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-between mt-3 text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">
                                    <span className="flex items-center gap-1"><User size={10} /> {doc.authorName?.split(' ')[0] || 'Unknown'}</span>
                                    <span>{doc.updatedAt?.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Editor / Viewer */}
            <div className="flex-1 bg-[#151921]/40 backdrop-blur-md rounded-2xl shadow-2xl border border-[#1e293b] flex flex-col overflow-hidden">
                {isEditing ? (
                    <div className="flex-1 flex flex-col p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-[#1e293b] pb-6">
                            <input
                                type="text"
                                placeholder="Document Title"
                                className="text-3xl font-extrabold text-white bg-transparent border-none focus:ring-0 w-full placeholder-gray-700 tracking-tight"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <div className="flex items-center gap-3">
                                <select
                                    value={linkedTaskId}
                                    onChange={(e) => setLinkedTaskId(e.target.value)}
                                    className="text-xs bg-[#1a1f26] border-[#1e293b] text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-2"
                                >
                                    <option value="">Link Task (Optional)</option>
                                    {tasks.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setSelectedDoc(null) || setIsEditing(false)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
                                >
                                    <X size={22} />
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-bold text-sm shadow-xl shadow-blue-900/20"
                                >
                                    <Save size={18} /> Save
                                </button>
                            </div>
                        </div>
                        <textarea
                            className="flex-1 w-full resize-none bg-transparent border-none focus:ring-0 text-gray-300 leading-relaxed text-lg custom-scrollbar placeholder-gray-800"
                            placeholder="Start typing your document content..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                ) : selectedDoc ? (
                    <div className="flex-1 flex flex-col p-8">
                        <div className="flex justify-between items-start mb-8 border-b border-[#1e293b] pb-8">
                            <div>
                                <h1 className="text-4xl font-extrabold text-white tracking-tight">{selectedDoc.title}</h1>
                                <div className="flex items-center gap-4 mt-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        Last updated {selectedDoc.updatedAt?.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} by <span className="text-blue-400 font-bold ml-1">{selectedDoc.authorName}</span>
                                    </p>
                                </div>
                                {selectedDoc.linkedTaskId && (
                                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 px-4 py-2 rounded-xl w-fit border border-blue-500/20">
                                        <LinkIcon size={14} />
                                        <span>LINKED TASK: <span className="text-white ml-2 uppercase">{selectedDoc.linkedTaskTitle || 'Unknown Task'}</span></span>
                                    </div>
                                )}
                            </div>
                            {user.uid === selectedDoc.authorId && (
                                <button
                                    onClick={startEdit}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1f26] text-gray-300 border border-[#1e293b] rounded-xl hover:bg-[#1e293b] hover:text-white font-bold transition-all shadow-lg"
                                >
                                    <Edit2 size={16} /> Edit
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                                {selectedDoc.content}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-[#0B0F14]/30">
                        <div className="p-8 rounded-full bg-blue-500/5 animate-pulse mb-6">
                            <FileText size={80} className="opacity-20 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 uppercase tracking-[0.2em]">Secret Vault</h3>
                        <p className="text-sm text-gray-600 mt-2">Select a document to begin reading</p>
                    </div>
                )}
            </div>
        </div>
    );
}
