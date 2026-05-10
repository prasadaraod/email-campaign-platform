import { Request, Response, NextFunction } from 'express';
import { campaignService } from '../../services/campaign.service';

export const createCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaign = await campaignService.create(
      req.user!.tenantId,
      req.body
    );
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

export const listCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaigns = await campaignService.list(req.user!.tenantId);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
};

export const getCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaign = await campaignService.getById(
      req.user!.tenantId,
      req.params['id'] as string
    );
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

export const updateCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaign = await campaignService.update(
      req.user!.tenantId,
      req.params['id'] as string,
      req.body
    );
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

export const sendCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await campaignService.send(
      req.user!.tenantId,
      req.params['id'] as string,
      req.body
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getCampaignStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await campaignService.getStats(
      req.user!.tenantId,
      req.params['id'] as string
    );
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};