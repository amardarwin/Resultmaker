// FILE: components/StudentForm.tsx

import React, { useState } from 'react';

// 🔥 SAFE MODE: Accept Anything
interface StudentFormProps {
  currentUser?: any;
  onBack?: any; // App.tsx se aane wala Back button handle karega
  [key: string]: any; // Baki sab allow
}

const StudentForm: React.FC<StudentFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    rollNo: '',
    class: '10th',
    dob: '',
    category: 'General'
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    // Save to LocalStorage
    const existingData = JSON.parse(localStorage.getItem('student_data') || '[]');
    const newStudent = { ...formData, id: Date.now() };
    localStorage.setItem('student_data', JSON.stringify([...existingData, newStudent]));
    
    alert('✅ Student Enrolled Successfully!');
    
    // Clear Form
    setFormData({
        name: '', fatherName: '', rollNo: '', class: '10th', dob: '', category: 'General'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border-t-4 border-green-600">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🎓 New Student Enrollment</h2>
          <button 
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-800 underline"
          >
            ← Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Roll No */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Roll No</label>
            <input name="rollNo" value={formData.rollNo} onChange={handleChange} required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" placeholder="e.g. 101" />
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Class</label>
            <select name="class" value={formData.class} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500">
              {['6th', '7th', '8th', '9th', '10th'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Student Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" placeholder="Full Name" />
          </div>

          {/* Father Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Father's Name</label>
            <input name="fatherName" value={formData.fatherName} onChange={handleChange} required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" placeholder="Father Name" />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 mt-4">
            <button type="submit" 
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow-lg">
              Save Student Record
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StudentForm;
