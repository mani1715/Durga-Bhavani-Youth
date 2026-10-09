import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Move } from 'lucide-react';

interface ElementPos {
  x: number;
  y: number;
  fontSize: number;
  visible: boolean;
  color?: string;
  font?: string;
  customText?: string;
  logoData?: string; // stores base64 uploaded logo image
}

export const Templates: React.FC = () => {
  const { token } = useAuth();
  
  // Custom drag position states for Receipt layout elements including the complete requested fields list
  const [elements, setElements] = useState<Record<string, ElementPos>>(() => {
    const saved = localStorage.getItem('activeElements');
    return saved ? JSON.parse(saved) : {
      // Organization Information
      org_name: { x: 80, y: 15, fontSize: 13, visible: true, color: '#ffffff', font: 'Helvetica' },
      festival_name: { x: 80, y: 30, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },
      event_name: { x: 80, y: 45, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },
      logo: { x: 30, y: 15, fontSize: 16, visible: true, color: '#ffffff', font: 'Helvetica' },
      org_address: { x: 30, y: 70, fontSize: 10, visible: true, color: '#64748b', font: 'Helvetica' },
      contact_number: { x: 30, y: 85, fontSize: 10, visible: true, color: '#64748b', font: 'Helvetica' },
      email_address: { x: 30, y: 100, fontSize: 10, visible: true, color: '#64748b', font: 'Helvetica' },
      website: { x: 260, y: 85, fontSize: 10, visible: true, color: '#64748b', font: 'Helvetica' },

      // Receipt Information
      receipt_number: { x: 30, y: 125, fontSize: 12, visible: true, color: '#f8fafc', font: 'Helvetica' },
      receipt_date: { x: 260, y: 125, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },
      receipt_time: { x: 260, y: 140, fontSize: 11, visible: true, color: '#64748b', font: 'Helvetica' },
      financial_year: { x: 350, y: 15, fontSize: 11, visible: true, color: '#ffffff', font: 'Helvetica' },

      // Donor Information
      donor_name: { x: 30, y: 165, fontSize: 12, visible: true, color: '#f8fafc', font: 'Helvetica' },
      donor_mobile: { x: 30, y: 180, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },
      donor_address: { x: 30, y: 195, fontSize: 11, visible: true, color: '#64748b', font: 'Helvetica' },
      fathers_name: { x: 30, y: 210, fontSize: 11, visible: false, color: '#64748b', font: 'Helvetica' },

      // Donation Information
      amount: { x: 30, y: 235, fontSize: 14, visible: true, color: '#10b981', font: 'Helvetica' },
      amount_in_words: { x: 30, y: 255, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },
      donation_category: { x: 260, y: 165, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },
      donation_purpose: { x: 260, y: 180, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },
      payment_method: { x: 260, y: 195, fontSize: 11, visible: true, color: '#94a3b8', font: 'Helvetica' },

      // Payment Info (UPI, Bank, Cheque)
      transaction_id: { x: 260, y: 210, fontSize: 11, visible: false, color: '#64748b', font: 'Helvetica' },
      bank_name: { x: 260, y: 225, fontSize: 11, visible: false, color: '#64748b', font: 'Helvetica' },

      // Verification / QRs
      qr_code: { x: 380, y: 165, fontSize: 12, visible: true, color: '#ffffff', font: 'Helvetica' },
      receipt_status: { x: 380, y: 230, fontSize: 10, visible: true, color: '#10b981', font: 'Helvetica' },

      // Signatures
      president_signature: { x: 30, y: 280, fontSize: 10, visible: true, color: '#ffffff', font: 'Helvetica' },
      treasurer_signature: { x: 180, y: 280, fontSize: 10, visible: true, color: '#ffffff', font: 'Helvetica' },
      authorized_signature: { x: 330, y: 280, fontSize: 10, visible: true, color: '#ffffff', font: 'Helvetica' },

      // Additional
      thank_you_message: { x: 30, y: 300, fontSize: 10, visible: true, color: '#94a3b8', font: 'Helvetica' }
    };
  });

  const [activeEl, setActiveEl] = useState<string | null>(null);

  const handleDrag = (key: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Only trigger if mouse button held down
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const newX = Math.round(e.clientX - rect.left - 50);
    const newY = Math.round(e.clientY - rect.top - 15);
    
    const nextElements = {
      ...elements,
      [key]: {
        ...elements[key],
        x: Math.max(0, Math.min(newX, 600)),
        y: Math.max(0, Math.min(newY, 420))
      }
    };
    setElements(nextElements);
    localStorage.setItem('activeElements', JSON.stringify(nextElements));
  };

  const handleFontSize = (key: string, size: number) => {
    const nextElements = {
      ...elements,
      [key]: { ...elements[key], fontSize: size }
    };
    setElements(nextElements);
    localStorage.setItem('activeElements', JSON.stringify(nextElements));
  };

  const [templatesList, setTemplatesList] = useState<any[]>(() => {
    const saved = localStorage.getItem('templatesList');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Classic Minimalist', elements: {
        receipt_number: { x: 40, y: 50, fontSize: 12, visible: true },
        donor_name: { x: 40, y: 120, fontSize: 12, visible: true },
        amount: { x: 40, y: 180, fontSize: 14, visible: true },
        date: { x: 260, y: 50, fontSize: 11, visible: true },
        logo: { x: 40, y: 15, fontSize: 16, visible: true },
        logo_text: { x: 80, y: 18, fontSize: 14, visible: true },
        banner_text: { x: 40, y: 220, fontSize: 11, visible: true }
      }}
    ];
  });
  const [activeTemplateId, setActiveTemplateId] = useState(() => {
    return localStorage.getItem('activeTemplateId') || '1';
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newOptionName, setNewOptionName] = useState('');


  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const newId = (templatesList.length + 1).toString();
      const newTpl = {
        id: newId,
        name: newTemplateName,
        background: base64data,
        elements: {
          receipt_number: { x: 40, y: 50, fontSize: 12, visible: true },
          donor_name: { x: 40, y: 120, fontSize: 12, visible: true },
          amount: { x: 40, y: 180, fontSize: 14, visible: true },
          date: { x: 260, y: 50, fontSize: 11, visible: true },
          logo: { x: 40, y: 15, fontSize: 16, visible: true },
          logo_text: { x: 80, y: 18, fontSize: 14, visible: true },
          banner_text: { x: 40, y: 220, fontSize: 11, visible: true }
        }
      };
      
      const updatedList = [...templatesList, newTpl];
      setTemplatesList(updatedList);
      setActiveTemplateId(newId);
      setElements(newTpl.elements);
      setNewTemplateName('');
      
      localStorage.setItem('templatesList', JSON.stringify(updatedList));
      localStorage.setItem('activeTemplateId', newId);
      localStorage.setItem('activeElements', JSON.stringify(newTpl.elements));
    };
    reader.readAsDataURL(file);
  };



  const handleAddOption = () => {
    if (!newOptionName) return;
    const key = newOptionName.toLowerCase().replace(/\s+/g, '_');
    const nextElements = {
      ...elements,
      [key]: { x: 100, y: 150, fontSize: 12, visible: true }
    };
    setElements(nextElements);
    setNewOptionName('');
    localStorage.setItem('activeElements', JSON.stringify(nextElements));
  };


  const handleCommitChanges = async () => {
    try {
      const activeTemplate = templatesList.find(t => t.id === activeTemplateId);
      const res = await fetch(`/api/templates/${activeTemplateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: activeTemplate?.name || 'Custom Layout',
          elements: elements,
          background_key: activeTemplate?.background || null,
          is_active: true
        })
      });
      if (res.ok) {
        alert('Visual template configuration committed successfully to database.');
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save template changes to DB. Saved locally.');
      }
    } catch (e) {
      alert('Network error. Configuration saved locally in browser.');
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Visual Template Builder</h1>
          <p className="text-xs text-slate-400">Add design layouts and map custom field properties</p>
        </div>
        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            id="bg-file-selector" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileSelected} 
          />
          <input 
            type="text" 
            placeholder="New Template Name" 
            value={newTemplateName} 
            onChange={(e) => setNewTemplateName(e.target.value)} 
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs" 
          />
          {newTemplateName ? (
            <label 
              htmlFor="bg-file-selector" 
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold cursor-pointer text-xs flex items-center justify-center"
            >
              Add Template
            </label>
          ) : (
            <button 
              onClick={() => alert('Please enter a template name first.')} 
              className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg font-bold text-xs"
            >
              Add Template
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual receipt preview sandbox */}
        <div className="lg:col-span-2 flex flex-col items-center bg-slate-950/80 p-8 rounded-2xl border border-slate-800 relative gap-4">
          <div className="w-full flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="font-bold text-white">Active Layout Canvas</span>
            <select 
              value={activeTemplateId} 
              onChange={(e) => {
                const match = templatesList.find(t => t.id === e.target.value);
                if (match) {
                  setActiveTemplateId(match.id);
                  setElements(match.elements);
                  localStorage.setItem('activeTemplateId', match.id);
                  localStorage.setItem('activeElements', JSON.stringify(match.elements));
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white"
            >
              {templatesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Canvas container with background styling */}
          <div 
            style={{ 
              backgroundImage: (() => {
                const active = templatesList.find(t => t.id === activeTemplateId);
                return active?.background ? `url(${active.background})` : 'none';
              })(),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#ffffff' // default templates white background
            }}
            className="w-[720px] h-[480px] bg-white border border-slate-800 rounded-xl relative overflow-hidden select-none"
          >
            {/* Custom Background grid watermark */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="p-4 border-b border-slate-800/10 text-center uppercase tracking-widest text-[9px] font-bold text-slate-400 bg-slate-900/10">
              Receipt Background Canvas (Drag elements anywhere)
            </div>

             {Object.entries(elements).map(([key, item]) => {
              if (!item.visible) return null;
              const isActive = activeEl === key;
              return (
                <div
                  key={key}
                  onMouseDown={() => setActiveEl(key)}
                  onMouseMove={(e) => handleDrag(key, e)}
                  style={{ 
                    left: `${item.x}px`, 
                    top: `${item.y}px`, 
                    fontSize: `${item.fontSize}px`,
                    color: item.color || '#ffffff',
                    fontFamily: item.font === 'Courier' ? 'monospace' : item.font === 'Times-Roman' ? 'serif' : 'sans-serif'
                  }}
                  className={`absolute p-1 cursor-move select-none rounded flex items-center gap-1 font-bold transition-all ${
                    isActive ? 'bg-brand-500/25 ring-1 ring-brand-500' : 'bg-slate-950/40 border border-slate-800/40'
                  }`}
                >
                  <Move className="h-2.5 w-2.5 opacity-60 text-slate-400" style={{ color: item.color || '#ffffff' }} />
                  {key === 'logo' ? (
                    item.logoData ? (
                      <img src={item.logoData} alt="Logo" className="h-6 object-contain pointer-events-none" />
                    ) : (
                      <span className="text-amber-500">🕉️</span>
                    )
                  ) : ['logo_text', 'banner_text'].includes(key) ? (
                    <span>{item.customText || key.replace('_', ' ')}</span>
                  ) : (
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Builder controls panel */}
        <div className="p-6 rounded-2xl glass-panel space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Canvas Fields</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Option name (e.g. Ward)" 
                value={newOptionName} 
                onChange={(e) => setNewOptionName(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" 
              />
              <button onClick={handleAddOption} className="px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold">
                Add
              </button>
            </div>
          </div>

          {/* Universal Color Picker option */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Apply Color to All Fields</span>
              <input 
                type="color" 
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...elements };
                  Object.keys(updated).forEach(k => {
                    updated[k] = { ...updated[k], color: val };
                  });
                  setElements(updated);
                  localStorage.setItem('activeElements', JSON.stringify(updated));
                }}
                className="w-8 h-6 bg-transparent border border-slate-800 rounded cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-400">Sets this color across all text elements at once.</p>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {Object.entries(elements).map(([key, item]) => (
              <div key={key} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold capitalize">{key.replace('_', ' ')}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={item.visible} 
                      onChange={(e) => {
                        const updated = {
                          ...elements,
                          [key]: { ...elements[key], visible: e.target.checked }
                        };
                        setElements(updated);
                        localStorage.setItem('activeElements', JSON.stringify(updated));
                      }}
                      className="accent-brand-500" 
                    />
                    <span>Visible</span>
                  </label>
                </div>
                {item.visible && (
                  <div className="space-y-2 pt-1 border-t border-slate-900">
                    <div className="flex gap-4 items-center">
                      <span className="text-[10px] text-slate-400 w-16">Font size:</span>
                      <input 
                        type="range" 
                        min="10" 
                        max="24" 
                        value={item.fontSize} 
                        onChange={(e) => handleFontSize(key, parseInt(e.target.value))}
                        className="w-full accent-brand-500" 
                      />
                      <span className="font-bold">{item.fontSize}px</span>
                    </div>

                    <div className="flex gap-4 items-center">
                      <span className="text-[10px] text-slate-400 w-16">Color:</span>
                      <input 
                        type="color" 
                        value={item.color || '#ffffff'} 
                        onChange={(e) => {
                          const updated = {
                            ...elements,
                            [key]: { ...elements[key], color: e.target.value }
                          };
                          setElements(updated);
                          localStorage.setItem('activeElements', JSON.stringify(updated));
                        }}
                        className="w-8 h-6 bg-transparent border border-slate-800 rounded cursor-pointer"
                      />
                      <span className="font-mono text-[10px]">{item.color || '#ffffff'}</span>
                    </div>

                    <div className="flex gap-4 items-center">
                      <span className="text-[10px] text-slate-400 w-16">Font:</span>
                      <select
                        value={item.font || 'Helvetica'}
                        onChange={(e) => {
                          const updated = {
                            ...elements,
                            [key]: { ...elements[key], font: e.target.value }
                          };
                          setElements(updated);
                          localStorage.setItem('activeElements', JSON.stringify(updated));
                        }}
                        className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-white"
                      >
                        <option value="Helvetica">Sans-Serif</option>
                        <option value="Times-Roman">Serif (Times)</option>
                        <option value="Courier">Monospace</option>
                      </select>
                    </div>

                    {/* Logo Image Uploader */}
                    {key === 'logo' && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-slate-400 block">Custom Logo Image:</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => {
                                const updated = {
                                  ...elements,
                                  logo: { ...elements.logo, logoData: r.result as string }
                                };
                                setElements(updated);
                                localStorage.setItem('activeElements', JSON.stringify(updated));
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[10px] text-slate-400 bg-slate-900 border border-slate-800 rounded p-1"
                        />
                      </div>
                    )}

                    {/* Custom Text input bar */}
                    {['logo_text', 'banner_text'].includes(key) && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-slate-400 block">Text Content:</span>
                        <input 
                          type="text" 
                          value={item.customText || ''}
                          placeholder="Type content..."
                          onChange={(e) => {
                            const updated = {
                              ...elements,
                              [key]: { ...elements[key], customText: e.target.value }
                            };
                            setElements(updated);
                            localStorage.setItem('activeElements', JSON.stringify(updated));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleCommitChanges} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10">
            Commit Changes
          </button>
        </div>
      </div>
    </div>
  );
};
