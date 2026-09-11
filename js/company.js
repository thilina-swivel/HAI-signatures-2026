window.HAI = window.HAI || {};

(function () {
// Company-wide details shared by every signature.
// Change something here and it updates for all employees at once.

const COMPANY = {
  name: "humaniseAI",
  website: "https://humaniseai.io/",
  address: "10-20 Gwynne St, Cremorne VIC 3121",
  mapUrl: "https://maps.google.com/?q=10-20%20Gwynne%20St%20Cremorne%20VIC%203121",
  social: [
    { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/humaniseai/" },
    { key: "facebook", label: "Facebook", url: "https://web.facebook.com/profile.php?id=61577625336613" },
    { key: "instagram", label: "Instagram", url: "https://www.instagram.com/humanise_ai/" },
  ],
  bannerAlt: "humaniseAI - Integrated Intelligence. Human-first Solutions.",
  disclaimer:
    "NOTE: This document, including any attachment(s), may contain privileged and confidential information intended only for the individual or entity to whom it is addressed. If you are not the named or authorised recipient you must not read, disclose copy or distribute it. Additionally, virus protection is in place at the company however, liability for viruses or similar in any attachment remains the responsibility of the recipient. If you have received this document in error, please notify us, immediately by telephone. Any views expressed in this communication are those of the individual sender and not necessarily reflect the views of the company, unless expressly identified accordingly.",
};

HAI.COMPANY = COMPANY;
})();
