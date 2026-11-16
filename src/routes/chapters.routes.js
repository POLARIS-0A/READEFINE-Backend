import { Router } from 'express';
import { supabase } from '../config/supabase.js';   

const router = Router();

router.get('/', async (req, res) => {   
    const { data, error } = await supabase
        .from('chapters')
        .select('id, slug, title, summary, order_index')
        .eq('is_published', true)    
        .order('order_index');

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
}); 
router.get('/:slug', async (req, res) => {
  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

  const { data: sections, error: sectionsError } = await supabase
    .from('chapter_sections')
    .select('*')
    .eq('chapter_id', chapter.id)
    .order('order_index');

  if (sectionsError) return res.status(500).json({ error: sectionsError.message });
  res.json({ ...chapter, sections });
});

export default router;  