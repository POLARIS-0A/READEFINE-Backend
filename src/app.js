import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import authRoutes from "./routes/auth.routes.js";
import chapterRoutes from "./routes/chapters.routes.js";
import examRoutes from "./routes/exam.routes.js";   // NEW

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use("/api/auth", authRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/exam", examRoutes);                    // NEW

app.use('/api', routes);

app.use(cors());
app.use(notFound);
app.use(errorHandler);

export default app;