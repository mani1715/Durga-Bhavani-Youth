export type Language = 'te' | 'en';

export interface TranslationDict {
  header: {
    village: string;
    orgName: string;
    festivalTitle: string;
    navHome: string;
    navToday: string;
    navSchedule: string;
    navDonations: string;
    navGallery: string;
    navAnnouncements: string;
    navContact: string;
    committeeLogin: string;
  };
  hero: {
    tagline: string;
    titleMain: string;
    subtitleOrg: string;
    dates: string;
    welcomeMsg: string;
    btnToday: string;
    btnDonations: string;
    statDays: string;
    statDaysLabel: string;
    statAlankarams: string;
    statAlankaramsLabel: string;
    statGramotsavam: string;
    statGramotsavamLabel: string;
    photoCaptionTitle: string;
    photoCaptionMantra: string;
    skipToProgrammes: string;
    scrollForDarshan: string;
  };
  today: {
    badge: string;
    titleUpcoming: string;
    subtitleUpcoming: string;
    titleToday: string;
    subtitleToday: string;
    titleConcluded: string;
    dayPrefix: string;
    activitiesHeading: string;
    couplesHeading: string;
    noActivitiesMsg: string;
    noCouplesMsg: string;
    timePending: string;
    btnViewAll: string;
    concludedMsg: string;
  };
  schedule: {
    badge: string;
    heading: string;
    subheading: string;
    dayPrefix: string;
    btnViewDetails: string;
    arrivalBadge: string;
    gramotsavamBadge: string;
  };
  donations: {
    badge: string;
    heading: string;
    subheading: string;
    statTotal: string;
    statDonors: string;
    donorsUnit: string;
    filteredTotal: string;
    filteredCount: string;
    statMaterials: string;
    materialsUnit: string;
    filterMoney: string;
    filterMaterial: string;
    filterAll: string;
    allCategories: string;
    sortHighest: string;
    sortNewest: string;
    resetFilters: string;
    searchPlaceholder: string;
    thDonor: string;
    thCategory: string;
    thDetails: string;
    thDate: string;
    thVillage: string;
    thAmount: string;
    loading: string;
    noResults: string;
    anonymous: string;
    privacyNote: string;
  };
  gallery: {
    badge: string;
    heading: string;
    subheading: string;
    tabAll: string;
    tabDayPrefix: string;
    btnEnlarge: string;
    emptyMsg: string;
  };
  announcements: {
    badge: string;
    heading: string;
    subheading: string;
    tagNotice: string;
    emptyMsg: string;
  };
  footer: {
    orgName: string;
    village: string;
    orgDesc: string;
    contactHeading: string;
    contactDesc: string;
    contactRole: string;
    rights: string;
    blessing: string;
    committeeLogin: string;
  };
  modal: {
    dayPrefix: string;
    alankaramSuffix: string;
    activitiesHeading: string;
    couplesHeading: string;
    timePending: string;
    couplesPending: string;
    btnClose: string;
  };
  login: {
    backHome: string;
    title: string;
    orgName: string;
    portalSub: string;
    labelIdentifier: string;
    placeholderIdentifier: string;
    labelPassword: string;
    placeholderPassword: string;
    btnSubmit: string;
    btnLoading: string;
    footerNote: string;
    defaultError: string;
    invalidCreds: string;
  };
  layout: {
    orgName: string;
    subTitle: string;
    mobileTitle: string;
    logout: string;
    operations: string;
    analytics: string;
    configuration: string;
    administration: string;
  };
  portal: {
    viewWebsite: string;
    overview: string;
    festivalManagement: string;
    donations: string;
    expenses: string;
    reports: string;
    committeeMembers: string;
    settings: string;
    backups: string;
    mainSection: string;
    adminSection: string;
    logout: string;
    loggedInAs: string;
  };
  portalDonations: {
    title: string;
    subtitle: string;
    btnAdd: string;
    tabLedger: string;
    tabDonors: string;
    cardTotal: string;
    cardToday: string;
    cardCount: string;
    unitDevotees: string;
    searchPlaceholder: string;
    thDate: string;
    thDonor: string;
    thAmount: string;
    thMethod: string;
    thStatus: string;
    thActions: string;
    emptyTitle: string;
    emptySubtitle: string;
    modalAddTitle: string;
    modalEditTitle: string;
    modalDetailTitle: string;
    lblDonorName: string;
    lblAmount: string;
    lblDate: string;
    lblMethod: string;
    lblVisibility: string;
    optPublic: string;
    optAnon: string;
    lblVillage: string;
    lblPhone: string;
    lblNotes: string;
    btnSave: string;
    btnCancel: string;
    btnVoid: string;
    btnDelete: string;
  };
  portalOverview: {
    title: string;
    subtitle: string;
    statTodayDonations: string;
    statTotalDonations: string;
    statTotalDonors: string;
    statTodayExpenses: string;
    statNetBalance: string;
    quickActions: string;
    btnAddDonation: string;
    btnLogExpense: string;
    btnManageFestival: string;
    recentDonationsTitle: string;
    viewAllDonations: string;
    festivalHighlightsTitle: string;
    daysCount: string;
    alankaramsCount: string;
  };
}

