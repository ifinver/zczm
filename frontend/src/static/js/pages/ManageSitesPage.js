import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { csrfToken } from '../utils/helpers';
import axios from 'axios';

export const ManageSitesPage = ({ title }) => {
  const [sites, setSites] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  // 用于记录用户选中的站点（域名）
  const [selectedSites, setSelectedSites] = useState([]);
  // 控制绑定新域名的对话框是否显示
  const [showNewDomainModal, setShowNewDomainModal] = useState(false);
  // 新域名输入的值
  const [newDomain, setNewDomain] = useState('');
  // 对话框中的错误信息
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetchSites();
  }, []);

  // 获取站点列表
  const fetchSites = () => {
    axios.get('/api/v1/sites', {
      headers: {
        'X-CSRFToken': csrfToken(),
      },
      withCredentials: true,
    })
    .then(response => {
      // 假设接口返回的数据格式为 { domains: [...] }
      setSites(response.data.domains || []);
    })
    .catch(error => {
      console.error('获取站点列表失败:', error);
      setErrorMessage('获取站点列表失败');
    });
  };

  // 切换站点的选中状态
  const toggleSelectSite = (site) => {
    if (selectedSites.includes(site)) {
      setSelectedSites(selectedSites.filter(item => item !== site));
    } else {
      setSelectedSites([...selectedSites, site]);
    }
  };

  // 批量删除选中的站点
  const handleDeleteSelected = () => {
    if (selectedSites.length === 0) {
      setErrorMessage('请先选择要删除的站点');
      return;
    }
    if (!window.confirm('确定删除选中的站点吗？')) {
      return;
    }
    axios.delete('/api/v1/sites', {
      headers: {
        'X-CSRFToken': csrfToken(),
      },
      // 注意：axios.delete 的请求体数据需要放在 data 字段中
      data: { domains: selectedSites },
      withCredentials: true,
    })
    .then(response => {
      fetchSites();
      setSelectedSites([]);
    })
    .catch(error => {
      console.error('删除站点失败:', error);
      setErrorMessage('删除站点失败');
    });
  };

  // 打开绑定新域名的对话框
  const openNewDomainModal = () => {
    setNewDomain('');
    setModalError(null);
    setShowNewDomainModal(true);
  };

  // 关闭对话框
  const closeNewDomainModal = () => {
    setShowNewDomainModal(false);
    setModalError(null);
  };

  // 处理绑定新域名的表单提交
  const handleNewDomainSubmit = (e) => {
    e.preventDefault();
    if (!newDomain.trim()) {
      setModalError('域名不能为空');
      return;
    }
    axios.post('/api/v1/sites', { domain: newDomain.trim() }, {
      headers: {
        'X-CSRFToken': csrfToken(),
      },
      withCredentials: true,
    })
    .then(response => {
      closeNewDomainModal();
      fetchSites();
    })
    .catch(error => {
      console.error('绑定新域名失败:', error);
      if (error.response && error.response.data && error.response.data.msg) {
        setModalError(error.response.data.msg);
      } else {
        setModalError('绑定新域名失败');
      }
    });
  };

  return (
    <div style={{ margin: 'auto', padding: '24px', position: 'relative' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>{title}</h1>

      {/* 错误提示 */}
      {errorMessage && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#dc2626', color: 'white', padding: '16px', borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 50
        }}>
          {errorMessage}
        </div>
      )}

      {/* 右上角绑定新域名按钮 */}
      <button
        onClick={openNewDomainModal}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          padding: '8px 16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        绑定新域名
      </button>

      {/* 删除选中按钮 */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleDeleteSelected}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          删除选中
        </button>
      </div>

      {/* 显示站点列表，每个站点带有复选框 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
        {sites.map(site => (
          <div key={site} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            minWidth: '200px'
          }}>
            <input
              type="checkbox"
              checked={selectedSites.includes(site)}
              onChange={() => toggleSelectSite(site)}
              style={{ marginRight: '8px' }}
            />
            <span>{site}</span>
          </div>
        ))}
      </div>

      {/* 新域名绑定对话框 */}
      {showNewDomainModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '300px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>绑定新域名</h2>
            <form onSubmit={handleNewDomainSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="输入域名，如 abc.xyz"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                />
              </div>
              {modalError && (
                <div style={{ color: '#dc2626', marginBottom: '16px' }}>
                  {modalError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={closeNewDomainModal}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  绑定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ManageSitesPage.propTypes = {
  title: PropTypes.string.isRequired,
};

ManageSitesPage.defaultProps = {
  title: '管理免翻站点',
};

export default ManageSitesPage;
