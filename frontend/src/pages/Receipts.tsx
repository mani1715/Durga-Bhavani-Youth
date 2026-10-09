import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { Plus, Search, Eye, XCircle, Share2, FileDown, Trash2, Edit, Mic, Copy } from 'lucide-react';

export const Receipts: React.FC = () => {
  const { token, user } = useAuth();
  const { activeEvent } = useEvent();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal controllers
  const [createModal, setCreateModal] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Edit modal controller states
  const [editModal, setEditModal] = useState<any | null>(null);
  const [editDonorName, setEditDonorName] = useState('');
  const [editDonorMobile, setEditDonorMobile] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('CASH');
  const [editNotes, setEditNotes] = useState('');
  
  // Form State
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const fetchReceipts = () => {
    if (!activeEvent) return;
    setLoading(true);
    
    const localSaved = localStorage.getItem(`receipts_${activeEvent.id}`);
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved).map((r: any) => ({
          ...r,
          donor_name: getReceiptDonorName(r)
        }));
        setReceipts(parsed);
      } catch (e) {}
    }

    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`/api/receipts?event_id=${activeEvent.id}&search=${search}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sanitized = data.map((r: any) => ({
            ...r,
            donor_name: getReceiptDonorName(r)
          }));
          setReceipts(sanitized);
          localStorage.setItem(`receipts_${activeEvent.id}`, JSON.stringify(sanitized));
        }
      })
      .catch(() => {
        // silently fallback on connection failure
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReceipts();
  }, [activeEvent, search]);

  useEffect(() => {
    if (token) {
      fetch('/api/settings/donation-categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setCategories(data);
          if (data.length > 0) setCategoryId(data[0].id);
        });
    }
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const extraVals = JSON.parse(localStorage.getItem('tempCustomValues') || '{}');
      const custom_payload = {
        donor_name: donorName,
        donor_mobile: donorMobile,
        ward_number: wardNumber,
        ...extraVals
      };
      
      // Read the persistent base64 background layout configuration from local storage
      const activeElementsConfig = JSON.parse(localStorage.getItem('activeElements') || '{}');
      const templatesStore = JSON.parse(localStorage.getItem('templatesList') || '[]');
      const activeTemplateId = localStorage.getItem('activeTemplateId') || '1';
      const activeTemplate = templatesStore.find((t: any) => t.id === activeTemplateId);
      const bgBase64 = activeTemplate?.background || null;

      const savedOrgName = localStorage.getItem('settings_orgName') || 'Vinayaka Festival Committee';
      const savedAddress = localStorage.getItem('settings_address') || 'Colony Park, Phase 1, Hyderabad';
      const savedContact = localStorage.getItem('settings_contact') || '9876543210';
      const savedEmail = localStorage.getItem('settings_email') || 'contact@vinayaka.org';
      const savedSlogan = localStorage.getItem('settings_customMsg') || 'May Lord Ganesha bless you!';
      const savedLogo = localStorage.getItem('settings_logo') || '';

      // Override activeElementsConfig parameters dynamically from saved settings
      if (activeElementsConfig.logo && savedLogo) {
        activeElementsConfig.logo.logoData = savedLogo;
      }

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: activeEvent?.id,
          donor_name: donorName,
          donor_mobile: donorMobile,
          donor_address: donorAddress,
          amount: parseFloat(amount),
          donation_category_id: categoryId,
          payment_method: paymentMethod,
          notes,
          custom_values: custom_payload,
          // Feed canvas customization metrics directly to receipt creation
          template_elements: activeElementsConfig,
          template_background: bgBase64,
          logo_text: savedOrgName,
          // Custom settings values injected directly into template placeholder
          org_name: savedOrgName,
          org_address: savedAddress,
          contact_number: savedContact,
          email_address: savedEmail,
          thank_you_message: savedSlogan
        })
      });
      if (res.ok) {
        const createdReceipt = await res.json();
        const fullReceiptObj = {
          ...createdReceipt,
          donor_name: createdReceipt.donor_name || donorName,
          donor_mobile: createdReceipt.donor_mobile || donorMobile,
          donor_address: createdReceipt.donor_address || donorAddress
        };
        setCreateModal(false);
        // Clear fields
        setDonorName('');
        setDonorMobile('');
        setDonorAddress('');
        setAmount('');
        setWardNumber('');
        setNotes('');
        localStorage.removeItem('tempCustomValues');
        
        // Append newly created receipt to backup localStorage cache immediately
        if (activeEvent) {
          const localSaved = localStorage.getItem(`receipts_${activeEvent.id}`);
          const list = localSaved ? JSON.parse(localSaved) : [];
          localStorage.setItem(`receipts_${activeEvent.id}`, JSON.stringify([fullReceiptObj, ...list]));
        }
        
        fetchReceipts();
        setCopyToast('విరాళం విజయవంతంగా నమోదైంది!');
        setTimeout(() => setCopyToast(null), 3000);
      } else {
        // Offline Fallback mockup generation if API fails/is resetting
        const mockReceipt = {
          id: Math.random().toString(),
          receipt_number: `REC-${Date.now()}`,
          donor_name: donorName,
          donor_mobile: donorMobile,
          donor_address: donorAddress,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          status: 'ISSUED',
          notes: notes,
          receipt_date: new Date().toISOString(),
          custom_values: custom_payload
        };
        if (activeEvent) {
          const localSaved = localStorage.getItem(`receipts_${activeEvent.id}`);
          const list = localSaved ? JSON.parse(localSaved) : [];
          localStorage.setItem(`receipts_${activeEvent.id}`, JSON.stringify([mockReceipt, ...list]));
          setReceipts([mockReceipt, ...list]);
        }
        setCreateModal(false);
        setDonorName('');
        setDonorMobile('');
        setAmount('');
        setNotes('');
        setCopyToast('విరాళం నమోదైంది!');
        setTimeout(() => setCopyToast(null), 3000);
      }
    } catch (err) {
      // Offline fallback
      const extraVals = JSON.parse(localStorage.getItem('tempCustomValues') || '{}');
      const custom_payload = { ward_number: wardNumber, ...extraVals };
      const mockReceipt = {
        id: Math.random().toString(),
        receipt_number: `REC-${Date.now()}`,
        donor_name: donorName,
        donor_mobile: donorMobile,
        donor_address: donorAddress,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        status: 'ISSUED',
        notes: notes,
        receipt_date: new Date().toISOString(),
        custom_values: custom_payload
      };
      if (activeEvent) {
        const localSaved = localStorage.getItem(`receipts_${activeEvent.id}`);
        const list = localSaved ? JSON.parse(localSaved) : [];
        localStorage.setItem(`receipts_${activeEvent.id}`, JSON.stringify([mockReceipt, ...list]));
        setReceipts([mockReceipt, ...list]);
      }
      setCreateModal(false);
      setDonorName('');
      setDonorMobile('');
      setAmount('');
      setNotes('');
      setCopyToast('విరాళం నమోదైంది!');
      setTimeout(() => setCopyToast(null), 3000);
    }
  };


  const handleCancelReceipt = async (receiptId: string) => {
    if (!cancelReason) return alert('Cancellation reason is required');
    try {
      const res = await fetch(`/api/receipts/${receiptId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.ok) {
        setPreviewData(null);
        setCancelReason('');
        fetchReceipts();
      } else {
        const err = await res.json();
        alert(err.detail || 'Unable to cancel receipt');
      }
    } catch (err) {
      alert('Error cancelling receipt');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      const res = await fetch(`/api/receipts/${editModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          donor_name: editDonorName,
          donor_mobile: editDonorMobile,
          donation_category_id: editCategoryId,
          payment_method: editPaymentMethod,
          notes: editNotes,
          custom_values: editModal.custom_values
        })
      });
      if (res.ok) {
        setEditModal(null);
        fetchReceipts();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update receipt');
      }
    } catch (err) {
      alert('Error editing receipt');
    }
  };

  const [wardNumber, setWardNumber] = useState('');
  const [langModal, setLangModal] = useState<any | null>(null);



// Helper function to extract valid donor name across all payload attributes
const getReceiptDonorName = (item: any): string => {
  if (!item) return 'Donor';
  if (item.donor_name && item.donor_name !== 'undefined' && item.donor_name !== 'N/A' && item.donor_name.trim() !== '') {
    return item.donor_name;
  }
  if (item.donor?.name && item.donor.name !== 'undefined' && item.donor.name !== 'N/A' && item.donor.name.trim() !== '') {
    return item.donor.name;
  }
  if (item.custom_values?.donor_name && item.custom_values.donor_name !== 'undefined' && item.custom_values.donor_name !== 'N/A' && item.custom_values.donor_name.trim() !== '') {
    return item.custom_values.donor_name;
  }
  if (item.donor_info?.name && item.donor_info.name !== 'undefined' && item.donor_info.name !== 'N/A' && item.donor_info.name.trim() !== '') {
    return item.donor_info.name;
  }
  if (item.name && item.name !== 'undefined' && item.name !== 'N/A' && item.name.trim() !== '') {
    return item.name;
  }
  const mob = item.donor_mobile || item.mobile || item.donor?.mobile || item.custom_values?.donor_mobile;
  if (mob && mob !== 'N/A' && mob !== 'undefined' && String(mob).trim() !== '') {
    return `Donor (${mob})`;
  }
  return 'Donor';
};

const getReceiptDonorMobile = (item: any): string => {
  if (!item) return '';
  if (item.donor_mobile && item.donor_mobile !== 'undefined' && String(item.donor_mobile).trim() !== '') {
    return String(item.donor_mobile);
  }
  if (item.mobile && item.mobile !== 'undefined' && String(item.mobile).trim() !== '') {
    return String(item.mobile);
  }
  if (item.donor?.mobile && item.donor.mobile !== 'undefined' && String(item.donor.mobile).trim() !== '') {
    return String(item.donor.mobile);
  }
  if (item.donor?.phone && item.donor.phone !== 'undefined' && String(item.donor.phone).trim() !== '') {
    return String(item.donor.phone);
  }
  if (item.custom_values?.donor_mobile && item.custom_values.donor_mobile !== 'undefined' && String(item.custom_values.donor_mobile).trim() !== '') {
    return String(item.custom_values.donor_mobile);
  }
  if (item.donor_info?.mobile && item.donor_info.mobile !== 'undefined' && String(item.donor_info.mobile).trim() !== '') {
    return String(item.donor_info.mobile);
  }
  return '';
};

// Helper function to transliterate English text/names into Telugu script phonetically
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

  const shareOnWhatsApp = async (item: any, language: 'en' | 'te') => {
    const dName = getReceiptDonorName(item);
    const dNameTe = convertToTeluguText(dName);
    const savedOrgName = localStorage.getItem('settings_orgName') || 'Ganesh Youth Association';
    const savedOrgNameTe = convertToTeluguText(savedOrgName);
    const savedSloganEn = localStorage.getItem('settings_customMsgEn') || localStorage.getItem('settings_customMsg') || 'May Lord Ganesha bless you with health, wealth, and prosperity!';
    const savedSloganTe = localStorage.getItem('settings_customMsgTe') || 'శ్రీ వినాయక స్వామి వారి కృపా కటాక్షాలు మీ కుటుంబానికి ఎల్లవేళలా ఉండాలని కోరుకుంటున్నాము!';
    const savedContact = localStorage.getItem('settings_contact') || '9876543210';
    const dMobile = getReceiptDonorMobile(item);
    const phoneLineEn = dMobile ? `\n📱 Mobile: ${dMobile}` : '';
    const phoneLineTe = dMobile ? `\n📱 ఫోన్ నంబర్: ${dMobile}` : '';
    
    // Auto-formatted receipt date
    const formattedDate = item.receipt_date ? new Date(item.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const amountVal = `₹${Number(item.amount).toLocaleString('en-IN')}`;

    const messageEn = `🕉️ *${savedOrgName}* 🕉️\n\n📅 Date: ${formattedDate}\n🧾 Receipt No: ${item.receipt_number}\n👤 Donor Name: ${dName}${phoneLineEn}\n💰 Amount Paid: ${amountVal}\n\n_${savedSloganEn}_\n\n📞 Contact: ${savedContact}\nRegards,\n*${savedOrgName}*`;
    
    const messageTe = `🕉️ *${savedOrgNameTe}* 🕉️\n\n📅 తేదీ: ${formattedDate}\n🧾 రసీదు సంఖ్య: ${item.receipt_number}\n👤 దాత పేరు: ${dNameTe}${phoneLineTe}\n💰 చెల్లించిన మొత్తం: ${amountVal}\n\n_${savedSloganTe}_\n\n📞 సంప్రదించవలసిన సంఖ్య: ${savedContact}\nఇట్లు,\n*${savedOrgNameTe}*`;
    
    const message = language === 'te' ? messageTe : messageEn;
    const cleanMobile = dMobile ? dMobile.replace(/\D/g, '') : '';
    const url = cleanMobile ? `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(message)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setLangModal(null);
  };

  const shareNativeMedia = async (item: any, language: 'en' | 'te' = 'en') => {
    const dName = getReceiptDonorName(item);
    const dNameTe = convertToTeluguText(dName);
    const savedOrgName = localStorage.getItem('settings_orgName') || 'Ganesh Youth Association';
    const savedOrgNameTe = convertToTeluguText(savedOrgName);
    const savedSlogan = language === 'te' 
      ? (localStorage.getItem('settings_customMsgTe') || 'శ్రీ వినాయక స్వామి వారి కృపా కటాక్షాలు మీ కుటుంబానికి ఎల్లవేళలా ఉండాలని కోరుకుంటున్నాము!')
      : (localStorage.getItem('settings_customMsgEn') || localStorage.getItem('settings_customMsg') || 'May Lord Ganesha bless you with health, wealth, and prosperity!');
    const savedContact = localStorage.getItem('settings_contact') || '9876543210';
    const dMobile = getReceiptDonorMobile(item);
    const phoneLineEn = dMobile ? `\nPhone: ${dMobile}` : '';
    const phoneLineTe = dMobile ? `\nఫోన్ నంబర్: ${dMobile}` : '';
    
    const formattedDate = item.receipt_date ? new Date(item.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const amountVal = `₹${Number(item.amount).toLocaleString('en-IN')}`;

    const shareTextEn = `🕉️ ${savedOrgName} 🕉️\nDate: ${formattedDate}\nReceipt No: ${item.receipt_number}\nDonor Name: ${dName}${phoneLineEn}\nAmount Paid: ${amountVal}\n${savedSlogan}\nContact: ${savedContact}`;
    const shareTextTe = `🕉️ ${savedOrgNameTe} 🕉️\nతేదీ: ${formattedDate}\nరసీదు సంఖ్య: ${item.receipt_number}\nదాత పేరు: ${dNameTe}${phoneLineTe}\nచెల్లించిన మొత్తం: ${amountVal}\n${savedSlogan}\nసంప్రదించవలసిన సంఖ్య: ${savedContact}`;

    const shareText = language === 'te' ? shareTextTe : shareTextEn;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${item.receipt_number} - ${savedOrgName}`,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopyToast("Receipt text copied to clipboard!");
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  const copyReceiptWithLink = async (item: any, language: 'en' | 'te' = 'en') => {
    const dName = getReceiptDonorName(item);
    const dNameTe = convertToTeluguText(dName);
    const savedOrgName = localStorage.getItem('settings_orgName') || 'Ganesh Youth Association';
    const savedOrgNameTe = convertToTeluguText(savedOrgName);
    const savedSloganEn = localStorage.getItem('settings_customMsgEn') || localStorage.getItem('settings_customMsg') || 'May Lord Ganesha bless you with health, wealth, and prosperity!';
    const savedSloganTe = localStorage.getItem('settings_customMsgTe') || 'శ్రీ వినాయక స్వామి వారి కృపా కటాక్షాలు మీ కుటుంబానికి ఎల్లవేళలా ఉండాలని కోరుకుంటున్నాము!';
    const savedContact = localStorage.getItem('settings_contact') || '9876543210';
    const dMobile = getReceiptDonorMobile(item);
    const phoneLineEn = dMobile ? `\n📱 Mobile: ${dMobile}` : '';
    const phoneLineTe = dMobile ? `\n📱 ఫోన్ నంబర్: ${dMobile}` : '';
    
    const formattedDate = item.receipt_date ? new Date(item.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const amountVal = `₹${Number(item.amount).toLocaleString('en-IN')}`;

    const fullMessageEn = `🕉️ *${savedOrgName}* 🕉️\n\n📅 Date: ${formattedDate}\n🧾 Receipt No: ${item.receipt_number}\n👤 Donor Name: ${dName}${phoneLineEn}\n💰 Amount Paid: ${amountVal}\n\n${savedSloganEn}\n\n📞 Contact: ${savedContact}`;
    const fullMessageTe = `🕉️ *${savedOrgNameTe}* 🕉️\n\n📅 తేదీ: ${formattedDate}\n🧾 రసీదు సంఖ్య: ${item.receipt_number}\n👤 దాత పేరు: ${dNameTe}${phoneLineTe}\n💰 చెల్లించిన మొత్తం: ${amountVal}\n\n${savedSloganTe}\n\n📞 సంప్రదించవలసిన సంఖ్య: ${savedContact}`;

    const textToCopy = language === 'te' ? fullMessageTe : fullMessageEn;
    const label = language === 'te' ? 'Telugu' : 'English';

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyToast(`Receipt text (${label}) copied to clipboard!`);
      setTimeout(() => setCopyToast(null), 2500);
    } catch (err) {
      // Quiet fallback
    }
  };


  const downloadReceipt = async (receiptId: string) => {
    try {
      const activeElementsConfig = JSON.parse(localStorage.getItem('activeElements') || '{}');
      const templatesStore = JSON.parse(localStorage.getItem('templatesList') || '[]');
      const activeTemplateId = localStorage.getItem('activeTemplateId') || '1';
      const activeTemplate = templatesStore.find((t: any) => t.id === activeTemplateId);
      const bgBase64 = activeTemplate?.background || null;

      const savedOrgName = localStorage.getItem('settings_orgName') || 'Ganesh Youth Association';
      const savedAddress = localStorage.getItem('settings_address') || 'Colony Park, Phase 1, Hyderabad';
      const savedContact = localStorage.getItem('settings_contact') || '9876543210';
      const savedEmail = localStorage.getItem('settings_email') || 'contact@vinayaka.org';
      const savedSlogan = localStorage.getItem('settings_customMsg') || 'May Lord Ganesha bless you!';
      const savedLogo = localStorage.getItem('settings_logo') || '';

      // Override activeElementsConfig parameters dynamically from saved settings
      if (activeElementsConfig.logo && savedLogo) {
        activeElementsConfig.logo.logoData = savedLogo;
      }

      const res = await fetch(`/api/receipts/${receiptId}/download`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          template_elements: activeElementsConfig,
          template_background: bgBase64,
          logo_text: savedOrgName,
          org_name: savedOrgName,
          org_address: savedAddress,
          contact_number: savedContact,
          email_address: savedEmail,
          thank_you_message: savedSlogan
        })
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      alert('Error fetching download link');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Receipts Ledger</h1>
            {copyToast && (
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold animate-fade-in">
                ✓ {copyToast}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Issue and trace financial donation receipts</p>
        </div>
        <button 
          onClick={() => setCreateModal(true)} 
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-500/10 transition-colors"
        >
          <Plus className="h-4 w-4" /> Issue Receipt
        </button>
      </div>

      {/* Filter and search */}
      <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by receipt number, donor name, or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-brand-500 text-white"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Receipt No</th>
                <th className="p-4">Donor Details</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {receipts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/20 text-slate-300">
                  <td className="p-4 font-medium text-white">{item.receipt_number}</td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{getReceiptDonorName(item)}</p>
                    <p className="text-[10px] text-slate-400">📱 {getReceiptDonorMobile(item) || 'N/A'} {item.notes ? `• ${item.notes}` : ''}</p>
                  </td>
                  <td className="p-4 font-bold text-emerald-400">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">{item.payment_method}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-extrabold ${
                      item.status === 'ISSUED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5 flex justify-end">
                    <button onClick={() => setPreviewData(item)} className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setLangModal(item)} className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-emerald-400">
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => downloadReceipt(item.id)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-orange-50 text-orange-500">
                      <FileDown className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditModal(item);
                        setEditDonorName(getReceiptDonorName(item));
                        setEditDonorMobile(getReceiptDonorMobile(item));
                        setEditAmount(item.amount.toString());
                        setEditCategoryId(item.donation_category_id);
                        setEditPaymentMethod(item.payment_method);
                        setEditNotes(item.notes || '');
                      }} 
                      className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-amber-400"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete receipt ${item.receipt_number}?`)) {
                            try {
                              const res = await fetch(`/api/receipts/${item.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                // Update localStorage backup cache
                                if (activeEvent) {
                                  const localSaved = localStorage.getItem(`receipts_${activeEvent.id}`);
                                  if (localSaved) {
                                    const list = JSON.parse(localSaved).filter((r: any) => r.id !== item.id);
                                    localStorage.setItem(`receipts_${activeEvent.id}`, JSON.stringify(list));
                                  }
                                }
                                fetchReceipts();
                              } else {
                                alert('Failed to delete receipt');
                              }
                            } catch (e) {
                              alert('Error deleting receipt');
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
              {receipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No records found. Click "Issue Receipt" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Receipt Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl relative">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4 text-center">Issue Donation Receipt</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Donor Phone Number</label>
                <input required type="text" value={donorMobile} onChange={(e) => setDonorMobile(e.target.value)} placeholder="e.g. 9876543210" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Donor Name</label>
                <div className="relative flex items-center">
                  <input 
                    required 
                    type="text" 
                    value={donorName} 
                    onChange={(e) => setDonorName(e.target.value)} 
                    placeholder="Enter full name" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-2.5 pr-10 py-2.5 text-white" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                      if (!SpeechRec) {
                        alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
                        return;
                      }
                      const recognition = new SpeechRec();
                      recognition.lang = 'en-US';
                      recognition.interimResults = false;
                      recognition.maxAlternatives = 1;

                      recognition.onstart = () => {
                        setIsListening(true);
                      };
                      recognition.onresult = (event: any) => {
                        const transcript = event.results[0][0].transcript;
                        setDonorName(transcript);
                      };
                      recognition.onerror = () => {
                        alert("Voice capture failed. Try again.");
                        setIsListening(false);
                      };
                      recognition.onend = () => {
                        setIsListening(false);
                      };
                      recognition.start();
                    }}
                    className={`absolute right-2 p-1.5 rounded-full transition-colors ${
                      isListening ? 'bg-red-600 animate-pulse text-white' : 'text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800'
                    }`}
                    title="Voice type donor name"
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Donation Amount (INR)</label>
                <input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 501" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold text-emerald-400 text-sm" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-semibold"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreateModal(false)} className="w-1/2 py-2.5 border border-slate-800 text-slate-400 rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold">Issue Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Receipt Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl relative">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Edit Receipt: {editModal.receipt_number}</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Donor Name</label>
                  <input 
                    required 
                    type="text" 
                    value={editDonorName} 
                    onChange={(e) => setEditDonorName(e.target.value)} 
                    placeholder="Donor full name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Donor Phone Number</label>
                  <input 
                    required 
                    type="text" 
                    value={editDonorMobile} 
                    onChange={(e) => setEditDonorMobile(e.target.value)} 
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount (INR)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Donation Category</label>
                <select 
                  value={editCategoryId} 
                  onChange={(e) => setEditCategoryId(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <select 
                  value={editPaymentMethod} 
                  onChange={(e) => setEditPaymentMethod(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Description</label>
                <textarea 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-20" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="px-4 py-2 border border-slate-800 text-slate-400 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Language & Message customizer selection Modal */}
      {langModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl text-xs space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider text-center">Share Receipt Text Message</h3>
            
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
              <p className="font-bold text-amber-400 uppercase text-[10px]">Receipt Preview Info:</p>
              <div className="text-slate-300 space-y-1 text-[11px]">
                <p><span className="text-slate-500">Youth Name:</span> {localStorage.getItem('settings_orgName') || 'Ganesh Youth Association'}</p>
                <p><span className="text-slate-500">Receipt No:</span> {langModal.receipt_number}</p>
                <p><span className="text-slate-500">Donor Name:</span> {getReceiptDonorName(langModal)}</p>
                {getReceiptDonorMobile(langModal) && <p><span className="text-slate-500">Mobile:</span> {getReceiptDonorMobile(langModal)}</p>}
                <p><span className="text-slate-500">Amount Paid:</span> ₹{Number(langModal.amount).toLocaleString('en-IN')}</p>
                <p><span className="text-slate-500">Date:</span> {langModal.receipt_date ? new Date(langModal.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <p className="font-semibold text-slate-700">Share on WhatsApp:</p>
              <div className="flex gap-2">
                <button onClick={() => shareOnWhatsApp(langModal, 'en')} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5">
                  WhatsApp (English)
                </button>
                <button onClick={() => shareOnWhatsApp(langModal, 'te')} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5">
                  WhatsApp (తెలుగు)
                </button>
              </div>
              
              <p className="font-semibold text-slate-700 pt-1">Copy Message Text (Instagram / FB / Chat):</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => copyReceiptWithLink(langModal, 'en')}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-4 w-4" /> Copy English Text
                </button>
                <button 
                  onClick={() => copyReceiptWithLink(langModal, 'te')}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-4 w-4" /> Copy Telugu Text
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Native App Share (Mobile / Tablet / Supporting Browsers) */}
                <button 
                  onClick={() => shareNativeMedia(langModal, 'en')} 
                  className="py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-lg col-span-2 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" /> Share via Installed Apps (Native)
                </button>

                {/* Telegram Share */}
                <button 
                  onClick={() => {
                    const savedOrgName = localStorage.getItem('settings_orgName') || 'Ganesh Youth Association';
                    const savedSlogan = localStorage.getItem('settings_customMsgEn') || localStorage.getItem('settings_customMsg') || 'May Lord Ganesha bless you!';
                    const formattedDate = langModal.receipt_date ? new Date(langModal.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    const dMob = getReceiptDonorMobile(langModal);
                    const mobStr = dMob ? `\nPhone: ${dMob}` : '';
                    const msg = `🕉️ *${savedOrgName}* 🕉️\n\nDate: ${formattedDate}\nReceipt No: ${langModal.receipt_number}\nDonor Name: ${getReceiptDonorName(langModal)}${mobStr}\nAmount Paid: ₹${Number(langModal.amount).toLocaleString('en-IN')}\n\n_${savedSlogan}_`;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(msg)}`, '_blank');
                  }} 
                  className="py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg"
                >
                  Telegram
                </button>

                {/* Email Share */}
                <button 
                  onClick={() => {
                    const savedOrgName = localStorage.getItem('settings_orgName') || 'Ganesh Youth Association';
                    const savedSlogan = localStorage.getItem('settings_customMsgEn') || localStorage.getItem('settings_customMsg') || 'May Lord Ganesha bless you!';
                    const formattedDate = langModal.receipt_date ? new Date(langModal.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    const dMob = getReceiptDonorMobile(langModal);
                    const mobStr = dMob ? `\nPhone: ${dMob}` : '';
                    const msg = `🕉️ *${savedOrgName}* 🕉️\n\nReceipt No: ${langModal.receipt_number}\nDate: ${formattedDate}\nDonor Name: ${getReceiptDonorName(langModal)}${mobStr}\nAmount: INR ${langModal.amount}\n\n${savedSlogan}`;
                    window.open(`mailto:?subject=Donation%20Receipt%20${langModal.receipt_number}&body=${encodeURIComponent(msg)}`, '_blank');
                  }} 
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700"
                >
                  Email Message
                </button>
              </div>
            </div>
            
            <button onClick={() => setLangModal(null)} className="w-full py-2 border border-slate-800 text-slate-400 rounded-lg font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {/* Preview & Cancellation Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl text-xs space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Receipt Details: {previewData.receipt_number}</h3>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <p><span className="text-slate-400">Amount:</span> <span className="font-bold text-emerald-400">₹{Number(previewData.amount).toLocaleString('en-IN')}</span></p>
              <p><span className="text-slate-400">Payment Mode:</span> {previewData.payment_method}</p>
              <p><span className="text-slate-400">Date:</span> {new Date(previewData.receipt_date).toLocaleString()}</p>
              <p><span className="text-slate-400">Status:</span> {previewData.status}</p>
              {previewData.cancellation_reason && <p className="text-red-400"><span className="text-slate-400">Reason cancelled:</span> {previewData.cancellation_reason}</p>}
            </div>

            {/* Cancel Actions for Admins */}
            {previewData.status === 'ISSUED' && (user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-slate-400 mb-1">Reason for cancellation</label>
                <input required type="text" placeholder="Explain why this receipt is voided..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                <button onClick={() => handleCancelReceipt(previewData.id)} className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                  <XCircle className="h-4 w-4" /> Void / Cancel Receipt
                </button>
              </div>
            )}

            <button onClick={() => setPreviewData(null)} className="w-full py-2 border border-slate-800 text-slate-400 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
