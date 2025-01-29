import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { csrfToken } from '../utils/helpers';
import axios from 'axios';

export const ManageSantuiPage = ({ title }) => {
  const [applications, setApplications] = useState([]);

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
      console.error('标记失败:', error);
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <table className="w-full border-collapse border border-gray-300 shadow-md">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">ID</th>
            <th className="border border-gray-300 px-4 py-2">名称</th>
            <th className="border border-gray-300 px-4 py-2">申请内容</th>
            <th className="border border-gray-300 px-4 py-2">备注</th>
            <th className="border border-gray-300 px-4 py-2">状态</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app.id} className="border-b border-gray-300 hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 text-center">{app.id}</td>
              <td className="border border-gray-300 px-4 py-2">{app.name}</td>
              <td className="border border-gray-300 px-4 py-2">{app.content}</td>
              <td className="border border-gray-300 px-4 py-2">{app.note || '无'}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {app.is_completed ? 
                  <span className="text-green-500 text-xl">✔</span> : 
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded" 
                    onClick={() => markAsCompleted(app.id)}
                  >完成</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

ManageSantuiPage.propTypes = {
  title: PropTypes.string.isRequired,
};

ManageSantuiPage.defaultProps = {
  title: '管理三退申请',
};
