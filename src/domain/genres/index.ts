/**
 * @module domain/genres
 *
 * Barrel export for the Dark Music genre taxonomy domain module.
 */

export type { GenreRoot, SubGenre, GenreTag } from './taxonomy'
export {
  GENRE_TAXONOMY,
  isValidGenreTag,
  getGenresByRoot,
  getAllGenres,
  validateBandGenres,
} from './taxonomy'
