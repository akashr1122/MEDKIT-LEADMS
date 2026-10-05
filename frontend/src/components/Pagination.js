import React from 'react';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from 'react-icons/hi';

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'items',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate smart page pills
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return (
    <div className="pagination-container">
      {/* Left info: item range count */}
      <div className="pagination-info">
        <span>Showing </span>
        <strong className="pagination-num">{startItem}</strong>
        <span> to </span>
        <strong className="pagination-num">{endItem}</strong>
        <span> of </span>
        <strong className="pagination-num">{totalItems}</strong>
        <span> {itemLabel}</span>
      </div>

      {/* Right controls: page size selector & pagination navigation buttons */}
      <div className="pagination-controls">
        {onPageSizeChange && (
          <div className="pagination-size-selector">
            <span className="pagination-size-label">Rows per page:</span>
            <select
              className="pagination-select"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pagination-nav">
          {/* Jump to First Page */}
          <button
            type="button"
            className="pagination-btn pagination-btn-nav"
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1 || totalItems === 0}
            title="First Page"
            aria-label="First Page"
          >
            <HiOutlineChevronDoubleLeft />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            className="pagination-btn pagination-btn-nav"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1 || totalItems === 0}
            title="Previous Page"
            aria-label="Previous Page"
          >
            <HiOutlineChevronLeft />
          </button>

          {/* Numbered Page Buttons */}
          <div className="pagination-pages">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                    •••
                  </span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  className={`pagination-btn pagination-btn-num ${isActive ? 'active' : ''}`}
                  onClick={() => handlePageClick(p)}
                  aria-label={`Page ${p}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            className="pagination-btn pagination-btn-nav"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages || totalItems === 0}
            title="Next Page"
            aria-label="Next Page"
          >
            <HiOutlineChevronRight />
          </button>

          {/* Jump to Last Page */}
          <button
            type="button"
            className="pagination-btn pagination-btn-nav"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages || totalItems === 0}
            title="Last Page"
            aria-label="Last Page"
          >
            <HiOutlineChevronDoubleRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
