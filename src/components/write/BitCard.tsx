import React from 'react';
import { Edit2, Trash2, Clock, Tag } from 'lucide-react';
import { Bit } from '../../types/bit';

interface BitCardProps {
  bit: Bit;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function BitCard({ bit, onEdit, onDelete }: BitCardProps) {
  return (
    <div className="bg-navy-800 rounded-lg shadow-sm border border-navy-700">
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-orange-500 truncate pr-4">{bit.title}</h3>
            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{bit.content}</p>
          </div>
          <div className="flex items-center space-x-1 ml-2 shrink-0">
            <button
              onClick={() => onEdit(bit.id)}
              className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(bit.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-400">
            <Clock size={12} className="mr-1" />
            {new Date(bit.lastEdited).toLocaleDateString()}
          </div>
          {bit.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {bit.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-navy-700 text-gray-300"
                >
                  <Tag size={10} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
