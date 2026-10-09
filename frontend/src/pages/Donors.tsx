import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { Search, Eye, Trash2, Download, FileSpreadsheet, Printer, X } from 'lucide-react';

const commonTeluguDictionary: Record<string, string> = {
  "vinayaka": "వినాయక",
  "ganesh": "గణేష్",
  "ganesha": "గణేషా",
  "youth": "యూత్",
  "association": "అసోసియేషన్",
  "gang": "గ్యాంగ్",
  "the gang of vinayaka": "ది గ్యాంగ్ ఆఫ్ వినాయక",
  "ramesh": "రమేష్",
  "suresh": "సురేష్",
  "venkatesh": "వెంకటేష్",
  "mahesh": "మహేష్",
  "rajesh": "రాజేష్",
  "naresh": "నరేష్",
  "dinesh": "దినేష్",
  "lokesh": "లోకేష్",
  "vijay": "విజయ్",
  "kumar": "కుమార్",
  "reddy": "రెడ్డి",
  "rao": "రావు",
  "chandra": "చంద్ర",
  "sekhar": "శేఖర్",
  "sekar": "శేఖర్",
  "srinivas": "శ్రీనివాస్",
  "srinu": "శ్రీను",
  "prasad": "ప్రసాద్",
  "satish": "సతీష్",
  "ravi": "రవి",
  "kiran": "కిరణ్",
  "vamsi": "వంశీ",
  "vamshi": "వంశీ",
  "pavan": "పవన్",
  "kalyan": "కళ్యాణ్",
  "sai": "సాయి",
  "teja": "తేజ",
  "harish": "హరీష్",
  "girish": "గిరీష్",
  "anand": "ఆనంద్",
  "ashok": "అశోక్",
  "babu": "బాబు",
  "balu": "బాలు",
  "bhaskar": "భాస్కర్",
  "bhanu": "భాను",
  "chaitanya": "చైతన్య",
  "charan": "చరణ్",
  "deepak": "దీపక్",
  "dharma": "ధర్మ",
  "gopal": "గోపాల్",
  "gopi": "గోపి",
  "gowtham": "గౌతమ్",
  "gautam": "గౌతమ్",
  "hanuman": "హనుమాన్",
  "jagadeesh": "జగదీష్",
  "karthik": "కార్తీక్",
  "krishna": "కృష్ణ",
  "madhav": "మాధవ్",
  "manoj": "మనోజ్",
  "mohan": "మోహన్",
  "murali": "మురళి",
  "nagaraju": "నాగరాజు",
  "naveen": "నవీన్",
  "narendra": "నరేంద్ర",
  "phanindra": "ఫణీంద్ర",
  "prakash": "ప్రకాష్",
  "praveen": "ప్రవీణ్",
  "radha": "రాధ",
  "raghu": "రఘు",
  "rahul": "రాహుల్",
  "raja": "రాజా",
  "rajan": "రాజన్",
  "rajendra": "రాజేంద్ర",
  "ramu": "రాము",
  "ram": "రామ్",
  "rama": "రామ",
  "ranjith": "రంజిత్",
  "ratnam": "రత్నం",
  "siva": "శివ",
  "shiva": "శివ",
  "srikanth": "శ్రీకాంత్",
  "sridhar": "శ్రీధర్",
  "subba": "సుబ్బా",
  "sudhakar": "సుధాకర్",
  "sundar": "సుందర్",
  "sunil": "సునీల్",
  "swamy": "స్వామి",
  "tirumala": "తిరుమల",
  "uday": "ఉదయ్",
  "vasu": "వాసు",
  "veera": "వీర",
  "venu": "వేణు",
  "vikram": "విక్రమ్",
  "vishnu": "విష్ణు",
  "viswa": "విశ్వ",
  "yashwanth": "యశ్వంత్"
};

