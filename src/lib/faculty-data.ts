export type FacultyType = 'leadership' | 'full-time' | 'part-time';

/**
 * A single list item. Either a plain string, or an object carrying the
 * item text plus an optional link (used for publications with a DOI/URL
 * and for research profile links like Google Scholar).
 */
export type SectionItem = string | { text: string; url?: string };

/**
 * Flexible section content. A section can be:
 *  - a plain paragraph (string)
 *  - a simple bullet list (SectionItem[])
 *  - grouped lists with subheadings ({ heading, items }[])
 */
export type SectionContent =
  | string
  | SectionItem[]
  | { heading: string; items: SectionItem[] }[];

export interface Faculty {
  slug: string;
  name: string;
  designation: string;
  /** Used by leadership cards above the name (e.g. "Dean", "Head of Department"). */
  badge?: string;
  /** Optional second line under the designation (e.g. "Professor"). */
  secondaryTitle?: string;
  type: FacultyType;
  photo?: string;
  email?: string;
  suId?: string;
  phone?: string;

  // Detail sections — optional, fill in as content arrives.
  personalInfo?: { label: string; value: string }[];
  academicQualification?: SectionContent;
  trainingExperience?: SectionContent;
  teachingArea?: SectionContent;
  publications?: SectionContent;
  research?: SectionContent;
  awards?: SectionContent;
  membership?: SectionContent;
  previousEmployment?: SectionContent;
}

const DEPARTMENT = 'Department of EEE';

