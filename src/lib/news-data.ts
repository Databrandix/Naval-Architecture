export type NewsCategory =
  | 'Academic'
  | 'Achievement'
  | 'Event'
  | 'Workshop'
  | 'Seminar'
  | 'Industrial Visit';

export interface NewsArticle {
  slug: string;
  title: string;
  shortTitle: string;
  category: NewsCategory;
  /** Display date (e.g., "01 Sep, 2025"). */
  date: string;
  /** ISO yyyy-mm-dd for sorting. */
  isoDate: string;
  /** Optional secondary line (organiser / location / event). */
  meta?: { label: string; value: string }[];
  /** One-line summary used on cards. */
  summary: string;
  cover: string;
  /** Full body — array of paragraphs. */
  body: string[];
}

export const news: NewsArticle[] = [
  {
    slug: 'bmtf-industrial-visit-2025',
    title:
      'SU EEE Students Gain Practical Insights at Bangladesh Machine Tools Factory (BMTF)',
    shortTitle: 'SU Students Visit Bangladesh Machine Tools Factory',
    category: 'Industrial Visit',
    date: '01 Sep, 2025',
    isoDate: '2025-09-01',
    cover: '/assets/news/bmtf-visit.webp',
    meta: [
      { label: 'Participants', value: '35 Students & 4 Faculty Members' },
      { label: 'Location', value: 'BMTF, Gazipur & DUET Campus' },
    ],
    summary:
      'Students and faculty of the EEE Department visited BMTF for hands-on exposure to vehicle assembly, machining, and galvanizing operations.',
    body: [
      'On September 1st, 2025, a group of 35 students from the Department of EEE at Sonargaon University (SU), accompanied by 04 faculty members, conducted an insightful industrial visit to the Bangladesh Machine Tools Factory (BMTF). This visit was organised as a core part of their academic journey to bridge the gap between classroom theory and real-world industrial operations.',
      'During the intensive day-long visit, students explored three major industrial facilities. In the Vehicle Assembly Unit, students observed modern automation, step-by-step assembly lines, and rigorous quality control protocols. In the Machine Shop, the team witnessed precision machining operations — including turning, milling, drilling, and gear cutting — essential components of their mechanical curriculum. In the Galvanizing Shop, participants gained a deeper understanding of surface treatment, corrosion protection, and critical industrial safety practices.',
      'Strict measures regarding discipline and safety were maintained throughout the tour, with faculty members providing continuous guidance. As a gesture of appreciation for the warm hospitality and valuable technical support, the Department presented an official crest to the BMTF authorities.',
      'On the return journey, the team also visited the Dhaka University of Engineering & Technology (DUET) in Gazipur. They paid a courtesy call to the Vice Chancellor and Pro-Vice Chancellor of DUET, further strengthening academic ties between the institutions. This remarkable experience has greatly inspired our students, empowering them with the hands-on knowledge required to become the innovative engineers of tomorrow.',
    ],
  },
  {
    slug: 'ifsse-2024',
    title:
      'SUEEC Members Attend International Fire, Safety & Security Expo (IFSSE-2024)',
    shortTitle: 'SUEEC at IFSSE-2024',
    category: 'Seminar',
    date: '17 Feb, 2024',
    isoDate: '2024-02-17',
    cover: '/assets/news/ifsse-2024.webp',
    meta: [
      { label: 'Event', value: 'IFSSE-2024' },
      { label: 'Location', value: 'BICC, Dhaka' },
    ],
    summary:
      'SUEEC members joined the inaugural ceremony of the three-day International Fire, Safety & Security Expo at BICC, Dhaka.',
    body: [
      'Members of the SU Electrical and Electronic Club (SUEEC) recently participated in the inaugural ceremony of the three-day long International Fire, Safety & Security Expo (IFSSE-2024). The prestigious event commenced on February 17, 2024, at the Bangabandhu International Conference Center (BICC) in the capital.',
      'The ceremony was graced by Mr. Salman F Rahman, Private Industry and Investment Adviser to the Prime Minister, who attended as the Chief Guest. The event also saw the presence of distinguished leaders including Mr. Mahbubul Alam, President of FBCCI, and Brigadier General Md Main Uddin, Director General of Fire Service and Civil Defense. Other notable dignitaries included Mr. Md. Amin Helaly (Senior Vice President, FBCCI), Mr. Farooq Hassan (President, BGMEA), and Mr. Niaz Ali Chishty (President, ESSAB).',
      'Participation in such high-profile international expos is part of the Department of Mechanical Engineering’s ongoing commitment to exposing students to real-world industrial safety and security technologies. During the seminar, SUEEC members had the opportunity to interact with industry leaders and explore the latest advancements in fire safety and security systems — subjects that are integral to their academic curriculum and future professional roles.',
      'The FBCCI extended its full support to this exhibition, highlighting the importance of safety infrastructure in the country’s growing industrial sector. For the students of Sonargaon University, this experience serves as a vital practical addition to their technical education, preparing them to contribute effectively to national safety and industrial standards.',
    ],
  },
  {
    slug: 'solidworks-3dexperience-seminar',
    title: 'Innovation Meets Excellence: SU Hosts SOLIDWORKS & 3DEXPERIENCE Seminar',
    shortTitle: 'SOLIDWORKS & 3DEXPERIENCE Seminar at SU',
    category: 'Seminar',
    date: '2024',
    isoDate: '2024-06-15',
    cover: '/assets/news/solidworks-seminar.webp',
    meta: [
      { label: 'Organising Partner', value: 'SU Electrical and Electronic Club (SUEEC)' },
      { label: 'Location', value: 'Sonargaon University Campus' },
    ],
    summary:
      'BD-SWUGN and Dassault Systèmes brought top experts to SU for a deep-dive into the future of design and manufacturing.',
    body: [
      'Sonargaon University (SU) recently hosted an inspiring day of engineering excellence through the SOLIDWORKS & 3DEXPERIENCE Seminar. The event, presented by the Bangladesh 3DExperience & Solidworks User Group Network (BD-SWUGN) and sponsored by Dassault Systèmes, brought together top industry experts, academicians, and aspiring engineers to explore the future of design and manufacturing.',
      'The seminar was graced by the presence of Professor Shamim Ara Hassan, Vice-Chancellor of Sonargaon University, who attended as the Chief Guest. Joining her as Guests of Honour were Professor Bulbul Ahamed (Pro-Vice Chancellor, Acting) and Professor Dr. Mohammad Ekramol Islam (Treasurer, SU). The event also featured Special Guests including Brig Gen (Retd) Professor Habibur Rahman Kamal, Dean of the Faculty of Science & Engineering, and Dr. Md. Jalal Uddin, Director of BITAC.',
      'Professor Md. Mostofa Hossain, Head of the Department of EEE, presided over the session as the Chairperson. Under his guidance, the SU Electrical and Electronic Club (SUEEC) acted as the organising partner, ensuring a seamless experience for all participants.',
      'The seminar featured insightful sessions from distinguished guest speakers — Gazi Md. Safi Rayhan (Walton Hi-Tech Industries PLC), Md Rakibul Islam (Brand Ambassador, Dassault Systèmes), and Md Forhad Hossain (CEO, Mitali Engineering Works).',
      'Attendees gained valuable insights into the latest innovations in SOLIDWORKS & 3DEXPERIENCE, benefitting from hands-on learning and high-level networking opportunities. The event was supported by prominent partners including GaleoLab, KeyShot, and 3Dconnexion, reinforcing the department’s commitment to providing students with exposure to industry-standard tools and technologies.',
    ],
  },
  {
    slug: 'sumec-1st-anniversary',
    title: 'SUEEC Celebrates 1st Anniversary with Advanced Technical Workshops',
    shortTitle: 'SUEEC 1st Anniversary Workshops',
    category: 'Workshop',
    date: '2024',
    isoDate: '2024-04-10',
    cover: '/assets/news/sumec-1st-anniversary.webp',
    meta: [
      { label: 'Organiser', value: 'SU Electrical and Electronic Club (SUEEC)' },
      { label: 'Location', value: 'EEE Dept. Labs, SU' },
    ],
    summary:
      'On its 1st Foundation Anniversary, SUMEC launched two specialised workshops — 3D Printing and 4-Stroke Engine Assembly.',
    body: [
      'On the auspicious occasion of the 1st Foundation Anniversary of SU Electrical and Electronic Club (SUEEC), the Department of Mechanical Engineering organised a day of technical empowerment for its students. The celebration was marked by the launch of two specialised workshops aimed at bridging the gap between theoretical study and industry-standard practical skills.',
      'The event was officially inaugurated by Prof. Md. Mostofa Hossain, Head of the Department of EEE. To foster a culture of hands-on learning, the department introduced two high-impact training sessions — a 3D Printing Training Session, introducing students to the future of rapid prototyping and additive manufacturing, and a 4-Stroke Engine Assembly and Disassembly workshop, a deep-dive into the mechanical heart of automotive technology that allowed students to interact directly with internal combustion systems.',
      'In his keynote address, Prof. Mostofa Hossain highlighted the critical importance of practical knowledge in the modern engineering landscape. He emphasised that the Department of Mechanical Engineering has always prioritised a "learning-by-doing" approach. "Engineering education is incomplete without technical mastery," he stated, expressing his firm belief that through such initiatives, SU students will eventually establish themselves as world-class, quality engineers on the global stage.',
      'The workshops saw enthusiastic participation from students across various semesters, reflecting the department’s commitment to creating a transformative learning experience. These initiatives continue to solidify the reputation of the Mechanical Engineering Department as a leader in technical excellence at Sonargaon University.',
    ],
  },
  {
    slug: 'tici-industrial-training-2022',
    title: 'SU Students Achieve Milestone with Industrial Training at TICI',
    shortTitle: 'Industrial Training at TICI, Ghorashal',
    category: 'Achievement',
    date: '09 Jun, 2022',
    isoDate: '2022-06-09',
    cover: '/assets/news/tici-training.webp',
    meta: [
      { label: 'Period', value: '14 May 2022 – 9 June 2022' },
      { label: 'Location', value: 'TICI, Ghorashal, Narshingdi' },
    ],
    summary:
      'EEE students completed a month-long industrial training programme at TICI — the department’s first such achievement.',
    body: [
      'Sonargaon University (SU) recently marked a significant achievement as students from the Department of Mechanical Engineering successfully completed a comprehensive industrial training programme on "Industrial Technology on Mechanical Engineering". The training was held from 14th May 2022 to 9th June 2022 at the prestigious Training Institute for Chemical Industries (TICI) in Ghorashal, Narshingdi.',
      'This programme represents a historic moment for the department, as it is the first time our EEE students have completed their industrial training at this esteemed government institute. The month-long intensive programme was designed to bridge the gap between academic theory and industrial practice, providing students with hands-on exposure to high-level engineering environments.',
      'The training covered an extensive range of technical subjects essential for modern mechanical engineers. Students engaged in rigorous sessions covering Pumps, Turbines, Heat Exchangers, Boilers, and IC Engines. The curriculum also included specialised modules on Machine Shop Technology, PLC, Hydraulics, NDT (Non-Destructive Testing), and Industrial Power Generation & Distribution. Each course was structured to ensure deep learning, featuring one to two hours of theoretical instruction followed by two to four hours of intensive practical or lab classes.',
      'Beyond technical machinery, the students received vital training in Industrial Safety, Lubricants & Lubrications, and Engineering Materials, ensuring they are well-versed in the operational standards of the global industry. Exposure to advanced topics like CFD concepts and Instrumentation & Measurement further enriched their technical repertoire.',
      'This successful collaboration with TICI underscores Sonargaon University’s commitment to providing world-class, practical education that prepares students to meet both national and international market demands. By mastering these diverse industrial technologies, our students are now better positioned as future leaders in the engineering sector, ready to tackle complex real-world challenges with confidence and skill.',
    ],
  },
];

export const getNewsBySlug = (slug: string): NewsArticle | undefined =>
  news.find((n) => n.slug === slug);

export const getRelatedNews = (slug: string, limit = 3): NewsArticle[] =>
  news.filter((n) => n.slug !== slug).slice(0, limit);
