
import { Student, StudentMarks, ClassLevel } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';

export const parseCSV = async (file: File, classLevel: ClassLevel): Promise<Student[]> => {
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

          const studentMarks: any = {};
          
          // Basic mapping of Name and Roll No
          const rollNo = values[headers.indexOf('roll no')] || values[0];
          const name = values[headers.indexOf('name')] || values[1];

          // Map marks based on subject labels
          subjects.forEach(sub => {
            const headerIdx = headers.indexOf(sub.label.toLowerCase());
            if (headerIdx !== -1) {
              const val = parseInt(values[headerIdx]);
              studentMarks[sub.key] = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
            } else {
              studentMarks[sub.key] = 0;
            }
          });

          importedStudents.push({
            id: `imp-${Date.now()}-${i}`,
            rollNo,
            name,
            classLevel,
            marks: studentMarks as StudentMarks
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
