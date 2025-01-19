import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Bit } from '../../types/bit';

interface BitListProps {
  bits: Bit[];
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  sortBy: 'date' | 'title';
  onSort: (sort: 'date' | 'title') => void;
}

export default function BitList({
  bits,
  onEdit,
  onDelete,
  sortBy,
  onSort
}: BitListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const sortedBits = [...bits].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return (a.title || '').localeCompare(b.title || '');
  });

  if (bits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No drafts yet. Start writing something!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          {bits.length} draft{bits.length !== 1 ? 's' : ''}
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value as 'date' | 'title')}
          className="bg-gray-700 text-white px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Newest First</option>
          <option value="title">A-Z</option>
        </select>
      </div>

      {sortedBits.map((bit) => (
        <div key={bit.id} className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-white">{bit.title}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(bit.id)}
                className="text-blue-400 hover:text-blue-300"
                title="Edit"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => onDelete(bit.id, bit.title)}
                className="text-red-400 hover:text-red-300"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          
          <p className="text-gray-300 mb-4 whitespace-pre-wrap">{bit.content}</p>
          
          {bit.tags && bit.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {bit.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="text-sm text-gray-400">
            {formatDate(bit.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
