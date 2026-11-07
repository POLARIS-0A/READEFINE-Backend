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

export default router;  