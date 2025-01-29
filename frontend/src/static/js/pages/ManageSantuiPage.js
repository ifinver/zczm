import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { csrfToken } from '../utils/helpers';
import axios from 'axios';

export const ManageSantuiPage = ({ title }) => {
  const [applications, setApplications] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = () => {
    axios.get('/api/v1/santui', {
      headers: {
        'X-CSRFToken': csrfToken(),
      },
      withCredentials: true,
    })
    .then(response => {
      setApplications(response.data.data);
    })
    .catch(error => {
      console.error('获取三退申请失败:', error);
    });
  };

  const markAsCompleted = (id) => {
    axios.post('/api/v1/santui', { id }, {
      headers: {
        'X-CSRFToken': csrfToken(),
      },
      withCredentials: true,
    })
    .then(() => {
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === id ? { ...app, is_completed: true } : app
        )
      );
    })
    .catch(error => {
      setErrorMessage('标记失败，请重试');
      setTimeout(() => setErrorMessage(null), 3000);
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: 'auto', padding: '24px', position: 'relative' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>{title}</h1>
      {errorMessage && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#dc2626', color: 'white', padding: '16px', borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 50
        }}>
          {errorMessage}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
        {applications.map(app => {
          const noteContent = app.note && JSON.stringify(app.note) !== '{}' ? app.note : '无';
          return (
            <div key={app.id} style={{
              background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '24px', transition: 'box-shadow 0.3s ease-in-out',
              maxWidth: '400px', width: '100%', cursor: 'pointer', position: 'relative', minHeight: '150px'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#6b7280' }}>
                <span>ID:</span>
                <span style={{ color: '#374151', fontWeight: 'bold' }}>{app.id}</span>
                <span>名字:</span>
                <span style={{ color: '#374151', fontWeight: 'bold' }}>{app.name}</span>
              </div>
              <div style={{ color: '#6b7280', marginBottom: '12px' }}>申请内容:</div>
              <div style={{ color: '#374151', marginBottom: '12px' }}>{app.content}</div>
              {noteContent !== '无' && (
                <>
                  <div style={{ color: '#6b7280', marginBottom: '12px' }}>备注:</div>
                  <div style={{ color: '#374151', marginBottom: '12px' }}>{noteContent}</div>
                </>
              )}
              <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
                {app.is_completed ? (
                  <span style={{ color: '#16a34a', fontSize: '1.2rem', fontWeight: 'bold' }}>✔ 已完成</span>
                ) : (
                  <button 
                    style={{
                      backgroundColor: '#2563eb', color: 'white', padding: '8px 16px',
                      borderRadius: '6px', fontWeight: 'bold', transition: 'background 0.3s',
                      border: 'none', cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e40af'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onClick={() => markAsCompleted(app.id)}
                  >完成</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ManageSantuiPage.propTypes = {
  title: PropTypes.string.isRequired,
};

ManageSantuiPage.defaultProps = {
  title: '管理三退申请',
};
