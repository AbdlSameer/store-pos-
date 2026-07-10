-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'voided';

-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "approved_by_id" UUID,
ADD COLUMN     "void_reason" TEXT,
ADD COLUMN     "voided_at" TIMESTAMPTZ,
ADD COLUMN     "voided_by_id" UUID;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_voided_by_id_fkey" FOREIGN KEY ("voided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
