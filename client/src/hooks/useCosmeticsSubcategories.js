import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Shared hook to fetch distinct subCategory values for Cosmetics products.
 * Consumed by both POS New Sale product search and the Inventory screen filters.
 */
export default function useCosmeticsSubcategories() {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSubcategories = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products/subcategories', {
          params: { category: 'Cosmetics' }
        });
        if (isMounted && res.data.success) {
          setSubcategories(res.data.subcategories || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load cosmetics subcategories', err);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSubcategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return { subcategories, loading, error };
}
