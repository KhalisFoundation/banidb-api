import { Controller, Get, Param } from '@nestjs/common';
import { ApiError } from '../common/api-error';
import { Limit100 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';

const WORD_WITH_DEFINITION = `SELECT w.ID AS id, w.Word AS word, w.WordUni AS wordUni,
                  d.DefGurmukhi AS definition, d.DefGurmukhiUni AS definitionUni
                FROM MahanKoshWords w
                LEFT JOIN MahanKoshDefinitions d ON w.Definition = d.ID`;

// Mahan Kosh, the Gurbani dictionary. Words match in ASCII Gurmukhi or Unicode.
@Controller('kosh')
export class KoshController {
  constructor(private readonly db: DatabaseService) {}

  // Every word starting with a letter.
  @Get(':Letter')
  @Limit100()
  letter(@Param('Letter') letter: string) {
    if (letter.length !== 1) {
      throw new ApiError(
        'You must supply a single character to see the index for that letter.',
        422,
      );
    }
    return this.db.query(
      `SELECT ID AS id, Word AS word, WordUni AS wordUni
                FROM MahanKoshWords
                WHERE FirstLetter=? OR FirstLetterUni=?
                ORDER BY ID`,
      [letter, letter],
    );
  }

  @Get('word/:Word')
  @Limit100()
  word(@Param('Word') word: string) {
    return this.db.query(
      `${WORD_WITH_DEFINITION}
                WHERE w.Word LIKE ? OR w.WordUni LIKE BINARY ? LIMIT 1`,
      [word, word],
    );
  }

  // Words or definitions containing the text.
  @Get('search/:query')
  @Limit100()
  search(@Param('query') query: string) {
    const like = `%${query}%`;
    return this.db.query(
      `${WORD_WITH_DEFINITION}
                WHERE
                  w.Word LIKE ? OR
                  w.WordUni LIKE BINARY ? OR
                  d.DefGurmukhi LIKE ? OR
                  d.DefGurmukhiUni LIKE BINARY ?
                ORDER BY w.ID`,
      [like, like, like, like],
    );
  }
}
