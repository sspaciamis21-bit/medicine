import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial household data into Hostinger MySQL...');

  // 1. Create Household
  const household = await prisma.household.create({
    data: {
      name: 'Sharma Household',
      mealSettings: {
        create: {
          breakfastTime: '08:00 AM',
          lunchTime: '01:30 PM',
          dinnerTime: '08:30 PM',
          defaultBeforeOffset: 30,
          defaultAfterOffset: 15,
        },
      },
    },
  });

  console.log(`Created Household: ${household.name} (${household.id})`);

  // 2. Create Family Members
  const grandpa = await prisma.familyMember.create({
    data: {
      householdId: household.id,
      name: 'Grandpa (Ramesh)',
      relationship: 'Grandparent',
      avatar: '👴',
      color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      age: 72,
      notes: 'Hypertension and Type-2 Diabetes management',
    },
  });

  const father = await prisma.familyMember.create({
    data: {
      householdId: household.id,
      name: 'Father (Rajesh)',
      relationship: 'Father',
      avatar: '👨',
      color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      age: 48,
      notes: 'Blood sugar and cholesterol monitoring',
    },
  });

  const mother = await prisma.familyMember.create({
    data: {
      householdId: household.id,
      name: 'Mother (Sunita)',
      relationship: 'Mother',
      avatar: '👩',
      color: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
      age: 45,
      notes: 'Thyroid daily morning dose',
    },
  });

  const self = await prisma.familyMember.create({
    data: {
      householdId: household.id,
      name: 'Self (Aarav)',
      relationship: 'Self',
      avatar: '🧑',
      color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      age: 24,
      notes: 'Supplements & Vitamin D3',
    },
  });

  // 3. Create Pharmacy
  const apollo = await prisma.pharmacy.create({
    data: {
      householdId: household.id,
      name: 'Apollo 24/7 Pharmacy',
      contactPerson: 'Mr. Rakesh (Chemist)',
      phoneNumber: '+919876543210',
      whatsappNumber: '+919876543210',
      address: 'Shop 12, Central Market, Green Park',
      isDefault: true,
      notes: '24/7 home delivery available',
    },
  });

  const medplus = await prisma.pharmacy.create({
    data: {
      householdId: household.id,
      name: 'MedPlus Chemist & Druggist',
      contactPerson: 'Counter Support',
      phoneNumber: '+919812345678',
      whatsappNumber: '+919812345678',
      address: 'Near Metro Station Gate 2',
      isDefault: false,
    },
  });

  // 4. Create Medicines & Meal-Linked Schedules
  // Metformin (Father)
  const metformin = await prisma.medicine.create({
    data: {
      householdId: household.id,
      memberId: father.id,
      name: 'Metformin 500mg',
      brandName: 'Glycomet SR',
      formType: 'Tablet',
      strength: '500 mg',
      unit: 'Tablets',
      quantityPurchased: 30,
      currentQuantity: 6,
      lowStockThreshold: 10,
      expiryDate: '2027-04-15',
      doctorName: 'Dr. V. Sharma (Endocrinologist)',
      isInsulin: false,
      instructions: 'Take 30 mins before breakfast with water',
      schedules: {
        create: [
          {
            frequencyType: 'daily',
            mealRelation: 'Before Food',
            mealType: 'Breakfast',
            offsetMinutes: 30,
            doseAmount: 1,
            specificTime: '07:30 AM',
          },
        ],
      },
    },
  });

  // Lantus Insulin (Grandpa)
  const lantus = await prisma.medicine.create({
    data: {
      householdId: household.id,
      memberId: grandpa.id,
      name: 'Lantus Solostar Insulin',
      brandName: 'Sanofi',
      formType: 'Insulin',
      strength: '100 IU/ml',
      unit: 'Pens',
      quantityPurchased: 3,
      currentQuantity: 1,
      lowStockThreshold: 2,
      expiryDate: '2027-01-20',
      isInsulin: true,
      insulinType: 'Long-Acting (Glargine)',
      penOrVial: 'Pen',
      openedDate: '2026-08-05',
      doctorName: 'Dr. Mehta (Diabetologist)',
      insulinStorageNote: 'Store unopened pens in fridge (2°C–8°C). Keep active pen at room temperature (<30°C). Discard 28 days after opening.',
      instructions: 'Subcutaneous injection before dinner',
      schedules: {
        create: [
          {
            frequencyType: 'daily',
            mealRelation: 'Before Food',
            mealType: 'Dinner',
            offsetMinutes: 15,
            doseAmount: 14,
            doseUnit: 'Units',
            specificTime: '08:15 PM',
          },
        ],
      },
    },
  });

  // Thyronorm (Mother)
  await prisma.medicine.create({
    data: {
      householdId: household.id,
      memberId: mother.id,
      name: 'Thyronorm 75mcg',
      brandName: 'Abbott',
      formType: 'Tablet',
      strength: '75 mcg',
      unit: 'Tablets',
      quantityPurchased: 60,
      currentQuantity: 24,
      lowStockThreshold: 10,
      expiryDate: '2027-08-10',
      doctorName: 'Dr. Kapoor (Physician)',
      isInsulin: false,
      instructions: 'Take first thing in the morning with empty stomach',
      schedules: {
        create: [
          {
            frequencyType: 'daily',
            mealRelation: 'Empty Stomach',
            mealType: 'Breakfast',
            offsetMinutes: 30,
            doseAmount: 1,
            specificTime: '07:30 AM',
          },
        ],
      },
    },
  });

  // Telmisartan (Grandpa)
  await prisma.medicine.create({
    data: {
      householdId: household.id,
      memberId: grandpa.id,
      name: 'Telmisartan 40mg',
      brandName: 'Telma 40',
      formType: 'Tablet',
      strength: '40 mg',
      unit: 'Tablets',
      quantityPurchased: 30,
      currentQuantity: 18,
      lowStockThreshold: 8,
      expiryDate: '2026-11-30',
      doctorName: 'Dr. Mehta (Cardiologist)',
      isInsulin: false,
      instructions: 'Take immediately after lunch',
      schedules: {
        create: [
          {
            frequencyType: 'daily',
            mealRelation: 'After Food',
            mealType: 'Lunch',
            offsetMinutes: 0,
            doseAmount: 1,
            specificTime: '01:30 PM',
          },
        ],
      },
    },
  });

  // 5. Create Initial Purchases for Expense Tracking
  await prisma.purchase.create({
    data: {
      householdId: household.id,
      memberId: grandpa.id,
      medicineId: lantus.id,
      pharmacyId: apollo.id,
      medicineName: 'Lantus Solostar Insulin Pen (3x)',
      quantity: 3,
      unitPrice: 650,
      discount: 100,
      totalAmount: 1850,
      paymentMode: 'UPI',
      purchaseDate: '2026-08-10',
    },
  });

  await prisma.purchase.create({
    data: {
      householdId: household.id,
      memberId: father.id,
      medicineId: metformin.id,
      pharmacyId: apollo.id,
      medicineName: 'Glycomet SR 500mg (2 Strips)',
      quantity: 2,
      unitPrice: 150,
      discount: 20,
      totalAmount: 280,
      paymentMode: 'Cash',
      purchaseDate: '2026-08-18',
    },
  });

  console.log('✅ Database successfully seeded with full initial family records!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
