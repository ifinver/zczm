import React from 'react';
import PropTypes from 'prop-types';
import { ApiUrlContext } from '../utils/contexts/';
import { PageActions } from '../utils/actions/';
import {getRequest, postRequest} from '../utils/helpers'
import { Page } from './_Page';

function genReqUrl(url, sort, page) {
  const ret = url + '?' + sort + ('' === sort ? '' : '&') + 'page=' + page;
  return ret;
}

export class ManageCommentsPage extends Page {
  constructor(props) {
    super(props, 'manage-comments');

    this.state = {
    };
    this.requestUrl = '/api/v1/getNavJson'
    this.setUrl = '/api/v1/postNavJson'
  }

  onModifySuccess() {
    PageActions.addNotification('站点配置修改成功.', '提示');
  }

  pageContent() {
    return (
      <div>管理站点</div>
    );
  }
}

ManageCommentsPage.propTypes = {
  title: PropTypes.string.isRequired,
};

ManageCommentsPage.defaultProps = {
  title: '管理站点',
};
