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
    <div className="container mx-auto p-6 relative">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {errorMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded shadow-lg z-50">
          {errorMessage}
        </div>
      )}
      <div className="flex flex-wrap gap-4 justify-start">
        {applications.map(app => (
          <div key={app.id} className="bg-gray-100 shadow-lg rounded-2xl p-6 border border-gray-300 max-w-xs hover:shadow-xl transition duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-semibold">ID:</span>
              <span className="text-gray-900 font-bold">{app.id}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-semibold">名称:</span>
              <span className="text-gray-900 font-bold">{app.name}</span>
            </div>
            <div className="text-gray-600 font-semibold mb-2">申请内容:</div>
            <div className="text-gray-900 mb-4">{app.content}</div>
            <div className="text-gray-600 font-semibold mb-2">备注:</div>
            <div className="text-gray-900 mb-4">{app.note || '无'}</div>
            <div className="text-gray-600 font-semibold mb-2">状态:</div>
            <div className="text-gray-900">
              {app.is_completed ? (
                <span className="text-green-500 text-xl">✔ 已完成</span>
              ) : (
                <button 
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
                  onClick={() => markAsCompleted(app.id)}
                >完成</button>
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
