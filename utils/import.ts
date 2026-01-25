import { Student, StudentMarks, ClassLevel, ExamType } from '../types';
import { GET_SUBJECTS_FOR_CLASS, getMarkKey } from '../constants';

export const parseCSV = async (file: File, classLevel: ClassLevel, examType: ExamType): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error('File is empty or missing data');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);
        
        const importedStudents: Student[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length < 2) continue;

          const studentMarks: Record<string, number> = {};
          
          const rollNo = values[headers.indexOf('roll no')] || values[0];
          const name = values[headers.indexOf('name')] || values[1];

          subjects.forEach(sub => {
            const headerIdx = headers.indexOf(sub.label.toLowerCase());
            const mKey = getMarkKey(examType, sub.key);
            if (headerIdx !== -1) {
              const val = parseInt(values[headerIdx]);
              studentMarks[mKey] = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
            } else {
              studentMarks[mKey] = 0;
            }
          });

          importedStudents.push({
            id: `imp-${Date.now()}-${i}`,
            rollNo,
            name,
            classLevel,
            marks: studentMarks
          });
        }

        resolve(importedStudents);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
