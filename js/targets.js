window.HAI = window.HAI || {};

(function () {
// ---------------------------------------------------------------------------
// THE THREE TARGETS
//
// One signature, three builds. The markup differences are small but real, and
// they all come from how each client renders HTML:
//
//   outlook-web  Chromium/WebKit in a browser. Handles everything. Fluid width.
//   outlook-win  Classic Outlook draws mail with the *Word* engine: no
//                max-width, no border-radius, no SVG, and it rescales images by
//                the system DPI unless told not to. It also reads signatures
//                off disk, so its images ship as loose files, not base64.
//   outlook-mac  WebKit, so it renders like the web build - but max-width is
//                unreliable, and there is no folder to drop files into, so it
//                is paste-only.
//
//   imageMode  "data"  base64 data URIs, travel with the paste
//              "files" relative paths into humaniseAI_files/, for the ZIP
//   fluid      true  -> width:100%;max-width:600px    false -> width:600px
//   mso        emit the Outlook/Word conditional head block
//   delivery   "copy" -> clipboard button   "zip" -> downloadable package
//   hidePhone  break phone numbers hard enough that Android stops linkifying
// ---------------------------------------------------------------------------

const TARGETS = {
  "outlook-web": {
    id: "outlook-web",
    label: "Outlook Web / New Outlook",
    blurb: "outlook.office365.com in a browser, or the new Outlook app",
    imageMode: "data",
    fluid: true,
    mso: false,
    delivery: "copy",
    // Only this build ever reaches a phone: a signature set in new Outlook
    // syncs to the Outlook mobile apps, while the two desktop builds stay on
    // the machine they are installed on. So the aggressive phone-number
    // blocker is confined here, and the desktop builds keep clean markup.
    hidePhone: true,
    steps: [
      'Visit <a href="https://outlook.office365.com/" target="_blank" rel="noopener">outlook.office365.com</a> and log in.',
      'Click the <strong>Settings</strong> gear (top right).',
      'Go to <strong>Account</strong> &#8594; <strong>Signatures</strong>.',
      'Select <strong>+ New signature</strong> and name it <em>humaniseAI</em>.',
      'Come back here, press <strong>Copy signature</strong>, click inside the Outlook editing box and paste with <kbd>Ctrl</kbd>&#160;+&#160;<kbd>V</kbd> (<kbd>&#8984;</kbd>&#160;+&#160;<kbd>V</kbd> on Mac).',
      'Under <strong>Select default signatures</strong>, choose it for <strong>New messages</strong> and <strong>Replies/forwards</strong>.',
      'Click <strong>Save</strong>, then open a new email to check it.',
    ],
    note: 'Images are embedded in the paste, so they keep working even after this page moves.',
  },

  "outlook-win": {
    id: "outlook-win",
    label: "Outlook Desktop (Windows)",
    blurb: "classic Outlook 2016 / 2019 / 2021 / Microsoft 365",
    imageMode: "files",
    fluid: false,
    mso: true,
    delivery: "zip",
    steps: [
      'Press <strong>Download package (.zip)</strong> above and unzip it.',
      'Press <kbd>Win</kbd>&#160;+&#160;<kbd>R</kbd>, type <code>%APPDATA%\\Microsoft\\Signatures</code> and press Enter.',
      'Copy <strong>humaniseAI.htm</strong>, <strong>humaniseAI.txt</strong> and the <strong>humaniseAI_files</strong> folder into that window. Keep all three together.',
      'Fully close and reopen Outlook.',
      'Go to <strong>File</strong> &#8594; <strong>Options</strong> &#8594; <strong>Mail</strong> &#8594; <strong>Signatures</strong>.',
      'Set <em>humaniseAI</em> as the default for <strong>New messages</strong> and <strong>Replies/forwards</strong>, then click <strong>OK</strong>.',
      'Open a new email to check it.',
    ],
    note: 'Do not paste this build into Outlook - it reads the files from disk. Copying the folder is what keeps the images sharp; classic Outlook rescales pasted images by your display DPI.',
  },

  "outlook-mac": {
    id: "outlook-mac",
    label: "Outlook Desktop (Mac)",
    blurb: "the Outlook app on macOS",
    imageMode: "data",
    fluid: false,
    mso: false,
    delivery: "copy",
    steps: [
      'Open <strong>Outlook</strong>.',
      'Go to <strong>Outlook</strong> &#8594; <strong>Settings</strong> &#8594; <strong>Signatures</strong>.',
      'Click <strong>+</strong> to add a signature and name it <em>humaniseAI</em>.',
      'Come back here, press <strong>Copy signature</strong>, click inside the Outlook signature editor and paste with <kbd>&#8984;</kbd>&#160;+&#160;<kbd>V</kbd>.',
      'Close the editor window - Mac Outlook saves as you go.',
      'Under <strong>Choose default signature</strong>, pick your account and set it for <strong>New messages</strong> and <strong>Replies/forwards</strong>.',
      'Open a new email to check it.',
    ],
    note: 'Mac Outlook has no signature folder to copy into, so pasting is the only route. Paste with <kbd>&#8984;</kbd>&#160;+&#160;<kbd>V</kbd>, never <kbd>&#8984;</kbd>&#160;+&#160;<kbd>&#8679;</kbd>&#160;+&#160;<kbd>V</kbd> - match-style paste strips the formatting.',
  },
};

HAI.TARGETS = TARGETS;
HAI.TARGET_ORDER = ["outlook-web", "outlook-win", "outlook-mac"];
HAI.DEFAULT_TARGET = "outlook-web";
})();
