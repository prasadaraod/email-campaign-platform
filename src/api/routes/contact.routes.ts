import { Router } from 'express';
import {
  createContact,
  listContacts,
  getContact,
  updateContact,
  unsubscribeContact,
  importContacts,
} from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createContactSchema,
  updateContactSchema,
} from '../validators/contact.schema';

const router = Router();

// All routes are protected
router.use(authenticate);

router.post('/', validate(createContactSchema), createContact);
router.get('/', listContacts);
router.post('/import', importContacts);
router.get('/:id', getContact);
router.put('/:id', validate(updateContactSchema), updateContact);
router.delete('/:id', unsubscribeContact);

export default router;