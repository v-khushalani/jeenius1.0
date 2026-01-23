export interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  concepts: string[];
  keyFormulas?: string[];
  importantPoints: string[];
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
  totalTopics: number;
  estimatedDuration: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  chapters: Chapter[];
}

export interface ClassData {
  class: 11 | 12;
  subjects: Subject[];
}

export const jeeData: ClassData[] = [
  {
    class: 11,
    subjects: [
      {
        id: 'physics-11',
        name: 'Physics',
        icon: '⚡',
        color: 'bg-blue-500',
        chapters: [
          {
            id: 'mechanics',
            name: 'Mechanics',
            description: 'Study of motion, forces, and energy in physical systems',
            estimatedDuration: '4-5 weeks',
            totalTopics: 8,
            topics: [
              {
                id: 'kinematics',
                name: 'Kinematics',
                description: 'Motion in one and two dimensions',
                difficulty: 'Easy',
                estimatedTime: '3-4 days',
                concepts: ['Displacement', 'Velocity', 'Acceleration', 'Projectile Motion'],
                keyFormulas: ['v = u + at', 's = ut + ½at²', 'v² = u² + 2as'],
                importantPoints: [
                  'Understand the difference between distance and displacement',
                  'Master projectile motion problems',
                  'Practice relative motion concepts'
                ]
              },
              {
                id: 'dynamics',
                name: 'Dynamics',
                description: 'Newton\'s laws and their applications',
                difficulty: 'Medium',
                estimatedTime: '4-5 days',
                concepts: ['Newton\'s Laws', 'Friction', 'Circular Motion', 'Banking'],
                keyFormulas: ['F = ma', 'f = μN', 'F = mv²/r'],
                importantPoints: [
                  'Apply Newton\'s laws systematically',
                  'Understand different types of friction',
                  'Master banking and circular motion'
                ]
              },
              {
                id: 'work-energy',
                name: 'Work, Energy & Power',
                description: 'Conservation of energy and work-energy theorem',
                difficulty: 'Medium',
                estimatedTime: '3-4 days',
                concepts: ['Work', 'Kinetic Energy', 'Potential Energy', 'Power'],
                keyFormulas: ['W = F·s cosθ', 'KE = ½mv²', 'PE = mgh', 'P = W/t'],
                importantPoints: [
                  'Apply work-energy theorem',
                  'Understand conservative forces',
                  'Practice power calculations'
                ]
              }
            ]
          },
          {
            id: 'thermal-physics',
            name: 'Thermal Physics',
            description: 'Heat, temperature, and thermodynamic processes',
            estimatedDuration: '3-4 weeks',
            totalTopics: 6,
            topics: [
              {
                id: 'heat-temperature',
                name: 'Heat and Temperature',
                description: 'Basic concepts of thermal physics',
                difficulty: 'Easy',
                estimatedTime: '2-3 days',
                concepts: ['Temperature Scales', 'Heat Capacity', 'Calorimetry'],
                keyFormulas: ['Q = mcΔT', 'C = K + 273.15', 'F = 9C/5 + 32'],
                importantPoints: [
                  'Distinguish between heat and temperature',
                  'Master calorimetry problems',
                  'Understand thermal equilibrium'
                ]
              },
              {
                id: 'thermal-expansion',
                name: 'Thermal Expansion',
                description: 'Linear, area, and volume expansion',
                difficulty: 'Medium',
                estimatedTime: '2-3 days',
                concepts: ['Linear Expansion', 'Area Expansion', 'Volume Expansion'],
                keyFormulas: ['ΔL = αL₀ΔT', 'ΔA = βA₀ΔT', 'ΔV = γV₀ΔT'],
                importantPoints: [
                  'Understand expansion coefficients',
                  'Apply to real-world scenarios',
                  'Solve thermal stress problems'
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'chemistry-11',
        name: 'Chemistry',
        icon: '🧪',
        color: 'bg-green-500',
        chapters: [
          {
            id: 'atomic-structure',
            name: 'Atomic Structure',
            description: 'Structure of atoms and quantum mechanics',
            estimatedDuration: '3-4 weeks',
            totalTopics: 6,
            topics: [
              {
                id: 'bohr-model',
                name: 'Bohr\'s Model',
                description: 'Atomic model and electron orbits',
                difficulty: 'Medium',
                estimatedTime: '3-4 days',
                concepts: ['Rutherford Model', 'Bohr\'s Postulates', 'Energy Levels'],
                keyFormulas: ['E = -13.6/n² eV', 'rₙ = 0.529n² Å', '1/λ = R(1/n₁² - 1/n₂²)'],
                importantPoints: [
                  'Understand Bohr\'s postulates',
                  'Calculate energy levels',
                  'Apply Rydberg formula'
                ]
              },
              {
                id: 'quantum-numbers',
                name: 'Quantum Numbers',
                description: 'Four quantum numbers and electron configuration',
                difficulty: 'Hard',
                estimatedTime: '4-5 days',
                concepts: ['Principal (n)', 'Azimuthal (l)', 'Magnetic (mₗ)', 'Spin (mₛ)'],
                keyFormulas: ['l = 0 to (n-1)', 'mₗ = -l to +l', 'mₛ = ±½'],
                importantPoints: [
                  'Master electron configuration',
                  'Understand Hund\'s rule',
                  'Apply Pauli exclusion principle'
                ]
              }
            ]
          },
          {
            id: 'chemical-bonding',
            name: 'Chemical Bonding',
            description: 'Types of bonds and molecular geometry',
            estimatedDuration: '4-5 weeks',
            totalTopics: 7,
            topics: [
              {
                id: 'ionic-bonding',
                name: 'Ionic Bonding',
                description: 'Formation and properties of ionic compounds',
                difficulty: 'Easy',
                estimatedTime: '2-3 days',
                concepts: ['Electronegativity', 'Lattice Energy', 'Born-Haber Cycle'],
                keyFormulas: ['ΔHf = ΔHs + ΔHd + IE + EA + U'],
                importantPoints: [
                  'Understand electronegativity difference',
                  'Calculate lattice energy',
                  'Apply Born-Haber cycle'
                ]
              },
              {
                id: 'covalent-bonding',
                name: 'Covalent Bonding',
                description: 'Sharing of electrons and molecular orbitals',
                difficulty: 'Medium',
                estimatedTime: '3-4 days',
                concepts: ['Lewis Structures', 'VSEPR Theory', 'Hybridization'],
                importantPoints: [
                  'Draw Lewis structures correctly',
                  'Predict molecular geometry',
                  'Understand orbital hybridization'
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'mathematics-11',
        name: 'Mathematics',
        icon: '📐',
        color: 'bg-purple-500',
        chapters: [
          {
            id: 'trigonometry',
            name: 'Trigonometry',
            description: 'Trigonometric functions and identities',
            estimatedDuration: '5-6 weeks',
            totalTopics: 8,
            topics: [
              {
                id: 'trigonometric-functions',
                name: 'Trigonometric Functions',
                description: 'Basic trigonometric ratios and functions',
                difficulty: 'Easy',
                estimatedTime: '3-4 days',
                concepts: ['sin, cos, tan', 'Reciprocal Functions', 'Unit Circle'],
                keyFormulas: ['sin²θ + cos²θ = 1', 'tan θ = sin θ/cos θ'],
                importantPoints: [
                  'Memorize standard angle values',
                  'Understand unit circle',
                  'Practice all quadrant signs'
                ]
              },
              {
                id: 'trigonometric-identities',
                name: 'Trigonometric Identities',
                description: 'Sum, difference, and multiple angle formulas',
                difficulty: 'Hard',
                estimatedTime: '4-5 days',
                concepts: ['Sum & Difference', 'Double Angle', 'Half Angle', 'Product-to-Sum'],
                keyFormulas: [
                  'sin(A ± B) = sinA cosB ± cosA sinB',
                  'cos2A = cos²A - sin²A',
                  'sin2A = 2sinA cosA'
                ],
                importantPoints: [
                  'Master all fundamental identities',
                  'Practice proving complex identities',
                  'Apply in solving equations'
                ]
              }
            ]
          },
          {
            id: 'algebra',
            name: 'Algebra',
            description: 'Complex numbers, sequences, and series',
            estimatedDuration: '4-5 weeks',
            totalTopics: 6,
            topics: [
              {
                id: 'complex-numbers',
                name: 'Complex Numbers',
                description: 'Operations and properties of complex numbers',
                difficulty: 'Medium',
                estimatedTime: '4-5 days',
                concepts: ['Real & Imaginary Parts', 'Modulus & Argument', 'De Moivre\'s Theorem'],
                keyFormulas: ['z = a + bi', '|z| = √(a² + b²)', 'arg(z) = tan⁻¹(b/a)'],
                importantPoints: [
                  'Master complex number operations',
                  'Understand polar form',
                  'Apply De Moivre\'s theorem'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    class: 12,
    subjects: [
      {
        id: 'physics-12',
        name: 'Physics',
        icon: '⚡',
        color: 'bg-blue-500',
        chapters: [
          {
            id: 'electrostatics',
            name: 'Electrostatics',
            description: 'Electric charges, fields, and potential',
            estimatedDuration: '4-5 weeks',
            totalTopics: 7,
            topics: [
              {
                id: 'coulombs-law',
                name: 'Coulomb\'s Law',
                description: 'Force between electric charges',
                difficulty: 'Easy',
                estimatedTime: '2-3 days',
                concepts: ['Electric Charge', 'Coulomb\'s Law', 'Superposition Principle'],
                keyFormulas: ['F = kq₁q₂/r²', 'k = 9 × 10⁹ N⋅m²/C²'],
                importantPoints: [
                  'Understand inverse square law',
                  'Apply superposition principle',
                  'Solve for multiple charges'
                ]
              },
              {
                id: 'electric-field',
                name: 'Electric Field',
                description: 'Electric field and field lines',
                difficulty: 'Medium',
                estimatedTime: '3-4 days',
                concepts: ['Electric Field Intensity', 'Field Lines', 'Gauss\'s Law'],
                keyFormulas: ['E = F/q', 'E = kQ/r²', '∮E⋅dA = Q/ε₀'],
                importantPoints: [
                  'Visualize electric field lines',
                  'Apply Gauss\'s law',
                  'Calculate field due to various distributions'
                ]
              }
            ]
          },
          {
            id: 'electromagnetic-induction',
            name: 'Electromagnetic Induction',
            description: 'Faraday\'s law and Lenz\'s law',
            estimatedDuration: '3-4 weeks',
            totalTopics: 5,
            topics: [
              {
                id: 'faradays-law',
                name: 'Faraday\'s Law',
                description: 'Electromagnetic induction and induced EMF',
                difficulty: 'Medium',
                estimatedTime: '3-4 days',
                concepts: ['Magnetic Flux', 'Induced EMF', 'Lenz\'s Law'],
                keyFormulas: ['Φ = B⋅A', 'ε = -dΦ/dt', 'ε = BLv'],
                importantPoints: [
                  'Understand flux change',
                  'Apply Lenz\'s law for direction',
                  'Master motional EMF'
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'chemistry-12',
        name: 'Chemistry',
        icon: '🧪',
        color: 'bg-green-500',
        chapters: [
          {
            id: 'electrochemistry',
            name: 'Electrochemistry',
            description: 'Electrochemical cells and electrolysis',
            estimatedDuration: '4-5 weeks',
            totalTopics: 6,
            topics: [
              {
                id: 'galvanic-cells',
                name: 'Galvanic Cells',
                description: 'Electrochemical cells and EMF',
                difficulty: 'Medium',
                estimatedTime: '4-5 days',
                concepts: ['Cell Potential', 'Standard Electrode Potential', 'Nernst Equation'],
                keyFormulas: ['E°cell = E°cathode - E°anode', 'E = E° - (RT/nF)lnQ'],
                importantPoints: [
                  'Understand cell notation',
                  'Calculate cell potential',
                  'Apply Nernst equation'
                ]
              }
            ]
          },
          {
            id: 'organic-chemistry',
            name: 'Organic Chemistry',
            description: 'Hydrocarbons and functional groups',
            estimatedDuration: '6-7 weeks',
            totalTopics: 10,
            topics: [
              {
                id: 'alkanes',
                name: 'Alkanes',
                description: 'Saturated hydrocarbons and conformations',
                difficulty: 'Easy',
                estimatedTime: '3-4 days',
                concepts: ['IUPAC Nomenclature', 'Isomerism', 'Conformations'],
                importantPoints: [
                  'Master IUPAC naming rules',
                  'Understand structural isomerism',
                  'Study conformational analysis'
                ]
              },
              {
                id: 'alkenes-alkynes',
                name: 'Alkenes and Alkynes',
                description: 'Unsaturated hydrocarbons and reactions',
                difficulty: 'Medium',
                estimatedTime: '4-5 days',
                concepts: ['Addition Reactions', 'Markovnikov\'s Rule', 'Ozonolysis'],
                importantPoints: [
                  'Understand addition mechanisms',
                  'Apply Markovnikov\'s rule',
                  'Master oxidation reactions'
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'mathematics-12',
        name: 'Mathematics',
        icon: '📐',
        color: 'bg-purple-500',
        chapters: [
          {
            id: 'calculus',
            name: 'Calculus',
            description: 'Differential and integral calculus',
            estimatedDuration: '8-10 weeks',
            totalTopics: 12,
            topics: [
              {
                id: 'limits',
                name: 'Limits',
                description: 'Limits of functions and continuity',
                difficulty: 'Medium',
                estimatedTime: '4-5 days',
                concepts: ['Definition of Limit', 'L\'Hôpital\'s Rule', 'Continuity'],
                keyFormulas: ['lim(x→a) f(x) = L', 'lim(x→∞) (1 + 1/x)ˣ = e'],
                importantPoints: [
                  'Understand limit definition',
                  'Apply L\'Hôpital\'s rule',
                  'Check continuity conditions'
                ]
              },
              {
                id: 'differentiation',
                name: 'Differentiation',
                description: 'Derivatives and their applications',
                difficulty: 'Hard',
                estimatedTime: '5-6 days',
                concepts: ['Chain Rule', 'Product Rule', 'Quotient Rule', 'Implicit Differentiation'],
                keyFormulas: [
                  'd/dx[f(g(x))] = f\'(g(x))⋅g\'(x)',
                  'd/dx[uv] = u\'v + uv\'',
                  'd/dx[u/v] = (u\'v - uv\')/v²'
                ],
                importantPoints: [
                  'Master all differentiation rules',
                  'Practice implicit differentiation',
                  'Apply to real-world problems'
                ]
              },
              {
                id: 'integration',
                name: 'Integration',
                description: 'Indefinite and definite integrals',
                difficulty: 'Hard',
                estimatedTime: '6-7 days',
                concepts: ['Integration by Parts', 'Substitution', 'Partial Fractions'],
                keyFormulas: [
                  '∫u dv = uv - ∫v du',
                  '∫f(g(x))g\'(x)dx = ∫f(u)du',
                  '∫ᵃᵇ f(x)dx = F(b) - F(a)'
                ],
                importantPoints: [
                  'Master integration techniques',
                  'Apply fundamental theorem',
                  'Solve area problems'
                ]
              }
            ]
          },
          {
            id: 'probability',
            name: 'Probability',
            description: 'Probability theory and distributions',
            estimatedDuration: '3-4 weeks',
            totalTopics: 5,
            topics: [
              {
                id: 'basic-probability',
                name: 'Basic Probability',
                description: 'Fundamental concepts of probability',
                difficulty: 'Easy',
                estimatedTime: '3-4 days',
                concepts: ['Sample Space', 'Events', 'Conditional Probability'],
                keyFormulas: ['P(A) = n(A)/n(S)', 'P(A|B) = P(A∩B)/P(B)'],
                importantPoints: [
                  'Understand sample space',
                  'Calculate conditional probability',
                  'Apply Bayes\' theorem'
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];