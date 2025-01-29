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
    <div className="container mx-auto p-6 relative">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {errorMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded shadow-lg z-50">
          {errorMessage}
        </div>
      )}
      <div className="space-y-4">
        {applications.map(app => (
          <div key={app.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-gray-600 font-semibold">ID:</div>
              <div className="text-gray-900">{app.id}</div>
              <div className="text-gray-600 font-semibold">名称:</div>
              <div className="text-gray-900">{app.name}</div>
              <div className="text-gray-600 font-semibold">申请内容:</div>
              <div className="text-gray-900">{app.content}</div>
              <div className="text-gray-600 font-semibold">备注:</div>
              <div className="text-gray-900">{app.note || '无'}</div>
              <div className="text-gray-600 font-semibold">状态:</div>
              <div className="text-gray-900">
                {app.is_completed ? (
                  <span className="text-green-500 text-xl">✔ 已完成</span>
                ) : (
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded" 
                    onClick={() => markAsCompleted(app.id)}
                  >完成</button>
                )}
              </div>
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
