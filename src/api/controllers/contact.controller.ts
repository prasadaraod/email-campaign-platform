import { Request, Response, NextFunction } from 'express';
import { contactService } from '../../services/contact.service';
import { listContactsSchema } from '../validators/contact.schema';

export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contact = await contactService.create(req.user!.tenantId, req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

export const listContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = listContactsSchema.parse(req.query);
    const result = await contactService.list(req.user!.tenantId, query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contact = await contactService.getById(
      req.user!.tenantId,
      req.params['id'] as string
    );
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

export const updateContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contact = await contactService.update(
      req.user!.tenantId,
      req.params['id'] as string,
      req.body
    );
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

export const unsubscribeContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contact = await contactService.unsubscribe(
      req.user!.tenantId,
      req.params['id'] as string
    );
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

export const importContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'contacts array is required',
      });
    }
    const result = await contactService.importBulk(
      req.user!.tenantId,
      contacts
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};