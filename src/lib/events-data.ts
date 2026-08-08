export type EventCategory =
  | 'Sports'
  | 'Industrial Visit'
  | 'Achievement'
  | 'Partnership'
  | 'Seminar'
  | 'Exhibition';

export type EventStatus = 'Past' | 'Current' | 'Upcoming';

export interface EventDetailLine {
  label: string;
  value: string;
}

export interface DepartmentEvent {
  slug: string;
  title: string;
  shortTitle: string;
  category: EventCategory;
  status: EventStatus;
  /** Display date (e.g., "01 Sep, 2025"). Null for events without a fixed date. */
  date: string | null;
  time?: string | null;
  venue?: string | null;
  image: string;
  /** Short summary shown on the listing card. */
  summary: string;
  /** Full description shown on the detail page. May be multiple paragraphs. */
  description: string[];
  focus: string;
  /** Optional structured details (Chief Guest, Chairperson, etc.) */
  details?: EventDetailLine[];
  /** Optional CTA. Defaults to "View Details" link. */
  cta?: { label: string; href: string; external?: boolean };
}

export const events: DepartmentEvent[] = [
  {
    slug: 'cricket-tournament-2026',
    title: 'EEE Department: Inter-Department Cricket Tournament 2026',
    shortTitle: 'Inter-Department Cricket Tournament 2026',
    category: 'Sports',
    status: 'Current',
    date: null,
    image: '/assets/events/cricket-tournament-2026.webp',
    summary:
      'The Department of EEE welcomes all participants to this year’s tournament — a celebration of sportsmanship, team building, and departmental pride.',
    description: [
      'The Department of EEE warmly welcomes all participants to this year’s SU Inter-Department Cricket Tournament 2026. We are proud of the energy and strength our students bring to the "EEE family."',
      'We encourage all supporters to stand by our team from the opening match to the final moment — let your cheers fuel our players and let the spirit of fair play shine on the field.',
    ],
    focus: 'Sportsmanship, Team Building, and Departmental Pride.',
  },
  {
    slug: 'bmtf-industrial-visit',
    title: 'Academic Excellence through Industrial Exposure: Visit to BMTF',
    shortTitle: 'Industrial Visit: Bangladesh Machine Tools Factory (BMTF)',
    category: 'Industrial Visit',
    status: 'Past',
    date: '01 Sep, 2025',
    image: '/assets/events/bmtf-industrial-visit.webp',
    summary:
      'Students and faculty of the EEE Department visited BMTF for hands-on exposure to vehicle assembly, machining, and galvanizing operations.',
    description: [
      'On September 1, 2025, students and faculty from the Department of EEE visited Bangladesh Machine Tools Factory (BMTF) to gain hands-on industrial experience.',
      'The visit included in-depth explorations of the Vehicle Assembly Unit, Machine Shop, and Galvanizing Shop. Students observed real-world manufacturing processes, automation systems, and industrial safety practices first-hand.',
      'The trip concluded with a courtesy visit to the Vice Chancellor of DUET, Gazipur — inspiring the next generation of innovative engineers.',
    ],
    focus: 'Practical Learning, Automation, and Industrial Safety.',
  },
  {
    slug: 'faculty-farewell-phd',
    title: 'Honouring EEE Faculty: Farewell for Higher Research',
    shortTitle: 'Faculty Farewell & Research Excellence',
    category: 'Achievement',
    status: 'Past',
    date: null,
    image: '/assets/events/faculty-farewell-phd.webp',
    summary:
      'Celebrating the academic achievements of two faculty members departing for PhD studies at King Fahd University of Petroleum and Minerals, Saudi Arabia.',
    description: [
      'The Department celebrates the academic achievements of Assistant Professor Md. Ahatashamul Haque Khan Shuvo and Lecturer G M Ismail Hossain as they depart for their PhD journeys at King Fahd University of Petroleum and Minerals, Saudi Arabia.',
      'We honour their dedication to the department and wish them every success in their groundbreaking research. Their journey reflects the department’s long-standing commitment to nurturing scholars who go on to contribute to global engineering knowledge.',
    ],
    focus: 'Academic Research, Faculty Achievements, and Mentorship.',
  },
  {
    slug: 'biin-partnership',
    title: 'EEE & BIIN: Partnership for Emerging Tech Excellence',
    shortTitle: 'Strategic Collaboration for Emerging Technologies',
    category: 'Partnership',
    status: 'Current',
    date: null,
    image: '/assets/events/biin-partnership.webp',
    summary:
      'A strategic collaboration with BIIN to enhance student competencies in Robotics, Automobile Technology, AI, and Data Science.',
    description: [
      'A strategic collaboration has been signed between the Department of EEE and BIIN to enhance student competencies in Robotics, Automobile Technology, AI, and Data Science.',
      'This partnership aims to bridge the gap between academic learning and global industry demands, ensuring our engineering students are equipped with both deep technical expertise and an entrepreneurial mindset.',
    ],
    focus: 'Innovation, Robotics, and Global Industry Standards.',
  },
  {
    slug: 'career-webinar-abroad',
    title: 'Global Career Pathways: Building Your Future Abroad',
    shortTitle: 'Career Webinar: Beyond Admission',
    category: 'Seminar',
    status: 'Upcoming',
    date: '20 Apr',
    time: '8:00 PM',
    venue: 'Facebook Live',
    image: '/assets/events/career-webinar-abroad.webp',
    summary:
      'A specialised session for engineering students on strategic planning for higher studies and careers abroad — pathways, scholarships, and visa processing.',
    description: [
      'A specialised session for engineering students focused on strategic planning for higher studies and careers abroad.',
      'Learn about choosing the right pathways, securing scholarships, and smart visa processing to ensure a successful international career. Bring your questions and join the live discussion.',
    ],
    focus: 'Career Development, Study Abroad, and Strategic Planning.',
    details: [
      { label: 'Date', value: '20 April' },
      { label: 'Time', value: '8:00 PM' },
      { label: 'Venue', value: 'Facebook Live' },
    ],
    cta: { label: 'Register Now', href: '#' },
  },
  {
    slug: 'project-exhibition-2023',
    title: "Celebrating Global Engineering: World Engineer's Day & Project Exhibition 2023",
    shortTitle: "World Engineer's Day & Project Exhibition 2023",
    category: 'Exhibition',
    status: 'Past',
    date: '24 Sep, 2023',
    venue: 'Sonargaon University Campus',
    image: '/assets/events/project-exhibition-2023.webp',
    summary:
      "The Department celebrated World Engineer's Day with a grand Project Exhibition showcasing innovative student solutions and a keynote on the future of Electrical and Electronics Engineering.",
    description: [
      "The Department of EEE celebrated World Engineer's Day with a grand Project Exhibition, showcasing the innovative technical solutions developed by our students.",
      'The event featured a prestigious lineup of academic leaders, including a keynote session by Professor Dr. M. Muzibur Rahman on the future of Electrical and Electronics Engineering.',
      "This exhibition highlights the department's commitment to fostering practical engineering skills and creative problem-solving.",
    ],
    focus: 'Student Innovation, Technical Excellence, and Global Engineering Standards.',
    details: [
      { label: 'Chief Guest', value: 'Professor Shamim Ara Hassan, Vice-Chancellor (In-Charge), SU' },
      {
        label: 'Chairperson',
        value: 'Professor Md. Mostofa Hossain, Head, Department of EEE, SU',
      },
      {
        label: 'Guest of Honour',
        value: 'Professor Dr. Mohammad Ali, Advisor, Department of EEE',
      },
      { label: 'Date', value: '24 September, 2023' },
      { label: 'Venue', value: 'Sonargaon University Campus' },
    ],
  },
];

export const getEventBySlug = (slug: string): DepartmentEvent | undefined =>
  events.find((e) => e.slug === slug);

export const eventCategories = [
  'Sports',
  'Industrial Visit',
  'Achievement',
  'Partnership',
  'Seminar',
  'Exhibition',
] as const;
