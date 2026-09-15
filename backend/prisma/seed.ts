import prisma from '../src/db/prisma.js';
import { calculateSubjectHash } from '../src/services/syncService.js';

async function main() {
  console.log('🌱 Seeding Ethiopian ESSLCE curriculum data...');

  // 1. Natural Science: Physics Grade 12
  const physics12 = await prisma.subject.upsert({
    where: { id: 'subj-phys-12' },
    create: {
      id: 'subj-phys-12',
      name: 'Physics',
      stream: 'NATURAL',
      gradeLevel: 12,
      icon: 'atom',
    },
    update: {
      name: 'Physics',
      stream: 'NATURAL',
      gradeLevel: 12,
      icon: 'atom',
    },
  });

  // Physics Grade 12 Units
  const physUnit1 = await prisma.unit.upsert({
    where: {
      subjectId_unitNumber: {
        subjectId: physics12.id,
        unitNumber: 1,
      },
    },
    create: {
      id: 'unit-phys12-1',
      subjectId: physics12.id,
      unitNumber: 1,
      title: 'Thermodynamics',
    },
    update: {
      title: 'Thermodynamics',
    },
  });

  // Short notes for Thermodynamics (with LaTeX formulas)
  await prisma.shortNote.upsert({
    where: { id: 'note-phys12-1-1' },
    create: {
      id: 'note-phys12-1-1',
      unitId: physUnit1.id,
      title: 'Laws of Thermodynamics & Work Done',
      isHighYield: true,
      orderIndex: 1,
      contentMarkdown: `# First Law of Thermodynamics

The **First Law of Thermodynamics** is an extension of the principle of conservation of energy:

$$\\Delta U = Q - W$$

Where:
* $\\Delta U$ is the change in internal energy of the system.
* $Q$ is the heat added to the system ($Q > 0$ when absorbed, $Q < 0$ when released).
* $W$ is the work done **by** the system ($W = P\\Delta V$ at constant pressure).

### Key Thermodynamic Processes
1. **Isochoric (Constant Volume):** $\\Delta V = 0 \\implies W = 0$, so $\\Delta U = Q$.
2. **Isobaric (Constant Pressure):** $W = P(V_2 - V_1)$.
3. **Isothermal (Constant Temperature):** For an ideal gas, $\\Delta U = 0 \\implies Q = W = nRT \\ln\\left(\\frac{V_2}{V_1}\\right)$.
4. **Adiabatic (No Heat Transfer):** $Q = 0 \\implies \\Delta U = -W$. The relation is $PV^\\gamma = \\text{constant}$.

> **ESSLCE High-Yield Tip:** When a gas expands adiabatically, work is done at the expense of its internal energy, resulting in a temperature drop!`,
    },
    update: {
      title: 'Laws of Thermodynamics & Work Done',
      isHighYield: true,
      orderIndex: 1,
    },
  });

  await prisma.shortNote.upsert({
    where: { id: 'note-phys12-1-2' },
    create: {
      id: 'note-phys12-1-2',
      unitId: physUnit1.id,
      title: 'Carnot Heat Engine & Efficiency',
      isHighYield: true,
      orderIndex: 2,
      contentMarkdown: `# Carnot Cycle & Efficiency

The maximum theoretical efficiency $\\eta$ of any heat engine operating between two temperatures $T_H$ (hot reservoir) and $T_C$ (cold reservoir) is given by:

$$\\eta_{\\text{Carnot}} = 1 - \\frac{T_C}{T_H} = \\frac{T_H - T_C}{T_H}$$

* Temperatures **must** be expressed in Kelvin ($K = ^\\circ C + 273.15$).
* No real engine can exceed the Carnot efficiency operating between the same two temperatures (Second Law of Thermodynamics).`,
    },
    update: {
      title: 'Carnot Heat Engine & Efficiency',
      isHighYield: true,
      orderIndex: 2,
    },
  });

  // Practice MCQs for Thermodynamics
  await prisma.question.upsert({
    where: { id: 'q-phys12-1-1' },
    create: {
      id: 'q-phys12-1-1',
      unitId: physUnit1.id,
      prompt: 'An ideal gas expands from an initial volume of 2.0 m³ to 5.0 m³ at a constant pressure of 1.0 × 10⁵ Pa. What is the work done by the gas?',
      optionsJson: [
        { id: 'opt-a', text: '1.5 × 10⁵ J' },
        { id: 'opt-b', text: '3.0 × 10⁵ J' },
        { id: 'opt-c', text: '5.0 × 10⁵ J' },
        { id: 'opt-d', text: '7.0 × 10⁵ J' },
      ],
      correctOptionId: 'opt-b',
      explanation: 'Work done at constant pressure is W = P * ΔV = (1.0 × 10⁵ Pa) * (5.0 - 2.0 m³) = 1.0 × 10⁵ * 3.0 = 3.0 × 10⁵ J.',
    },
    update: {},
  });

  await prisma.question.upsert({
    where: { id: 'q-phys12-1-2' },
    create: {
      id: 'q-phys12-1-2',
      unitId: physUnit1.id,
      prompt: 'A Carnot engine operates between a hot reservoir at 500 K and a cold reservoir at 300 K. What is the theoretical maximum thermal efficiency?',
      optionsJson: [
        { id: 'opt-a', text: '40%' },
        { id: 'opt-b', text: '60%' },
        { id: 'opt-c', text: '25%' },
        { id: 'opt-d', text: '75%' },
      ],
      correctOptionId: 'opt-a',
      explanation: 'Carnot efficiency η = 1 - (Tc / Th) = 1 - (300 / 500) = 1 - 0.60 = 0.40 = 40%.',
    },
    update: {},
  });

  // 2. Natural Science: Mathematics Grade 12
  const math12 = await prisma.subject.upsert({
    where: { id: 'subj-math-12' },
    create: {
      id: 'subj-math-12',
      name: 'Mathematics',
      stream: 'NATURAL',
      gradeLevel: 12,
      icon: 'calculator',
    },
    update: {
      name: 'Mathematics',
      stream: 'NATURAL',
      gradeLevel: 12,
      icon: 'calculator',
    },
  });

  const mathUnit1 = await prisma.unit.upsert({
    where: {
      subjectId_unitNumber: {
        subjectId: math12.id,
        unitNumber: 1,
      },
    },
    create: {
      id: 'unit-math12-1',
      subjectId: math12.id,
      unitNumber: 1,
      title: 'Sequences and Series',
    },
    update: {
      title: 'Sequences and Series',
    },
  });

  await prisma.shortNote.upsert({
    where: { id: 'note-math12-1-1' },
    create: {
      id: 'note-math12-1-1',
      unitId: mathUnit1.id,
      title: 'Arithmetic and Geometric Progressions',
      isHighYield: true,
      orderIndex: 1,
      contentMarkdown: `# Arithmetic and Geometric Progressions

### 1. Arithmetic Progression (AP)
* **General Term:** $a_n = a_1 + (n - 1)d$
* **Sum of first $n$ terms:**
$$S_n = \\frac{n}{2}[2a_1 + (n - 1)d] = \\frac{n}{2}(a_1 + a_n)$$

### 2. Geometric Progression (GP)
* **General Term:** $a_n = a_1 \\cdot r^{n-1}$
* **Sum of first $n$ terms:**
$$S_n = \\frac{a_1(1 - r^n)}{1 - r} \\quad (r \\neq 1)$$
* **Sum to infinity ($|r| < 1$):**
$$S_\\infty = \\frac{a_1}{1 - r}$$`,
    },
    update: {},
  });

  await prisma.question.upsert({
    where: { id: 'q-math12-1-1' },
    create: {
      id: 'q-math12-1-1',
      unitId: mathUnit1.id,
      prompt: 'If the sum of an infinite geometric series with first term a₁ = 6 is 18, what is the common ratio r?',
      optionsJson: [
        { id: 'opt-a', text: '1/3' },
        { id: 'opt-b', text: '2/3' },
        { id: 'opt-c', text: '1/2' },
        { id: 'opt-d', text: '3/4' },
      ],
      correctOptionId: 'opt-b',
      explanation: 'S_∞ = a₁ / (1 - r) => 18 = 6 / (1 - r) => 1 - r = 6 / 18 = 1/3 => r = 1 - 1/3 = 2/3.',
    },
    update: {},
  });

  // Calculate sync hashes
  for (const subj of [physics12, math12]) {
    const fullSubj = await prisma.subject.findUnique({
      where: { id: subj.id },
      include: {
        units: {
          include: { shortNotes: true, questions: true },
        },
      },
    });

    if (fullSubj) {
      const hash = calculateSubjectHash(fullSubj, fullSubj.units);
      await prisma.syncMetadata.upsert({
        where: { subjectId: subj.id },
        create: {
          subjectId: subj.id,
          contentHash: hash,
          version: 1,
        },
        update: {
          contentHash: hash,
        },
      });
    }
  }

  console.log('✅ Seed completed successfully with realistic ESSLCE curriculum data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
