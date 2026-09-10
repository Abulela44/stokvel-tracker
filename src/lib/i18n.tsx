import * as React from "react";

export type Lang = "en" | "xh" | "zu";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "xh", label: "isiXhosa" },
  { code: "zu", label: "isiZulu" },
];

const en = {
  appName: "Stokvel Tracker SA",
  tagline: "Run your stokvel from your phone. Light on data, easy on everyone.",
  getStarted: "Get started",
  signIn: "Sign in",
  signOut: "Sign out",
  signUp: "Create account",
  phone: "Phone number",
  password: "Password",
  language: "Language",
  chooseLanguage: "Choose your language",
  continue: "Continue",
  cancel: "Cancel",
  save: "Save",
  saving: "Saving...",
  loading: "Loading...",
  somethingWrong: "Something went wrong. Please try again.",

  // auth
  authTitle: "Sign in with your phone",
  authTitleSignup: "Create your account",

  authSubtitle: "We use your phone number as your username.",
  haveAccount: "I already have an account",
  needAccount: "I am new here",
  phoneHint: "For example 0821234567",
  passwordHint: "At least 6 characters",

  // nav
  navHome: "Home",
  navMembers: "Members",
  navPayments: "Payments",
  navPayout: "Payout",
  navRemind: "Remind",
  navSettings: "Settings",

  // create stokvel
  createStokvel: "Create your stokvel",
  stokvelName: "Stokvel name",
  monthlyContribution: "Monthly contribution",
  meetingDay: "Meeting day of the month",
  adminPhone: "Admin phone number",
  createStokvelCta: "Create stokvel",
  contributionRange: "Between R100 and R2 000",

  // home
  collected: "Collected",
  outstanding: "Outstanding",
  balance: "Balance",
  members: "Members",
  perMonth: "per month",
  meetsOn: "Meets on day",
  quickActions: "Quick actions",
  thisMonth: "This month",
  paidThisMonth: "Paid this month",

  // members
  addMember: "Add member",
  memberName: "Full name",
  memberPhone: "Phone number",
  totalPaid: "Total paid",
  owing: "Owing",
  inviteWhatsapp: "Invite on WhatsApp",
  noMembers: "No members yet. Add your first member.",
  removeMember: "Remove",
  removeMemberConfirm: "Remove this member and their payments?",
  freeLimitTitle: "Free plan is full",
  freeLimitBody: "The free plan holds up to 15 members. Upgrade to Pro to add more.",
  seePricing: "See plans",

  // payments
  paymentsTitle: "Payments",
  tapToToggle: "Tap a month to mark it paid or unpaid.",
  paid: "Paid",
  unpaid: "Unpaid",
  year: "Year",

  // payout
  payoutTitle: "Payout rotation",
  payoutOrderHint: "Move members up or down to set who gets paid when.",
  payoutAmount: "Payout amount",
  payoutMonth: "Payout month",
  moveUp: "Move up",
  moveDown: "Move down",
  paidOut: "Paid out",
  upcoming: "Upcoming",
  inThePot: "In the pot",

  // reminders
  remindTitle: "WhatsApp reminders",
  remindHint: "Pick who to remind. The message opens in WhatsApp, ready to send.",
  sendReminder: "Send reminder",
  messagePreview: "Message preview",
  dueOn: "Due on",
  noPhone: "No phone number saved",

  // pricing
  pricingTitle: "Plans",
  free: "Free",
  pro: "Pro",
  freePrice: "R0",
  proPrice: "R39",
  monthShort: "/month",
  freeFeature1: "Up to 15 members",
  freeFeature2: "Payment grid and payout rotation",
  freeFeature3: "WhatsApp reminders",
  proFeature1: "Unlimited members",
  proFeature2: "Everything in Free",
  proFeature3: "Priority support",
  currentPlan: "Current plan",
  upgradeToPro: "Upgrade to Pro",
  upgradeComingSoon: "Card payment is not connected yet. We will contact you to activate Pro.",

  // settings
  settingsTitle: "Settings",
  stokvelDetails: "Stokvel details",
  plan: "Plan",
  savedChanges: "Changes saved.",

  // messages
  waInvite:
    "Hello {name}! You are added to our stokvel {stokvel}. We contribute {amount} each month, due on day {day}. Reply here if you have questions. - {admin}",
  waReminder:
    "Hello {name}. Friendly reminder for {stokvel}: your {amount} contribution is due on {due}. Your outstanding balance is {balance}. Thank you!",
};

