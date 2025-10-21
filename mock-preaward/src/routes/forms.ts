import { Router, Request, Response } from 'express';
import { InMemoryStore, FormData } from '../storage/InMemoryStore';
import { validateFormData, validateUrlPath } from '../middleware/validation';

const router = Router();
const store = new InMemoryStore();

// POST /forms - Create or update a form
router.post('/', validateFormData, (req: Request, res: Response) => {
  try {
    const formData: FormData = req.body;
    const result = store.createOrUpdateForm(formData);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error creating/updating form:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create or update form'
    });
  }
});

// GET /forms - Get all forms
router.get('/', (req: Request, res: Response) => {
  try {
    const forms = store.getAllForms();
    res.status(200).json(forms);
  } catch (error) {
    console.error('Error retrieving forms:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve forms'
    });
  }
});

// GET /forms/:url_path/draft - Get form draft by URL path
router.get('/:url_path/draft', validateUrlPath, (req: Request, res: Response) => {
  try {
    const { url_path } = req.params;
    const form = store.getFormDraft(url_path);

    if (!form) {
      return res.status(404).json({
        error: 'Not found',
        message: `Form with URL path '${url_path}' not found`
      });
    }

    res.status(200).json(form);
  } catch (error) {
    console.error('Error retrieving form draft:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve form draft'
    });
  }
});

export default router;