import React from 'react';
import PropTypes from 'prop-types';
import { PageActions } from '../utils/actions/';
import { csrfToken, postRequest } from '../utils/helpers';
import { Page } from './_Page';

/**
 * 辅助函数：根据给定的路径更新 JSON 对象
 * 例如：path = ['a','b'] 表示更新 obj.a.b 为 value
 */
function updateJsonAtPath(obj, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  return {
    ...obj,
    [key]: rest.length === 0 ? value : updateJsonAtPath(obj[key] || {}, rest, value),
  };
}

/**
 * JsonEditor 组件
 * 递归地根据传入的 data 对象生成表单控件，
 * onChange(path, newValue) 用来上报某个字段的变更
 */
function JsonEditor({ data, onChange, path = [] }) {
  if (typeof data !== 'object' || data === null) {
    // 如果 data 不是对象，则什么也不渲染
    return null;
  }
  return (
    <div>
      {Object.entries(data).map(([key, val]) => {
        const currentPath = [...path, key];
        // 如果值为对象且非数组，则递归生成子区域
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return (
            <div
              key={currentPath.join('.')}
              style={{
                marginLeft: '20px',
                marginBottom: '10px',
                border: '1px solid #ccc',
                padding: '10px',
              }}
            >
              <h4>{key}</h4>
              <JsonEditor data={val} onChange={onChange} path={currentPath} />
            </div>
          );
        }
        // 如果值为数组，采用 textarea 展示 JSON 字符串
        if (Array.isArray(val)) {
          return (
            <div key={currentPath.join('.')} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>{key}:</label>
              <textarea
                style={{ width: '100%', height: '60px' }}
                value={JSON.stringify(val)}
                onChange={(e) => {
                  let newVal;
                  try {
                    newVal = JSON.parse(e.target.value);
                  } catch (err) {
                    newVal = e.target.value;
                  }
                  onChange(currentPath, newVal);
                }}
              />
            </div>
          );
        }
        // 针对简单类型，选择合适的 input 类型
        let inputType = 'text';
        if (typeof val === 'number') {
          inputType = 'number';
        } else if (typeof val === 'boolean') {
          inputType = 'checkbox';
        }
        return (
          <div key={currentPath.join('.')} style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>{key}:</label>
            {inputType === 'checkbox' ? (
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => onChange(currentPath, e.target.checked)}
              />
            ) : (
              <input
                type={inputType}
                value={val}
                onChange={(e) => {
                  let newVal = e.target.value;
                  if (inputType === 'number') {
                    // 如果输入为空，则保持空字符串，否则转换为数字
                    newVal = e.target.value === '' ? '' : parseFloat(e.target.value);
                  }
                  onChange(currentPath, newVal);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

JsonEditor.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  path: PropTypes.array,
};

export class ManageCommentsPage extends Page {
  constructor(props) {
    super(props, 'manage-comments');

    this.state = {
      modifiedNavContent: {},
      modifiedPopContent: {},
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

    postRequest(
      this.requestNavUrl,
      { detail: JSON.stringify(modifiedNavContent) },
      {
        headers: {
          'X-CSRFToken': csrfToken(),
        },
      },
      false,
      (response) => {
        if (response && response.data && response.data.msg === 'ok') {
          PageActions.addNotification('导航配置修改成功.', '提示');
        } else {
          if (response && response.msg) {
            PageActions.addNotification(response.msg, '出錯了');
          } else {
            PageActions.addNotification('导航配置修改失败.', '出錯了');
          }
        }
      },
      () => {
        PageActions.addNotification('导航配置修改时出错.', '错误');
      }
    );
  };

  handleModifyPop = () => {
    const { modifiedPopContent } = this.state;

    postRequest(
      this.requestPopUrl,
      { detail: JSON.stringify(modifiedPopContent) },
      {
        headers: {
          'X-CSRFToken': csrfToken(),
        },
      },
      false,
      (response) => {
        if (response && response.data && response.data.msg === 'ok') {
          PageActions.addNotification('弹框配置修改成功.', '提示');
        } else {
          if (response && response.msg) {
            PageActions.addNotification(response.msg, '出錯了');
          } else {
            PageActions.addNotification('弹框配置修改失败.', '出錯了');
          }
        }
      },
      () => {
        PageActions.addNotification('弹框配置修改时出错.', '错误');
      }
    );
  };

  // 当导航栏的 JSON 对象中任意字段修改时调用
  handleNavFieldChange = (path, value) => {
    this.setState((prevState) => ({
      modifiedNavContent: updateJsonAtPath(prevState.modifiedNavContent, path, value),
    }));
  };

  // 当弹框的 JSON 对象中任意字段修改时调用
  handlePopFieldChange = (path, value) => {
    this.setState((prevState) => ({
      modifiedPopContent: updateJsonAtPath(prevState.modifiedPopContent, path, value),
    }));
  };

  pageContent() {
    const { modifiedNavContent, modifiedPopContent } = this.state;

    return (
      <div>
        <h1>管理站点</h1>
        <br /><br />
        <h3>管理导航栏</h3>
        <JsonEditor data={modifiedNavContent || {}} onChange={this.handleNavFieldChange} />
        <button onClick={this.handleModifyNav} style={{ marginTop: '20px', padding: '10px 20px' }}>
          保存修改
        </button>

        <br /><br />
        <h3>管理弹框</h3>
        <JsonEditor data={modifiedPopContent || {}} onChange={this.handlePopFieldChange} />
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
