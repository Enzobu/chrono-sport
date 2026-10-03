CREATE TABLE `WorkoutHistory` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `sessionId` INTEGER NULL,
  `sessionName` VARCHAR(191) NOT NULL,
  `durationSeconds` INTEGER NOT NULL,
  `exercisesCompleted` INTEGER NOT NULL DEFAULT 0,
  `setsCompleted` INTEGER NOT NULL DEFAULT 0,
  `finishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `WorkoutHistory_userId_finishedAt_idx`(`userId`, `finishedAt`),
  INDEX `WorkoutHistory_sessionId_idx`(`sessionId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `WorkoutHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WorkoutHistory_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `WorkoutSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
