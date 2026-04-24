import express from 'express';
import cors from 'cors';
import testRoutes from './routes/test.routes'; 
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Running');
});

app.use('/api', testRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/profile', profileRoutes);

// app.use('/api/users', authMiddleware, userRoutes); // protected

export default app;