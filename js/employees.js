window.HAI = window.HAI || {};

(function () {
// ---------------------------------------------------------------------------
// EMPLOYEE LIST - this is the only file you need to edit to add or update staff.
//
// Fields per person:
//   name     required - shown in the list and as the signature name
//   title    required - job title (rendered in uppercase, letter-spaced)
//   phone    optional - as it should read, e.g. "+94 76 843 4334"
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
  {
    name: "Fahima Fawnoon",
    title: "Assistant Manager Learning & Development",
    phone: "+94 76 843 4334",
    photo: "fahima",
    team: "People & Culture",
  },

  // --- Photos received, details still to come ------------------------------
  { name: "Navindu M.", title: "", photo: "navindu-m", draft: true },
  { name: "Pasan K.", title: "", photo: "pasan-k", draft: true },
  { name: "Sandaru", title: "", photo: "sandaru", draft: true },
  { name: "Shavindya", title: "", photo: "shavindya", draft: true },
];

HAI.EMPLOYEES = EMPLOYEES;
})();
