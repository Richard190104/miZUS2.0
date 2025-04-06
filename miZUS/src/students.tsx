import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase clientasda
const supabase = createClient('https://zpikwrtdtjglxbhbaecy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwaWt3cnRkdGpnbHhiaGJhZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MDQxODUsImV4cCI6MjA1MDE4MDE4NX0.MzFoRqOn_393c3yMM3D269vAgBKaMx5ZHurD-ggfLws');

interface Student {
    id: number;
    name: string;
    day: string;
    time: string;
    duration: string;
}

async function loadPupils(): Promise<Student[]> {
    try {
        const { data, error } = await supabase.from('Pupils').select('*');
        if (error) {
            throw new Error(error.message);
        }
        return data as Student[];
    } catch (error) {
        console.error("Error loading Pupils:", error);
        return [];
    }
}

async function addStudent(newStudent: { name: string; day: string; time: string; duration: string }) {
    try {
        const { error } = await supabase.from('Pupils').insert([newStudent]);
        if (error) {
            throw new Error(error.message);
        }
        console.log(`Student ${newStudent.name} added.`);
    } catch (error) {
        console.error('Error adding student:', error);
    }
}

async function removeStudent(id: number) {
    try {
        const { error } = await supabase.from('Pupils').delete().eq('id', id);
        if (error) {
            throw new Error(error.message);
        }
        console.log(`Student with id ${id} removed.`);
    } catch (error) {
        console.error('Error removing student:', error);
    }
}

export const PupilsPage: React.FC = () => {
    const [Pupils, setPupils] = useState<Student[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', day: '', time: '', duration: '' });

    useEffect(() => {
        loadPupils().then((Pupils) => {
            setPupils(Pupils);
        });
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addStudent(newStudent);
        setPupils(await loadPupils());
        setShowForm(false);
        setNewStudent({ name: '', day: '', time: '', duration: '' });
    };

    const handleRemoveStudent = async (id: number) => {
        await removeStudent(id);
        setPupils(await loadPupils());
    };

    return (
        <div style={{ maxWidth: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '10px', flexDirection: 'column' }}>
            <h2>Moji žiaci</h2>
            <button style={{width: '80%'}} onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Zrušiť' : 'Pridať Žiaka'}
            </button>
            {showForm && (
                <form onSubmit={handleFormSubmit} style={{ marginTop: '20px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', width: '80%' }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                        <label style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                            Meno a priezvisko:
                            <input
                                type="text"
                                value={newStudent.name}
                                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                required
                            />
                        </label>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                        <label style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                            Deň:
                            <input
                                type="text"
                                value={newStudent.day}
                                onChange={(e) => setNewStudent({ ...newStudent, day: e.target.value })}
                                required
                            />
                        </label>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                        <label style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                            Čas:
                            <input
                                type="time"
                                value={newStudent.time}
                                onChange={(e) => setNewStudent({ ...newStudent, time: e.target.value })}
                                required
                            />
                        </label>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                        <label style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%'}}>
                            Trvanie:
                            <select
                                value={newStudent.duration}
                                onChange={(e) => setNewStudent({ ...newStudent, duration: e.target.value })}
                                required
                            >
                                <option value="" disabled>Vyberte trvanie</option>
                                <option value="30 min">30 min</option>
                                <option value="45 min">45 min</option>
                                <option value="60 min">60 min</option>
                                <option value="90 min">90 min</option>
                            </select>
                        </label>
                    </div>
                    <button type="submit">Pridať</button>
                </form>
            )}
           <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px' }}>Meno</th>
                        <th style={{ padding: '8px' }}>Deň</th>
                        <th style={{ padding: '8px' }}>Čas</th>
                        <th style={{ padding: '8px' }}>Trvanie</th>
                        <th style={{ padding: '8px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {Pupils.map((student) => (
                        <tr key={student.id}>
                            <td style={{ padding: '8px' }}>{student.name}</td>
                            <td style={{ padding: '8px' }}>{student.day}</td>
                            <td style={{ padding: '8px' }}>{student.time}</td>
                            <td style={{ padding: '8px' }}>{student.duration}</td>
                            <td style={{ padding: '8px' }}>
                                <button style={{ color: 'red', marginTop: 0, background: 'none' }} onClick={() => handleRemoveStudent(student.id)}>X</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};

export default PupilsPage;
