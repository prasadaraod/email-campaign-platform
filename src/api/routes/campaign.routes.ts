import { Router } from 'express';
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  sendCampaign,
  getCampaignStats,
} from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createCampaignSchema,
  updateCampaignSchema,
  sendCampaignSchema,
} from '../validators/campaign.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCampaignSchema), createCampaign);
router.get('/', listCampaigns);
router.get('/:id', getCampaign);
router.put('/:id', validate(updateCampaignSchema), updateCampaign);
router.post('/:id/send', validate(sendCampaignSchema), sendCampaign);
router.get('/:id/stats', getCampaignStats);

export default router;