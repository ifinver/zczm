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

    postRequest(this.requestUrl, { detail: JSON.stringify(modifiedContent) })
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
    this.setState({ modifiedContent:edit.updated_src });
  };

  pageContent() {
    const { modifiedContent } = this.state;

    return (
      <div>
        <h1>管理站点</h1>
        <br/><br/>
        <h3>管理導航欄</h3>
        <ReactJson
          src={modifiedContent || {}}
          onEdit={this.handleJsonChange}
          onAdd={this.handleJsonChange}
          onDelete={this.handleJsonChange}
          style={{
            padding: '20px',
            backgroundColor: '#1e1e1e', // 设置深色背景
            borderRadius: '8px',
            color: '#ffffff', // 默认字体颜色
          }}
          displayDataTypes={false}
          displayObjectSize={false}
          theme={{
            base00: "#1e1e1e", // 背景色
            base01: "#282c34", // 辅助背景色
            base02: "#2c313c", // 突出背景
            base03: "#d4d4d4", // 边框色
            base04: "#d4d4d4", // 数字颜色
            base05: "#ffffff", // 默认字体颜色
            base06: "#ffffff", // 标题颜色
            base07: "#ffffff", // 键的颜色
            base08: "#569cd6", // 关键字颜色
            base09: "#dcdcaa", // 数值颜色
            base0A: "#c586c0", // 函数名颜色
            base0B: "#6a9955", // 字符串颜色
            base0C: "#9cdcfe", // URL 颜色
            base0D: "#4ec9b0", // 对象名颜色
            base0E: "#c586c0", // 类名颜色
            base0F: "#d16969", // 错误颜色
          }}
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
