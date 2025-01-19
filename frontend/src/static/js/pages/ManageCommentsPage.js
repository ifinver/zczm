import React from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view'; // 用于美观的 JSON 编辑
import { ApiUrlContext } from '../utils/contexts/';
import { PageActions } from '../utils/actions/';
import { getRequest, postRequest } from '../utils/helpers';
import { Page } from './_Page';

export class ManageCommentsPage extends Page {
  constructor(props) {
    super(props, 'manage-comments');

    this.state = {
      modifiedContent: {}, // 用于存储修改后的内容
    };

    this.requestUrl = '/api/v1/getNavJson';
    this.setUrl = '/api/v1/postNavJson';
  }

  componentDidMount() {
    // 在页面加载时通过 getRequest 获取内容
    getRequest(this.requestUrl)
      .then((response) => {
        if (response && response.detail) {
          this.setState({ modifiedContent: response.detail });
        } else {
          PageActions.addNotification('未能加载站点配置.', '错误');
        }
      })
      .catch(() => {
        PageActions.addNotification('加载站点配置时出错.', '错误');
      });
  }

  handleModify = () => {
    const { modifiedContent } = this.state;

    postRequest(this.setUrl, { detail: JSON.stringify(modifiedContent) })
      .then((response) => {
        if (response && response.msg === 'ok') {
          PageActions.addNotification('站点配置修改成功.', '提示');
        } else {
          PageActions.addNotification('站点配置修改失败.', '错误');
        }
      })
      .catch(() => {
        PageActions.addNotification('站点配置修改时出错.', '错误');
      });
  };

  handleJsonChange = (edit) => {
    this.setState({ modifiedContent: edit.updated_src });
  };

  pageContent() {
    const { modifiedContent } = this.state;

    return (
      <div>
        <h1>管理站点</h1>
        <br/><br/>
        <h3>管理導航欄</h3>
        <ReactJson
          src={modifiedContent}
          onEdit={this.handleJsonChange}
          onAdd={this.handleJsonChange}
          onDelete={this.handleJsonChange}
          style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}
          displayDataTypes={false}
          displayObjectSize={false}
          theme="monokai"
        />
        <button onClick={this.handleModify} style={{ marginTop: '20px', padding: '10px 20px' }}>
          保存修改
        </button>
      </div>
    );
  }
}

ManageCommentsPage.propTypes = {
  title: PropTypes.string.isRequired,
};

ManageCommentsPage.defaultProps = {
  title: '管理站点',
};
