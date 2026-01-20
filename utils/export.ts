
import { CalculatedResult, ClassLevel } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';

export const exportToCSV = (results: CalculatedResult[], classLevel: ClassLevel) => {
  if (results.length === 0) {
    alert('No data to export');
    return;
  }

  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);
  
  // Define headers
  const headers = [
    'Roll No',
    'Name',
    ...subjects.map(s => s.label),
    'Total',
    'Percentage',
    'Rank'
  ];

  // Map rows
  const rows = results.map(res => [
    res.rollNo,
    `"${res.name.replace(/"/g, '""')}"`, // Escape quotes and wrap in quotes
    ...subjects.map(s => res.marks[s.key] ?? 0),
    res.total,
    `${res.percentage}%`,
    res.rank
  ]);

  // Combine into CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Class_${classLevel}_Results_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
