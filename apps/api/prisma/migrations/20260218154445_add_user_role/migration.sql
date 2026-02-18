-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'admin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'student',
ADD COLUMN     "trial_ends_at" TIMESTAMPTZ;
