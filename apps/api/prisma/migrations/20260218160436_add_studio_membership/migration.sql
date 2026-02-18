-- CreateTable
CREATE TABLE "studio_memberships" (
    "id" TEXT NOT NULL,
    "studio_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_invite_codes" (
    "id" TEXT NOT NULL,
    "studio_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studio_memberships_studio_id_idx" ON "studio_memberships"("studio_id");

-- CreateIndex
CREATE INDEX "studio_memberships_user_id_idx" ON "studio_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "studio_memberships_studio_id_user_id_key" ON "studio_memberships"("studio_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "studio_invite_codes_code_key" ON "studio_invite_codes"("code");

-- CreateIndex
CREATE INDEX "studio_invite_codes_code_idx" ON "studio_invite_codes"("code");

-- AddForeignKey
ALTER TABLE "studio_memberships" ADD CONSTRAINT "studio_memberships_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_memberships" ADD CONSTRAINT "studio_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_invite_codes" ADD CONSTRAINT "studio_invite_codes_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_invite_codes" ADD CONSTRAINT "studio_invite_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
