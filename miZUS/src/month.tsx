import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver'; 



const supabase = createClient(
    'https://zpikwrtdtjglxbhbaecy.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwaWt3cnRkdGpnbHhiaGJhZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MDQxODUsImV4cCI6MjA1MDE4MDE4NX0.MzFoRqOn_393c3yMM3D269vAgBKaMx5ZHurD-ggfLws'
);

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

interface Lesson {
    id: number;
    created_at: string;
    month: string;
    day: string;
    time: string;
    person: string;
    duration: string;
    substitute?: string; // Optional property for substitute
}

interface Student {
    id: number;
    name: string;
    day: string;
    time: string;
    duration: string;
}

const Calendar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [pupils, setPupils] = useState<Student[]>([]);
    const [newLesson, setNewLesson] = useState({
        month: '',
        day: '',
        time: '',
        person: '',
        duration: '',
        substitute: ''
    });

    const monthNumber = location.state?.monthNumber;

    useEffect(() => {
        loadPupils().then((Pupils) => {
            setPupils(Pupils);
        });
    }, [])

    useEffect(() => {
        const fetchLessons = async () => {
            if (!monthNumber) return;

            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('month', monthNumber.toString());

            if (error) {
                console.error("Error fetching lessons:", error.message);
                return;
            }

            setLessons(data || []);
        };

        fetchLessons();
    }, [monthNumber]);

    const removeLesson = async (id: number) => {
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error removing lesson:", error.message);
            return;
        }

        setLessons((prevLessons) => prevLessons.filter((lesson) => lesson.id !== id));
    };

    const addLesson = async () => {
        console.log(newLesson)
        await supabase.from('lessons').insert([{ 
            ...newLesson, 
            month: monthNumber?.toString(), 
            substitute: newLesson.substitute || '' 
        }]);
        
    
        setLessons(await loadLessons());
    
        setShowForm(false);
        setNewLesson({ month: '', day: '', time: '', person: '', duration: '', substitute: '' });
    };
    
    async function loadLessons(): Promise<Lesson[]> {
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('month', monthNumber?.toString());
    
            if (error) throw new Error(error.message);
    
            return data || [];
        } catch (error) {
            console.error("Error loading lessons:", error);
            return [];
        }
    }

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Lessons');

        const headers = ["", "Deň", "Dátum", "Meno študenta", "Čas", "Trvanie lekcie", "Poznámka"];

        const groupedLessons = lessons.reduce((acc, lesson) => {
            if (!acc[lesson.day]) {
                acc[lesson.day] = [];
            }
            acc[lesson.day].push(lesson);
            return acc;
        }, {} as Record<string, Lesson[]>);

        const weeks: Record<number, { day: string; lessons: Lesson[] }[]> = {};

        Object.entries(groupedLessons).forEach(([day, dayLessons]) => {
            const [dayPart, month, year] = day.split('.').map(part => part.trim());
            const formattedDate = new Date(`${year}-${month}-${dayPart}`);
            if (isNaN(formattedDate.getTime())) {
                console.error(`Invalid date format for lesson: ${day}`);
                return;
            }
            const weekNumber = Math.ceil((formattedDate.getDate() - 1) / 7);
            if (!weeks[weekNumber]) {
                weeks[weekNumber] = [];
            }
            weeks[weekNumber].push({ day, lessons: dayLessons });
        });

        let currentRow = 1;

        Object.entries(weeks).forEach(([weekNumber, weekLessons]) => {
            worksheet.addRow(headers); // Add headers for each week

            const headerRow = worksheet.lastRow;
            if (headerRow) {
                headerRow.eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'D3D3D3' } // Light gray
                    };
                    cell.alignment = { horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }

            currentRow++; // Move to the next row after headers

            const startRow = currentRow; // Track the start row for merging

            weekLessons.forEach(({ day, lessons: dayLessons }) => {
                const [dayPart, month, year] = day.split('.').map(part => part.trim());
                const formattedDate = new Date(`${year}-${month}-${dayPart}`);
                const dayOfWeek = formattedDate.toLocaleDateString('sk-SK', { weekday: 'long' });

                dayLessons.forEach((lesson, index) => {
                    worksheet.addRow([
                        index === 0 ? 'T\nÝ\nŽ\nD\nE\nŇ' : '', 
                        index === 0 ? dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1) : '', 
                        index === 0 ? day : '', 
                        lesson.person,
                        lesson.time,
                        lesson.duration,
                        lesson.substitute ? `Náhradná hodina za: ${lesson.substitute}` : ''
                    ]);
                    currentRow++;
                });
            });

            // Ensure minimum 5 rows for each week
            const rowsAdded = currentRow - startRow;
            if (rowsAdded < 5) {
                for (let i = 0; i < 5 - rowsAdded; i++) {
                    worksheet.addRow(['', '', '', '', '', '', '']);
                    currentRow++;
                }
            }

            worksheet.mergeCells(startRow, 1, currentRow - 1, 1);

            const týždeňCell = worksheet.getCell(startRow, 1);
            týždeňCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            týždeňCell.font = { size: 11 };
        });

        // Style data rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Adjust column widths
        worksheet.columns = [
            { width: 10 }, // Týždeň
            { width: 10 }, // Deň
            { width: 15 }, // Dátum
            { width: 25 }, // Meno študenta
            { width: 10 }, // Čas
            { width: 15 }, // Trvanie lekcie
            { width: 30 }  // Poznámka
        ];

        // Export to file
        const buffer = await workbook.xlsx.writeBuffer();

        // Use FileSaver to trigger download
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'lessons.xlsx');  // Save the file with the name "lessons.xlsx"
    };

    

    return (
        <div style={{ padding: '20px' }}>
            <h1>Hodiny za {new Intl.DateTimeFormat('sk-SK', { month: 'long' }).format(new Date(2025, monthNumber - 1))}</h1>

            <button 
                onClick={() => setShowForm(!showForm)} 
                style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                {showForm ? 'Zrušiť' : 'Pridať hodinu'}
            </button>
            <button onClick={exportToExcel}>
                Exportovať
            </button>

            {showForm && (
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        addLesson();
                    }} 
                    style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}
                >
                    <div style={{ marginBottom: '10px' }}>
                        <label>Žiak: </label>
                        <select
                            value={newLesson.person}
                            onChange={(e) => {
                                const selectedPupil = pupils.find(pupil => pupil.name === e.target.value);
                                if (selectedPupil) {
                                    const [hours, minutes] = selectedPupil.time.split(':').map(Number);
                                    const [durationHours, durationMinutes] = selectedPupil.duration.split(':').map(Number);
                                    const endHours = hours + durationHours + Math.floor((minutes + durationMinutes) / 60);
                                    const endMinutes = (minutes + durationMinutes) % 60;
                                    
                                    setNewLesson({
                                        ...newLesson,
                                        person: selectedPupil.name,
                                        day: new Date().toLocaleDateString('sk-SK'),
                                        time: selectedPupil.time,
                                        duration: selectedPupil.duration,
                                        substitute: ''
                                    });
                                }
                            }}
                            required
                        >
                            <option value="" disabled>Vyberte žiaka</option>
                            {pupils.map((pupil) => (
                                <option key={pupil.id} value={pupil.name}>
                                    {pupil.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Deň: </label>
                        <select
                            value={newLesson.day}
                            onChange={(e) => {
                                const selectedDay = e.target.value;
                                const date = new Date(2025, monthNumber - 1, parseInt(selectedDay));
                                setNewLesson({ ...newLesson, day: date.toLocaleDateString('sk-SK') });
                            }}
                            required
                        >
                            <option value="" disabled>Vyberte deň</option>
                            {Array.from({ length: new Date(2025, monthNumber, 0).getDate() }, (_, i) => i + 1).map((day) => {
                                const date = new Date(2025, monthNumber - 1, day);
                                const formattedDate = date.toLocaleDateString('sk-SK');
                                return (
                                    <option key={day} value={formattedDate}>
                                        {formattedDate}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div style={{ marginBottom: '10px' }}></div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Začiatok: </label>
                        <input 
                            type="text" 
                            value={newLesson.time} 
                            onChange={(e) => setNewLesson({ ...newLesson, time: e.target.value })} 
                            required 
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Trvanie: </label>
                        <input 
                            type="text" 
                            value={newLesson.duration} 
                            onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })} 
                            required 
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            <input 
                                type="checkbox" 
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setNewLesson({ ...newLesson, substitute: 'c' });
                                        console.log(newLesson);
                                    } else {
                                        setNewLesson({ ...newLesson, substitute: '' }); 

                                    }
                                }} 
                            />
                            Náhradný termín
                        </label>
                        {newLesson.substitute !== '' && (
                            <div style={{ marginTop: '10px' }}>
                                <label>Pôvodný dátum hodiny: </label>
                                <input 
                                    type="date" 
                                    value={newLesson.substitute || ''} 
                                    onChange={(e) => setNewLesson({ ...newLesson, substitute: e.target.value })} 
                                    required 
                                />
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        Potvrdiť
                    </button>
                </form>
            )}

            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                {lessons.length > 0 ? (
                    Object.entries(
                        lessons
                            .sort((a, b) => {
                                const dateA = new Date(a.day.split('.').reverse().join('-'));
                                const dateB = new Date(b.day.split('.').reverse().join('-'));
                                return dateA.getTime() - dateB.getTime();
                            })
                            .reduce((acc, lesson) => {
                                if (!acc[lesson.day]) {
                                    acc[lesson.day] = [];
                                }
                                acc[lesson.day].push(lesson);
                                return acc;
                            }, {} as Record<string, Lesson[]>)
                    ).map(([day, dayLessons]) => (
                        <div key={day} style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '10px' }}>{day}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '8px' }}>Mesiac</th>
                                        <th style={{ padding: '8px' }}>Žiak</th>
                                        <th style={{ padding: '8px' }}>Čas</th>
                                        <th style={{ padding: '8px' }}>Trvanie</th>
                                        <th style={{ padding: '8px' }}>Náhradný termín</th>
                                        <th style={{ padding: '8px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayLessons.map((lesson) => (
                                        <tr key={lesson.id}>
                                            <td style={{ padding: '8px' }}>{lesson.month}</td>
                                            <td style={{ padding: '8px' }}>{lesson.person}</td>
                                            <td style={{ padding: '8px' }}>{lesson.time}</td>
                                            <td style={{ padding: '8px' }}>{lesson.duration}</td>
                                            <td style={{ padding: '8px' }}>{lesson.substitute || '—'}</td>
                                            <td style={{ padding: '8px' }}>
                                                <button
                                                    onClick={() => removeLesson(lesson.id)}
                                                    style={{
                                                        padding: '5px 5px',
                                                        color: 'red',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        margin: '0px',
                                                        backgroundColor: 'rgba(0, 0, 0, 0)',
                                                    }}
                                                >
                                                    x
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        Tento mesiac neboli žiadne hodiny
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;
