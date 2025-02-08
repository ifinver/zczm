import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { csrfToken } from '../utils/helpers';
import axios from 'axios';

export const ManageSitesPage = ({ title }) => {
  const [sites, setSites] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = () => {
    axios.get('/api/v1/sites', {
      headers: {
        'X-CSRFToken': csrfToken(),
      },
      withCredentials: true,
    })
    .then(response => {
      setSites(response.data.data);
    })
    .catch(error => {
      console.error('获取站点列表申请失败:', error);
    });
  };


  return (
    <div style={{ margin: 'auto', padding: '24px', position: 'relative' }}>
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
        {sites.map(site => {
          return (
            <div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ManageSitesPage.propTypes = {
  title: PropTypes.string.isRequired,
};

ManageSitesPage.defaultProps = {
  title: '管理免翻站点',
};