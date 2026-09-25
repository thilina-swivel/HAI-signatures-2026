window.HAI = window.HAI || {};

(function () {
// ---------------------------------------------------------------------------
// EMPLOYEE LIST - this is the only file you need to edit to add or update staff.
//
// Fields per person:
//   name     required - shown in the list and as the signature name
//   title    required - job title (rendered in uppercase, letter-spaced)
//   phone    optional - landline/desk, as it should read, e.g. "+94 76 843 4334"
//   mobile   optional - adds the "M:" segment next to "P:"; omit to leave it out
//   email    optional - adds an email row to the signature; omit to leave it out
//   photo    optional - id from js/photos.js (run build/embed-assets.py to see ids).
//                       No photo? Initials are drawn automatically.
//   team     optional - groups people into sections on the index page
//   draft    optional - true = "Details pending" badge, keeps the card visible
//                       while you are still collecting their information
//
// After dropping a new picture into "Profile photoes/", run:
//     python3 build/embed-assets.py
// ---------------------------------------------------------------------------

const EMPLOYEES = [
  // --- Group -----------------------------------------------------------------
  { name: "Chamath Abeygunawardena", title: "Lead – Operations", phone: "+94 75 208 2396", photo: "chamath-abeygunawardena", team: "Group" },
  { name: "Daham Wickramasekara", title: "Junior Designer", phone: "+94 71 459 1878", photo: "daham-wickramasekara", team: "Group" },
  { name: "Fahima Fawnoon", title: "Assistant Manager Learning & Development", phone: "+94 76 843 4334", photo: "fahima-fawnoon", team: "Group" },
  { name: "Iresha Wijayasiri", title: "Manager Human Resources", phone: "+94 77 220 4389", photo: "iresha-wijayasiri", team: "Group" },
  { name: "Miurin Damian", title: "Assistant Manager – Talent Acquisition", phone: "+94 75 929 4723", photo: "miurin-damian", team: "Group" },
  { name: "Mohommad Althaf Jahuber", title: "Office Assistant", phone: "+94 77 852 4988", photo: "mohommad-althaf-jahuber", team: "Group" },
  { name: "Natalie Achini Fernando", title: "Chief Administrative Officer", phone: "+94 77 927 2517", photo: "natalie-achini-fernando", team: "Group" },
  { name: "Shiny Dickson", title: "Senior Digital Marketing Specialist", phone: "+94 71 349 2147", photo: "shiny-dickson", team: "Group" },
  { name: "Uditha Wijesundara", title: "Chief Operating Officer", phone: "+94 77 507 1016", photo: "uditha-wijesundara", team: "Group" },
  { name: "Usha Rajapaksha", title: "General Manager – Operations & Client Experience", phone: "+94 77 952 0755", photo: "usha-rajapaksha", team: "Group" },
  // --- humaniseAI ------------------------------------------------------------
  { name: "Charith Nuwan Bimsara", title: "Associate Technical Lead – AI Full Stack", phone: "+94 77 196 6684", photo: "charith-nuwan-bimsara", team: "humaniseAI" },
  { name: "Thilina Siriwardana", title: "Senior Architect cum Senior Engineering Manager", phone: "+94 71 828 9690", photo: "thilina-siriwardana", team: "humaniseAI" },
  { name: "Navindu Madanayaka", title: "Senior Software Engineer", phone: "+94 71 417 0928", photo: "navindu-madanayaka", team: "humaniseAI" },
  { name: "Pasan Kalhara", title: "Software Engineer", phone: "+94 71 269 6138", photo: "pasan-kalhara", team: "humaniseAI" },
  { name: "Sandaru Yapa", title: "Software Engineer – AI", phone: "+94 78 580 7670", photo: "sandaru-yapa", team: "humaniseAI" },
  { name: "Sanjula De Alwis", title: "Senior Software Engineer", phone: "+94 77 521 0469", photo: "sanjula-de-alwis", team: "humaniseAI" },
  { name: "Savidya Semini", title: "Associate Quality Engineer", phone: "+94 77 330 4479", photo: "savidya-semini", team: "humaniseAI" },
  { name: "Tharani Dissanayake", title: "Associate Software Engineer – AI", phone: "+94 74 149 8777", photo: "tharani-dissanayake", team: "humaniseAI" },
  // --- Tech ------------------------------------------------------------------
  { name: "Ananthan Gananamoorthy", title: "Senior Software Engineer", phone: "+94 75 993 9211", photo: "ananthan-gananamoorthy", team: "Tech" },
  { name: "Ayesh Lakshan", title: "Senior Software Engineer", phone: "+94 77 144 8903", photo: "ayesh-lakshan", team: "Tech" },
  { name: "Chamal De Mel", title: "Senior Software Engineer", phone: "+94 77 691 7353", photo: "chamal-de-mel", team: "Tech" },
  { name: "Chamath Ranaweera", title: "Senior Software Engineer", phone: "+94 70 265 4310", photo: "chamath-ranaweera", team: "Tech" },
  { name: "Chamikara Jayasekara", title: "Senior Software Engineer", phone: "+94 75 216 1796", photo: "chamikara-jayasekara", team: "Tech" },
  { name: "Chamikara Nayanajith", title: "Associate Technical Lead", phone: "+94 71 512 2893", photo: "chamikara-nayanajith", team: "Tech" },
  { name: "Danushan Kanagasingham", title: "Software Engineer", phone: "+94 77 110 9101", photo: "danushan-kanagasingham", team: "Tech" },
  { name: "Fazlan Faizer", title: "Intern BA", phone: "+94 75 431 5192", photo: "fazlan-faizer", team: "Tech" },
  { name: "Hariprasath Sriram", title: "Senior QE Engineer – Manual and Automation", phone: "+94 77 166 1031", photo: "hariprasath-sriram", team: "Tech" },
  { name: "Himashi Hewawasam", title: "Senior Executive – Finance", phone: "+94 70 453 7933", photo: "himashi-hewawasam", team: "Tech" },
  { name: "Hirantha Perera", title: "Senior Tech Lead", phone: "+94 71 089 7402", photo: "hirantha-perera", team: "Tech" },
  { name: "Kapil Vasudevan", title: "Management Accountant", phone: "+94 77 279 1888", photo: "kapil-vasudevan", team: "Tech" },
  { name: "Leel Karunarathne", title: "Senior Software Engineer", phone: "+94 77 792 6073", photo: "leel-karunarathne", team: "Tech" },
  { name: "Madhawa Priyashantha", title: "Senior Software Engineer", phone: "+94 71 793 6775", photo: "madhawa-priyashantha", team: "Tech" },
  { name: "Maduka Nuwantha", title: "Senior Software Engineer", phone: "+94 77 592 1375", photo: "maduka-nuwantha", team: "Tech" },
  { name: "Maleesha Fernando", title: "Senior Quality Assurance Engineer", phone: "+94 76 680 0074", photo: "maleesha-fernando", team: "Tech" },
  { name: "Nirmal Wewitavidana", title: "Associate Tech Specialist", phone: "+94 75 584 1100", photo: "nirmal-wewitavidana", team: "Tech" },
  { name: "Nuwan Bandara", title: "Manager – Software Engineering / Architect", phone: "+94 76 710 0505", photo: "nuwan-bandara", team: "Tech" },
  { name: "Nuwan Karunarathna", title: "Associate Tech Specialist", phone: "+94 71 965 8468", photo: "nuwan-karunarathna", team: "Tech" },
  { name: "Omesha Wattuhewa", title: "Senior Quality Engineer", phone: "+94 71 775 0144", photo: "omesha-wattuhewa", team: "Tech" },
  { name: "P.D. Isuru Madusanka", title: "Senior Software Engineer", phone: "+94 78 556 9542", photo: "p-d-isuru-madusanka", team: "Tech" },
  { name: "Prabath Senadheera", title: "Associate Technical Lead", phone: "+94 71 178 8194", photo: "prabath-senadheera", team: "Tech" },
  { name: "Ruvini Tharushika", title: "Quality Engineer", phone: "+94 70 304 6869", photo: "ruvini-tharushika", team: "Tech" },
  { name: "Sachini Abeygunawardhana", title: "Associate QA Lead", phone: "+94 71 524 6483", photo: "sachini-abeygunawardhana", team: "Tech" },
  { name: "Sanduni Mendis", title: "Quality Assurance Lead", phone: "+94 77 600 6802", photo: "sanduni-mendis", team: "Tech" },
  { name: "Sapna Sehani Senevirathne", title: "Senior Quality Engineer", phone: "+94 71 951 0679", photo: "sapna-sehani-senevirathne", team: "Tech" },
  { name: "Sarala Edirisinghe", title: "Associate Lead – Business Analyst", phone: "+94 77 040 6395", photo: "sarala-edirisinghe", team: "Tech" },
  { name: "Saroj Senadheera", title: "Senior Data Engineer", phone: "+94 78 969 1507", photo: "saroj-senadheera", team: "Tech" },
  { name: "Shehan Wevita", title: "Associate Technical Lead – DevOps", phone: "+94 77 576 3110", photo: "shehan-wevita", team: "Tech" },
  { name: "Suhada Fernando", title: "Associate DevOps Architect", phone: "+94 77 291 9899", photo: "suhada-fernando", team: "Tech" },
  { name: "Tharanga Randunuveera", title: "Associate Tech Specialist – DevOps", phone: "+94 77 178 2112", photo: "tharanga-randunuveera", team: "Tech" },
  { name: "Tharindu Wanasinghe", title: "Senior Software Engineer", phone: "+94 71 528 2320", photo: "tharindu-wanasinghe", team: "Tech" },
  { name: "Thilina Jayawardana", title: "Senior Digital & Product Designer", phone: "+94 71 471 6491", photo: "thilina-jayawardana", team: "Tech" },
  { name: "Ushan Fernando", title: "Senior Software Engineer", phone: "+94 70 362 7628", photo: "ushan-fernando", team: "Tech" },
  { name: "Varuna Galabada", title: "Associate Software Architect", phone: "+94 77 369 5691", photo: "varuna-galabada", team: "Tech" },
  { name: "Vihangi Dharmawickrema", title: "Senior Quality Engineer", phone: "+94 71 557 5983", photo: "vihangi-dharmawickrema", team: "Tech" },
  { name: "Wiras Fernando", title: "Software Engineer", phone: "+94 71 574 0807", photo: "wiras-fernando", team: "Tech" },
  // --- SEO -------------------------------------------------------------------
  { name: "Abdulla Ifthikar", title: "Associate Technical Lead – Digital Marketing & SEO", phone: "+94 77 691 1226", photo: "abdulla-ifthikar", team: "SEO" },
  { name: "Zainab Burhan", title: "SEO Specialist", phone: "+94 77 044 6534", photo: "zainab-burhan", team: "SEO" },
  { name: "Zareer Azmi", title: "Team Lead – Digital Marketing & SEO", phone: "+94 77 911 4889", photo: "zareer-azmi", team: "SEO" },
  // --- Finance ---------------------------------------------------------------
  { name: "Anthony Wickramaratne", title: "Head of Local Business Development", phone: "+94 77 085 2727", photo: "anthony-wickramaratne", team: "Finance" },
  { name: "Elisha Hansani Perera", title: "Executive – Business Operation & Administration", phone: "+94 76 159 4297", photo: "elisha-hansani-perera", team: "Finance" },
  { name: "Emella Fernando", title: "Accountant – Australian Taxation", phone: "+94 72 151 2100", photo: "emella-fernando", team: "Finance" },
  { name: "Karunieya Shivakumar", title: "Senior Accountant", phone: "+94 76 081 9136", photo: "karunieya-shivakumar", team: "Finance" },
  { name: "Niyumie Bandara", title: "Tax Accountant", phone: "+94 77 531 1244", photo: "niyumie-bandara", team: "Finance" },
  { name: "Pamod Gunasekara", title: "Assistant Manager – Finance", phone: "+94 77 190 0825", photo: "pamod-gunasekara", team: "Finance" },
  { name: "Rajeendra Jayaweera", title: "Finance Manager", phone: "+94 71 322 6692", photo: "rajeendra-jayaweera", team: "Finance" },
  { name: "Sawani Ramanayake", title: "Chief Administrative Officer", phone: "+94 71 640 4486", photo: "sawani-ramanayake", team: "Finance" },
  { name: "Shahnaz Fazil", title: "Administration Assistant", phone: "+94 76 355 0361", photo: "shahnaz-fazil", team: "Finance" },
  { name: "Suwetha Yogaraj", title: "Accounting Support Partner", phone: "+94 76 889 9263", photo: "suwetha-yogaraj", team: "Finance" },
];

// Seniority, most senior first. Each group on the index page is listed in this
// order; people on the same rung are alphabetical. The first pattern a title
// matches wins, so put the more specific patterns above the general ones.
// A title nothing matches goes to the bottom of its group.
const SENIORITY = [
  /^Chief Operating Officer/,
  /^Chief /,
  /^General Manager/,
  /^Head of/,
  /^Senior Architect cum Senior Engineering Manager/,
  /^Manager|Manager$/,                               // "Finance Manager", "Manager Human Resources"
  /^Assistant Manager/,
  /^Senior Tech Lead/,
  /^(Team Lead|Lead|Quality Assurance Lead)\b/,
  /^Associate (Software|DevOps) Architect/,
  /^Associate (Technical Lead|Lead|QA Lead)/,
  /^Associate Tech Specialist/,
  /^Senior /,
  /^(Software|Quality) Engineer|Accountant|Specialist|^Executive/,
  /^Associate /,
  /^(Accounting Support|Administration Assistant|Junior)/,
  /^(Office Assistant|Intern)/,
];

const rank = (title) => {
  const i = SENIORITY.findIndex((re) => re.test(title || ""));
  return i === -1 ? SENIORITY.length : i;
};

// Stable sort keeps the groups where they are; only the order inside each moves.
const TEAM_ORDER = [...new Set(EMPLOYEES.map((p) => p.team))];
EMPLOYEES.sort((a, b) =>
  TEAM_ORDER.indexOf(a.team) - TEAM_ORDER.indexOf(b.team) ||
  rank(a.title) - rank(b.title) ||
  a.name.localeCompare(b.name)
);

HAI.EMPLOYEES = EMPLOYEES;
})();
