import React, { Component } from 'react';
import classNames from 'classNames';
import Message from './Message';

export default class TopBar extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { userMessage } = this.props;
    const outCls = classNames({
      'top-content-container': true,
      'logo-container': true,
      'msg-shown': userMessage.isShowing,
      'msg-hidden': !userMessage.isShowing && userMessage.message
    });
    return (
      <div className="top-bar pong-section">
          <Message userMessage={userMessage} />
          <div className={outCls}>
            <h1 className="logo-header"><span className="icon-logo"></span></h1>
          </div>
      </div>
    );
  }
}

TopBar.propTypes = {
  userMessage: React.PropTypes.object
};
