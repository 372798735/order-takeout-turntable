-- AlterTable: add phone, nickname, avatar, gender to User
ALTER TABLE `User`
  ADD COLUMN `phone` VARCHAR(191) NULL,
  ADD COLUMN `nickname` VARCHAR(191) NULL,
  ADD COLUMN `avatar` VARCHAR(512) NOT NULL DEFAULT 'https://cdn.nlark.com/yuque/0/2025/png/2488285/1755621011638-55f138ac-e500-45aa-8618-193902552145.png?x-oss-process=image%2Fformat%2Cwebp',
  ADD COLUMN `gender` ENUM('UNKNOWN','MALE','FEMALE') NOT NULL DEFAULT 'UNKNOWN';

-- Unique index for phone
CREATE UNIQUE INDEX `User_phone_key` ON `User`(`phone`);

