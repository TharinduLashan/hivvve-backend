import { Router } from 'express';
import { testApi, testDB } from '../controllers/test.controller';

const router = Router();

router.get('/api-test', testApi);

router.get('/db-test', testDB);

export default router;