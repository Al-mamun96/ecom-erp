-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "steadfastApiKey" TEXT,
ADD COLUMN     "steadfastSecretKey" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "courierStatus" TEXT,
ADD COLUMN     "courierTracking" TEXT;
