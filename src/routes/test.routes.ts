import { Router } from 'express';
import { testDB } from '../controllers/test.controller';

const router = Router();

router.get('/api-test', testDB);

router.get('/db-test', testDB);

export default router;