export const translations: Record<Language, TranslationDict> = {
  te: {
    header: {
      village: 'గరువుపాలెం',
      orgName: 'దుర్గాభవాని యూత్',
      festivalTitle: '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు',
      navHome: 'ప్రారంభం',
      navToday: 'నేటి పూజలు',
      navSchedule: 'కార్యక్రమాలు',
      navDonations: 'విరాళాలు',
      navGallery: 'చిత్రమాలిక',
      navAnnouncements: 'ప్రకటనలు',
      navContact: 'సంప్రదించండి',
      committeeLogin: 'కమిటీ లాగిన్',
    },
    hero: {
      tagline: 'గరువుపాలెం గ్రామం • 31వ వార్షిక వేడుకలు',
      titleMain: '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు',
      subtitleOrg: 'దుర్గాభవాని యూత్ — గరువుపాలెం',
      dates: 'తేదీలు: 10 అక్టోబర్ 2026 నుండి 21 అక్టోబర్ 2026 వరకు',
      welcomeMsg: 'శ్రీ కనకదుర్గా అమ్మవారి 31వ దేవీ శరన్నవరాత్రి మహోత్సవముల సందర్భంగా గ్రామ ప్రజలకు, భక్తులకు హృదయపూర్వక ఆహ్వానం. ప్రతిరోజూ ప్రత్యేక అలంకార దర్శనాలు, శాస్త్రోక్త దంపతుల పూజలు, తీర్థప్రసాద వితరణ మరియు భజన కార్యక్రమములు నిర్వహించబడును.',
      btnToday: 'నేటి పూజలు చూడండి',
      btnDonations: 'స్వీకరించిన విరాళాలు',
      statDays: '12',
      statDaysLabel: 'రోజుల ఉత్సవాలు',
      statAlankarams: '10',
      statAlankaramsLabel: 'దివ్య అలంకారాలు',
      statGramotsavam: '21 అక్టోబర్',
      statGramotsavamLabel: 'గ్రామోత్సవం',
      photoCaptionTitle: 'శ్రీ కనకదుర్గా దేవి — గరువుపాలెం',
      photoCaptionMantra: 'సర్వమంగళ మాంగల్యే శివే సర్వార్థ సాధికే',
      skipToProgrammes: 'కార్యక్రమాలకు వెళ్లండి',
      scrollForDarshan: 'దివ్య దర్శనం కోసం స్క్రోల్ చేయండి',
    },
    today: {
      badge: 'ఈ రోజు విశేషాలు',
      titleUpcoming: 'రాబోయే ప్రారంభ కార్యక్రమం',
      subtitleUpcoming: '10 అక్టోబర్ 2026న ప్రారంభం కానున్న నవరాత్రి ప్రారంభ కార్యక్రమ వివరాలు.',
      titleToday: 'నేటి పూజా కార్యక్రమాలు & దంపతులు',
      subtitleToday: 'శరన్నవరాత్రి మహోత్సవముల రోజువారీ అలంకారం మరియు పూజా విధి వివరాలు.',
      titleConcluded: 'ఉత్సవ సమాప్తి',
      dayPrefix: 'రోజు',
      activitiesHeading: 'కార్యక్రమముల సమయాలు',
      couplesHeading: 'పూజ నిర్వహించే దంపతులు',
      noActivitiesMsg: 'సమయాలు త్వరలో తెలియజేస్తాము.',
      noCouplesMsg: 'ఈ రోజు దంపతుల వివరాలు త్వరలో నమోదు చేయబడును.',
      timePending: 'సమయం త్వరలో',
      btnViewAll: 'పూర్తి కార్యక్రమాల ప్రణాళిక చూడండి',
      concludedMsg: '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు విజయవంతంగా ముగిసినవి. ఉత్సవ చిత్రమాలిక మరియు విరాళాల వివరాలను దిగువన చూడవచ్చు.',
    },
    schedule: {
      badge: 'సంపూర్ణ ప్రణాళిక',
      heading: '12 రోజుల నవరాత్రి ఉత్సవ ప్రణాళిక',
      subheading: '10 అక్టోబర్ 2026న అమ్మవారి ఆగమనం నుండి 21 అక్టోబర్ 2026న గ్రామోత్సవం వరకు 12 రోజుల పూర్తి వివరాలు.',
      dayPrefix: 'రోజు',
      btnViewDetails: 'సంపూర్ణ వివరాలు చూడండి',
      arrivalBadge: 'ఆగమనం',
      gramotsavamBadge: 'గ్రామోత్సవం',
    },
    donations: {
      badge: 'పారదర్శక నిర్వహణ',
      heading: 'స్వీకరించిన విరాళాల పట్టిక',
      subheading: '31వ దేవీ శరన్నవరాత్రి మహోత్సవములకు భక్తులు సమర్పించిన విరాళాల వివరాలు.',
      statTotal: 'సేకరించిన మొత్తం నగదు విరాళాలు',
      statDonors: 'నగదు విరాళ దాతలు',
      donorsUnit: 'భక్తులు',
      statMaterials: 'వస్తు రూప సమర్పణలు',
      materialsUnit: 'సమర్పణలు',
      filterAll: 'అన్ని సమర్పణలు',
      filterMoney: 'నగదు విరాళాలు',
      filterMaterial: 'వస్తు రూప సమర్పణలు',
      sortHighest: 'అత్యధిక మొత్తం మొదటిగా',
      sortNewest: 'ఇటీవలి విరాళాలు',
      allCategories: 'అన్ని విభాగాలు',
      resetFilters: 'ఫిల్టర్లు క్లియర్ చేయండి',
      filteredTotal: 'ఎంపిక చేసిన నగదు మొత్తం',
      filteredCount: 'ఎంపిక చేసిన రికార్డులు',
      searchPlaceholder: 'దాత పేరు లేదా వివరాలు వెతకండి...',
      thDonor: 'దాత పేరు',
      thCategory: 'విభాగం',
      thDetails: 'సమర్పణ వివరాలు',
      thDate: 'తేదీ',
      thVillage: 'ఊరు / గ్రామం',
      thAmount: 'మొత్తం (₹) / విలువ',
      loading: 'వివరాలు సేకరిస్తున్నాము...',
      noResults: 'ఎటువంటి విరాళాలు కనిపించలేదు.',
      anonymous: 'అజ్ఞాత దాత',
      privacyNote: '* భక్తుల గోప్యత నిమిత్తం ఫోన్ నంబర్లు మరియు వ్యక్తిగత చిరునామాలు బహిరంగంగా చూపబడవు.',
    },
    gallery: {
      badge: 'దివ్య దర్శనములు',
      heading: 'ఉత్సవ చిత్రమాలిక',
      subheading: 'శ్రీ కనకదుర్గా అమ్మవారి నవరాత్రి అలంకారాలు మరియు పూజా కార్యక్రమాల చిత్రాలు.',
      tabAll: 'అన్ని రోజులు',
      tabDayPrefix: 'రోజు',
      btnEnlarge: 'పెద్దదిగా చూడండి',
      emptyMsg: 'ఈ విభాగంలో చిత్రాలు త్వరలో పొందుపరచబడతాయి.',
    },
    announcements: {
      badge: 'ముఖ్యాంశాలు',
      heading: 'ప్రకటనలు & సూచనలు',
      subheading: 'భక్తులకు ముఖ్య గమనికలు మరియు సూచనల వివరాలు.',
      tagNotice: 'ప్రకటన',
      emptyMsg: 'ప్రస్తుతం ఎటువంటి కొత్త ప్రకటనలు లేవు.',
    },
    footer: {
      orgName: 'దుర్గాభవాని యూత్',
      village: 'గరువుపాలెం',
      orgDesc: '31వ దేవీ శరన్నవరాత్రి మహోత్సవముల నిర్వహణ సమితి. గ్రామ శ్రేయస్సు మరియు అమ్మవారి దివ్య కృపాకటాక్షములకై అత్యంత భక్తిప్రపత్తులతో నిర్వహించబడును.',
      contactHeading: 'యూత్ కమిటీ సంప్రదింపు ఫోన్ నంబర్లు (Tap to Call)',
      contactDesc: 'విరాళాల సమర్పణ కొరకు మరియు ప్రత్యేక పూజా వివరాల కొరకు కమిటీ సభ్యులను సంప్రదించగలరు:',
      contactRole: 'కమిటీ సభ్యులు',
      rights: '© 2026 దుర్గాభవాని యూత్, గరువుపాలెం. సర్వ హక్కులూ ప్రత్యేకించబడినవి.',
      blessing: 'సర్వేజనా సుఖినోభవంతు',
      committeeLogin: 'కమిటీ లాగిన్',
    },
    modal: {
      dayPrefix: 'రోజు',
      alankaramSuffix: 'అలంకారం',
      activitiesHeading: 'కార్యక్రమముల దినచర్య (Schedule)',
      couplesHeading: 'పూజ నిర్వహించే దంపతులు (Pooja Couples)',
      timePending: 'సమయాలు త్వరలో తెలియజేస్తాము.',
      couplesPending: 'ఈ దినము దంపతుల వివరాలు నవీకరించబడుతున్నాయి.',
      btnClose: 'ముగించు (Close)',
    },
    login: {
      backHome: 'ముఖద్వారానికి తిరిగి వెళ్లండి',
      title: 'కమిటీ సభ్యుల లాగిన్',
      orgName: 'దుర్గాభవాని యూత్, గరువుపాలెం',
      portalSub: '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు - నిర్వహణ పోర్టల్',
      labelIdentifier: 'ఈమెయిల్ లేదా ఫోన్ నంబర్',
      placeholderIdentifier: 'e.g. admin@festival.com లేదా 8897557545',
      labelPassword: 'పాస్‌వర్డ్',
      placeholderPassword: '••••••••',
      btnSubmit: 'పోర్టల్‌లోకి ప్రవేశించండి',
      btnLoading: 'పరిశీలిస్తున్నాము...',
      footerNote: 'ఈ లాగిన్ కేవలం దుర్గాభవాని యూత్ కమిటీ సభ్యులకు మాత్రమే.',
      defaultError: 'ప్రవేశించలేకపోయాము. దయచేసి వివరాలు సరిచూసుకోండి.',
      invalidCreds: 'ఈమెయిల్ / ఫోన్ నంబర్ లేదా పాస్‌వర్డ్ తప్పుగా ఉంది.',
    },
    layout: {
      orgName: 'దుర్గాభవాని యూత్',
      subTitle: 'గరువుపాలెం - 31వ దేవీ నవరాత్రులు',
      mobileTitle: 'దుర్గాభవాని యూత్, గరువుపాలెం',
      logout: 'లాగ్‌అవుట్',
      operations: 'ప్రధాన నిర్వహణ',
      analytics: 'విశ్లేషణ',
      configuration: 'అమరికలు',
      administration: 'పరిపాలన',
    },
    portal: {
      viewWebsite: 'వెబ్‌సైట్ చూడండి',
      overview: 'అవలోకనం (Overview)',
      festivalManagement: 'నవరాత్రి నిర్వహణ',
      donations: 'విరాళాలు (Donations)',
      expenses: 'ఖర్చులు (Expenses)',
      reports: 'నివేదికలు (Reports)',
      committeeMembers: 'కమిటీ సభ్యులు',
      settings: 'అమరికలు (Settings)',
      backups: 'బ్యాకప్ కేంద్రం',
      mainSection: 'ప్రధాన విధులు (MAIN)',
      adminSection: 'పరిపాలన (ADMINISTRATION)',
      logout: 'లాగ్‌అవుట్',
      loggedInAs: 'లాగిన్ అయినవారు',
    },
    portalDonations: {
      title: 'విరాళాల నిర్వహణ',
      subtitle: 'భక్తుల నుండి అందిన పవిత్ర కానుకలు మరియు విరాళాల పూర్తి వివరాలు.',
      btnAdd: 'విరాళం నమోదు (+)',
      tabLedger: 'విరాళాల పట్టిక',
      tabDonors: 'దాతల డైరెక్టరీ & చరిత్ర',
      cardTotal: 'మొత్తం స్వీకరించిన విరాళాలు',
      cardToday: 'ఈ రోజు స్వీకరించిన మొత్తం',
      cardCount: 'మొత్తం దాతల సంఖ్య',
      unitDevotees: 'మంది భక్తులు',
      searchPlaceholder: 'దాత పేరు, ఫోన్ నంబర్ లేదా గ్రామం ద్వారా శోధించండి...',
      thDate: 'తేదీ',
      thDonor: 'దాత వివరాలు',
      thAmount: 'మొత్తం (₹)',
      thMethod: 'చెల్లింపు విధానం',
      thStatus: 'స్థితి',
      thActions: 'చర్యలు',
      emptyTitle: 'ఇంతవరకు విరాళాలు నమోదు కాలేదు',
      emptySubtitle: 'మొదటి విరాళాన్ని నమోదు చేయడానికి పైన ఉన్న బటన్ క్లిక్ చేయండి.',
      modalAddTitle: 'నూతన విరాళం నమోదు',
      modalEditTitle: 'విరాళం వివరాల సవరణ',
      modalDetailTitle: 'విరాళం పూర్తి రికార్డు',
      lblDonorName: 'దాత పేరు *',
      lblAmount: 'మొత్తం (₹) *',
      lblDate: 'స్వీకరించిన తేదీ *',
      lblMethod: 'చెల్లింపు విధానం',
      lblVisibility: 'పేరు ప్రదర్శన ప్రాధాన్యత',
      optPublic: 'దాత పేరు బహిరంగంగా చూపించు',
      optAnon: 'అజ్ఞాత దాత (శ్రీ కనకదుర్గమ్మ భక్తులు)',
      lblVillage: 'గ్రామం / పట్టణం',
      lblPhone: 'ఫోన్ నంబర్ (గోప్యంగా భద్రపరచబడును)',
      lblNotes: 'గమనికలు / గోత్ర నామాలు / పూజ రకం',
      btnSave: 'నమోదు చేయండి',
      btnCancel: 'రద్దు చేయండి',
      btnVoid: 'రద్దు చేయి (Void)',
      btnDelete: 'తొలగించు',
    },
    portalOverview: {
      title: 'కమిటీ నిర్వహణ అవలోకనం',
      subtitle: '31వ దేవీ శరన్నవరాత్రి మహోత్సవముల ప్రత్యక్ష సేవా & నిర్వహణ కేంద్రం.',
      statTodayDonations: 'నేటి విరాళాలు',
      statTotalDonations: 'మొత్తం విరాళాలు',
      statTotalDonors: 'నమోదైన దాతలు',
      statTodayExpenses: 'నేటి ఖర్చులు',
      statNetBalance: 'ప్రస్తుత నిల్వ',
      quickActions: 'త్వరిత చర్యలు',
      btnAddDonation: 'విరాళం నమోదు',
      btnLogExpense: 'ఖర్చు నమోదు',
      btnManageFestival: 'నవరాత్రి పూజలు నిర్వహించండి',
      recentDonationsTitle: 'ఇటీవల అందిన విరాళాలు',
      viewAllDonations: 'అన్ని విరాళాలు చూడండి →',
      festivalHighlightsTitle: 'నవరాత్రి ఉత్సవ ప్రణాళిక',
      daysCount: '12 రోజుల ఉత్సవాలు',
      alankaramsCount: '10 దివ్య అలంకారాలు',
    },
  },
  en: {
    header: {
      village: 'Garuvupalem',
      orgName: 'Durga Bhavani Youth',
      festivalTitle: '31st Devi Sharannavaratri Mahotsavam',
      navHome: 'Home',
      navToday: "Today's Pooja",
      navSchedule: 'Programmes',
      navDonations: 'Donations',
      navGallery: 'Gallery',
      navAnnouncements: 'Notices',
      navContact: 'Contact',
      committeeLogin: 'Committee Login',
    },
    hero: {
      tagline: 'Garuvupalem Village • 31st Annual Celebrations',
      titleMain: '31st Devi Sharannavaratri Mahotsavam',
      subtitleOrg: 'Durga Bhavani Youth — Garuvupalem',
      dates: 'Dates: 10 October 2026 to 21 October 2026',
      welcomeMsg: 'A warm invitation to all village residents and devotees on the auspicious occasion of the 31st Devi Sharannavaratri Celebrations of Sri Kanaka Durga Devi. Daily divine alankaram darshanams, traditional poojas, prasadam distribution, and bhajan programmes are celebrated with devotion.',
      btnToday: "View Today's Pooja",
      btnDonations: 'View Donations',
      statDays: '12',
      statDaysLabel: 'Festival Days',
      statAlankarams: '10',
      statAlankaramsLabel: 'Divine Alankarams',
      statGramotsavam: '21 Oct',
      statGramotsavamLabel: 'Gramotsavam',
      photoCaptionTitle: 'Sri Kanaka Durga Devi — Garuvupalem',
      photoCaptionMantra: 'Sarva Mangala Maangalye Shive Sarvaartha Saadhike',
      skipToProgrammes: 'Skip to Programmes',
      scrollForDarshan: 'Scroll for Divine Darshan',
    },
    today: {
      badge: "Today's Highlights",
      titleUpcoming: 'Upcoming Opening Programme',
      subtitleUpcoming: 'Opening programme schedule commencing on 10 October 2026.',
      titleToday: "Today's Programme & Pooja Couples",
      subtitleToday: 'Daily divine alankaram and ritual pooja schedule.',
      titleConcluded: 'Festival Concluded',
      dayPrefix: 'Day',
      activitiesHeading: 'Programme Schedule & Timings',
      couplesHeading: 'Pooja Performing Couples',
      noActivitiesMsg: 'Timings will be announced soon.',
      noCouplesMsg: 'Couple details will be announced soon.',
      timePending: 'Time to be announced',
      btnViewAll: 'View Full Schedule',
      concludedMsg: 'The 31st Devi Sharannavaratri Mahotsavam has concluded with divine blessings. Devotees can view the festival gallery and donations below.',
    },
    schedule: {
      badge: 'Full Schedule',
      heading: '12-Day Navaratri Festival Schedule',
      subheading: 'Complete schedule from the arrival of Ammavaru on 10 October 2026 to the grand Gramotsavam on 21 October 2026.',
      dayPrefix: 'Day',
      btnViewDetails: 'View Details',
      arrivalBadge: 'Arrival',
      gramotsavamBadge: 'Gramotsavam',
    },
    donations: {
      badge: 'Community Contributions',
      heading: 'Donations Received',
      subheading: 'Record of devotee contributions for the 31st Devi Sharannavaratri Celebrations.',
      statTotal: 'Total Monetary Donations',
      statDonors: 'Monetary Donors',
      donorsUnit: 'Devotees',
      statMaterials: 'Material Offerings',
      materialsUnit: 'Offerings',
      filterAll: 'All Contributions',
      filterMoney: 'Monetary Donations',
      filterMaterial: 'Materials & Services',
      sortHighest: 'Highest Amount First',
      sortNewest: 'Newest First',
      allCategories: 'All Categories',
      resetFilters: 'Reset Filters',
      filteredTotal: 'Filtered Monetary Total',
      filteredCount: 'Filtered Records',
      searchPlaceholder: 'Search by donor name or item...',
      thDonor: 'Donor Name',
      thCategory: 'Category',
      thDetails: 'Contribution Details',
      thDate: 'Date',
      thVillage: 'Village / Town',
      thAmount: 'Amount (₹) / Value',
      loading: 'Loading contribution records...',
      noResults: 'No contributions found.',
      anonymous: 'Anonymous Devotee',
      privacyNote: '* Phone numbers and personal addresses are kept private for donor confidentiality.',
    },
    gallery: {
      badge: 'Divine Darshanam',
      heading: 'Festival Photo Gallery',
      subheading: 'Photographs of Sri Kanaka Durga Devi alankarams and festival poojas.',
      tabAll: 'All Days',
      tabDayPrefix: 'Day',
      btnEnlarge: 'View Full Size',
      emptyMsg: 'Photos for this section will be uploaded soon.',
    },
    announcements: {
      badge: 'Updates',
      heading: 'Announcements & Notices',
      subheading: 'Important notices, schedule updates, and cultural event details for devotees.',
      tagNotice: 'Notice',
      emptyMsg: 'No new announcements at this time.',
    },
    footer: {
      orgName: 'Durga Bhavani Youth',
      village: 'Garuvupalem',
      orgDesc: 'Organising Committee of the 31st Devi Sharannavaratri Mahotsavam. Conducted annually with deep devotion for the welfare of the village and the grace of Ammavaru.',
      contactHeading: 'Youth Committee Contact Numbers (Tap to Call)',
      contactDesc: 'For donations, contributions, and pooja arrangements, feel free to contact committee members:',
      contactRole: 'Committee Member',
      rights: '© 2026 Durga Bhavani Youth, Garuvupalem. All rights reserved.',
      blessing: 'Sarve Jana Sukhino Bhavantu',
      committeeLogin: 'Committee Login',
    },
    modal: {
      dayPrefix: 'Day',
      alankaramSuffix: 'Alankaram',
      activitiesHeading: 'Programme Schedule',
      couplesHeading: 'Pooja Performing Couples',
      timePending: 'Timings will be updated soon.',
      couplesPending: 'Couple details for this day are being updated.',
      btnClose: 'Close',
    },
    login: {
      backHome: 'Back to Home',
      title: 'Committee Member Login',
      orgName: 'Durga Bhavani Youth, Garuvupalem',
      portalSub: '31st Devi Sharannavaratri Mahotsavam - Management Portal',
      labelIdentifier: 'Email or Phone Number',
      placeholderIdentifier: 'e.g. admin@festival.com or 8897557545',
      labelPassword: 'Password',
      placeholderPassword: '••••••••',
      btnSubmit: 'Login to Portal',
      btnLoading: 'Signing in...',
      footerNote: 'This login is strictly for Durga Bhavani Youth committee members only.',
      defaultError: 'Unable to sign in. Please verify your details.',
      invalidCreds: 'Invalid email/phone number or password',
    },
    layout: {
      orgName: 'Durga Bhavani Youth',
      subTitle: 'Garuvupalem - 31st Devi Navaratri',
      mobileTitle: 'Durga Bhavani Youth, Garuvupalem',
      logout: 'Log out',
      operations: 'MAIN',
      analytics: 'ANALYTICS',
      configuration: 'CONFIGURATION',
      administration: 'ADMINISTRATION',
    },
    portal: {
      viewWebsite: 'View Website',
      overview: 'Overview',
      festivalManagement: 'Festival Management',
      donations: 'Donations',
      expenses: 'Expenses',
      reports: 'Reports',
      committeeMembers: 'Committee Members',
      settings: 'Settings',
      backups: 'Backups',
      mainSection: 'MAIN',
      adminSection: 'ADMINISTRATION',
      logout: 'Log out',
      loggedInAs: 'Logged in as',
    },
    portalDonations: {
      title: 'Donations Management',
      subtitle: 'Complete financial record of devotee contributions and offerings.',
      btnAdd: 'Add Donation (+)',
      tabLedger: 'Donations Ledger',
      tabDonors: 'Donor Directory & History',
      cardTotal: 'Total Received',
      cardToday: "Today's Received",
      cardCount: 'Total Donors',
      unitDevotees: 'Devotees',
      searchPlaceholder: 'Search by donor name, phone, or village...',
      thDate: 'Date',
      thDonor: 'Donor Details',
      thAmount: 'Amount (₹)',
      thMethod: 'Payment Method',
      thStatus: 'Status',
      thActions: 'Actions',
      emptyTitle: 'No donations recorded yet',
      emptySubtitle: 'Click the button above to record the first received donation.',
      modalAddTitle: 'Add New Donation',
      modalEditTitle: 'Edit Donation Details',
      modalDetailTitle: 'Donation Record Details',
      lblDonorName: 'Donor Name *',
      lblAmount: 'Amount Received (₹) *',
      lblDate: 'Received Date *',
      lblMethod: 'Payment Method',
      lblVisibility: 'Public Name Visibility',
      optPublic: 'Show donor name publicly',
      optAnon: 'Anonymous Devotee (Sri Kanakadurga Devotee)',
      lblVillage: 'Village / Town',
      lblPhone: 'Phone Number (Private)',
      lblNotes: 'Notes / Gothram / Pooja Type',
      btnSave: 'Save Donation',
      btnCancel: 'Cancel',
      btnVoid: 'Void Donation',
      btnDelete: 'Delete',
    },
    portalOverview: {
      title: 'Committee Operations Overview',
      subtitle: 'Live management portal for the 31st Devi Sharannavaratri Celebrations.',
      statTodayDonations: "Today's Donations",
      statTotalDonations: 'Total Donations',
      statTotalDonors: 'Registered Donors',
      statTodayExpenses: "Today's Expenses",
      statNetBalance: 'Net Balance',
      quickActions: 'Quick Actions',
      btnAddDonation: 'Add Donation',
      btnLogExpense: 'Log Expense',
      btnManageFestival: 'Manage Festival Programmes',
      recentDonationsTitle: 'Recent Donations Received',
      viewAllDonations: 'View All Donations →',
      festivalHighlightsTitle: 'Navaratri Festival Highlights',
      daysCount: '12 Festival Days',
      alankaramsCount: '10 Divine Alankarams',
    },
  },
};

