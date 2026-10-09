import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Edit2, Trash2, X, Shield, User as UserIcon } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERATOR' | 'VIEWER';
  is_active: boolean;
}

export const Team: React.FC = () => {
  const { lang } = useLanguage();
  const { token, user: currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ORG_ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch team members');
      const data = await res.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMembers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/auth/users/${editingId}` : '/api/auth/users';
      const method = editingId ? 'PUT' : 'POST';
      const payload: any = { name, email, phone, role };
      if (password) payload.password = password;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save team member');
      
      setIsModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (id === currentUser?.id) return;
    try {
      const res = await fetch(`/api/auth/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setMembers(members.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
    } catch (err: any) {
      setError(err.message);
    }
  };


  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete member');
      setMembers(members.filter(m => m.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('OPERATOR');
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setName(m.name);
    setEmail(m.email);
    setPhone(m.phone);
    setPassword('');
    setRole(m.role as 'ORG_ADMIN' | 'OPERATOR' | 'VIEWER');
    setEditingId(m.id);
    setIsModalOpen(true);
  };

  const getInitials = (n: string) => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const getRoleColor = (r: string) => {
    if (r === 'ORG_ADMIN') return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (r === 'OPERATOR') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (loading) return <div className="p-6 text-slate-500">{lang === 'te' ? 'సభ్యుల వివరాలు లోడ్ అవుతున్నాయి...' : 'Loading team...'}</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {lang === 'te' ? 'కమిటీ సభ్యులు' : 'Team Members'}
          </h1>
          <p className="text-sm text-slate-500">
            {lang === 'te' ? 'వినియోగదారుల అనుమతులు మరియు పాత్రలను నిర్వహించండి' : 'Manage user access and roles'}
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" /> {lang === 'te' ? 'సభ్యుడిని చేర్చు' : 'Add Member'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative">
            {member.id === currentUser?.id && (
              <span className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-md font-medium">You</span>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                {getInitials(member.name)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  {member.name}
                </h3>
                <p className="text-xs text-slate-500">{member.email}</p>
                <p className="text-xs text-slate-500">{member.phone}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getRoleColor(member.role)}`}>
                <Shield className="h-3 w-3" /> {member.role.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                <span className="text-xs font-medium text-slate-600">{member.is_active ? 'Active' : 'Disabled'}</span>
              </div>
            </div>

            {deleteConfirmId === member.id ? (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm mb-2">
                <p className="text-red-800 mb-2 font-medium">Confirm deletion?</p>
                <div className="flex gap-2">
                  <button onClick={() => executeDelete(member.id)} className="px-3 py-1 bg-red-600 text-white rounded font-medium text-xs">Delete</button>
                  <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded font-medium text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => openEditModal(member)}
                  className="flex-1 py-1.5 text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                {member.id !== currentUser?.id && (
                  <>
                    <button 
                      onClick={() => handleToggleStatus(member.id, member.is_active)}
                      className="flex-1 py-1.5 text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200"
                    >
                      {member.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(member.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-amber-600" />
                {editingId ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input 
                    type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editingId && <span className="text-xs text-slate-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input 
                  type="password" required={!editingId} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  value={role} onChange={(e: any) => setRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="ORG_ADMIN">Organization Admin</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {role === 'ORG_ADMIN' && 'Full access to organization settings and data.'}
                  {role === 'OPERATOR' && 'Can record donations and expenses.'}
                  {role === 'VIEWER' && 'Read-only access to reports and data.'}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
                  {editingId ? 'Save Changes' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
