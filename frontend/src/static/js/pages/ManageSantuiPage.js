import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getRequest,postRequest } from '../utils/helpers';

export const ManageSantuiPage = (props) => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = () => {
    getRequest('/api/v1/santui', false, (response) => {
      setApplications(response.data.data);
    }, (error) => {
      console.error('获取三退申请失败:', error);
    });
  };

  const markAsCompleted = (id) => {
    postRequest('/api/v1/santui', { id }, null, false, () => {
      fetchApplications(); // 重新获取数据，更新列表
    }, (error) => {
      console.error('标记失败:', error);
    });
  };

  return (
    <div>
      <h1>管理三退申请</h1>
      <br/><br/>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>申请内容</th>
            <th>备注</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app.id}>
              <td>{app.id}</td>
              <td>{app.name}</td>
              <td>{app.content}</td>
              <td>{app.note || '无'}</td>
              <td>{app.is_completed ? '已完成' : '未完成'}</td>
              <td>
                {!app.is_completed && (
                  <button onClick={() => markAsCompleted(app.id)}>已完成</button>
                )}
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