const convertToTeluguText = (input: string): string => {
  if (!input || input.trim() === '' || input === 'N/A' || input === 'undefined') return input || '';
  if (/[\u0C00-\u0C7F]/.test(input)) return input;

  const lowerStr = input.toLowerCase().trim();
  if (commonTeluguDictionary[lowerStr]) {
    return commonTeluguDictionary[lowerStr];
  }

  return input.split(/\s+/).map(word => {
    const wLower = word.toLowerCase();
    if (commonTeluguDictionary[wLower]) {
      return commonTeluguDictionary[wLower];
    }
    let res = wLower
      .replace(/sh/g, 'ష్')
      .replace(/th/g, 'త్')
      .replace(/dh/g, 'ధ')
      .replace(/ch/g, 'చ')
      .replace(/kh/g, 'ఖ')
      .replace(/gh/g, 'ఘ')
      .replace(/ph/g, 'ఫ')
      .replace(/bh/g, 'భ')
      .replace(/ka/g, 'క').replace(/ki/g, 'కి').replace(/ku/g, 'కు').replace(/ke/g, 'కె').replace(/ko/g, 'కొ')
      .replace(/ga/g, 'గ').replace(/gi/g, 'గి').replace(/gu/g, 'గు').replace(/ge/g, 'గె').replace(/go/g, 'గొ')
      .replace(/ja/g, 'జ').replace(/ji/g, 'జి').replace(/ju/g, 'జు').replace(/je/g, 'జె').replace(/jo/g, 'జొ')
      .replace(/ta/g, 'ట').replace(/ti/g, 'టి').replace(/tu/g, 'టు').replace(/te/g, 'టె').replace(/to/g, 'టొ')
      .replace(/da/g, 'డ').replace(/di/g, 'డి').replace(/du/g, 'డు').replace(/de/g, 'డె').replace(/do/g, 'డొ')
      .replace(/na/g, 'న').replace(/ni/g, 'ని').replace(/nu/g, 'ను').replace(/ne/g, 'నె').replace(/no/g, 'నొ')
      .replace(/pa/g, 'ప').replace(/pi/g, 'పి').replace(/pu/g, 'పు').replace(/pe/g, 'పె').replace(/po/g, 'పొ')
      .replace(/ba/g, 'బ').replace(/bi/g, 'బి').replace(/bu/g, 'బు').replace(/be/g, 'బె').replace(/bo/g, 'బొ')
      .replace(/ma/g, 'మ').replace(/mi/g, 'మి').replace(/mu/g, 'ము').replace(/me/g, 'మె').replace(/mo/g, 'మొ')
      .replace(/ya/g, 'య').replace(/yi/g, 'యి').replace(/yu/g, 'యు').replace(/ye/g, 'యె').replace(/yo/g, 'యొ')
      .replace(/ra/g, 'ర').replace(/ri/g, 'రి').replace(/ru/g, 'రు').replace(/re/g, 'రె').replace(/ro/g, 'రొ')
      .replace(/la/g, 'ల').replace(/li/g, 'లి').replace(/lu/g, 'లు').replace(/le/g, 'లె').replace(/lo/g, 'లొ')
      .replace(/va/g, 'వ').replace(/vi/g, 'వి').replace(/vu/g, 'వు').replace(/ve/g, 'వె').replace(/vo/g, 'వొ')
      .replace(/sa/g, 'స').replace(/si/g, 'సి').replace(/su/g, 'సు').replace(/se/g, 'సె').replace(/so/g, 'సొ')
      .replace(/ha/g, 'హ').replace(/hi/g, 'హి').replace(/hu/g, 'హు').replace(/he/g, 'హె').replace(/ho/g, 'హొ');
    
    return /[a-z]/i.test(res) ? word : res;
  }).join(' ');
};

