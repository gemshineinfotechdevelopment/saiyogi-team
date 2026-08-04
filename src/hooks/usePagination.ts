import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect } from "react";

export const usePagination = (totalItems: number, itemsPerPage: number = 20) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get("page") || "1", 10);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const setPage = useCallback((newPage: number) => {
    if (newPage < 1 || (totalPages > 0 && newPage > totalPages)) return;
    
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("page", newPage.toString());
      return next;
    }, { replace: true });

    // Feature 2: Scroll position preferred
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams, totalPages]);

  // Edge Case: If page becomes empty after delete -> go to previous page
  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    page,
    totalPages,
    setPage,
    startIndex,
    endIndex,
  };
};
