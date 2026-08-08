export type NoticeCategory = 'Academic' | 'Holiday' | 'Transport';

export interface Notice {
  slug: string;
  title: string;
  category: NoticeCategory;
  department: string;
  /** Display date in "DD MMM, YYYY" format. */
  date: string;
  /** ISO date used for sorting (newest first). */
  isoDate: string;
  description: string;
  /** Path to the attachment under /public. */
  file: string;
  fileType: 'image' | 'pdf';
}

export const notices: Notice[] = [
  {
    slug: 'final-registration-summer-2026',
    title: 'Final Registration Confirmation for Summer-2026',
    category: 'Academic',
    department: 'Office of the Registrar',
    date: '27 Apr, 2026',
    isoDate: '2026-04-27',
    description:
      'Students who have completed pre-registration must confirm their final registration for Summer-2026 by May 10, 2026. Payments must include the fee for May 2026 and any previous outstanding balances. SMS-based support is available via WhatsApp for accounts, exams, and academic inquiries.',
    file: '/assets/notices/final-registration-summer-2026.webp',
    fileType: 'image',
  },
  {
    slug: 'spring-2026-semester-break',
    title: 'Spring-2026 Semester Break',
    category: 'Holiday',
    department: 'Office of the Registrar',
    date: '26 Apr, 2026',
    isoDate: '2026-04-26',
    description:
      'Departments including EEE, CE, CSE, ME, TE, and Business Administration will observe a semester break on April 29 and 30, 2026. Architecture, Law, NAME, Bangla, JMS, FDT, and AMT departments will remain active. Classes for Summer-2026 will officially commence on May 02, 2026, following the May Day holiday.',
    file: '/assets/notices/spring-2026-semester-break.webp',
    fileType: 'image',
  },
  {
    slug: 'bengali-new-year-1433',
    title: 'Bengali New Year 1433 Holiday',
    category: 'Holiday',
    department: 'Office of the Registrar',
    date: '11 Apr, 2026',
    isoDate: '2026-04-11',
    description:
      'The university will remain closed on Tuesday, April 14, 2026, in observance of Bengali New Year 1433. All academic and administrative activities will resume on April 15, 2026.',
    file: '/assets/notices/bengali-new-year-1433.webp',
    fileType: 'image',
  },
  {
    slug: 'savar-route-bus-service',
    title: 'Savar Route Bus Service Adjustment',
    category: 'Transport',
    department: 'Office of the Registrar',
    date: '07 Apr, 2026',
    isoDate: '2026-04-07',
    description:
      'The university bus service for the Savar route will be suspended during the "Going" trip only on Thursday, April 09, 2026. Regular bus services will resume as scheduled on Saturday, April 11, 2026.',
    file: '/assets/notices/savar-route-bus-service.webp',
    fileType: 'image',
  },
  {
    slug: 'ter-summer-2026',
    title: 'Mandatory Teacher Evaluation Rating (TER)',
    category: 'Academic',
    department: 'Office of the Registrar',
    date: '05 Apr, 2026',
    isoDate: '2026-04-05',
    description:
      'All students must complete the Teacher Evaluation Rating (TER) for their respective course teachers via the ERP panel by April 20, 2026. Failure to submit the TER will prevent students from viewing their Final Semester exam results.',
    file: '/assets/notices/ter-summer-2026.webp',
    fileType: 'image',
  },
  {
    slug: 'pre-registration-summer-2026',
    title: 'Pre-registration Notice for Summer-2026',
    category: 'Academic',
    department: 'Office of the Registrar',
    date: '03 Apr, 2026',
    isoDate: '2026-04-03',
    description:
      'All students in the EEE, CSE, ME, CE, TE, BBA, MBA, RMBA, EMBA, MSCM, and MBM programs are instructed to complete their online pre-registration for the Summer-2026 semester through the ERP software. Completion is mandatory for attending classes and exams; students must clear previous dues before registering. Deadline: April 30, 2026 (without late fee); late fees apply from May 02 to June 06, 2026.',
    file: '/assets/notices/pre-registration-summer-2026.pdf',
    fileType: 'pdf',
  },
];

export const NOTICE_BOARD_PATH = '/student-society/notice-board';
