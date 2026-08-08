export interface BusRoute {
  id: string;
  routeName: string;
  busNumber: string;
  contact: string;
  departureTimes: string[];
  returnTimes: string[];
}

export const busRoutes: BusRoute[] = [
  {
    id: 'technical',
    routeName: 'Technical → SU',
    busNumber: 'Dhaka Metro-J 11-2657',
    contact: '01958-642577',
    departureTimes: ['07:00 AM', '10:30 AM'],
    returnTimes: ['04:45 PM'],
  },
  {
    id: 'mograpara-1',
    routeName: 'Mograpara → SU',
    busNumber: 'Dhaka Metro-B 11-7251',
    contact: '01958-642578',
    departureTimes: ['06:20 AM'],
    returnTimes: ['12:40 PM'],
  },
  {
    id: 'mograpara-2',
    routeName: 'Mograpara → SU',
    busNumber: 'Dhaka Metro-B 15-3688',
    contact: '01958-642579',
    departureTimes: ['09:40 AM'],
    returnTimes: ['04:45 PM'],
  },
  {
    id: 'gauchhia',
    routeName: 'Gauchhia → SU',
    busNumber: 'Dhaka Metro-B 8451',
    contact: '01958-642580',
    departureTimes: ['06:20 AM'],
    returnTimes: ['04:45 PM'],
  },
  {
    id: 'savar',
    routeName: 'Savar → SU',
    busNumber: 'Dhaka Metro-J 11-3124',
    contact: '01958-642581',
    departureTimes: ['07:00 AM'],
    returnTimes: ['04:45 PM'],
  },
  {
    id: 'abdullahpur-1',
    routeName: 'Abdullahpur → SU',
    busNumber: 'Dhaka Metro 14-1615',
    contact: '01958-642582',
    departureTimes: ['06:40 AM'],
    returnTimes: ['12:40 PM'],
  },
  {
    id: 'abdullahpur-2',
    routeName: 'Abdullahpur → SU',
    busNumber: 'Dhaka Metro-B 11-8421',
    contact: '01958-642593',
    departureTimes: ['09:45 AM'],
    returnTimes: ['04:45 PM'],
  },
  {
    id: 'kuril',
    routeName: 'Kuril → SU',
    busNumber: 'Dhaka Metro-B 11-7357',
    contact: '01958-642587',
    departureTimes: ['06:55 AM', '10:00 AM'],
    returnTimes: ['04:45 PM'],
  },
  {
    id: 'chashara',
    routeName: 'Chashara → SU',
    busNumber: 'Dhaka Metro-B 15-1651',
    contact: '01958-642594',
    departureTimes: ['06:45 AM'],
    returnTimes: [],
  },
  {
    id: 'kadamtali',
    routeName: 'Kadamtali → SU',
    busNumber: 'Dhaka Metro-B 15-7176',
    contact: '01958-642592',
    departureTimes: ['07:00 AM'],
    returnTimes: ['01:20 PM'],
  },
];