export type Key = keyof typeof en;

const xh: Record<Key, string> = {
  ...en,
  tagline: "Lawula istokfela sakho ngefowuni. Isebenzisa idatha encinci.",
  getStarted: "Qalisa",
  signIn: "Ngena",
  signOut: "Phuma",
  signUp: "Yenza iakhawunti",
  phone: "Inombolo yefowuni",
  password: "Iphaswedi",
  language: "Ulwimi",
  chooseLanguage: "Khetha ulwimi lwakho",
  continue: "Qhubeka",
  cancel: "Rhoxisa",
  save: "Gcina",
  saving: "Iyagcina...",
  loading: "Iyalayisha...",
  somethingWrong: "Kukho into engahambanga kakuhle. Zama kwakhona.",
  authTitle: "Ngena ngenombolo yefowuni",
  authTitleSignup: "Yenza iakhawunti yakho",

  authSubtitle: "Sisebenzisa inombolo yefowuni njengegama lomsebenzisi.",
  haveAccount: "Sendinayo iakhawunti",
  needAccount: "Ndingumtsha apha",
  phoneHint: "Umzekelo 0821234567",
  passwordHint: "Ubuncinci iimpawu ezi-6",
  navHome: "Ekhaya",
  navMembers: "Amalungu",
  navPayments: "Iintlawulo",
  navPayout: "Umrhumo",
  navRemind: "Khumbuza",
  navSettings: "Iisetingi",
  createStokvel: "Yenza istokfela sakho",
  stokvelName: "Igama lestokfela",
  monthlyContribution: "Umnikelo wenyanga",
  meetingDay: "Usuku lwentlanganiso",
  adminPhone: "Inombolo yomlawuli",
  createStokvelCta: "Yenza istokfela",
  contributionRange: "Phakathi kweR100 neR2 000",
  collected: "Ekuqokelelwe",
  outstanding: "Okusaselelwe",
  balance: "Ibhalansi",
  members: "Amalungu",
  perMonth: "ngenyanga",
  meetsOn: "Ihlangana ngosuku",
  quickActions: "Izenzo ezikhawulezayo",
  thisMonth: "Kule nyanga",
  paidThisMonth: "Ahlawule kule nyanga",
  addMember: "Yongeza ilungu",
  memberName: "Igama elipheleleyo",
  memberPhone: "Inombolo yefowuni",
  totalPaid: "Ihlawulwe iyonke",
  owing: "Utyala",
  inviteWhatsapp: "Mema nge-WhatsApp",
  noMembers: "Akukho malungu okwangoku. Yongeza ilungu lokuqala.",
  removeMember: "Susa",
  removeMemberConfirm: "Susa eli lungu kunye neentlawulo zalo?",
  freeLimitTitle: "Isicwangciso samahhala sigcwele",
  freeLimitBody: "Isicwangciso samahhala sithatha amalungu ali-15. Khwelisa kwiPro.",
  seePricing: "Jonga izicwangciso",
  paymentsTitle: "Iintlawulo",
  tapToToggle: "Cofa inyanga ukuphawula ukuba ihlawulwe okanye ayihlawulwa.",
  paid: "Ihlawulwe",
  unpaid: "Ayihlawulwa",
  year: "Unyaka",
  payoutTitle: "Ulandelelwano lomrhumo",
  payoutOrderHint: "Hambisa amalungu ukumisela ukuba ngubani ohlawulwa nini.",
  payoutAmount: "Imali yomrhumo",
  payoutMonth: "Inyanga yomrhumo",
  moveUp: "Yisa phezulu",
  moveDown: "Yisa ezantsi",
  paidOut: "Ihlawulwe",
  upcoming: "Ezayo",
  inThePot: "Emgqomeni",
  remindTitle: "Izikhumbuzo ze-WhatsApp",
  remindHint: "Khetha ukhumbuza bani. Umyalezo uvulwa ku-WhatsApp.",
  sendReminder: "Thumela isikhumbuzo",
  messagePreview: "Ukubona umyalezo",
  dueOn: "Ifuneka ngomhla",
  noPhone: "Akukho nombolo yefowuni",
  pricingTitle: "Izicwangciso",
  free: "Simahla",
  pro: "Pro",
  freeFeature1: "Ukuya kumalungu ali-15",
  freeFeature2: "Igridi yeentlawulo nolandelelwano",
  freeFeature3: "Izikhumbuzo ze-WhatsApp",
  proFeature1: "Amalungu angenamda",
  proFeature2: "Konke okuse-Free",
  proFeature3: "Inkxaso ekhawulezayo",
  currentPlan: "Isicwangciso sangoku",
  upgradeToPro: "Khwelisa kwiPro",
  upgradeComingSoon: "Intlawulo yekhadi ayikaqhagamshelwa. Siza kuqhagamshelana nawe.",
  settingsTitle: "Iisetingi",
  stokvelDetails: "Iinkcukacha zestokfela",
  plan: "Isicwangciso",
  savedChanges: "Utshintsho lugcinwe.",
  waInvite:
    "Molo {name}! Wongezwe kwistokfela sethu {stokvel}. Sinikela {amount} inyanga nganye, ngomhla {day}. Buza apha ukuba unemibuzo. - {admin}",
  waReminder:
    "Molo {name}. Isikhumbuzo se-{stokvel}: umnikelo wakho we-{amount} ufuneka ngo-{due}. Utyala {balance}. Enkosi!",
};

