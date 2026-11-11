import { Router } from 'express';
import healthRoutes from './health.routes.js';
import chapterRoutes from './chapter.routes.js';
import authRoutes from './auth.routes.js';
import progressRoutes from './progress.routes.js';
import testRoutes from './tests.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/chapters', chapterRoutes);
router.use('/auth', authRoutes);
router.use('/progress', progressRoutes);
router.use('/tests', testRoutes);

export default router;