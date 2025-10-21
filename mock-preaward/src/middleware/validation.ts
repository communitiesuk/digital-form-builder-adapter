import { Request, Response, NextFunction } from 'express';
import { FormData } from '../storage/InMemoryStore';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateFormData(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationError[] = [];
  const body = req.body as Partial<FormData>;

  // Validate display_name
  if (!body.display_name || typeof body.display_name !== 'string' || body.display_name.trim() === '') {
    errors.push({
      field: 'display_name',
      message: 'Display name is required'
    });
  }

  // Validate url_path
  if (!body.url_path || typeof body.url_path !== 'string' || body.url_path.trim() === '') {
    errors.push({
      field: 'url_path',
      message: 'URL path is required'
    });
  } else if (!/^[a-zA-Z0-9_-]+$/.test(body.url_path)) {
    errors.push({
      field: 'url_path',
      message: 'URL path should only contain letters, numbers, hyphens and underscores'
    });
  }

  // Validate form_json
  if (!body.form_json || typeof body.form_json !== 'object') {
    errors.push({
      field: 'form_json',
      message: 'Form JSON is required'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
    return;
  }

  next();
}

export function validateUrlPath(req: Request, res: Response, next: NextFunction): void {
  const { url_path } = req.params;

  if (!url_path || typeof url_path !== 'string' || url_path.trim() === '') {
    res.status(400).json({
      error: 'URL path parameter is required'
    });
    return;
  }

  next();
}