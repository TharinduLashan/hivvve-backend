import { Router } from 'express';
import { testDB } from '../controllers/test.controller';

const router = Router();

router.get('/db-test', testDB);

export default router;