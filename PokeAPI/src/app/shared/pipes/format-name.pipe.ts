import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatName',
  standalone: true,
})
export class FormatNamePipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) {
      return '';
    }
    // Substitui hífens por espaços e capitaliza cada palavra
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
