import { z } from 'zod';

const sortOrderSchema = z.enum(['asc', 'desc']);

function parseInteger(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  if (!/^[+-]?\d+$/.test(normalized)) {
    return value;
  }

  return Number.parseInt(normalized, 10);
}

export function buildListQuerySchema({ sortByValues, defaultSortBy, defaultLimit = 10 }) {
  const sortBySchema = z.enum(sortByValues);

  return z.object({
    page: z.preprocess(parseInteger, z.number().int().min(1).default(1)),
    limit: z.preprocess(parseInteger, z.number().int().min(1).max(100).default(defaultLimit)),
    sortBy: sortBySchema.default(defaultSortBy),
    sortOrder: sortOrderSchema.default('desc'),
  });
}

export function getListSkip(page, limit) {
  return (page - 1) * limit;
}

export function buildListMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
