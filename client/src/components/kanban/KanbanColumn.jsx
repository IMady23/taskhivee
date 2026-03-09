import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import TaskCard from './TaskCard';
import { getStatusLabel } from '../../utils/taskUtils';

/**
 * KanbanColumn Component
 * Droppable column for Kanban board
 */
export default function KanbanColumn({ status, tasks, title }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  const columnColors = {
    todo: '#9CA3AF',
    inProgress: '#3B82F6',
    review: '#F59E0B',
    done: '#10B981'
  };

  const columnColor = columnColors[status] || '#9CA3AF';

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] bg-[#1a1f2e] rounded-lg p-4 transition-all ${
        isOver ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
      }`}
      data-status={status}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: columnColor }}
          />
          <h3 className="text-white font-semibold text-lg">
            {title || getStatusLabel(status)}
          </h3>
        </div>
        <span
          className="text-sm font-bold px-2 py-1 rounded-full"
          style={{
            backgroundColor: `${columnColor}20`,
            color: columnColor
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Tasks List */}
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 min-h-[200px]">
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm"
            >
              <div className="text-4xl mb-2">📋</div>
              <p>No tasks yet</p>
              <p className="text-xs mt-1">Drag tasks here</p>
            </motion.div>
          ) : (
            tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
