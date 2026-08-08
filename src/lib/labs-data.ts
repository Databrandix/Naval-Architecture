export interface Lab {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage?: string;
  gallery?: string[];
}

export const labs: Lab[] = [
  {
    slug: 'manufacturing-lab',
    name: 'Manufacturing Lab',
    tagline: 'Where raw material becomes a finished engineering product.',
    description:
      'The Manufacturing Lab focuses on the fundamentals of production processes — including machining, welding, and casting — allowing students to understand how raw materials are transformed into finished engineering products. The lab houses lathes, milling and shaper machines, drilling stations, and bench-work tooling for hands-on practice.',
    heroImage: '/assets/labs/lab-lathe-red.webp',
    gallery: [
      '/assets/labs/lab-lathe-lc360b.webp',
      '/assets/labs/lab-milling-machine-1.webp',
      '/assets/labs/lab-milling-machine-2.webp',
      '/assets/labs/lab-shaper-machines.webp',
      '/assets/labs/lab-bench-tools.webp',
      '/assets/labs/lab-drill-compressor.webp',
      '/assets/labs/lab-manufacturing-mixed.webp',
    ],
  },
  {
    slug: 'ice-lab',
    name: 'Internal Combustion Engine (ICE) Lab',
    tagline: 'Petrol and diesel engines for performance and combustion study.',
    description:
      'Equipped with various types of petrol and diesel engines, the ICE Lab helps students study engine performance, fuel efficiency, and the thermodynamics of combustion systems. Live engine test rigs let students measure key parameters and explore the working cycles of real automotive and industrial engines.',
    heroImage: '/assets/labs/lab-ice-engine-rig.webp',
    gallery: [
      '/assets/labs/lab-ice-engine-large.webp',
      '/assets/labs/lab-ice-engine-teardown.webp',
    ],
  },
  {
    slug: 'applied-mechanics-lab',
    name: 'Applied Mechanics Lab',
    tagline: 'See physics and mechanics in action.',
    description:
      'The Applied Mechanics Lab provides practical insight into the laws of physics and mechanics. Students analyse forces, motion, and the equilibrium of mechanical components through experimental setups that visualise theory taught in the classroom.',
    heroImage: '/assets/labs/lab-applied-mech-bicycle.webp',
  },
  {
    slug: 'fluid-mechanics-lab',
    name: 'Fluid Mechanics Lab',
    tagline: 'Measure flow, pressure, and the behaviour of liquids.',
    description:
      'Featuring experimental setups to study fluid flow, pressure distribution, and the behaviour of liquids in various engineering applications, the Fluid Mechanics Lab is built around the practical needs of electrical and electronics engineering students.',
    heroImage: '/assets/labs/lab-fluid-hydraulics.webp',
    gallery: ['/assets/labs/lab-fluid-friction.webp'],
  },
  {
    slug: 'computer-lab',
    name: 'Computer Lab',
    tagline: 'CAD, calculation, and modern engineering software.',
    description:
      'A high-tech facility with the latest software and hardware, the Computer Lab is where students learn computer-aided design (CAD) and perform complex engineering calculations. Industry-standard software is provided alongside dedicated workstations.',
    heroImage: '/assets/labs/lab-computer-lab.webp',
    gallery: ['/assets/labs/lab-computer-lab-2.webp'],
  },
  {
    slug: 'cfd-lab',
    name: 'CFD (Computational Fluid Dynamics) Lab',
    tagline: 'Simulate fluid flow and heat transfer with modern numerical tools.',
    description:
      'A specialised lab for advanced students to simulate fluid flow, heat transfer, and related phenomena using modern numerical analysis tools. The CFD lab supports research-level work with cluster-grade workstations and licensed simulation software.',
    heroImage: '/assets/labs/lab-cfd.webp',
  },
  {
    slug: 'heat-thermodynamics-lab',
    name: 'Heat and Applied Thermodynamics Lab',
    tagline: 'Energy transfer, heat exchangers, and the laws of thermodynamics.',
    description:
      'The Heat and Applied Thermodynamics Lab focuses on the principles of energy transfer, heat exchangers, and the laws of thermodynamics — essential for designing cooling and heating systems. Forced convection rigs and other apparatus give students direct measurement experience.',
    heroImage: '/assets/labs/lab-forced-convection.webp',
  },
  {
    slug: 'engineering-drawing-lab',
    name: 'Engineering Drawing Lab',
    tagline: 'The visual language of engineering — from sketch to blueprint.',
    description:
      'The foundation of engineering design, the Engineering Drawing Lab is where students learn to visualise and draft technical blueprints both manually and using digital tools. The space is set up for both traditional drafting tables and modern CAD stations.',
    heroImage: '/assets/labs/lab-computer-lab.webp',
  },
  {
    slug: 'material-testing-lab',
    name: 'Material Testing Lab',
    tagline: 'Strength, hardness, and durability under real load.',
    description:
      'The Material Testing Lab is dedicated to analysing the physical and mechanical properties of materials — strength, hardness, ductility, and durability under various stress conditions. A hydraulic press, hardness testers, and load frames support hands-on experiments.',
    heroImage: '/assets/labs/lab-hydraulic-press.webp',
  },
  {
    slug: 'instrumentation-measurement-lab',
    name: 'Instrumentation and Measurement Lab',
    tagline: 'Precision instruments for temperature, pressure, and vibration.',
    description:
      'The Instrumentation and Measurement Lab provides training on how to use precision instruments and sensors to measure physical quantities — temperature, pressure, vibration, and more — with high accuracy. Students learn calibration, signal acquisition, and data interpretation.',
    heroImage: '/assets/labs/lab-bench-tools.webp',
  },
];

export const getLabBySlug = (slug: string): Lab | undefined =>
  labs.find((l) => l.slug === slug);
