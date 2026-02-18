import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Create teacher user
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      passwordHash,
      name: 'Demo Teacher',
      timezone: 'Asia/Seoul',
      locale: 'ko',
    },
  });
  console.log('✔ Teacher:', teacher.email);

  // 2. Create student user
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      passwordHash,
      name: 'Demo Student',
      timezone: 'Asia/Seoul',
      locale: 'ko',
    },
  });
  console.log('✔ Student:', student.email);

  // 3. Create organization
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'seed-org-0000-0000-0000-000000000001',
      name: 'Demo Academy',
      ownerUserId: teacher.id,
      defaultTimezone: 'Asia/Seoul',
    },
  });
  console.log('✔ Organization:', org.name);

  // 4. Create studio
  const studio = await prisma.studio.upsert({
    where: { id: 'seed-std-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'seed-std-0000-0000-0000-000000000001',
      organizationId: org.id,
      name: 'Main Studio',
      createdBy: teacher.id,
    },
  });
  console.log('✔ Studio:', studio.name);

  // 5. Create classroom
  const classroom = await prisma.classroom.upsert({
    where: { id: 'seed-cls-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'seed-cls-0000-0000-0000-000000000001',
      studioId: studio.id,
      name: 'English 101',
      description: 'Beginner English class',
      timezone: 'Asia/Seoul',
      createdBy: teacher.id,
    },
  });
  console.log('✔ Classroom:', classroom.name);

  // 6. Add teacher membership
  await prisma.classroomMembership.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: teacher.id } },
    update: {},
    create: {
      classroomId: classroom.id,
      userId: teacher.id,
      roleInClassroom: 'teacher',
      status: 'active',
    },
  });

  // 7. Add student membership
  await prisma.classroomMembership.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: student.id } },
    update: {},
    create: {
      classroomId: classroom.id,
      userId: student.id,
      roleInClassroom: 'student',
      status: 'active',
    },
  });
  console.log('✔ Memberships created');

  // 8. Create invite code
  const code = randomBytes(4).toString('hex').toUpperCase();
  const invite = await prisma.inviteCode.create({
    data: {
      classroomId: classroom.id,
      code,
      type: 'student',
      createdBy: teacher.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    },
  });
  console.log('✔ Invite code:', invite.code);

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('Teacher   : teacher@example.com / Password123!');
  console.log('Student   : student@example.com / Password123!');
  console.log('Classroom : English 101  (id:', classroom.id, ')');
  console.log('Invite    :', invite.code);
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
