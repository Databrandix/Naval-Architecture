export interface Club {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  image: string;
}

export const clubs: Club[] = [
  {
    id: 'debate',
    name: 'SU Debate Club',
    abbreviation: 'SUDC',
    description:
      "Focuses on enhancing students' public speaking, logical reasoning, and communication skills. They regularly participate in inter-university debate competitions.",
    image: '/assets/clubs/debate.webp',
  },
  {
    id: 'cultural',
    name: 'SU Cultural Club',
    abbreviation: 'SUCC',
    description:
      'The hub for performing arts, including music, dance, and drama. They organize major campus events like Pohela Boishakh and seasonal festivals.',
    image: '/assets/clubs/cultural.webp',
  },
  {
    id: 'entrepreneurship',
    name: 'SU Entrepreneurship Club',
    abbreviation: 'SUEC',
    description:
      'Dedicated to fostering a startup culture among students. They organize workshops on business planning, leadership, and networking with successful entrepreneurs.',
    image: '/assets/clubs/entrepreneurship.webp',
  },
  {
    id: 'energy',
    name: 'SU Energy Club',
    abbreviation: 'SUEC',
    description:
      'Concentrates on promoting awareness about renewable energy, sustainability, and the latest technological advancements in the energy sector.',
    image: '/assets/clubs/energy.webp',
  },
  {
    id: 'photography',
    name: 'SU Photography Club',
    abbreviation: 'SUPC',
    description:
      'A creative platform for photography enthusiasts to develop their technical skills through exhibitions, photowalks, and workshops.',
    image: '/assets/clubs/photography.webp',
  },
  {
    id: 'social-services',
    name: 'SU Social Services Club',
    abbreviation: 'SUSSC',
    description:
      'Operates as the university’s philanthropic arm, organizing blood donation drives, winter clothing distributions, and relief efforts during national disasters.',
    image: '/assets/clubs/social-services.webp',
  },
  {
    id: 'sports',
    name: 'SU Sports Club',
    abbreviation: 'SUSC',
    description:
      'Responsible for managing all indoor and outdoor sporting events, including the annual sports meet and inter-departmental tournaments like cricket and football.',
    image: '/assets/clubs/sports.webp',
  },
  {
    id: 'microcontroller',
    name: 'SU Microcontroller Club',
    abbreviation: 'SUMCC',
    description:
      'A technical club focused on robotics, embedded systems, and hardware programming. It provides a hands-on environment for electronics projects.',
    image: '/assets/labs/lab-computer-lab-1.webp',
  },
  {
    id: 'career',
    name: 'SU Career Counseling Club',
    abbreviation: 'SUCCC',
    description:
      'Prepares students for the professional world by offering guidance on CV writing, interview techniques, and job market trends.',
    image: '/assets/clubs/career.webp',
  },
  {
    id: 'design',
    name: 'SU Design Club',
    abbreviation: 'SUDC',
    description:
      'Promotes visual creativity, focusing on graphic design, UI/UX, and architectural aesthetics to help students build professional portfolios.',
    image: '/assets/clubs/design.webp',
  },
  {
    id: 'structure',
    name: 'SU Structure Club',
    abbreviation: 'SUSC',
    description:
      'Aimed primarily at Civil Engineering students to explore structural modeling, design software, and modern construction techniques.',
    image: '/assets/labs/lab-hydraulic-press.webp',
  },
  {
    id: 'art',
    name: 'SU Art Club',
    abbreviation: 'SUAC',
    description:
      'Encourages fine arts, including painting and sketching, providing a space for students to express their creativity through visual media.',
    image: '/assets/clubs/art.webp',
  },
  {
    id: 'sumec',
    name: 'Sonargaon University Electrical and Electronic Club',
    abbreviation: 'SUEEC',
    description:
      'Representing the Electrical and Electronics Engineering department, this club is highly active in technical fests. They recently gained recognition as a "Valuable Club Partner" at high-profile events like Auto Fest.',
    image: '/assets/news/sumec-1st-anniversary.webp',
  },
];
