export type LangCode =
  | "en" | "hi" | "ta" | "te" | "kn" | "ml" | "mr" | "bn"
  | "gu" | "pa" | "or" | "as" | "ur" | "ar" | "es" | "fr"
  | "de" | "pt" | "zh" | "ja";

export interface Language {
  code: LangCode;
  name: string;      // Native name
  label: string;     // English label
  rtl?: boolean;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English",       label: "English",    flag: "🇬🇧" },
  { code: "hi", name: "हिंदी",          label: "Hindi",      flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்",          label: "Tamil",      flag: "🇮🇳" },
  { code: "te", name: "తెలుగు",         label: "Telugu",     flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ",          label: "Kannada",    flag: "🇮🇳" },
  { code: "ml", name: "മലയാളം",         label: "Malayalam",  flag: "🇮🇳" },
  { code: "mr", name: "मराठी",          label: "Marathi",    flag: "🇮🇳" },
  { code: "bn", name: "বাংলা",          label: "Bengali",    flag: "🇧🇩" },
  { code: "gu", name: "ગુજરાતી",        label: "Gujarati",   flag: "🇮🇳" },
  { code: "pa", name: "ਪੰਜਾਬੀ",         label: "Punjabi",    flag: "🇮🇳" },
  { code: "or", name: "ଓଡ଼ିଆ",          label: "Odia",       flag: "🇮🇳" },
  { code: "as", name: "অসমীয়া",        label: "Assamese",   flag: "🇮🇳" },
  { code: "ur", name: "اردو",           label: "Urdu",       flag: "🇵🇰", rtl: true },
  { code: "ar", name: "العربية",        label: "Arabic",     flag: "🇸🇦", rtl: true },
  { code: "es", name: "Español",        label: "Spanish",    flag: "🇪🇸" },
  { code: "fr", name: "Français",       label: "French",     flag: "🇫🇷" },
  { code: "de", name: "Deutsch",        label: "German",     flag: "🇩🇪" },
  { code: "pt", name: "Português",      label: "Portuguese", flag: "🇧🇷" },
  { code: "zh", name: "中文",            label: "Chinese",    flag: "🇨🇳" },
  { code: "ja", name: "日本語",          label: "Japanese",   flag: "🇯🇵" },
];

export type TranslationKeys = {
  // Navigation
  "nav.dashboard": string;
  "nav.myChits": string;
  "nav.chits": string;
  "nav.kyc": string;
  "nav.paymentStatus": string;
  "nav.createGroup": string;
  "nav.payments": string;
  "nav.adminMembers": string;
  "nav.joinGroup": string;
  "nav.profile": string;
  "nav.logout": string;
  // Auth
  "auth.login": string;
  "auth.signup": string;
  "auth.email": string;
  "auth.phone": string;
  "auth.password": string;
  "auth.forgotPassword": string;
  "auth.newPassword": string;
  "auth.confirmPassword": string;
  "auth.createAccount": string;
  "auth.haveAccount": string;
  "auth.noAccount": string;
  // Dashboard
  "dash.title": string;
  "dash.activeGroups": string;
  "dash.totalInvested": string;
  "dash.totalMembers": string;
  "dash.yourGroups": string;
  "dash.noGroups": string;
  // Group
  "group.monthly": string;
  "group.members": string;
  "group.progress": string;
  "group.nextBid": string;
  "group.viewDetails": string;
  "group.payNow": string;
  "group.month": string;
  "group.of": string;
  "group.totalPool": string;
  "group.status.active": string;
  "group.status.upcoming": string;
  "group.status.completed": string;
  "group.createNew": string;
  "group.name": string;
  "group.duration": string;
  "group.startDate": string;
  "group.upiId": string;
  // Member
  "member.addMember": string;
  "member.searchUser": string;
  "member.role": string;
  "member.admin": string;
  "member.member": string;
  "member.remove": string;
  "member.joinedOn": string;
  "member.noMembers": string;
  "member.searchPlaceholder": string;
  "member.roleChanged": string;
  "member.added": string;
  // Bid
  "bid.placeBid": string;
  "bid.submitBid": string;
  "bid.yourBid": string;
  "bid.liveBids": string;
  "bid.bidHistory": string;
  "bid.minBid": string;
  "bid.maxBid": string;
  "bid.noBids": string;
  "bid.auctionOpen": string;
  // Payment
  "pay.payContrib": string;
  "pay.holderUpi": string;
  "pay.note": string;
  "pay.chooseApp": string;
  "pay.success": string;
  "pay.failed": string;
  "pay.history": string;
  "pay.totalPaid": string;
  "pay.successRate": string;
  "pay.amount": string;
  // Profile
  "profile.title": string;
  "profile.personalInfo": string;
  "profile.fullName": string;
  "profile.emailAddr": string;
  "profile.phoneNum": string;
  "profile.security": string;
  "profile.changePassword": string;
  "profile.twoFA": string;
  "profile.notifications": string;
  // Common
  "common.save": string;
  "common.cancel": string;
  "common.edit": string;
  "common.back": string;
  "common.done": string;
  "common.submit": string;
  "common.loading": string;
  "common.error": string;
  "common.retry": string;
  "common.search": string;
  "common.create": string;
  "common.enable": string;
  "common.change": string;
  "common.confirm": string;
  "common.yes": string;
  "common.no": string;
  "common.remove": string;
  "common.noData": string;
  "common.refresh": string;
  "common.language": string;
  "common.all": string;
  "common.invested": string;
  // Bid extras
  "bid.closeResolve": string;
  "bid.auctionLive": string;
  "bid.inProgress": string;
  "bid.won": string;
  "bid.outbid": string;
  // Group detail
  "detail.totalPool": string;
  "detail.monthlyContrib": string;
  "detail.nextBidDate": string;
  "detail.contributions": string;
  "detail.auctionOpen": string;
  "detail.live": string;
  "detail.autoRefresh": string;
  "detail.noBidsMonth": string;
  "detail.beFirst": string;
  "detail.placeFirst": string;
  "detail.winners": string;
  "detail.paymentsUtr": string;
  "detail.alerts": string;
  "detail.dangerZone": string;
  "detail.deleteGroup": string;
  "detail.monthWinner": string;
  "detail.winningBid": string;
  "detail.adminSent": string;
  "detail.eachRebate": string;
  "detail.netYouPay": string;
  "detail.memberWise": string;
  "detail.contributes": string;
  "detail.rebate": string;
  "detail.netPays": string;
  "detail.pastAuctions": string;
  "detail.monthlyWinners": string;
  "detail.noWinners": string;
  "detail.closeAuction": string;
  "detail.recordPayment": string;
  "detail.winnerShare": string;
  "detail.yourBid": string;
  "detail.bidsSubmitted": string;
  "detail.loadingBids": string;
  "detail.pending": string;
  "detail.amountSent": string;
  "detail.phoneTo": string;
  "detail.remaining": string;
};

// Partial allows fallback to English for missing keys in non-English langs
type Translations = Record<LangCode, Partial<TranslationKeys>>;

export const translations: Translations = {
  en: {
    "nav.dashboard": "Dashboard", "nav.myChits": "My Chits", "nav.chits": "Chits",
    "nav.kyc": "KYC Upload", "nav.paymentStatus": "Payment Status", "nav.createGroup": "Create Group",
    "nav.payments": "Payments", "nav.adminMembers": "Members", "nav.joinGroup": "Join Group", "nav.profile": "Profile", "nav.logout": "Logout",
    "auth.login": "Login", "auth.signup": "Sign Up", "auth.email": "Email", "auth.phone": "Phone",
    "auth.password": "Password", "auth.forgotPassword": "Forgot Password?", "auth.newPassword": "New Password",
    "auth.confirmPassword": "Confirm Password", "auth.createAccount": "Create Account",
    "auth.haveAccount": "Already have an account?", "auth.noAccount": "Don't have an account?",
    "dash.title": "Dashboard", "dash.activeGroups": "Active Groups", "dash.totalInvested": "Total Invested",
    "dash.totalMembers": "Total Members", "dash.yourGroups": "Your Chit Groups", "dash.noGroups": "No Chit Groups Yet",
    "group.monthly": "Monthly", "group.members": "Members", "group.progress": "Progress",
    "group.nextBid": "Next bid", "group.viewDetails": "View Details", "group.payNow": "Pay Now",
    "group.month": "Month", "group.of": "of", "group.totalPool": "Total Pool",
    "group.status.active": "Active", "group.status.upcoming": "Upcoming", "group.status.completed": "Completed",
    "group.createNew": "Create New Group", "group.name": "Group Name", "group.duration": "Duration (Months)",
    "group.startDate": "Start Date", "group.upiId": "Your UPI ID",
    "member.addMember": "Add Member", "member.searchUser": "Search User",
    "member.role": "Role", "member.admin": "Admin", "member.member": "Member",
    "member.remove": "Remove", "member.joinedOn": "Joined", "member.noMembers": "No members yet",
    "member.searchPlaceholder": "Search by email or phone...", "member.roleChanged": "Role updated",
    "member.added": "Member added successfully",
    "bid.placeBid": "Place Bid", "bid.submitBid": "Submit Bid", "bid.yourBid": "Your Bid",
    "bid.liveBids": "Live Bids", "bid.bidHistory": "Bid History", "bid.minBid": "Min Bid",
    "bid.maxBid": "Max Bid", "bid.noBids": "No bids yet", "bid.auctionOpen": "Auction Open",
    "pay.payContrib": "Pay Monthly Contribution", "pay.holderUpi": "Chit Holder's UPI ID",
    "pay.note": "Payment Note", "pay.chooseApp": "Choose Payment App", "pay.success": "Payment Successful",
    "pay.failed": "Payment Failed", "pay.history": "Payment History", "pay.totalPaid": "Total Paid",
    "pay.successRate": "Success Rate", "pay.amount": "Amount",
    "profile.title": "Profile", "profile.personalInfo": "Personal Information", "profile.fullName": "Full Name",
    "profile.emailAddr": "Email Address", "profile.phoneNum": "Phone Number", "profile.security": "Security",
    "profile.changePassword": "Change Password", "profile.twoFA": "Two-Factor Authentication",
    "profile.notifications": "Notifications",
    "common.save": "Save", "common.cancel": "Cancel", "common.edit": "Edit", "common.back": "Back",
    "common.done": "Done", "common.submit": "Submit", "common.loading": "Loading...", "common.error": "Error",
    "common.retry": "Retry", "common.search": "Search", "common.create": "Create", "common.enable": "Enable",
    "common.change": "Change", "common.confirm": "Confirm", "common.yes": "Yes", "common.no": "No",
    "common.remove": "Remove", "common.noData": "No data found", "common.refresh": "Refresh",
    "common.language": "Language", "common.all": "All", "common.invested": "Invested",
    "bid.closeResolve": "Close & Resolve", "bid.auctionLive": "Your Bid is Live",
    "bid.inProgress": "Auction in progress", "bid.won": "You won!", "bid.outbid": "Outbid",
    "detail.totalPool": "Total Pool", "detail.monthlyContrib": "Monthly Contribution",
    "detail.nextBidDate": "Next Bid Date", "detail.contributions": "Contributions",
    "detail.auctionOpen": "Auction Open", "detail.live": "Live",
    "detail.autoRefresh": "Auto-refreshes every 12 seconds",
    "detail.noBidsMonth": "No bids placed yet this month",
    "detail.beFirst": "Be the first to place a bid!",
    "detail.placeFirst": "Place First Bid",
    "detail.winners": "Winners", "detail.paymentsUtr": "Payments & UTR", "detail.alerts": "Alerts",
    "detail.dangerZone": "Danger Zone", "detail.deleteGroup": "Delete Group",
    "detail.monthWinner": "Auction Winner", "detail.winningBid": "Winning bid",
    "detail.adminSent": "Admin Sent",
    "detail.eachRebate": "Each member's rebate this month",
    "detail.netYouPay": "Net you pay",
    "detail.memberWise": "Member-wise Rebate",
    "detail.contributes": "Contributes", "detail.rebate": "Rebate", "detail.netPays": "Net Pays",
    "detail.pastAuctions": "Past Auction Results", "detail.monthlyWinners": "Monthly Winners",
    "detail.noWinners": "No winners announced yet.",
    "detail.closeAuction": "Close Auction & Announce Winner",
    "detail.recordPayment": "Record Payment Sent to Winner",
    "detail.winnerShare": "Winner's Share",
    "detail.yourBid": "Your bid", "detail.bidsSubmitted": "bids submitted",
    "detail.loadingBids": "Loading bids...", "detail.pending": "Pending",
    "detail.amountSent": "Amount Sent", "detail.phoneTo": "To",
    "detail.remaining": "Remaining",
  },

  hi: {
    "nav.dashboard": "डैशबोर्ड", "nav.myChits": "मेरे चिट", "nav.chits": "चिट",
    "nav.kyc": "KYC अपलोड", "nav.paymentStatus": "भुगतान स्थिति", "nav.createGroup": "समूह बनाएं",
    "nav.payments": "भुगतान", "nav.adminMembers": "सदस्य", "nav.joinGroup": "समूह जोड़ें", "nav.profile": "प्रोफ़ाइल", "nav.logout": "लॉग आउट",
    "auth.login": "लॉग इन", "auth.signup": "साइन अप", "auth.email": "ईमेल", "auth.phone": "फ़ोन",
    "auth.password": "पासवर्ड", "auth.forgotPassword": "पासवर्ड भूल गए?", "auth.newPassword": "नया पासवर्ड",
    "auth.confirmPassword": "पासवर्ड दोहराएं", "auth.createAccount": "खाता बनाएं",
    "auth.haveAccount": "पहले से खाता है?", "auth.noAccount": "खाता नहीं है?",
    "dash.title": "डैशबोर्ड", "dash.activeGroups": "सक्रिय समूह", "dash.totalInvested": "कुल निवेश",
    "dash.totalMembers": "कुल सदस्य", "dash.yourGroups": "आपके चिट समूह", "dash.noGroups": "अभी कोई चिट समूह नहीं",
    "group.monthly": "मासिक", "group.members": "सदस्य", "group.progress": "प्रगति",
    "group.nextBid": "अगली बोली", "group.viewDetails": "विवरण देखें", "group.payNow": "अभी भुगतान करें",
    "group.month": "महीना", "group.of": "में से", "group.totalPool": "कुल पूल",
    "group.status.active": "सक्रिय", "group.status.upcoming": "आगामी", "group.status.completed": "पूर्ण",
    "group.createNew": "नया समूह बनाएं", "group.name": "समूह का नाम", "group.duration": "अवधि (महीने)",
    "group.startDate": "प्रारंभ तिथि", "group.upiId": "आपका UPI ID",
    "member.addMember": "सदस्य जोड़ें", "member.searchUser": "उपयोगकर्ता खोजें",
    "member.role": "भूमिका", "member.admin": "व्यवस्थापक", "member.member": "सदस्य",
    "member.remove": "हटाएं", "member.joinedOn": "जुड़े", "member.noMembers": "अभी कोई सदस्य नहीं",
    "member.searchPlaceholder": "ईमेल या फ़ोन से खोजें...", "member.roleChanged": "भूमिका अपडेट हो गई",
    "member.added": "सदस्य सफलतापूर्वक जोड़ा गया",
    "bid.placeBid": "बोली लगाएं", "bid.submitBid": "बोली जमा करें", "bid.yourBid": "आपकी बोली",
    "bid.liveBids": "लाइव बोलियां", "bid.bidHistory": "बोली इतिहास", "bid.minBid": "न्यूनतम बोली",
    "bid.maxBid": "अधिकतम बोली", "bid.noBids": "अभी कोई बोली नहीं", "bid.auctionOpen": "नीलामी खुली है",
    "pay.payContrib": "मासिक योगदान भुगतान", "pay.holderUpi": "चिट धारक का UPI ID",
    "pay.note": "भुगतान नोट", "pay.chooseApp": "भुगतान ऐप चुनें", "pay.success": "भुगतान सफल",
    "pay.failed": "भुगतान विफल", "pay.history": "भुगतान इतिहास", "pay.totalPaid": "कुल भुगतान",
    "pay.successRate": "सफलता दर", "pay.amount": "राशि",
    "profile.title": "प्रोफ़ाइल", "profile.personalInfo": "व्यक्तिगत जानकारी", "profile.fullName": "पूरा नाम",
    "profile.emailAddr": "ईमेल पता", "profile.phoneNum": "फ़ोन नंबर", "profile.security": "सुरक्षा",
    "profile.changePassword": "पासवर्ड बदलें", "profile.twoFA": "दो-चरण प्रमाणीकरण",
    "profile.notifications": "सूचनाएं",
    "common.save": "सहेजें", "common.cancel": "रद्द करें", "common.edit": "संपादित करें", "common.back": "वापस",
    "common.done": "हो गया", "common.submit": "जमा करें", "common.loading": "लोड हो रहा है...", "common.error": "त्रुटि",
    "common.retry": "पुनः प्रयास", "common.search": "खोजें", "common.create": "बनाएं", "common.enable": "सक्षम करें",
    "common.change": "बदलें", "common.confirm": "पुष्टि करें", "common.yes": "हाँ", "common.no": "नहीं",
    "common.remove": "हटाएं", "common.noData": "कोई डेटा नहीं मिला", "common.refresh": "ताज़ा करें",
    "common.language": "भाषा", "common.all": "सभी", "common.invested": "निवेश",
    "bid.closeResolve": "बंद करें", "bid.auctionLive": "आपकी बोली लाइव है",
    "bid.inProgress": "नीलामी जारी है", "bid.won": "आप जीत गए!", "bid.outbid": "पीछे रह गए",
    "detail.totalPool": "कुल पूल", "detail.monthlyContrib": "मासिक योगदान",
    "detail.nextBidDate": "अगली बोली तिथि", "detail.contributions": "योगदान",
    "detail.auctionOpen": "नीलामी खुली है", "detail.live": "लाइव",
    "detail.autoRefresh": "हर 12 सेकंड में अपडेट होता है",
    "detail.noBidsMonth": "इस महीने कोई बोली नहीं",
    "detail.beFirst": "पहली बोली लगाएं!",
    "detail.placeFirst": "पहली बोली लगाएं",
    "detail.winners": "विजेता", "detail.paymentsUtr": "भुगतान और UTR", "detail.alerts": "सूचनाएं",
    "detail.dangerZone": "खतरा क्षेत्र", "detail.deleteGroup": "समूह हटाएं",
    "detail.monthWinner": "नीलामी विजेता", "detail.winningBid": "जीती हुई बोली",
    "detail.adminSent": "एडमिन ने भेजा",
    "detail.eachRebate": "इस महीने प्रत्येक सदस्य की छूट",
    "detail.netYouPay": "आप वास्तव में देते हैं",
    "detail.memberWise": "सदस्यवार छूट",
    "detail.contributes": "योगदान", "detail.rebate": "छूट", "detail.netPays": "शुद्ध भुगतान",
    "detail.pastAuctions": "पिछली नीलामियां", "detail.monthlyWinners": "मासिक विजेता",
    "detail.noWinners": "अभी कोई विजेता घोषित नहीं।",
    "detail.closeAuction": "नीलामी बंद करें और विजेता घोषित करें",
    "detail.recordPayment": "विजेता को भुगतान दर्ज करें",
    "detail.winnerShare": "विजेता का हिस्सा",
    "detail.yourBid": "आपकी बोली", "detail.bidsSubmitted": "बोलियां जमा हुईं",
    "detail.loadingBids": "बोलियां लोड हो रही हैं...", "detail.pending": "प्रतीक्षारत",
    "detail.amountSent": "भेजी गई राशि", "detail.phoneTo": "को",
    "detail.remaining": "शेष",
  },

  ta: {
    "nav.dashboard": "டாஷ்போர்டு", "nav.myChits": "என் சிட்", "nav.chits": "சிட்",
    "nav.kyc": "KYC பதிவேற்றம்", "nav.paymentStatus": "பணம் நிலை", "nav.createGroup": "குழு உருவாக்கு",
    "nav.payments": "கொடுப்பனவுகள்", "nav.profile": "சுயவிவரம்", "nav.logout": "வெளியேறு",
    "auth.login": "உள்நுழை", "auth.signup": "பதிவு செய்", "auth.email": "மின்னஞ்சல்", "auth.phone": "தொலைபேசி",
    "auth.password": "கடவுச்சொல்", "auth.forgotPassword": "கடவுச்சொல் மறந்துவிட்டதா?", "auth.newPassword": "புதிய கடவுச்சொல்",
    "auth.confirmPassword": "கடவுச்சொல் உறுதிப்படுத்து", "auth.createAccount": "கணக்கு உருவாக்கு",
    "auth.haveAccount": "ஏற்கனவே கணக்கு உள்ளதா?", "auth.noAccount": "கணக்கு இல்லையா?",
    "dash.title": "டாஷ்போர்டு", "dash.activeGroups": "செயலில் குழுக்கள்", "dash.totalInvested": "மொத்த முதலீடு",
    "dash.totalMembers": "மொத்த உறுப்பினர்கள்", "dash.yourGroups": "உங்கள் சிட் குழுக்கள்", "dash.noGroups": "சிட் குழுக்கள் இல்லை",
    "group.monthly": "மாதாந்திர", "group.members": "உறுப்பினர்கள்", "group.progress": "முன்னேற்றம்",
    "group.nextBid": "அடுத்த ஏலம்", "group.viewDetails": "விவரங்கள் காண்க", "group.payNow": "இப்போது செலுத்து",
    "group.month": "மாதம்", "group.of": "இல்", "group.totalPool": "மொத்த தொகை",
    "group.status.active": "செயலில்", "group.status.upcoming": "வரவிருக்கும்", "group.status.completed": "முடிந்தது",
    "group.createNew": "புதிய குழு உருவாக்கு", "group.name": "குழு பெயர்", "group.duration": "காலம் (மாதங்கள்)",
    "group.startDate": "தொடக்க தேதி", "group.upiId": "உங்கள் UPI ID",
    "member.addMember": "உறுப்பினர் சேர்", "member.searchUser": "பயனர் தேடு",
    "member.role": "பாத்திரம்", "member.admin": "நிர்வாகி", "member.member": "உறுப்பினர்",
    "member.remove": "நீக்கு", "member.joinedOn": "சேர்ந்தது", "member.noMembers": "உறுப்பினர்கள் இல்லை",
    "member.searchPlaceholder": "மின்னஞ்சல் அல்லது தொலைபேசியால் தேடு...", "member.roleChanged": "பாத்திரம் மாற்றப்பட்டது",
    "member.added": "உறுப்பினர் வெற்றிகரமாக சேர்க்கப்பட்டார்",
    "bid.placeBid": "ஏலம் வை", "bid.submitBid": "ஏலம் சமர்ப்பி", "bid.yourBid": "உங்கள் ஏலம்",
    "bid.liveBids": "நேரடி ஏலங்கள்", "bid.bidHistory": "ஏல வரலாறு", "bid.minBid": "குறைந்தபட்ச ஏலம்",
    "bid.maxBid": "அதிகபட்ச ஏலம்", "bid.noBids": "ஏலங்கள் இல்லை", "bid.auctionOpen": "ஏலம் திறந்துள்ளது",
    "pay.payContrib": "மாதாந்திர பங்களிப்பு செலுத்து", "pay.holderUpi": "சிட் வைத்திருப்பவரின் UPI ID",
    "pay.note": "பணம் செலுத்தும் குறிப்பு", "pay.chooseApp": "கட்டண ஆப் தேர்வு செய்", "pay.success": "பணம் வெற்றிகரமாக செலுத்தப்பட்டது",
    "pay.failed": "பணம் செலுத்த தோல்வி", "pay.history": "கட்டண வரலாறு", "pay.totalPaid": "மொத்தம் செலுத்தியது",
    "pay.successRate": "வெற்றி விகிதம்", "pay.amount": "தொகை",
    "profile.title": "சுயவிவரம்", "profile.personalInfo": "தனிப்பட்ட தகவல்", "profile.fullName": "முழு பெயர்",
    "profile.emailAddr": "மின்னஞ்சல் முகவரி", "profile.phoneNum": "தொலைபேசி எண்", "profile.security": "பாதுகாப்பு",
    "profile.changePassword": "கடவுச்சொல் மாற்று", "profile.twoFA": "இரண்டு-படி சரிபார்ப்பு",
    "profile.notifications": "அறிவிப்புகள்",
    "common.save": "சேமி", "common.cancel": "ரத்து செய்", "common.edit": "திருத்து", "common.back": "திரும்பு",
    "common.done": "முடிந்தது", "common.submit": "சமர்ப்பி", "common.loading": "ஏற்றுகிறது...", "common.error": "பிழை",
    "common.retry": "மீண்டும் முயற்சி", "common.search": "தேடு", "common.create": "உருவாக்கு", "common.enable": "இயக்கு",
    "common.change": "மாற்று", "common.confirm": "உறுதிப்படுத்து", "common.yes": "ஆம்", "common.no": "இல்லை",
    "common.remove": "நீக்கு", "common.noData": "தரவு இல்லை", "common.refresh": "புதுப்பி",
    "common.language": "மொழி", "common.all": "அனைத்தும்", "common.invested": "முதலீடு",
    "bid.closeResolve": "மூடு & முடி", "bid.auctionLive": "உங்கள் ஏலம் நேரடியில்",
    "bid.inProgress": "ஏலம் நடைபெறுகிறது", "bid.won": "நீங்கள் வென்றீர்கள்!", "bid.outbid": "வேறொருவர் முந்தினர்",
    "detail.totalPool": "மொத்த தொகை", "detail.monthlyContrib": "மாதாந்திர பங்களிப்பு",
    "detail.nextBidDate": "அடுத்த ஏல தேதி", "detail.contributions": "பங்களிப்புகள்",
    "detail.auctionOpen": "ஏலம் திறந்துள்ளது", "detail.live": "நேரடி",
    "detail.autoRefresh": "ஒவ்வொரு 12 வினாடிகளிலும் புதுப்பிக்கிறது",
    "detail.noBidsMonth": "இந்த மாதம் ஏலங்கள் இல்லை", "detail.beFirst": "முதல் ஏலம் வைக்கவும்!",
    "detail.placeFirst": "முதல் ஏலம்", "detail.winners": "வென்றவர்கள்",
    "detail.paymentsUtr": "கட்டணம் & UTR", "detail.alerts": "எச்சரிக்கைகள்",
    "detail.dangerZone": "அபாய மண்டலம்", "detail.deleteGroup": "குழுவை நீக்கு",
    "detail.monthWinner": "ஏல வெற்றியாளர்", "detail.winningBid": "வெற்றி ஏலம்",
    "detail.adminSent": "நிர்வாகி அனுப்பினார்",
    "detail.eachRebate": "இந்த மாதம் ஒவ்வொரு உறுப்பினரின் தள்ளுபடி",
    "detail.netYouPay": "நீங்கள் செலுத்துவது",
    "detail.memberWise": "உறுப்பினர்வாரி தள்ளுபடி",
    "detail.contributes": "பங்களிப்பு", "detail.rebate": "தள்ளுபடி", "detail.netPays": "செலுத்துவது",
    "detail.pastAuctions": "கடந்த ஏலங்கள்", "detail.monthlyWinners": "மாதாந்திர வென்றவர்கள்",
    "detail.noWinners": "இன்னும் வெற்றியாளர் இல்லை.",
    "detail.closeAuction": "ஏலம் மூடி வெற்றியாளரை அறிவி",
    "detail.recordPayment": "வெற்றியாளருக்கு கட்டணம் பதிவு செய்",
    "detail.winnerShare": "வெற்றியாளரின் பங்கு",
    "detail.yourBid": "உங்கள் ஏலம்", "detail.bidsSubmitted": "ஏலங்கள் சமர்ப்பிக்கப்பட்டன",
    "detail.loadingBids": "ஏலங்கள் ஏற்றுகிறது...", "detail.pending": "நிலுவையில்",
    "detail.amountSent": "அனுப்பிய தொகை", "detail.phoneTo": "க்கு", "detail.remaining": "மீதம்",
  },

  te: {
    "nav.dashboard": "డాష్‌బోర్డ్", "nav.myChits": "నా చిట్లు", "nav.chits": "చిట్లు",
    "nav.kyc": "KYC అప్‌లోడ్", "nav.paymentStatus": "చెల్లింపు స్థితి", "nav.createGroup": "గ్రూప్ సృష్టించు",
    "nav.payments": "చెల్లింపులు", "nav.profile": "ప్రొఫైల్", "nav.logout": "లాగ్ అవుట్",
    "auth.login": "లాగిన్", "auth.signup": "సైన్ అప్", "auth.email": "ఇమెయిల్", "auth.phone": "ఫోన్",
    "auth.password": "పాస్‌వర్డ్", "auth.forgotPassword": "పాస్‌వర్డ్ మరచిపోయారా?", "auth.newPassword": "కొత్త పాస్‌వర్డ్",
    "auth.confirmPassword": "పాస్‌వర్డ్ నిర్ధారించండి", "auth.createAccount": "ఖాతా సృష్టించండి",
    "auth.haveAccount": "ఇప్పటికే ఖాతా ఉందా?", "auth.noAccount": "ఖాతా లేదా?",
    "dash.title": "డాష్‌బోర్డ్", "dash.activeGroups": "క్రియాశీల గ్రూపులు", "dash.totalInvested": "మొత్తం పెట్టుబడి",
    "dash.totalMembers": "మొత్తం సభ్యులు", "dash.yourGroups": "మీ చిట్ గ్రూపులు", "dash.noGroups": "చిట్ గ్రూపులు లేవు",
    "group.monthly": "నెలవారీ", "group.members": "సభ్యులు", "group.progress": "పురోగతి",
    "group.nextBid": "తదుపరి బిడ్", "group.viewDetails": "వివరాలు చూడండి", "group.payNow": "ఇప్పుడు చెల్లించండి",
    "group.month": "నెల", "group.of": "లో", "group.totalPool": "మొత్తం పూల్",
    "group.status.active": "క్రియాశీల", "group.status.upcoming": "రాబోయే", "group.status.completed": "పూర్తైంది",
    "group.createNew": "కొత్త గ్రూప్ సృష్టించండి", "group.name": "గ్రూప్ పేరు", "group.duration": "వ్యవధి (నెలలు)",
    "group.startDate": "ప్రారంభ తేదీ", "group.upiId": "మీ UPI ID",
    "member.addMember": "సభ్యుడిని జోడించండి", "member.searchUser": "వినియోగదారుని వెతకండి",
    "member.role": "పాత్ర", "member.admin": "నిర్వాహకుడు", "member.member": "సభ్యుడు",
    "member.remove": "తొలగించండి", "member.joinedOn": "చేరిన తేదీ", "member.noMembers": "సభ్యులు లేరు",
    "member.searchPlaceholder": "ఇమెయిల్ లేదా ఫోన్‌తో వెతకండి...", "member.roleChanged": "పాత్ర నవీకరించబడింది",
    "member.added": "సభ్యుడు విజయవంతంగా జోడించబడ్డారు",
    "bid.placeBid": "బిడ్ వేయండి", "bid.submitBid": "బిడ్ సమర్పించండి", "bid.yourBid": "మీ బిడ్",
    "bid.liveBids": "లైవ్ బిడ్లు", "bid.bidHistory": "బిడ్ చరిత్ర", "bid.minBid": "కనిష్ట బిడ్",
    "bid.maxBid": "గరిష్ట బిడ్", "bid.noBids": "బిడ్లు లేవు", "bid.auctionOpen": "వేలం తెరవబడింది",
    "pay.payContrib": "నెలవారీ చందా చెల్లించండి", "pay.holderUpi": "చిట్ హోల్డర్ UPI ID",
    "pay.note": "చెల్లింపు గమనిక", "pay.chooseApp": "చెల్లింపు యాప్ ఎంచుకోండి", "pay.success": "చెల్లింపు విజయవంతమైంది",
    "pay.failed": "చెల్లింపు విఫలమైంది", "pay.history": "చెల్లింపు చరిత్ర", "pay.totalPaid": "మొత్తం చెల్లింపు",
    "pay.successRate": "విజయం రేటు", "pay.amount": "మొత్తం",
    "profile.title": "ప్రొఫైల్", "profile.personalInfo": "వ్యక్తిగత సమాచారం", "profile.fullName": "పూర్తి పేరు",
    "profile.emailAddr": "ఇమెయిల్ చిరునామా", "profile.phoneNum": "ఫోన్ నంబర్", "profile.security": "భద్రత",
    "profile.changePassword": "పాస్‌వర్డ్ మార్చండి", "profile.twoFA": "రెండు-అంచె ధృవీకరణ",
    "profile.notifications": "నోటిఫికేషన్లు",
    "common.save": "సేవ్ చేయండి", "common.cancel": "రద్దు చేయండి", "common.edit": "సవరించండి", "common.back": "వెనక్కి",
    "common.done": "పూర్తైంది", "common.submit": "సమర్పించండి", "common.loading": "లోడ్ అవుతోంది...", "common.error": "లోపం",
    "common.retry": "మళ్ళీ ప్రయత్నించండి", "common.search": "వెతకండి", "common.create": "సృష్టించండి", "common.enable": "ప్రారంభించండి",
    "common.change": "మార్చండి", "common.confirm": "నిర్ధారించండి", "common.yes": "అవును", "common.no": "లేదు",
    "common.remove": "తొలగించండి", "common.noData": "డేటా కనుగొనబడలేదు", "common.refresh": "రిఫ్రెష్",
    "common.language": "భాష", "common.all": "అన్నీ", "common.invested": "పెట్టుబడి",
    "bid.closeResolve": "మూసివేసి పరిష్కరించు", "bid.auctionLive": "మీ బిడ్ లైవ్‌లో ఉంది",
    "bid.inProgress": "వేలం జరుగుతోంది", "bid.won": "మీరు గెలిచారు!", "bid.outbid": "వేరే వారు ముందున్నారు",
    "detail.totalPool": "మొత్తం పూల్", "detail.monthlyContrib": "నెలవారీ చందా",
    "detail.nextBidDate": "తదుపరి వేలం తేదీ", "detail.contributions": "చందాలు",
  },

  kn: {
    "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "nav.myChits": "ನನ್ನ ಚಿಟ್ಸ್", "nav.chits": "ಚಿಟ್ಸ್",
    "nav.kyc": "KYC ಅಪ್‌ಲೋಡ್", "nav.paymentStatus": "ಪಾವತಿ ಸ್ಥಿತಿ", "nav.createGroup": "ಗ್ರೂಪ್ ರಚಿಸಿ",
    "nav.payments": "ಪಾವತಿಗಳು", "nav.profile": "ಪ್ರೊಫೈಲ್", "nav.logout": "ಲಾಗ್ ಔಟ್",
    "auth.login": "ಲಾಗಿನ್", "auth.signup": "ಸೈನ್ ಅಪ್", "auth.email": "ಇಮೇಲ್", "auth.phone": "ಫೋನ್",
    "auth.password": "ಪಾಸ್‌ವರ್ಡ್", "auth.forgotPassword": "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?", "auth.newPassword": "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್",
    "auth.confirmPassword": "ಪಾಸ್‌ವರ್ಡ್ ದೃಢಪಡಿಸಿ", "auth.createAccount": "ಖಾತೆ ರಚಿಸಿ",
    "auth.haveAccount": "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?", "auth.noAccount": "ಖಾತೆ ಇಲ್ಲವೇ?",
    "dash.title": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "dash.activeGroups": "ಸಕ್ರಿಯ ಗ್ರೂಪ್‌ಗಳು", "dash.totalInvested": "ಒಟ್ಟು ಹೂಡಿಕೆ",
    "dash.totalMembers": "ಒಟ್ಟು ಸದಸ್ಯರು", "dash.yourGroups": "ನಿಮ್ಮ ಚಿಟ್ ಗ್ರೂಪ್‌ಗಳು", "dash.noGroups": "ಚಿಟ್ ಗ್ರೂಪ್‌ಗಳಿಲ್ಲ",
    "group.monthly": "ಮಾಸಿಕ", "group.members": "ಸದಸ್ಯರು", "group.progress": "ಪ್ರಗತಿ",
    "group.nextBid": "ಮುಂದಿನ ಬಿಡ್", "group.viewDetails": "ವಿವರಗಳು ನೋಡಿ", "group.payNow": "ಈಗ ಪಾವತಿಸಿ",
    "group.month": "ತಿಂಗಳು", "group.of": "ರಲ್ಲಿ", "group.totalPool": "ಒಟ್ಟು ಪೂಲ್",
    "group.status.active": "ಸಕ್ರಿಯ", "group.status.upcoming": "ಮುಂಬರುವ", "group.status.completed": "ಪೂರ್ಣ",
    "group.createNew": "ಹೊಸ ಗ್ರೂಪ್ ರಚಿಸಿ", "group.name": "ಗ್ರೂಪ್ ಹೆಸರು", "group.duration": "ಅವಧಿ (ತಿಂಗಳುಗಳು)",
    "group.startDate": "ಪ್ರಾರಂಭ ದಿನಾಂಕ", "group.upiId": "ನಿಮ್ಮ UPI ID",
    "member.addMember": "ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ", "member.searchUser": "ಬಳಕೆದಾರರನ್ನು ಹುಡುಕಿ",
    "member.role": "ಪಾತ್ರ", "member.admin": "ನಿರ್ವಾಹಕ", "member.member": "ಸದಸ್ಯ",
    "member.remove": "ತೆಗೆದುಹಾಕಿ", "member.joinedOn": "ಸೇರಿದ ದಿನಾಂಕ", "member.noMembers": "ಸದಸ್ಯರಿಲ್ಲ",
    "member.searchPlaceholder": "ಇಮೇಲ್ ಅಥವಾ ಫೋನ್‌ನಿಂದ ಹುಡುಕಿ...", "member.roleChanged": "ಪಾತ್ರ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ",
    "member.added": "ಸದಸ್ಯ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ",
    "bid.placeBid": "ಬಿಡ್ ಹಾಕಿ", "bid.submitBid": "ಬಿಡ್ ಸಲ್ಲಿಸಿ", "bid.yourBid": "ನಿಮ್ಮ ಬಿಡ್",
    "bid.liveBids": "ಲೈವ್ ಬಿಡ್‌ಗಳು", "bid.bidHistory": "ಬಿಡ್ ಇತಿಹಾಸ", "bid.minBid": "ಕನಿಷ್ಠ ಬಿಡ್",
    "bid.maxBid": "ಗರಿಷ್ಠ ಬಿಡ್", "bid.noBids": "ಬಿಡ್‌ಗಳಿಲ್ಲ", "bid.auctionOpen": "ಹರಾಜು ತೆರೆದಿದೆ",
    "pay.payContrib": "ಮಾಸಿಕ ಕೊಡುಗೆ ಪಾವತಿಸಿ", "pay.holderUpi": "ಚಿಟ್ ಹೋಲ್ಡರ್ UPI ID",
    "pay.note": "ಪಾವತಿ ಟಿಪ್ಪಣಿ", "pay.chooseApp": "ಪಾವತಿ ಅಪ್ಲಿಕೇಶನ್ ಆರಿಸಿ", "pay.success": "ಪಾವತಿ ಯಶಸ್ವಿ",
    "pay.failed": "ಪಾವತಿ ವಿಫಲ", "pay.history": "ಪಾವತಿ ಇತಿಹಾಸ", "pay.totalPaid": "ಒಟ್ಟು ಪಾವತಿ",
    "pay.successRate": "ಯಶಸ್ಸಿನ ದರ", "pay.amount": "ಮೊತ್ತ",
    "profile.title": "ಪ್ರೊಫೈಲ್", "profile.personalInfo": "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ", "profile.fullName": "ಪೂರ್ಣ ಹೆಸರು",
    "profile.emailAddr": "ಇಮೇಲ್ ವಿಳಾಸ", "profile.phoneNum": "ಫೋನ್ ಸಂಖ್ಯೆ", "profile.security": "ಸುರಕ್ಷತೆ",
    "profile.changePassword": "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ", "profile.twoFA": "ಎರಡು-ಹಂತ ಪರಿಶೀಲನೆ",
    "profile.notifications": "ಅಧಿಸೂಚನೆಗಳು",
    "common.save": "ಉಳಿಸಿ", "common.cancel": "ರದ್ದು ಮಾಡಿ", "common.edit": "ತಿದ್ದಿ", "common.back": "ಹಿಂದೆ",
    "common.done": "ಮುಗಿಯಿತು", "common.submit": "ಸಲ್ಲಿಸಿ", "common.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ...", "common.error": "ದೋಷ",
    "common.retry": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", "common.search": "ಹುಡುಕಿ", "common.create": "ರಚಿಸಿ", "common.enable": "ಸಕ್ರಿಯಗೊಳಿಸಿ",
    "common.change": "ಬದಲಾಯಿಸಿ", "common.confirm": "ದೃಢಪಡಿಸಿ", "common.yes": "ಹೌದು", "common.no": "ಇಲ್ಲ",
    "common.remove": "ತೆಗೆದುಹಾಕಿ", "common.noData": "ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ", "common.refresh": "ರಿಫ್ರೆಶ್",
    "common.language": "ಭಾಷೆ", "common.all": "ಎಲ್ಲಾ", "common.invested": "ಹೂಡಿಕೆ",
    "bid.closeResolve": "ಮುಚ್ಚಿ ಪರಿಹರಿಸಿ", "bid.auctionLive": "ನಿಮ್ಮ ಬಿಡ್ ಲೈವ್‌ನಲ್ಲಿದೆ",
    "bid.inProgress": "ಹರಾಜು ನಡೆಯುತ್ತಿದೆ", "bid.won": "ನೀವು ಗೆದ್ದಿರಿ!", "bid.outbid": "ಬೇರೆಯವರು ಮುಂದೆ",
    "detail.totalPool": "ಒಟ್ಟು ಪೂಲ್", "detail.monthlyContrib": "ಮಾಸಿಕ ಕೊಡುಗೆ",
    "detail.nextBidDate": "ಮುಂದಿನ ಬಿಡ್ ದಿನಾಂಕ", "detail.contributions": "ಕೊಡುಗೆಗಳು",
  },

  ml: {
    "nav.dashboard": "ഡാഷ്‌ബോർഡ്", "nav.myChits": "എന്റെ ചിട്ടികൾ", "nav.chits": "ചിട്ടികൾ",
    "nav.kyc": "KYC അപ്‌ലോഡ്", "nav.paymentStatus": "പേമെന്റ് സ്റ്റാറ്റസ്", "nav.createGroup": "ഗ്രൂപ്പ് ഉണ്ടാക്കൂ",
    "nav.payments": "പേമെന്റുകൾ", "nav.profile": "പ്രൊഫൈൽ", "nav.logout": "ലോഗൗട്ട്",
    "auth.login": "ലോഗിൻ", "auth.signup": "സൈൻ അപ്പ്", "auth.email": "ഇമെയിൽ", "auth.phone": "ഫോൺ",
    "auth.password": "പാസ്‌വേഡ്", "auth.forgotPassword": "പാസ്‌വേഡ് മറന്നോ?", "auth.newPassword": "പുതിയ പാസ്‌വേഡ്",
    "auth.confirmPassword": "പാസ്‌വേഡ് സ്ഥിരീകരിക്കൂ", "auth.createAccount": "അക്കൗണ്ട് ഉണ്ടാക്കൂ",
    "auth.haveAccount": "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?", "auth.noAccount": "അക്കൗണ്ട് ഇല്ലേ?",
    "dash.title": "ഡാഷ്‌ബോർഡ്", "dash.activeGroups": "സജീവ ഗ്രൂപ്പുകൾ", "dash.totalInvested": "മൊത്തം നിക്ഷേപം",
    "dash.totalMembers": "മൊത്തം അംഗങ്ങൾ", "dash.yourGroups": "നിങ്ങളുടെ ചിട്ടി ഗ്രൂപ്പുകൾ", "dash.noGroups": "ചിട്ടി ഗ്രൂപ്പുകൾ ഇല്ല",
    "group.monthly": "മാസം", "group.members": "അംഗങ്ങൾ", "group.progress": "പുരോഗതി",
    "group.nextBid": "അടുത്ത ലേലം", "group.viewDetails": "വിശദാംശങ്ങൾ കാണൂ", "group.payNow": "ഇപ്പോൾ അടക്കൂ",
    "group.month": "മാസം", "group.of": "ൽ", "group.totalPool": "ആകെ പൂൾ",
    "group.status.active": "സജീവം", "group.status.upcoming": "വരുന്നത്", "group.status.completed": "പൂർത്തിയായി",
    "group.createNew": "പുതിയ ഗ്രൂപ്പ് ഉണ്ടാക്കൂ", "group.name": "ഗ്രൂപ്പ് നാമം", "group.duration": "കാലാവധി (മാസം)",
    "group.startDate": "ആരംഭ തീയതി", "group.upiId": "നിങ്ങളുടെ UPI ID",
    "member.addMember": "അംഗത്തെ ചേർക്കൂ", "member.searchUser": "ഉപയോക്താവിനെ തിരയൂ",
    "member.role": "റോൾ", "member.admin": "അഡ്മിൻ", "member.member": "അംഗം",
    "member.remove": "നീക്കൂ", "member.joinedOn": "ചേർന്നത്", "member.noMembers": "അംഗങ്ങൾ ഇല്ല",
    "member.searchPlaceholder": "ഇമെയിൽ അല്ലെങ്കിൽ ഫോൺ ഉപയോഗിച്ച് തിരയൂ...", "member.roleChanged": "റോൾ അപ്‌ഡേറ്റ് ആയി",
    "member.added": "അംഗം വിജയകരമായി ചേർക്കപ്പെട്ടു",
    "bid.placeBid": "ലേലം വിളിക്കൂ", "bid.submitBid": "ലേലം സമർപ്പിക്കൂ", "bid.yourBid": "നിങ്ങളുടെ ലേലം",
    "bid.liveBids": "ലൈവ് ലേലങ്ങൾ", "bid.bidHistory": "ലേല ചരിത്രം", "bid.minBid": "ഏറ്റവും കുറഞ്ഞ ലേലം",
    "bid.maxBid": "ഏറ്റവും കൂടിയ ലേലം", "bid.noBids": "ലേലങ്ങൾ ഇല്ല", "bid.auctionOpen": "ലേലം തുറന്നിരിക്കുന്നു",
    "pay.payContrib": "മാസ സംഭാവന അടക്കൂ", "pay.holderUpi": "ചിട്ടി ഉടമസ്ഥന്റെ UPI ID",
    "pay.note": "പേമെന്റ് കുറിപ്പ്", "pay.chooseApp": "പേമെന്റ് ആപ്പ് തിരഞ്ഞെടുക്കൂ", "pay.success": "പേമെന്റ് വിജയകരം",
    "pay.failed": "പേമെന്റ് പരാജയം", "pay.history": "പേമെന്റ് ചരിത്രം", "pay.totalPaid": "ആകെ അടച്ചത്",
    "pay.successRate": "വിജയ നിരക്ക്", "pay.amount": "തുക",
    "profile.title": "പ്രൊഫൈൽ", "profile.personalInfo": "വ്യക്തിഗത വിവരം", "profile.fullName": "മുഴുവൻ പേര്",
    "profile.emailAddr": "ഇമെയിൽ വിലാസം", "profile.phoneNum": "ഫോൺ നമ്പർ", "profile.security": "സുരക്ഷ",
    "profile.changePassword": "പാസ്‌വേഡ് മാറ്റൂ", "profile.twoFA": "ദ്വി-ഘടക സ്ഥിരീകരണം",
    "profile.notifications": "അറിയിപ്പുകൾ",
    "common.save": "സേവ് ചെയ്യൂ", "common.cancel": "റദ്ദ് ചെയ്യൂ", "common.edit": "തിരുത്തൂ", "common.back": "തിരിച്ചു",
    "common.done": "പൂർത്തിയായി", "common.submit": "സമർപ്പിക്കൂ", "common.loading": "ലോഡ് ആകുന്നു...", "common.error": "പിശക്",
    "common.retry": "വീണ്ടും ശ്രമിക്കൂ", "common.search": "തിരയൂ", "common.create": "ഉണ്ടാക്കൂ", "common.enable": "പ്രവർത്തനക്ഷമമാക്കൂ",
    "common.change": "മാറ്റൂ", "common.confirm": "സ്ഥിരീകരിക്കൂ", "common.yes": "അതെ", "common.no": "ഇല്ല",
    "common.remove": "നീക്കൂ", "common.noData": "ഡേറ്റ ഇല്ല", "common.refresh": "റിഫ്രഷ്",
    "common.language": "ഭാഷ",
  },

  mr: {
    "nav.dashboard": "डॅशबोर्ड", "nav.myChits": "माझे चिट", "nav.chits": "चिट",
    "nav.kyc": "KYC अपलोड", "nav.paymentStatus": "पेमेंट स्थिती", "nav.createGroup": "गट तयार करा",
    "nav.payments": "पेमेंट", "nav.profile": "प्रोफाइल", "nav.logout": "लॉग आउट",
    "auth.login": "लॉग इन", "auth.signup": "साइन अप", "auth.email": "ईमेल", "auth.phone": "फोन",
    "auth.password": "पासवर्ड", "auth.forgotPassword": "पासवर्ड विसरलात?", "auth.newPassword": "नवीन पासवर्ड",
    "auth.confirmPassword": "पासवर्ड पुष्टी करा", "auth.createAccount": "खाते तयार करा",
    "auth.haveAccount": "आधीपासून खाते आहे?", "auth.noAccount": "खाते नाही?",
    "dash.title": "डॅशबोर्ड", "dash.activeGroups": "सक्रिय गट", "dash.totalInvested": "एकूण गुंतवणूक",
    "dash.totalMembers": "एकूण सदस्य", "dash.yourGroups": "तुमचे चिट गट", "dash.noGroups": "अजून चिट गट नाही",
    "group.monthly": "मासिक", "group.members": "सदस्य", "group.progress": "प्रगती",
    "group.nextBid": "पुढील बोली", "group.viewDetails": "तपशील पाहा", "group.payNow": "आत्ता पेमेंट करा",
    "group.month": "महिना", "group.of": "पैकी", "group.totalPool": "एकूण पूल",
    "group.status.active": "सक्रिय", "group.status.upcoming": "येणारे", "group.status.completed": "पूर्ण",
    "group.createNew": "नवीन गट तयार करा", "group.name": "गटाचे नाव", "group.duration": "कालावधी (महिने)",
    "group.startDate": "प्रारंभ तारीख", "group.upiId": "तुमचा UPI ID",
    "member.addMember": "सदस्य जोडा", "member.searchUser": "वापरकर्ता शोधा",
    "member.role": "भूमिका", "member.admin": "प्रशासक", "member.member": "सदस्य",
    "member.remove": "काढा", "member.joinedOn": "सामील झाले", "member.noMembers": "सदस्य नाहीत",
    "member.searchPlaceholder": "ईमेल किंवा फोनने शोधा...", "member.roleChanged": "भूमिका अपडेट झाली",
    "member.added": "सदस्य यशस्वीरित्या जोडला",
    "bid.placeBid": "बोली लावा", "bid.submitBid": "बोली सबमिट करा", "bid.yourBid": "तुमची बोली",
    "bid.liveBids": "लाइव्ह बोल्या", "bid.bidHistory": "बोली इतिहास", "bid.minBid": "किमान बोली",
    "bid.maxBid": "कमाल बोली", "bid.noBids": "अजून बोल्या नाहीत", "bid.auctionOpen": "लिलाव सुरू आहे",
    "pay.payContrib": "मासिक योगदान द्या", "pay.holderUpi": "चिट धारकाचा UPI ID",
    "pay.note": "पेमेंट नोट", "pay.chooseApp": "पेमेंट अॅप निवडा", "pay.success": "पेमेंट यशस्वी",
    "pay.failed": "पेमेंट अयशस्वी", "pay.history": "पेमेंट इतिहास", "pay.totalPaid": "एकूण दिलेले",
    "pay.successRate": "यश दर", "pay.amount": "रक्कम",
    "profile.title": "प्रोफाइल", "profile.personalInfo": "वैयक्तिक माहिती", "profile.fullName": "पूर्ण नाव",
    "profile.emailAddr": "ईमेल पत्ता", "profile.phoneNum": "फोन नंबर", "profile.security": "सुरक्षा",
    "profile.changePassword": "पासवर्ड बदला", "profile.twoFA": "दोन-घटक प्रमाणीकरण",
    "profile.notifications": "सूचना",
    "common.save": "जतन करा", "common.cancel": "रद्द करा", "common.edit": "संपादित करा", "common.back": "मागे",
    "common.done": "झाले", "common.submit": "सबमिट करा", "common.loading": "लोड होत आहे...", "common.error": "त्रुटी",
    "common.retry": "पुन्हा प्रयत्न करा", "common.search": "शोधा", "common.create": "तयार करा", "common.enable": "सक्षम करा",
    "common.change": "बदला", "common.confirm": "पुष्टी करा", "common.yes": "होय", "common.no": "नाही",
    "common.remove": "काढा", "common.noData": "डेटा सापडला नाही", "common.refresh": "रिफ्रेश",
    "common.language": "भाषा",
  },

  bn: {
    "nav.dashboard": "ড্যাশবোর্ড", "nav.myChits": "আমার চিট", "nav.chits": "চিট",
    "nav.kyc": "KYC আপলোড", "nav.paymentStatus": "পেমেন্ট স্ট্যাটাস", "nav.createGroup": "গ্রুপ তৈরি করুন",
    "nav.payments": "পেমেন্ট", "nav.profile": "প্রোফাইল", "nav.logout": "লগ আউট",
    "auth.login": "লগ ইন", "auth.signup": "সাইন আপ", "auth.email": "ইমেইল", "auth.phone": "ফোন",
    "auth.password": "পাসওয়ার্ড", "auth.forgotPassword": "পাসওয়ার্ড ভুলে গেছেন?", "auth.newPassword": "নতুন পাসওয়ার্ড",
    "auth.confirmPassword": "পাসওয়ার্ড নিশ্চিত করুন", "auth.createAccount": "অ্যাকাউন্ট তৈরি করুন",
    "auth.haveAccount": "ইতিমধ্যে অ্যাকাউন্ট আছে?", "auth.noAccount": "অ্যাকাউন্ট নেই?",
    "dash.title": "ড্যাশবোর্ড", "dash.activeGroups": "সক্রিয় গ্রুপ", "dash.totalInvested": "মোট বিনিয়োগ",
    "dash.totalMembers": "মোট সদস্য", "dash.yourGroups": "আপনার চিট গ্রুপ", "dash.noGroups": "এখনো কোনো চিট গ্রুপ নেই",
    "group.monthly": "মাসিক", "group.members": "সদস্য", "group.progress": "অগ্রগতি",
    "group.nextBid": "পরবর্তী বিড", "group.viewDetails": "বিবরণ দেখুন", "group.payNow": "এখনই পেমেন্ট করুন",
    "group.month": "মাস", "group.of": "এর মধ্যে", "group.totalPool": "মোট পুল",
    "group.status.active": "সক্রিয়", "group.status.upcoming": "আসন্ন", "group.status.completed": "সম্পন্ন",
    "group.createNew": "নতুন গ্রুপ তৈরি করুন", "group.name": "গ্রুপের নাম", "group.duration": "সময়কাল (মাস)",
    "group.startDate": "শুরুর তারিখ", "group.upiId": "আপনার UPI ID",
    "member.addMember": "সদস্য যোগ করুন", "member.searchUser": "ব্যবহারকারী খুঁজুন",
    "member.role": "ভূমিকা", "member.admin": "অ্যাডমিন", "member.member": "সদস্য",
    "member.remove": "সরান", "member.joinedOn": "যোগদান", "member.noMembers": "কোনো সদস্য নেই",
    "member.searchPlaceholder": "ইমেইল বা ফোন দিয়ে খুঁজুন...", "member.roleChanged": "ভূমিকা আপডেট হয়েছে",
    "member.added": "সদস্য সফলভাবে যোগ করা হয়েছে",
    "bid.placeBid": "বিড করুন", "bid.submitBid": "বিড জমা দিন", "bid.yourBid": "আপনার বিড",
    "bid.liveBids": "লাইভ বিড", "bid.bidHistory": "বিড ইতিহাস", "bid.minBid": "ন্যূনতম বিড",
    "bid.maxBid": "সর্বোচ্চ বিড", "bid.noBids": "এখনো কোনো বিড নেই", "bid.auctionOpen": "নিলাম খোলা আছে",
    "pay.payContrib": "মাসিক চাঁদা দিন", "pay.holderUpi": "চিট হোল্ডারের UPI ID",
    "pay.note": "পেমেন্ট নোট", "pay.chooseApp": "পেমেন্ট অ্যাপ বেছে নিন", "pay.success": "পেমেন্ট সফল",
    "pay.failed": "পেমেন্ট ব্যর্থ", "pay.history": "পেমেন্ট ইতিহাস", "pay.totalPaid": "মোট পরিশোধিত",
    "pay.successRate": "সাফল্যের হার", "pay.amount": "পরিমাণ",
    "profile.title": "প্রোফাইল", "profile.personalInfo": "ব্যক্তিগত তথ্য", "profile.fullName": "পুরো নাম",
    "profile.emailAddr": "ইমেইল ঠিকানা", "profile.phoneNum": "ফোন নম্বর", "profile.security": "নিরাপত্তা",
    "profile.changePassword": "পাসওয়ার্ড পরিবর্তন", "profile.twoFA": "দুই-ধাপ যাচাইকরণ",
    "profile.notifications": "বিজ্ঞপ্তি",
    "common.save": "সংরক্ষণ", "common.cancel": "বাতিল", "common.edit": "সম্পাদনা", "common.back": "পিছনে",
    "common.done": "সম্পন্ন", "common.submit": "জমা দিন", "common.loading": "লোড হচ্ছে...", "common.error": "ত্রুটি",
    "common.retry": "পুনরায় চেষ্টা", "common.search": "খুঁজুন", "common.create": "তৈরি করুন", "common.enable": "সক্ষম করুন",
    "common.change": "পরিবর্তন", "common.confirm": "নিশ্চিত করুন", "common.yes": "হ্যাঁ", "common.no": "না",
    "common.remove": "সরান", "common.noData": "কোনো ডেটা পাওয়া যায়নি", "common.refresh": "রিফ্রেশ",
    "common.language": "ভাষা",
  },

  gu: {
    "nav.dashboard": "ડેશબોર્ડ", "nav.myChits": "મારી ચિટ", "nav.chits": "ચિટ",
    "nav.kyc": "KYC અપલોડ", "nav.paymentStatus": "ચુકવણી સ્થિતિ", "nav.createGroup": "જૂથ બનાવો",
    "nav.payments": "ચુકવણીઓ", "nav.profile": "પ્રોફાઇલ", "nav.logout": "લોગ આઉટ",
    "auth.login": "લૉગ ઇન", "auth.signup": "સાઇન અપ", "auth.email": "ઇમેઇલ", "auth.phone": "ફોન",
    "auth.password": "પાસવર્ડ", "auth.forgotPassword": "પાસવર્ડ ભૂલ્યા?", "auth.newPassword": "નવો પાસવર્ડ",
    "auth.confirmPassword": "પાસવર્ડ ખાતરી", "auth.createAccount": "ખાતું બનાવો",
    "auth.haveAccount": "પહેલેથી ખાતું છે?", "auth.noAccount": "ખાતું નથી?",
    "dash.title": "ડેશબોર્ડ", "dash.activeGroups": "સક્રિય જૂથો", "dash.totalInvested": "કુલ રોકાણ",
    "dash.totalMembers": "કુલ સભ્યો", "dash.yourGroups": "તમારા ચિટ જૂથો", "dash.noGroups": "હજી ચિટ જૂથ નથી",
    "group.monthly": "માસિક", "group.members": "સભ્યો", "group.progress": "પ્રગતિ",
    "group.nextBid": "આગળની બોલી", "group.viewDetails": "વિગત જુઓ", "group.payNow": "હમણાં ચૂકવો",
    "group.month": "મહિનો", "group.of": "માંથી", "group.totalPool": "કુલ ભંડોળ",
    "group.status.active": "સક્રિય", "group.status.upcoming": "આગામી", "group.status.completed": "પૂર્ણ",
    "group.createNew": "નવું જૂથ બનાવો", "group.name": "જૂથ નામ", "group.duration": "સમયગાળો (મહિના)",
    "group.startDate": "શરૂ થવાની તારીખ", "group.upiId": "તમારો UPI ID",
    "member.addMember": "સભ્ય ઉમેરો", "member.searchUser": "વપરાશકર્તા શોધો",
    "member.role": "ભૂમિકા", "member.admin": "સંચાલક", "member.member": "સભ્ય",
    "member.remove": "દૂર કરો", "member.joinedOn": "જોડાયા", "member.noMembers": "સભ્ય નથી",
    "member.searchPlaceholder": "ઇમેઇલ અથવા ફોન દ્વારા શોધો...", "member.roleChanged": "ભૂમિકા અપડેટ થઈ",
    "member.added": "સભ્ય સફળતાપૂર્વક ઉમેરાયો",
    "bid.placeBid": "બોલી લગાવો", "bid.submitBid": "બોલી સબમિટ કરો", "bid.yourBid": "તમારી બોલી",
    "bid.liveBids": "લાઇવ બોલીઓ", "bid.bidHistory": "બોલી ઇતિહાસ", "bid.minBid": "ઓછામાં ઓછી બોલી",
    "bid.maxBid": "વધુમાં વધુ બોલી", "bid.noBids": "હજી બોલી નથી", "bid.auctionOpen": "હરાજ ખુલ્લી છે",
    "pay.payContrib": "માસિક યોગદાન ચૂકવો", "pay.holderUpi": "ચિટ ધારકનો UPI ID",
    "pay.note": "ચુકવણી નોંધ", "pay.chooseApp": "ચુકવણી એપ પસંદ કરો", "pay.success": "ચુકવણી સફળ",
    "pay.failed": "ચુકવણી નિષ્ફળ", "pay.history": "ચુકવણી ઇતિહાસ", "pay.totalPaid": "કુલ ચૂક્યું",
    "pay.successRate": "સફળતા દર", "pay.amount": "રકમ",
    "profile.title": "પ્રોફાઇલ", "profile.personalInfo": "વ્યક્તિગત માહિતી", "profile.fullName": "પૂરું નામ",
    "profile.emailAddr": "ઇમેઇલ સરનામું", "profile.phoneNum": "ફોન નંબર", "profile.security": "સુરક્ષા",
    "profile.changePassword": "પાસવર્ડ બદલો", "profile.twoFA": "બે-પગલાં ચકાસણી",
    "profile.notifications": "સૂચનાઓ",
    "common.save": "સાચવો", "common.cancel": "રદ કરો", "common.edit": "સંપાદિત કરો", "common.back": "પાછા",
    "common.done": "થઈ ગયું", "common.submit": "સબમિટ", "common.loading": "લોડ થઈ રહ્યું...", "common.error": "ભૂલ",
    "common.retry": "ફરી પ્રયાસ", "common.search": "શોધો", "common.create": "બનાવો", "common.enable": "સક્ષમ કરો",
    "common.change": "બદલો", "common.confirm": "ખાતરી", "common.yes": "હા", "common.no": "ના",
    "common.remove": "દૂર કરો", "common.noData": "ડેટા મળ્યો નહીં", "common.refresh": "રિફ્રેશ",
    "common.language": "ભાષા",
  },

  pa: {
    "nav.dashboard": "ਡੈਸ਼ਬੋਰਡ", "nav.myChits": "ਮੇਰੀਆਂ ਚਿੱਟਾਂ", "nav.chits": "ਚਿੱਟਾਂ",
    "nav.kyc": "KYC ਅਪਲੋਡ", "nav.paymentStatus": "ਭੁਗਤਾਨ ਸਥਿਤੀ", "nav.createGroup": "ਗਰੁੱਪ ਬਣਾਓ",
    "nav.payments": "ਭੁਗਤਾਨ", "nav.profile": "ਪ੍ਰੋਫਾਈਲ", "nav.logout": "ਲੌਗ ਆਊਟ",
    "auth.login": "ਲੌਗ ਇਨ", "auth.signup": "ਸਾਈਨ ਅੱਪ", "auth.email": "ਈਮੇਲ", "auth.phone": "ਫ਼ੋਨ",
    "auth.password": "ਪਾਸਵਰਡ", "auth.forgotPassword": "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?", "auth.newPassword": "ਨਵਾਂ ਪਾਸਵਰਡ",
    "auth.confirmPassword": "ਪਾਸਵਰਡ ਪੁਸ਼ਟੀ ਕਰੋ", "auth.createAccount": "ਖਾਤਾ ਬਣਾਓ",
    "auth.haveAccount": "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?", "auth.noAccount": "ਖਾਤਾ ਨਹੀਂ ਹੈ?",
    "dash.title": "ਡੈਸ਼ਬੋਰਡ", "dash.activeGroups": "ਸਰਗਰਮ ਗਰੁੱਪ", "dash.totalInvested": "ਕੁੱਲ ਨਿਵੇਸ਼",
    "dash.totalMembers": "ਕੁੱਲ ਮੈਂਬਰ", "dash.yourGroups": "ਤੁਹਾਡੇ ਚਿੱਟ ਗਰੁੱਪ", "dash.noGroups": "ਅਜੇ ਕੋਈ ਚਿੱਟ ਗਰੁੱਪ ਨਹੀਂ",
    "group.monthly": "ਮਾਸਿਕ", "group.members": "ਮੈਂਬਰ", "group.progress": "ਤਰੱਕੀ",
    "group.nextBid": "ਅਗਲੀ ਬੋਲੀ", "group.viewDetails": "ਵੇਰਵੇ ਦੇਖੋ", "group.payNow": "ਹੁਣੇ ਭੁਗਤਾਨ ਕਰੋ",
    "group.month": "ਮਹੀਨਾ", "group.of": "ਵਿੱਚੋਂ", "group.totalPool": "ਕੁੱਲ ਫੰਡ",
    "group.status.active": "ਸਰਗਰਮ", "group.status.upcoming": "ਆਉਣ ਵਾਲਾ", "group.status.completed": "ਮੁਕੰਮਲ",
    "group.createNew": "ਨਵਾਂ ਗਰੁੱਪ ਬਣਾਓ", "group.name": "ਗਰੁੱਪ ਦਾ ਨਾਮ", "group.duration": "ਅਵਧੀ (ਮਹੀਨੇ)",
    "group.startDate": "ਸ਼ੁਰੂਆਤ ਦੀ ਤਾਰੀਖ", "group.upiId": "ਤੁਹਾਡਾ UPI ID",
    "member.addMember": "ਮੈਂਬਰ ਜੋੜੋ", "member.searchUser": "ਉਪਭੋਗਤਾ ਲੱਭੋ",
    "member.role": "ਭੂਮਿਕਾ", "member.admin": "ਪ੍ਰਸ਼ਾਸਕ", "member.member": "ਮੈਂਬਰ",
    "member.remove": "ਹਟਾਓ", "member.joinedOn": "ਸ਼ਾਮਲ ਹੋਏ", "member.noMembers": "ਕੋਈ ਮੈਂਬਰ ਨਹੀਂ",
    "member.searchPlaceholder": "ਈਮੇਲ ਜਾਂ ਫ਼ੋਨ ਨਾਲ ਲੱਭੋ...", "member.roleChanged": "ਭੂਮਿਕਾ ਅੱਪਡੇਟ ਹੋਈ",
    "member.added": "ਮੈਂਬਰ ਸਫਲਤਾਪੂਰਵਕ ਜੋੜਿਆ ਗਿਆ",
    "bid.placeBid": "ਬੋਲੀ ਲਾਓ", "bid.submitBid": "ਬੋਲੀ ਜਮ੍ਹਾਂ ਕਰੋ", "bid.yourBid": "ਤੁਹਾਡੀ ਬੋਲੀ",
    "bid.liveBids": "ਲਾਈਵ ਬੋਲੀਆਂ", "bid.bidHistory": "ਬੋਲੀ ਇਤਿਹਾਸ", "bid.minBid": "ਘੱਟੋ-ਘੱਟ ਬੋਲੀ",
    "bid.maxBid": "ਵੱਧ ਤੋਂ ਵੱਧ ਬੋਲੀ", "bid.noBids": "ਹਾਲੇ ਕੋਈ ਬੋਲੀ ਨਹੀਂ", "bid.auctionOpen": "ਨਿਲਾਮੀ ਖੁੱਲ੍ਹੀ ਹੈ",
    "pay.payContrib": "ਮਾਸਿਕ ਯੋਗਦਾਨ ਦਿਓ", "pay.holderUpi": "ਚਿੱਟ ਧਾਰਕ ਦਾ UPI ID",
    "pay.note": "ਭੁਗਤਾਨ ਨੋਟ", "pay.chooseApp": "ਭੁਗਤਾਨ ਐਪ ਚੁਣੋ", "pay.success": "ਭੁਗਤਾਨ ਸਫਲ",
    "pay.failed": "ਭੁਗਤਾਨ ਅਸਫਲ", "pay.history": "ਭੁਗਤਾਨ ਇਤਿਹਾਸ", "pay.totalPaid": "ਕੁੱਲ ਭੁਗਤਾਨ",
    "pay.successRate": "ਸਫਲਤਾ ਦਰ", "pay.amount": "ਰਕਮ",
    "profile.title": "ਪ੍ਰੋਫਾਈਲ", "profile.personalInfo": "ਨਿੱਜੀ ਜਾਣਕਾਰੀ", "profile.fullName": "ਪੂਰਾ ਨਾਮ",
    "profile.emailAddr": "ਈਮੇਲ ਪਤਾ", "profile.phoneNum": "ਫ਼ੋਨ ਨੰਬਰ", "profile.security": "ਸੁਰੱਖਿਆ",
    "profile.changePassword": "ਪਾਸਵਰਡ ਬਦਲੋ", "profile.twoFA": "ਦੋ-ਕਦਮ ਤਸਦੀਕ",
    "profile.notifications": "ਸੂਚਨਾਵਾਂ",
    "common.save": "ਸੇਵ ਕਰੋ", "common.cancel": "ਰੱਦ ਕਰੋ", "common.edit": "ਸੋਧੋ", "common.back": "ਵਾਪਸ",
    "common.done": "ਮੁਕੰਮਲ", "common.submit": "ਜਮ੍ਹਾਂ ਕਰੋ", "common.loading": "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...", "common.error": "ਗਲਤੀ",
    "common.retry": "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ", "common.search": "ਖੋਜੋ", "common.create": "ਬਣਾਓ", "common.enable": "ਸਮਰੱਥ ਕਰੋ",
    "common.change": "ਬਦਲੋ", "common.confirm": "ਪੁਸ਼ਟੀ ਕਰੋ", "common.yes": "ਹਾਂ", "common.no": "ਨਹੀਂ",
    "common.remove": "ਹਟਾਓ", "common.noData": "ਕੋਈ ਡੇਟਾ ਨਹੀਂ ਮਿਲਿਆ", "common.refresh": "ਰਿਫ੍ਰੈਸ਼",
    "common.language": "ਭਾਸ਼ਾ",
  },

  or: {
    "nav.dashboard": "ଡ୍ୟାଶ୍‌ବୋର୍ଡ", "nav.myChits": "ମୋ ଚିଟ", "nav.chits": "ଚିଟ",
    "nav.kyc": "KYC ଅପଲୋଡ", "nav.paymentStatus": "ଦେୟ ସ୍ଥିତି", "nav.createGroup": "ଗ୍ରୁପ ତିଆରି",
    "nav.payments": "ଦେୟ", "nav.profile": "ପ୍ରୋଫାଇଲ", "nav.logout": "ଲଗ ଆଉଟ",
    "auth.login": "ଲଗ ଇନ", "auth.signup": "ସାଇନ ଅପ", "auth.email": "ଇମେଲ", "auth.phone": "ଫୋନ",
    "auth.password": "ପାସୱର୍ଡ", "auth.forgotPassword": "ପାସୱର୍ଡ ଭୁଲିଗଲେ?", "auth.newPassword": "ନୂଆ ପାସୱର୍ଡ",
    "auth.confirmPassword": "ପାସୱର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ", "auth.createAccount": "ଖାତା ଖୋଲନ୍ତୁ",
    "auth.haveAccount": "ପୂର୍ବରୁ ଖାତା ଅଛି?", "auth.noAccount": "ଖାତା ନାହିଁ?",
    "dash.title": "ଡ୍ୟାଶ୍‌ବୋର୍ଡ", "dash.activeGroups": "ସକ୍ରିୟ ଗ୍ରୁପ", "dash.totalInvested": "ମୋଟ ବିନିଯୋଗ",
    "dash.totalMembers": "ମୋଟ ସଦସ୍ୟ", "dash.yourGroups": "ଆପଣଙ୍କ ଚିଟ ଗ୍ରୁପ", "dash.noGroups": "ଏଯାଏ ଚିଟ ଗ୍ରୁପ ନାହିଁ",
    "group.monthly": "ମାସିକ", "group.members": "ସଦସ୍ୟ", "group.progress": "ଅଗ୍ରଗତି",
    "group.nextBid": "ପରବର୍ତ୍ତୀ ବିଡ", "group.viewDetails": "ବିବରଣୀ ଦେଖନ୍ତୁ", "group.payNow": "ଏବେ ଦେୟ ଦିଅନ୍ତୁ",
    "group.month": "ମାସ", "group.of": "ରୁ", "group.totalPool": "ମୋଟ ପୁଲ",
    "group.status.active": "ସକ୍ରିୟ", "group.status.upcoming": "ଆସୁଥିବା", "group.status.completed": "ସମ୍ପୂର୍ଣ",
    "group.createNew": "ନୂଆ ଗ୍ରୁପ ତିଆରି", "group.name": "ଗ୍ରୁପ ନାମ", "group.duration": "ଅବଧି (ମାସ)",
    "group.startDate": "ଆରମ୍ଭ ତାରିଖ", "group.upiId": "ଆପଣଙ୍କ UPI ID",
    "member.addMember": "ସଦସ୍ୟ ଯୋଡ଼ନ୍ତୁ", "member.searchUser": "ଉପଭୋକ୍ତା ଖୋଜନ୍ତୁ",
    "member.role": "ଭୂମିକା", "member.admin": "ଆଡ୍‌ମିନ", "member.member": "ସଦସ୍ୟ",
    "member.remove": "ହଟାନ୍ତୁ", "member.joinedOn": "ଯୋଗ ଦେଲେ", "member.noMembers": "ସଦସ୍ୟ ନାହିଁ",
    "member.searchPlaceholder": "ଇମେଲ ବା ଫୋନ ଦ୍ୱାରା ଖୋଜନ୍ତୁ...", "member.roleChanged": "ଭୂମିକା ଅଦ୍ୟତନ ହୋଇଛି",
    "member.added": "ସଦସ୍ୟ ସଫଳତାର ସହ ଯୋଡ଼ା ଗଲା",
    "bid.placeBid": "ବିଡ ଦିଅନ୍ତୁ", "bid.submitBid": "ବିଡ ଦାଖଲ", "bid.yourBid": "ଆପଣଙ୍କ ବିଡ",
    "bid.liveBids": "ଲାଇଭ ବିଡ", "bid.bidHistory": "ବିଡ ଇତିହାସ", "bid.minBid": "ସର୍ବନିମ୍ନ ବିଡ",
    "bid.maxBid": "ସର୍ବୋଚ୍ଚ ବିଡ", "bid.noBids": "ଏଯାଏ ବିଡ ନାହିଁ", "bid.auctionOpen": "ନିଲାମ ଖୋଲା ଅଛି",
    "pay.payContrib": "ମାସିକ ଅବଦାନ ଦିଅନ୍ତୁ", "pay.holderUpi": "ଚିଟ ଧାରକଙ୍କ UPI ID",
    "pay.note": "ଦେୟ ଟିପ୍ପଣୀ", "pay.chooseApp": "ଦେୟ ଆପ ବାଛନ୍ତୁ", "pay.success": "ଦେୟ ସଫଳ",
    "pay.failed": "ଦେୟ ବିଫଳ", "pay.history": "ଦେୟ ଇତିହାସ", "pay.totalPaid": "ମୋଟ ଦେୟ",
    "pay.successRate": "ସଫଳତା ହାର", "pay.amount": "ରାଶି",
    "profile.title": "ପ୍ରୋଫାଇଲ", "profile.personalInfo": "ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ", "profile.fullName": "ସମ୍ପୂର୍ଣ ନାମ",
    "profile.emailAddr": "ଇମେଲ ଠିକଣା", "profile.phoneNum": "ଫୋନ ନମ୍ବର", "profile.security": "ସୁରକ୍ଷା",
    "profile.changePassword": "ପାସୱର୍ଡ ବଦଳାନ୍ତୁ", "profile.twoFA": "ଦ୍ୱି-ପଦକ୍ଷେପ ଯାଞ୍ଚ",
    "profile.notifications": "ବିଜ୍ଞପ୍ତି",
    "common.save": "ସଞ୍ଚୟ", "common.cancel": "ବାତିଲ", "common.edit": "ସଂଶୋଧନ", "common.back": "ଫେରନ୍ତୁ",
    "common.done": "ସମ୍ପୂର୍ଣ", "common.submit": "ଦାଖଲ", "common.loading": "ଲୋଡ ହେଉଛି...", "common.error": "ତ୍ରୁଟି",
    "common.retry": "ପୁଣି ଚେଷ୍ଟା", "common.search": "ଖୋଜ", "common.create": "ତିଆରି", "common.enable": "ସକ୍ଷମ",
    "common.change": "ବଦଳାନ୍ତୁ", "common.confirm": "ନିଶ୍ଚିତ", "common.yes": "ହଁ", "common.no": "ନା",
    "common.remove": "ହଟାନ୍ତୁ", "common.noData": "ତଥ୍ୟ ମିଳିଲା ନାହିଁ", "common.refresh": "ରିଫ୍ରେଶ",
    "common.language": "ଭାଷା",
  },

  as: {
    "nav.dashboard": "ডেশ্বোর্ড", "nav.myChits": "মোর চিট", "nav.chits": "চিট",
    "nav.kyc": "KYC আপলোড", "nav.paymentStatus": "পেমেণ্ট স্থিতি", "nav.createGroup": "গ্ৰুপ বনাওক",
    "nav.payments": "পেমেণ্ট", "nav.profile": "প্ৰফাইল", "nav.logout": "লগ আউট",
    "auth.login": "লগ ইন", "auth.signup": "চাইন আপ", "auth.email": "ইমেইল", "auth.phone": "ফোন",
    "auth.password": "পাছৱর্ড", "auth.forgotPassword": "পাছৱর্ড পাহৰিলে?", "auth.newPassword": "নতুন পাছৱর্ড",
    "auth.confirmPassword": "পাছৱর্ড নিশ্চিত কৰক", "auth.createAccount": "একাউণ্ট খোলক",
    "auth.haveAccount": "ইতিমধ্যে একাউণ্ট আছে?", "auth.noAccount": "একাউণ্ট নাই?",
    "dash.title": "ডেশ্বোর্ড", "dash.activeGroups": "সক্ৰিয় গ্ৰুপ", "dash.totalInvested": "মুঠ বিনিয়োগ",
    "dash.totalMembers": "মুঠ সদস্য", "dash.yourGroups": "আপোনাৰ চিট গ্ৰুপ", "dash.noGroups": "এতিয়াও চিট গ্ৰুপ নাই",
    "group.monthly": "মাহেকীয়া", "group.members": "সদস্য", "group.progress": "অগ্ৰগতি",
    "group.nextBid": "পৰৱৰ্তী বিড", "group.viewDetails": "বিৱৰণ চাওক", "group.payNow": "এতিয়াই পেমেণ্ট কৰক",
    "group.month": "মাহ", "group.of": "ৰ", "group.totalPool": "মুঠ পুল",
    "group.status.active": "সক্ৰিয়", "group.status.upcoming": "আহবলীয়া", "group.status.completed": "সম্পূর্ণ",
    "group.createNew": "নতুন গ্ৰুপ বনাওক", "group.name": "গ্ৰুপৰ নাম", "group.duration": "সময়কাল (মাহ)",
    "group.startDate": "আৰম্ভৰ তাৰিখ", "group.upiId": "আপোনাৰ UPI ID",
    "member.addMember": "সদস্য যোগ কৰক", "member.searchUser": "ব্যৱহাৰকাৰী বিচাৰক",
    "member.role": "ভূমিকা", "member.admin": "প্ৰশাসক", "member.member": "সদস্য",
    "member.remove": "আঁতৰাওক", "member.joinedOn": "যোগ দিলে", "member.noMembers": "সদস্য নাই",
    "member.searchPlaceholder": "ইমেইল বা ফোনেৰে বিচাৰক...", "member.roleChanged": "ভূমিকা আপডেট হ'ল",
    "member.added": "সদস্য সফলতাৰে যোগ কৰা হ'ল",
    "bid.placeBid": "বিড দিয়ক", "bid.submitBid": "বিড দাখিল কৰক", "bid.yourBid": "আপোনাৰ বিড",
    "bid.liveBids": "লাইভ বিড", "bid.bidHistory": "বিড ইতিহাস", "bid.minBid": "নিম্নতম বিড",
    "bid.maxBid": "সৰ্বোচ্চ বিড", "bid.noBids": "এতিয়াও বিড নাই", "bid.auctionOpen": "নিলাম খোলা আছে",
    "pay.payContrib": "মাহেকীয়া বৰঙণি দিয়ক", "pay.holderUpi": "চিট ধাৰকৰ UPI ID",
    "pay.note": "পেমেণ্ট টোকা", "pay.chooseApp": "পেমেণ্ট এপ বাছক", "pay.success": "পেমেণ্ট সফল",
    "pay.failed": "পেমেণ্ট বিফল", "pay.history": "পেমেণ্ট ইতিহাস", "pay.totalPaid": "মুঠ পেমেণ্ট",
    "pay.successRate": "সাফল্যৰ হাৰ", "pay.amount": "পৰিমাণ",
    "profile.title": "প্ৰফাইল", "profile.personalInfo": "ব্যক্তিগত তথ্য", "profile.fullName": "সম্পূর্ণ নাম",
    "profile.emailAddr": "ইমেইল ঠিকনা", "profile.phoneNum": "ফোন নম্বৰ", "profile.security": "সুৰক্ষা",
    "profile.changePassword": "পাছৱর্ড সলনি কৰক", "profile.twoFA": "দ্বি-স্তৰীয় যাচাই",
    "profile.notifications": "জাননী",
    "common.save": "সঞ্চয়", "common.cancel": "বাতিল", "common.edit": "সম্পাদনা", "common.back": "পাছলৈ",
    "common.done": "সম্পূর্ণ", "common.submit": "দাখিল", "common.loading": "লোড হৈ আছে...", "common.error": "ত্ৰুটি",
    "common.retry": "পুনৰ চেষ্টা", "common.search": "বিচাৰক", "common.create": "বনাওক", "common.enable": "সক্ষম",
    "common.change": "সলনি কৰক", "common.confirm": "নিশ্চিত কৰক", "common.yes": "হয়", "common.no": "নহয়",
    "common.remove": "আঁতৰাওক", "common.noData": "তথ্য পোৱা নগ'ল", "common.refresh": "ৰিফ্ৰেছ",
    "common.language": "ভাষা",
  },

  ur: {
    "nav.dashboard": "ڈیش بورڈ", "nav.myChits": "میری چٹیں", "nav.chits": "چٹیں",
    "nav.kyc": "KYC اپلوڈ", "nav.paymentStatus": "ادائیگی کی حیثیت", "nav.createGroup": "گروپ بنائیں",
    "nav.payments": "ادائیگیاں", "nav.profile": "پروفائل", "nav.logout": "لاگ آؤٹ",
    "auth.login": "لاگ ان", "auth.signup": "سائن اپ", "auth.email": "ای میل", "auth.phone": "فون",
    "auth.password": "پاس ورڈ", "auth.forgotPassword": "پاس ورڈ بھول گئے؟", "auth.newPassword": "نیا پاس ورڈ",
    "auth.confirmPassword": "پاس ورڈ کی تصدیق", "auth.createAccount": "اکاؤنٹ بنائیں",
    "auth.haveAccount": "پہلے سے اکاؤنٹ ہے؟", "auth.noAccount": "اکاؤنٹ نہیں؟",
    "dash.title": "ڈیش بورڈ", "dash.activeGroups": "فعال گروپس", "dash.totalInvested": "کل سرمایہ کاری",
    "dash.totalMembers": "کل اراکین", "dash.yourGroups": "آپ کے چٹ گروپس", "dash.noGroups": "ابھی کوئی چٹ گروپ نہیں",
    "group.monthly": "ماہانہ", "group.members": "اراکین", "group.progress": "پیشرفت",
    "group.nextBid": "اگلی بولی", "group.viewDetails": "تفصیلات دیکھیں", "group.payNow": "ابھی ادا کریں",
    "group.month": "مہینہ", "group.of": "میں سے", "group.totalPool": "کل فنڈ",
    "group.status.active": "فعال", "group.status.upcoming": "آنے والا", "group.status.completed": "مکمل",
    "group.createNew": "نیا گروپ بنائیں", "group.name": "گروپ کا نام", "group.duration": "مدت (مہینے)",
    "group.startDate": "شروع ہونے کی تاریخ", "group.upiId": "آپ کا UPI ID",
    "member.addMember": "رکن شامل کریں", "member.searchUser": "صارف تلاش کریں",
    "member.role": "کردار", "member.admin": "منتظم", "member.member": "رکن",
    "member.remove": "ہٹائیں", "member.joinedOn": "شامل ہوئے", "member.noMembers": "کوئی رکن نہیں",
    "member.searchPlaceholder": "ای میل یا فون سے تلاش کریں...", "member.roleChanged": "کردار اپڈیٹ ہو گیا",
    "member.added": "رکن کامیابی سے شامل کیا گیا",
    "bid.placeBid": "بولی لگائیں", "bid.submitBid": "بولی جمع کریں", "bid.yourBid": "آپ کی بولی",
    "bid.liveBids": "لائیو بولیاں", "bid.bidHistory": "بولی کی تاریخ", "bid.minBid": "کم از کم بولی",
    "bid.maxBid": "زیادہ سے زیادہ بولی", "bid.noBids": "ابھی کوئی بولی نہیں", "bid.auctionOpen": "نیلامی کھلی ہے",
    "pay.payContrib": "ماہانہ چندہ ادا کریں", "pay.holderUpi": "چٹ ہولڈر کا UPI ID",
    "pay.note": "ادائیگی نوٹ", "pay.chooseApp": "ادائیگی ایپ منتخب کریں", "pay.success": "ادائیگی کامیاب",
    "pay.failed": "ادائیگی ناکام", "pay.history": "ادائیگی کی تاریخ", "pay.totalPaid": "کل ادا کیا",
    "pay.successRate": "کامیابی کی شرح", "pay.amount": "رقم",
    "profile.title": "پروفائل", "profile.personalInfo": "ذاتی معلومات", "profile.fullName": "پورا نام",
    "profile.emailAddr": "ای میل پتہ", "profile.phoneNum": "فون نمبر", "profile.security": "سلامتی",
    "profile.changePassword": "پاس ورڈ تبدیل کریں", "profile.twoFA": "دو مرحلہ تصدیق",
    "profile.notifications": "اطلاعات",
    "common.save": "محفوظ کریں", "common.cancel": "منسوخ", "common.edit": "ترمیم", "common.back": "واپس",
    "common.done": "مکمل", "common.submit": "جمع کریں", "common.loading": "لوڈ ہو رہا ہے...", "common.error": "خرابی",
    "common.retry": "دوبارہ کوشش", "common.search": "تلاش", "common.create": "بنائیں", "common.enable": "فعال کریں",
    "common.change": "تبدیل", "common.confirm": "تصدیق", "common.yes": "ہاں", "common.no": "نہیں",
    "common.remove": "ہٹائیں", "common.noData": "کوئی ڈیٹا نہیں ملا", "common.refresh": "ریفریش",
    "common.language": "زبان",
  },

  ar: {
    "nav.dashboard": "لوحة التحكم", "nav.myChits": "مدخراتي", "nav.chits": "المدخرات",
    "nav.kyc": "رفع KYC", "nav.paymentStatus": "حالة الدفع", "nav.createGroup": "إنشاء مجموعة",
    "nav.payments": "المدفوعات", "nav.profile": "الملف الشخصي", "nav.logout": "تسجيل الخروج",
    "auth.login": "تسجيل الدخول", "auth.signup": "إنشاء حساب", "auth.email": "البريد الإلكتروني", "auth.phone": "الهاتف",
    "auth.password": "كلمة المرور", "auth.forgotPassword": "نسيت كلمة المرور؟", "auth.newPassword": "كلمة مرور جديدة",
    "auth.confirmPassword": "تأكيد كلمة المرور", "auth.createAccount": "إنشاء حساب",
    "auth.haveAccount": "لديك حساب بالفعل؟", "auth.noAccount": "ليس لديك حساب؟",
    "dash.title": "لوحة التحكم", "dash.activeGroups": "المجموعات النشطة", "dash.totalInvested": "إجمالي الاستثمار",
    "dash.totalMembers": "إجمالي الأعضاء", "dash.yourGroups": "مجموعات الادخار الخاصة بك", "dash.noGroups": "لا توجد مجموعات بعد",
    "group.monthly": "شهري", "group.members": "أعضاء", "group.progress": "التقدم",
    "group.nextBid": "المزاد القادم", "group.viewDetails": "عرض التفاصيل", "group.payNow": "ادفع الآن",
    "group.month": "شهر", "group.of": "من", "group.totalPool": "إجمالي الصندوق",
    "group.status.active": "نشط", "group.status.upcoming": "قادم", "group.status.completed": "مكتمل",
    "group.createNew": "إنشاء مجموعة جديدة", "group.name": "اسم المجموعة", "group.duration": "المدة (أشهر)",
    "group.startDate": "تاريخ البدء", "group.upiId": "رقم UPI الخاص بك",
    "member.addMember": "إضافة عضو", "member.searchUser": "البحث عن مستخدم",
    "member.role": "الدور", "member.admin": "مدير", "member.member": "عضو",
    "member.remove": "إزالة", "member.joinedOn": "انضم في", "member.noMembers": "لا يوجد أعضاء",
    "member.searchPlaceholder": "ابحث بالبريد الإلكتروني أو الهاتف...", "member.roleChanged": "تم تحديث الدور",
    "member.added": "تمت إضافة العضو بنجاح",
    "bid.placeBid": "قدم عرضاً", "bid.submitBid": "إرسال العرض", "bid.yourBid": "عرضك",
    "bid.liveBids": "العروض المباشرة", "bid.bidHistory": "تاريخ العروض", "bid.minBid": "الحد الأدنى",
    "bid.maxBid": "الحد الأقصى", "bid.noBids": "لا توجد عروض بعد", "bid.auctionOpen": "المزاد مفتوح",
    "pay.payContrib": "دفع الاشتراك الشهري", "pay.holderUpi": "رقم UPI لصاحب الصندوق",
    "pay.note": "ملاحظة الدفع", "pay.chooseApp": "اختر تطبيق الدفع", "pay.success": "تم الدفع بنجاح",
    "pay.failed": "فشل الدفع", "pay.history": "سجل المدفوعات", "pay.totalPaid": "إجمالي المدفوع",
    "pay.successRate": "معدل النجاح", "pay.amount": "المبلغ",
    "profile.title": "الملف الشخصي", "profile.personalInfo": "المعلومات الشخصية", "profile.fullName": "الاسم الكامل",
    "profile.emailAddr": "البريد الإلكتروني", "profile.phoneNum": "رقم الهاتف", "profile.security": "الأمان",
    "profile.changePassword": "تغيير كلمة المرور", "profile.twoFA": "المصادقة الثنائية",
    "profile.notifications": "الإشعارات",
    "common.save": "حفظ", "common.cancel": "إلغاء", "common.edit": "تعديل", "common.back": "رجوع",
    "common.done": "تم", "common.submit": "إرسال", "common.loading": "جارٍ التحميل...", "common.error": "خطأ",
    "common.retry": "إعادة المحاولة", "common.search": "بحث", "common.create": "إنشاء", "common.enable": "تفعيل",
    "common.change": "تغيير", "common.confirm": "تأكيد", "common.yes": "نعم", "common.no": "لا",
    "common.remove": "إزالة", "common.noData": "لا توجد بيانات", "common.refresh": "تحديث",
    "common.language": "اللغة",
  },

  es: {
    "nav.dashboard": "Panel", "nav.myChits": "Mis Chits", "nav.chits": "Chits",
    "nav.kyc": "Subir KYC", "nav.paymentStatus": "Estado de Pago", "nav.createGroup": "Crear Grupo",
    "nav.payments": "Pagos", "nav.profile": "Perfil", "nav.logout": "Cerrar sesión",
    "auth.login": "Iniciar sesión", "auth.signup": "Registrarse", "auth.email": "Correo", "auth.phone": "Teléfono",
    "auth.password": "Contraseña", "auth.forgotPassword": "¿Olvidó su contraseña?", "auth.newPassword": "Nueva contraseña",
    "auth.confirmPassword": "Confirmar contraseña", "auth.createAccount": "Crear cuenta",
    "auth.haveAccount": "¿Ya tienes una cuenta?", "auth.noAccount": "¿No tienes cuenta?",
    "dash.title": "Panel", "dash.activeGroups": "Grupos Activos", "dash.totalInvested": "Total Invertido",
    "dash.totalMembers": "Total Miembros", "dash.yourGroups": "Tus Grupos Chit", "dash.noGroups": "Sin grupos chit aún",
    "group.monthly": "Mensual", "group.members": "Miembros", "group.progress": "Progreso",
    "group.nextBid": "Próxima oferta", "group.viewDetails": "Ver detalles", "group.payNow": "Pagar ahora",
    "group.month": "Mes", "group.of": "de", "group.totalPool": "Fondo total",
    "group.status.active": "Activo", "group.status.upcoming": "Próximo", "group.status.completed": "Completado",
    "group.createNew": "Crear nuevo grupo", "group.name": "Nombre del grupo", "group.duration": "Duración (meses)",
    "group.startDate": "Fecha de inicio", "group.upiId": "Tu ID UPI",
    "member.addMember": "Agregar miembro", "member.searchUser": "Buscar usuario",
    "member.role": "Rol", "member.admin": "Administrador", "member.member": "Miembro",
    "member.remove": "Eliminar", "member.joinedOn": "Se unió", "member.noMembers": "Sin miembros",
    "member.searchPlaceholder": "Buscar por correo o teléfono...", "member.roleChanged": "Rol actualizado",
    "member.added": "Miembro agregado exitosamente",
    "bid.placeBid": "Hacer oferta", "bid.submitBid": "Enviar oferta", "bid.yourBid": "Tu oferta",
    "bid.liveBids": "Ofertas en vivo", "bid.bidHistory": "Historial de ofertas", "bid.minBid": "Oferta mínima",
    "bid.maxBid": "Oferta máxima", "bid.noBids": "Sin ofertas aún", "bid.auctionOpen": "Subasta abierta",
    "pay.payContrib": "Pagar contribución mensual", "pay.holderUpi": "UPI ID del titular",
    "pay.note": "Nota de pago", "pay.chooseApp": "Elegir app de pago", "pay.success": "Pago exitoso",
    "pay.failed": "Pago fallido", "pay.history": "Historial de pagos", "pay.totalPaid": "Total pagado",
    "pay.successRate": "Tasa de éxito", "pay.amount": "Monto",
    "profile.title": "Perfil", "profile.personalInfo": "Información personal", "profile.fullName": "Nombre completo",
    "profile.emailAddr": "Dirección de correo", "profile.phoneNum": "Número de teléfono", "profile.security": "Seguridad",
    "profile.changePassword": "Cambiar contraseña", "profile.twoFA": "Autenticación de dos factores",
    "profile.notifications": "Notificaciones",
    "common.save": "Guardar", "common.cancel": "Cancelar", "common.edit": "Editar", "common.back": "Atrás",
    "common.done": "Hecho", "common.submit": "Enviar", "common.loading": "Cargando...", "common.error": "Error",
    "common.retry": "Reintentar", "common.search": "Buscar", "common.create": "Crear", "common.enable": "Habilitar",
    "common.change": "Cambiar", "common.confirm": "Confirmar", "common.yes": "Sí", "common.no": "No",
    "common.remove": "Eliminar", "common.noData": "Sin datos", "common.refresh": "Actualizar",
    "common.language": "Idioma",
  },

  fr: {
    "nav.dashboard": "Tableau de bord", "nav.myChits": "Mes Chits", "nav.chits": "Chits",
    "nav.kyc": "Télécharger KYC", "nav.paymentStatus": "Statut paiement", "nav.createGroup": "Créer groupe",
    "nav.payments": "Paiements", "nav.profile": "Profil", "nav.logout": "Déconnexion",
    "auth.login": "Connexion", "auth.signup": "Inscription", "auth.email": "E-mail", "auth.phone": "Téléphone",
    "auth.password": "Mot de passe", "auth.forgotPassword": "Mot de passe oublié?", "auth.newPassword": "Nouveau mot de passe",
    "auth.confirmPassword": "Confirmer le mot de passe", "auth.createAccount": "Créer un compte",
    "auth.haveAccount": "Déjà un compte?", "auth.noAccount": "Pas de compte?",
    "dash.title": "Tableau de bord", "dash.activeGroups": "Groupes actifs", "dash.totalInvested": "Total investi",
    "dash.totalMembers": "Total membres", "dash.yourGroups": "Vos groupes chit", "dash.noGroups": "Aucun groupe chit",
    "group.monthly": "Mensuel", "group.members": "Membres", "group.progress": "Progrès",
    "group.nextBid": "Prochaine enchère", "group.viewDetails": "Voir les détails", "group.payNow": "Payer maintenant",
    "group.month": "Mois", "group.of": "sur", "group.totalPool": "Fonds total",
    "group.status.active": "Actif", "group.status.upcoming": "À venir", "group.status.completed": "Terminé",
    "group.createNew": "Créer nouveau groupe", "group.name": "Nom du groupe", "group.duration": "Durée (mois)",
    "group.startDate": "Date de début", "group.upiId": "Votre ID UPI",
    "member.addMember": "Ajouter membre", "member.searchUser": "Rechercher utilisateur",
    "member.role": "Rôle", "member.admin": "Administrateur", "member.member": "Membre",
    "member.remove": "Supprimer", "member.joinedOn": "Rejoint le", "member.noMembers": "Aucun membre",
    "member.searchPlaceholder": "Rechercher par e-mail ou téléphone...", "member.roleChanged": "Rôle mis à jour",
    "member.added": "Membre ajouté avec succès",
    "bid.placeBid": "Faire une offre", "bid.submitBid": "Soumettre offre", "bid.yourBid": "Votre offre",
    "bid.liveBids": "Offres en direct", "bid.bidHistory": "Historique enchères", "bid.minBid": "Offre minimale",
    "bid.maxBid": "Offre maximale", "bid.noBids": "Aucune offre", "bid.auctionOpen": "Enchère ouverte",
    "pay.payContrib": "Payer contribution mensuelle", "pay.holderUpi": "UPI ID du titulaire",
    "pay.note": "Note de paiement", "pay.chooseApp": "Choisir app paiement", "pay.success": "Paiement réussi",
    "pay.failed": "Paiement échoué", "pay.history": "Historique paiements", "pay.totalPaid": "Total payé",
    "pay.successRate": "Taux de succès", "pay.amount": "Montant",
    "profile.title": "Profil", "profile.personalInfo": "Informations personnelles", "profile.fullName": "Nom complet",
    "profile.emailAddr": "Adresse e-mail", "profile.phoneNum": "Numéro de téléphone", "profile.security": "Sécurité",
    "profile.changePassword": "Changer mot de passe", "profile.twoFA": "Authentification deux facteurs",
    "profile.notifications": "Notifications",
    "common.save": "Enregistrer", "common.cancel": "Annuler", "common.edit": "Modifier", "common.back": "Retour",
    "common.done": "Terminé", "common.submit": "Soumettre", "common.loading": "Chargement...", "common.error": "Erreur",
    "common.retry": "Réessayer", "common.search": "Rechercher", "common.create": "Créer", "common.enable": "Activer",
    "common.change": "Changer", "common.confirm": "Confirmer", "common.yes": "Oui", "common.no": "Non",
    "common.remove": "Supprimer", "common.noData": "Aucune donnée", "common.refresh": "Actualiser",
    "common.language": "Langue",
  },

  de: {
    "nav.dashboard": "Dashboard", "nav.myChits": "Meine Chits", "nav.chits": "Chits",
    "nav.kyc": "KYC hochladen", "nav.paymentStatus": "Zahlungsstatus", "nav.createGroup": "Gruppe erstellen",
    "nav.payments": "Zahlungen", "nav.profile": "Profil", "nav.logout": "Abmelden",
    "auth.login": "Anmelden", "auth.signup": "Registrieren", "auth.email": "E-Mail", "auth.phone": "Telefon",
    "auth.password": "Passwort", "auth.forgotPassword": "Passwort vergessen?", "auth.newPassword": "Neues Passwort",
    "auth.confirmPassword": "Passwort bestätigen", "auth.createAccount": "Konto erstellen",
    "auth.haveAccount": "Bereits ein Konto?", "auth.noAccount": "Kein Konto?",
    "dash.title": "Dashboard", "dash.activeGroups": "Aktive Gruppen", "dash.totalInvested": "Gesamt investiert",
    "dash.totalMembers": "Gesamt Mitglieder", "dash.yourGroups": "Ihre Chit-Gruppen", "dash.noGroups": "Noch keine Chit-Gruppen",
    "group.monthly": "Monatlich", "group.members": "Mitglieder", "group.progress": "Fortschritt",
    "group.nextBid": "Nächstes Gebot", "group.viewDetails": "Details anzeigen", "group.payNow": "Jetzt bezahlen",
    "group.month": "Monat", "group.of": "von", "group.totalPool": "Gesamtfonds",
    "group.status.active": "Aktiv", "group.status.upcoming": "Bevorstehend", "group.status.completed": "Abgeschlossen",
    "group.createNew": "Neue Gruppe erstellen", "group.name": "Gruppenname", "group.duration": "Dauer (Monate)",
    "group.startDate": "Startdatum", "group.upiId": "Ihre UPI ID",
    "member.addMember": "Mitglied hinzufügen", "member.searchUser": "Benutzer suchen",
    "member.role": "Rolle", "member.admin": "Administrator", "member.member": "Mitglied",
    "member.remove": "Entfernen", "member.joinedOn": "Beigetreten", "member.noMembers": "Keine Mitglieder",
    "member.searchPlaceholder": "Per E-Mail oder Telefon suchen...", "member.roleChanged": "Rolle aktualisiert",
    "member.added": "Mitglied erfolgreich hinzugefügt",
    "bid.placeBid": "Gebot abgeben", "bid.submitBid": "Gebot einreichen", "bid.yourBid": "Ihr Gebot",
    "bid.liveBids": "Live-Gebote", "bid.bidHistory": "Gebotshistorie", "bid.minBid": "Mindestgebot",
    "bid.maxBid": "Höchstgebot", "bid.noBids": "Noch keine Gebote", "bid.auctionOpen": "Auktion geöffnet",
    "pay.payContrib": "Monatlichen Beitrag zahlen", "pay.holderUpi": "UPI ID des Inhabers",
    "pay.note": "Zahlungsnotiz", "pay.chooseApp": "Zahlungs-App wählen", "pay.success": "Zahlung erfolgreich",
    "pay.failed": "Zahlung fehlgeschlagen", "pay.history": "Zahlungshistorie", "pay.totalPaid": "Gesamt bezahlt",
    "pay.successRate": "Erfolgsrate", "pay.amount": "Betrag",
    "profile.title": "Profil", "profile.personalInfo": "Persönliche Informationen", "profile.fullName": "Vollständiger Name",
    "profile.emailAddr": "E-Mail-Adresse", "profile.phoneNum": "Telefonnummer", "profile.security": "Sicherheit",
    "profile.changePassword": "Passwort ändern", "profile.twoFA": "Zwei-Faktor-Authentifizierung",
    "profile.notifications": "Benachrichtigungen",
    "common.save": "Speichern", "common.cancel": "Abbrechen", "common.edit": "Bearbeiten", "common.back": "Zurück",
    "common.done": "Fertig", "common.submit": "Einreichen", "common.loading": "Wird geladen...", "common.error": "Fehler",
    "common.retry": "Erneut versuchen", "common.search": "Suchen", "common.create": "Erstellen", "common.enable": "Aktivieren",
    "common.change": "Ändern", "common.confirm": "Bestätigen", "common.yes": "Ja", "common.no": "Nein",
    "common.remove": "Entfernen", "common.noData": "Keine Daten", "common.refresh": "Aktualisieren",
    "common.language": "Sprache",
  },

  pt: {
    "nav.dashboard": "Painel", "nav.myChits": "Meus Chits", "nav.chits": "Chits",
    "nav.kyc": "Enviar KYC", "nav.paymentStatus": "Status pagamento", "nav.createGroup": "Criar grupo",
    "nav.payments": "Pagamentos", "nav.profile": "Perfil", "nav.logout": "Sair",
    "auth.login": "Entrar", "auth.signup": "Cadastrar", "auth.email": "E-mail", "auth.phone": "Telefone",
    "auth.password": "Senha", "auth.forgotPassword": "Esqueceu a senha?", "auth.newPassword": "Nova senha",
    "auth.confirmPassword": "Confirmar senha", "auth.createAccount": "Criar conta",
    "auth.haveAccount": "Já tem uma conta?", "auth.noAccount": "Não tem conta?",
    "dash.title": "Painel", "dash.activeGroups": "Grupos ativos", "dash.totalInvested": "Total investido",
    "dash.totalMembers": "Total membros", "dash.yourGroups": "Seus grupos chit", "dash.noGroups": "Sem grupos chit",
    "group.monthly": "Mensal", "group.members": "Membros", "group.progress": "Progresso",
    "group.nextBid": "Próximo lance", "group.viewDetails": "Ver detalhes", "group.payNow": "Pagar agora",
    "group.month": "Mês", "group.of": "de", "group.totalPool": "Fundo total",
    "group.status.active": "Ativo", "group.status.upcoming": "Em breve", "group.status.completed": "Concluído",
    "group.createNew": "Criar novo grupo", "group.name": "Nome do grupo", "group.duration": "Duração (meses)",
    "group.startDate": "Data início", "group.upiId": "Seu ID UPI",
    "member.addMember": "Adicionar membro", "member.searchUser": "Buscar usuário",
    "member.role": "Função", "member.admin": "Administrador", "member.member": "Membro",
    "member.remove": "Remover", "member.joinedOn": "Entrou em", "member.noMembers": "Sem membros",
    "member.searchPlaceholder": "Buscar por e-mail ou telefone...", "member.roleChanged": "Função atualizada",
    "member.added": "Membro adicionado com sucesso",
    "bid.placeBid": "Fazer lance", "bid.submitBid": "Enviar lance", "bid.yourBid": "Seu lance",
    "bid.liveBids": "Lances ao vivo", "bid.bidHistory": "Histórico lances", "bid.minBid": "Lance mínimo",
    "bid.maxBid": "Lance máximo", "bid.noBids": "Sem lances ainda", "bid.auctionOpen": "Leilão aberto",
    "pay.payContrib": "Pagar contribuição mensal", "pay.holderUpi": "UPI ID do titular",
    "pay.note": "Nota de pagamento", "pay.chooseApp": "Escolher app pagamento", "pay.success": "Pagamento bem-sucedido",
    "pay.failed": "Pagamento falhou", "pay.history": "Histórico pagamentos", "pay.totalPaid": "Total pago",
    "pay.successRate": "Taxa de sucesso", "pay.amount": "Valor",
    "profile.title": "Perfil", "profile.personalInfo": "Informações pessoais", "profile.fullName": "Nome completo",
    "profile.emailAddr": "Endereço de e-mail", "profile.phoneNum": "Número de telefone", "profile.security": "Segurança",
    "profile.changePassword": "Alterar senha", "profile.twoFA": "Autenticação dois fatores",
    "profile.notifications": "Notificações",
    "common.save": "Salvar", "common.cancel": "Cancelar", "common.edit": "Editar", "common.back": "Voltar",
    "common.done": "Concluído", "common.submit": "Enviar", "common.loading": "Carregando...", "common.error": "Erro",
    "common.retry": "Tentar novamente", "common.search": "Buscar", "common.create": "Criar", "common.enable": "Ativar",
    "common.change": "Alterar", "common.confirm": "Confirmar", "common.yes": "Sim", "common.no": "Não",
    "common.remove": "Remover", "common.noData": "Sem dados", "common.refresh": "Atualizar",
    "common.language": "Idioma",
  },

  zh: {
    "nav.dashboard": "仪表板", "nav.myChits": "我的储蓄", "nav.chits": "储蓄",
    "nav.kyc": "上传KYC", "nav.paymentStatus": "付款状态", "nav.createGroup": "创建群组",
    "nav.payments": "付款", "nav.profile": "个人资料", "nav.logout": "退出",
    "auth.login": "登录", "auth.signup": "注册", "auth.email": "邮箱", "auth.phone": "手机",
    "auth.password": "密码", "auth.forgotPassword": "忘记密码?", "auth.newPassword": "新密码",
    "auth.confirmPassword": "确认密码", "auth.createAccount": "创建账户",
    "auth.haveAccount": "已有账户?", "auth.noAccount": "没有账户?",
    "dash.title": "仪表板", "dash.activeGroups": "活跃群组", "dash.totalInvested": "总投资",
    "dash.totalMembers": "总成员", "dash.yourGroups": "您的储蓄群组", "dash.noGroups": "暂无储蓄群组",
    "group.monthly": "月度", "group.members": "成员", "group.progress": "进度",
    "group.nextBid": "下次竞标", "group.viewDetails": "查看详情", "group.payNow": "立即付款",
    "group.month": "月", "group.of": "共", "group.totalPool": "总资金",
    "group.status.active": "活跃", "group.status.upcoming": "即将", "group.status.completed": "已完成",
    "group.createNew": "创建新群组", "group.name": "群组名称", "group.duration": "期限（月）",
    "group.startDate": "开始日期", "group.upiId": "您的UPI ID",
    "member.addMember": "添加成员", "member.searchUser": "搜索用户",
    "member.role": "角色", "member.admin": "管理员", "member.member": "成员",
    "member.remove": "移除", "member.joinedOn": "加入于", "member.noMembers": "暂无成员",
    "member.searchPlaceholder": "通过邮箱或手机搜索...", "member.roleChanged": "角色已更新",
    "member.added": "成员添加成功",
    "bid.placeBid": "竞标", "bid.submitBid": "提交竞标", "bid.yourBid": "您的竞标",
    "bid.liveBids": "实时竞标", "bid.bidHistory": "竞标历史", "bid.minBid": "最低竞标",
    "bid.maxBid": "最高竞标", "bid.noBids": "暂无竞标", "bid.auctionOpen": "竞标进行中",
    "pay.payContrib": "支付月度会费", "pay.holderUpi": "储蓄持有人UPI ID",
    "pay.note": "付款备注", "pay.chooseApp": "选择付款应用", "pay.success": "付款成功",
    "pay.failed": "付款失败", "pay.history": "付款记录", "pay.totalPaid": "总付款",
    "pay.successRate": "成功率", "pay.amount": "金额",
    "profile.title": "个人资料", "profile.personalInfo": "个人信息", "profile.fullName": "全名",
    "profile.emailAddr": "电子邮箱", "profile.phoneNum": "手机号码", "profile.security": "安全",
    "profile.changePassword": "更改密码", "profile.twoFA": "双重认证",
    "profile.notifications": "通知",
    "common.save": "保存", "common.cancel": "取消", "common.edit": "编辑", "common.back": "返回",
    "common.done": "完成", "common.submit": "提交", "common.loading": "加载中...", "common.error": "错误",
    "common.retry": "重试", "common.search": "搜索", "common.create": "创建", "common.enable": "启用",
    "common.change": "更改", "common.confirm": "确认", "common.yes": "是", "common.no": "否",
    "common.remove": "移除", "common.noData": "无数据", "common.refresh": "刷新",
    "common.language": "语言",
  },

  ja: {
    "nav.dashboard": "ダッシュボード", "nav.myChits": "マイチット", "nav.chits": "チット",
    "nav.kyc": "KYCアップロード", "nav.paymentStatus": "支払い状況", "nav.createGroup": "グループ作成",
    "nav.payments": "支払い", "nav.profile": "プロフィール", "nav.logout": "ログアウト",
    "auth.login": "ログイン", "auth.signup": "新規登録", "auth.email": "メール", "auth.phone": "電話",
    "auth.password": "パスワード", "auth.forgotPassword": "パスワードを忘れた？", "auth.newPassword": "新しいパスワード",
    "auth.confirmPassword": "パスワード確認", "auth.createAccount": "アカウント作成",
    "auth.haveAccount": "すでにアカウントをお持ちですか?", "auth.noAccount": "アカウントをお持ちでないですか?",
    "dash.title": "ダッシュボード", "dash.activeGroups": "アクティブグループ", "dash.totalInvested": "総投資額",
    "dash.totalMembers": "総メンバー数", "dash.yourGroups": "あなたのチットグループ", "dash.noGroups": "チットグループなし",
    "group.monthly": "月次", "group.members": "メンバー", "group.progress": "進捗",
    "group.nextBid": "次の入札", "group.viewDetails": "詳細を見る", "group.payNow": "今すぐ支払う",
    "group.month": "月", "group.of": "のうち", "group.totalPool": "総資金",
    "group.status.active": "アクティブ", "group.status.upcoming": "近日", "group.status.completed": "完了",
    "group.createNew": "新しいグループを作成", "group.name": "グループ名", "group.duration": "期間（月）",
    "group.startDate": "開始日", "group.upiId": "UPI ID",
    "member.addMember": "メンバー追加", "member.searchUser": "ユーザー検索",
    "member.role": "役割", "member.admin": "管理者", "member.member": "メンバー",
    "member.remove": "削除", "member.joinedOn": "参加日", "member.noMembers": "メンバーなし",
    "member.searchPlaceholder": "メールまたは電話で検索...", "member.roleChanged": "役割が更新されました",
    "member.added": "メンバーが正常に追加されました",
    "bid.placeBid": "入札する", "bid.submitBid": "入札を提出", "bid.yourBid": "あなたの入札",
    "bid.liveBids": "ライブ入札", "bid.bidHistory": "入札履歴", "bid.minBid": "最低入札額",
    "bid.maxBid": "最高入札額", "bid.noBids": "まだ入札なし", "bid.auctionOpen": "オークション開催中",
    "pay.payContrib": "月次会費を支払う", "pay.holderUpi": "チット保有者のUPI ID",
    "pay.note": "支払いメモ", "pay.chooseApp": "支払いアプリを選択", "pay.success": "支払い成功",
    "pay.failed": "支払い失敗", "pay.history": "支払い履歴", "pay.totalPaid": "合計支払い",
    "pay.successRate": "成功率", "pay.amount": "金額",
    "profile.title": "プロフィール", "profile.personalInfo": "個人情報", "profile.fullName": "氏名",
    "profile.emailAddr": "メールアドレス", "profile.phoneNum": "電話番号", "profile.security": "セキュリティ",
    "profile.changePassword": "パスワード変更", "profile.twoFA": "二要素認証",
    "profile.notifications": "通知",
    "common.save": "保存", "common.cancel": "キャンセル", "common.edit": "編集", "common.back": "戻る",
    "common.done": "完了", "common.submit": "送信", "common.loading": "読み込み中...", "common.error": "エラー",
    "common.retry": "再試行", "common.search": "検索", "common.create": "作成", "common.enable": "有効化",
    "common.change": "変更", "common.confirm": "確認", "common.yes": "はい", "common.no": "いいえ",
    "common.remove": "削除", "common.noData": "データなし", "common.refresh": "更新",
    "common.language": "言語",
  },
};
