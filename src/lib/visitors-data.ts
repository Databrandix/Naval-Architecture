export interface Visitor {
  id: string;
  name: string;
  photo: string;
  role?: string;
  affiliation?: string;
  quote: string[];
}

export const visitors: Visitor[] = [
  {
    id: 'dr-s-r-subramanya',
    name: 'Dr. S. R. Subramanya',
    photo: '/assets/visitors/dr-s-r-subramanya.webp',
    role: 'Professor',
    affiliation: 'Visiting Scholar',
    quote: [
      'I am happy to participate in the Convocation of Sonargaon University and address the graduates today. SU is a growing university in Bangladesh under the leadership of its trustees and eminent professors. This University has a bright future and I wish the University all the best.',
    ],
  },
  {
    id: 'syeda-rizwana-hasan',
    name: 'Syeda Rizwana Hasan',
    photo: '/assets/visitors/syeda-rizwana-hasan.webp',
    role: 'Advisor',
    affiliation: 'Ministry of Environment, Forest and Climate Change',
    quote: [
      'It is a privilege to stand before the graduates of Sonargaon University. In this era of rapid change, I am encouraged to see SU’s commitment to fostering academic excellence and social responsibility. I urge the graduates to use their education not just for professional success, but as a tool for environmental stewardship and building a sustainable, equitable Bangladesh. I wish Sonargaon University continued success in shaping the leaders of tomorrow.',
    ],
  },
  {
    id: 'md-abdul-latif',
    name: 'Professor Dr. Md. Abdul Latif',
    photo: '/assets/visitors/md-abdul-latif.webp',
    role: 'Vice-Chancellor',
    affiliation: 'Sonargaon University (SU)',
    quote: [
      'As the Vice-Chancellor of Sonargaon University, I am immensely proud of our students\' journey toward becoming skilled professionals and responsible citizens. Our mission is to provide quality education that meets global standards while remaining rooted in our national values. We are committed to fostering an environment of innovation and research that empowers our graduates to lead with integrity. I look forward to seeing our alumni contribute significantly to the development and prosperity of Bangladesh.',
    ],
  },
  {
    id: 'mesbahuddin-ahmed',
    name: 'Professor Dr. Mesbahuddin Ahmed',
    photo: '/assets/visitors/mesbahuddin-ahmed.webp',
    role: 'Eminent Physicist & Former Vice-Chancellor',
    affiliation: 'Bangladesh Accreditation Council / Jagannath University',
    quote: [
      'In this era of rapid scientific advancement, quality assurance in higher education is paramount. Having spent decades in research and academic administration, I am encouraged by Sonargaon University’s commitment to maintaining global standards. I urge the graduates to remain lifelong learners and to use their knowledge of science and technology to build a smarter, more prosperous Bangladesh. My best wishes to the entire SU community.',
    ],
  },
];
