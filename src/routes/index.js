import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
// TODO: router.use('/chapters', chapterRoutes);   // learning page
// TODO: router.use('/tests', testRoutes);         // testing page
// TODO: router.use('/progress', progressRoutes);  // user progression

export default router;
