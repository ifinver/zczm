import React from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view'; // 用于美观的 JSON 编辑
import { PageActions } from '../utils/actions/';
import { csrfToken,postRequest } from '../utils/helpers';
import { Page } from './_Page';

export class ManageCommentsPage extends Page {
  constructor(props) {
    super(props, 'manage-comments');

    this.state = {
      modifiedNavContent: [], 
      modifiedPopContent: [], 
    };

    this.requestNavUrl = '/api/v1/manage_nav';
    this.requestPopUrl = '/api/v1/manage_pop';
  }

  componentDidMount() {
    fetch('/static/nav.json')
      .then((response) => response.json())
      .then((data) => this.setState({ modifiedNavContent: data }));

      fetch('/static/pop.json')
      .then((response) => response.json())
      .then((data) => this.setState({ modifiedPopContent: data }));
  }

  handleModifyNav = () => {
    const { modifiedNavContent } = this.state;

    postRequest(this.requestNavUrl, 
      { detail: JSON.stringify(modifiedNavContent) },
      {
        headers: {
          'X-CSRFToken': csrfToken(),
        },
      },
      false,
      (response) => {
        console.log(response)
        if (response && response.msg === 'ok') {
          PageActions.addNotification('导航配置修改成功.', '提示');
        } else {
          if(response && response.msg){
            PageActions.addNotification(response.msg, '出錯了');
          }else{
            PageActions.addNotification('导航配置修改失败.', '出錯了');
          }
          
        }
      },
      () => {
        PageActions.addNotification('导航配置修改时出错.', '错误');
      }
    )
  };

  handleModifyPop = () => {
    const { modifiedPopContent } = this.state;

    postRequest(this.requestPopUrl, 
      { detail: JSON.stringify(modifiedPopContent) },
      {
        headers: {
          'X-CSRFToken': csrfToken(),
        },
      },
      false,
      (response) => {
        console.log(response)
        if (response && response.msg === 'ok') {
          PageActions.addNotification('弹框配置修改成功.', '提示');
        } else {
          if(response && response.msg){
            PageActions.addNotification(response.msg, '出錯了');
          }else{
            PageActions.addNotification('弹框配置修改失败.', '出錯了');
          }
        }
      },
      () => {
        PageActions.addNotification('弹框配置修改时出错.', '错误');
      }
    )
  };

  handleNavJsonChange = (edit) => {
    this.setState({ modifiedNavContent:edit.updated_src });
  };

  handlePopJsonChange = (edit) => {
    this.setState({ modifiedPopContent:edit.updated_src });
  };

  pageContent() {
    const { modifiedNavContent,modifiedPopContent } = this.state;

    return (
      <div>
        <h1>管理站点</h1>
        <br/><br/>
        <h3>管理导航栏</h3>
        <ReactJson
          src={modifiedNavContent || {}}
          onEdit={this.handleNavJsonChange}
          onAdd={this.handleNavJsonChange}
          onDelete={this.handleNavJsonChange}
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
        <button onClick={this.handleModifyNav} style={{ marginTop: '20px', padding: '10px 20px' }}>
          保存修改
        </button>

        <br/><br/>
        <h3>管理弹框</h3>
        <ReactJson
          src={modifiedPopContent || {}}
          onEdit={this.handlePopJsonChange}
          onAdd={this.handlePopJsonChange}
          onDelete={this.handlePopJsonChange}
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
        <button onClick={this.handleModifyPop} style={{ marginTop: '20px', padding: '10px 20px' }}>
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
