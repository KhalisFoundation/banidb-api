import { Controller, Get, Param } from '@nestjs/common';
import { int } from '../common/input';
import { Limit100, Limit250 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';

// Rehat maryadas (codes of conduct) and their chapters.
@Controller('rehats')
export class RehatsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  @Limit100()
  async all() {
    const maryadas = await this.db.query(
      'SELECT id as rehatID, maryada_name as rehatName, alphabet FROM maryadas',
    );
    return { count: maryadas.length, maryadas };
  }

  // Declared before :RehatID so that /rehats/search/… isn't read as a rehat.
  @Get('search/:string')
  @Limit250()
  async search(@Param('string') text: string) {
    const rows = await this.db.query(
      'SELECT c.id as chapterID, c.chapter_name as chapterName, c.chapter_content as chapterContent, c.maryada_id as rehatID, m.maryada_name as rehatName FROM maryada_chapters c JOIN maryadas m ON c.maryada_id = m.id WHERE chapter_content LIKE ?',
      [`%${text}%`],
    );
    return { count: rows.length, rows };
  }

  // The chapter list, without their content.
  @Get(':RehatID')
  @Limit100()
  async chapterList(@Param('RehatID') rehatId: string) {
    const id = int(rehatId);
    // Not a number (e.g. /rehats/search): no chapters, as for a rehat that doesn't exist.
    const chapters = Number.isNaN(id)
      ? []
      : await this.db.query(
          'SELECT id as chapterID, chapter_name as chapterName, alphabet FROM maryada_chapters WHERE maryada_id = ?',
          [id],
        );
    return { count: chapters.length, rehatID: id, chapters };
  }

  @Get(':RehatID/chapters')
  @Limit100()
  chapters(@Param('RehatID') rehatId: string) {
    return this.chaptersOf(rehatId, undefined);
  }

  // One chapter (a ChapterID above 0), or all of them, with their content.
  @Get(':RehatID/chapters/:ChapterID')
  @Limit100()
  async chaptersOf(
    @Param('RehatID') rehatId: string,
    @Param('ChapterID') chapterId: string | undefined,
  ) {
    const id = int(rehatId);
    const params: unknown[] = [id];
    let where = '';
    if (chapterId !== undefined && int(chapterId) > 0) {
      where = 'AND id = ?';
      params.push(int(chapterId));
    }
    const chapters = Number.isNaN(id)
      ? []
      : await this.db.query(
          `SELECT id as chapterID, chapter_name as chapterName, chapter_content as chapterContent, alphabet FROM maryada_chapters WHERE maryada_id = ? ${where}`,
          params,
        );
    return { count: chapters.length, rehatID: id, chapters };
  }
}