const zu: Record<Key, string> = {
  ...en,
  tagline: "Phatha istokvel sakho ngefoni. Isebenzisa idatha encane.",
  getStarted: "Qalisa",
  signIn: "Ngena",
  signOut: "Phuma",
  signUp: "Dala i-akhawunti",
  phone: "Inombolo yefoni",
  password: "Iphasiwedi",
  language: "Ulimi",
  chooseLanguage: "Khetha ulimi lwakho",
  continue: "Qhubeka",
  cancel: "Khansela",
  save: "Londoloza",
  saving: "Iyalondoloza...",
  loading: "Iyalayisha...",
  somethingWrong: "Kukhona okungahambanga kahle. Zama futhi.",
  authTitle: "Ngena ngenombolo yefoni",
  authTitleSignup: "Dala i-akhawunti yakho",

  authSubtitle: "Sisebenzisa inombolo yefoni njengegama lomsebenzisi.",
  haveAccount: "Nginayo kakade i-akhawunti",
  needAccount: "Ngimusha lapha",
  phoneHint: "Isibonelo 0821234567",
  passwordHint: "Okungenani izinhlamvu eziyi-6",
  navHome: "Ekhaya",
  navMembers: "Amalunga",
  navPayments: "Izinkokhelo",
  navPayout: "Inkokhelo",
  navRemind: "Khumbuza",
  navSettings: "Izilungiselelo",
  createStokvel: "Dala istokvel sakho",
  stokvelName: "Igama lestokvel",
  monthlyContribution: "Umnikelo wenyanga",
  meetingDay: "Usuku lomhlangano",
  adminPhone: "Inombolo yomphathi",
  createStokvelCta: "Dala istokvel",
  contributionRange: "Phakathi kuka-R100 no-R2 000",
  collected: "Okuqoqwe",
  outstanding: "Okusasele",
  balance: "Ibhalansi",
  members: "Amalunga",
  perMonth: "ngenyanga",
  meetsOn: "Ihlangana ngosuku",
  quickActions: "Izenzo ezisheshayo",
  thisMonth: "Kule nyanga",
  paidThisMonth: "Akhokhile kule nyanga",
  addMember: "Engeza ilunga",
  memberName: "Igama eliphelele",
  memberPhone: "Inombolo yefoni",
  totalPaid: "Sekukhokhwe",
  owing: "Ukweleta",
  inviteWhatsapp: "Mema nge-WhatsApp",
  noMembers: "Awekho amalunga okwamanje. Engeza ilunga lokuqala.",
  removeMember: "Susa",
  removeMemberConfirm: "Susa leli lunga nezinkokhelo zalo?",
  freeLimitTitle: "Uhlelo lwamahhala lugcwele",
  freeLimitBody: "Uhlelo lwamahhala luthatha amalunga ayi-15. Thuthukisela ku-Pro.",
  seePricing: "Buka izinhlelo",
  paymentsTitle: "Izinkokhelo",
  tapToToggle: "Thepha inyanga ukumaka ukuthi ikhokhelwe noma cha.",
  paid: "Kukhokhwe",
  unpaid: "Akukhokhwanga",
  year: "Unyaka",
  payoutTitle: "Ukushintshana kwenkokhelo",
  payoutOrderHint: "Hambisa amalunga ukubeka ukuthi ubani ukhokhelwa nini.",
  payoutAmount: "Inani lenkokhelo",
  payoutMonth: "Inyanga yenkokhelo",
  moveUp: "Yisa phezulu",
  moveDown: "Yisa phansi",
  paidOut: "Kukhokhelwe",
  upcoming: "Ezizayo",
  inThePot: "Ebhodweni",
  remindTitle: "Izikhumbuzo ze-WhatsApp",
  remindHint: "Khetha ozokhumbuza. Umlayezo uvuleka ku-WhatsApp.",
  sendReminder: "Thumela isikhumbuzo",
  messagePreview: "Buka umlayezo",
  dueOn: "Kufanele ngomhla",
  noPhone: "Ayikho inombolo yefoni",
  pricingTitle: "Izinhlelo",
  free: "Mahhala",
  pro: "Pro",
  freeFeature1: "Kuya kumalunga ayi-15",
  freeFeature2: "Igridi yezinkokhelo nokushintshana",
  freeFeature3: "Izikhumbuzo ze-WhatsApp",
  proFeature1: "Amalunga angenamkhawulo",
  proFeature2: "Konke okuku-Free",
  proFeature3: "Usizo olusheshayo",
  currentPlan: "Uhlelo lwamanje",
  upgradeToPro: "Thuthukisela ku-Pro",
  upgradeComingSoon: "Inkokhelo yekhadi ayixhunyiwe okwamanje. Sizoxhumana nawe.",
  settingsTitle: "Izilungiselelo",
  stokvelDetails: "Imininingwane yestokvel",
  plan: "Uhlelo",
  savedChanges: "Izinguquko zilondolozwe.",
  waInvite:
    "Sawubona {name}! Ufakwe kwistokvel sethu {stokvel}. Sikhipha {amount} inyanga zonke, ngosuku {day}. Buza lapha uma unemibuzo. - {admin}",
  waReminder:
    "Sawubona {name}. Isikhumbuzo se-{stokvel}: umnikelo wakho we-{amount} ufanele ngo-{due}. Usasele no-{balance}. Siyabonga!",
};

const dictionaries: Record<Lang, Record<Key, string>> = { en, xh, zu };

export const MONTH_NAMES: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  xh: ["Jan", "Feb", "Mat", "Epr", "Mey", "Jun", "Jul", "Aga", "Sep", "Okt", "Nov", "Dis"],
  zu: ["Jan", "Feb", "Mas", "Eph", "Mey", "Jun", "Jul", "Aga", "Sep", "Okt", "Nov", "Dis"],
};

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  months: string[];
};

const LanguageContext = React.createContext<Ctx | null>(null);
const STORAGE_KEY = "stokvel-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored && stored in dictionaries) setLangState(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = React.useMemo<Ctx>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang,
      months: MONTH_NAMES[lang],
      t: (key, vars) => {
        let text = dict[key] ?? en[key] ?? String(key);
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            text = text.split(`{${k}}`).join(String(v));
          }
        }
        return text;
      },
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}
