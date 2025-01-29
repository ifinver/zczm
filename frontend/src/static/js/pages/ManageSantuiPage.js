import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { csrfToken } from '../utils/helpers';
import axios from 'axios';
import './ManageSantuiPage.css'; 

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
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <div className="card-container">
        {applications.map(app => (
          <div key={app.id} className="card">
            <div className="card-header">
              <span>ID: {app.id}</span>
              <span>名称: {app.name}</span>
            </div>
            <div className="card-content">申请内容: {app.content}</div>
            <div className="card-content">备注: {app.note || '无'}</div>
            <div className="card-footer">
              {app.is_completed ? (
                <span className="success-text">✔ 已完成</span>
              ) : (
                <button className="button" onClick={() => markAsCompleted(app.id)}>完成</button>
              )}
            </div>
          </div>
        ))}
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
