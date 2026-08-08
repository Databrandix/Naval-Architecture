export type FAQCategory =
  | 'Admission'
  | 'Rankings'
  | 'Campus'
  | 'Programs'
  | 'Exams';

export interface FAQ {
  id: number;
  category: FAQCategory;
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    id: 2,
    category: 'Admission',
    question: 'Can I get admitted with a study gap?',
    answer: 'Yes, you can get admitted even if you have a study gap.',
  },
  {
    id: 3,
    category: 'Admission',
    question: 'Is there an age limit for admission?',
    answer: 'Yes, you are eligible to apply regardless of age.',
  },
  {
    id: 4,
    category: 'Admission',
    question: 'What is the minimum GPA required for admission?',
    answer:
      'A minimum GPA of 2.5 (or 2nd division) in both SSC and HSC (or equivalent) is required. For O-Levels, 4 subjects are required, and for A-Levels, 2 subjects with a minimum GPA of 2.50. Alternatively, an average of 450 marks in 5 GED subjects is accepted.',
  },
  {
    id: 5,
    category: 'Admission',
    question: 'Can I get admitted if my GPA is less than 2.50?',
    answer:
      'No, you cannot get admitted to the EEE program with a GPA below 2.50. However, you may qualify for other programs such as Fashion Design, provided you have at least a GPA of 2.00 in both SSC and HSC.',
  },
  {
    id: 6,
    category: 'Admission',
    question: 'I have SSC in Science but HSC in Arts/Commerce. Can I get into CSE or EEE?',
    answer: 'No, a Science background is mandatory for Engineering programs.',
  },
  {
    id: 7,
    category: 'Admission',
    question: "Can I get admitted if I finished my Diploma 8th semester but haven't received my results?",
    answer:
      'You cannot get admitted yet, but you can book your seat. Once the results are published within the specified time, you will be admitted to the current semester.',
  },
  {
    id: 8,
    category: 'Admission',
    question: 'Is there any financial assistance for students with financial difficulties?',
    answer: 'Yes, you can apply for assistance after completing your admission.',
  },
  {
    id: 9,
    category: 'Admission',
    question: 'How can I get a 100% scholarship?',
    answer: 'Students who achieve Golden A+ in both SSC and HSC are eligible for a 100% scholarship.',
  },

  // ───── University Rankings & Approvals ─────
  {
    id: 10,
    category: 'Rankings',
    question: 'Is the university UGC approved?',
    answer: 'Yes, it is UGC approved.',
  },
  {
    id: 11,
    category: 'Rankings',
    question: "What is the university's UGC ranking?",
    answer:
      'Our university is currently ranked 63rd in the UGC rankings. However, a university should not be judged by ranking alone; we offer quality education, experienced faculty, modern labs, free transport, and affordable tuition fees.',
  },
  {
    id: 12,
    category: 'Rankings',
    question: 'Does the university have IEB membership?',
    answer: 'Currently, we do not have it, but the process is underway.',
  },
  // ───── Campus & Facilities ─────
  {
    id: 16,
    category: 'Campus',
    question: 'Do you have a permanent campus?',
    answer: 'Yes, we have a permanent campus.',
  },
  {
    id: 17,
    category: 'Campus',
    question: 'When will classes start at the permanent campus?',
    answer:
      'Classes have not started there yet, but they will begin very soon. A notice will be issued once it is finalized.',
  },
  {
    id: 18,
    category: 'Campus',
    question: 'Are there library and lab facilities?',
    answer: 'Yes, we provide full library and laboratory facilities.',
  },
  {
    id: 19,
    category: 'Campus',
    question: 'Is there a hostel/hall facility?',
    answer: 'Unfortunately, we do not provide hostel facilities at this time.',
  },
  {
    id: 20,
    category: 'Campus',
    question: 'Is there a bus service on Fridays?',
    answer: 'No, bus services are only available for the Morning (regular) batches, not for Friday batches.',
  },
  {
    id: 21,
    category: 'Campus',
    question: 'Does the university provide job or career support?',
    answer: 'We are not providing job placement facilities at this moment.',
  },
  {
    id: 22,
    category: 'Campus',
    question: 'What laboratory facilities does the EEE department have?',
    answer:
      'The EEE department has four specialized labs: Electrical Circuit Lab, Power System Protection & Communication Lab, Energy Conversion Lab, and Electronic Lab. They are equipped with oscilloscopes, function generators, motor/generator sets, and communication trainers for hands-on training in circuit analysis, power systems, and electronics.',
  },
  {
    id: 23,
    category: 'Campus',
    question: 'Does the EEE department have a student club or IEEE chapter?',
    answer:
      'Yes \u2014 the SU Electrical and Electronic Club (SUEEC), founded in 2024 with 100+ members. SUEEC organizes robotics workshops, industrial visits, tech talks, and project exhibitions. The department is also working toward establishing an IEEE student branch.',
  },

  // ───── Programs & Academic System ─────
  {
    id: 24,
    category: 'Programs',
    question: 'Are there English or Pharmacy subjects available?',
    answer: 'No, we do not offer English or Pharmacy programs.',
  },
  {
    id: 25,
    category: 'Programs',
    question: 'Is there an MSc program?',
    answer: 'No, we do not offer MSc programs currently.',
  },
  {
    id: 26,
    category: 'Programs',
    question: 'Are there any short or certificate courses?',
    answer:
      'No, we do not have short courses at this time.',
  },
  {
    id: 27,
    category: 'Programs',
    question: "What\u2019s the BSc in EEE program duration?",
    answer:
      'The B.Sc. in EEE is a 4-year program (161 credits, 8 semesters) for HSC-background students under a tri-semester system. Diploma holders follow a reduced 144-credit structure, completing in approximately 3.5 years.',
  },
  {
    id: 28,
    category: 'Programs',
    question: 'Is the medium of instruction Bengali or English?',
    answer: 'All programs except Bengali-related subjects are conducted in English.',
  },
  {
    id: 29,
    category: 'Programs',
    question: 'Do you follow an Open Credit system?',
    answer: 'No, we follow a Fixed Credit system.',
  },
  {
    id: 30,
    category: 'Programs',
    question: 'Can I go abroad via credit transfer?',
    answer:
      'Yes, you can. Many of our students have successfully transferred their credits to universities abroad.',
  },

  // ───── Classes & Exams ─────
  {
    id: 31,
    category: 'Exams',
    question: 'Is there an option for online classes or exams?',
    answer:
      'No, we do not have online batches. However, we offer Friday/Weekend batches for those with busy schedules.',
  },
  {
    id: 32,
    category: 'Exams',
    question: 'Can I take exams without attending classes?',
    answer: 'No, a minimum of 50-60% class attendance is required to sit for exams.',
  },
  {
    id: 33,
    category: 'Exams',
    question: 'Will irregular attendance affect my results?',
    answer:
      "It won't cause major issues, but you will lose the marks allocated for class attendance.",
  },
  {
    id: 34,
    category: 'Exams',
    question: 'Is the certificate the same for Evening and Friday batches?',
    answer: 'Yes, there is no difference in the certificates.',
  },
  {
    id: 35,
    category: 'Exams',
    question: 'Why do costs vary between different batches?',
    answer:
      'Class schedules and timings vary. Costs are adjusted based on the requirements for managing faculty and staff resources for specific batch timings.',
  },
];

export const faqCategories: ('All' | FAQCategory)[] = [
  'All',
  'Admission',
  'Rankings',
  'Campus',
  'Programs',
  'Exams',
];