export const Donors: React.FC = () => {
  const { token, user } = useAuth();
  const { activeEvent } = useEvent();
  const [donors, setDonors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const fetchDonors = async () => {
    setLoading(true);
    let apiDonors: any[] = [];
    
    if (token) {
      try {
        const res = await fetch(`/api/donors?search=${search}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          apiDonors = await res.json();
        }
      } catch (e) {
        // Fallback to local storage
      }
    }

    // Merge with local receipts data if available
    const localReceiptsStr = activeEvent ? localStorage.getItem(`receipts_${activeEvent.id}`) : null;
    const localReceipts: any[] = localReceiptsStr ? JSON.parse(localReceiptsStr) : [];
    
    const donorMap = new Map<string, any>();

    // Put API donors in map first
    for (const d of apiDonors) {
      const key = d.mobile ? d.mobile.trim() : d.id;
      donorMap.set(key, {
        id: d.id,
        name: d.name && d.name !== 'N/A' && d.name !== 'undefined' ? d.name : 'Donor',
        mobile: d.mobile || 'N/A',
        total_contribution: Number(d.total_contribution || 0)
      });
    }

    // Incorporate local receipts to guarantee 100% data sync
    for (const r of localReceipts) {
      if (r.status === 'CANCELLED') continue;
      const rName = r.donor_name || r.donor?.name || r.custom_values?.donor_name || 'Donor';
      const rMobile = r.donor_mobile || r.donor?.mobile || r.custom_values?.donor_mobile || '';
      const rAmt = Number(r.amount || 0);

      const key = rMobile && rMobile !== 'undefined' ? rMobile.trim() : rName.trim();
      if (!key) continue;

      if (donorMap.has(key)) {
        const existing = donorMap.get(key);
        if (existing.name === 'N/A' || existing.name === 'Donor' || existing.name === 'undefined') {
          if (rName && rName !== 'N/A' && rName !== 'undefined') {
            existing.name = rName;
          }
        }
        // If local receipt is not yet in backend sum, ensure total reflects correctly
        if (!apiDonors.some(ad => ad.id === existing.id)) {
          existing.total_contribution += rAmt;
        }
      } else {
        donorMap.set(key, {
          id: r.id || key,
          name: rName && rName !== 'undefined' ? rName : 'Donor',
          mobile: rMobile || 'N/A',
          total_contribution: rAmt
        });
      }
    }

    let combinedList = Array.from(donorMap.values());
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      combinedList = combinedList.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.mobile.includes(q)
      );
    }

    setDonors(combinedList);
    setLoading(false);
  };

  useEffect(() => {
    fetchDonors();
  }, [token, activeEvent, search]);

  const exportDonorsCSV = (language: 'en' | 'te') => {
    const isTe = language === 'te';
    
    const headers = isTe 
      ? ["క్రమ సంఖ్య (S.No)", "దాత పేరు (Donor Name)", "ఫోన్ నంబర్ (Mobile)", "మొత్తం విరాళం (Total Contribution)"]
      : ["S.No", "Donor Name", "Mobile Number", "Total Contribution (INR)"];

    const rows = donors.map((d, index) => {
      const displayName = isTe ? convertToTeluguText(d.name) : d.name;
      return [
        index + 1,
        `"${displayName.replace(/"/g, '""')}"`,
        `"${d.mobile}"`,
        `"₹${Number(d.total_contribution || 0).toLocaleString('en-IN')}"`
      ];
    });

    let csvContent = "\uFEFF" + headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = isTe 
      ? `donors_list_telugu_${new Date().toISOString().slice(0,10)}.csv`
      : `donors_list_english_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadModal(false);
  };

  const printDonorsReport = (language: 'en' | 'te') => {
    const orgName = localStorage.getItem('settings_orgName') || 'Ganesh Youth Association';
    const orgNameTe = convertToTeluguText(orgName);
    const isTe = language === 'te';
    
    const title = isTe ? `${orgNameTe} - దాతల వివరాల నివేదిక` : `${orgName} - Donors Directory Report`;
    const totalSum = donors.reduce((acc, curr) => acc + Number(curr.total_contribution || 0), 0);

    const printWin = window.open('', '_blank');
    if (!printWin) return alert('Please allow popups to print report');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #ea580c; font-size: 24px; }
          .header p { margin: 4px 0 0; color: #555; font-size: 14px; }
          .summary { display: flex; justify-content: space-between; background: #fff7ed; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; border: 1px solid #ffedd5; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background: #1e293b; color: #fff; text-align: left; padding: 10px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .amt { color: #16a34a; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🕉️ ${isTe ? orgNameTe : orgName} 🕉️</h1>
          <p>${isTe ? 'దాతల విరాళాల నివేదిక' : 'Official Donors Directory Report'}</p>
        </div>
        <div class="summary">
          <span>${isTe ? 'మొత్తం దాతలు:' : 'Total Donors:'} ${donors.length}</span>
          <span>${isTe ? 'సేకరించిన మొత్తం:' : 'Total Collection:'} ₹${totalSum.toLocaleString('en-IN')}</span>
          <span>${isTe ? 'తేదీ:' : 'Date:'} ${new Date().toLocaleDateString('en-IN')}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isTe ? 'దాత పేరు (Donor Name)' : 'Donor Name'}</th>
              <th>${isTe ? 'ఫోన్ నంబర్ (Mobile)' : 'Mobile Number'}</th>
              <th style="text-align:right;">${isTe ? 'మొత్తం విరాళం (Contribution)' : 'Total Contribution'}</th>
            </tr>
          </thead>
          <tbody>
            ${donors.map((d, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${isTe ? convertToTeluguText(d.name) : d.name}</strong></td>
                <td>${d.mobile}</td>
                <td style="text-align:right;" class="amt">₹${Number(d.total_contribution || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Generated automatically by Vinayaka Chavithi Management System • ${new Date().toLocaleString()}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
    setShowDownloadModal(false);
  };

  const viewDonorProfile = async (id: string) => {
    try {
      if (token) {
        const res = await fetch(`/api/donors/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedDonor(data);
          return;
        }
      }
    } catch (err) {
      // Fallback
    }

    // Fallback donor profile from local donors map
    const target = donors.find(d => d.id === id);
    if (target) {
      setSelectedDonor({
        donor: { name: target.name, mobile: target.mobile },
        total_contribution: target.total_contribution,
        donation_count: 1,
        receipts: []
      });
    } else {
      alert('Donor profile not found');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Donor Directory</h1>
          <p className="text-xs text-slate-400">Manage member accounts and individual donation histories</p>
        </div>
        <button 
          onClick={() => setShowDownloadModal(true)} 
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-500/10 transition-colors"
        >
          <Download className="h-4 w-4" /> Download Donors List
        </button>
      </div>

      <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search donors by name or mobile number..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-brand-500 text-white"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Donor Name</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Total Contribution</th>
                <th className="p-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {donors.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/20 text-slate-300">
                  <td className="p-4 font-semibold text-white">{item.name}</td>
                  <td className="p-4">{item.mobile}</td>
                  <td className="p-4 text-emerald-400 font-bold">₹{Number(item.total_contribution || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right space-x-1.5">
                    <button onClick={() => viewDonorProfile(item.id)} className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-brand-300">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete ${item.name}? This will permanently remove their records.`)) {
                            try {
                              if (token) {
                                await fetch(`/api/donors/${item.id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                              }
                              fetchDonors();
                            } catch (e) {
                              alert('Error deleting donor');
                            }
                          }
                        }} 
                        className="p-1.5 bg-slate-800 rounded-lg hover:bg-red-900 text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {donors.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">No donor profiles found matching parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Language & Format Selection Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl text-xs space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="h-4 w-4 text-brand-400" /> Download Donors Report
              </h3>
              <button onClick={() => setShowDownloadModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-300">Choose your preferred report language and format:</p>

            <div className="space-y-3 pt-1">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-amber-400 uppercase text-[10px]">🇬🇧 English Report Formats:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => exportDonorsCSV('en')} 
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Excel / CSV (EN)
                  </button>
                  <button 
                    onClick={() => printDonorsReport('en')} 
                    className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" /> Print / PDF (EN)
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-amber-400 uppercase text-[10px]">🇮🇳 తెలుగు నివేదిక ఫార్మాట్‌లు (Telugu):</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => exportDonorsCSV('te')} 
                    className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> ఎక్సెల్ / CSV (తెలుగు)
                  </button>
                  <button 
                    onClick={() => printDonorsReport('te')} 
                    className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" /> ప్రింట్ / PDF (తెలుగు)
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowDownloadModal(false)} 
              className="w-full py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl text-xs space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Donor Statement: {selectedDonor.donor?.name || selectedDonor.donor?.name}</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Issued</p>
                <p className="text-sm font-bold text-emerald-400 mt-1">₹{Number(selectedDonor.total_contribution || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Receipts</p>
                <p className="text-sm font-bold text-white mt-1">{selectedDonor.donation_count || 1}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Mobile</p>
                <p className="text-xs font-bold text-white mt-2">{selectedDonor.donor?.mobile}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[10px]">Donation Ledger</h4>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800">
                {selectedDonor.receipts && selectedDonor.receipts.map((r: any) => (
                  <div key={r.id} className="p-3 bg-slate-950 flex justify-between items-center">
                    <div>
                      <a href={`/receipts?search=${r.receipt_number}`} className="font-medium text-brand-400 hover:underline">{r.receipt_number}</a>
                      <p className="text-[9px] text-slate-500">{new Date(r.receipt_date).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold text-emerald-400">₹{Number(r.amount).toLocaleString('en-IN')}</p>
                  </div>
                ))}
                {(!selectedDonor.receipts || selectedDonor.receipts.length === 0) && (
                  <p className="p-4 text-center text-slate-500">No detailed transactions breakdown stored for this donor profile.</p>
                )}
              </div>
            </div>

            <button onClick={() => setSelectedDonor(null)} className="w-full py-2 border border-slate-800 text-slate-400 rounded-lg">Close Statement</button>
          </div>
        </div>
      )}
    </div>
  );
};

