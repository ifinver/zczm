import React from 'react';
import PropTypes from 'prop-types';
import { PageActions } from '../utils/actions/';
import { csrfToken, postRequest } from '../utils/helpers';
import { Page } from './_Page';

/**
 * 辅助函数：根据给定的路径更新 JSON 对象（同时支持数组）
 */
function updateJsonAtPath(obj, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  let newObj;
  if (Array.isArray(obj)) {
    newObj = [...obj];
  } else if (typeof obj === 'object' && obj !== null) {
    newObj = { ...obj };
  } else {
    newObj = {};
  }
  newObj[key] = rest.length === 0 ? value : updateJsonAtPath(newObj[key], rest, value);
  return newObj;
}

/**
 * ArrayEditor 组件
 * 用于渲染数组（尤其是对象数组），支持对每个元素的编辑、删除以及新增元素
 */
function ArrayEditor({ data, onChange, path }) {
  // 删除数组中指定 index 的元素
  const handleDelete = (index) => {
    const newArray = data.filter((_, i) => i !== index);
    onChange(path, newArray);
  };

  // 新增一个空对象作为数组元素
  const handleAddElement = () => {
    const newArray = [...data, {}];
    onChange(path, newArray);
  };

  // 当数组中某个对象内的字段变化时更新整个数组中对应的元素
  const handleElementChange = (index, childPath, value) => {
    onChange([...path, index, ...childPath], value);
  };

  return (
    <div
      style={{
        marginLeft: '20px',
        border: '1px dashed #aaa',
        padding: '10px',
        marginBottom: '10px',
      }}
    >
      {data.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return (
            <div
              key={index}
              style={{
                marginBottom: '10px',
                border: '1px solid #ccc',
                padding: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4 style={{ margin: 0 }}>元素 {index + 1}</h4>
                <button onClick={() => handleDelete(index)}>删除此元素</button>
              </div>
              <JsonEditor
                data={item}
                // 这里传入的 onChange 回调将自动组合路径：[index, ...childPath]
                onChange={(childPath, value) => handleElementChange(index, childPath, value)}
                path={[]} // 数组元素内部路径从空数组开始
              />
            </div>
          );
        }
        // 如果数组元素为非对象类型
        let inputType = 'text';
        if (typeof item === 'number') inputType = 'number';
        return (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              style={{ minWidth: '600px' }}
              type={inputType}
              value={item}
              onChange={(e) => {
                let newVal = e.target.value;
                if (inputType === 'number') {
                  newVal = e.target.value === '' ? '' : parseFloat(e.target.value);
                }
                onChange([...path, index], newVal);
              }}
            />
            <button onClick={() => handleDelete(index)}>删除</button>
          </div>
        );
      })}
      <button onClick={handleAddElement}>新增元素</button>
    </div>
  );
}

ArrayEditor.propTypes = {
  data: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  path: PropTypes.array.isRequired,
};

/**
 * JsonEditor 组件
 * 递归地根据传入的 JSON 数据生成表单控件
 * 如果数据为数组，则调用 ArrayEditor
 */
function JsonEditor({ data, onChange, path = [] }) {
  // 如果 data 是数组，则直接使用 ArrayEditor 渲染
  if (Array.isArray(data)) {
    return <ArrayEditor data={data} onChange={onChange} path={path} />;
  }
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  return (
    <div>
      {Object.entries(data).map(([key, val]) => {
        const currentPath = [...path, key];
        // 若值为对象（且非数组），递归调用 JsonEditor
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
        // 若值为数组，则判断是否为对象数组
        if (Array.isArray(val)) {
          const isObjectArray =
            val.length === 0 || val.every((item) => typeof item === 'object' && item !== null);
          if (isObjectArray) {
            return (
              <div key={currentPath.join('.')} style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>{key}:</label>
                <ArrayEditor data={val} onChange={onChange} path={currentPath} />
              </div>
            );
          } else {
            // 对于非对象数组，以 textarea 编辑 JSON 字符串
            return (
              <div key={currentPath.join('.')} style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>{key}:</label>
                <textarea
                  style={{ minWidth: '600px', height: '60px' }}
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
        }
        // 对于基本数据类型，判断是否为 content 字段
        let inputType = 'text';
        if (typeof val === 'number') inputType = 'number';
        if (typeof val === 'boolean') inputType = 'checkbox';

        if (key === 'content') {
          return (
            <div key={currentPath.join('.')} style={{ marginBottom: '10px' }}>
              <label style={{ marginRight: '10px', fontWeight: 'bold' }}>{key}:</label>
              <textarea
                style={{ minWidth: '600px', height: '150px' }}
                value={val}
                onChange={(e) => onChange(currentPath, e.target.value)}
              />
            </div>
          );
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
                style={{ minWidth: '600px' }}
                type={inputType}
                value={val}
                onChange={(e) => {
                  let newVal = e.target.value;
                  if (inputType === 'number') {
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
  data: PropTypes.any.isRequired,
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
    // 每次请求 JSON 时，在 URL 后添加一个随机的 version 参数以绕过 CDN 缓存
    fetch(`/static/nav.json?version=${Math.random()}`)
      .then((response) => response.json())
      .then((data) => this.setState({ modifiedNavContent: data }));

    fetch(`/static/pop.json?version=${Math.random()}`)
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

  // 当导航栏 JSON 任意字段变化时调用
  handleNavFieldChange = (path, value) => {
    this.setState((prevState) => ({
      modifiedNavContent: updateJsonAtPath(prevState.modifiedNavContent, path, value),
    }));
  };

  // 当弹框 JSON 任意字段变化时调用
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
        <h3>管理弹框</h3>
        <JsonEditor data={modifiedPopContent || {}} onChange={this.handlePopFieldChange} />
        <button onClick={this.handleModifyPop} style={{ marginTop: '20px', padding: '10px 20px' }}>
          保存修改
        </button>

        <br /><br />
        <h3>管理导航栏</h3>
        <JsonEditor data={modifiedNavContent || {}} onChange={this.handleNavFieldChange} />
        <button onClick={this.handleModifyNav} style={{ marginTop: '20px', padding: '10px 20px' }}>
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