// Localized Date Formatter
export function formatFestivalDate(dateStr?: string | null, lang: Language = 'te'): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  try {
    const cleanDate = dateStr.includes('T') 
      ? dateStr.split('T')[0] 
      : (dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr);
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      const year = parts[0];

      if (isNaN(day) || isNaN(month)) return dateStr;

      const teluguMonths = [
        '', 'జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్',
        'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'
      ];
      const englishMonths = [
        '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      if (lang === 'te') {
        return `${day} ${teluguMonths[month] || parts[1]} ${year}`;
      } else {
        return `${day} ${englishMonths[month] || parts[1]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr || '';
  }
}

// Fallback helper: Returns English string if selected and present, otherwise falls back to Telugu
export function getLocalizedText(
  lang: Language, 
  teluguVal?: string | null, 
  englishVal?: string | null
): string {
  if (lang === 'en' && englishVal && englishVal.trim().length > 0) {
    return englishVal;
  }
  return teluguVal || '';
}

export interface PhaseLabels {
  navLabel: string;
  navHref: string;
  heroBtn: string;
  heroBtnHref: string;
  sectionBadge: string;
  sectionTitle: string;
  sectionSubtitle: string;
}

export function getPhaseLabels(
  phase: 'BEFORE_FESTIVAL' | 'DURING_FESTIVAL' | 'AFTER_FESTIVAL' | undefined,
  lang: Language
): PhaseLabels {
  if (phase === 'BEFORE_FESTIVAL') {
    return {
      navLabel: lang === 'te' ? 'రాబోయే కార్యక్రమం' : 'Upcoming Programme',
      navHref: '#today',
      heroBtn: lang === 'te' ? 'రాబోయే కార్యక్రమం చూడండి' : 'View Upcoming Programme',
      heroBtnHref: '#today',
      sectionBadge: lang === 'te' ? 'రాబోయే కార్యక్రమం' : 'Upcoming Programme',
      sectionTitle: lang === 'te' ? 'రాబోయే ప్రారంభ కార్యక్రమం' : 'Upcoming Opening Programme',
      sectionSubtitle: lang === 'te' 
        ? '10 అక్టోబర్ 2026న ప్రారంభం కానున్న నవరాత్రి ప్రారంభ కార్యక్రమ వివరాలు.' 
        : 'Opening programme schedule commencing on 10 October 2026.',
    };
  } else if (phase === 'AFTER_FESTIVAL') {
    return {
      navLabel: lang === 'te' ? 'ఉత్సవ జ్ఞాపకాలు' : 'Festival Memories',
      navHref: '#gallery',
      heroBtn: lang === 'te' ? 'ఉత్సవ జ్ఞాపకాలు చూడండి' : 'View Festival Memories',
      heroBtnHref: '#gallery',
      sectionBadge: lang === 'te' ? 'ఉత్సవ జ్ఞాపకాలు' : 'Festival Memories',
      sectionTitle: lang === 'te' ? 'ఉత్సవ సమాప్తి & జ్ఞాపకాలు' : 'Festival Concluded & Memories',
      sectionSubtitle: lang === 'te' 
        ? '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు విజయవంతంగా ముగిసినవి. ఉత్సవ చిత్రమాలిక మరియు వివరాలను క్రింద చూడవచ్చు.' 
        : 'The 31st Devi Sharannavaratri Mahotsavam has concluded with divine blessings. Devotees can view the festival gallery and records below.',
    };
  } else {
    // DURING_FESTIVAL (10 Oct to 21 Oct inclusive)
    return {
      navLabel: lang === 'te' ? 'నేటి కార్యక్రమం' : "Today's Programme",
      navHref: '#today',
      heroBtn: lang === 'te' ? 'నేటి కార్యక్రమం చూడండి' : "View Today's Programme",
      heroBtnHref: '#today',
      sectionBadge: lang === 'te' ? 'నేటి కార్యక్రమం' : "Today's Programme",
      sectionTitle: lang === 'te' ? 'నేటి పూజా కార్యక్రమాలు & దంపతులు' : "Today's Programme & Pooja Couples",
      sectionSubtitle: lang === 'te' 
        ? 'శరన్నవరాత్రి మహోత్సవముల రోజువారీ అలంకారం మరియు పూజా విధి వివరాలు.' 
        : 'Daily divine alankaram and ritual pooja schedule.',
    };
  }
}