export const faculty: Faculty[] = [
  // ───── Leadership ─────
  {
    slug: 'habibur-rahman-kamal',
    name: 'Brig. Gen. (Retd) Prof. Habibur Rahman Kamal, ndc, psc',
    designation: 'Dean, Faculty of Science & Engineering',
    badge: 'Dean',
    type: 'leadership',
    photo: '/assets/faculty-dean-kamal.webp',
  },
  {
    slug: 'mostofa-hossain',
    name: 'Prof. Md. Mostofa Hossain',
    designation: 'Head, Department of EEE',
    secondaryTitle: 'Professor',
    badge: 'Head of Department',
    type: 'leadership',
    photo: '/assets/faculty-head-mostofa.webp',
    email: 'mosto1956@gmail.com',
    suId: 'SU1603141114',
    phone: '01955529729',

    personalInfo: [
      { label: 'Name', value: 'Prof. Md. Mostofa Hossain' },
      { label: 'Designation', value: 'Professor' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01955529729' },
    ],

    academicQualification: [
      'SSC Certification — Passing Year: 1972 | Group: Science | School: Mohadevpur High School',
      'HSC Certification — Passing Year: 1981 | Group: Electrical Technology | College: Rajshahi Polytechnic Institute',
      'Honours Certification — Passing Year: 1989 | Group: Electrical and Electronics Engineering | University: DUET (Former BIT, Dhaka)',
      'Masters Certification — Passing Year: 2003 | Group: Electrical and Electronics Engineering | University: BUET, Dhaka',
    ],

    trainingExperience: [
      {
        heading: 'Training at Home',
        items: [
          'Successfully completed training on Industrial Control and Mechatronics (19–22 January 2003), Directorate of Continuing Education, BUET.',
          'Successfully completed training on Industrial & Control Applications of Basic Pneumatics and Basic Electro-Pneumatics (22–27 April 2006), Green Field Automation Technologies Ltd., Dhaka.',
          'Successfully completed National Training Session in the field of Vocational and Technical Training (26–28 May 2009).',
          'Successfully completed training on Green Composites (21 December 2011), BUET & Tuskegee University, USA.',
          'Successfully completed training on Multimedia Class Room and Digital Content Development (14–19 September 2013).',
          'Successfully completed training on Teaching on Active Learning (05–07 January 2017).',
        ],
      },
      {
        heading: 'Training Abroad',
        items: [
          'Successfully completed training in the field of Welding (12 May – 25 June 1994), South Korea.',
          'Successfully completed Managerial Training on Head of the Department (05–15 December 2015), Singapore.',
        ],
      },
    ],

    teachingArea: 'No information provided on the website.',

    publications: [
      {
        heading: 'Journals',
        items: [
          'Thermal Performance Analysis of Thermal Energy Storage Tank using Solid Rocks with HITEC Salt (2022).',
          'Performance Analysis of Biodiesel Generated Continuously by using Newly Developed PLC Processor (2021).',
          'An Experimental Study of Passive Flow Separation Control by Backward Facing Step with Different Aspect Ratios of NACA 0012 Wing (2021).',
          'An Experimental Investigation of the Effect of Aspect Ratio on the Airfoil Characteristics of NACA 0012 Wing (2020).',
          'A Review on Renovation of Gas Turbine to Improve Efficiency using Compressor Water Wash (2017).',
          'Scenario of Safety Issues Prevailing Accident in Rural Engineering Workshop in Bangladesh (2017).',
          'Study of Natural Convection Heat Transfer in a Rectangular Enclosure from One Cooled Side Wall (2017).',
          'Numerical Simulation of Non-Newtonian Spiral Flow Through Stenosed Artery with 75% and 96% Area Reductions (2017).',
          'Improvement of Conventional Electric Heater to Reduce Energy Loss and Its Performance Test (2016).',
          'A Comparative Study of Performances of Different Types of Barrier Constructions for Attenuating Low Frequency Noise (2016).',
        ],
      },
      {
        heading: 'Books',
        items: [
          'Hossain, M. M. — Basic Workshop Practice-1 (MT-113), 1st Edition, Boi Bitan Publication, Bangla Bazar, Dhaka.',
        ],
      },
    ],

    research: [
      {
        heading: 'Field of Interest',
        items: ['Thermofluid Engineering', 'Energy Engineering'],
      },
    ],

    awards: 'No information provided on the website.',

    membership: ['Fellow IEB — F08561'],

    previousEmployment: 'No information provided on the website.',
  },

  // ───── Full-time faculty (#2–30 from the SU list) ─────
  {
    slug: 'amm-shamsul-alam', name: 'AMM Shamsul Alam', designation: 'Associate Professor',
    type: 'full-time', photo: '/assets/faculty-shamsul-alam.webp',
    email: 'ammshamsul@gmail.com', suId: 'SU2301064638', phone: '01769005367',
    personalInfo: [
      { label: 'Name', value: 'A M M Shamsul Alam' },
      { label: 'Designation', value: 'Associate Professor' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01769005367' },
    ],
  },
  {
    slug: 'ahatashamul-haque-khan-shuvo', name: 'Md. Ahatashamul Haque Khan Shuvo', designation: 'Assistant Professor',
    type: 'full-time', photo: '/assets/faculty-ahatashamul-haque-khan-shuvo.webp',
    email: 'mahskhan.khan@gmail.com', suId: 'SU1808301292', phone: '01955529728',
  },
  {
    slug: 'saikat-biswas', name: 'Saikat Biswas', designation: 'Assistant Professor',
    type: 'full-time', photo: '/assets/faculty-saikat-biswas.webp',
    email: 'saikatbiswas.kuet@gmail.com', suId: 'SU1808301294', phone: '01955529747',
  },
  {
    slug: 'minhaz-uddin', name: 'Md. Minhaz Uddin', designation: 'Assistant Professor',
    type: 'full-time', photo: '/assets/faculty-minhaz-uddin.webp',
    email: 'minhazuddin137@gmail.com', suId: 'SU1901061311', phone: '01955529759',
    personalInfo: [
      { label: 'Name', value: 'Md. Minhaz Uddin' },
      { label: 'Designation', value: 'Assistant Professor' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01955529759' },
    ],
  },
  {
    slug: 'niloy-sarkar', name: 'Niloy Sarkar', designation: 'Assistant Professor',
    type: 'full-time', photo: '/assets/faculty-niloy-sarkar.webp',
    email: 'niloy24sumechanical@gmail.com', suId: 'SU1901171326', phone: '01955529829',
    personalInfo: [
      { label: 'Name', value: 'Niloy Sarkar' },
      { label: 'Designation', value: 'Assistant Professor' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01955529829' },
    ],
  },
  {
    slug: 'nuruzzaman-rakib', name: 'Nuruzzaman Rakib', designation: 'Assistant Professor',
    type: 'full-time', photo: '/assets/faculty-nuruzzaman-rakib.webp',
    email: 'rakibzaman1463@gmail.com', suId: 'SU1902261336', phone: '01955529752',
    personalInfo: [
      { label: 'Name', value: 'Nuruzzaman Rakib' },
      { label: 'Designation', value: 'Assistant Professor' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01955529752' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2011 | Group: No information provided | School: No information provided',
      'HSC Certification — Passing Year: 2013 | Group: No information provided | College: No information provided',
      'Honours Certification — Passing Year: 2017 | Group: Electrical and Electronics Engineering | University: Islamic University of Technology',
      'Masters Certification — No information provided on the website.',
    ],
    trainingExperience: 'No information provided on the website.',
    teachingArea: [
      'Renewable Energy',
      'Energy & Environment',
      'Engineering Mechanics',
      'Thermodynamics',
      'Power Plant Engineering',
    ],
    publications: [
      'An Improvement in Welded Joint Using Vibration Assisted Arc Welding. Mohammad Ahsan Habib, Md. Anayet U. Patwari, Nuruzzaman Rakib, Mahmudul H. Pavel, Ahmed Y. Sanin, Asif Salman and Fahrial Alam. [ed.] L. H. Chen and Y. Kondo. Melbourne: MATEC Web of Conferences, 2018. 3rd International Conference on Design and Manufacturing Engineering (ICDME 2018). Vol. 221, pp. 1–5. https://doi.org/10.1051/matecconf/201822104004',
      'A Study of Mechanical Properties of Vibration Assisted Arc Welding Joint. Mahmudul H. Pavel, Nuruzzaman Rakib, Mohammad A. Habib, Ahmed Y. Sanin and Asif Salman. European Journal of Engineering and Technology Research, 2018, Vol. 3, Issue 3, pp. 46–52. https://doi.org/10.24018/ejeng.2018.3.3.631',
      'Miah, M. A. K., Rakib, N., Habib, M. A. et al. Techno-economic analysis and environmental impact assessment of 3 MW photovoltaic power plant in Bangladesh: a case study based on real data. Environment, Development and Sustainability (2022). https://doi.org/10.1007/s10668-022-02634-7',
    ],
  },
  {
    slug: 'shahinur-rahman', name: 'Shahinur Rahman', designation: 'Assistant Professor',
    type: 'full-time', photo: '/assets/faculty-shahinur-rahman.webp',
    email: 'shahinursu2020@gmail.com', suId: 'SU2002261393', phone: '01958642411',
    personalInfo: [
      { label: 'Name', value: 'Shahinur Rahman' },
      { label: 'Designation', value: 'Assistant Professor' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01958642411' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2012 | Group: Science | School: Chawradangi High School',
      'HSC Certification — Passing Year: 2014 | Group: Science | College: Rangpur Govt. College',
      'Honours Certification — Passing Year: 2019 | Group: Electrical and Electronics Engineering | University: KUET',
      'Masters Certification — No information provided on the website.',
    ],
    trainingExperience: 'No information provided on the website.',
    teachingArea: ['Fluid Mechanics', 'Power Plant', 'IC Engine'],
    publications: [
      'Shahinur Rahman, Abrar Sobhan Chowdhury, "Design, Construction, and Performance Test of Mechanical Trash Removal Machine", Proceedings of the 7th International Conference on Mechanical Engineering and Renewable Energy 2023 (ICMERE2023), 16–18 November 2023, Chattogram, Bangladesh. Paper no: ICMERE23-060.',
      'Abrar Sobhan Chowdhury, Shahinur Rahman, Md. Anwarul Islam, "Enhancement of Convective Heat Transfer using Nanofluid: A Brief Overview", Proceedings of the 7th International Conference on Mechanical Engineering and Renewable Energy 2023 (ICMERE2023), 16–18 November 2023, Chattogram, Bangladesh. Paper no: ICMERE23-069.',
      'Al Aman, Syed Istiaq Mahmud, Md. Nawsher Ali Moral, Jamshedul Islam, and Shahinur Rahman, "Design, Construction and Performance Test of a Box Type Solar Cooker", International Conference on Mechanical, Industrial and Energy Engineering 2018, Paper no: ICMIEE18-1.',
    ],
  },
  {
    slug: 'faisal-junaeat-imrul', name: 'M. A. Faisal Junaeat Imrul', designation: 'Lecturer & Assistant Coordinator',
    type: 'full-time', photo: '/assets/faculty-faisal-junaeat-imrul.webp',
    email: 'junaetfaisal@gmail.com', suId: 'SU2109012368', phone: '01700936248',
    personalInfo: [
      { label: 'Name', value: 'M. A. Faisal Junaeat Imrul' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01700936248' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2012 | Group: Science | School: Mawna High School, Gazipur',
      'HSC Certification — Passing Year: 2014 | Group: Science | College: Rajendrapur Cantonment Public College, Gazipur',
      'Honours Certification — Passing Year: 2020 | Group: B.Sc. in Electrical and Electronics Engineering | University: Bangladesh Army University of Science and Technology',
      'Masters Certification — No information provided on the website.',
    ],
    trainingExperience: [
      'Industrial Training at "Central Locomotive Workshop", Bangladesh Railway, Parbatipur, Dinajpur.',
    ],
    teachingArea: [
      'Thermodynamics',
      'Fluid Mechanics',
      'Fluid Machinery',
      'IC Engine',
      'Power Plant Engineering',
      'Heat and Mass Transfer',
      'Instrumentation and Measurement',
    ],
  },
  {
    slug: 'navid-inan', name: 'Md. Navid Inan', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-navid-inan.webp',
    email: 'navidinan.su@gmail.com', suId: 'SU2201011020', phone: '01958642475',
    personalInfo: [
      { label: 'Name', value: 'Md. Navid Inan' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01958642475' },
    ],
  },
  {
    slug: 'misbah-uddin', name: 'Md. Misbah Uddin', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-misbah-uddin.webp',
    email: 'mdmisbahuddin99@gmail.com', suId: 'SU2201011024', phone: '01836414499',
    personalInfo: [
      { label: 'Name', value: 'Md. Misbah Uddin' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01836414499' },
    ],
  },
  {
    slug: 'ismail-hossain', name: 'G M Ismail Hossain', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-ismail-hossain.webp',
    email: 'gmismail016@gmail.com', suId: 'SU2205101113', phone: '01958642572',
  },
  {
    slug: 'nahiyan-chowdhury', name: 'Nahiyan Chowdhury', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-nahiyan-chowdhury.webp',
    email: 'nahiyanchowdhury22@gmail.com', suId: 'SU2208024537', phone: '01719987789',
    personalInfo: [
      { label: 'Name', value: 'Nahiyan Chowdhury' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01719987789' },
    ],
  },
  {
    slug: 'washif-rahman', name: 'M. I. Washif Rahman', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-washif-rahman.webp',
    email: 'washif.me@gmail.com', suId: 'SU2208024540', phone: '01818060447',
    personalInfo: [
      { label: 'Name', value: 'M. I. Washif Rahman' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01818060447' },
      { label: 'Alt Contact', value: '01955529834' },
    ],
  },
  {
    slug: 'khandoker-mohammad-faisal-karim', name: 'Khandoker Mohammad Faisal Karim', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-khandoker-mohammad-faisal-karim.webp',
    suId: 'SU2209054559', phone: '01832385685',
    personalInfo: [
      { label: 'Name', value: 'Khandoker Mohammad Faisal Karim' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01832385685' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2013 | Group: Science | School: Government Laboratory High School',
      'HSC Certification — Passing Year: 2015 | Group: Science | College: Notre Dame College',
      'Honours Certification — Passing Year: 2021 | Group: Electrical and Electronics Engineering | University: Bangladesh University of Engineering and Technology',
      'Masters Certification — Passing Year: 2026 | Group: Electrical and Electronics Engineering | University: Bangladesh University of Engineering and Technology',
    ],
    trainingExperience: [
      'Industrial training in the Engineering Department, SANOFI Pharmaceuticals Ltd. as part of the B.Sc. in Electrical and Electronics Engineering program.',
    ],
    teachingArea: ['Heat Engineering and Fluid Engineering'],
    publications: 'No information provided on the website.',
    research: [
      'Boundary Layer Flow over a Moving Flat Plate in Jeffrey Fluid with Newtonian Heating — https://doi.org/10.48550/arXiv.2012.14417',
    ],
  },
  {
    slug: 'hasan-tareq-mahin', name: 'Hasan Tareq Mahin', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-hasan-tareq-mahin.webp',
    email: 'hasantareq.me.su.22@gmail.com', suId: 'SU2209054566', phone: '01521408094',
    personalInfo: [
      { label: 'Name', value: 'Hasan Tareq Mahin' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01521408094' },
    ],
  },
  {
    slug: 'rokiya-sultana', name: 'Rokiya Sultana', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-rokiya-sultana.webp',
    email: 'rokaiyasultana016@gmail.com', suId: 'SU2209274599', phone: '01627542002',
    personalInfo: [
      { label: 'Name', value: 'Rokiya Sultana' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01627542002' },
    ],
    academicQualification: 'No information provided on the website.',
    trainingExperience: 'No information provided on the website.',
    teachingArea: [
      'Fluid Mechanics',
      'Fluid Machinery',
      'Automobile Engineering',
      'IC Engine',
      'Heat and Mass Transfer',
    ],
    publications: [
      'Rokiya Sultana, Mohammad Tasawar Islam, Gazi Shariair Iqbal Nayeem, Muameer Din Arif, Golam Mostofa, "Experimental Cooling Performance Evaluation of Different Coolants for Data Centre", IOP Conference Series: Materials Science and Engineering, Volume 1305, The 2nd International Conference on Mechanical Engineering and Applied Sciences 2022 (ICMEAS 2022), 08/12/2022 – 10/12/2022, Dhaka, Bangladesh. https://iopscience.iop.org/article/10.1088/1757-899X/1305/1/012018',
    ],
  },
  {
    slug: 'ibrahim-khalil-apurba', name: 'Ibrahim Khalil Apurba', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-ibrahim-khalil-apurba.webp',
    email: 'iamibrahim83@gmail.com', suId: 'SU2305084698', phone: '01957781158',
    personalInfo: [
      { label: 'Name', value: 'Ibrahim Khalil Apurba' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01957781158' },
      { label: 'Alt Contact', value: '01955529812' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2014 | Group: Science | School: A. K. High School',
      'HSC Certification — Passing Year: 2016 | Group: Science | College: Notre Dame College',
      'Honours Certification — Passing Year: 2016 | Group: Electrical and Electronics Engineering | University: Chittagong University of Engineering & Technology',
      'Masters Certification — No information provided on the website.',
    ],
    trainingExperience: [
      'Industrial Training at Chittagong Port Authority.',
      'Online courses on Udemy and Coursera.',
      'Automobile training at Banhla Automobile Skills.',
    ],
    teachingArea: [
      'Fluid Mechanics',
      'Automobile',
      'IC Engine',
      'Thermal Engineering',
      'Thermodynamics',
    ],
    publications: [
      'ICMERE Conference Paper — CFD Analysis on Effect of Divergence Angle in Compressible Flow of Convergent–Divergent Nozzle.',
      'ICMERE Conference Paper — Numerical Analysis of Thermal Performance of a Circular Tube Heat Exchanger with Pairs of Rectangular Vortex Generators.',
    ],
    research: [
      'Finding effect of convergent–divergent angle on CD nozzle.',
      'Finding effects of vortex generators.',
      'Research on solar panels.',
    ],
    awards: ['Mechanics Olympiad Winner'],
    membership: ['Member of ASME'],
  },
  {
    slug: 'torikul-islam', name: 'Md. Toriqul Islam', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-torikul-islam.webp',
    email: 'torikruetme46@gmail.com', suId: 'SU2305084700', phone: '01957113357',
    personalInfo: [
      { label: 'Name', value: 'Md. Toriqul Islam' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01957113357' },
    ],
  },
  {
    slug: 'munkasir-ahnaf-jisba', name: 'Munkasir Ahnaf Jisba', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-munkasir-ahnaf-jisba.webp',
    email: 'munkasirahnaf@proton.me', suId: 'SU2306074717', phone: '01860971800',
    personalInfo: [
      { label: 'Name', value: 'Munkasir Ahnaf Jisba' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01860971800' },
    ],
  },
  {
    slug: 'faruque-hossain', name: 'Md. Faruque Hossain', designation: 'Lecturer & Assistant Coordinator',
    type: 'full-time', photo: '/assets/faculty-faruque-hossain.webp',
    email: 'faruque.su@gmail.com', suId: 'SU2307074726', phone: '01955529875',
    personalInfo: [
      { label: 'Name', value: 'Md. Faruque Hossain' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01955529875' },
      { label: 'Alt Contact', value: '01717152521' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2012 | Group: Science | School: Purba Saitara High School, Dinajpur',
      'HSC Certification — Passing Year: 2016 | Group: Power Technology | College: Dinajpur Polytechnic Institute, Dinajpur',
      'Honours Certification — Passing Year: 2023 | Group: Electrical and Electronics Engineering | University: DUET, Gazipur',
      'Masters Certification — Passing Year: Ongoing | Group: Electrical and Electronics Engineering | University: DUET, Gazipur',
    ],
    trainingExperience: [
      'Workshop on "Outcome Based Education (OBE)", Institutional Quality Assurance Cell (IQAC), Sonargaon University, Dhaka, Bangladesh. (02 days, 2024)',
      'Workshop on "Implementation of OBE Curriculum", Institutional Quality Assurance Cell (IQAC), Sonargaon University, Dhaka, Bangladesh. (01 day, 2023)',
      'Industrial training at "105 MW HFO Based Power Plant", Rural Power Company Limited (RPCL), Gazipur, Bangladesh. (21 days, 2022)',
      'Industrial attachment at "Project Solution Engineering and Consultancy Limited", Gazipur, Bangladesh. (90 days, 2016)',
    ],
    teachingArea: [
      'ME 2101: Engineering Mechanics I',
      'ME 2201: Engineering Mechanics II',
      'ME 2203: Metallic Materials',
      'ME 2207: Mechanics of Solids',
      'ME 3101: Heat and Mass Transfer',
      'ME 3141: Mechanics of Machinery',
      'IPE 3201: Industrial Management',
      'HUM 3161: Engineering Ethics and Professionalism',
      'ME 4201: Automobile Engineering',
      'IPE 4205: Machine Tools',
    ],
    publications: [
      'Md. Sahaydul Islam, Md. Faruque Hossain, Md. Ramjan Ali, Mohammad Washim Dewan, Khurshida Sharmin, "Performance analysis of lithium-ion battery with solid electrolyte membrane", Hybrid Advances, Volume 5, 2024, 100137, ISSN 2773-207X. https://doi.org/10.1016/j.hybadv.2023.100137',
    ],
    research: [
      {
        heading: 'Field of Interest',
        items: [
          'Biomaterials',
          'Energy Storage Materials',
          'Li-ion Batteries',
          'Polymer & Composite Materials',
        ],
      },
    ],
    awards: 'No information provided on the website.',
    membership: ['The Institution of Engineers, Bangladesh — Membership ID: A26602'],
  },
  {
    slug: 'kazi-maskawath', name: 'Kazi Maskawath', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-kazi-maskawath.webp',
    email: 'kmayon13@gmail.com', suId: 'SU2309014747', phone: '01732827089',
  },
  {
    slug: 'sadman-hossain', name: 'Md. Sadman Hossain', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-sadman-hossain.webp',
    email: 'sadmanhossainravin98@gmail.com', suId: 'SU2309014748', phone: '01675387100',
    personalInfo: [
      { label: 'Name', value: 'Md. Sadman Hossain' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01675387100' },
    ],
  },
  {
    slug: 'towheedur-rahman-tanvir', name: 'Md. Towheedur Rahman Tanvir', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-towheedur-rahman-tanvir.webp',
    email: 'tanviribnlutfor.su@gmail.com', suId: 'SU2407054882', phone: '01303039919',
    personalInfo: [
      { label: 'Name', value: 'Md. Towheedur Rahman Tanvir' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01303039919' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2013 | Group: Science | School: No information provided on the website.',
      'HSC Certification — Passing Year: 2017 | Group: Shipbuilding Technology | College: Bangladesh Institute of Marine Technology, Narayanganj',
      'Honours Certification — Passing Year: 2023 | Group: Electrical and Electronics Engineering | University: Dhaka University of Engineering & Technology (DUET)',
      'Masters Certification — Passing Year: 2025 | Group: Electrical and Electronics Engineering | University: Dhaka University of Engineering & Technology (DUET)',
    ],
    trainingExperience: [
      'Industrial attachment at Ashuganj Power Station Company Ltd., Brahmanbaria. (4 Weeks, 2022)',
      'Industrial training at Khan Dockyard & Engineering Works, Narayanganj. (6 Months, 2018)',
    ],
    teachingArea: [
      'ME 2207: Mechanics of Solids',
      'ME 3141: Mechanics of Machinery-I',
      'ME 3141: Mechanics of Machinery-II',
      'IPE 4205: Machine Tools',
      'ME 4201: Automobile Engineering',
      'IPE 3201: Industrial Management',
      'ME 4205: Energy & Environment',
      'HUM 3161: Engineering Ethics and Professionalism',
    ],
    publications: 'No information provided on the website.',
    research: [
      {
        heading: 'Field of Interest',
        items: [
          'Biomaterials',
          'Polymer & Composite Materials',
          'Renewable Energy & Energy Storage Cells',
          'Robotics',
        ],
      },
    ],
    awards: [
      '"University Merit Scholarship" — awarded for sound academic performance in each semester of B.Sc. in Electrical and Electronics Engineering at DUET, Gazipur.',
      '"Technical Merit Scholarship" — awarded for sound academic performance in each semester of Diploma in Engineering at Bangladesh Institute of Marine Technology, Narayanganj.',
    ],
  },
  {
    slug: 'farhan-kadir-rafi', name: 'Farhan Kadir Rafi', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-farhan-kadir-rafi.webp',
    email: 'farhankadir33@gmail.com', suId: 'SU2407054883', phone: '01827204025',
  },
  {
    slug: 'tahmid-hasan-oni', name: 'Tahmid Hasan Oni', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-tahmid-hasan-oni.webp',
    email: 'tahmidoni70@gmail.com', suId: 'SU2407054884', phone: '01684837712',
  },
  {
    slug: 'nafis-iqbal', name: 'Nafis Iqbal', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-nafis-iqbal.webp',
    email: 'nafis.iqbal.su@gmail.com', suId: 'SU2407054885', phone: '01771551725',
    personalInfo: [
      { label: 'Name', value: 'Nafis Iqbal' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01771551725' },
      { label: 'Alt Contact', value: '01732678978' },
    ],
  },
  {
    slug: 'mahfuz-kabir', name: 'Md. Mahfuz Kabir', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-mahfuz-kabir.webp',
    email: 'mahfuzkabir.su@gmail.com', suId: 'SU2407054886', phone: '01749352466',
  },
  {
    slug: 'shafi-uddin-bhuiyan', name: 'Shafi Uddin Bhuiyan', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-shafi-uddin-bhuiyan.webp',
    suId: 'SU2408134898', phone: '01707516365',
    personalInfo: [
      { label: 'Name', value: 'Shafi Uddin Bhuiyan' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01707516365' },
    ],
  },
  {
    slug: 'mahfujul-islam', name: 'Md. Mahfujul Islam', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-mahfujul-islam.webp',
    phone: '01551182174',
    personalInfo: [
      { label: 'Name', value: 'Md. Mahfujul Islam' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01551182174' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2014 | Group: Science | School: V. J. Govt. High School',
      'HSC Certification — Passing Year: 2016 | Group: Science | College: Chuadanga Govt. College',
      'Honours Certification — Passing Year: 2022 | Group: Electrical and Electronics Engineering | University: Khulna University of Engineering & Technology',
      'Masters Certification — No information provided on the website.',
    ],
    trainingExperience: 'No information provided on the website.',
    teachingArea: [
      'Fluid Mechanics',
      'Machine Design',
      'Automobile Engineering',
      'Mechanics of Machinery',
      'Machine Tools',
      'Engineering Thermodynamics',
    ],
    publications: [
      'Md. Mahfujul Islam, Mohammad Ilias Inam, "Numerical Investigation of the Effect of Different Aerofoil Profile of a Spoiler in a Car", International Conference on Mechanical Industrial & Energy Engineering, Khulna, Bangladesh, 2022.',
    ],
    research:
      'Field of interest: Fluid flow analysis over any type of body, fluid flow control, and aerodynamical phenomena related to fluid and aerodynamics. Enthusiastic to examine the characteristics of fluid flow in many sectors and look into the different design considerations for the body upon which fluid flow occurs, as well as ways to lessen the negative effects of fluid flow in related fields. Also interested in investigating ways to improve the performance of automobiles by considering safety, economic and environmental issues — designing devices that can add on to automobiles to improve performance with safety, improve exhaust procedure and control the fluid flow effect. Currently researching fluid flow behaviour over ground vehicles and ways to reduce energy consumption while enhancing their safety during high-speed mobility.',
    awards: ["Dean's Award from Faculty of Mechanical Engineering, KUET (Session 2018/2019)"],
  },

  // ───── Full-time extras (no contact info supplied yet) ─────
  {
    slug: 'khakan-hasan-mim', name: 'Md. Khakan Hasan Mim', designation: 'Lecturer & Exam Coordinator',
    type: 'full-time', photo: '/assets/faculty-khakan-hasan-mim.webp',
    phone: '01796176884',
    personalInfo: [
      { label: 'Name', value: 'Md. Khakan Hasan Mim' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01796176884' },
    ],
    academicQualification: [
      'SSC Certification — Passing Year: 2014 | Group: Science | School: Syedpur Cantonment Public School & College, Nilphamari',
      'HSC Certification — Passing Year: 2016 | Group: Science | College: Saidpur Govt. Technical College, Nilphamari',
      'Honours Certification — Passing Year: 2022 | Group: Electrical and Electronics Engineering | University: Khulna University of Engineering and Technology, Khulna',
      'Masters Certification — No information provided on the website.',
    ],
    trainingExperience: 'No information provided on the website.',
    teachingArea: [
      'Mechanics of Machine',
      'Numerical Analysis for Engineers',
      'Instrumentation and Measurement',
      'Solid Mechanics',
      'Fluid Mechanics',
      'Engineering Mechanics',
      'Machine Design',
      'Thermal Engineering',
      'Automobile',
    ],
    publications: [
      'Experimental Investigation of Mechanical Properties of Various Natural Fiber-Reinforced Hybrid Composites. Md. Khakan Hasan Mim (1st Author), Md. Anash Mia, Pranto Karua. 6th Industrial Engineering and Operations Management Bangladesh Conference, Dhaka, December. — Awarded the third position.',
    ],
  },
  {
    slug: 'biplob-hossain', name: 'Biplob Hossain', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-biplob-hossain.webp',
  },
  {
    slug: 'feroze-alam', name: 'Md. Feroze Alam', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-feroze-alam.webp',
  },
  {
    slug: 'ikramul-hasib', name: 'Md. Ikramul Hasib', designation: 'Lecturer',
    type: 'full-time', photo: '/assets/faculty-ikramul-hasib.webp', phone: '01679114650',
    personalInfo: [
      { label: 'Name', value: 'Md. Ikramul Hasib' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01679114650' },
    ],
  },

  // ───── Part-time faculty ─────
  {
    slug: 'abul-bashar', name: 'Prof. Md. Abul Bashar', designation: 'Professor (Part-time)',
    type: 'part-time',
    email: 'prof.bashar@gmail.com', suId: 'SU2402184795', phone: '01713049085',
  },
  {
    slug: 'mohammad-ali', name: 'Prof. Dr. Mohammad Ali', designation: 'Professor, BUET (Part-time)',
    type: 'part-time',
    email: 'mali@me.buet.ac.bd', suId: 'SU1303090100', phone: '01732194776',
  },
  {
    slug: 'arefin-kowser', name: 'Prof. Dr. Md. Arefin Kowser', designation: 'Professor, DUET (Part-time)',
    type: 'part-time',
    email: 'arefin@duet.ac.bd', suId: 'SU1303090123', phone: '01754262832',
  },
  {
    slug: 'jalal-uddin', name: 'Dr. Md. Jalal Uddin', designation: 'Assistant Professor (Part-time)',
    type: 'part-time',
    email: 'jalal_bitac@yahoo.com', suId: 'SU2201011052', phone: '01923618189',
  },
  {
    slug: 'nasir-uddin', name: 'Md. Nasir Uddin', designation: 'Lecturer (Part-time)',
    type: 'part-time',
    email: 'nasiruddinsumon001@gmail.com', suId: 'SU1801040550', phone: '01767751838',
  },
  {
    slug: 'anash-mia', name: 'Md. Anash Mia', designation: 'Lecturer (Contractual)',
    type: 'part-time', photo: '/assets/faculty-anash-mia.webp',
    email: 'anas108.kuet@gmail.com', suId: 'SU2305174709', phone: '01779763212',
    personalInfo: [
      { label: 'Name', value: 'Md. Anash Mia' },
      { label: 'Designation', value: 'Lecturer' },
      { label: 'Department', value: 'Electrical and Electronics Engineering' },
      { label: 'Faculty', value: 'Faculty of Science & Engineering' },
      { label: 'Contact', value: '01779763212' },
    ],
  },
];

export const getFacultyBySlug = (slug: string): Faculty | undefined =>
  faculty.find((f) => f.slug === slug);

export const facultyByType = (type: FacultyType): Faculty[] =>
  faculty.filter((f) => f.type === type);

export const departmentName = DEPARTMENT;
