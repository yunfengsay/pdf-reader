import { Annotation } from '@/models/Annotation';

export class AnnotationStorageService {
  private static readonly ANNOTATIONS_KEY = 'pdf-reader-annotations';

  static async saveAnnotations(bookKey: string, annotations: Annotation[]): Promise<void> {
    const allAnnotations = await this.getAllAnnotations();
    allAnnotations[bookKey] = annotations;
    localStorage.setItem(this.ANNOTATIONS_KEY, JSON.stringify(allAnnotations));
  }

  static async getAnnotations(bookKey: string): Promise<Annotation[]> {
    const allAnnotations = await this.getAllAnnotations();
    return allAnnotations[bookKey] || [];
  }

  static async addAnnotation(bookKey: string, annotation: Annotation): Promise<void> {
    const annotations = await this.getAnnotations(bookKey);
    annotations.push(annotation);
    await this.saveAnnotations(bookKey, annotations);
  }

  static async updateAnnotation(bookKey: string, annotationId: string, updates: Partial<Annotation>): Promise<void> {
    const annotations = await this.getAnnotations(bookKey);
    const index = annotations.findIndex(a => a.id === annotationId);
    if (index >= 0) {
      annotations[index] = { ...annotations[index], ...updates };
      await this.saveAnnotations(bookKey, annotations);
    }
  }

  static async deleteAnnotation(bookKey: string, annotationId: string): Promise<void> {
    const annotations = await this.getAnnotations(bookKey);
    const filtered = annotations.filter(a => a.id !== annotationId);
    await this.saveAnnotations(bookKey, filtered);
  }

  private static async getAllAnnotations(): Promise<Record<string, Annotation[]>> {
    try {
      const stored = localStorage.getItem(this.ANNOTATIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading annotations:', error);
      return {};
    }
  }
}