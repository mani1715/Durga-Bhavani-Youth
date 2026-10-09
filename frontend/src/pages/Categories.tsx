import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  is_active: boolean;
  usage_count?: number;
}

export const Categories: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'DONATION' | 'EXPENSE'>('DONATION');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = activeTab === 'DONATION' ? '/api/settings/donation-categories' : '/api/settings/expense-categories';
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token, activeTab]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const endpoint = activeTab === 'DONATION' 
        ? `/api/settings/donation-categories/${id}/toggle` 
        : `/api/settings/expense-categories/${id}/toggle`;
        
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      const endpoint = activeTab === 'DONATION' ? '/api/settings/donation-categories' : '/api/settings/expense-categories';
      let url = editingId ? `${endpoint}/${editingId}` : `${endpoint}?name=${encodeURIComponent(categoryName)}`;
      let method = editingId ? 'PUT' : 'POST';
      let body = editingId ? JSON.stringify({ name: categoryName }) : undefined;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body
      });

      if (!res.ok) throw new Error('Failed to save category');
      
      setIsModalOpen(false);
      setCategoryName('');
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openCreateModal = () => {
    setCategoryName('');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setCategoryName(cat.name);
    setEditingId(cat.id);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">Manage classification for receipts and expenses</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('DONATION')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'DONATION' 
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Donation Categories
          </button>
          <button
            onClick={() => setActiveTab('EXPENSE')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'EXPENSE' 
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Expense Categories
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No {activeTab.toLowerCase()} categories found.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <li key={cat.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <h3 className={`font-medium ${cat.is_active ? 'text-slate-800' : 'text-slate-400'}`}>
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cat.usage_count || 0} {activeTab === 'DONATION' ? 'receipts' : 'expenses'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggle(cat.id, cat.is_active)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      cat.is_active ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        cat.is_active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <button 
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingId ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  type="text" 
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder={activeTab === 'DONATION' ? "e.g. General Donation" : "e.g. Decor"}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" /> {editingId ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
