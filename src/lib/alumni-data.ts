export interface Alumni {
  id: string;
  studentId: string;
  name: string;
  department: string;
  designation: string;
  company: string;
  photo: string;
}

export const alumni: Alumni[] = [
  {
    id: 'mm-sarwar',
    studentId: 'BME1502006136',
    name: 'M. M. Sarwar',
    department: 'Electrical and Electronics Engineering',
    designation: 'Senior Superintendent Instructor (Retired)',
    company: 'BUET & Sonargaon University',
    photo: '/assets/alumni/mm-sarwar.webp',
  },
  {
    id: 'burhan-uddin',
    studentId: 'BME1402003106',
    name: 'Md. Burhan Uddin',
    department: 'Electrical and Electronics Engineering',
    designation: 'Semi Skilled Maintainer',
    company: 'Dhaka Mass Transit Company Limited (DMTCL)',
    photo: '/assets/alumni/burhan-uddin.webp',
  },
  {
    id: 'mts-alam-ananto',
    studentId: 'RMBA1903018006',
    name: 'M. T. S. Alam Ananto',
    department: 'Electrical and Electronics Engineering',
    designation: 'Assistant Engineer (Electrical)',
    company: 'BIWTC, Ministry of Shipping',
    photo: '/assets/alumni/ananto.webp',
  },
  {
    id: 'salah-uddin',
    studentId: 'BME1403004038',
    name: 'Md. Salah Uddin',
    department: 'Electrical and Electronics Engineering',
    designation: 'Junior Inspector',
    company: 'Dhaka Polytechnic Institute',
    photo: '/assets/alumni/salah-uddin.webp',
  },
  {
    id: 'sabbir-hosen',
    studentId: 'BME1501005079',
    name: 'Sabbir Hosen',
    department: 'Electrical and Electronics Engineering',
    designation: 'Executive (QEHS)',
    company: 'RAK Ceramics (Bangladesh) Limited',
    photo: '/assets/alumni/sabbir-hosen.webp',
  },
  {
    id: 'sadi-emon',
    studentId: 'ME2201026170',
    name: 'Sadi Md. Emon',
    department: 'Electrical and Electronics Engineering',
    designation: 'Junior Instructor',
    company: 'UCEP Bangladesh',
    photo: '/assets/alumni/sadi-emon.webp',
  },
];
