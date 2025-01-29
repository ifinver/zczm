import React from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view'; // 用于美观的 JSON 编辑
import { PageActions } from '../utils/actions';
import { csrfToken,postRequest } from '../utils/helpers';
import { Page } from './_Page';

export class ManageSantuiPage extends Page {
  constructor(props) {
    super(props, 'manage-santui');

    this.state = {
      modifiedContent: [], 
    };

    this.requestUrl = '/api/v1/manage_nav';
  }

  componentDidMount() {
    fetch('/static/nav.json')
      .then((response) => response.json())
      .then((data) => this.setState({ modifiedContent: data }));
  }

  handleModify = () => {
    const { modifiedContent } = this.state;

    postRequest(this.requestUrl, 
      { detail: JSON.stringify(modifiedContent) },
      {
        headers: {
          'X-CSRFToken': csrfToken(),
        },
      },
    )
      .then((response) => {
        if (response && response.msg === 'ok') {
          PageActions.addNotification('站点配置修改成功.', '提示');
        } else {
          if(response && response.msg){
            PageActions.addNotification(response.msg, '出錯了');
          }else{
            PageActions.addNotification('站点配置修改失败.', '出錯了');
          }
          
        }
      })
      .catch(() => {
        PageActions.addNotification('站点配置修改时出错.', '错误');
      });
  };

  handleJsonChange = (edit) => {
    this.setState({ modifiedContent:edit.updated_src });
  };

  pageContent() {
    const { modifiedContent } = this.state;

    return (
      <div>
        <h1>管理三退申请</h1>
        <br/><br/>
      </div>
    );
  }
}

ManageSantuiPage.propTypes = {
  title: PropTypes.string.isRequired,
};

ManageSantuiPage.defaultProps = {
  title: '管理三退申请',
};
