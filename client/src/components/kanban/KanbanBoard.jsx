import React, { useState, useContext, useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { TasksContext } from '../../context/TasksContext';
import { updateTask } from '../../services/taskService';
import { groupTasksByStatus, filterTasks, getStatusLabel } from '../../utils/taskUtils';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { toast } from 'react-hot-toast';

/**
 * KanbanBoard Component
 * Main Kanban board with drag-and-drop functionality
 */
export default function KanbanBoard({ projectId, userRole, userId }) {
  const { tasks } = useContext(TasksContext);
  const [activeId, setActiveId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: [],
    assignee: []
  });
  const [showFilters, setShowFilters] = useState(false);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // Filter tasks based on user role
  const userTasks = useMemo(() => {
    console.log('KanbanBoard - All tasks from context:', tasks);
    if (!tasks) return [];
    if (userRole === 'member' && userId) {
      return tasks.filter(t => t.assignedTo === userId);
    }
    console.log('KanbanBoard - Returning all tasks for leader:', tasks.length);
    return tasks;
  }, [tasks, userRole, userId]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    console.log('KanbanBoard - Filtering tasks:', userTasks.length, 'with filters:', filters);
    const result = filterTasks(userTasks, filters);
    console.log('KanbanBoard - Filtered result:', result.length);
    return result;
  }, [userTasks, filters]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    console.log('KanbanBoard - Grouping tasks:', filteredTasks.length);
    const grouped = groupTasksByStatus(filteredTasks);
    console.log('KanbanBoard - Grouped tasks:', {
      todo: grouped.todo?.length || 0,
      inProgress: grouped.inProgress?.length || 0,
      review: grouped.review?.length || 0,
      done: grouped.done?.length || 0
    });
    return grouped;
  }, [filteredTasks]);

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id;
    const columnId = over.id;

    // Map column IDs to actual status values used in your database
    const statusMap = {
      'todo': 'To Do',
      'inProgress': 'In Progress',
      'review': 'Review',
      'done': 'Done'
    };
    
    const newStatus = statusMap[columnId] || columnId;

    // Find the task
    const task = userTasks.find(t => t.id === taskId);
    
    if (!task) {
      setActiveId(null);
      return;
    }
    
    // Check if status actually changed
    const currentStatus = task.status;
    if (currentStatus === newStatus) {
      setActiveId(null);
      return;
    }

    // Optimistic UI update
    const originalStatus = task.status;
    
    try {
      // Update task status
      await updateTask(taskId, { status: newStatus });
      toast.success(`Task moved to ${getStatusLabel(columnId)}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to move task. Please try again.');
      
      // Rollback on error (handled by context)
    } finally {
      setActiveId(null);
    }
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Get active task for drag overlay
  const activeTask = activeId ? userTasks.find(t => t.id === activeId) : null;

  // Handle search
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      priority: [],
      assignee: []
    });
  };

  const hasActiveFilters = filters.search || filters.priority.length > 0 || filters.assignee.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header with Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1f2e] border border-[#2d3748] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-500 text-white'
                : 'bg-[#1a1f2e] text-white border border-[#2d3748]'
            }`}
          >
            <Filter size={20} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-white text-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                !
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg bg-red-500 text-white flex items-center gap-2 hover:bg-red-600 transition-colors"
            >
              <X size={20} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#1a1f2e] border border-[#2d3748] rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['low', 'medium', 'high', 'urgent'].map(priority => (
                      <button
                        key={priority}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            priority: prev.priority.includes(priority)
                              ? prev.priority.filter(p => p !== priority)
                              : [...prev.priority, priority]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          filters.priority.includes(priority)
                            ? 'bg-blue-500 text-white'
                            : 'bg-[#0f1419] text-gray-400'
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            <KanbanColumn
              status="todo"
              title="To Do"
              tasks={groupedTasks.todo}
            />
            <KanbanColumn
              status="inProgress"
              title="In Progress"
              tasks={groupedTasks.inProgress}
            />
            <KanbanColumn
              status="review"
              title="Review"
              tasks={groupedTasks.review}
            />
            <KanbanColumn
              status="done"
              title="Done"
              tasks={groupedTasks.done}
            />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105">
              <TaskCard task={activeTask} index={0} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 text-gray-400"
        >
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
          <p className="text-sm">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first task to get started'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
