export interface Note {
  key: string;
  bookKey: string;
  date: {
    year: number;
    month: number;
    day: number;
  };
  page: number;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  range: string;
  notes: string;
  percentage: string;
  color: string;
  tags: string[];
}

export class NoteModel implements Note {
  key: string;
  bookKey: string;
  date: { year: number; month: number; day: number };
  page: number;
  text: string;
  position: { x: number; y: number; width: number; height: number };
  range: string;
  notes: string;
  percentage: string;
  color: string;
  tags: string[];

  constructor(
    bookKey: string,
    page: number,
    text: string,
    position: { x: number; y: number; width: number; height: number },
    range: string,
    notes: string,
    percentage: string,
    color: string,
    tags: string[]
  ) {
    this.key = new Date().getTime().toString();
    this.bookKey = bookKey;
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    };
    this.page = page;
    this.text = text;
    this.position = position;
    this.range = range;
    this.notes = notes || "";
    this.percentage = percentage;
    this.color = color;
    this.tags = tags;
  }
}