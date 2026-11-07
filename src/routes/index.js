import { Router } from 'express';
import healthRoutes from './health.routes.js';
import chapterRoutes from './chapter.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/chapters', chapterRoutes);
// TO DO: router.use('/tests', testRoutes);    
// TO DO: router.use('/progress', progressRoutes);  

export default router;
