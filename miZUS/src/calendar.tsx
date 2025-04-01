import React from 'react';
import { useNavigate } from 'react-router-dom';

const Calendar: React.FC = () => {
    const navigate = useNavigate();

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentMonthIndex = new Date().getMonth();

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '20px' }}>
            {months.map((month, index) => {
                let backgroundColor = 'red';
                if (index === currentMonthIndex) {
                    backgroundColor = 'green';
                } else if (index < currentMonthIndex) {
                    backgroundColor = 'gray';
                }

                return (
                    <button
                        key={month}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            backgroundColor,
                            color: 'white'
                        }}
                        onClick={() => navigate('/month', { state: { monthNumber: index + 1 } })}
                    >
                        {month}
                    </button>
                );
            })}
        </div>
    );
};

export default Calendar;
