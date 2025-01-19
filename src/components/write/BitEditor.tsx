import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Bit } from '../../types/bit';

interface BitEditorProps {
  onSave: (bit: Omit<Bit, 'id' | 'userId' | 'createdAt'>) => void;
  isListening?: boolean;
  onToggleSpeech?: () => void;
  editingBit?: Bit;
  onCancelEdit?: () => void;
}

export default function BitEditor({ 
  onSave,
  isListening = false,
  onToggleSpeech,
  editingBit,
  onCancelEdit
}: BitEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Load editing bit data when available
  useEffect(() => {
    if (editingBit) {
      setTitle(editingBit.title || '');
      setContent(editingBit.content || '');
      setTags(editingBit.tags || []);
    }
  }, [editingBit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      tags
    });
    
    // Reset form
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 mb-6">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      
      <div className="relative mb-4">
        <textarea
          placeholder="Write your content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {onToggleSpeech && (
          <button
            type="button"
            onClick={onToggleSpeech}
            className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-white"
            title={isListening ? 'Stop Recording' : 'Start Recording'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add tags (press Enter)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-300 hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {editingBit && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!title.trim()}
            className={`${editingBit ? 'flex-1' : 'w-full'} bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {editingBit ? 'Save Changes' : 'Save Draft'}
          </button>
        </div>
      </div>
    </form>
  );
}
