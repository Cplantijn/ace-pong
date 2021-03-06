import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';

export default class SettingsOverlay extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    const { fetchSettings } = this.props;
    fetchSettings();
  }
  _changeGamePoint(e) {
    const { changeGamePoint } = this.props;
    let num = e.target.value;

    if (!isNaN(num)) {
      if (num < 100) {
        if (!num.length) num = 0;
        changeGamePoint(parseInt(num, 10));
      }
    }
  }
  _changeServeInterval(e) {
    const { changeServeInterval, game } = this.props;
    const gp = game.serveInterval;
    let num = e.target.value;

    if (!isNaN(num)) {
      if (num < gp) {
        if (!num.length) num = 0;
        changeServeInterval(parseInt(num, 10));
      }
    }
  }
  _stepServeInterval(num) {
    const { game, changeServeInterval } = this.props;
    const gp = game.gamePoint;
    const si = game.serveInterval;
    if (((si + num) > 0) && ((si + num) < gp)) {
      changeServeInterval(parseInt(si + num, 10));
    }
  }
  _stepGamePoint(num) {
    const { game, changeGamePoint } = this.props;
    const gp = game.gamePoint;
    if ((num > 0 && gp < 99) || (num < 0 && gp > 1)) {
      changeGamePoint(parseInt(gp + num, 10));
    }
  }
  render() {
    const { game } = this.props;
    return (
      <div className="settings-container">
        <div className="setting-content game-point-container">
          <div className="header">
            <h2>GAME POINT</h2>
          </div>
          <div className="input-content">
            <input
              type="text"
              value={game.gamePoint}
              onChange={this._changeGamePoint.bind(this)}/>
            <div className="increment-decrement">
              <FontAwesome
                name="chevron-up"
                size="4x"
                className="point-indicator"
                onClick={this._stepGamePoint.bind(this, 1)} />
              <FontAwesome
                name="chevron-down"
                size="4x"
                className="point-indicator"
                onClick={this._stepGamePoint.bind(this, -1)} />
            </div>
          </div>
        </div>
        <div className="setting-content serve-interval-container">
          <div className="header">
            <h2>SERVE INTERVAL</h2>
          </div>
          <div className="input-content">
            <input
              type="text"
              value={game.serveInterval}
              onChange={this._changeServeInterval.bind(this)}/>
            <div className="increment-decrement">
              <FontAwesome
                name="chevron-up"
                size="4x"
                className="point-indicator"
                onClick={this._stepServeInterval.bind(this, 1)} />
              <FontAwesome
                name="chevron-down"
                size="4x"
                className="point-indicator"
                onClick={this._stepServeInterval.bind(this, -1)} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SettingsOverlay.propTypes = {
  fetchSettings: React.PropTypes.func,
  changeServeInterval: React.PropTypes.func,
  changeGamePoint: React.PropTypes.func,
  game: React.PropTypes.object
};
